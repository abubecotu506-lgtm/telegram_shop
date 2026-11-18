// ============================================================
//  ابزارهای ارتباط با تلگرام و فرمت‌بندی فارسی
// ============================================================

// فرار کردن متن کاربر برای حالت HTML تلگرام
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

// تبدیل ارقام انگلیسی به فارسی
export function toFa(n) {
  return String(n).replace(/\d/g, (d) => FA_DIGITS[d]);
}

// فرمت قیمت: ۱٬۰۰۰ تومان
export function fmtMoney(n) {
  const num = Number(n) || 0;
  return toFa(num.toLocaleString('en-US')) + ' تومان';
}

// فراخوانی API تلگرام
export function tgApi(env, method, body) {
  return fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then((r) => r.json())
    .catch(() => ({ ok: false }));
}

export function sendMessage(env, chatId, text, opts = {}) {
  return tgApi(env, 'sendMessage', {
    chat_id: chatId,
    text: String(text).slice(0, 4000),
    parse_mode: 'HTML',
    disable_web_page_preview: opts.noPreview ? true : undefined,
    reply_markup: opts.reply_markup,
  });
}

export function sendPhoto(env, chatId, photo, caption = '', opts = {}) {
  return tgApi(env, 'sendPhoto', {
    chat_id: chatId,
    photo,
    caption: String(caption).slice(0, 1000),
    parse_mode: 'HTML',
    reply_markup: opts.reply_markup,
  });
}

export function sendDocument(env, chatId, doc, caption = '', opts = {}) {
  return tgApi(env, 'sendDocument', {
    chat_id: chatId,
    document: doc,
    caption: String(caption).slice(0, 1000),
    parse_mode: 'HTML',
    reply_markup: opts.reply_markup,
  });
}

export function editMessageText(env, chatId, messageId, text, opts = {}) {
  return tgApi(env, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text: String(text).slice(0, 4000),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: opts.reply_markup,
  });
}

export function answerCallback(env, callbackId, text = '') {
  return tgApi(env, 'answerCallbackQuery', {
    callback_query_id: callbackId,
    text: text || undefined,
  });
}

// ---------- دکمه‌های آماده ----------

export const btn = (text, data) => ({ text, callback_data: data });
export const urlBtn = (text, url) => ({ text, url });
export const inlineKb = (rows) => ({ inline_keyboard: rows });
export const cancelKb = () => inlineKb([[btn('❌ لغو', 'x')]]);

// منوی اصلی (دکمه‌های ثابت پایین صفحه)
export function mainMenuKb(isAdmin) {
  const rows = [
    [{ text: '🛍️ فروشگاه' }, { text: '📦 سفارش‌های من' }],
    [{ text: '🔍 پیگیری سفارش' }, { text: '🎧 پشتیبانی' }],
    [{ text: 'ℹ️ راهنما' }],
  ];
  if (isAdmin) rows.push([{ text: '🛠 پنل مدیریت' }]);
  return { keyboard: rows, resize_keyboard: true };
}
