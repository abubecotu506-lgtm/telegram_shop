// ============================================================
//  منطق ربات تلگرام: بخش مشتری + بخش ادمین
// ============================================================
import {
  sendMessage,
  sendPhoto,
  sendDocument,
  editMessageText,
  answerCallback,
  tgApi,
  phoneRequestKb,
  removeReplyKeyboard,
  esc,
  toFa,
  fmtMoney,
  btn,
  urlBtn,
  inlineKb,
  cancelKb,
  mainMenuKb,
} from './telegram.js';
import {
  getSetting,
  setSetting,
  ensureClaimCode,
  upsertUser,
  isAdminUser,
  addAdmin,
  getOwnerId,
  getVerifiedPhone,
  setVerifiedPhone,
  getSession,
  setSession,
  clearSession,
  getProducts,
  getProductById,
  createOrder,
  getOrderById,
  getOrderByCode,
  getUserOrders,
  updateOrderStatus,
  validateDiscount,
  calcDiscount,
  useDiscount,
  createTicket,
  getTicketById,
  checkRateLimit,
  genCode,
  getAllSettings,
  getGameCatalog,
  getProductCatalogMeta,
  setProductCatalogMeta,
  getOtherDollarDeals,
  DEFAULTS,
} from './db.js';
import { notifyCustomerOrderStatus, notifyAdmins, sendDelivery, broadcastToAll, STATUS_LABELS } from './notify.js';
import { createPayment } from './pay.js';
import { aiReply } from './ai.js';

const PAGE_SIZE = 6;
const PRODUCTS_MENU_TEXT = '🎮 محصولات';
const OTHER_DOLLAR_DEALS_TEXT = '💵 خریدهای ۱ دلاری دیگر';
const AI_MENU_TEXT = '🤖 گفت‌وگو با هوش مصنوعی';
const LEGACY_MINIAPP_MENU_TEXT = '📱 باز کردن مینی‌اپ';
const MINIAPP_MENU_LABEL = 'ویترین';
const JOIN_ADMIN_PAGE_SIZE = 8;
const TRUST='🤝 اعتماد به مجموعه', OTHER='🎮 بازی‌های دیگر', REFER='🎁 دعوت دوستان';
async function trustMessage(env,chat,db){
  const text=await getSetting(db,'trust_text','اعتماد به مجموعه');
  const links=String(await getSetting(db,'trust_links','')).split(/\s+/).filter(v=>{try{return new URL(v).protocol==='https:'}catch{return false}});
  return sendMessage(env,chat,esc(text || 'اعتماد به مجموعه'),{reply_markup:inlineKb(links.map((v,i)=>[urlBtn('🔗 لینک '+toFa(i+1),v)]))});
}
async function referralCard(env,chat,db,user){
  const me=await tgApi(env,'getMe',{}); if(!me.ok)return sendMessage(env,chat,'دریافت لینک دعوت ممکن نشد. دوباره تلاش کنید.');
  const name=esc(me.result.first_name), link='https://t.me/'+me.result.username+'?start=ref_'+user.id;
  const stats=await db.prepare("SELECT (SELECT COUNT(*) FROM referrals WHERE inviter=?1) n,(SELECT COUNT(*) FROM ref_clicks WHERE inviter=?1) c,(SELECT COALESCE(SUM(commission),0) FROM orders WHERE inviter=?1 AND status='completed') total").bind(user.id).first();
  return sendMessage(env,chat,`🎁 <b>دعوت دوستان به ${name}</b>\n\n💲 با دعوت دوستانت به ${name} درآمد کسب کن!\n\nکافیه لینک دعوت اختصاصی خودت رو برای دوستانت ارسال کنی و از هر خریدی که از طریق لینک تو انجام بدن، <b>۱۰٪ از سود خرید</b> به تو تعلق می‌گیره!\n\n✨ بدون محدودیت در دعوت\n💎 کسب درآمد از خرید دوستان\n🛍 دریافت پورسانت به‌صورت مستمر\n🚀 هر دعوت = درآمدی ثابت\n\n• تعداد دعوت شدگان : ${toFa(stats.n)}\n• کلیک ها : ${toFa(stats.c)}\n• درآمد : ${fmtMoney(stats.total)}\n\n🔗 لینک دعوت شما : ${link}`);
}
const modes={codm:'خرید فقط از طریق ورود با جیمیل و رمز اکتیویژن انجام می‌شود.', 'free-fire':'خرید فقط از روش ورود با اکانت جیمیل انجام می‌شود.',pubg:'ورود از طریق QR کد ورود به اکانت پابجی', 'clash-royale':'خرید فقط از طریق ورود به اکانت از سوپرسل آیدی انجام می‌شود.', 'clash-of-clans':'خرید فقط از طریق ورود به اکانت از سوپرسل آیدی انجام می‌شود.',efootball:'روش ورود: KONAMI ID + Password'};
async function step(env,chat,user,db,d,state,msg,options=[]){
  await setSession(db,user.id,'flow_'+state,d);
  const rows=options.map(([k,t])=>[btn(t,'flow:'+k)]);rows.push([btn('لغو خرید ❌','x')]);
  return sendMessage(env,chat,msg,{reply_markup:inlineKb(rows)});
}
const nameStep=(env,c,u,db,d)=>step(env,c,u,db,d,'name','اسم نمایشی اکانت را وارد کنید (رمز یا کد ورود نفرستید).');
async function flowChoice(env,c,u,db,k){
  const s=await getSession(db,u.id);if(!s)return;const d=s.data;
  if(s.state==='flow_region'&&['eu','asia',...(d.game==='codm'?['india']:[])].includes(k)){
    d.region={eu:'اروپا',asia:'آسیا (خاورمیانه)',india:'هند'}[k];
    if(k==='eu')return step(env,c,u,db,d,'uid','یو آیدی بازی را ارسال کنید.');
    d.method=k==='india'?'هماهنگی با پشتیبانی':modes[d.game];
    return step(env,c,u,db,d,'agree',d.method+'\nرمز یا کد ورود را در چت ارسال نکنید.',[['yes','مشکلی ندارم ✅']]);
  }
  if(s.state==='flow_method'&&['email','username'].includes(k)){d.method=k==='email'?'Email + Password':'Username + Password';return nameStep(env,c,u,db,d)}
  if(s.state==='flow_agree'&&k==='yes')return nameStep(env,c,u,db,d);
}

const MENU_TEXTS = [TRUST,OTHER,REFER,PRODUCTS_MENU_TEXT, OTHER_DOLLAR_DEALS_TEXT, '🛍️ فروشگاه', '📦 سفارش‌های من', '🔍 پیگیری سفارش', '🎧 پشتیبانی', AI_MENU_TEXT, LEGACY_MINIAPP_MENU_TEXT, 'ℹ️ راهنما', '🛠 پنل مدیریت'];

function validJoinIdentifier(value) {
  return /^@[A-Za-z0-9_]{5,32}$/.test(value) || /^-[0-9]{5,20}$/.test(value);
}

async function getJoinChannels(db) {
  let channels = [];
  try {
    const parsed = JSON.parse(await getSetting(db, 'force_join_channels', '[]') || '[]');
    if (Array.isArray(parsed)) channels = parsed;
  } catch (e) {}
  if (!channels.length) {
    const channel = String(await getSetting(db, 'force_join_channel', '') || '').trim();
    const link = String(await getSetting(db, 'force_join_link', '') || '').trim();
    if (channel) channels = [{ channel, link }];
  }
  return channels.map((item) => {
    const channel = String(item && (item.channel || item.id) || '').trim();
    let link = String(item && (item.link || item.url) || '').trim();
    if (!link && channel.startsWith('@')) link = 'https://t.me/' + channel.slice(1);
    return { channel, link };
  }).filter((item) => item.channel);
}

async function saveJoinChannels(db, channels) {
  const seen = new Set();
  const normalized = [];
  for (const item of channels) {
    const channel = String(item && item.channel || '').trim();
    let link = String(item && item.link || '').trim();
    if (!validJoinIdentifier(channel) || seen.has(channel)) continue;
    if (!link && channel.startsWith('@')) link = 'https://t.me/' + channel.slice(1);
    if (link) { let parsed; try { parsed = new URL(link); } catch (e) { continue; } if (parsed.protocol !== 'https:') continue; }
    seen.add(channel);
    normalized.push({ channel, link });
  }
  await setSetting(db, 'force_join_channels', JSON.stringify(normalized));
  await setSetting(db, 'force_join_channel', normalized.length ? normalized[0].channel : '');
  await setSetting(db, 'force_join_link', normalized.length ? normalized[0].link : '');
  return normalized;
}

function normalizeIranianPhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('0098')) digits = digits.slice(2);
  else if (digits.startsWith('98')) digits = digits;
  else if (digits.startsWith('0')) digits = '98' + digits.slice(1);
  else if (digits.startsWith('9') && digits.length === 10) digits = '98' + digits;
  else return '';
  return /^989\d{9}$/.test(digits) ? '+' + digits : '';
}

async function startAiChat(env, db, chatId, userId) {
  const enabled = (await getSetting(db, 'ai_enabled', '0')) === '1';
  if (!enabled || !env.AI) {
    await clearSession(db, userId);
    return sendMessage(env, chatId, '🤖 گفت‌وگوی هوشمند در حال حاضر از پنل مدیریت غیرفعال است.');
  }
  await setSession(db, userId, 'ai_chat', { history: [] });
  return sendMessage(env, chatId,
    '🤖 <b>گفت‌وگو با دستیار هوشمند</b>\n\nسؤالتان را همین‌جا بنویسید؛ زمینهٔ همین گفت‌وگو را در نظر می‌گیرم. نشست پس از ۳۰ دقیقه بی‌فعالیتی منقضی می‌شود.\nبرای پایان، «⏹ پایان گفت‌وگو» یا /cancel را بزنید.',
    { reply_markup: inlineKb([[btn('⏹ پایان گفت‌وگو', 'x', 'danger')]]) }
  );
}

async function setMiniAppMenuButton(env, chatId, origin) {
  // Telegram's built-in bot menu button is shown separately beside the message composer.
  // It is available in private chats only; the Mini App itself remains at /app.
  if (Number(chatId) <= 0) return false;
  let appUrl = String(env.MINI_APP_URL || '').trim();
  if (!appUrl) appUrl = String(origin || '').replace(/\/$/, '') + '/app';
  try {
    const parsed = new URL(appUrl);
    if (parsed.protocol !== 'https:') return false;
    const result = await tgApi(env, 'setChatMenuButton', {
      chat_id: Number(chatId),
      menu_button: { type: 'web_app', text: MINIAPP_MENU_LABEL, web_app: { url: parsed.href } },
    });
    return !!(result && result.ok);
  } catch (e) {
    return false;
  }
}

async function resumePendingStart(env, chatId, db, admin, user, origin) {
  const pending = await getSession(db, user.id);
  if (pending && pending.state === 'pending_start' && pending.data && /^buy_\d{1,12}$/.test(String(pending.data.payload || ''))) {
    await clearSession(db, user.id);
    return cmdStart(env, chatId, db, admin, pending.data.payload, user, origin);
  }
  return cmdStart(env, chatId, db, admin, '', user, origin);
}

async function enforceJoin(env, db, chatId, user, requestedPage = 0) {
  if ((await getSetting(db, 'force_join_enabled', '0')) !== '1') return false;

  if ((await getSetting(db, 'phone_required', '0')) === '1') {
    let verified = null;
    try { verified = await getVerifiedPhone(db, user.id); } catch (e) {}
    if (!verified) {
      await sendMessage(env, chatId, '🔐 برای ادامه، ابتدا شمارهٔ همراه خودتان را با پیش‌شمارهٔ ایران تأیید کنید:', {
        reply_markup: phoneRequestKb(),
      });
      return true;
    }
  }

  let channels = [];
  try {
    const raw = await getSetting(db, 'force_join_channels', '[]');
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) channels = parsed;
  } catch (e) {}
  if (!channels.length) {
    const legacyChannel = String(await getSetting(db, 'force_join_channel', '') || '').trim();
    const legacyLink = String(await getSetting(db, 'force_join_link', '') || '').trim();
    if (legacyChannel) channels = [{ channel: legacyChannel, link: legacyLink }];
  }
  channels = channels.map((entry) => {
    const channel = String(entry && (entry.channel || entry.id) || '').trim();
    let link = String(entry && (entry.link || entry.url) || '').trim();
    if (!link && channel.startsWith('@')) link = 'https://t.me/' + channel.slice(1);
    return { channel, link };
  }).filter((entry) => entry.channel);
  if (!channels.length || channels.some((entry) => !/^https:\/\//i.test(entry.link))) {
    await sendMessage(env, chatId, '⚠️ عضویت اجباری هنوز به‌درستی تنظیم نشده است. مدیر فروشگاه باید برای همهٔ کانال‌ها و گروه‌های خصوصی پیوند دعوت ثبت کند.');
    return true;
  }

  const missing = [];
  // پردازش دسته‌ای برای سرعت؛ اندازهٔ هر دسته سقف تعداد کانال‌های قابل تنظیم نیست.
  for (let offset = 0; offset < channels.length; offset += 10) {
    const batch = channels.slice(offset, offset + 10);
    const checks = await Promise.all(batch.map(async (entry) => ({
      entry,
      result: await tgApi(env, 'getChatMember', { chat_id: entry.channel, user_id: user.id }),
    })));
    for (const check of checks) {
      if (!check.result || !check.result.ok || !check.result.result) {
        await sendMessage(env, chatId, '⚠️ بررسی عضویت در ' + esc(check.entry.channel) + ' انجام نشد. ربات باید در همهٔ کانال‌ها و گروه‌ها دسترسی بررسی عضویت داشته باشد.');
        return true;
      }
      const member = check.result.result;
      const isMember = ['creator', 'administrator', 'member'].includes(member.status) || (member.status === 'restricted' && member.is_member === true);
      if (!isMember) missing.push(check.entry);
    }
  }
  if (!missing.length) return false;

  const pageSize = 8;
  const pageCount = Math.ceil(missing.length / pageSize);
  const page = Math.max(0, Math.min(Number(requestedPage) || 0, pageCount - 1));
  const firstIndex = page * pageSize;
  const visible = missing.slice(firstIndex, firstIndex + pageSize);
  const rows = visible.map((entry, index) => [urlBtn('📣 عضویت · ' + toFa(firstIndex + index + 1), entry.link, 'primary')]);
  if (pageCount > 1) {
    const nav = [];
    if (page > 0) nav.push(btn('⬅️ قبلی', 'fj:page:' + (page - 1), 'primary'));
    nav.push(btn(toFa(page + 1) + ' از ' + toFa(pageCount), 'fj:page:' + page, 'primary'));
    if (page < pageCount - 1) nav.push(btn('بعدی ➡️', 'fj:page:' + (page + 1), 'primary'));
    rows.push(nav);
  }
  rows.push([btn('🔄 بررسی عضویت در همهٔ کانال‌ها و گروه‌ها', 'fj:check', 'success')]);
  await sendMessage(env, chatId, '📣 برای استفاده از فروشگاه، لطفاً در همهٔ کانال‌ها و گروه‌های زیر عضو شوید و سپس عضویت را بررسی کنید.' + (pageCount > 1 ? '\nصفحهٔ ' + toFa(page + 1) + ' از ' + toFa(pageCount) : ''), {
    reply_markup: inlineKb(rows),
  });
  return true;
}

// ============================================================
//  نقطه ورود آپدیت‌های تلگرام
// ============================================================

export async function handleUpdate(update, env, ctx, origin) {
  const db = env.DB;
  const message = update.message || update.edited_message;
  const cbq = update.callback_query;

  if (cbq) {
    await handleCallback(cbq, env, ctx, origin);
    return;
  }
  if (!message || !message.from) return;

  const user = message.from;
  const chatId = message.chat.id;
  const text = (message.text || '').trim();
  const photo = message.photo && message.photo.length ? message.photo[message.photo.length - 1] : null;
  const doc = message.document || null;
  const contact = message.contact || null;

  const [admin, joinEnabledValue, phoneRequiredValue] = await Promise.all([
    isAdminUser(db, env, user.id),
    getSetting(db, 'force_join_enabled', '0'),
    getSetting(db, 'phone_required', '0'),
  ]);

  // ضداسپم پیش از ثبت کاربر بررسی می‌شود؛ ثبت last_seen در پس‌زمینه انجام می‌شود تا پاسخ ربات منتظر نوشتن غیرضروری نماند.
  if (!admin && !(await checkRateLimit(db, user.id))) return;
  const ref=Number(chatId)>0 && /^\/start(?:@\w+)? ref_(\d{1,16})$/.exec(text);
  if(ref && Number(ref[1])!==user.id && await db.prepare('SELECT 1 FROM users WHERE user_id=?').bind(Number(ref[1])).first()){
    await db.batch([db.prepare('INSERT OR IGNORE INTO ref_clicks VALUES(?,?)').bind(update.update_id,Number(ref[1])),db.prepare('INSERT OR IGNORE INTO referrals SELECT ?,? WHERE NOT EXISTS(SELECT 1 FROM users WHERE user_id=?)').bind(user.id,Number(ref[1]),user.id)]);
  }
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(upsertUser(db, user).catch((error) => console.error('[User] last_seen update failed:', error)));
  } else {
    await upsertUser(db, user);
  }

  // تأیید شمارهٔ خود کاربر؛ فقط شمارهٔ همراه ایران پذیرفته می‌شود.
  const joinEnabled = joinEnabledValue === '1';
  const phoneRequired = phoneRequiredValue === '1';
  if (!admin && joinEnabled && phoneRequired && contact) {
    if (!contact.user_id || Number(contact.user_id) !== Number(user.id)) {
      return sendMessage(env, chatId, '❌ لطفاً فقط با دکمهٔ «تأیید شمارهٔ تلفن» شمارهٔ خودتان را بفرستید.', { reply_markup: phoneRequestKb() });
    }
    const phone = normalizeIranianPhone(contact.phone_number);
    if (!phone) {
      return sendMessage(env, chatId, '❌ فقط شمارهٔ همراه ایران با پیش‌شمارهٔ ۹۸ پذیرفته می‌شود. شمارهٔ خودتان را دوباره بفرستید.', { reply_markup: phoneRequestKb() });
    }
    await setVerifiedPhone(db, user.id, phone);
    await sendMessage(env, chatId, '✅ شمارهٔ ایرانی شما تأیید شد.', { reply_markup: removeReplyKeyboard() });
    if (await enforceJoin(env, db, chatId, user)) return;
    return resumePendingStart(env, chatId, db, false, user, origin);
  }

  if (!admin && (await enforceJoin(env, db, chatId, user))) {
    const pendingPayload = text.startsWith('/start') ? text.split(/\s+/)[1] || '' : '';
    if (/^buy_\d{1,12}$/.test(pendingPayload)) await setSession(db, user.id, 'pending_start', { payload: pendingPayload });
    return;
  }

  // ---------- دستورات ----------
  if (text.startsWith('/start')) {
    const startPayload = text.split(/\s+/)[1] || '';
    const pending = await getSession(db, user.id);
    if (pending) await clearSession(db, user.id);
    return cmdStart(env, chatId, db, admin, startPayload, user, origin);
  }
  if (text === '/ai' || text.startsWith('/ai@')) return startAiChat(env, db, chatId, user.id);
  if (text === '/join' || text === '/joins') {
    if (!admin) return sendMessage(env, chatId, '⛔ دسترسی ندارید.');
    if (Number(chatId) <= 0) return sendMessage(env, chatId, '🔐 برای حفاظت از پیوندهای دعوت، مدیریت جوین را در گفت‌وگوی خصوصی ربات باز کنید.');
    await clearSession(db, user.id);
    return showAdminJoinSettings(env, chatId, db);
  }
  if (text === '/id' || text === '/myid') return sendMessage(env, chatId, '🆔 شناسهٔ تلگرام شما:\n' + toFa(user.id));
  if (text.startsWith('/claim')) return cmdClaim(env, chatId, user, db, text);
  if (text.startsWith('/admin')) {
    if (admin) return showAdminMenu(env, chatId);
    return sendMessage(env, chatId, '⛔ شما دسترسی ادمین ندارید.');
  }
  if (text === '/cancel' || text === '❌ لغو') {
    await clearSession(db, user.id);
    return sendMessage(env, chatId, '❌ عملیات لغو شد.', { reply_markup: mainMenuKb(admin) });
  }

  // فرمان‌های عمومی مشتری؛ در گفت‌وگوهای گروهی هم قابل استفاده‌اند.
  const publicCommand = String(text.split(/\s+/)[0] || '').split('@')[0].toLowerCase();
  if (publicCommand === '/products' || publicCommand === '/shop') return showShop(env, chatId, 0, db);
  if (publicCommand === '/help') {
    const guide = await getSetting(db, 'guide_text', DEFAULTS.guide_text);
    const info = await getSetting(db, 'support_info', DEFAULTS.support_info);
    return sendMessage(env, chatId, guide + '\n\n' + info);
  }
  if (publicCommand === '/support') {
    const info = await getSetting(db, 'support_info', DEFAULTS.support_info);
    return sendMessage(env, chatId, info);
  }

  // ---------- نشست فعال؟ ----------
  const sess = await getSession(db, user.id);
  if (sess && sess.state === 'pending_start') return resumePendingStart(env, chatId, db, admin, user, origin);
  if (sess) {
    const done = await handleState(env, chatId, user, sess, { text, photo, doc }, db, ctx, origin, admin);
    if (done) return;
  }

  // ---------- دکمه‌های منوی اصلی ----------
  if (text === PRODUCTS_MENU_TEXT || text === '🛍️ فروشگاه') return showShop(env, chatId, 0, db);
  if (text === TRUST || text === OTHER_DOLLAR_DEALS_TEXT) return trustMessage(env,chatId,db);
  if(text===REFER)return referralCard(env,chatId,db,user);
  if(text===OTHER){await setSession(db,user.id,'other_game',{});return sendMessage(env,chatId,'اسم بازی و محصول مدنظر را برای بررسی پشتیبانی بنویسید.',{reply_markup:cancelKb()});}
  if (text === '📦 سفارش‌های من') return showMyOrders(env, chatId, user.id, db);
  if (text === '🔍 پیگیری سفارش') {
    await setSession(db, user.id, 'track_order', {});
    return sendMessage(env, chatId, '🔍 کد سفارش خود را وارد کنید:\n(مثلاً: SH-AB12CD)', { reply_markup: cancelKb() });
  }
  if (text === '🎧 پشتیبانی') {
    await setSession(db, user.id, 'support_new', {});
    return sendMessage(env, chatId, '🎧 پیام خود را بنویسید تا برای پشتیبانی ارسال شود:', { reply_markup: cancelKb() });
  }
  if (text === AI_MENU_TEXT) return startAiChat(env, db, chatId, user.id);
  if (text === LEGACY_MINIAPP_MENU_TEXT) {
    const configured = await setMiniAppMenuButton(env, chatId, origin);
    return sendMessage(env, chatId, configured
      ? '✅ دکمهٔ «' + MINIAPP_MENU_LABEL + '» کنار کادر پیام قرار گرفت؛ مینی‌اپ از همان‌جا باز می‌شود.'
      : '⚠️ تنظیم دکمهٔ مینی‌اپ انجام نشد؛ نشانی Worker باید HTTPS باشد.',
      { reply_markup: mainMenuKb(admin) }
    );
  }
  if (text === 'ℹ️ راهنما') {
    const guide = await getSetting(db, 'guide_text', DEFAULTS.guide_text);
    const info = await getSetting(db, 'support_info', DEFAULTS.support_info);
    return sendMessage(env, chatId, guide + '\n\n' + info);
  }
  if (admin && text === '🛠 پنل مدیریت') return showAdminMenu(env, chatId);

  // ---------- دستیار هوشمند / پاسخ پیش‌فرض ----------
  if (text && !text.startsWith('/')) {
    const aiOn = (await getSetting(db, 'ai_enabled', '0')) === '1';
    if (aiOn && env.AI) {
      const reply = await aiReply(env, db, text);
      return sendMessage(env, chatId, esc(reply));
    }
    return sendMessage(env, chatId, '🤖 متوجه نشدم! لطفاً از منوی زیر استفاده کنید 👇', { reply_markup: mainMenuKb(admin) });
  }
}

// ============================================================
//  دستورات پایه
// ============================================================

async function cmdStart(env, chatId, db, admin, payload = '', user = null, origin = '') {
  if (user && Number(chatId) > 0) await setMiniAppMenuButton(env, chatId, origin);
  const buyMatch = /^buy_(\d{1,12})$/.exec(String(payload || ''));
  if (buyMatch && user) {
    if (Number(chatId) <= 0) return sendMessage(env, chatId, '🔐 برای ثبت سفارش و ارسال مبلغ پرداخت، گفت‌وگوی خصوصی ربات را باز کنید و از «🎮 محصولات» یا /start استفاده کنید.');
    return startPurchase(env, chatId, user, Number(buyMatch[1]), db);
  }
  const shopName = await getSetting(db, 'shop_name', DEFAULTS.shop_name);
  const welcome = await getSetting(db, 'welcome_text', DEFAULTS.welcome_text);
  const text = '🏪 <b>' + esc(shopName) + '</b>\n\n' + welcome;
  if(admin && Number(chatId)>0)await sendMessage(env,chatId,'🛠 دسترسی مدیریت شما فعال است.',{reply_markup:inlineKb([[btn('پنل مدیریت','adminhome')]])});
  return sendMessage(env, chatId, text, { reply_markup: mainMenuKb(admin) });
}

async function cmdClaim(env, chatId, user, db, text) {
  const parts = text.split(/\s+/);
  const code = (parts[1] || '').toUpperCase();
  const real = await ensureClaimCode(db);
  if (!code || code !== real.toUpperCase()) return sendMessage(env, chatId, '❌ کد مدیریت اشتباه است.');
  const ownerId = await getOwnerId(db);
  const alreadyAdmin = await isAdminUser(db, env, user.id);
  if (ownerId && Number(ownerId) !== Number(user.id) && !alreadyAdmin) {
    return sendMessage(env, chatId, 'برای دسترسی کامل به ربات و پنل، مالک فروشگاه باید شما را از بخش «مدیران» اضافه کند.');
  }
  await addAdmin(db, user.id);
  if (!ownerId) await setSetting(db, 'owner_user_id', String(user.id));
  await sendMessage(env, chatId, '🎉 تبریک! شما به‌عنوان مدیر فروشگاه اضافه شدید.\nاز دکمهٔ «🛠 پنل مدیریت» استفاده کنید.', {
    reply_markup: mainMenuKb(true),
  });
  return showAdminMenu(env, chatId);
}

// ============================================================
//  فروشگاه (مشتری)
// ============================================================

function shortButtonText(value, maxLength) {
  const chars = Array.from(String(value || ''));
  return chars.length > maxLength ? chars.slice(0, Math.max(1, maxLength - 1)).join('') + '…' : chars.join('');
}

function saleLabelFor(product, meta) {
  const entry = meta[String(product.id)] || meta[product.id] || {};
  return entry.sale_label === undefined ? '$1' : String(entry.sale_label || '').trim();
}

async function showShop(env, chatId, page, db, editMsgId = null) {
  const [games, products, meta] = await Promise.all([
    getGameCatalog(db), getProducts(db, true), getProductCatalogMeta(db),
  ]);
  const activeGames = games.filter((game) => game && game.active !== false);
  const hasUnassigned = products.some((product) => {
    const gameId = String((meta[String(product.id)] || {}).game_id || '');
    return !gameId;
  });
  const rows = [];
  for (let i = 0; i < activeGames.length; i += 2) {
    rows.push(activeGames.slice(i, i + 2).map((game) =>
      btn(String(game.emoji || '🎮') + ' ' + shortButtonText(game.name, 42), 'g:' + game.id)
    ));
  }
  if (hasUnassigned) rows.push([btn('📦 سایر محصولات', 'g:unassigned')]);
  rows.push([btn(TRUST, 'od')]);

  const text = '🎮 <b>محصولات</b>\nیک بازی را انتخاب کنید تا گزینه‌های موجود را ببینید 👇';
  if (editMsgId) return editMessageText(env, chatId, editMsgId, text, { reply_markup: inlineKb(rows) });
  return sendMessage(env, chatId, text, { reply_markup: inlineKb(rows) });
}

async function showGameProducts(env, chatId, gameId, page, db, editMsgId = null) {
  const [games, products, meta] = await Promise.all([
    getGameCatalog(db), getProducts(db, true), getProductCatalogMeta(db),
  ]);
  const unassigned = gameId === 'unassigned';
  const game = unassigned ? null : games.find((item) => String(item.id) === String(gameId) && item.active !== false);
  if (!unassigned && !game) return sendMessage(env, chatId, '❌ این بازی در فهرست فعال نیست.');
  const visible = products.filter((product) => {
    const assigned = String((meta[String(product.id)] || {}).game_id || '');
    return unassigned ? !assigned : assigned === String(gameId);
  });
  const title = unassigned ? 'سایر محصولات' : String(game.name || 'محصولات بازی');
  if (!visible.length) {
    const text = '🎮 <b>' + esc(title) + '</b>\n\nفعلاً محصولی برای این بخش ثبت نشده است. لطفاً بعداً سر بزنید.';
    const markup = inlineKb([[btn(TRUST, 'od')], [btn('🔙 فهرست بازی‌ها', 'glist')]]);
    if (editMsgId) return editMessageText(env, chatId, editMsgId, text, { reply_markup: markup });
    return sendMessage(env, chatId, text, { reply_markup: markup });
  }

  const pages = Math.ceil(visible.length / PAGE_SIZE);
  page = Math.max(0, Math.min(Number(page) || 0, pages - 1));
  const slice = visible.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const rows = slice.map((product) => {
    const label = shortButtonText(saleLabelFor(product, meta), 12);
    const suffix = (label ? ' · ' + label : '') + ' · ' + fmtMoney(product.price);
    const name = shortButtonText(product.name, Math.max(6, 57 - Array.from(suffix).length));
    return [btn(shortButtonText('🛍️ ' + name + suffix, 64), 'p:' + product.id)];
  });
  const nav = [];
  if (page > 0) nav.push(btn('⬅️ قبلی', 'gp:' + gameId + ':' + (page - 1)));
  if (pages > 1) nav.push(btn('📄 ' + toFa(page + 1) + ' از ' + toFa(pages), 'gp:' + gameId + ':' + page));
  if (page < pages - 1) nav.push(btn('بعدی ➡️', 'gp:' + gameId + ':' + (page + 1)));
  if (nav.length) rows.push(nav);
  rows.push([btn(TRUST, 'od')]);
  rows.push([btn('🔙 فهرست بازی‌ها', 'glist')]);
  const text = '🎮 <b>' + esc(title) + '</b>\nیک گزینه را انتخاب کنید 👇';
  if (editMsgId) return editMessageText(env, chatId, editMsgId, text, { reply_markup: inlineKb(rows) });
  return sendMessage(env, chatId, text, { reply_markup: inlineKb(rows) });
}

async function showOtherDollarDeals(env, chatId, db, editMsgId = null) {
  const deals = await getOtherDollarDeals(db);
  const lines = [esc(deals.intro || 'پیشنهادهای دیگر خریدهای ۱ دلاری:')];
  const rows = [];
  let offerCount = 0;
  for (const offer of deals.offers) {
    const title = String(offer.title || '').trim();
    if (!title) continue;
    offerCount++;
    const label = String(offer.sale_label || '$1').trim();
    lines.push('\n• <b>' + esc(title) + '</b>' + (label ? ' · ' + esc(label) : ''));
    if (offer.description) lines.push('\n' + esc(offer.description));
    if (offer.url && /^https:\/\//i.test(String(offer.url))) {
      rows.push([urlBtn('🔗 ' + shortButtonText(title, 48), String(offer.url), 'primary')]);
    }
  }
  if (!offerCount) lines.push('\n\nدر حال حاضر پیشنهاد دیگری ثبت نشده است.');
  rows.push([btn('🎮 بازگشت به محصولات', 'glist')]);
  const text = '💵 <b>خریدهای ۱ دلاری دیگر</b>\n\n' + lines.join('');
  if (editMsgId) return editMessageText(env, chatId, editMsgId, text, { reply_markup: inlineKb(rows) });
  return sendMessage(env, chatId, text, { reply_markup: inlineKb(rows) });
}

async function showProduct(env, chatId, productId, db) {
  const p = await getProductById(db, productId);
  if (!p || !p.active) return sendMessage(env, chatId, '❌ این محصول موجود نیست.');
  const meta = await getProductCatalogMeta(db);
  const label = saleLabelFor(p, meta);
  const priceText = (label ? '🏷️ برچسب فروش: <b>' + esc(label) + '</b>\n' : '') + '💰 قیمت پرداختی: <b>' + fmtMoney(p.price) + '</b>';
  const text = '🛍️ <b>' + esc(p.name) + '</b>\n\n' + (p.description ? esc(p.description) + '\n\n' : '') + priceText;
  const markup = inlineKb([[btn('🛒 خرید', 'buy:' + p.id)], [btn('🔙 بازگشت به فهرست بازی‌ها', 'glist')]]);
  if (p.photo_file_id) return sendPhoto(env, chatId, p.photo_file_id, text, { reply_markup: markup });
  return sendMessage(env, chatId, text, { reply_markup: markup });
}

async function showMyOrders(env, chatId, userId, db) {
  const orders = await getUserOrders(db, userId, 10);
  if (!orders.length) return sendMessage(env, chatId, '📦 شما هنوز سفارشی ثبت نکرده‌اید.');
  const lines = orders.map(
    (o) =>
      '🔖 <b>' + esc(o.order_code) + '</b> — ' + esc(o.product_name) + '\n💵 ' + fmtMoney(o.final_price) + ' | ' + (STATUS_LABELS[o.status] || o.status)
  );
  return sendMessage(env, chatId, '📦 <b>سفارش‌های من</b>\n\n' + lines.join('\n\n'));
}

// ============================================================
//  جریان خرید
// ============================================================

async function genOrderCode(db) {
  for (let i = 0; i < 10; i++) {
    const code = 'SH-' + genCode(6);
    const exists = await db.prepare('SELECT id FROM orders WHERE order_code = ?').bind(code).first();
    if (!exists) return code;
  }
  return 'SH-' + Date.now().toString(36).toUpperCase();
}

async function startPurchase(env, chatId, user, productId, db) {
  const p = await getProductById(db, productId);
  if (!p || !p.active) return sendMessage(env, chatId, '❌ این محصول موجود نیست.');
  const meta = await getProductCatalogMeta(db);
  const game=(meta[p.id]||{}).game_id || ''; const d={game, product_id:p.id,cost:(meta[p.id]||{}).cost};
  if(['codm','free-fire'].includes(game))return step(env,chatId,user,db,d,'region','ریجن اکانت شما چیست؟',[['asia','آسیا (خاورمیانه)'],...(game==='codm'?[['india','هند']]:[]),['eu','اروپا']]);
  if(game==='roblox')return step(env,chatId,user,db,d,'method','یکی از روش‌های ورود به اکانت را انتخاب کنید. رمز را در چت نفرستید.',[['email','Email + Password'],['username','Username + Password']]);
  if(modes[game]){d.method=modes[game];return step(env,chatId,user,db,d,'agree',d.method+'\nرمز یا کد ورود را در چت نفرستید.',[['yes','مشکلی ندارم ✅']]);}
  return nameStep(env,chatId,user,db,d);
}

async function proceedToPayment(env, chatId, user, data, db) {
  const p = await getProductById(db, data.product_id);
  if (!p) {
    await clearSession(db, user.id);
    return sendMessage(env, chatId, '❌ محصول یافت نشد.');
  }
  const discountAmount = data.discount_amount || 0;
  const finalPrice = Math.max(0, p.price - discountAmount);
  const meta = await getProductCatalogMeta(db);
  const saleLabel = saleLabelFor(p, meta);
  const summary =
    '🧾 <b>خلاصه خرید</b>\n' +
    '🛍️ محصول: ' + esc(p.name) + '\n' +
    (saleLabel ? '🏷️ برچسب فروش: ' + esc(saleLabel) + '\n' : '') +
    '💰 قیمت پایه: ' + fmtMoney(p.price) + '\n' +
    (discountAmount > 0 ? '🎟️ تخفیف: <b>-' + fmtMoney(discountAmount) + '</b>\n' : '') +
    '💵 مبلغ قابل پرداخت: <b>' + fmtMoney(finalPrice) + '</b>\n\n' +
    '💳 روش پرداخت را انتخاب کنید:';

  const payEnabled = (await getSetting(db, 'pay_enabled', '0')) === '1';
  const rows = [[btn('💳 کارت‌به‌کارت', 'pm:card')]];
  if (payEnabled) rows[0].push(btn('💻 پرداخت آنلاین', 'pm:online'));
  rows.push([btn('❌ لغو خرید', 'x')]);

  await setSession(db, user.id, 'buy_payment', {
    ...data,
    product_id: p.id,
    discount_code: data.discount_code || '',
    discount_amount: discountAmount,
    final_price: finalPrice,
  });
  if(!payEnabled)return choosePayment(env,chatId,user,'card',db,'');
  return sendMessage(env, chatId, summary, { reply_markup: inlineKb(rows) });
}

async function choosePayment(env, chatId, user, method, db, origin) {
  const sess = await getSession(db, user.id);
  if (!sess || sess.state !== 'buy_payment') {
    return sendMessage(env, chatId, '❌ نشست خرید منقضی شده است. لطفاً دوباره از فروشگاه خرید کنید.');
  }
  if (!['card','online'].includes(method)) return;
  if (method === 'online' && await getSetting(db,'pay_enabled','0') !== '1') return sendMessage(env,chatId,'درگاه آنلاین فعال نیست.');
  const token = crypto.randomUUID();
  await setSession(db,user.id,'buy_support_consent',{...sess.data,method,token});
  return sendMessage(env,chatId,'ادامهٔ خرید شما از طریق پشتیبانی انجام می‌شود. پس از تأیید پرداخت، آیدی پشتیبانی و توضیحات سفارش برای شما ارسال می‌شود.\n\nمبلغ: '+fmtMoney(sess.data.final_price)+'\nآیا موافقید؟',{reply_markup:inlineKb([[btn('موافقم ✅','consent:'+token)],[btn('لغو خرید ❌','x')]])});
}

async function acceptPayment(env,chatId,user,token,db,origin){
  const sess=await getSession(db,user.id);
  if(sess?.state!=='buy_support_consent' || sess.data.token!==token)return sendMessage(env,chatId,'این درخواست دیگر فعال نیست.');
  const d = sess.data;
  const method=d.method;
  const p = await getProductById(db, d.product_id);
  if (!p) {
    await clearSession(db, user.id);
    return sendMessage(env, chatId, '❌ محصول یافت نشد.');
  }

  if (method === 'card') {
    await setSession(db, user.id, 'buy_receipt', d);
    const cardNumber = await getSetting(db, 'card_number', DEFAULTS.card_number);
    const cardOwner = await getSetting(db, 'card_owner', DEFAULTS.card_owner);
    return sendMessage(
      env,
      chatId,
      '📸 لطفاً <b>رسید پرداخت</b> را ارسال کنید (عکس یا فایل).\n\n' +
        '💳 شماره کارت: <b>' + esc(cardNumber || '—') + '</b>\n' +
        '👤 به نام: ' + esc(cardOwner || '—') + '\n\n' +
        '💵 مبلغ: <b>' + fmtMoney(d.final_price) + '</b>\nپس از بررسی و تأیید رسید توسط مدیر، اطلاعات پشتیبانی برای شما ارسال می‌شود.',
      { reply_markup: cancelKb() }
    );
  }

  // پرداخت آنلاین
  const orderCode = await genOrderCode(db);
  const orderId = await createOrder(db, {
    details:d.details, commission:d.cost != null && d.cost!=='' ? Math.floor(Math.max(0,d.final_price-Number(d.cost))/10):0,
    order_code: orderCode,
    user_id: user.id,
    username: user.username || '',
    product_id: p.id,
    product_name: p.name,
    price: p.price,
    discount_code: d.discount_code,
    discount_amount: d.discount_amount,
    final_price: d.final_price,
    status: 'unpaid',
    payment_method: 'online',
  });
  await clearSession(db, user.id);

  const pay = await createPayment(env, db, { id: orderId, order_code: orderCode, final_price: d.final_price }, origin);
  if (!pay.ok) {
    await updateOrderStatus(db, orderId, 'rejected', 'خطا در اتصال به درگاه پرداخت');
    return sendMessage(env, chatId, '❌ متأسفانه اتصال به درگاه پرداخت برقرار نشد. لطفاً روش کارت‌به‌کارت را انتخاب کنید یا بعداً تلاش کنید.');
  }
  if (d.discount_code) await useDiscount(db, d.discount_code);

  return sendMessage(
    env,
    chatId,
    '💻 <b>پرداخت آنلاین</b>\n🧾 کد سفارش: <b>' + esc(orderCode) + '</b>\n💵 مبلغ: <b>' + fmtMoney(d.final_price) + '</b>\n\nروی دکمه زیر بزنید و پرداخت را انجام دهید 👇',
    { reply_markup: inlineKb([[urlBtn('💳 پرداخت', pay.url)], [btn('❌ لغو', 'x')]]) }
  );
}

async function handleReceipt(env, chatId, user, sess, media, db) {
  const d = sess.data;
  const p = await getProductById(db, d.product_id);
  if (!p) {
    await clearSession(db, user.id);
    return sendMessage(env, chatId, '❌ محصول یافت نشد.');
  }
  const orderCode = await genOrderCode(db);
  const orderId = await createOrder(db, {
    details:d.details, commission:d.cost != null && d.cost!=='' ? Math.floor(Math.max(0,d.final_price-Number(d.cost))/10):0,
    order_code: orderCode,
    user_id: user.id,
    username: user.username || '',
    product_id: p.id,
    product_name: p.name,
    price: p.price,
    discount_code: d.discount_code,
    discount_amount: d.discount_amount,
    final_price: d.final_price,
    status: 'pending',
    payment_method: 'card',
    receipt_file_id: media.file_id,
    receipt_type: media.type,
  });
  if (d.discount_code) await useDiscount(db, d.discount_code);
  await clearSession(db, user.id);

  const order = await getOrderById(db, orderId);
  await notifyCustomerOrderStatus(env, db, order);

  const adminText =
    '🧾 <b>سفارش جدید!</b>\n' +
    '🔖 کد سفارش: <b>' + esc(orderCode) + '</b>\n' +
    '👤 مشتری: ' + esc(user.first_name || '') + (user.username ? ' (@' + esc(user.username) + ')' : '') + '\n' +
    '🛍️ محصول: ' + esc(p.name) + '\n' +
    '💵 مبلغ: <b>' + fmtMoney(d.final_price) + '</b>' +
    (d.discount_code ? '\n🎟️ کد تخفیف: ' + esc(d.discount_code) : '');
  await notifyAdmins(env, db, adminText, {
    photo: media.type === 'photo' ? media.file_id : undefined,
    reply_markup: inlineKb([[btn('✅ تأیید', 'ok:' + orderId), btn('❌ رد', 'no:' + orderId)], [btn('🧾 جزئیات سفارش', 'o:' + orderId)]]),
  });

  return sendMessage(env, chatId, '✅ رسید شما دریافت شد و سفارش ثبت شد.\nپس از بررسی، نتیجه را اطلاع می‌دهیم.', { reply_markup: mainMenuKb(false) });
}

// ============================================================
//  مدیریت نشست‌ها (State)
// ============================================================

async function handleState(env, chatId, user, sess, input, db, ctx, origin, admin) {
  const { text, photo, doc } = input;
  const state = sess.state;
  const d = sess.data || {};

  // اگر دکمه منو زده شد، نشست را لغو و به منو برگرد
  if (MENU_TEXTS.includes(text)) {
    await clearSession(db, user.id);
    return false;
  }

  switch (state) {
    case 'other_game':
      if(!text || text.length>500)return sendMessage(env,chatId,'نام بازی و محصول را در حداکثر ۵۰۰ نویسه بنویسید.');
      await createTicket(db,user.id,user.username||'',OTHER+': '+text); await clearSession(db,user.id);await notifyAdmins(env,db,OTHER+' از '+user.id+'\n'+esc(text));return sendMessage(env,chatId,'درخواست شما برای بررسی ثبت شد.',{reply_markup:mainMenuKb(admin)});
    case 'flow_uid':
      if(!/^[a-zA-Z0-9_-]{3,40}$/.test(text))return sendMessage(env,chatId,'یو آیدی معتبر بازی را با حروف یا ارقام انگلیسی بفرستید.');return nameStep(env,chatId,user,db,{...d,uid:text});
    case 'flow_name':
      if(!text||text.length>80)return sendMessage(env,chatId,'فقط نام نمایشی اکانت (حداکثر ۸۰ نویسه) را بفرستید.');
      await setSession(db,user.id,'buy_discount',{...d,details:[d.region,d.method,d.uid && 'UID: '+d.uid,'نام اکانت: '+text].filter(Boolean).join(' | ')});
      return sendMessage(env,chatId,'کد تخفیف دارید؟',{reply_markup:inlineKb([[btn('بله','dc:yes'),btn('ندارم','dc:no')],[btn('لغو خرید','x')]])});
    case 'admin_join_identifier': {
      if (!admin) {
        await clearSession(db, user.id);
        return sendMessage(env, chatId, '⛔ دسترسی مدیریت عضویت اجباری ندارید.');
      }
      const channel = String(text || '').trim();
      if (!validJoinIdentifier(channel)) {
        return sendMessage(env, chatId, '❌ شناسه معتبر نیست. برای مورد عمومی @username یا برای گروه/کانال خصوصی شناسهٔ منفی مانند -1001234567890 را بفرستید:', { reply_markup: cancelKb() });
      }
      const channels = await getJoinChannels(db);
      if (channels.some((item) => item.channel === channel)) {
        await clearSession(db, user.id);
        return showAdminJoinSettings(env, chatId, db, 0, 'این شناسه قبلاً ثبت شده بود.');
      }
      if (channel.startsWith('@')) {
        channels.push({ channel, link: 'https://t.me/' + channel.slice(1) });
        await saveJoinChannels(db, channels);
        await clearSession(db, user.id);
        return showAdminJoinSettings(env, chatId, db, 0, 'کانال یا گروه عمومی اضافه شد.');
      }
      await setSession(db, user.id, 'admin_join_invite', { channel });
      return sendMessage(env, chatId, '🔗 پیوند دعوت HTTPS این گروه یا کانال خصوصی را بفرستید (مثلاً پیوند t.me).', { reply_markup: cancelKb() });
    }

    case 'admin_join_invite': {
      if (!admin) {
        await clearSession(db, user.id);
        return sendMessage(env, chatId, '⛔ دسترسی مدیریت عضویت اجباری ندارید.');
      }
      const link = String(text || '').trim();
      let parsedLink;
      try { parsedLink = new URL(link); } catch (e) {}
      if (!parsedLink || parsedLink.protocol !== 'https:') {
        return sendMessage(env, chatId, '❌ پیوند دعوت باید معتبر و با https:// شروع شود. دوباره بفرستید:', { reply_markup: cancelKb() });
      }
      const channels = await getJoinChannels(db);
      if (channels.some((item) => item.channel === d.channel)) {
        await clearSession(db, user.id);
        return showAdminJoinSettings(env, chatId, db, 0, 'این شناسه قبلاً ثبت شده بود.');
      }
      channels.push({ channel: d.channel, link });
      await saveJoinChannels(db, channels);
      await clearSession(db, user.id);
      return showAdminJoinSettings(env, chatId, db, 0, 'گروه یا کانال خصوصی اضافه شد.');
    }

    case 'ai_chat': {
      if (!text) return true;
      if ((await getSetting(db, 'ai_enabled', '0')) !== '1' || !env.AI) {
        await clearSession(db, user.id);
        return sendMessage(env, chatId, '🤖 دستیار هوشمند در دسترس نیست. لطفاً از بخش پشتیبانی پیام بگذارید.');
      }
      const history = Array.isArray(d.history) ? d.history.slice(-12) : [];
      const userText = text.slice(0, 1800);
      const reply = await aiReply(env, db, userText, history);
      history.push({ role: 'user', content: userText }, { role: 'assistant', content: String(reply || '') });
      await setSession(db, user.id, 'ai_chat', { history: history.slice(-12) });
      return sendMessage(env, chatId, esc(reply), { reply_markup: inlineKb([[btn('⏹ پایان گفت‌وگو', 'x', 'danger')]]) });
    }

    case 'track_order': {
      if (!text) return true;
      const o = await getOrderByCode(db, text);
      await clearSession(db, user.id);
      if (!o || o.user_id !== user.id) return sendMessage(env, chatId, '❌ سفارشی با این کد یافت نشد.');
      const t =
        '🔍 <b>نتیجه پیگیری سفارش</b>\n\n' +
        '🔖 کد سفارش: <b>' + esc(o.order_code) + '</b>\n' +
        '🛍️ محصول: ' + esc(o.product_name) + '\n' +
        '💵 مبلغ: ' + fmtMoney(o.final_price) + '\n' +
        '📊 وضعیت: ' + (STATUS_LABELS[o.status] || o.status) + '\n' +
        '🕐 تاریخ ثبت: ' + esc(o.created_at || '');
      return sendMessage(env, chatId, t);
    }

    case 'support_new': {
      if (!text) return true;
      const tid = await createTicket(db, user.id, user.username || '', text);
      await clearSession(db, user.id);
      await notifyAdmins(env, db, '🎧 <b>تیکت جدید پشتیبانی</b>\n🎫 شماره تیکت: #' + toFa(tid) + '\n👤 کاربر: ' + esc(user.username ? '@' + user.username : user.first_name || '') + '\n\n💬 ' + esc(text), {
        reply_markup: inlineKb([[btn('🎫 مشاهده تیکت', 't:' + tid)]]),
      });
      return sendMessage(env, chatId, '✅ پیام شما برای پشتیبانی ارسال شد.\nبه‌زودی پاسخ می‌دهیم. 🎧', { reply_markup: mainMenuKb(admin) });
    }

    case 'buy_discount_code': {
      if (!text) return true;
      const v = await validateDiscount(db, text);
      if (!v.ok) return sendMessage(env, chatId, v.error + '\n\nکد دیگری وارد کنید یا ❌ لغو بزنید:', { reply_markup: cancelKb() });
      const p = await getProductById(db, d.product_id);
      if (!p) {
        await clearSession(db, user.id);
        return sendMessage(env, chatId, '❌ محصول یافت نشد.');
      }
      const amount = calcDiscount(v.discount, p.price);
      await clearSession(db, user.id);
      return proceedToPayment(env, chatId, user, { ...d, product_id: p.id, discount_code: v.discount.code, discount_amount: amount }, db);
    }

    case 'buy_receipt': {
      const media = photo ? { file_id: photo.file_id, type: 'photo' } : doc ? { file_id: doc.file_id, type: 'document' } : null;
      if (!media) return sendMessage(env, chatId, '📸 لطفاً رسید پرداخت را به‌صورت <b>عکس یا فایل</b> ارسال کنید:', { reply_markup: cancelKb() });
      return handleReceipt(env, chatId, user, sess, media, db);
    }

    case 'buy_discount':
    case 'buy_payment': {
      return sendMessage(env, chatId, '👆 لطفاً از دکمه‌های بالا استفاده کنید یا ❌ لغو بزنید.', { reply_markup: cancelKb() });
    }

    case 'support_reply': {
      if (!text) return true;
      const t = await getTicketById(db, d.ticket_id);
      await clearSession(db, user.id);
      if (!t) return sendMessage(env, chatId, '❌ تیکت یافت نشد.');
      await db.prepare("UPDATE support_tickets SET status = 'answered', admin_reply = ? WHERE id = ?").bind(text, t.id).run();
      await sendMessage(env, t.user_id, '🎧 <b>پاسخ پشتیبانی</b> به تیکت #' + toFa(t.id) + ':\n\n' + esc(text));
      return sendMessage(env, chatId, '✅ پاسخ شما برای کاربر ارسال شد.');
    }

    // --- افزودن محصول از تلگرام (ادمین) ---
    case 'add_prod_photo': {
      if (!photo && !['⏭️ بدون عکس', '-', '/skip'].includes(text)) {
        return sendMessage(env, chatId, '📸 عکس محصول را بفرستید یا «بدون عکس» را بزنید:', {
          reply_markup: inlineKb([[btn('⏭️ بدون عکس', 'ap:nophoto', 'primary')], [btn('❌ لغو', 'x', 'danger')]]),
        });
      }
      await setSession(db, user.id, 'add_prod_name', { photo_file_id: photo ? photo.file_id : '' });
      return sendMessage(env, chatId, '✏️ نام محصول را بنویسید:', { reply_markup: cancelKb() });
    }
    case 'add_prod_name': {
      if (!text) return true;
      await setSession(db, user.id, 'add_prod_price', { ...d, name: text });
      return sendMessage(env, chatId, '💰 قیمت محصول را به <b>تومان</b> بنویسید (فقط عدد):', { reply_markup: cancelKb() });
    }
    case 'add_prod_price': {
      if (!text) return true;
      const price = parseInt(text.replace(/[^\d]/g, ''), 10);
      if (!price || price <= 0) return sendMessage(env, chatId, '❌ قیمت نامعتبر است. فقط عدد وارد کنید:', { reply_markup: cancelKb() });
      await setSession(db, user.id, 'add_prod_desc', { ...d, price });
      return sendMessage(env, chatId, '📝 توضیحات محصول را بنویسید (یا «-» برای رد کردن):', { reply_markup: cancelKb() });
    }
    case 'add_prod_desc': {
      if (!text) return true;
      await setSession(db, user.id, 'add_prod_delivery', { ...d, description: text === '-' ? '' : text });
      return sendMessage(env, chatId, '📦 متن تحویل کالا را بنویسید (این متن هنگام ارسال برای مشتری نمایش داده می‌شود):', { reply_markup: cancelKb() });
    }
    case 'add_prod_delivery': {
      if (!text) return true;
      const data = { ...d, delivery_text: text };
      await setSession(db, user.id, 'add_prod_confirm', data);
      const preview =
        '👀 <b>پیش‌نمایش محصول</b>\n\n' +
        '🛍️ نام: ' + esc(data.name) + '\n' +
        '💰 قیمت: ' + fmtMoney(data.price) + '\n' +
        '📝 توضیحات: ' + esc(data.description || '—') + '\n' +
        '📦 تحویل: ' + esc(data.delivery_text || '—') + '\n\n' +
        'آیا ثبت شود؟';
      const markup = inlineKb([[btn('✅ ثبت محصول', 'ap:yes', 'success'), btn('❌ لغو', 'x', 'danger')]]);
      if (data.photo_file_id) return sendPhoto(env, chatId, data.photo_file_id, preview, { reply_markup: markup });
      return sendMessage(env, chatId, preview, { reply_markup: markup });
    }

    // --- پیام جمعی (ادمین) ---
    case 'broadcast_text': {
      if (!text) return true;
      await setSession(db, user.id, 'broadcast_confirm', { text });
      return sendMessage(env, chatId, '📢 <b>پیش‌نمایش پیام جمعی:</b>\n\n' + esc(text) + '\n\nبرای همه کاربران ارسال شود؟', {
        reply_markup: inlineKb([[btn('📤 ارسال', 'bc:yes'), btn('❌ لغو', 'x')]]),
      });
    }
  }
  return false;
}

// ============================================================
//  پنل مدیریت (ادمین — داخل تلگرام)
// ============================================================

async function showAdminMenu(env, chatId) {
  const text = '🛠 <b>پنل مدیریت</b>\nیک بخش را انتخاب کنید 👇';
  return sendMessage(env, chatId, text, {
    reply_markup: inlineKb([
      [btn('📦 محصولات', 'a:prods'), btn('🧾 سفارش‌های جدید', 'a:orders')],
      [btn('🎧 تیکت‌های پشتیبانی', 'a:tickets'), btn('📊 آمار فروش', 'a:stats')],
      [btn('➕ محصول جدید', 'a:addprod'), btn('📢 پیام جمعی', 'a:broadcast')],
      [btn('📣 جوین اجباری/اسپانسر', 'a:join'), btn('⚙️ تنظیمات', 'a:settings')],
    ]),
  });
}

async function showAdminProducts(env, chatId, db) {
  const products = await getProducts(db, false);
  if (!products.length) return sendMessage(env, chatId, '📦 هنوز محصولی ثبت نشده است.\nاز «➕ محصول جدید» استفاده کنید.');
  const rows = products.map((p) => [btn((p.active ? '🟢 ' : '🔴 ') + p.name + ' — ' + toFa(p.price), 'ap:' + p.id)]);
  rows.push([btn('➕ محصول جدید', 'a:addprod')]);
  return sendMessage(env, chatId, '📦 <b>محصولات</b>\nبرای مدیریت روی یک محصول بزنید 👇', { reply_markup: inlineKb(rows) });
}

async function showAdminProductDetail(env, chatId, productId, db) {
  const p = await getProductById(db, productId);
  if (!p) return sendMessage(env, chatId, '❌ محصول یافت نشد.');
  const typeLabel = p.type === 'digital' ? 'دیجیتال' : p.type === 'physical' ? 'فیزیکی' : 'خدماتی';
  const text =
    '📦 <b>' + esc(p.name) + '</b>\n' +
    '💰 قیمت: ' + fmtMoney(p.price) + '\n' +
    '📌 نوع: ' + typeLabel + '\n' +
    '📊 وضعیت: ' + (p.active ? '🟢 فعال' : '🔴 غیرفعال') + '\n' +
    (p.description ? '\n📝 ' + esc(p.description) : '');
  const rows = [[btn(p.active ? '🔴 غیرفعال کردن' : '🟢 فعال کردن', 'at:' + p.id)], [btn('🔙 بازگشت به محصولات', 'a:prods')]];
  if (p.photo_file_id) return sendPhoto(env, chatId, p.photo_file_id, text, { reply_markup: inlineKb(rows) });
  return sendMessage(env, chatId, text, { reply_markup: inlineKb(rows) });
}

async function showAdminOrders(env, chatId, db) {
  const { results } = await db
    .prepare("SELECT * FROM orders WHERE status IN ('pending','unpaid') ORDER BY id DESC LIMIT 20")
    .all();
  if (!results.length) return sendMessage(env, chatId, '🧾 سفارش جدیدی وجود ندارد. 🎉');
  const rows = results.map((o) => [btn((o.status === 'unpaid' ? '💳 ' : '⏳ ') + o.order_code + ' — ' + o.product_name, 'o:' + o.id)]);
  return sendMessage(env, chatId, '🧾 <b>سفارش‌های جدید</b>\nبرای مشاهده روی سفارش بزنید 👇', { reply_markup: inlineKb(rows) });
}

async function showAdminOrderDetail(env, chatId, orderId, db) {
  const o = await getOrderById(db, orderId);
  if (!o) return sendMessage(env, chatId, '❌ سفارش یافت نشد.');
  const text =
    '🧾 <b>جزئیات سفارش</b>\n' +
    '🔖 کد: <b>' + esc(o.order_code) + '</b>\n' +
    '👤 مشتری: ' + esc(o.username || '') + ' (id: ' + toFa(o.user_id) + ')\n' +
    '🛍️ محصول: ' + esc(o.product_name) + '\n' +
    '💰 قیمت: ' + fmtMoney(o.price) + '\n' +
    (o.discount_amount > 0 ? '🎟️ تخفیف: -' + fmtMoney(o.discount_amount) + ' (' + esc(o.discount_code) + ')\n' : '') +
    '💵 مبلغ نهایی: <b>' + fmtMoney(o.final_price) + '</b>\n' +
    '💳 روش پرداخت: ' + (o.payment_method === 'online' ? 'آنلاین' : 'کارت‌به‌کارت') + '\n' +
    '📊 وضعیت: ' + (STATUS_LABELS[o.status] || o.status) + '\n' +
    esc(o.account_details || '') + '\n🕐 تاریخ: ' + esc(o.created_at || '');
  const rows = [];
  if (o.status === 'pending' || o.status === 'unpaid') {
    rows.push([btn('✅ تأیید', 'ok:' + o.id), btn('❌ رد', 'no:' + o.id)]);
  }
  if (o.status === 'confirmed') rows.push([btn('🚚 ارسال / تحویل', 'sh:' + o.id)]);
  if (o.status === 'shipped') rows.push([btn('🎉 تکمیل سفارش', 'dn:' + o.id)]);
  rows.push([btn('🔙 بازگشت', 'a:orders')]);
  if (o.receipt_file_id && o.receipt_type === 'photo') {
    return sendPhoto(env, chatId, o.receipt_file_id, text, { reply_markup: inlineKb(rows) });
  }
  if (o.receipt_file_id && o.receipt_type === 'document') {
    return sendDocument(env, chatId, o.receipt_file_id, text, { reply_markup: inlineKb(rows) });
  }
  return sendMessage(env, chatId, text, { reply_markup: inlineKb(rows) });
}

async function adminOrderAction(env, chatId, orderId, action, db) {
  const o = await getOrderById(db, orderId);
  if (!o) return sendMessage(env, chatId, '❌ سفارش یافت نشد.');
  const product = o.product_id ? await getProductById(db, o.product_id) : null;

  if (action === 'ok') {
    await updateOrderStatus(db, o.id, 'confirmed');
    o.status = 'confirmed';
    await notifyCustomerOrderStatus(env, db, o);
    await sendMessage(env, chatId, '✅ سفارش ' + esc(o.order_code) + ' تأیید شد و به مشتری اطلاع داده شد.');
  } else if (action === 'no') {
    await updateOrderStatus(db, o.id, 'rejected');
    o.status = 'rejected';
    await notifyCustomerOrderStatus(env, db, o);
    await sendMessage(env, chatId, '❌ سفارش ' + esc(o.order_code) + ' رد شد.');
  } else if (action === 'sh') {
    await updateOrderStatus(db, o.id, 'shipped');
    o.status = 'shipped';
    if (product) await sendDelivery(env, db, o, product);
    await notifyCustomerOrderStatus(env, db, o);
    await sendMessage(env, chatId, '🚚 کالا برای سفارش ' + esc(o.order_code) + ' ارسال شد.');
  } else if (action === 'dn') {
    await updateOrderStatus(db, o.id, 'completed');
    o.status = 'completed';
    await notifyCustomerOrderStatus(env, db, o);
    await sendMessage(env, chatId, '🎉 سفارش ' + esc(o.order_code) + ' تکمیل شد.');
  }
  return showAdminOrderDetail(env, chatId, o.id, db);
}

async function showAdminStats(env, chatId, db) {
  const total = await db.prepare('SELECT COUNT(*) c FROM orders').first();
  const pending = await db.prepare("SELECT COUNT(*) c FROM orders WHERE status IN ('pending','unpaid')").first();
  const revenue = await db.prepare("SELECT COALESCE(SUM(final_price),0) s FROM orders WHERE status IN ('confirmed','shipped','completed')").first();
  const prods = await db.prepare('SELECT COUNT(*) c FROM products').first();
  const users = await db.prepare('SELECT COUNT(*) c FROM users').first();
  const text =
    '📊 <b>آمار فروشگاه</b>\n\n' +
    '🧾 کل سفارش‌ها: ' + toFa(total.c) + '\n' +
    '⏳ سفارش‌های جدید: ' + toFa(pending.c) + '\n' +
    '💰 درآمد: <b>' + fmtMoney(revenue.s) + '</b>\n' +
    '📦 محصولات: ' + toFa(prods.c) + '\n' +
    '👥 کاربران: ' + toFa(users.c);
  return sendMessage(env, chatId, text, { reply_markup: inlineKb([[btn('🔙 بازگشت', 'a:menu')]]) });
}

async function showAdminTickets(env, chatId, db) {
  const { results } = await db.prepare("SELECT * FROM support_tickets WHERE status = 'open' ORDER BY id DESC LIMIT 20").all();
  if (!results.length) return sendMessage(env, chatId, '🎧 تیکت بازی وجود ندارد. 🎉');
  const rows = results.map((t) => [btn('🎫 تیکت #' + toFa(t.id) + ' — ' + (t.username ? '@' + t.username : 'کاربر ' + toFa(t.user_id)), 't:' + t.id)]);
  return sendMessage(env, chatId, '🎧 <b>تیکت‌های باز</b>\nبرای مشاهده روی تیکت بزنید 👇', { reply_markup: inlineKb(rows) });
}

async function showTicketDetail(env, chatId, ticketId, db) {
  const t = await getTicketById(db, ticketId);
  if (!t) return sendMessage(env, chatId, '❌ تیکت یافت نشد.');
  const statusLabel = t.status === 'open' ? '🟢 باز' : t.status === 'answered' ? '✅ پاسخ داده شده' : '🔴 بسته';
  const text =
    '🎫 <b>تیکت #' + toFa(t.id) + '</b>\n' +
    '👤 کاربر: ' + esc(t.username || '') + ' (id: ' + toFa(t.user_id) + ')\n' +
    '📊 وضعیت: ' + statusLabel + '\n\n' +
    '💬 پیام:\n' + esc(t.message) +
    (t.admin_reply ? '\n\n✍️ پاسخ شما:\n' + esc(t.admin_reply) : '');
  return sendMessage(env, chatId, text, {
    reply_markup: inlineKb([[btn('✍️ پاسخ دادن', 'tr:' + t.id)], [btn('🔙 بازگشت به تیکت‌ها', 'a:tickets')]]),
  });
}

async function showAdminJoinSettings(env, chatId, db, requestedPage = 0, notice = '') {
  const channels = await getJoinChannels(db);
  const enabled = (await getSetting(db, 'force_join_enabled', '0')) === '1';
  const pageCount = Math.max(1, Math.ceil(channels.length / JOIN_ADMIN_PAGE_SIZE));
  const page = Math.max(0, Math.min(Number(requestedPage) || 0, pageCount - 1));
  const first = page * JOIN_ADMIN_PAGE_SIZE;
  const visible = channels.slice(first, first + JOIN_ADMIN_PAGE_SIZE);
  const listText = visible.length
    ? visible.map((item, offset) => toFa(first + offset + 1) + '. <code>' + esc(item.channel) + '</code>\n   🔗 ' + esc(item.link || '—')).join('\n')
    : 'هنوز کانال یا گروهی ثبت نشده است.';
  const text =
    (notice ? '✅ ' + esc(notice) + '\n\n' : '') +
    '📣 <b>مدیریت کانال‌ها و گروه‌های اسپانسر / جوین اجباری</b>\n\n' +
    'وضعیت: ' + (enabled ? '🟢 فعال' : '🔴 غیرفعال') + '\n' +
    'تعداد ثبت‌شده: ' + toFa(channels.length) + ' · بدون سقف ثابت در برنامه\n\n' +
    'شناسهٔ عمومی: <code>@username</code>\nشناسهٔ خصوصی: عدد منفی گروه/کانال + پیوند دعوت HTTPS\nربات باید در همهٔ موارد دسترسی بررسی عضویت داشته باشد.\n\n' +
    listText + (pageCount > 1 ? '\n\nصفحهٔ ' + toFa(page + 1) + ' از ' + toFa(pageCount) : '');
  const rows = [
    [btn(enabled ? '⏸ خاموش‌کردن جوین اجباری' : '✅ روشن‌کردن جوین اجباری', 'aj:toggle', enabled ? 'danger' : 'success')],
    [btn('➕ افزودن کانال یا گروه', 'aj:add', 'primary')],
  ];
  visible.forEach((item, offset) => {
    rows.push([btn('🗑 حذف مورد ' + toFa(first + offset + 1), 'aj:del:' + (first + offset), 'danger')]);
  });
  if (pageCount > 1) {
    const nav = [];
    if (page > 0) nav.push(btn('⬅️ قبلی', 'aj:page:' + (page - 1)));
    nav.push(btn(toFa(page + 1) + ' از ' + toFa(pageCount), 'aj:page:' + page));
    if (page < pageCount - 1) nav.push(btn('بعدی ➡️', 'aj:page:' + (page + 1)));
    rows.push(nav);
  }
  rows.push([btn('🔙 بازگشت به پنل مدیریت', 'a:menu')]);
  return sendMessage(env, chatId, text, { reply_markup: inlineKb(rows) });
}

async function showAdminSettings(env, chatId, db) {
  const s = await getAllSettings(db);
  const channels = await getJoinChannels(db);
  const channelCount = channels.length;
  const text =
    '⚙️ <b>تنظیمات فروشگاه</b>\n\n' +
    '🏪 نام فروشگاه: ' + esc(s.shop_name) + '\n' +
    '💳 پرداخت آنلاین: ' + (s.pay_enabled === '1' ? '🟢 فعال' : '🔴 غیرفعال') + '\n' +
    '🤖 دستیار هوشمند: ' + (s.ai_enabled === '1' ? '🟢 فعال' : '🔴 غیرفعال') + '\n' +
    '📣 عضویت اجباری: ' + (s.force_join_enabled === '1' ? '🟢 فعال · ' + toFa(channelCount) + ' مورد' : '🔴 غیرفعال') + '\n' +
    '📱 مینی‌اپ: از دکمهٔ جداگانهٔ «' + MINIAPP_MENU_LABEL + '» کنار کادر پیام باز می‌شود.\n\n' +
    'برای افزودن یا حذف کانال و گروه، دکمهٔ مدیریت جوین اجباری را بزنید.\n<code>/admin</code>';
  return sendMessage(env, chatId, text, { reply_markup: inlineKb([[btn('📣 مدیریت کانال‌ها و گروه‌های اسپانسر/جوین', 'a:join')], [btn('🔙 بازگشت', 'a:menu')]]) });
}

// ============================================================
//  پردازش دکمه‌های اینلاین (Callback Query)
// ============================================================

async function handleCallback(cbq, env, ctx, origin) {
  const db = env.DB;
  const data = cbq.data || '';
  const chatId = cbq.message.chat.id;
  const msgId = cbq.message.message_id;
  const user = cbq.from;
  await answerCallback(env, cbq.id);
  const dataParts = data.split(':');
  const [head, arg] = dataParts;
  const admin = await isAdminUser(db, env, user.id);

  if (head === 'fj' && arg === 'check') {
    if (!admin && (await enforceJoin(env, db, chatId, user))) return;
    return resumePendingStart(env, chatId, db, admin, user, origin);
  }
  if (head === 'fj' && arg === 'page') {
    const page = Number(data.split(':')[2]) || 0;
    if (!admin && (await enforceJoin(env, db, chatId, user, page))) return;
    return resumePendingStart(env, chatId, db, admin, user, origin);
  }
  if (!admin && (await enforceJoin(env, db, chatId, user))) return;

  switch (head) {
    case 'adminhome': if(admin)return showAdminMenu(env,chatId);return;
    case 'm': {
      if (arg === 'shop') return showShop(env, chatId, 0, db);
      if (arg === 'orders') return showMyOrders(env, chatId, user.id, db);
      if (arg === 'help') {
        const guide = await getSetting(db, 'guide_text', DEFAULTS.guide_text);
        const info = await getSetting(db, 'support_info', DEFAULTS.support_info);
        return sendMessage(env, chatId, guide + '\n\n' + info);
      }
      return;
    }
    case 'p':
      return showProduct(env, chatId, Number(arg), db);
    case 'g':
      return showGameProducts(env, chatId, arg, 0, db, msgId);
    case 'gp':
      return showGameProducts(env, chatId, dataParts[1] || '', Number(dataParts[2] || 0), db, msgId);
    case 'glist':
      return showShop(env, chatId, 0, db);
    case 'od':
      return trustMessage(env,chatId,db);
    case 'pg':
      return showShop(env, chatId, Number(arg || 0), db, msgId);
    case 'buy':
      if (Number(chatId) <= 0) return sendMessage(env, chatId, '🔐 برای ثبت سفارش و ارسال مبلغ پرداخت، گفت‌وگوی خصوصی ربات را باز کنید و از «🎮 محصولات» یا /start استفاده کنید.');
      return startPurchase(env, chatId, user, Number(arg), db);
    case 'flow': return flowChoice(env,chatId,user,db,arg);
    case 'dc': {
      const sess = await getSession(db, user.id);
      if (!sess || sess.state !== 'buy_discount') return sendMessage(env, chatId, '❌ نشست خرید منقضی شده است.');
      if (arg === 'yes') {
        await setSession(db, user.id, 'buy_discount_code', sess.data);
        return sendMessage(env, chatId, '🎟️ کد تخفیف را وارد کنید:', { reply_markup: cancelKb() });
      }
      await clearSession(db, user.id);
      return proceedToPayment(env, chatId, user, sess.data, db);
    }
    case 'consent': return acceptPayment(env,chatId,user,arg,db,origin);
    case 'pm':
      return choosePayment(env, chatId, user, arg, db, origin);
    case 'x': {
      await clearSession(db, user.id);
      return sendMessage(env, chatId, '❌ عملیات لغو شد.', { reply_markup: mainMenuKb(admin) });
    }

    // ---------- ادمین ----------
    case 'a': {
      if (!admin) return sendMessage(env, chatId, '⛔ دسترسی ندارید.');
      if (arg === 'menu') return showAdminMenu(env, chatId);
      if (arg === 'prods') return showAdminProducts(env, chatId, db);
      if (arg === 'orders') return showAdminOrders(env, chatId, db);
      if (arg === 'tickets') return showAdminTickets(env, chatId, db);
      if (arg === 'stats') return showAdminStats(env, chatId, db);
      if (arg === 'settings') return showAdminSettings(env, chatId, db);
      if (arg === 'join') {
        if (Number(chatId) <= 0) return sendMessage(env, chatId, '🔐 برای حفاظت از پیوندهای دعوت، مدیریت جوین را در گفت‌وگوی خصوصی ربات باز کنید.');
        return showAdminJoinSettings(env, chatId, db);
      }
      if (arg === 'addprod') {
        await setSession(db, user.id, 'add_prod_photo', {});
        return sendMessage(env, chatId, '➕ <b>افزودن محصول جدید</b>\n\n📸 عکس محصول را بفرستید یا اگر عکس ندارید، گزینهٔ زیر را انتخاب کنید:', {
          reply_markup: inlineKb([[btn('⏭️ بدون عکس', 'ap:nophoto', 'primary')], [btn('❌ لغو', 'x', 'danger')]]),
        });
      }
      if (arg === 'broadcast') {
        await setSession(db, user.id, 'broadcast_text', {});
        return sendMessage(env, chatId, '📢 متن پیام جمعی را بنویسید:', { reply_markup: cancelKb() });
      }
      return;
    }
    case 'aj': {
      if (!admin) return sendMessage(env, chatId, '⛔ دسترسی ندارید.');
      if (Number(chatId) <= 0) return sendMessage(env, chatId, '🔐 برای حفاظت از پیوندهای دعوت، مدیریت جوین را در گفت‌وگوی خصوصی ربات باز کنید.');
      const parts = data.split(':');
      const action = parts[1] || '';
      if (action === 'page') return showAdminJoinSettings(env, chatId, db, Number(parts[2]) || 0);
      if (action === 'add') {
        await setSession(db, user.id, 'admin_join_identifier', {});
        return sendMessage(env, chatId, '➕ شناسهٔ عمومی @username یا شناسهٔ منفی گروه/کانال خصوصی را بفرستید. برای لغو /cancel را بزنید.', { reply_markup: cancelKb() });
      }
      if (action === 'toggle') {
        const enabled = (await getSetting(db, 'force_join_enabled', '0')) === '1';
        const channels = await getJoinChannels(db);
        if (!enabled && !channels.length) {
          return sendMessage(env, chatId, 'برای فعال‌کردن جوین اجباری، اول دست‌کم یک کانال یا گروه اضافه کنید.', {
            reply_markup: inlineKb([[btn('➕ افزودن کانال یا گروه', 'aj:add', 'primary')], [btn('🔙 بازگشت', 'a:menu')]]),
          });
        }
        if (!enabled && channels.some((item) => !item.link || !item.link.startsWith('https://'))) {
          return sendMessage(env, chatId, 'پیوند دعوت HTTPS همهٔ گروه‌ها و کانال‌های خصوصی را کامل کنید؛ سپس دوباره فعال کنید.');
        }
        await setSetting(db, 'force_join_enabled', enabled ? '0' : '1');
        return showAdminJoinSettings(env, chatId, db, 0, enabled ? 'جوین اجباری خاموش شد.' : 'جوین اجباری برای همهٔ موارد ثبت‌شده روشن شد.');
      }
      if (action === 'del') {
        const index = Number(parts[2]);
        const channels = await getJoinChannels(db);
        if (!Number.isInteger(index) || index < 0 || index >= channels.length) {
          return showAdminJoinSettings(env, chatId, db, 0, 'این مورد پیدا نشد؛ فهرست را تازه کردیم.');
        }
        const removed = channels[index];
        channels.splice(index, 1);
        await saveJoinChannels(db, channels);
        if (!channels.length && (await getSetting(db, 'force_join_enabled', '0')) === '1') {
          await setSetting(db, 'force_join_enabled', '0');
          await setSetting(db, 'phone_required', '0');
        }
        return showAdminJoinSettings(env, chatId, db, Math.floor(index / JOIN_ADMIN_PAGE_SIZE), 'حذف شد: ' + removed.channel + (channels.length ? '' : '؛ چون فهرست خالی شد، جوین اجباری هم خاموش شد.'));
      }
      return showAdminJoinSettings(env, chatId, db);
    }
    case 'ap': {
      if (!admin) return;
      if (arg === 'nophoto') {
        const sess = await getSession(db, user.id);
        if (!sess || sess.state !== 'add_prod_photo') return sendMessage(env, chatId, '❌ نشست افزودن محصول منقضی شده است.');
        await setSession(db, user.id, 'add_prod_name', { photo_file_id: '' });
        return sendMessage(env, chatId, '✏️ نام محصول را بنویسید:', { reply_markup: cancelKb() });
      }
      if (arg === 'yes') {
        const sess = await getSession(db, user.id);
        if (!sess || sess.state !== 'add_prod_confirm') return sendMessage(env, chatId, '❌ نشست منقضی شده است.');
        const d = sess.data;
        const added = await db
          .prepare('INSERT INTO products(name, description, price, photo_file_id, type, delivery_text, active) VALUES(?, ?, ?, ?, ?, ?, 1)')
          .bind(d.name, d.description || '', d.price, d.photo_file_id || '', 'digital', d.delivery_text || '')
          .run();
        let productId = Number(added && added.meta && added.meta.last_row_id) || 0;
        if (!productId) {
          const created = await db.prepare('SELECT id FROM products WHERE name = ? ORDER BY id DESC LIMIT 1').bind(d.name).first();
          productId = Number(created && created.id) || 0;
        }
        if (productId) {

          const meta = await getProductCatalogMeta(db);
          meta[String(productId)] = { game_id: '', sale_label: '$1' };
          await setProductCatalogMeta(db, meta);
        }
        await clearSession(db, user.id);
        await sendMessage(env, chatId, '✅ محصول «' + esc(d.name) + '» با موفقیت ثبت شد! 🎉');
        return showAdminProducts(env, chatId, db);
      }
      return showAdminProductDetail(env, chatId, Number(arg), db);
    }
    case 'at': {
      if (!admin) return;
      await db.prepare('UPDATE products SET active = 1 - active WHERE id = ?').bind(Number(arg)).run();
      return showAdminProductDetail(env, chatId, Number(arg), db);
    }
    case 'o': {
      if (!admin) return;
      return showAdminOrderDetail(env, chatId, Number(arg), db);
    }
    case 'ok':
    case 'no':
    case 'sh':
    case 'dn': {
      if (!admin) return;
      return adminOrderAction(env, chatId, Number(arg), head, db);
    }
    case 't': {
      if (!admin) return;
      return showTicketDetail(env, chatId, Number(arg), db);
    }
    case 'tr': {
      if (!admin) return;
      await setSession(db, user.id, 'support_reply', { ticket_id: Number(arg) });
      return sendMessage(env, chatId, '✍️ پاسخ خود را بنویسید:', { reply_markup: cancelKb() });
    }
    case 'bc': {
      if (!admin) return;
      const sess = await getSession(db, user.id);
      if (!sess || sess.state !== 'broadcast_confirm') return sendMessage(env, chatId, '❌ نشست منقضی شده است.');
      const text = sess.data.text;
      await clearSession(db, user.id);
      ctx.waitUntil(
        (async () => {
          const sent = await broadcastToAll(env, db, text);
          await sendMessage(env, chatId, '✅ پیام جمعی ارسال شد!\n📤 تعداد گیرندگان: ' + toFa(sent));
        })()
      );
      return sendMessage(env, chatId, '📢 در حال ارسال پیام جمعی...');
    }
  }
}
