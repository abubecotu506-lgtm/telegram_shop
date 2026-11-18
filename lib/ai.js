// ============================================================
//  دستیار هوشمند فروشگاهی (Cloudflare Workers AI)
//  فقط وقتی فعال است که ادمین از پنل وب آن را روشن کند.
// ============================================================
import { getSetting } from './db.js';

export async function aiReply(env, db, userText, history = []) {
  try {
    const { results } = await db
      .prepare('SELECT name, price FROM products WHERE active = 1 ORDER BY id DESC LIMIT 20')
      .all();
    const list = results.length
      ? results.map((p) => '- ' + p.name + ': ' + p.price + ' تومان').join('\n')
      : 'در حال حاضر محصولی برای فروش موجود نیست';
    const shopName = await getSetting(db, 'shop_name', 'فروشگاه');
    const priorMessages = Array.isArray(history)
      ? history.slice(-10).filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }))
      : [];

    const res = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content:
            'تو دستیار هوشمند فروشگاه «' +
            shopName +
            '» هستی. به زبان فارسی، کوتاه، دوستانه و با ایموجی پاسخ بده.\n' +
            'محصولات و قیمت‌ها:\n' +
            list +
            '\nقوانین:\n' +
            '- فقط درباره محصولات، قیمت‌ها و نحوه خرید پاسخ بده.\n' +
            '- اگر کاربر درباره سفارش خودش سؤال داشت، او را به بخش «پیگیری سفارش» یا «پشتیبانی» هدایت کن.\n' +
            '- اگر سؤال نامربوط بود، مؤدبانه بگو که فقط برای راهنمایی خرید هستی.',
        },
        ...priorMessages,
        { role: 'user', content: String(userText || '').slice(0, 1800) },
      ],
    });
    return res.response || 'متأسفانه پاسخی ندارم. لطفاً از بخش 🎧 پشتیبانی پیام بگذارید.';
  } catch (e) {
    return '🤖 در حال حاضر دستیار هوشمند در دسترس نیست. لطفاً از بخش 🎧 پشتیبانی پیام بگذارید.';
  }
}
