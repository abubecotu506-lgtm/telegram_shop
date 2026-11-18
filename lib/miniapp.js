// ============================================================
//  مینی‌اپ موبایلی فروشگاه + API امن برای Telegram Mini Apps
// ============================================================
import { getProducts, getSetting, getVerifiedPhone, isAdminUser, getGameCatalog, getProductCatalogMeta, DEFAULTS } from './db.js';
import { tgApi } from './telegram.js';

const MINIAPP_HTML = String.raw`<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0d1015">
<meta name="color-scheme" content="dark light">
<title>ویترین</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Tahoma,Arial,sans-serif;color-scheme:dark;--bg:#0d1015;--surface:#151a23;--surface-2:#1c2330;--surface-3:#242c3b;--text:#f5f7fb;--muted:#a0a8b9;--muted-2:#788397;--line:rgba(255,255,255,.085);--accent:#a78bfa;--accent-2:#5eead4;--accent-ink:#181426;--danger:#fb7185;--shadow:0 18px 55px rgba(0,0,0,.28);--glow:rgba(139,92,246,.18);--topbar:rgba(13,16,21,.84)}
*{box-sizing:border-box}html{min-height:100%;scroll-behavior:smooth}body{margin:0;min-height:100vh;background:radial-gradient(700px 380px at 100% -10%,var(--glow),transparent 68%),radial-gradient(500px 300px at -10% 45%,rgba(45,212,191,.07),transparent 65%),var(--bg);color:var(--text);transition:background .25s,color .2s;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);-webkit-tap-highlight-color:transparent}button,input{font:inherit}button{color:inherit;cursor:pointer}button:focus-visible,input:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 65%,transparent);outline-offset:3px}.app-shell{width:min(100%,840px);min-height:100vh;margin:0 auto;padding:0 18px 34px}.topbar{height:74px;position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;background:linear-gradient(180deg,var(--topbar),color-mix(in srgb,var(--topbar) 72%,transparent));backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.brand{display:flex;align-items:center;gap:11px;min-width:0}.brand-mark{width:43px;height:43px;flex:0 0 43px;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--accent) 40%,var(--line));border-radius:15px;background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 27%,var(--surface)),var(--surface));box-shadow:0 7px 24px var(--glow);color:var(--accent);font-size:21px}.brand-copy{min-width:0}.brand-name{max-width:46vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px;font-weight:850;letter-spacing:-.3px}.brand-tagline{margin-top:3px;color:var(--muted);font-size:10px}.top-actions{display:flex;align-items:center;gap:8px}.icon-btn{width:39px;height:39px;border:1px solid var(--line);border-radius:14px;background:var(--surface);display:grid;place-items:center;font-size:16px;transition:.18s}.icon-btn:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--line));transform:translateY(-1px)}.lang-btn{min-width:39px;width:auto;padding:0 10px;color:var(--text);font-size:11px;font-weight:850}.theme-popover{position:absolute;top:64px;inset-inline-end:0;width:min(285px,calc(100vw - 36px));padding:13px;border:1px solid var(--line);border-radius:19px;background:var(--surface);box-shadow:var(--shadow);display:none}.theme-popover.open{display:block;animation:pop .16s ease-out}.popover-head{display:flex;justify-content:space-between;align-items:center;margin:0 2px 10px;font-size:12px;font-weight:800}.theme-options{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.theme-option{border:1px solid var(--line);border-radius:12px;padding:8px 4px;background:var(--surface-2);font-size:10px;display:flex;flex-direction:column;align-items:center;gap:6px}.theme-option.active{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}.swatch{width:22px;height:22px;border-radius:50%;border:2px solid rgba(255,255,255,.2)}.swatch-dark{background:linear-gradient(135deg,#151a23 50%,#a78bfa 50%)}.swatch-black{background:linear-gradient(135deg,#000 50%,#a3e635 50%)}.swatch-red{background:linear-gradient(135deg,#211013 50%,#fb445c 50%)}.swatch-white{background:linear-gradient(135deg,#fff 50%,#6554e8 50%)}
.hero{position:relative;overflow:hidden;min-height:218px;margin:9px 0 19px;padding:27px 24px;border:1px solid var(--line);border-radius:27px;background:linear-gradient(120deg,color-mix(in srgb,var(--accent) 19%,var(--surface)),var(--surface) 57%,color-mix(in srgb,var(--accent-2) 8%,var(--surface)));box-shadow:var(--shadow)}.hero:after{content:"";position:absolute;width:225px;height:225px;inset-inline-end:-50px;top:-85px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 30%,transparent),transparent 68%);filter:blur(4px);pointer-events:none}.hero-content{position:relative;z-index:1;max-width:520px}.hero-kicker{display:inline-flex;align-items:center;gap:7px;color:var(--accent);font-size:10px;font-weight:900;letter-spacing:.4px}.hero-kicker:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--accent-2);box-shadow:0 0 13px var(--accent-2)}.hero h1{max-width:480px;margin:13px 0 9px;font-size:clamp(24px,6.3vw,35px);line-height:1.4;letter-spacing:-1px}.hero p{max-width:450px;margin:0;color:var(--muted);font-size:12px;line-height:1.9}.hero-badge{display:inline-flex;align-items:center;gap:7px;margin-top:17px;padding:8px 11px;border:1px solid var(--line);border-radius:999px;background:color-mix(in srgb,var(--surface) 70%,transparent);font-size:10px;color:var(--muted)}.hero-badge b{color:var(--text);font-weight:800}.search-wrap{position:relative;margin:0 0 23px}.search-wrap .search-icon{position:absolute;top:50%;inset-inline-start:15px;transform:translateY(-50%);color:var(--muted-2);font-size:17px;pointer-events:none}.search-input{width:100%;height:51px;padding:0 46px 0 16px;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--text);font-size:12px;box-shadow:0 8px 24px rgba(0,0,0,.08);transition:.18s}.search-input::placeholder{color:var(--muted-2)}.search-input:focus{border-color:color-mix(in srgb,var(--accent) 62%,var(--line));box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 12%,transparent)}.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:0 2px 14px}.section-title{margin:0;font-size:17px;font-weight:900;letter-spacing:-.4px}.section-sub{margin-top:4px;color:var(--muted);font-size:10px}.count-pill{flex:0 0 auto;padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--muted);font-size:10px}.catalog-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.product-card{min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:19px;background:linear-gradient(180deg,var(--surface),color-mix(in srgb,var(--surface) 86%,var(--surface-2)));box-shadow:0 9px 25px rgba(0,0,0,.11);transition:transform .2s,border-color .2s,box-shadow .2s}.product-card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--accent) 35%,var(--line));box-shadow:var(--shadow)}.product-media{position:relative;aspect-ratio:1.15/1;overflow:hidden;background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 22%,var(--surface-2)),var(--surface-2) 52%,color-mix(in srgb,var(--accent-2) 16%,var(--surface-2)));display:grid;place-items:center}.media-art{width:100%;height:100%;display:grid;place-items:center;background:radial-gradient(circle at 28% 25%,color-mix(in srgb,var(--accent) 20%,transparent),transparent 40%),radial-gradient(circle at 78% 83%,color-mix(in srgb,var(--accent-2) 18%,transparent),transparent 45%)}.media-art span{width:64px;height:64px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.14);border-radius:22px;background:rgba(255,255,255,.06);font-size:28px;box-shadow:0 12px 25px rgba(0,0,0,.16)}.product-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .25s}.product-image.loaded{opacity:1}.product-body{padding:12px 12px 13px}.product-tag{display:inline-block;margin:0 0 6px;color:var(--accent);font-size:9px;font-weight:850}.product-name{display:-webkit-box;min-height:40px;margin:0;overflow:hidden;color:var(--text);font-size:12px;line-height:1.7;font-weight:850;-webkit-line-clamp:2;-webkit-box-orient:vertical}.product-row{display:flex;align-items:flex-end;justify-content:space-between;gap:7px;margin-top:11px}.product-price{min-width:0}.price-caption{display:block;color:var(--muted-2);font-size:9px;margin-bottom:3px}.price-value{display:block;white-space:nowrap;color:var(--text);font-size:12px;font-weight:900}.mini-btn{min-height:35px;padding:0 11px;border:0;border-radius:11px;background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 68%,var(--accent-2)));color:var(--accent-ink);font-size:10px;font-weight:900;box-shadow:0 6px 15px var(--glow);transition:transform .16s,filter .16s}.mini-btn:hover{transform:translateY(-1px);filter:brightness(1.06)}.empty-state{grid-column:1/-1;padding:34px 18px;text-align:center;border:1px dashed var(--line);border-radius:18px;background:color-mix(in srgb,var(--surface) 72%,transparent)}.empty-icon{width:55px;height:55px;margin:0 auto 12px;border-radius:19px;background:var(--surface-2);display:grid;place-items:center;font-size:24px}.empty-state h3{margin:0 0 6px;font-size:13px}.empty-state p{max-width:330px;margin:0 auto;color:var(--muted);font-size:11px;line-height:1.8}.skeleton{height:260px;border-radius:18px;background:linear-gradient(100deg,var(--surface) 30%,var(--surface-2) 50%,var(--surface) 70%);background-size:200% 100%;animation:shine 1.3s infinite}.footer-note{margin:23px 0 5px;padding:14px 5px;text-align:center;color:var(--muted-2);font-size:10px;line-height:1.7}.footer-note strong{color:var(--accent)}
.modal-overlay{position:fixed;inset:0;z-index:50;display:none;align-items:flex-end;justify-content:center;padding:14px 14px calc(14px + env(safe-area-inset-bottom));background:rgba(0,0,0,.62);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}.modal-overlay.open{display:flex}.detail-sheet{position:relative;width:min(100%,560px);max-height:min(88vh,760px);overflow:auto;border:1px solid var(--line);border-radius:25px;background:var(--surface);box-shadow:0 28px 80px rgba(0,0,0,.4);animation:sheetUp .2s ease-out}.modal-close{position:absolute;top:12px;inset-inline-end:12px;z-index:3;width:35px;height:35px;border:1px solid var(--line);border-radius:12px;background:rgba(10,12,16,.64);color:#fff;font-size:17px;display:grid;place-items:center}.modal-media{position:relative;height:min(48vh,330px);min-height:210px;overflow:hidden;border-radius:24px 24px 0 0;background:var(--surface-2)}.modal-media .product-image{width:100%;height:100%;object-fit:cover}.modal-content{padding:18px 19px 20px}.modal-kicker{margin:0 0 7px;color:var(--accent);font-size:10px;font-weight:850}.modal-title{margin:0;font-size:19px;line-height:1.6}.modal-price-line{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:15px 0;padding:13px;border:1px solid var(--line);border-radius:15px;background:var(--surface-2)}.modal-price-caption{color:var(--muted);font-size:10px}.modal-price{font-size:16px;font-weight:950}.modal-description{margin:0 0 17px;color:var(--muted);font-size:12px;line-height:1.95;white-space:pre-line}.buy-btn{width:100%;height:49px;border:0;border-radius:15px;background:linear-gradient(115deg,var(--accent),color-mix(in srgb,var(--accent) 55%,var(--accent-2)));color:var(--accent-ink);font-size:13px;font-weight:950;box-shadow:0 10px 26px var(--glow)}.buy-btn:active{transform:scale(.99)}.gate{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;padding:22px;background:rgba(7,9,13,.82);backdrop-filter:blur(16px)}.gate.show{display:flex}.gate-card{width:min(100%,390px);padding:26px;border:1px solid var(--line);border-radius:24px;background:var(--surface);text-align:center;box-shadow:var(--shadow)}.gate-icon{width:64px;height:64px;margin:0 auto 14px;border-radius:22px;background:var(--surface-2);display:grid;place-items:center;font-size:29px}.gate-card h2{margin:0 0 8px;font-size:18px}.gate-card p{margin:0;color:var(--muted);font-size:12px;line-height:1.9}.gate-card .mini-btn{margin-top:17px;min-height:42px;padding:0 18px}.toast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));z-index:100;max-width:calc(100% - 30px);padding:11px 15px;border:1px solid var(--line);border-radius:14px;background:var(--surface-3);color:var(--text);font-size:11px;box-shadow:var(--shadow);opacity:0;transform:translate(-50%,12px);pointer-events:none;transition:.2s}.toast.show{opacity:1;transform:translate(-50%,0)}
body[data-theme="black"]{--bg:#000;--surface:#0b0c0e;--surface-2:#15171a;--surface-3:#202329;--text:#f5f7f4;--muted:#a4a9a0;--muted-2:#737970;--accent:#bef264;--accent-2:#5eead4;--accent-ink:#151a0c;--line:rgba(255,255,255,.095);--glow:rgba(163,230,53,.13);--topbar:rgba(0,0,0,.85);color-scheme:dark}
body[data-theme="red"]{--bg:#100b0d;--surface:#1a1115;--surface-2:#25171c;--surface-3:#342026;--text:#fff5f6;--muted:#c2aeb2;--muted-2:#957e83;--accent:#fb7185;--accent-2:#fbbf24;--accent-ink:#310a12;--line:rgba(255,195,206,.11);--glow:rgba(244,63,94,.19);--topbar:rgba(16,11,13,.86);color-scheme:dark}
body[data-theme="white"]{--bg:#f4f5f9;--surface:#fff;--surface-2:#f0f1f7;--surface-3:#e8eaf2;--text:#191b26;--muted:#6c7183;--muted-2:#8b90a0;--accent:#635bdf;--accent-2:#0891b2;--accent-ink:#fff;--line:rgba(24,27,43,.1);--glow:rgba(99,91,223,.13);--topbar:rgba(244,245,249,.88);--shadow:0 18px 55px rgba(29,35,70,.12);color-scheme:light}
@keyframes shine{to{background-position:-200% 0}}@keyframes sheetUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes pop{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
@media(min-width:620px){.app-shell{padding-inline:26px}.hero{min-height:238px;padding:33px 31px}.catalog-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.product-body{padding:14px}.product-media{aspect-ratio:1/1}.modal-overlay{align-items:center}.detail-sheet{max-height:88vh}.hero h1{font-size:37px}}
@media(max-width:370px){.app-shell{padding-inline:12px}.topbar{height:68px}.brand-mark{width:38px;height:38px;flex-basis:38px}.brand-name{font-size:13px}.top-actions{gap:5px}.icon-btn{width:35px;height:35px;border-radius:12px}.catalog-grid{gap:8px}.product-body{padding:10px}.product-row{align-items:flex-start;flex-direction:column}.mini-btn{width:100%}.product-name{font-size:11px}}
</style>
</head>
<body data-theme="dark">
<div class="app-shell">
  <header class="topbar">
    <div class="brand"><div class="brand-mark" aria-hidden="true">✦</div><div class="brand-copy"><div id="brandName" class="brand-name">فروشگاه</div><div id="brandTagline" class="brand-tagline">خرید آسان، تجربه‌ای متفاوت</div></div></div>
    <div class="top-actions">
      <button id="langToggle" class="icon-btn lang-btn" type="button" aria-label="Change language">EN</button>
      <button id="themeToggle" class="icon-btn" type="button" aria-label="Theme settings">◐</button>
    </div>
    <div id="themePopover" class="theme-popover" aria-hidden="true">
      <div class="popover-head"><span id="themesLabel">پوستهٔ فروشگاه</span><span aria-hidden="true">🎨</span></div>
      <div class="theme-options">
        <button class="theme-option" data-theme-choice="dark" type="button"><span class="swatch swatch-dark"></span><span data-theme-label="dark">تیره</span></button>
        <button class="theme-option" data-theme-choice="black" type="button"><span class="swatch swatch-black"></span><span data-theme-label="black">مشکی</span></button>
        <button class="theme-option" data-theme-choice="red" type="button"><span class="swatch swatch-red"></span><span data-theme-label="red">قرمز</span></button>
        <button class="theme-option" data-theme-choice="white" type="button"><span class="swatch swatch-white"></span><span data-theme-label="white">روشن</span></button>
      </div>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-content">
        <div id="heroKicker" class="hero-kicker">ویترین هوشمند</div>
        <h1 id="heroTitle">چیزهای خوب، فقط یک لمس دورند</h1>
        <p id="heroDescription">محصول دلخواهتان را پیدا کنید و در چند قدم ساده سفارش دهید.</p>
        <div class="hero-badge"><span>✦</span><span id="heroBadge">تجربهٔ خرید سریع و امن</span></div>
      </div>
    </section>

    <div class="search-wrap">
      <span class="search-icon" aria-hidden="true">⌕</span>
      <input id="searchInput" class="search-input" type="search" autocomplete="off" aria-label="Search products" placeholder="جست‌وجوی محصول...">
    </div>

    <section aria-labelledby="sectionTitle">
      <div class="section-head">
        <div><h2 id="sectionTitle" class="section-title">محصولات فروشگاه</h2><div id="sectionSub" class="section-sub">انتخابی برای سلیقهٔ شما</div></div>
        <span id="productCount" class="count-pill">۰ محصول</span>
      </div>
      <div id="gameTabs" style="display:none;gap:8px;overflow-x:auto;margin:0 0 13px"></div>
      <div id="catalogGrid" class="catalog-grid"><div class="skeleton"></div><div class="skeleton"></div></div>
    </section>
    <div id="footerNote" class="footer-note">خرید امن و آسان، در <strong>فروشگاه شما</strong></div>
  </main>
</div>

<div id="detailOverlay" class="modal-overlay" aria-hidden="true">
  <section class="detail-sheet" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <button id="modalClose" class="modal-close" type="button" aria-label="Close">×</button>
    <div id="modalMedia" class="modal-media"><div class="media-art"><span>🛍️</span></div></div>
    <div class="modal-content">
      <div id="modalKicker" class="modal-kicker">✦</div>
      <h2 id="modalTitle" class="modal-title"></h2>
      <div class="modal-price-line"><span id="priceCaption" class="modal-price-caption">قیمت</span><strong id="modalPrice" class="modal-price"></strong></div>
      <p id="modalDescription" class="modal-description"></p>
      <button id="modalBuy" class="buy-btn" type="button">🛒 خرید از ربات</button>
    </div>
  </section>
</div>

<div id="connectionGate" class="gate" role="dialog" aria-modal="true">
  <div class="gate-card"><div class="gate-icon">📲</div><h2 id="gateTitle">فروشگاه را در تلگرام باز کنید</h2><p id="gateText">برای دیدن کالاها و خرید امن، این صفحه را از دکمهٔ مینی‌اپ در گفت‌وگوی ربات باز کنید.</p></div>
</div>
<div id="toast" class="toast" role="status" aria-live="polite"></div>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script>
(function(){
  'use strict';
  var DEFAULT_TEXTS={
    fa:{tagline:'خرید آسان، تجربه‌ای متفاوت',kicker:'ویترین هوشمند',headline:'چیزهای خوب، فقط یک لمس دورند',heroText:'محصول دلخواهتان را پیدا کنید و در چند قدم ساده سفارش دهید.',heroBadge:'تجربهٔ خرید سریع و امن',search:'جست‌وجوی محصول...',catalog:'محصولات فروشگاه',catalogSub:'انتخابی برای سلیقهٔ شما',gamesTitle:'بازی‌ها',gameCount:'بازی',backToGames:'بازگشت به فهرست بازی‌ها',otherProducts:'سایر محصولات',productCount:'محصول',details:'مشاهده',price:'قیمت',item:'کالا',emptyTitle:'هنوز محصولی اینجا نیست',emptyText:'به‌زودی محصولات تازه به فروشگاه اضافه می‌شوند. دوباره سر بزنید.',noResults:'محصولی با این عبارت پیدا نشد.',buy:'🛒 ادامهٔ خرید در ربات',close:'بستن',themes:'پوستهٔ فروشگاه',themeDark:'تیره',themeBlack:'مشکی',themeRed:'قرمز',themeWhite:'روشن',gateTitle:'فروشگاه را در تلگرام باز کنید',gateText:'برای دیدن کالاها و خرید امن، این صفحه را از دکمهٔ مینی‌اپ در گفت‌وگوی ربات باز کنید.',footer:'خرید امن و آسان، در',unavailable:'این محصول در حال حاضر موجود نیست.',botMissing:'پیوند ربات تنظیم نشده است؛ لطفاً از گفت‌وگوی ربات خرید را آغاز کنید.',loadError:'بارگذاری فروشگاه انجام نشد. اتصال را بررسی و دوباره تلاش کنید.',loading:'در حال بارگذاری محصولات...',noImage:'بدون عکس',productLabel:'محصول',botStart:'آغاز خرید در تلگرام',joinTitle:'برای ادامه عضو شوید',joinText:'برای مشاهدهٔ محصولات، در همهٔ کانال‌ها و گروه‌های زیر عضو شوید.',joinButton:'عضویت در کانال/گروه',checkJoin:'بررسی عضویت',phoneRequired:'برای ادامه، شمارهٔ همراه خود را در گفت‌وگوی ربات تأیید کنید.',openBot:'بازگشت به ربات و تأیید شماره',languageButton:'EN',switchLanguage:'تغییر زبان'},
    en:{tagline:'A smoother way to shop',kicker:'A smarter storefront',headline:'Good finds, just one tap away',heroText:'Find what you love and place an order in a few simple steps.',heroBadge:'Fast and secure shopping',search:'Search products...',catalog:'Shop products',catalogSub:'A little something for you',gamesTitle:'Games',gameCount:'games',backToGames:'Back to games',otherProducts:'Other products',productCount:'products',details:'View',price:'Price',item:'item',emptyTitle:'Nothing here just yet',emptyText:'New products will be added soon. Please check back.',noResults:'No products match that search.',buy:'🛒 Continue in bot',close:'Close',themes:'Store appearance',themeDark:'Dark',themeBlack:'Black',themeRed:'Red',themeWhite:'Light',gateTitle:'Open this shop in Telegram',gateText:'To browse products and place a secure order, open this page from the Mini App button in your bot chat.',footer:'Secure, simple shopping at',unavailable:'This product is currently unavailable.',botMissing:'The bot link is not configured. Please start your order in the bot chat.',loadError:'The shop could not be loaded. Check your connection and try again.',loading:'Loading products...',noImage:'No photo',productLabel:'Product',botStart:'Continue in Telegram',joinTitle:'Join to continue',joinText:'Join all of the channels and groups below to view the store.',joinButton:'Join channel/group',checkJoin:'Check membership',phoneRequired:'Verify your phone number in the bot chat to continue.',openBot:'Return to bot to verify',languageButton:'فا',switchLanguage:'Switch language'}
  };
  var allowedThemes=['dark','black','red','white'];
  var tg=window.Telegram&&window.Telegram.WebApp?window.Telegram.WebApp:null;
  var initData=tg&&tg.initData?tg.initData:'';
  var shopName='';
  var botUsername='';
  var photoToken='';
  var products=[];
  var games=[];
  var selectedGameId='';
  var selectedProduct=null;
  var customTexts={};
  var currentSearch='';
  var catalogLoaded=false;
  var lang=localStorage.getItem('shopMiniLang')==='en'?'en':'fa';
  var savedTheme=localStorage.getItem('shopMiniTheme')||'dark';
  var theme=allowedThemes.indexOf(savedTheme)>=0?savedTheme:'dark';
  var toastTimer=0;

  function byId(id){return document.getElementById(id)}
  function escapeHtml(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
  function txt(key){var custom=customTexts&&customTexts[lang]&&customTexts[lang][key];if(typeof custom==='string'&&custom.trim())return custom;return DEFAULT_TEXTS[lang][key]||DEFAULT_TEXTS.fa[key]||key}
  function setText(id,key){var el=byId(id);if(el)el.textContent=txt(key)}
  function faNumber(value){try{return new Intl.NumberFormat(lang==='fa'?'fa-IR':'en-US').format(Number(value)||0)}catch(e){return String(value||0)}}
  function money(value){return faNumber(value)+(lang==='fa'?' تومان':' Toman')}
  function photoMarkup(product,large){
    var cls=large?'modal-media':'product-media';
    var fallback='<div class="media-art"><span>🛍️</span></div>';
    if(!product.photo_file_id)return '<div class="'+cls+'">'+fallback+'</div>';
    return '<div class="'+cls+'">'+fallback+'<img class="product-image" data-file-id="'+escapeHtml(product.photo_file_id)+'" alt="'+escapeHtml(product.name)+'"></div>';
  }
  function setTheme(next){
    if(allowedThemes.indexOf(next)<0)return;
    theme=next;document.body.dataset.theme=theme;localStorage.setItem('shopMiniTheme',theme);
    var metaTheme=document.querySelector('meta[name="theme-color"]');if(metaTheme){var metaColors={dark:'#0d1015',black:'#000000',red:'#100b0d',white:'#f4f5f9'};metaTheme.setAttribute('content',metaColors[theme])}
    document.querySelectorAll('.theme-option').forEach(function(el){el.classList.toggle('active',el.dataset.themeChoice===theme)});
    if(tg){try{var colors={dark:'#0d1015',black:'#000000',red:'#100b0d',white:'#f4f5f9'};if(tg.setHeaderColor)tg.setHeaderColor(colors[theme]);if(tg.setBackgroundColor)tg.setBackgroundColor(colors[theme])}catch(e){}}
  }
  function applyCopy(){
    document.documentElement.lang=lang;document.documentElement.dir=lang==='fa'?'rtl':'ltr';document.title=(shopName?shopName+' · ':'')+txt('catalog');
    setText('brandTagline','tagline');setText('heroKicker','kicker');setText('heroTitle','headline');setText('heroDescription','heroText');setText('heroBadge','heroBadge');setText('sectionTitle','catalog');setText('sectionSub','catalogSub');setText('themesLabel','themes');setText('gateTitle','gateTitle');setText('gateText','gateText');setText('priceCaption','price');
    byId('searchInput').placeholder=txt('search');byId('searchInput').setAttribute('aria-label',txt('search'));
    byId('langToggle').textContent=txt('languageButton');
    byId('langToggle').setAttribute('aria-label',txt('switchLanguage'));byId('themeToggle').setAttribute('aria-label',txt('themes'));byId('modalClose').setAttribute('aria-label',txt('close'));
    var labels={dark:'themeDark',black:'themeBlack',red:'themeRed',white:'themeWhite'};
    document.querySelectorAll('[data-theme-label]').forEach(function(el){el.textContent=txt(labels[el.dataset.themeLabel])});
    byId('footerNote').innerHTML=escapeHtml(txt('footer'))+' <strong>'+escapeHtml(shopName||txt('productLabel'))+'</strong>';
    renderCatalog();
  }
  function imageHeaders(){return {'X-Telegram-Init-Data':initData}}
  async function hydrateImages(scope){
    if(!initData)return;
    var root=scope||document;
    var images=root.querySelectorAll('img[data-file-id]');
    for(var i=0;i<images.length;i++){
      (function(img){
        var fileId=img.dataset.fileId;
        fetch('/api/miniapp/photo?file_id='+encodeURIComponent(fileId)+'&photo_token='+encodeURIComponent(photoToken),{headers:imageHeaders()}).then(function(res){if(!res.ok)throw new Error('image');return res.blob()}).then(function(blob){var objectUrl=URL.createObjectURL(blob);img.onload=function(){img.classList.add('loaded');setTimeout(function(){URL.revokeObjectURL(objectUrl)},1000)};img.onerror=function(){URL.revokeObjectURL(objectUrl)};img.src=objectUrl}).catch(function(){img.remove()});
      })(images[i]);
    }
  }
  function renderCatalog(){
    var grid=byId('catalogGrid');if(!grid)return;
    if(!catalogLoaded){grid.innerHTML='<div class="skeleton"></div><div class="skeleton"></div>';return}
    var tabs=byId('gameTabs');
    var q=currentSearch.trim().toLocaleLowerCase(lang==='fa'?'fa-IR':'en-US');
    if(!selectedGameId){
      tabs.style.display='none';
      byId('sectionTitle').textContent=txt('gamesTitle');
      var visibleGames=games.filter(function(game){return !q||String(game.name||'').toLocaleLowerCase(lang==='fa'?'fa-IR':'en-US').indexOf(q)>=0});
      byId('productCount').textContent=faNumber(visibleGames.length)+' '+txt('gameCount');
      if(!games.length){grid.innerHTML='<div class="empty-state"><div class="empty-icon">🎮</div><h3>'+escapeHtml(txt('emptyTitle'))+'</h3><p>'+escapeHtml(txt('emptyText'))+'</p></div>';return}
      if(!visibleGames.length){grid.innerHTML='<div class="empty-state"><div class="empty-icon">⌕</div><h3>'+escapeHtml(txt('noResults'))+'</h3><p></p></div>';return}
      grid.innerHTML=visibleGames.map(function(game){
        var count=products.filter(function(p){return String(p.game_id||'')===String(game.id)}).length;
        var displayName=String(game.id)==='unassigned'?txt('otherProducts'):String(game.name||'');
        return '<button type="button" data-game-select="'+escapeHtml(game.id)+'" style="width:100%;min-height:105px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;padding:17px;border:1px solid var(--line);border-radius:19px;background:linear-gradient(145deg,var(--surface),var(--surface-2));text-align:start;box-shadow:0 9px 25px rgba(0,0,0,.11)"><span style="font-size:26px">'+escapeHtml(game.emoji||'🎮')+'</span><strong style="font-size:12px">'+escapeHtml(displayName)+'</strong><small style="color:var(--muted);font-size:10px">'+faNumber(count)+' '+escapeHtml(txt('productCount'))+'</small></button>';
      }).join('');
      return;
    }
    var selectedGame=games.find(function(game){return String(game.id)===String(selectedGameId)});
    if(!selectedGame){selectedGameId='';return renderCatalog()}
    var selectedTitle=String(selectedGame.id)==='unassigned'?txt('otherProducts'):String(selectedGame.name||'');
    tabs.style.display='flex';
    tabs.innerHTML='<button type="button" data-show-games="1" class="mini-btn" style="white-space:nowrap">← '+escapeHtml(txt('backToGames'))+'</button><span style="align-self:center;color:var(--muted);font-size:11px;font-weight:800">'+escapeHtml((selectedGame.emoji||'🎮')+' '+selectedTitle)+'</span>';
    byId('sectionTitle').textContent=selectedTitle||txt('catalog');
    var visible=products.filter(function(p){return String(p.game_id||'')===String(selectedGameId)&&(!q||(String(p.name||'')+' '+String(p.description||'')).toLocaleLowerCase(lang==='fa'?'fa-IR':'en-US').indexOf(q)>=0)});
    var count=visible.length;byId('productCount').textContent=faNumber(count)+' '+txt('productCount');
    if(!count){grid.innerHTML='<div class="empty-state"><div class="empty-icon">'+escapeHtml(selectedGame.emoji||'🎮')+'</div><h3>'+escapeHtml(txt('emptyTitle'))+'</h3><p>'+escapeHtml(txt('emptyText'))+'</p></div>';return}
    grid.innerHTML=visible.map(function(p){var label=String(p.sale_label||'').trim();return '<article class="product-card"><div class="product-media">'+(p.photo_file_id?'<div class="media-art"><span>✦</span></div><img class="product-image" data-file-id="'+escapeHtml(p.photo_file_id)+'" alt="'+escapeHtml(p.name)+'">':'<div class="media-art"><span>🛍️</span></div>')+'</div><div class="product-body"><div class="product-tag">✦ '+escapeHtml(label||txt('productLabel'))+'</div><h3 class="product-name">'+escapeHtml(p.name)+'</h3><div class="product-row"><div class="product-price"><span class="price-caption">'+escapeHtml(txt('price'))+'</span><span class="price-value">'+escapeHtml(money(p.price))+'</span></div><button class="mini-btn" type="button" data-product-open="'+Number(p.id)+'">'+escapeHtml(txt('details'))+'</button></div></div></article>'}).join('');
    hydrateImages(grid);
  }
  function openProduct(id){
    var p=products.find(function(item){return Number(item.id)===Number(id)});if(!p)return;
    var saleLabel=String(p.sale_label||'').trim();
    selectedProduct=p;byId('modalKicker').textContent='✦ '+(saleLabel||txt('productLabel'));byId('modalTitle').textContent=p.name||'';byId('modalPrice').textContent=money(p.price);byId('modalDescription').textContent=p.description||'';
    byId('modalDescription').style.display=p.description?'block':'none';
    byId('modalBuy').textContent=txt('buy');
    byId('modalMedia').innerHTML=p.photo_file_id?'<div class="media-art"><span>✦</span></div><img class="product-image" data-file-id="'+escapeHtml(p.photo_file_id)+'" alt="'+escapeHtml(p.name)+'">':'<div class="media-art"><span>🛍️</span></div>';
    byId('detailOverlay').classList.add('open');byId('detailOverlay').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';hydrateImages(byId('modalMedia'));
  }
  function closeProduct(){byId('detailOverlay').classList.remove('open');byId('detailOverlay').setAttribute('aria-hidden','true');document.body.style.overflow='';selectedProduct=null}
  function showToast(message){var el=byId('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.classList.remove('show')},2600)}
  function buySelected(){
    if(!selectedProduct)return;
    if(!botUsername){showToast(txt('botMissing'));return}
    var link='https://t.me/'+encodeURIComponent(botUsername)+'?start=buy_'+encodeURIComponent(String(selectedProduct.id));
    if(tg&&tg.openTelegramLink){tg.openTelegramLink(link)}else{window.location.href=link}
  }
  function showGate(message){if(message)byId('gateText').textContent=message;byId('connectionGate').classList.add('show')}
  function renderJoinRequired(payload){
    var grid=byId('catalogGrid');
    var phoneOnly=payload.error==='phone_required';
    var intro=phoneOnly?txt('phoneRequired'):txt('joinText');
    var html='<div class="empty-state"><div class="empty-icon">'+(phoneOnly?'🔐':'📣')+'</div><h3>'+escapeHtml(txt('joinTitle'))+'</h3><p>'+escapeHtml(intro)+'</p>';
    if(phoneOnly){html+='<button class="mini-btn" type="button" data-open-bot="1" style="margin-top:14px">'+escapeHtml(txt('openBot'))+'</button>'}
    else{
      var missing=Array.isArray(payload.missing)?payload.missing:[];
      html+='<div style="display:flex;flex-direction:column;gap:8px;margin:16px auto 0;max-width:360px">';
      missing.forEach(function(item,index){if(!item||!item.link)return;html+='<button class="mini-btn" type="button" data-join-link="'+escapeHtml(item.link)+'">📣 '+escapeHtml(txt('joinButton'))+' · '+escapeHtml(item.channel||faNumber(index+1))+'</button>'});
      html+='</div><button class="buy-btn" type="button" data-join-refresh="1" style="margin-top:12px">'+escapeHtml(txt('checkJoin'))+'</button>';
    }
    html+='</div>';grid.innerHTML=html;
  }
  async function loadCatalog(){
    if(tg){try{if(tg.ready)tg.ready();if(tg.expand)tg.expand()}catch(e){}}
    if(!initData){catalogLoaded=true;showGate(txt('gateText'));byId('catalogGrid').innerHTML='<div class="empty-state"><div class="empty-icon">📲</div><h3>'+escapeHtml(txt('gateTitle'))+'</h3><p>'+escapeHtml(txt('gateText'))+'</p></div>';return}
    try{
      var res=await fetch('/api/miniapp/catalog',{headers:imageHeaders(),credentials:'same-origin'});
      var payload=await res.json().catch(function(){return {}});
      shopName=String(payload.shop_name||shopName||'');botUsername=String(payload.bot_username||botUsername||'').replace(/^@/,'');photoToken=String(payload.photo_token||photoToken||'');customTexts=payload.miniapp_texts&&typeof payload.miniapp_texts==='object'?payload.miniapp_texts:customTexts;
      if(!res.ok){
        if(res.status===401){catalogLoaded=true;applyCopy();showGate(txt('gateText'));return}
        if(res.status===403&&(payload.error==='join_required'||payload.error==='phone_required')){catalogLoaded=true;byId('brandName').textContent=shopName||txt('productLabel');applyCopy();renderJoinRequired(payload);return}
        throw new Error(payload.error||txt('loadError'))
      }
      games=Array.isArray(payload.games)?payload.games:[];
      products=Array.isArray(payload.products)?payload.products.map(function(product){return Object.assign({},product,{game_id:String(product.game_id||'unassigned')})}):[];
      if(products.some(function(product){return product.game_id==='unassigned'}))games.push({id:'unassigned',name:txt('otherProducts'),emoji:'📦'});
      selectedGameId='';catalogLoaded=true;
      byId('brandName').textContent=shopName||txt('productLabel');applyCopy();
      renderCatalog();
    }catch(e){catalogLoaded=true;byId('catalogGrid').innerHTML='<div class="empty-state"><div class="empty-icon">⚠️</div><h3>'+escapeHtml(txt('loadError'))+'</h3><p>'+escapeHtml(txt('loadError'))+'</p></div>'}
  }
  document.addEventListener('click',function(event){
    var gameButton=event.target.closest('[data-game-select]');if(gameButton){selectedGameId=gameButton.dataset.gameSelect;currentSearch='';byId('searchInput').value='';renderCatalog();return}
    if(event.target.closest('[data-show-games]')){selectedGameId='';currentSearch='';byId('searchInput').value='';renderCatalog();return}
    var productButton=event.target.closest('[data-product-open]');if(productButton){openProduct(productButton.dataset.productOpen);return}
    var themeChoice=event.target.closest('[data-theme-choice]');if(themeChoice){setTheme(themeChoice.dataset.themeChoice);byId('themePopover').classList.remove('open');byId('themePopover').setAttribute('aria-hidden','true');return}
    var joinButton=event.target.closest('[data-join-link]');if(joinButton){var joinUrl=joinButton.dataset.joinLink;if(tg&&tg.openTelegramLink)tg.openTelegramLink(joinUrl);else window.open(joinUrl,'_blank','noopener');return}
    if(event.target.closest('[data-join-refresh]')){loadCatalog();return}
    if(event.target.closest('[data-open-bot]')){if(!botUsername){showToast(txt('botMissing'));return}var botUrl='https://t.me/'+encodeURIComponent(botUsername)+'?start=verify_phone';if(tg&&tg.openTelegramLink)tg.openTelegramLink(botUrl);else window.open(botUrl,'_blank','noopener');return}
  });
  byId('themeToggle').addEventListener('click',function(){var pop=byId('themePopover');var open=!pop.classList.contains('open');pop.classList.toggle('open',open);pop.setAttribute('aria-hidden',open?'false':'true')});
  byId('langToggle').addEventListener('click',function(){lang=lang==='fa'?'en':'fa';localStorage.setItem('shopMiniLang',lang);applyCopy()});
  byId('searchInput').addEventListener('input',function(){currentSearch=this.value;renderCatalog()});
  byId('modalClose').addEventListener('click',closeProduct);byId('detailOverlay').addEventListener('click',function(e){if(e.target===this)closeProduct()});byId('modalBuy').addEventListener('click',buySelected);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeProduct();byId('themePopover').classList.remove('open')}});
  document.addEventListener('click',function(e){if(!e.target.closest('#themePopover')&&!e.target.closest('#themeToggle')){byId('themePopover').classList.remove('open');byId('themePopover').setAttribute('aria-hidden','true')}});
  setTheme(theme);applyCopy();loadCatalog();
})();
</script>
</body>
</html>`;

export function renderMiniApp() {
  return new Response(MINIAPP_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://telegram.org; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://telegram.org https://*.telegram.org; base-uri 'none'; form-action 'self'",
    },
  });
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}

async function issuePhotoToken(userId, botToken) {
  const expires = Math.floor(Date.now() / 1000) + 15 * 60;
  const payload = String(userId) + '.' + String(expires);
  return payload + '.' + await hmacHex(botToken, payload);
}

async function verifyPhotoToken(token, userId, botToken) {
  if (!token || !botToken) return false;
  const parts = String(token).split('.');
  if (parts.length !== 3 || Number(parts[0]) !== Number(userId)) return false;
  const expires = Number(parts[1]);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(expires) || expires < now || expires > now + 16 * 60) return false;
  const expected = await hmacHex(botToken, parts[0] + '.' + parts[1]);
  return constantTimeEqual(parts[2], expected);
}

async function verifyInitData(initData, botToken) {
  if (!initData || !botToken || initData.length > 8192) return null;
  try {
    const params = new URLSearchParams(initData);
    const receivedHash = params.get('hash');
    const authDate = Number(params.get('auth_date'));
    if (!receivedHash || !Number.isFinite(authDate)) return null;
    const now = Math.floor(Date.now() / 1000);
    if (authDate > now + 60 || now - authDate > 24 * 60 * 60) return null;
    const userRaw = params.get('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (!user || !Number.isSafeInteger(Number(user.id)) || Number(user.id) <= 0) return null;
    const dataCheckString = Array.from(params.entries())
      .filter(([key]) => key !== 'hash')
      .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, value]) => key + '=' + value)
      .join('\n');
    const encoder = new TextEncoder();
    const firstKey = await crypto.subtle.importKey('raw', encoder.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const secretKey = await crypto.subtle.sign('HMAC', firstKey, encoder.encode(botToken));
    const secondKey = await crypto.subtle.importKey('raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const expectedHash = bytesToHex(await crypto.subtle.sign('HMAC', secondKey, encoder.encode(dataCheckString)));
    if (!constantTimeEqual(receivedHash.toLowerCase(), expectedHash)) return null;
    return { user, authDate };
  } catch (e) {
    return null;
  }
}

async function getBotUsername(env) {
  const configured = String(env.BOT_USERNAME || '').trim().replace(/^@/, '');
  if (configured) return configured;
  if (!env.BOT_TOKEN) return '';
  const me = await tgApi(env, 'getMe', {});
  return me && me.ok && me.result && me.result.username ? String(me.result.username) : '';
}

async function checkMiniAppJoin(env, userId) {
  if (await isAdminUser(env.DB, env, userId)) return { ok: true };
  if ((await getSetting(env.DB, 'force_join_enabled', '0')) !== '1') return { ok: true };
  if ((await getSetting(env.DB, 'phone_required', '0')) === '1') {
    let verified = null;
    try { verified = await getVerifiedPhone(env.DB, userId); } catch (e) {}
    if (!verified) return { ok: false, reason: 'phone_required' };
  }
  let channels = [];
  try {
    const raw = await getSetting(env.DB, 'force_join_channels', '[]');
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed)) channels = parsed;
  } catch (e) {}
  if (!channels.length) {
    const legacyChannel = String(await getSetting(env.DB, 'force_join_channel', '') || '').trim();
    const legacyLink = String(await getSetting(env.DB, 'force_join_link', '') || '').trim();
    if (legacyChannel) channels = [{ channel: legacyChannel, link: legacyLink }];
  }
  channels = channels.map((entry) => {
    const channel = String(entry && (entry.channel || entry.id) || '').trim();
    let link = String(entry && (entry.link || entry.url) || '').trim();
    if (!link && channel.startsWith('@')) link = 'https://t.me/' + channel.slice(1);
    return { channel, link };
  }).filter((entry) => entry.channel);
  if (!channels.length || channels.some((entry) => !/^https:\/\//i.test(entry.link))) return { ok: false, reason: 'join_config_error' };

  const missing = [];
  for (let offset = 0; offset < channels.length; offset += 10) {
    const batch = channels.slice(offset, offset + 10);
    const checks = await Promise.all(batch.map(async (entry) => ({
      entry,
      result: await tgApi(env, 'getChatMember', { chat_id: entry.channel, user_id: userId }),
    })));
    for (const check of checks) {
      if (!check.result || !check.result.ok || !check.result.result) return { ok: false, reason: 'membership_check_failed' };
      const member = check.result.result;
      const isMember = ['creator', 'administrator', 'member'].includes(member.status) || (member.status === 'restricted' && member.is_member === true);
      if (!isMember) missing.push(check.entry);
    }
  }
  return missing.length ? { ok: false, reason: 'join_required', missing } : { ok: true };
}

export async function handleMiniAppApi(request, env, url) {
  if (!['GET', 'HEAD'].includes(request.method)) return json({ ok: false, error: 'روش درخواست پشتیبانی نمی‌شود.' }, 405, { Allow: 'GET, HEAD' });
  const auth = await verifyInitData(request.headers.get('X-Telegram-Init-Data') || '', env.BOT_TOKEN);
  if (!auth) return json({ ok: false, error: 'نشست تلگرام معتبر یا تازه نیست. مینی‌اپ را دوباره از ربات باز کنید.' }, 401);

  if (url.pathname === '/api/miniapp/catalog') {
    const shopName = await getSetting(env.DB, 'shop_name', DEFAULTS.shop_name);
    const rawTexts = await getSetting(env.DB, 'miniapp_texts', '{}');
    let miniappTexts = {};
    try {
      const parsed = JSON.parse(rawTexts || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) miniappTexts = parsed;
    } catch (e) {}
    const access = await checkMiniAppJoin(env, auth.user.id);
    if (!access.ok) {
      const status = access.reason === 'membership_check_failed' ? 502 : access.reason === 'join_config_error' ? 503 : 403;
      return json({ ok: false, error: access.reason, missing: access.missing || [], shop_name: shopName, miniapp_texts: miniappTexts, bot_username: await getBotUsername(env) }, status);
    }
    const [rawGames, meta, products] = await Promise.all([
      getGameCatalog(env.DB), getProductCatalogMeta(env.DB), getProducts(env.DB, true),
    ]);
    const games = rawGames.filter((game) => game && game.active !== false);
    const gameIds = new Set(games.map((game) => String(game.id)));
    const allGameIds = new Set(rawGames.map((game) => String(game.id)));
    const catalogProducts = products.map((product) => {
      const item = meta[String(product.id)] || meta[product.id] || {};
      const gameId = String(item.game_id || '');
      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        photo_file_id: product.photo_file_id || '',
        game_id: gameId === 'unassigned' ? 'unassigned' : gameIds.has(gameId) ? gameId : allGameIds.has(gameId) ? 'inactive' : '',
        sale_label: item.sale_label === undefined ? '$1' : String(item.sale_label || ''),
      };
    }).filter((product) => product.game_id !== 'inactive');
    return json({
      ok: true,
      shop_name: shopName,
      bot_username: await getBotUsername(env),
      photo_token: await issuePhotoToken(auth.user.id, env.BOT_TOKEN),
      miniapp_texts: miniappTexts,
      games,
      products: catalogProducts,
    });
  }

  if (url.pathname === '/api/miniapp/photo') {
    const photoToken = url.searchParams.get('photo_token') || '';
    if (!(await verifyPhotoToken(photoToken, auth.user.id, env.BOT_TOKEN))) return json({ ok: false, error: 'نشست دریافت تصویر معتبر یا تازه نیست.' }, 403);
    const fileId = String(url.searchParams.get('file_id') || '');
    if (!fileId || fileId.length > 512) return json({ ok: false, error: 'شناسهٔ تصویر نامعتبر است.' }, 400);
    const owned = await env.DB.prepare('SELECT id FROM products WHERE active = 1 AND photo_file_id = ? LIMIT 1').bind(fileId).first();
    if (!owned) return json({ ok: false, error: 'تصویر پیدا نشد.' }, 404);
    const fileInfo = await tgApi(env, 'getFile', { file_id: fileId });
    const filePath = fileInfo && fileInfo.ok && fileInfo.result && fileInfo.result.file_path;
    if (!filePath || !env.BOT_TOKEN) return json({ ok: false, error: 'دریافت تصویر از تلگرام ناموفق بود.' }, 502);
    let upstream;
    try {
      upstream = await fetch('https://api.telegram.org/file/bot' + env.BOT_TOKEN + '/' + filePath);
    } catch (e) {
      return json({ ok: false, error: 'اتصال به تلگرام برقرار نشد.' }, 502);
    }
    if (!upstream.ok) return json({ ok: false, error: 'دریافت تصویر از تلگرام ناموفق بود.' }, 502);
    const contentType = upstream.headers.get('Content-Type') || 'image/jpeg';
    if (!contentType.toLowerCase().startsWith('image/')) return json({ ok: false, error: 'فایل محصول تصویر نیست.' }, 415);
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  return json({ ok: false, error: 'مسیر مینی‌اپ پیدا نشد.' }, 404);
}
