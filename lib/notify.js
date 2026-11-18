// ============================================================
//  اطلاع‌رسانی‌ها: پیام به مشتری، ادمین و پیام جمعی
// ============================================================
import { sendMessage, sendPhoto, esc } from './telegram.js';
import { getSetting, getAdminIds, getAllUserIds } from './db.js';

export const STATUS_LABELS = {
  pending: '⏳ در انتظار بررسی',
  unpaid: '💳 در انتظار پرداخت',
  confirmed: '✅ تأیید شده',
  shipped: '🚚 ارسال شده',
  completed: '🎉 تکمیل شده',
  rejected: '❌ رد شده',
};

// جایگزینی متغیرهای قالب پیام وضعیت سفارش
export function fillTemplate(tpl, order) {
  return String(tpl || '')
    .replaceAll('{order_code}', esc(order.order_code))
    .replaceAll('{product_name}', esc(order.product_name))
    .replaceAll('{price}', esc(order.final_price));
}

// اطلاع‌رسانی تغییر وضعیت سفارش به مشتری (قالب‌ها از پنل قابل ویرایش‌اند)
export async function notifyCustomerOrderStatus(env, db, order) {
  const keyMap = {
    pending: 'msg_order_pending',
    confirmed: 'msg_order_confirmed',
    shipped: 'msg_order_shipped',
    completed: 'msg_order_completed',
    rejected: 'msg_order_rejected',
  };
  const key = keyMap[order.status];
  if (!key) return;
  const tpl = await getSetting(db, key);
  if (!tpl) return;
  await sendMessage(env, order.user_id, fillTemplate(tpl, order));
}

// اطلاع‌رسانی به همه ادمین‌ها
export async function notifyAdmins(env, db, text, opts = {}) {
  const ids = await getAdminIds(db, env);
  for (const id of ids) {
    if (opts.photo) await sendPhoto(env, id, opts.photo, text, opts);
    else await sendMessage(env, id, text, opts);
  }
}

// تحویل کالا به مشتری (متن تحویل + لینک + عکس)
export async function sendDelivery(env, db, order, product) {
  const chatId = order.user_id;
  const text =
    '📦 <b>تحویل سفارش ' + esc(order.order_code) + '</b>\n\n' + esc(product.delivery_text || 'کالای شما آماده است. 🎁');
  const markup = product.delivery_link
    ? { inline_keyboard: [[{ text: '📥 دریافت کالا', url: product.delivery_link }]] }
    : undefined;
  await sendMessage(env, chatId, text, { reply_markup: markup });
  if (product.photo_file_id) {
    await sendPhoto(env, chatId, product.photo_file_id, '🖼️ ' + esc(product.name));
  }
  await db.prepare('UPDATE orders SET delivery_sent = 1 WHERE id = ?').bind(order.id).run();
}

// ارسال پیام جمعی به همه کاربران
export async function broadcastToAll(env, db, text, photoFileId = '') {
  const ids = await getAllUserIds(db);
  let sent = 0;
  for (const id of ids) {
    try {
      const r = photoFileId ? await sendPhoto(env, id, photoFileId, text) : await sendMessage(env, id, text);
      if (r && r.ok) sent++;
    } catch (e) {}
  }
  await db
    .prepare('INSERT INTO broadcasts(message, sent_count) VALUES(?, ?)')
    .bind(String(text).slice(0, 2000), sent)
    .run();
  return sent;
}
