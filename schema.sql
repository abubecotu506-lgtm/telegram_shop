-- ============================================================
--  ساختار کامل پایگاه دادهٔ فروشگاه
--  محتوای این فایل را در کنسول D1 اجرا کنید.
--  همهٔ دستورها با IF NOT EXISTS نوشته شده‌اند تا اجرای دوباره
--  برای افزودن جدول‌های تازه خطا ندهد.
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  photo_file_id TEXT DEFAULT '',
  type TEXT DEFAULT 'digital',
  delivery_text TEXT DEFAULT '',
  delivery_link TEXT DEFAULT '',
  active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  username TEXT DEFAULT '',
  product_id INTEGER,
  product_name TEXT DEFAULT '',
  quantity INTEGER DEFAULT 1,
  price INTEGER DEFAULT 0,
  discount_code TEXT DEFAULT '',
  discount_amount INTEGER DEFAULT 0,
  final_price INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'card',
  receipt_file_id TEXT DEFAULT '',
  receipt_type TEXT DEFAULT '',
  authority TEXT DEFAULT '',
  ref_id TEXT DEFAULT '',
  account_details TEXT DEFAULT '',
  commission INTEGER DEFAULT 0,
  inviter INTEGER,
  delivery_sent INTEGER DEFAULT 0,
  admin_note TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  user_id INTEGER PRIMARY KEY,
  state TEXT NOT NULL,
  data TEXT DEFAULT '{}',
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  username TEXT DEFAULT '',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  admin_reply TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'percent',
  value INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  expires_at TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY,
  username TEXT DEFAULT '',
  first_name TEXT DEFAULT '',
  last_seen TEXT DEFAULT (datetime('now')),
  is_blocked INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  user_id INTEGER PRIMARY KEY,
  added_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  window_start INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS phone_verifications (
  user_id INTEGER PRIMARY KEY,
  phone_e164 TEXT NOT NULL,
  verified_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS panel_admins (
  user_id INTEGER PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_by INTEGER DEFAULT 0,
  added_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_panel_admins_password_hash
  ON panel_admins(password_hash);

CREATE TABLE IF NOT EXISTS referrals(user_id INTEGER PRIMARY KEY, inviter INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS ref_clicks(update_id INTEGER PRIMARY KEY, inviter INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS referrals_by_inviter ON referrals(inviter);
CREATE INDEX IF NOT EXISTS clicks_by_inviter ON ref_clicks(inviter);
-- Only temporary menu message identifiers; never stores message content.
CREATE TABLE IF NOT EXISTS chat_menu_messages (
  chat_id INTEGER NOT NULL,
  message_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY(chat_id,message_id)
);
CREATE INDEX IF NOT EXISTS chat_menu_expiry ON chat_menu_messages(created_at);
