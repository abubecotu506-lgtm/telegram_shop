// ============================================================
//  پرداخت آنلاین (زرین‌پال)
//  تنظیمات درگاه فقط از پنل وب ادمین انجام می‌شود و تا وقتی
//  ادمین آن را فعال نکند، در ربات نمایش داده نمی‌شود.
// ============================================================
import { getSetting } from './db.js';
import { sendMessage, esc } from './telegram.js';
import { notifyCustomerOrderStatus, notifyAdmins } from './notify.js';

const ZARINPAL_REQUEST = 'https://api.zarinpal.com/rest/v1/payment/request.json';
const ZARINPAL_VERIFY = 'https://api.zarinpal.com/rest/v1/payment/verify.json';

// ساخت درخواست پرداخت و دریافت لینک درگاه
export async function createPayment(env, db, order, origin) {
  const merchant = await getSetting(db, 'pay_merchant_id', '');
  if (!merchant) return { ok: false, error: 'درگاه پرداخت تنظیم نشده است' };

  const callback = origin + '/pay/return';
  let data;
  try {
    const res = await fetch(ZARINPAL_REQUEST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: merchant,
        amount: order.final_price, // تومان
        callback_url: callback,
        description: 'پرداخت سفارش ' + order.order_code,
        metadata: { order_id: String(order.id) },
      }),
    });
    data = await res.json();
  } catch (e) {
    return { ok: false, error: 'خطا در اتصال به درگاه پرداخت' };
  }

  if (data && data.data && data.data.code === 100 && data.data.authority) {
    await db.prepare('UPDATE orders SET authority = ? WHERE id = ?').bind(data.data.authority, order.id).run();
    return { ok: true, url: data.data.gateway_url };
  }
  const msg = data && data.errors && data.errors.message ? data.errors.message : 'خطا در اتصال به درگاه پرداخت';
  return { ok: false, error: msg };
}

// برگشت از درگاه پرداخت (کاربر بعد از پرداخت به این آدرس برمی‌گردد)
export async function handlePayReturn(request, env, url) {
  const db = env.DB;
  const authority = url.searchParams.get('Authority');
  const status = url.searchParams.get('Status');

  const page = (title, body) =>
    new Response(
      '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>' +
        title +
        '</title><style>body{font-family:sans-serif;background:#f3f4f6;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{background:#fff;padding:32px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.1);text-align:center;max-width:90%}</style></head><body><div class="card"><h2>' +
        title +
        '</h2><p>' +
        body +
        '</p><p>می‌توانید به ربات تلگرام برگردید.</p></div></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );

  if (!authority) return page('❌ خطا', 'پارامتر پرداخت یافت نشد.');

  const order = await db.prepare('SELECT * FROM orders WHERE authority = ?').bind(authority).first();
  if (!order) return page('❌ خطا', 'سفارش یافت نشد.');

  if (status !== 'OK') {
    await db
      .prepare("UPDATE orders SET status = 'rejected', admin_note = 'پرداخت توسط کاربر لغو شد' WHERE id = ?")
      .bind(order.id)
      .run();
    await sendMessage(env, order.user_id, '❌ پرداخت شما لغو شد. می‌توانید دوباره تلاش کنید یا با کارت‌به‌کارت پرداخت کنید.');
    return page('❌ پرداخت لغو شد', 'پرداخت انجام نشد.');
  }

  const merchant = await getSetting(db, 'pay_merchant_id', '');
  let data;
  try {
    const res = await fetch(ZARINPAL_VERIFY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchant_id: merchant, authority, amount: order.final_price }),
    });
    data = await res.json();
  } catch (e) {
    return page('❌ خطا', 'خطا در بررسی پرداخت. لطفاً با پشتیبانی تماس بگیرید.');
  }

  if (data && data.data && (data.data.code === 100 || data.data.code === 101)) {
    await db
      .prepare("UPDATE orders SET status = 'confirmed', ref_id = ? WHERE id = ?")
      .bind(String(data.data.ref_id || ''), order.id)
      .run();
    order.status = 'confirmed';

    await notifyCustomerOrderStatus(env, db, order);
    await notifyAdmins(
      env,
      db,
      '💳 <b>پرداخت آنلاین جدید!</b>\n🔖 کد سفارش: <b>' + esc(order.order_code) + '</b>\n🛍️ محصول: ' +
        esc(order.product_name) +
        '\n💵 مبلغ: ' +
        esc(order.final_price) +
        ' تومان\n🧾 شماره پیگیری درگاه: ' +
        esc(data.data.ref_id || ''),
      { reply_markup: { inline_keyboard: [[{ text: '🧾 جزئیات سفارش', callback_data: 'o:' + order.id }]] } }
    );
    return page('✅ پرداخت موفق', 'پرداخت شما با موفقیت انجام شد و سفارش ثبت شد.');
  }

  return page('❌ پرداخت ناموفق', 'پرداخت شما تأیید نشد. در صورت کسر وجه، مبلغ به‌زودی برگردانده می‌شود.');
}
