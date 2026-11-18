// ============================================================
//  API پنل وب ادمین (احراز هویت با رمز + کوکی امضاشده)
// ============================================================
import {
  getSetting,
  setSetting,
  getAllSettings,
  getProducts,
  getProductById,
  getOrderById,
  updateOrderStatus,
  getTicketById,
  getAdminIds,
  genCode,
  DEFAULTS,
} from './db.js';
import { notifyCustomerOrderStatus, sendDelivery, broadcastToAll } from './notify.js';
import { sendMessage, esc, toFa } from './telegram.js';

const VALID_STATUSES = ['pending', 'unpaid', 'confirmed', 'shipped', 'completed', 'rejected'];
const SETTING_KEYS = [
  'shop_name',
  'welcome_text',
  'guide_text',
  'support_info',
  'card_number',
  'card_owner',
  'msg_order_pending',
  'msg_order_confirmed',
  'msg_order_shipped',
  'msg_order_completed',
  'msg_order_rejected',
  'pay_enabled',
  'pay_merchant_id',
  'ai_enabled',
];

// ---------- رمز و نشست ----------

export async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(pw)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacKey(env) {
  const secret = env.SESSION_SECRET || env.BOT_TOKEN || 'shop-secret-fallback';
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function signValue(env, value) {
  const key = await hmacKey(env);
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function makeSessionCookie(env) {
  const exp = String(Date.now() + 7 * 24 * 3600 * 1000);
  const sig = await signValue(env, exp);
  return exp + '.' + sig;
}

function readCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(new RegExp(name + '=([^;]+)'));
  return m ? m[1] : null;
}

export async function isAuthed(request, env) {
  const raw = readCookie(request, 'admin_session');
  if (!raw) return false;
  const [exp, sig] = raw.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const expect = await signValue(env, exp);
  return expect === sig;
}

async function checkPassword(env, pw) {
  const hash = await getSetting(env.DB, 'admin_password_hash', '');
  if (hash) return (await hashPassword(pw)) === hash;
  if (env.ADMIN_PASSWORD) return String(pw) === String(env.ADMIN_PASSWORD);
  return false;
}

// ---------- پاسخ JSON ----------

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

// ============================================================
//  روتر API
// ============================================================

export async function handleApi(request, env, url) {
  const db = env.DB;
  const path = url.pathname;
  const method = request.method;

  // ---------- ورود / خروج ----------
  if (path === '/api/login' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if (await checkPassword(env, body.password || '')) {
      const cookie = await makeSessionCookie(env);
      return json({ ok: true }, 200, {
        'Set-Cookie': 'admin_session=' + cookie + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + 7 * 24 * 3600,
      });
    }
    return json({ ok: false, error: 'رمز عبور اشتباه است' }, 401);
  }
  if (path === '/api/logout' && method === 'POST') {
    return json({ ok: true }, 200, { 'Set-Cookie': 'admin_session=; Path=/; HttpOnly; Max-Age=0' });
  }

  if (!(await isAuthed(request, env))) return json({ ok: false, error: 'احراز هویت لازم است' }, 401);

  // ---------- بررسی نشست ----------
  if (path === '/api/me' && method === 'GET') return json({ ok: true });

  // ---------- داشبورد ----------
  if (path === '/api/dashboard' && method === 'GET') {
    const orders = await db.prepare('SELECT COUNT(*) c FROM orders').first();
    const pending = await db.prepare("SELECT COUNT(*) c FROM orders WHERE status IN ('pending','unpaid')").first();
    const revenue = await db.prepare("SELECT COALESCE(SUM(final_price),0) s FROM orders WHERE status IN ('confirmed','shipped','completed')").first();
    const products = await db.prepare('SELECT COUNT(*) c FROM products').first();
    const users = await db.prepare('SELECT COUNT(*) c FROM users').first();
    const tickets = await db.prepare("SELECT COUNT(*) c FROM support_tickets WHERE status = 'open'").first();
    const recent = await db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 5').all();
    return json({
      ok: true,
      stats: { orders: orders.c, pending: pending.c, revenue: revenue.s, products: products.c, users: users.c, tickets: tickets.c },
      recent: recent.results,
    });
  }

  // ---------- محصولات ----------
  if (path === '/api/products' && method === 'GET') {
    return json({ ok: true, products: await getProducts(db, false) });
  }
  if (path === '/api/products' && method === 'POST') {
    const b = await request.json().catch(() => ({}));
    if (!b.name || !(Number(b.price) > 0)) return json({ ok: false, error: 'نام و قیمت معتبر لازم است' }, 400);
    await db
      .prepare('INSERT INTO products(name, description, price, photo_file_id, type, delivery_text, delivery_link, active) VALUES(?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(b.name, b.description || '', Number(b.price), b.photo_file_id || '', b.type || 'digital', b.delivery_text || '', b.delivery_link || '', b.active === false ? 0 : 1)
      .run();
    return json({ ok: true });
  }
  if (path.startsWith('/api/products/') && method === 'PUT') {
    const id = Number(path.split('/')[3]);
    const b = await request.json().catch(() => ({}));
    const p = await getProductById(db, id);
    if (!p) return json({ ok: false, error: 'محصول یافت نشد' }, 404);
    await db
      .prepare('UPDATE products SET name=?, description=?, price=?, photo_file_id=?, type=?, delivery_text=?, delivery_link=?, active=? WHERE id=?')
      .bind(
        b.name ?? p.name,
        b.description ?? p.description,
        Number(b.price ?? p.price),
        b.photo_file_id ?? p.photo_file_id,
        b.type ?? p.type,
        b.delivery_text ?? p.delivery_text,
        b.delivery_link ?? p.delivery_link,
        b.active === undefined ? p.active : b.active ? 1 : 0,
        id
      )
      .run();
    return json({ ok: true });
  }
  if (path.startsWith('/api/products/') && method === 'DELETE') {
    const id = Number(path.split('/')[3]);
    await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    return json({ ok: true });
  }

  // ---------- آپلود عکس محصول (از طریق تلگرام) ----------
  if (path === '/api/upload-photo' && method === 'POST') {
    const form = await request.formData().catch(() => null);
    const file = form ? form.get('file') : null;
    if (!file) return json({ ok: false, error: 'فایلی ارسال نشد' }, 400);
    const ids = await getAdminIds(db, env);
    if (!ids.length) return json({ ok: false, error: 'ابتدا در ربات تلگرام ادمین شوید (/claim)' }, 400);
    const fd = new FormData();
    fd.append('chat_id', String(ids[0]));
    fd.append('photo', file);
    const res = await fetch('https://api.telegram.org/bot' + env.BOT_TOKEN + '/sendPhoto', { method: 'POST', body: fd });
    const data = await res.json().catch(() => null);
    if (data && data.ok) {
      const photos = data.result.photo;
      return json({ ok: true, file_id: photos[photos.length - 1].file_id });
    }
    return json({ ok: false, error: 'آپلود عکس ناموفق بود' }, 500);
  }

  // ---------- سفارش‌ها ----------
  if (path === '/api/orders' && method === 'GET') {
    const status = url.searchParams.get('status') || 'all';
    let sql = 'SELECT * FROM orders ORDER BY id DESC LIMIT 200';
    if (status !== 'all' && VALID_STATUSES.includes(status)) sql = 'SELECT * FROM orders WHERE status = ? ORDER BY id DESC LIMIT 200';
    const res = status !== 'all' && VALID_STATUSES.includes(status) ? await db.prepare(sql).bind(status).all() : await db.prepare(sql).all();
    return json({ ok: true, orders: res.results });
  }
  if (path.startsWith('/api/orders/') && method === 'PUT') {
    const id = Number(path.split('/')[3]);
    const b = await request.json().catch(() => ({}));
    const order = await getOrderById(db, id);
    if (!order) return json({ ok: false, error: 'سفارش یافت نشد' }, 404);
    if (!VALID_STATUSES.includes(b.status)) return json({ ok: false, error: 'وضعیت نامعتبر' }, 400);
    await updateOrderStatus(db, id, b.status, b.admin_note ?? null);
    order.status = b.status;
    if (b.status === 'shipped' && order.product_id) {
      const product = await getProductById(db, order.product_id);
      if (product) await sendDelivery(env, db, order, product);
    }
    await notifyCustomerOrderStatus(env, db, order);
    return json({ ok: true });
  }

  // ---------- کدهای تخفیف ----------
  if (path === '/api/discounts' && method === 'GET') {
    const { results } = await db.prepare('SELECT * FROM discount_codes ORDER BY id DESC').all();
    return json({ ok: true, discounts: results });
  }
  if (path === '/api/discounts' && method === 'POST') {
    const b = await request.json().catch(() => ({}));
    const code = String(b.code || '').trim().toUpperCase();
    if (!code || !(Number(b.value) > 0)) return json({ ok: false, error: 'کد و مقدار معتبر لازم است' }, 400);
    if (b.type === 'percent' && Number(b.value) > 100) return json({ ok: false, error: 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد' }, 400);
    try {
      await db
        .prepare('INSERT INTO discount_codes(code, type, value, max_uses, active, expires_at) VALUES(?, ?, ?, ?, ?, ?)')
        .bind(code, b.type === 'fixed' ? 'fixed' : 'percent', Number(b.value), Number(b.max_uses || 0), b.active === false ? 0 : 1, b.expires_at || '')
        .run();
    } catch (e) {
      return json({ ok: false, error: 'این کد قبلاً ثبت شده است' }, 400);
    }
    return json({ ok: true });
  }
  if (path.startsWith('/api/discounts/') && method === 'PUT') {
    const id = Number(path.split('/')[3]);
    const b = await request.json().catch(() => ({}));
    const row = await db.prepare('SELECT * FROM discount_codes WHERE id = ?').bind(id).first();
    if (!row) return json({ ok: false, error: 'کد یافت نشد' }, 404);
    await db
      .prepare('UPDATE discount_codes SET code=?, type=?, value=?, max_uses=?, active=?, expires_at=? WHERE id=?')
      .bind(
        String(b.code ?? row.code).trim().toUpperCase(),
        b.type ?? row.type,
        Number(b.value ?? row.value),
        Number(b.max_uses ?? row.max_uses),
        b.active === undefined ? row.active : b.active ? 1 : 0,
        b.expires_at ?? row.expires_at,
        id
      )
      .run();
    return json({ ok: true });
  }
  if (path.startsWith('/api/discounts/') && method === 'DELETE') {
    const id = Number(path.split('/')[3]);
    await db.prepare('DELETE FROM discount_codes WHERE id = ?').bind(id).run();
    return json({ ok: true });
  }

  // ---------- تیکت‌های پشتیبانی ----------
  if (path === '/api/tickets' && method === 'GET') {
    const status = url.searchParams.get('status') || 'open';
    const res =
      status === 'all'
        ? await db.prepare('SELECT * FROM support_tickets ORDER BY id DESC LIMIT 200').all()
        : await db.prepare('SELECT * FROM support_tickets WHERE status = ? ORDER BY id DESC LIMIT 200').bind(status).all();
    return json({ ok: true, tickets: res.results });
  }
  if (path.startsWith('/api/tickets/') && method === 'PUT') {
    const id = Number(path.split('/')[3]);
    const b = await request.json().catch(() => ({}));
    const t = await getTicketById(db, id);
    if (!t) return json({ ok: false, error: 'تیکت یافت نشد' }, 404);
    if (b.admin_reply) {
      await db.prepare("UPDATE support_tickets SET status = 'answered', admin_reply = ? WHERE id = ?").bind(b.admin_reply, id).run();
      await sendMessage(env, t.user_id, '🎧 <b>پاسخ پشتیبانی</b> به تیکت #' + toFa(id) + ':\n\n' + esc(b.admin_reply));
    } else if (b.status) {
      await db.prepare('UPDATE support_tickets SET status = ? WHERE id = ?').bind(b.status, id).run();
    }
    return json({ ok: true });
  }

  // ---------- گزارش‌ها ----------
  if (path === '/api/reports' && method === 'GET') {
    const byStatus = await db.prepare('SELECT status, COUNT(*) c, COALESCE(SUM(final_price),0) s FROM orders GROUP BY status').all();
    const top = await db
      .prepare("SELECT product_name, COUNT(*) c, COALESCE(SUM(final_price),0) s FROM orders WHERE status IN ('confirmed','shipped','completed') GROUP BY product_name ORDER BY c DESC LIMIT 10")
      .all();
    const days = await db.prepare("SELECT date(created_at) d, COUNT(*) c FROM orders WHERE created_at >= datetime('now','-7 days') GROUP BY date(created_at) ORDER BY d").all();
    const revenue = await db.prepare("SELECT COALESCE(SUM(final_price),0) s FROM orders WHERE status IN ('confirmed','shipped','completed')").first();
    const total = await db.prepare('SELECT COUNT(*) c FROM orders').first();
    return json({ ok: true, byStatus: byStatus.results, top: top.results, days: days.results, revenue: revenue.s, totalOrders: total.c });
  }

  // ---------- تنظیمات ----------
  if (path === '/api/settings' && method === 'GET') {
    const s = await getAllSettings(db);
    delete s.admin_password_hash;
    return json({ ok: true, settings: s });
  }
  if (path === '/api/settings' && method === 'PUT') {
    const b = await request.json().catch(() => ({}));
    for (const k of SETTING_KEYS) {
      if (b[k] !== undefined) await setSetting(db, k, b[k]);
    }
    if (b.new_password) {
      await setSetting(db, 'admin_password_hash', await hashPassword(b.new_password));
    }
    if (b.regen_claim) {
      await setSetting(db, 'claim_code', genCode(8));
    }
    return json({ ok: true });
  }

  // ---------- پیام جمعی ----------
  if (path === '/api/broadcast' && method === 'POST') {
    const b = await request.json().catch(() => ({}));
    if (!b.message) return json({ ok: false, error: 'متن پیام خالی است' }, 400);
    const sent = await broadcastToAll(env, db, b.message);
    return json({ ok: true, sent });
  }

  // ---------- پشتیبان‌گیری ----------
  if (path === '/api/backup' && method === 'GET') {
    const tables = ['products', 'orders', 'discount_codes', 'support_tickets', 'users', 'settings', 'admin_users'];
    const out = { exported_at: new Date().toISOString() };
    for (const t of tables) {
      const { results } = await db.prepare('SELECT * FROM ' + t).all();
      out[t] = results;
    }
    return new Response(JSON.stringify(out, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="shop-backup.json"' },
    });
  }
  if (path === '/api/restore' && method === 'POST') {
    const b = await request.json().catch(() => null);
    const data = b && b.data;
    if (!data || typeof data !== 'object') return json({ ok: false, error: 'داده نامعتبر است' }, 400);
    const tables = ['products', 'orders', 'discount_codes', 'support_tickets', 'users', 'settings', 'admin_users'];
    const stmts = [];
    for (const t of tables) {
      stmts.push(db.prepare('DELETE FROM ' + t));
      const rows = Array.isArray(data[t]) ? data[t] : [];
      for (const row of rows) {
        const cols = Object.keys(row);
        if (!cols.length) continue;
        const placeholders = cols.map(() => '?').join(',');
        stmts.push(db.prepare('INSERT INTO ' + t + ' (' + cols.join(',') + ') VALUES(' + placeholders + ')').bind(...cols.map((c) => row[c])));
      }
    }
    await db.batch(stmts);
    return json({ ok: true });
  }

  return json({ ok: false, error: 'مسیر یافت نشد' }, 404);
}
