// ============================================================
//  لایه دیتابیس (Cloudflare D1)
// ============================================================

// بازی‌های پیش‌فرض فروشگاه؛ داده‌ها در تنظیمات D1 ذخیره می‌شوند و به migration تازه نیاز ندارند.
export const DEFAULT_GAME_CATALOG = [
  { id: 'codm', name: 'Call of Duty Mobile', emoji: '🎮', active: true },
  { id: 'free-fire', name: 'Free Fire', emoji: '🔥', active: true },
  { id: 'pubg', name: 'PUBG Mobile', emoji: '🎯', active: true },
  { id: 'clash-royale', name: 'Clash Royale', emoji: '👑', active: true },
  { id: 'clash-of-clans', name: 'Clash of Clans', emoji: '⚔️', active: true },
  { id: 'efootball', name: 'eFootball', emoji: '⚽', active: true },
  { id: 'config', name: 'کانفیگ', emoji: '🌐', active: true },
  { id: 'roblox', name: 'Roblox', emoji: '🧱', active: true },
];

export const DEFAULT_OTHER_DOLLAR_DEALS = {
  intro: 'پیشنهادهای دیگر خریدهای ۱ دلاری را در این بخش ببینید.',
  offers: [],
};

async function readJsonSetting(db, key, fallback) {
  const raw = await getSetting(db, key, null);
  if (raw === null || raw === undefined || raw === '') return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export async function getGameCatalog(db) {
  const value = await readJsonSetting(db, 'catalog_games', null);
  if (value === null) return DEFAULT_GAME_CATALOG.map((game) => ({ ...game }));
  if (!Array.isArray(value)) return DEFAULT_GAME_CATALOG.map((game) => ({ ...game }));
  return value.filter((game) => game && typeof game === 'object' && !Array.isArray(game));
}

export async function setGameCatalog(db, games) {
  await setSetting(db, 'catalog_games', JSON.stringify(games));
}

export async function getProductCatalogMeta(db) {
  const value = await readJsonSetting(db, 'catalog_product_meta', {});
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export async function setProductCatalogMeta(db, meta) {
  await setSetting(db, 'catalog_product_meta', JSON.stringify(meta));
}

export async function getOtherDollarDeals(db) {
  const value = await readJsonSetting(db, 'catalog_other_dollar_deals', null);
  if (value === null) return { intro: DEFAULT_OTHER_DOLLAR_DEALS.intro, offers: [] };
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { intro: DEFAULT_OTHER_DOLLAR_DEALS.intro, offers: [] };
  }
  return {
    intro: typeof value.intro === 'string' ? value.intro : DEFAULT_OTHER_DOLLAR_DEALS.intro,
    offers: Array.isArray(value.offers) ? value.offers.filter((offer) => offer && typeof offer === 'object' && !Array.isArray(offer)) : [],
  };
}

export async function setOtherDollarDeals(db, deals) {
  await setSetting(db, 'catalog_other_dollar_deals', JSON.stringify(deals));
}

// مقادیر پیش‌فرض تنظیمات فروشگاه
export const DEFAULTS = {
  shop_name: 'فروشگاه من',
  welcome_text: 'سلام! 👋 به فروشگاه ما خوش آمدید.\nاز منوی زیر می‌توانید محصولات را ببینید و خرید کنید.',
  guide_text: '📖 راهنمای خرید:\n۱. محصول مورد نظر را انتخاب کنید\n۲. دکمه خرید را بزنید\n۳. رسید پرداخت را ارسال کنید\n۴. پس از تأیید، کالا تحویل داده می‌شود',
  support_info: '🎧 پشتیبانی: @support\n🕐 ساعت کاری: ۹ صبح تا ۱۱ شب',
  card_number: '6219861457405495',
  card_owner: 'رضا سبحانی',
  msg_order_pending: '⏳ سفارش شما ثبت شد و در حال بررسی است.\nکد سفارش: {order_code}',
  msg_order_confirmed: '✅ سفارش شما تأیید شد و در حال آماده‌سازی است.\nکد سفارش: {order_code}',
  msg_order_shipped: '🚚 سفارش شما ارسال شد!\nکد سفارش: {order_code}',
  msg_order_completed: '🎉 سفارش شما با موفقیت تکمیل شد.\nکد سفارش: {order_code}\nاز خرید شما سپاسگزاریم 🌹',
  msg_order_rejected: '❌ متأسفانه سفارش شما رد شد.\nکد سفارش: {order_code}\nبرای اطلاعات بیشتر با پشتیبانی در تماس باشید.',
  pay_enabled: '0',
  pay_merchant_id: '',
  ai_enabled: '0',
  claim_code: '',
  admin_password_hash: '',
  owner_user_id: '',
  force_join_enabled: '0',
  force_join_channels: '[]',
  force_join_channel: '',
  miniapp_texts: '{}',
  force_join_link: '',
  phone_required: '0',
};

// ---------- تنظیمات ----------
// تنظیمات پرتکرار برای چند ثانیه در هر isolate نگه داشته می‌شوند تا پیام‌های ربات
// برای خواندن هر پرچم کوچک، به‌ازای هر آپدیت یک رفت‌وبرگشت D1 جدا نسازند.
const SETTING_CACHE_TTL_MS = 2500;
const SETTING_CACHE = new WeakMap();

function settingCacheFor(db) {
  if (!db || (typeof db !== 'object' && typeof db !== 'function')) return null;
  let cache = SETTING_CACHE.get(db);
  if (!cache) { cache = new Map(); SETTING_CACHE.set(db, cache); }
  return cache;
}

export function invalidateSettingCache(db, key) {
  const cache = db && (typeof db === 'object' || typeof db === 'function') ? SETTING_CACHE.get(db) : null;
  if (!cache) return;
  if (key === undefined) cache.clear();
  else cache.delete(String(key));
}

export async function getSetting(db, key, def = null) {
  const cache = settingCacheFor(db);
  const now = Date.now();
  const cached = cache && cache.get(String(key));
  if (cached && cached.expiresAt > now) {
    if (cached.found) return cached.value;
    return def !== null ? def : DEFAULTS[key] ?? null;
  }
  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  const found = !!(row && row.value !== null && row.value !== undefined);
  const value = found ? row.value : null;
  if (cache) cache.set(String(key), { found, value, expiresAt: now + SETTING_CACHE_TTL_MS });
  if (found) return value;
  return def !== null ? def : DEFAULTS[key] ?? null;
}

export async function setSetting(db, key, value) {
  await db.prepare(
    'INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  )
    .bind(key, String(value))
    .run();
  invalidateSettingCache(db, key);
}

export async function getAllSettings(db) {
  const { results } = await db.prepare('SELECT key, value FROM settings').all();
  const out = { ...DEFAULTS };
  for (const r of results) out[r.key] = r.value;
  return out;
}

// تولید کد تصادفی (کد مدیریت / کد سفارش)
export function genCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function ensureClaimCode(db) {
  let code = await getSetting(db, 'claim_code', '');
  if (!code) {
    code = genCode(8);
    await setSetting(db, 'claim_code', code);
  }
  return code;
}

// ---------- کاربران ----------

export async function upsertUser(db, user) {
  if (!user || !user.id) return;
  await db
    .prepare(
      "INSERT INTO users(user_id, username, first_name, last_seen) VALUES(?, ?, ?, datetime('now')) " +
        'ON CONFLICT(user_id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name, last_seen=datetime(\'now\')'
    )
    .bind(user.id, user.username || '', user.first_name || '')
    .run();
}

export async function getAllUserIds(db) {
  const { results } = await db.prepare('SELECT user_id FROM users').all();
  return results.map((r) => r.user_id);
}

// ---------- ادمین‌ها ----------

export async function getAdminIds(db, env) {
  const {results} = await db.prepare('SELECT user_id FROM panel_admins WHERE user_id > 0').all();
  return results.map(row=>Number(row.user_id));
}

export async function isAdminUser(db, env, userId) {
  return !!await db.prepare('SELECT 1 FROM panel_admins WHERE user_id = ?').bind(Number(userId)).first();
}

export async function addAdmin(db, userId) {
  await db.prepare('INSERT OR IGNORE INTO admin_users(user_id) VALUES(?)').bind(userId).run();
}

export async function removeAdmin(db, userId) {
  await db.batch([
    db.prepare('DELETE FROM admin_users WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM panel_admins WHERE user_id = ?').bind(userId),
  ]);
}

export async function getOwnerId(db) {
  const saved = await getSetting(db, 'owner_user_id', '');
  if (saved && Number(saved) > 0) return Number(saved);
  return null;
}

export async function getVerifiedPhone(db, userId) {
  return db.prepare('SELECT phone_e164, verified_at FROM phone_verifications WHERE user_id = ?').bind(userId).first();
}

export async function setVerifiedPhone(db, userId, phone) {
  await db.prepare(
    "INSERT INTO phone_verifications(user_id, phone_e164, verified_at) VALUES(?, ?, datetime('now')) " +
      "ON CONFLICT(user_id) DO UPDATE SET phone_e164=excluded.phone_e164, verified_at=datetime('now')"
  ).bind(userId, phone).run();
}

// ---------- نشست‌ها (Session) ----------

export async function getSession(db, userId) {
  const row = await db
    .prepare('SELECT state, data, updated_at FROM sessions WHERE user_id = ?')
    .bind(userId)
    .first();
  if (!row) return null;
  const ts = Date.parse(String(row.updated_at).replace(' ', 'T') + 'Z');
  if (!isNaN(ts) && Date.now() - ts > 30 * 60 * 1000) {
    await clearSession(db, userId);
    return null;
  }
  let data = {};
  try {
    data = JSON.parse(row.data || '{}');
  } catch (e) {}
  return { state: row.state, data };
}

export async function setSession(db, userId, state, data) {
  await db
    .prepare(
      "INSERT INTO sessions(user_id, state, data, updated_at) VALUES(?, ?, ?, datetime('now')) " +
        'ON CONFLICT(user_id) DO UPDATE SET state=excluded.state, data=excluded.data, updated_at=datetime(\'now\')'
    )
    .bind(userId, state, JSON.stringify(data || {}))
    .run();
}

export async function clearSession(db, userId) {
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
}

// ---------- محصولات ----------

export async function getProducts(db, activeOnly = true) {
  const sql = activeOnly
    ? 'SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC, id DESC'
    : 'SELECT * FROM products ORDER BY sort_order ASC, id DESC';
  const { results } = await db.prepare(sql).all();
  return results;
}

export async function getProductById(db, id) {
  return db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
}

// ---------- سفارش‌ها ----------

export async function createOrder(db, o) {
  const res = await db
    .prepare(
      'INSERT INTO orders(order_code, user_id, username, product_id, product_name, quantity, price, discount_code, discount_amount, final_price, status, payment_method, receipt_file_id, receipt_type, account_details, commission, inviter) ' +
        'VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT inviter FROM referrals WHERE user_id=?))'
    )
    .bind(
      o.order_code,
      o.user_id,
      o.username || '',
      o.product_id || null,
      o.product_name || '',
      o.quantity || 1,
      o.price || 0,
      o.discount_code || '',
      o.discount_amount || 0,
      o.final_price || 0,
      o.status || 'pending',
      o.payment_method || 'card',
      o.receipt_file_id || '',
      o.receipt_type || '', o.details || '', o.commission || 0, o.user_id
    )
    .run();
  return res.meta.last_row_id;
}

export async function getOrderById(db, id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
}

export async function getOrderByCode(db, code) {
  return db
    .prepare('SELECT * FROM orders WHERE order_code = ?')
    .bind(String(code).trim().toUpperCase())
    .first();
}

export async function getUserOrders(db, userId, limit = 10) {
  const { results } = await db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT ?')
    .bind(userId, limit)
    .all();
  return results;
}

export async function updateOrderStatus(db, id, status, note = null) {
  if (note !== null) {
    await db
      .prepare("UPDATE orders SET status = ?, admin_note = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(status, note, id)
      .run();
  } else {
    await db
      .prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(status, id)
      .run();
  }
}

// ---------- کدهای تخفیف ----------

export async function getDiscountByCode(db, code) {
  return db
    .prepare('SELECT * FROM discount_codes WHERE code = ?')
    .bind(String(code).trim().toUpperCase())
    .first();
}

export async function validateDiscount(db, code) {
  const d = await getDiscountByCode(db, code);
  if (!d) return { ok: false, error: 'کد تخفیف یافت نشد ❌' };
  if (!d.active) return { ok: false, error: 'این کد تخفیف فعال نیست ❌' };
  if (d.expires_at) {
    const exp = Date.parse(String(d.expires_at).replace(' ', 'T') + 'Z');
    if (!isNaN(exp) && Date.now() > exp) return { ok: false, error: 'این کد تخفیف منقضی شده است ❌' };
  }
  if (d.max_uses > 0 && d.used_count >= d.max_uses)
    return { ok: false, error: 'سقف استفاده از این کد تکمیل شده است ❌' };
  return { ok: true, discount: d };
}

export function calcDiscount(discount, price) {
  if (!discount) return 0;
  if (discount.type === 'percent') return Math.floor((price * discount.value) / 100);
  return Math.min(discount.value, price);
}

export async function useDiscount(db, code) {
  await db
    .prepare('UPDATE discount_codes SET used_count = used_count + 1 WHERE code = ?')
    .bind(String(code).toUpperCase())
    .run();
}

// ---------- تیکت‌های پشتیبانی ----------

export async function createTicket(db, userId, username, message) {
  const res = await db
    .prepare('INSERT INTO support_tickets(user_id, username, message) VALUES(?, ?, ?)')
    .bind(userId, username || '', message)
    .run();
  return res.meta.last_row_id;
}

export async function getTicketById(db, id) {
  return db.prepare('SELECT * FROM support_tickets WHERE id = ?').bind(id).first();
}

// ---------- محدودیت نرخ (ضد اسپم) ----------

export async function checkRateLimit(db, userId) {
  const key = 'u' + userId;
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare('SELECT count, window_start FROM rate_limits WHERE key = ?').bind(key).first();
  if (!row || now - row.window_start > 60) {
    await db
      .prepare(
        'INSERT INTO rate_limits(key, count, window_start) VALUES(?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start'
      )
      .bind(key, now)
      .run();
    return true;
  }
  if (row.count >= 30) return false;
  await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
  return true;
}

// ---------- نمایش کد مدیریت (Claim Code) ----------
// جدول‌ها توسط مایگریشن‌های پوشه migrations/ ساخته می‌شوند.
// این تابع فقط کد مدیریت را می‌سازد (اگر نبود) و نمایش می‌دهد.

export async function showClaimCode(request, env) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  if (!env.SETUP_SECRET || secret !== env.SETUP_SECRET) {
    return new Response(
      '⛔ برای مشاهده کد مدیریت، ابتدا متغیر SETUP_SECRET را در تنظیمات Worker ست کنید و سپس به این آدرس با ?secret=... مراجعه کنید.',
      { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }
  const claim = await ensureClaimCode(env.DB);
  return new Response(
    '🔑 کد مدیریت (Claim Code) شما: ' +
      claim +
      '\n\nدر ربات تلگرام دستور زیر را بزنید تا ادمین شوید:\n/claim ' +
      claim +
      '\n\nپنل وب ادمین: /admin',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
}
