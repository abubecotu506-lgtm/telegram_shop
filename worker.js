// ============================================================
//  ربات فروشگاهی تلگرام — Cloudflare Workers + D1
//  نقطه ورود اصلی (Router)
// ============================================================
import { handleUpdate } from './lib/bot.js';
import { handleApi } from './lib/api.js';
import { renderPanel } from './lib/panel.js';
import { handlePayReturn } from './lib/pay.js';
import { showClaimCode } from './lib/db.js';
import { tgApi } from './lib/telegram.js';
import { renderMiniApp, handleMiniAppApi } from './lib/miniapp.js';
import { refreshDollarRate } from './lib/rates.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // بررسی سلامت
    if (path === '/' && request.method === 'GET') {
      return new Response('🤖 ربات فروشگاهی فعال است ✅\n' + new Date().toISOString(), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // وب‌هوک تلگرام
    if (path === '/webhook' && request.method === 'POST') {
      const update = await request.json().catch(() => null);
      if (update) ctx.waitUntil(handleUpdate(update, env, ctx, url.origin).catch((e) => console.error('update error:', e)));
      return new Response('OK');
    }

    // پنل وب ادمین
    if (path === '/admin') return renderPanel();

    // مینی‌اپ فروشگاه تلگرام
    if (path === '/app' && request.method === 'GET') return renderMiniApp();
    if (path.startsWith('/api/miniapp/')) return handleMiniAppApi(request, env, url);

    // API پنل وب
    if (path.startsWith('/api/')) return handleApi(request, env, url);

    // برگشت از درگاه پرداخت
    if (path === '/pay/return') return handlePayReturn(request, env, url);

    // نمایش کد مدیریت (Claim Code)
    if (path === '/init') return showClaimCode(request, env);

    // تنظیم خودکار وب‌هوک
    if (path === '/set-webhook') return setWebhook(request, env, url);

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(controller, env, ctx) {
    const task = refreshDollarRate(env, env.DB).then((result) => {
      if (!result.ok) console.error('[Dollar rate] Scheduled refresh failed:', result.error || 'unknown error');
    }).catch((error) => console.error('[Dollar rate] Scheduled refresh failed:', error));
    ctx.waitUntil(task);
  },
};

async function setWebhook(request, env, url) {
  const secret = url.searchParams.get('secret');
  if (!env.SETUP_SECRET || secret !== env.SETUP_SECRET) {
    return new Response('⛔ SETUP_SECRET تنظیم نشده یا اشتباه است.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const webhookUrl = url.origin + '/webhook';
  const res = await tgApi(env, 'setWebhook', { url: webhookUrl, drop_pending_updates: true });
  return new Response(res.ok ? '✅ وب‌هوک با موفقیت تنظیم شد:\n' + webhookUrl : '❌ خطا در تنظیم وب‌هوک:\n' + JSON.stringify(res), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
