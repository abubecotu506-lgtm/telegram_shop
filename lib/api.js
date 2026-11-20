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
  removeAdmin,
  getOwnerId,
  genCode,
  DEFAULTS,
  getGameCatalog,
  setGameCatalog,
  getProductCatalogMeta,
  setProductCatalogMeta,
  getOtherDollarDeals,
  setOtherDollarDeals,
  invalidateSettingCache,
} from './db.js';
import { getCachedDollarRate, refreshDollarRate } from './rates.js';
import { notifyCustomerOrderStatus, sendDelivery, broadcastToAll } from './notify.js';
import { sendMessage, esc, toFa } from './telegram.js';

const VALID_STATUSES = ['pending', 'unpaid', 'confirmed', 'shipped', 'completed', 'rejected'];

function validGameId(value) {
  return /^[a-z0-9][a-z0-9_-]{0,39}$/.test(String(value || ''));
}

function enrichCatalogProducts(products, meta) {
  return products.map((product) => {
    const item = meta[String(product.id)] || meta[product.id] || {};
    return {
      ...product,
      cost: item.cost ?? '',
      game_id: String(item.game_id || ''),
      sale_label: item.sale_label === undefined ? '$1' : String(item.sale_label),
    };
  });
}

async function ensureSampleCatalogProduct(db) {
  const sampleName = 'PUBG Mobile — 60 UC';
  let id = Number(await getSetting(db, 'catalog_sample_product_id', '0')) || 0;
  let product = id ? await getProductById(db, id) : null;
  if (!product) product = await db.prepare('SELECT id FROM products WHERE name = ? ORDER BY id ASC LIMIT 1').bind(sampleName).first();
  if (!product) {
    const result = await db.prepare(
      "INSERT INTO products(name, description, price, photo_file_id, type, delivery_text, delivery_link, active, sort_order) VALUES(?, '', 0, '', 'digital', '', '', 0, 0)"
    ).bind(sampleName).run();
    id = Number(result && result.meta && result.meta.last_row_id) || 0;
    if (!id) {
      const created = await db.prepare('SELECT id FROM products WHERE name = ? ORDER BY id DESC LIMIT 1').bind(sampleName).first();
      id = Number(created && created.id) || 0;
    }
  } else {
    id = Number(product.id) || 0;
  }
  if (!id) return;
  await setSetting(db, 'catalog_sample_product_id', String(id));
  const meta = await getProductCatalogMeta(db);
  if (!meta[String(id)]) {
    meta[String(id)] = { game_id: 'pubg', sale_label: '$1' };
    await setProductCatalogMeta(db, meta);
  } else if (Object.prototype.hasOwnProperty.call(meta[String(id)], 'pricing_mode')) {
    const { pricing_mode, usd_amount, ...cleanMeta } = meta[String(id)];
    meta[String(id)] = cleanMeta;
    await setProductCatalogMeta(db, meta);
  }
}

const SETTING_KEYS = [
  'shop_name',
  'welcome_text',
  'trust_text', 'trust_links',
  'guide_text',
  'support_info', 'support_username',
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
  'force_join_enabled',
  'force_join_channels',
  'force_join_channel',
  'force_join_link',
  'phone_required',
  'miniapp_texts',
];
const RESTORE_COLUMNS = {
  referrals: ['user_id','inviter'], ref_clicks: ['update_id','inviter'],
  products: ['id', 'name', 'description', 'price', 'photo_file_id', 'type', 'delivery_text', 'delivery_link', 'active', 'sort_order', 'created_at'],
  orders: ['id', 'order_code', 'user_id', 'username', 'product_id', 'product_name', 'quantity', 'price', 'discount_code', 'discount_amount', 'final_price', 'status', 'payment_method', 'receipt_file_id', 'receipt_type', 'authority', 'ref_id', 'account_details','commission','inviter','delivery_sent', 'admin_note', 'created_at', 'updated_at'],
  discount_codes: ['id', 'code', 'type', 'value', 'max_uses', 'used_count', 'active', 'expires_at', 'created_at'],
  support_tickets: ['id', 'user_id', 'username', 'message', 'status', 'admin_reply', 'created_at'],
  users: ['user_id', 'username', 'first_name', 'last_seen', 'is_blocked'],
  settings: ['key', 'value'],
  admin_users: ['user_id', 'added_at'],
};

// ---------- رمز و نشست ----------

export async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(pw)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacKey(env) {
  const secret = env.SESSION_SECRET || env.BOT_TOKEN;
  if (!secret) throw new Error('SESSION_SECRET یا BOT_TOKEN تنظیم نشده است.');
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function signValue(env, value) {
  const key = await hmacKey(env);
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function makeSessionCookie(env, identity = 'owner') {
  const exp = String(Date.now() + 7 * 24 * 3600 * 1000);
  const payload = identity + '.' + exp;
  const sig = await signValue(env, payload);
  return payload + '.' + sig;
}

function readCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const prefix = name + '=';
  const part = cookie.split(';').map((value) => value.trim()).find((value) => value.startsWith(prefix));
  return part ? part.slice(prefix.length) || null : null;
}

async function getSessionIdentity(request, env) {
  const raw = readCookie(request, 'admin_session');
  if (!raw) return null;
  const parts = raw.split('.');
  let identity = 'owner';
  let exp;
  let payload;
  let sig;
  // پذیرش نشست قدیمی مالک تا زمان پایان اعتبار آن
  if (parts.length === 2) {
    exp = parts[0];
    payload = exp;
    sig = parts[1];
  } else if (parts.length === 3) {
    identity = parts[0];
    exp = parts[1];
    payload = identity + '.' + exp;
    sig = parts[2];
  } else return null;
  const expiresAt = Number(exp);
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Date.now() || !sig) return null;
  let expect;
  try { expect = await signValue(env, payload); } catch (e) { return null; }
  if (expect !== sig) return null;
  if (identity === 'owner') return 'owner';
  const match = identity.match(/^admin-(\d+)$/);
  if (!match || !Number.isSafeInteger(Number(match[1]))) return null;
  try {
    const row = await env.DB.prepare(
      'SELECT p.user_id FROM panel_admins p INNER JOIN admin_users a ON a.user_id = p.user_id WHERE p.user_id = ?'
    ).bind(Number(match[1])).first();
    return row ? identity : null;
  } catch (e) {
    return null;
  }
}

export async function isAuthed(request, env) {
  return (await getSessionIdentity(request, env)) !== null;
}

async function checkPassword(env, pw) {
  const password = String(pw || '');
  const candidateHash = await hashPassword(password);
  const hash = await getSetting(env.DB, 'admin_password_hash', '');
  if (hash && candidateHash === hash) return 'owner';
  if (!hash && env.ADMIN_PASSWORD && password === String(env.ADMIN_PASSWORD)) return 'owner';
  try {
    const { results } = await env.DB.prepare('SELECT user_id, password_hash FROM panel_admins').all();
    for (const admin of results || []) {
      if (candidateHash === admin.password_hash) return 'admin-' + admin.user_id;
    }
  } catch (e) {}
  return null;
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
    if (!env.SESSION_SECRET && !env.BOT_TOKEN) {
      return json({ ok: false, error: 'برای نشست امن، رمز SESSION_SECRET را در تنظیمات محرمانهٔ Cloudflare ثبت کن.' }, 503);
    }
    const body = await request.json().catch(() => ({}));
    const identity = await checkPassword(env, body.password || '');
    if (identity) {
      const cookie = await makeSessionCookie(env, identity);
      return json({ ok: true }, 200, {
        'Set-Cookie': 'admin_session=' + cookie + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + 7 * 24 * 3600,
      });
    }
    return json({ ok: false, error: 'رمز عبور اشتباه است' }, 401);
  }
  if (path === '/api/logout' && method === 'POST') {
    return json({ ok: true }, 200, { 'Set-Cookie': 'admin_session=; Path=/; HttpOnly; Max-Age=0' });
  }

  const identity = await getSessionIdentity(request, env);
  if (!identity) return json({ ok: false, error: 'احراز هویت لازم است' }, 401);
  const isOwner = identity === 'owner';
  if ((path === '/api/admins' || path.startsWith('/api/admins/')) && !isOwner) {
    return json({ ok: false, error: 'فقط مدیر اصلی می‌تواند دسترسی مدیران را تغییر دهد.' }, 403);
  }
  if ((path === '/api/backup' && method === 'GET' || path === '/api/restore' && method === 'POST') && !isOwner) {
    return json({ ok: false, error: 'پشتیبان‌گیری و بازیابی فقط در دسترس مدیر اصلی است.' }, 403);
  }

  // ---------- بررسی نشست ----------
  if (path === '/api/me' && method === 'GET') return json({ ok: true, is_owner: isOwner });

  // ---------- مدیران با دسترسی کامل به ربات و پنل ----------
  if (path === '/api/admins' && method === 'GET') {
    const ownerId = await getOwnerId(db);
    const { results } = await db.prepare(
      'SELECT a.user_id, a.added_at, u.username, u.first_name, CASE WHEN p.user_id IS NULL THEN 0 ELSE 1 END AS panel_access ' +
      'FROM admin_users a LEFT JOIN users u ON u.user_id = a.user_id LEFT JOIN panel_admins p ON p.user_id = a.user_id ' +
      'ORDER BY a.added_at ASC, a.user_id ASC'
    ).all();
    return json({ ok: true, owner_id: ownerId, admins: results.map((r) => {
      const isOwner = Number(r.user_id) === Number(ownerId);
      return { ...r, is_owner: isOwner, panel_access: !!r.panel_access };
    }) });
  }
  if (path === '/api/admins' && method === 'POST') {
    const b = await request.json().catch(() => ({}));
    const userId = Number(b.user_id);
    const password = String(b.password || '');
    if (!Number.isSafeInteger(userId) || userId <= 0) return json({ ok: false, error: 'شناسهٔ تلگرام باید یک عدد معتبر باشد.' }, 400);
    if (password.length < 10) return json({ ok: false, error: 'رمز پنل مدیر جدید باید دست‌کم ۱۰ نویسه باشد.' }, 400);
    const ownerId = await getOwnerId(db);
    const passwordHash = await hashPassword(password);
    try {
      const ownerHash = await getSetting(db, 'admin_password_hash', '');
      const matchesOwnerPassword = ownerHash
        ? passwordHash === ownerHash
        : !!env.ADMIN_PASSWORD && password === String(env.ADMIN_PASSWORD);
      if (matchesOwnerPassword) return json({ ok: false, error: 'رمز مدیر جدید باید با رمز مدیر اصلی متفاوت باشد.' }, 400);
      const existing = await db.prepare('SELECT user_id FROM panel_admins WHERE password_hash = ? AND user_id != ?').bind(passwordHash, userId).first();
      if (existing) return json({ ok: false, error: 'برای هر مدیر یک رمز جداگانه انتخاب کن.' }, 400);
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO admin_users(user_id) VALUES(?)').bind(userId),
        db.prepare(
          'INSERT INTO panel_admins(user_id, password_hash, created_by) VALUES(?, ?, ?) ' +
          'ON CONFLICT(user_id) DO UPDATE SET password_hash = excluded.password_hash, created_by = excluded.created_by'
        ).bind(userId, passwordHash, Number(ownerId || 0)),
      ]);
      return json({ ok: true });
    } catch (e) {
      return json({ ok: false, error: 'جدول مدیران پنل آماده نیست؛ ابتدا ساختار تازهٔ دیتابیس را اجرا کن.' }, 500);
    }
  }
  if (path.startsWith('/api/admins/') && method === 'DELETE') {
    const userId = Number(path.split('/')[3]);
    if (!Number.isSafeInteger(userId) || userId <= 0) return json({ ok: false, error: 'شناسهٔ مدیر نامعتبر است.' }, 400);
    const ownerId = await getOwnerId(db);
    await removeAdmin(db, userId);
    return json({ ok: true });
  }

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

  // ---------- دسته‌بندی بازی‌ها و برچسب فروش ----------
  if (path === '/api/catalog' && method === 'GET') {

    const [games, products, meta, otherDollarDeals, exchangeRate] = await Promise.all([
      getGameCatalog(db), getProducts(db, false), getProductCatalogMeta(db), getOtherDollarDeals(db), getCachedDollarRate(db),
    ]);
    return json({
      ok: true,
      games,
      products: enrichCatalogProducts(products, meta),
      other_dollar_deals: otherDollarDeals,
      exchange_rate: exchangeRate,
    });
  }
  if (path === '/api/exchange-rate/refresh' && method === 'POST') {
    const result = await refreshDollarRate(env, db);
    if (!result.ok) {
      return json({ ok: false, error: result.error || 'به‌روزرسانی نرخ ناموفق بود.', exchange_rate: await getCachedDollarRate(db) }, 502);
    }
    return json({ ok: true, exchange_rate: result.rate, cached: !!result.cached });
  }
  if (path === '/api/catalog/games' && method === 'PUT') {
    const b = await request.json().catch(() => ({}));
    if (!Array.isArray(b.games)) return json({ ok: false, error: 'فهرست بازی‌ها معتبر نیست.' }, 400);
    const games = [];
    const ids = new Set();
    for (const game of b.games) {
      const id = String(game && game.id || '').trim();
      const name = String(game && game.name || '').trim();
      const emoji = String(game && game.emoji || '🎮').trim();
      if (!validGameId(id) || !name || name.length > 80 || emoji.length > 12) {
        return json({ ok: false, error: 'شناسه، نام یا ایموجی یکی از بازی‌ها معتبر نیست.' }, 400);
      }
      if (ids.has(id)) return json({ ok: false, error: 'شناسهٔ بازی تکراری است.' }, 400);
      ids.add(id);
      games.push({ id, name, emoji: emoji || '🎮', active: game.active !== false });
    }
    const meta = await getProductCatalogMeta(db);
    const products = await getProducts(db, false);
    for (const product of products) {
      const gameId = String((meta[String(product.id)] || {}).game_id || '');
      if (gameId && gameId !== 'unassigned' && !ids.has(gameId)) {
        return json({ ok: false, error: 'ابتدا بازی محصولاتِ وابسته به این دسته را از بخش محصولات تغییر دهید؛ سپس دسته را حذف کنید.' }, 409);
      }
    }
    await setGameCatalog(db, games);
    return json({ ok: true, games });
  }
  if (path === '/api/catalog/other-deals' && method === 'PUT') {
    const b = await request.json().catch(() => ({}));
    const intro = String(b.intro || '').trim();
    if (intro.length > 2000 || !Array.isArray(b.offers) || b.offers.length > 100) {
      return json({ ok: false, error: 'متن یا فهرست پیشنهادها معتبر نیست.' }, 400);
    }
    const offers = [];
    for (const offer of b.offers) {
      const title = String(offer && offer.title || '').trim();
      const description = String(offer && offer.description || '').trim();
      const saleLabel = String(offer && offer.sale_label || '$1').trim();
      const link = String(offer && offer.url || '').trim();
      if (!title || title.length > 100 || description.length > 500 || saleLabel.length > 40) {
        return json({ ok: false, error: 'عنوان، توضیح یا برچسب یکی از پیشنهادها معتبر نیست.' }, 400);
      }
      if (link) {
        let parsed;
        try { parsed = new URL(link); } catch (e) { return json({ ok: false, error: 'پیوند هر پیشنهاد باید یک نشانی HTTPS معتبر باشد.' }, 400); }
        if (parsed.protocol !== 'https:') return json({ ok: false, error: 'پیوند هر پیشنهاد باید با https:// آغاز شود.' }, 400);
      }
      offers.push({ title, description, sale_label: saleLabel, url: link });
    }
    const deals = { intro, offers };
    await setOtherDollarDeals(db, deals);
    return json({ ok: true, other_dollar_deals: deals });
  }

  // ---------- محصولات ----------
  if (path === '/api/products' && method === 'GET') {
    const products = await getProducts(db, false);
    return json({ ok: true, products: enrichCatalogProducts(products, await getProductCatalogMeta(db)) });
  }
  if (path === '/api/products' && method === 'POST') {
    const b = await request.json().catch(() => ({}));
    const name = String(b.name || '').trim();
    const price = Number(b.price);
    if (!name || name.length > 200 || !Number.isSafeInteger(price) || price <= 0) return json({ ok: false, error: 'نام و قیمت معتبر لازم است' }, 400);
    const games = await getGameCatalog(db);
    const gameId = b.game_id === undefined ? '' : String(b.game_id || '');
    if (gameId && !games.some((game) => game.id === gameId)) return json({ ok: false, error: 'بازی انتخاب‌شده پیدا نشد.' }, 400);
    const saleLabel = String(b.sale_label === undefined ? '$1' : b.sale_label || '').trim();
    if (b.cost != null && b.cost !== '' && (!Number.isSafeInteger(Number(b.cost)) || Number(b.cost)<0)) return json({ok:false,error:'بهای تمام‌شده نامعتبر است'},400);
    if (saleLabel.length > 40) return json({ ok: false, error: 'برچسب فروش بیش از حد طولانی است.' }, 400);
    const result = await db
      .prepare('INSERT INTO products(name, description, price, photo_file_id, type, delivery_text, delivery_link, active) VALUES(?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(name, b.description || '', price, b.photo_file_id || '', b.type || 'digital', b.delivery_text || '', b.delivery_link || '', b.active === false ? 0 : 1)
      .run();
    let id = Number(result && result.meta && result.meta.last_row_id) || 0;
    if (!id) {
      const created = await db.prepare('SELECT id FROM products WHERE name = ? ORDER BY id DESC LIMIT 1').bind(name).first();
      id = Number(created && created.id) || 0;
    }
    if (id) {
      const meta = await getProductCatalogMeta(db);
      meta[String(id)] = { game_id: gameId, sale_label: saleLabel, cost: b.cost ?? '' };
      await setProductCatalogMeta(db, meta);
    }
    return json({ ok: true, id });
  }
  if (path.startsWith('/api/products/') && method === 'PUT') {
    const id = Number(path.split('/')[3]);
    const b = await request.json().catch(() => ({}));
    const p = await getProductById(db, id);
    if (!p) return json({ ok: false, error: 'محصول یافت نشد' }, 404);
    const nextPrice = Number(b.price ?? p.price);
    const nextActive = b.active === undefined ? !!p.active : !!b.active;
    if (!Number.isSafeInteger(nextPrice) || nextPrice < 0 || (nextActive && nextPrice <= 0)) {
      return json({ ok: false, error: 'برای فعال‌کردن محصول، مبلغ تومان باید عددی بزرگ‌تر از صفر باشد.' }, 400);
    }
    const meta = await getProductCatalogMeta(db);
    const currentMeta = meta[String(id)] || {};
    let gameId = b.game_id === undefined ? String(currentMeta.game_id || '') : String(b.game_id || '');
    const games = await getGameCatalog(db);
    if (gameId && !games.some((game) => game.id === gameId)) return json({ ok: false, error: 'بازی انتخاب‌شده پیدا نشد.' }, 400);
    const saleLabel = String(b.sale_label === undefined ? (currentMeta.sale_label === undefined ? '$1' : currentMeta.sale_label) : b.sale_label || '').trim();
    if (b.cost != null && b.cost !== '' && (!Number.isSafeInteger(Number(b.cost)) || Number(b.cost)<0)) return json({ok:false,error:'بهای تمام‌شده نامعتبر است'},400);
    if (saleLabel.length > 40) return json({ ok: false, error: 'برچسب فروش بیش از حد طولانی است.' }, 400);
    await db
      .prepare('UPDATE products SET name=?, description=?, price=?, photo_file_id=?, type=?, delivery_text=?, delivery_link=?, active=? WHERE id=?')
      .bind(
        b.name ?? p.name,
        b.description ?? p.description,
        nextPrice,
        b.photo_file_id ?? p.photo_file_id,
        b.type ?? p.type,
        b.delivery_text ?? p.delivery_text,
        b.delivery_link ?? p.delivery_link,
        nextActive ? 1 : 0,
        id
      )
      .run();
    meta[String(id)] = { game_id: gameId, sale_label: saleLabel, cost: b.cost ?? '' };
    await setProductCatalogMeta(db, meta);
    return json({ ok: true });
  }
  if (path.startsWith('/api/products/') && method === 'DELETE') {
    const id = Number(path.split('/')[3]);
    await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
    const meta = await getProductCatalogMeta(db);
    delete meta[String(id)];
    await setProductCatalogMeta(db, meta);
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
    const changed=await db.prepare("UPDATE orders SET status=?,admin_note=COALESCE(?,admin_note),updated_at=datetime('now') WHERE id=? AND status=?").bind(b.status,b.admin_note ?? null,id,order.status).run();
    if(!changed.meta.changes)return json({ok:false,error:'وضعیت سفارش تغییر کرده است؛ دوباره باز کنید.'},409);
    if(order.status===b.status)return json({ok:true});
    order.status = b.status;
    if (b.status === 'shipped' && order.product_id) {
      const product = await getProductById(db, order.product_id);
      if (product) await sendDelivery(env, db, order, product);
    }
    const notice=await notifyCustomerOrderStatus(env, db, order);
    if(order.status==='confirmed' && !notice?.ok)return json({ok:false,error:'سفارش تأیید شد ولی پیام مشتری ارسال نشد؛ دستی پیگیری کنید.'},502);
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
    if (!isOwner) {
      delete s.claim_code;
      delete s.owner_user_id;
    }
    return json({ ok: true, settings: s });
  }
  if (path === '/api/settings' && method === 'PUT') {
    const b = await request.json().catch(() => ({}));
    if (!isOwner && (b.new_password || b.regen_claim)) {
      return json({ ok: false, error: 'تغییر رمز اصلی و کد مدیریت فقط در دسترس مدیر اصلی است.' }, 403);
    }
    if ('support_username' in b) {
      b.support_username = String(b.support_username || '').trim().replace(/^@/, '');
      if (b.support_username && !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(b.support_username)) return json({ok:false,error:'نام کاربری تلگرام پشتیبانی معتبر نیست.'},400);
    }
    if (b.new_password && String(b.new_password).length < 10) {
      return json({ ok: false, error: 'رمز تازه باید دست‌کم ۱۰ نویسه باشد.' }, 400);
    }
    const joinEnabled = String(b.force_join_enabled ?? await getSetting(db, 'force_join_enabled', '0')) === '1';
    const phoneRequired = String(b.phone_required ?? await getSetting(db, 'phone_required', '0')) === '1';
    if (phoneRequired && !joinEnabled) {
      return json({ ok: false, error: 'برای درخواست تأیید شماره، ابتدا عضویت اجباری کانال یا گروه را فعال کن.' }, 400);
    }

    const hasChannelInput = b.force_join_channels !== undefined || b.force_join_channel !== undefined || b.force_join_link !== undefined;
    let channelSource = b.force_join_channels;
    if (channelSource === undefined) channelSource = await getSetting(db, 'force_join_channels', '[]');
    let channelItems = [];
    try {
      channelItems = Array.isArray(channelSource) ? channelSource : JSON.parse(String(channelSource || '[]'));
      if (!Array.isArray(channelItems)) throw new Error('array required');
    } catch (e) {
      return json({ ok: false, error: 'فهرست کانال‌ها و گروه‌ها معتبر نیست؛ دوباره فهرست جوین را ذخیره کنید.' }, 400);
    }
    if (!hasChannelInput && !channelItems.length) {
      const oldChannel = String(await getSetting(db, 'force_join_channel', '') || '').trim();
      const oldLink = String(await getSetting(db, 'force_join_link', '') || '').trim();
      if (oldChannel) channelItems = [{ channel: oldChannel, link: oldLink }];
    }
    if (hasChannelInput && b.force_join_channels === undefined) {
      const oldChannel = String(b.force_join_channel || '').trim();
      const oldLink = String(b.force_join_link || '').trim();
      channelItems = oldChannel ? [{ channel: oldChannel, link: oldLink }] : [];
    }
    const channelMap = new Map();
    for (const item of channelItems) {
      const channel = String(item && (item.channel || item.id) || '').trim();
      let link = String(item && (item.link || item.url) || '').trim();
      if (!channel && !link) continue;
      if (!/^@[A-Za-z0-9_]{5,32}$/.test(channel) && !/^-\d{5,20}$/.test(channel)) {
        return json({ ok: false, error: 'شناسهٔ هر کانال یا گروه باید مانند @username، -1001234567890 یا -12345678 باشد.' }, 400);
      }
      if (!link && channel.startsWith('@')) link = 'https://t.me/' + channel.slice(1);
      if (!link && !channel.startsWith('@')) {
        return json({ ok: false, error: 'برای هر کانال یا گروه خصوصی، پیوند دعوت https:// را هم وارد کنید.' }, 400);
      }
      if (link && !/^https:\/\//i.test(link)) return json({ ok: false, error: 'پیوند عضویت هر کانال یا گروه باید با https:// آغاز شود.' }, 400);
      if (!channelMap.has(channel)) channelMap.set(channel, { channel, link });
    }
    const joinChannels = Array.from(channelMap.values());
    if (joinEnabled && !joinChannels.length) {
      return json({ ok: false, error: 'برای فعال‌کردن عضویت اجباری، دست‌کم یک کانال یا گروه وارد کنید.' }, 400);
    }

    const normalizedBody = { ...b };
    if (hasChannelInput) {
      normalizedBody.force_join_channels = JSON.stringify(joinChannels);
      normalizedBody.force_join_channel = joinChannels.length ? joinChannels[0].channel : '';
      normalizedBody.force_join_link = joinChannels.length ? joinChannels[0].link : '';
    }
    if (b.miniapp_texts !== undefined) {
      let textMap;
      try {
        textMap = typeof b.miniapp_texts === 'string' ? JSON.parse(b.miniapp_texts || '{}') : b.miniapp_texts;
      } catch (e) {
        return json({ ok: false, error: 'متن‌های مینی‌اپ معتبر نیستند.' }, 400);
      }
      if (!textMap || typeof textMap !== 'object' || Array.isArray(textMap)) return json({ ok: false, error: 'ساختار متن‌های مینی‌اپ معتبر نیست.' }, 400);
      const allowedTextKeys = new Set(['tagline','kicker','headline','heroText','heroBadge','search','catalog','catalogSub','gamesTitle','gameCount','backToGames','otherProducts','productCount','details','price','item','emptyTitle','emptyText','noResults','buy','close','themes','themeDark','themeBlack','themeRed','themeWhite','gateTitle','gateText','footer','unavailable','botMissing','loadError','loading','noImage','productLabel','botStart','joinTitle','joinText','joinButton','checkJoin','phoneRequired','openBot','languageButton','switchLanguage']);
      const cleanTexts = {};
      for (const language of ['fa', 'en']) {
        cleanTexts[language] = {};
        const values = textMap[language] && typeof textMap[language] === 'object' ? textMap[language] : {};
        for (const key of allowedTextKeys) {
          if (typeof values[key] === 'string') cleanTexts[language][key] = values[key].slice(0, 220);
        }
      }
      normalizedBody.miniapp_texts = JSON.stringify(cleanTexts);
    }
    for (const k of SETTING_KEYS) {
      if (normalizedBody[k] !== undefined) await setSetting(db, k, normalizedBody[k]);
    }
    if (b.new_password) {
      const passwordHash = await hashPassword(b.new_password);
      const duplicate = await db.prepare('SELECT user_id FROM panel_admins WHERE password_hash = ?').bind(passwordHash).first();
      if (duplicate) return json({ ok: false, error: 'رمز مدیر اصلی باید با رمز مدیران دیگر متفاوت باشد.' }, 400);
      await setSetting(db, 'admin_password_hash', passwordHash);
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
    const tables = Object.keys(RESTORE_COLUMNS);
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
    const tables = Object.keys(RESTORE_COLUMNS);
    const stmts = [];
    for (const t of tables) {
      stmts.push(db.prepare('DELETE FROM ' + t));
      const rows = Array.isArray(data[t]) ? data[t] : [];
      for (const row of rows) {
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          return json({ ok: false, error: 'ردیف نامعتبر در جدول ' + t }, 400);
        }
        const cols = RESTORE_COLUMNS[t].filter((column) => Object.prototype.hasOwnProperty.call(row, column));
        if (Object.keys(row).some((column) => !RESTORE_COLUMNS[t].includes(column))) {
          return json({ ok: false, error: 'ستون نامعتبر در جدول ' + t }, 400);
        }
        if (!cols.length) continue;
        const placeholders = cols.map(() => '?').join(',');
        stmts.push(db.prepare('INSERT INTO ' + t + ' (' + cols.join(',') + ') VALUES(' + placeholders + ')').bind(...cols.map((c) => row[c])));
      }
    }
    await db.batch(stmts);
    invalidateSettingCache(db);
    return json({ ok: true });
  }

  return json({ ok: false, error: 'مسیر یافت نشد' }, 404);
}
