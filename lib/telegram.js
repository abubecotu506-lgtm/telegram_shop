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
// تلگرام فقط سه استایل ازپیش‌تعریف‌شدهٔ primary/success/danger دارد؛
// رنگ دلخواه یا رنگ پس‌زمینهٔ سفارشی از Bot API پشتیبانی نمی‌شود.
function buttonStyle(text, explicit) {
  if (['primary', 'success', 'danger'].includes(explicit)) return explicit;
  const label = String(text || '');
  if (/❌|لغو|حذف|رد /.test(label)) return 'danger';
  if (/✅|🟢|تأیید|ثبت|ارسال شد|خرید/.test(label)) return 'success';
  return 'primary';
}
export const btn = (text, data, style) => ({ text, callback_data: data, style: buttonStyle(text, style) });
export const urlBtn = (text, url, style) => ({ text, url, style: buttonStyle(text, style) });
const replyBtn = (text, style) => ({ text, style: buttonStyle(text, style) });
export const inlineKb = (rows) => ({ inline_keyboard: rows });
export const cancelKb = () => inlineKb([[btn('❌ لغو', 'x')]]);
export const phoneRequestKb = () => ({
  keyboard: [[{ text: '📲 تأیید شمارهٔ تلفن', request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
  input_field_placeholder: 'برای ادامه، شمارهٔ خودتان را ارسال کنید',
});
export const removeReplyKeyboard = () => ({ remove_keyboard: true });

// منوی اصلی (دکمه‌های ثابت پایین صفحه)
export function mainMenuKb(isAdmin) {
  const rows = [
    [replyBtn('🎮 محصولات', 'success'), replyBtn('📦 سفارش‌های من')],
    [replyBtn('🔍 پیگیری سفارش'), replyBtn('🎧 پشتیبانی', 'success')],
    [replyBtn('🤖 گفت‌وگو با هوش مصنوعی', 'primary')],
    [replyBtn('💵 خریدهای ۱ دلاری دیگر', 'success')],
    [replyBtn('ℹ️ راهنما')],
  ];
  if (isAdmin) rows.push([replyBtn('🛠 پنل مدیریت')]);
  return { keyboard: rows, resize_keyboard: true };
}
