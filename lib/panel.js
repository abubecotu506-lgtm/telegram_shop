// ============================================================
//  پنل وب ادمین (HTML/CSS/JS داخل Worker)
// ============================================================

const PANEL_HTML = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>پنل مدیریت فروشگاه</title>
<style>
:root{--ink:#20233a;--muted:#858ba3;--line:#edf0f7;--paper:#fff;--canvas:#f5f6fb;--night:#171a30;--night2:#202342;--violet:#6957ee;--violet2:#8b68f8;--mint:#18b89b;--amber:#f7a640;--red:#e75b72;--blue:#4387e8;--shadow:0 14px 38px rgba(30,35,75,.08)}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:Vazirmatn,Tahoma,Arial,sans-serif;background:radial-gradient(circle at 88% 2%,rgba(124,102,245,.07),transparent 25%),var(--canvas);color:var(--ink);min-height:100vh}
button,input,select,textarea{font-family:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid rgba(105,87,238,.2);outline-offset:2px}
/* ورود */
#loginBox{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:22px;background:radial-gradient(circle at 18% 25%,rgba(37,214,188,.28),transparent 28%),radial-gradient(circle at 80% 75%,rgba(137,103,248,.36),transparent 32%),linear-gradient(135deg,#15182e,#24244e 55%,#342570)}
.login-card{position:relative;overflow:hidden;width:100%;max-width:430px;padding:42px 36px 32px;text-align:center;border:1px solid rgba(255,255,255,.62);border-radius:30px;background:rgba(255,255,255,.96);box-shadow:0 36px 100px rgba(5,8,30,.35)}
.login-card:before{content:'';position:absolute;width:220px;height:220px;border-radius:50%;background:rgba(105,87,238,.07);top:-145px;left:-85px}
.login-mark{position:relative;display:grid;place-items:center;width:74px;height:74px;margin:0 auto 18px;border-radius:24px;background:linear-gradient(135deg,#7566f2,#5a43d6);box-shadow:0 13px 30px rgba(105,87,238,.3);font-size:32px}
.login-kicker{color:var(--violet);font-size:11px;font-weight:900;letter-spacing:.2px;margin-bottom:9px}
.login-card h1{font-size:24px;line-height:1.5;margin-bottom:7px;font-weight:900;color:#20213d}
.login-card p{color:#858ba3;margin-bottom:24px;font-size:13px;line-height:1.9}
.login-card input{width:100%;padding:14px 16px;border:1px solid #e4e7f1;border-radius:14px;font-size:15px;margin-bottom:12px;text-align:center;background:#f9faff;transition:.2s}
.login-card input:focus{outline:none;border-color:var(--violet);box-shadow:0 0 0 4px rgba(105,87,238,.1);background:white}
.login-foot{border-top:1px solid var(--line);margin-top:22px;padding-top:16px;color:#9aa0b4;font-size:11px}
/* دکمه‌ها */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:12px;padding:10px 16px;font-size:13px;font-weight:800;transition:transform .18s,box-shadow .18s,opacity .18s;white-space:nowrap}
.btn:hover{transform:translateY(-2px);opacity:.96}.btn-primary{background:linear-gradient(135deg,var(--violet),#5743d4);color:#fff;box-shadow:0 7px 18px rgba(105,87,238,.22)}
.btn-success{background:linear-gradient(135deg,#20c4a0,#109b83);color:#fff;box-shadow:0 6px 15px rgba(24,184,155,.2)}.btn-danger{background:linear-gradient(135deg,#f07184,#dd4962);color:#fff}.btn-warning{background:linear-gradient(135deg,#ffbd63,#f2982c);color:#fff}.btn-gray{background:#f0f1f7;color:#4f536e;border:1px solid #e5e7f0}.btn-light{background:#fff;color:#5140ca}.btn-block{width:100%;padding:14px;font-size:15px}.btn-sm{padding:7px 10px;font-size:11px;border-radius:9px}
/* چارچوب */
#app{display:flex;min-height:100vh}
aside{width:270px;flex:0 0 270px;position:sticky;top:0;height:100vh;padding:21px 15px 16px;background:linear-gradient(180deg,#171a31 0%,#202241 55%,#211d43 100%);color:white;display:flex;flex-direction:column;box-shadow:8px 0 35px rgba(24,27,57,.08);z-index:20}
.logo{display:flex;align-items:center;gap:12px;padding:4px 9px 22px;border-bottom:1px solid rgba(255,255,255,.1);margin-bottom:18px}
.logo-mark{display:grid;place-items:center;width:46px;height:46px;border-radius:16px;background:linear-gradient(135deg,#8a77ff,#5f49dc);box-shadow:0 8px 22px rgba(105,87,238,.35);font-size:22px}
.logo strong{display:block;font-size:15px;font-weight:900}.logo small{display:block;margin-top:3px;font-size:10px;color:#a9aed0}
.nav-label{padding:11px 12px 6px;color:#8186aa;font-size:10px;font-weight:900;letter-spacing:.3px}
.nav-item{display:flex;align-items:center;gap:10px;padding:11px 13px;border:1px solid transparent;border-radius:13px;margin:2px 0;cursor:pointer;font-size:12px;font-weight:700;color:#c8cbe0;transition:.18s;user-select:none}
.nav-item span:first-child{display:grid;place-items:center;width:25px;font-size:17px}.nav-item span:last-child{flex:1}
.nav-item:hover{background:rgba(255,255,255,.07);color:white}.nav-item.active{color:white;background:linear-gradient(105deg,rgba(117,99,244,.32),rgba(105,87,238,.12));border-color:rgba(159,146,255,.18);box-shadow:inset -3px 0 0 #9d8cff}
.sidebar-footer{margin-top:auto;padding-top:12px;border-top:1px solid rgba(255,255,255,.1)}.sidebar-live{display:flex;align-items:center;gap:8px;padding:8px 12px;color:#9ea4c5;font-size:10px}.sidebar-live i,.live-pill i{display:inline-block;width:8px;height:8px;border-radius:50%;background:#25d3a2;box-shadow:0 0 0 4px rgba(37,211,162,.12)}.nav-item.logout{color:#f2a5b0;margin-top:5px}
main{flex:1;min-width:0;width:calc(100% - 270px);max-width:1700px;margin:0 auto;padding:22px 30px 48px}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px;padding:13px 17px;border:1px solid rgba(229,232,243,.85);border-radius:18px;background:rgba(255,255,255,.75);box-shadow:0 8px 25px rgba(31,35,70,.035);backdrop-filter:blur(12px)}
.topbar-copy{display:flex;align-items:center;gap:11px}.topbar-emblem{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:#f0edff;font-size:20px}.topbar-copy strong{display:block;font-size:13px;font-weight:900}.topbar-copy small{display:block;margin-top:3px;color:var(--muted);font-size:10px}.topbar-actions{display:flex;align-items:center;gap:10px}.live-pill{display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:999px;background:#effbf7;color:#178c74;font-size:10px;font-weight:900}.live-pill i{width:7px;height:7px}.btn-refresh{background:#f4f2ff;color:#5949ca;border:1px solid #e8e3ff;padding:8px 11px;font-size:11px}
#page{width:100%;min-width:0}.page-head{display:flex;align-items:center;gap:14px;margin:6px 0 20px}.page-head-icon{display:grid;place-items:center;width:52px;height:52px;flex:0 0 52px;border-radius:17px;background:linear-gradient(135deg,#eeebff,#f7f4ff);color:#5c4ada;font-size:24px;box-shadow:inset 0 0 0 1px rgba(105,87,238,.08)}.page-head h1{font-size:23px;line-height:1.4;font-weight:900;color:#222440}.page-head p{font-size:11px;color:var(--muted);margin-top:3px;line-height:1.7}
.page-title{font-size:21px;font-weight:900;margin:4px 0 17px;color:#20233f}.section-title{font-size:14px;font-weight:900;color:#282a47;margin:0}.section-subtitle{color:var(--muted);font-size:10px;margin-top:4px;line-height:1.7}.card-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.card{background:var(--paper);border:1px solid #eaedf5;border-radius:21px;box-shadow:var(--shadow);padding:20px;margin-bottom:17px;min-width:0;overflow-x:auto}.card-inner{min-width:0}
/* داشبورد */
.dashboard-hero{position:relative;display:flex;align-items:center;justify-content:space-between;gap:20px;overflow:hidden;min-height:195px;padding:25px 28px;margin-bottom:18px;border-radius:25px;color:white;background:radial-gradient(circle at 78% 30%,rgba(255,255,255,.2),transparent 17%),linear-gradient(120deg,#28275c 0%,#5141bf 55%,#8069ef 100%);box-shadow:0 18px 38px rgba(83,67,194,.2)}
.dashboard-hero:after{content:'';position:absolute;width:245px;height:245px;border:1px solid rgba(255,255,255,.16);border-radius:50%;left:42%;top:-125px;box-shadow:0 0 0 24px rgba(255,255,255,.035),0 0 0 49px rgba(255,255,255,.025)}
.hero-copy{position:relative;z-index:2;max-width:650px}.hero-eyebrow{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(255,255,255,.1);font-size:10px;font-weight:800;color:#eeebff}.hero-copy h1{font-size:24px;margin:12px 0 5px;font-weight:900}.hero-copy p{font-size:11px;color:#e0dcff;line-height:1.9;max-width:520px}.hero-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.hero-visual{position:relative;z-index:1;display:grid;place-items:center;width:112px;height:112px;flex:0 0 112px;border-radius:35px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 0 28px rgba(255,255,255,.08);font-size:49px;transform:rotate(-7deg)}
.stats-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin-bottom:18px}.stat{position:relative;display:flex;align-items:center;gap:13px;min-width:0;padding:16px;border:1px solid #eaedf5;border-radius:19px;background:linear-gradient(145deg,#fff,#fbfbff);box-shadow:0 8px 22px rgba(34,38,79,.045);overflow:hidden;transition:transform .2s,box-shadow .2s}.stat:hover{transform:translateY(-3px);box-shadow:0 14px 28px rgba(34,38,79,.09)}.stat:after{content:'';position:absolute;width:90px;height:90px;border-radius:50%;left:-42px;bottom:-57px;background:rgba(105,87,238,.06)}.stat-icon{display:grid;place-items:center;flex:0 0 48px;width:48px;height:48px;border-radius:15px;background:#f0edff;font-size:22px}.stat:nth-child(2) .stat-icon{background:#fff4e6}.stat:nth-child(3) .stat-icon{background:#e6faf4}.stat:nth-child(4) .stat-icon{background:#eaf3ff}.stat:nth-child(5) .stat-icon{background:#fff0f2}.stat:nth-child(6) .stat-icon{background:#f1efff}.stat-copy{min-width:0}.stat .lbl{color:var(--muted);font-size:10px;font-weight:700;margin-bottom:4px}.stat .num{font-size:19px;font-weight:900;color:#242641;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;direction:rtl}
.dashboard-grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(240px,.8fr);gap:17px}.quick-list{display:grid;gap:10px}.quick-item{display:flex;align-items:center;gap:11px;padding:12px;border:1px solid #f0f1f7;border-radius:15px;background:#fbfbfe}.quick-icon{display:grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border-radius:12px;background:#f1efff;font-size:18px}.quick-item:nth-child(2) .quick-icon{background:#fff2df}.quick-item:nth-child(3) .quick-icon{background:#e6faf4}.quick-info{min-width:0;flex:1}.quick-info strong{display:block;font-size:11px;color:#30324d}.quick-info small{display:block;margin-top:3px;color:var(--muted);font-size:9px}.quick-value{font-size:15px;font-weight:900;color:#5142c5}
/* جدول و نشان */
table{width:100%;min-width:680px;border-collapse:separate;border-spacing:0;font-size:12px}th{background:#f7f8fc;color:#777d96;text-align:right;padding:12px 13px;border-bottom:1px solid #e8ebf3;font-size:10px;font-weight:900;white-space:nowrap}th:first-child{border-radius:0 12px 0 0}th:last-child{border-radius:12px 0 0 0}td{padding:12px 13px;border-bottom:1px solid #f0f1f6;vertical-align:middle;color:#454862}tr:hover td{background:#fbfaff}tr:last-child td{border-bottom:0}.badge{display:inline-flex;align-items:center;gap:4px;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:900;white-space:nowrap}.b-pending{background:#fff4d8;color:#9c6900}.b-unpaid{background:#f0eaff;color:#6547c8}.b-confirmed{background:#ddf8ec;color:#14815f}.b-shipped{background:#e3f0ff;color:#316cb8}.b-completed{background:#e0f7e9;color:#287443}.b-rejected{background:#ffe8ec;color:#b43c50}.b-open{background:#ddf8ec;color:#14815f}.b-answered{background:#e3f0ff;color:#316cb8}.b-closed{background:#edf0f5;color:#62687c}.b-on{background:#ddf8ec;color:#14815f}.b-off{background:#ffe8ec;color:#b43c50}
/* فرم و بخش‌ها */
.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px}.join-channels{display:flex;flex-direction:column;gap:10px}.join-channel-row{display:grid;grid-template-columns:minmax(180px,1fr) minmax(240px,1.4fr) auto;gap:12px;align-items:center;padding:12px;border:1px solid #e8eaf2;border-radius:15px;background:#fafbff}.join-channel-row .field{min-width:0}.join-channel-row .join-remove{align-self:center}.miniapp-copy-block{margin-top:10px;padding:13px;border:1px solid #e9eaf2;border-radius:15px;background:#fbfbfe}.miniapp-copy-block summary{cursor:pointer;font-size:12px;font-weight:900;color:#5142c5}.miniapp-copy-block .form-grid{padding-top:4px}.field label{display:block;font-size:11px;font-weight:900;color:#555a75;margin-bottom:7px}.field input,.field select,.field textarea{width:100%;padding:11px 13px;border:1px solid #e2e5ef;border-radius:12px;font-size:12px;color:#292b47;background:#fbfcff;transition:.18s}.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:#8574f5;box-shadow:0 0 0 4px rgba(105,87,238,.09);background:#fff}.field textarea{min-height:92px;resize:vertical;line-height:1.8}.field.full{grid-column:1/-1}.check-row{display:flex;align-items:center;gap:11px;padding:13px 14px;background:#f8f8ff;border:1px solid #edecfb;border-radius:14px}.check-row input{width:19px;height:19px;accent-color:var(--violet)}.check-row b{font-size:11px}.hint{font-size:10px;color:#9398ad;margin-top:5px;line-height:1.7}.section-title{display:flex;align-items:center;gap:8px}.section-title .title-icon{display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:#f1efff;font-size:15px}.actions{display:flex;gap:8px;justify-content:flex-start;margin-top:15px;flex-wrap:wrap}.flex{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.mt{margin-top:14px}.empty{text-align:center;color:#999eb1;padding:30px 15px;font-size:12px}.loading{text-align:center;color:#8990a7;padding:42px;font-size:13px}
/* پنجره و پیام */
.modal-overlay{position:fixed;inset:0;background:rgba(15,17,36,.62);display:flex;align-items:center;justify-content:center;padding:16px;z-index:50;backdrop-filter:blur(6px)}.modal{background:#fff;border:1px solid rgba(255,255,255,.6);border-radius:24px;padding:24px;width:100%;max-width:600px;max-height:90vh;overflow:auto;box-shadow:0 28px 80px rgba(0,0,0,.23)}.modal h3{font-size:16px;font-weight:900;margin-bottom:16px;color:#242641}.modal .actions{display:flex;gap:8px;justify-content:flex-start;margin-top:18px;flex-wrap:wrap}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#117e68;color:#fff;padding:12px 20px;border-radius:13px;font-size:12px;font-weight:900;box-shadow:0 14px 34px rgba(0,0,0,.2);z-index:100;animation:slideUp .25s;max-width:90vw;text-align:center}.toast.err{background:#b43c50}@keyframes slideUp{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}
.thumb{width:46px;height:46px;object-fit:cover;border-radius:12px}.tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 14px;padding:2px 1px;overflow-x:auto;scrollbar-width:thin}.tab{display:inline-flex;align-items:center;justify-content:center;gap:6px;flex:0 0 auto;padding:9px 12px;border:1px solid #e4e7f0;border-radius:12px;background:#fff;color:#717790;font-size:11px;font-weight:800;white-space:nowrap;cursor:pointer;transition:.18s}.tab:hover{background:#f8f7ff;border-color:#d8d1ff;color:#5947cf}.tab.active{background:#f0edff;border-color:#d7d0ff;color:#5642d3;box-shadow:inset 0 0 0 1px rgba(105,87,238,.05)}
@media(max-width:1100px){aside{width:235px;flex-basis:235px}main{width:calc(100% - 235px);padding:20px}.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboard-grid{grid-template-columns:1fr}}
@media(max-width:780px){#app{flex-direction:column}aside{position:fixed;top:auto;bottom:0;right:0;left:0;width:100%;height:78px;flex:0 0 78px;padding:7px 8px calc(7px + env(safe-area-inset-bottom));border-radius:19px 19px 0 0;display:flex;flex-direction:row;align-items:center;gap:4px;overflow-x:auto;overflow-y:hidden;box-shadow:0 -10px 32px rgba(22,25,52,.18)}.logo,.nav-label,.sidebar-live{display:none}.sidebar-footer{display:flex;flex:0 0 auto;margin:0;padding:0;border:0}.nav-item{flex:0 0 auto;min-width:63px;min-height:58px;display:flex;flex-direction:column;justify-content:center;gap:3px;padding:6px 7px;margin:0;border-radius:13px;font-size:9px;text-align:center}.nav-item span:first-child{width:auto;font-size:18px}.nav-item span:last-child{flex:none;white-space:nowrap}.nav-item.active{box-shadow:inset 0 -3px 0 #9d8cff}.nav-item.logout{flex:0 0 auto;min-width:63px;min-height:58px;display:flex;flex-direction:column;justify-content:center;gap:3px;padding:6px 7px;margin:0;border-radius:13px;font-size:9px;text-align:center}.nav-item.logout span:first-child{width:auto;font-size:18px}.nav-item.logout span:last-child{flex:none;white-space:nowrap}main{width:100%;max-width:none;padding:12px 12px 104px}.topbar{position:sticky;top:0;z-index:15;padding:9px 11px;margin-bottom:15px;border-radius:15px}.topbar-emblem{width:35px;height:35px;font-size:17px}.topbar-copy strong{font-size:11px}.topbar-copy small{font-size:9px}.live-pill{padding:7px 8px;font-size:9px}.btn-refresh{padding:7px 8px;font-size:10px}.page-head{margin:3px 0 15px;gap:10px}.page-head-icon{width:43px;height:43px;flex-basis:43px;border-radius:14px;font-size:20px}.page-head h1{font-size:19px}.page-head p{font-size:10px}.tabs{flex-wrap:nowrap;gap:6px;margin-bottom:11px;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}.tab{padding:8px 10px;font-size:10px}.card{padding:15px;border-radius:17px;margin-bottom:13px}.dashboard-hero{min-height:170px;padding:18px;border-radius:20px}.hero-copy h1{font-size:19px}.hero-copy p{font-size:10px}.hero-visual{width:76px;height:76px;flex-basis:76px;border-radius:25px;font-size:34px}.hero-actions .btn{padding:9px 11px;font-size:10px}.stats-grid{gap:9px;margin-bottom:13px}.stat{padding:12px;gap:9px;border-radius:15px}.stat-icon{width:39px;height:39px;flex-basis:39px;border-radius:12px;font-size:18px}.stat .num{font-size:16px}.stat .lbl{font-size:9px}.dashboard-grid{gap:12px}.quick-item{padding:10px}.modal{padding:18px;border-radius:19px}.join-channel-row{grid-template-columns:1fr;gap:8px}.join-channel-row .join-remove{justify-self:start}}
@media(max-width:430px){.topbar-actions{gap:5px}.live-pill{gap:5px}.live-pill i{width:6px;height:6px}.topbar-copy small{display:none}.dashboard-hero{align-items:flex-start}.hero-visual{position:absolute;left:13px;bottom:14px;opacity:.35}.hero-copy{max-width:100%}.hero-copy p{max-width:80%}.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.form-grid{grid-template-columns:1fr}.page-head h1{font-size:17px}}
</style>
</head>
<body>

<div id="loginBox" style="display:none">
  <div class="login-card">
    <div class="login-mark">🛍️</div>
    <div class="login-kicker">پنل امن مدیریت فروشگاه</div>
    <h1>خوش آمدی</h1>
    <p>برای مدیریت سفارش‌ها، محصولات و مشتریان، رمز ورود خود را وارد کن.</p>
    <form id="loginForm">
      <input type="password" id="loginPass" placeholder="رمز عبور پنل" autocomplete="current-password">
      <button class="btn btn-primary btn-block" type="submit">🔐 ورود به پنل</button>
    </form>
    <div class="login-foot">دسترسی امن فروشگاه شما</div>
  </div>
</div>

<div id="app" style="display:none">
  <aside>
    <div class="logo"><div class="logo-mark">🛍️</div><div><strong>فروشگاه من</strong><small>پنل مدیریت هوشمند</small></div></div>
    <div class="nav-label">نمای کلی</div>
    <div class="nav-item" data-action="nav" data-page="dashboard"><span>📊</span><span>داشبورد</span></div>
    <div class="nav-label">فروش و سفارش‌ها</div>
    <div class="nav-item" data-action="nav" data-page="products"><span>📦</span><span>محصولات</span></div>
    <div class="nav-item" data-action="nav" data-page="orders"><span>🧾</span><span>سفارش‌ها</span></div>
    <div class="nav-item" data-action="nav" data-page="discounts"><span>🎟️</span><span>کدهای تخفیف</span></div>
    <div class="nav-label">ارتباط با مشتری</div>
    <div class="nav-item" data-action="nav" data-page="tickets"><span>🎧</span><span>پشتیبانی</span></div>
    <div class="nav-item" data-action="nav" data-page="broadcast"><span>📢</span><span>پیام جمعی</span></div>
    <div class="nav-label">مدیریت فروشگاه</div>
    <div class="nav-item" data-action="nav" data-page="reports"><span>📈</span><span>گزارش‌ها</span></div>
    <div class="nav-item" data-action="nav" data-page="settings"><span>⚙️</span><span>تنظیمات</span></div>
    <div class="nav-item" data-action="nav" data-page="admins" data-owner-only><span>👑</span><span>مدیران</span></div>
    <div class="nav-item" data-action="nav" data-page="backup" data-owner-only><span>💾</span><span>پشتیبان‌گیری</span></div>
    <div class="sidebar-footer">
      <div class="sidebar-live"><i></i><span>سامانه فروشگاه آماده است</span></div>
      <div class="nav-item logout" data-action="logout"><span>🚪</span><span>خروج از پنل</span></div>
    </div>
  </aside>
  <main>
    <header class="topbar">
      <div class="topbar-copy"><span class="topbar-emblem">✨</span><div><strong>مرکز مدیریت فروشگاه</strong><small>همه‌چیز برای مدیریت بهتر آماده است</small></div></div>
      <div class="topbar-actions"><span class="live-pill"><i></i>سامانه فعال</span><button class="btn btn-refresh" data-action="refresh">⟳ تازه‌سازی</button></div>
    </header>
    <div id="page"></div>
  </main>
</div>

<div id="modalRoot"></div>

<script>
var state = { page: 'dashboard', isOwner: false, orderFilter: 'all', ticketFilter: 'open' };

function $(s){ return document.querySelector(s); }
function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fa(n){ return String(n).replace(/\\d/g, function(d){ return '۰۱۲۳۴۵۶۷۸۹'[d]; }); }
function money(n){ return fa(Number(n || 0).toLocaleString('en-US')) + ' تومان'; }

var STATUS_FA = { pending:'⏳ در انتظار بررسی', unpaid:'💳 در انتظار پرداخت', confirmed:'✅ تأیید شده', shipped:'🚚 ارسال شده', completed:'🎉 تکمیل شده', rejected:'❌ رد شده' };
var STATUS_CLS = { pending:'b-pending', unpaid:'b-unpaid', confirmed:'b-confirmed', shipped:'b-shipped', completed:'b-completed', rejected:'b-rejected' };
var TICKET_FA = { open:'🟢 باز', answered:'✅ پاسخ داده شده', closed:'🔴 بسته' };

async function api(path, opts){
  opts = opts || {};
  var res = await fetch(path, { method: opts.method || 'GET', headers: {'Content-Type':'application/json'}, body: opts.body ? JSON.stringify(opts.body) : undefined });
  var data = await res.json().catch(function(){ return {}; });
  if (!res.ok && !data.ok) throw new Error(data.error || 'خطا در ارتباط با سرور');
  return data;
}

function toast(msg, ok){
  var t = document.createElement('div');
  t.className = 'toast' + (ok === false ? ' err' : '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 3200);
}

function showLogin(){ $('#loginBox').style.display = 'flex'; $('#app').style.display = 'none'; }
function showApp(){
  $('#loginBox').style.display = 'none';
  $('#app').style.display = 'flex';
  document.querySelectorAll('[data-owner-only]').forEach(function(el){ el.style.display = state.isOwner ? '' : 'none'; });
  render();
}

function go(page){ state.page = page; render(); }

async function render(){
  if (!state.isOwner && (state.page === 'admins' || state.page === 'backup')) state.page = 'dashboard';
  document.querySelectorAll('.nav-item[data-page]').forEach(function(el){ el.classList.toggle('active', el.dataset.page === state.page); });
  var main = $('#page');
  main.innerHTML = '<div class="loading">⏳ در حال بارگذاری...</div>';
  try {
    if (state.page === 'dashboard') main.innerHTML = await pageDashboard();
    else if (state.page === 'products') main.innerHTML = await pageProducts();
    else if (state.page === 'orders') main.innerHTML = await pageOrders();
    else if (state.page === 'discounts') main.innerHTML = await pageDiscounts();
    else if (state.page === 'tickets') main.innerHTML = await pageTickets();
    else if (state.page === 'reports') main.innerHTML = await pageReports();
    else if (state.page === 'broadcast') main.innerHTML = pageBroadcast();
    else if (state.page === 'settings') main.innerHTML = await pageSettings();
    else if (state.page === 'backup') main.innerHTML = pageBackup();
    else if (state.page === 'admins') main.innerHTML = await pageAdmins();
  } catch(e) { main.innerHTML = '<div class="card">❌ خطا: ' + esc(e.message) + '</div>'; }
}

// ================= داشبورد =================
function pageHeading(icon, title, subtitle){
  return '<div class="page-head"><div class="page-head-icon">' + icon + '</div><div><h1>' + esc(title) + '</h1><p>' + esc(subtitle || '') + '</p></div></div>';
}

async function pageDashboard(){
  var d = await api('/api/dashboard');
  var s = d.stats;
  var html = '<section class="dashboard-hero"><div class="hero-copy"><span class="hero-eyebrow">✨ نمای زندهٔ فروشگاه</span><h1>سلام، مدیر فروشگاه 👋</h1><p>وضعیت سفارش‌ها، محصولات و مشتری‌ها را یک‌جا ببین و با چند لمس کارهای روزانه را انجام بده.</p><div class="hero-actions"><button class="btn btn-light" data-action="nav" data-page="products">➕ افزودن محصول</button><button class="btn" style="background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.22)" data-action="nav" data-page="orders">🧾 رفتن به سفارش‌ها</button></div></div><div class="hero-visual">🛍️</div></section>';
  html += '<div class="stats-grid">';
  html += stat('🧾', fa(s.orders), 'کل سفارش‌ها');
  html += stat('⏳', fa(s.pending), 'نیازمند بررسی');
  html += stat('💰', money(s.revenue), 'درآمد تأییدشده');
  html += stat('📦', fa(s.products), 'محصولات');
  html += stat('👥', fa(s.users), 'مشتریان');
  html += stat('🎧', fa(s.tickets), 'تیکت‌های باز');
  html += '</div>';
  html += '<div class="dashboard-grid"><div class="card"><div class="card-heading"><div><div class="section-title">🕐 آخرین سفارش‌ها</div><div class="section-subtitle">پنج سفارش تازهٔ فروشگاه</div></div><button class="btn btn-gray btn-sm" data-action="nav" data-page="orders">نمایش همه</button></div>';
  if (!d.recent.length) html += '<div class="empty">هنوز سفارشی ثبت نشده است.</div>';
  else {
    html += '<table><tr><th>کد سفارش</th><th>محصول</th><th>مبلغ</th><th>وضعیت</th><th>زمان ثبت</th></tr>';
    d.recent.forEach(function(o){
      html += '<tr><td><b>' + esc(o.order_code) + '</b></td><td>' + esc(o.product_name) + '</td><td>' + money(o.final_price) + '</td><td><span class="badge ' + (STATUS_CLS[o.status] || 'b-pending') + '">' + (STATUS_FA[o.status] || o.status) + '</span></td><td>' + esc(o.created_at || '') + '</td></tr>';
    });
    html += '</table>';
  }
  html += '</div><div class="card"><div class="card-heading"><div><div class="section-title">⚡ دسترسی سریع</div><div class="section-subtitle">بخش‌های پرکاربرد مدیریت</div></div></div><div class="quick-list">';
  html += '<div class="quick-item" data-action="nav" data-page="orders" style="cursor:pointer"><div class="quick-icon">🧾</div><div class="quick-info"><strong>رسیدگی به سفارش‌ها</strong><small>بررسی سفارش‌های تازه</small></div><div class="quick-value">' + fa(s.pending) + '</div></div>';
  html += '<div class="quick-item" data-action="nav" data-page="products" style="cursor:pointer"><div class="quick-icon">📦</div><div class="quick-info"><strong>مدیریت محصولات</strong><small>افزودن یا ویرایش کالا</small></div><div class="quick-value">' + fa(s.products) + '</div></div>';
  html += '<div class="quick-item" data-action="nav" data-page="tickets" style="cursor:pointer"><div class="quick-icon">🎧</div><div class="quick-info"><strong>پشتیبانی مشتریان</strong><small>پیام‌های نیازمند پاسخ</small></div><div class="quick-value">' + fa(s.tickets) + '</div></div>';
  html += '</div></div></div>';
  return html;
}
function stat(icon, num, lbl){ return '<div class="stat"><div class="stat-icon">' + icon + '</div><div class="stat-copy"><div class="lbl">' + lbl + '</div><div class="num">' + num + '</div></div></div>'; }

// ================= محصولات و کاتالوگ بازی‌ها =================
function gameRowHtml(game){
  game = game || {};
  return '<div class="catalog-game-row" data-game-row style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;align-items:end;padding:12px;border:1px solid #e8eaf2;border-radius:15px;background:#fafbff">' +
    '<input type="hidden" name="game_id" value="' + esc(game.id || '') + '">' +
    '<div class="field"><label>نام نمایشی بازی</label><input name="game_name" required maxlength="80" value="' + esc(game.name || '') + '" placeholder="مثلاً Mobile Legends"></div>' +
    '<div class="field"><label>ایموجی</label><input name="game_emoji" maxlength="12" value="' + esc(game.emoji || '🎮') + '" placeholder="🎮"></div>' +
    '<label class="check-row" style="min-height:42px;padding:9px"><input type="checkbox" name="game_active" ' + (game.active === false ? '' : 'checked') + '><span>فعال</span></label>' +
    '<button type="button" class="btn btn-danger btn-sm" data-action="game-remove">حذف</button></div>';
}

function offerRowHtml(offer){
  offer = offer || {};
  return '<div class="catalog-offer-row" data-offer-row style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr)) auto;gap:10px;align-items:end;padding:12px;border:1px solid #e8eaf2;border-radius:15px;background:#fafbff">' +
    '<div class="field"><label>عنوان پیشنهاد</label><input name="offer_title" required maxlength="100" value="' + esc(offer.title || '') + '" placeholder="نام پیشنهاد"></div>' +
    '<div class="field"><label>برچسب فروش</label><input name="offer_label" maxlength="40" value="' + esc(offer.sale_label || '$1') + '" placeholder="$1"></div>' +
    '<button type="button" class="btn btn-danger btn-sm" data-action="offer-remove">حذف</button>' +
    '<div class="field full"><label>توضیح پیشنهاد</label><textarea name="offer_description" maxlength="500">' + esc(offer.description || '') + '</textarea></div>' +
    '<div class="field full"><label>پیوند HTTPS (اختیاری)</label><input name="offer_url" type="url" value="' + esc(offer.url || '') + '" placeholder="https://..."></div></div>';
}

async function pageProducts(){
  var d = await api('/api/catalog');
  var games = Array.isArray(d.games) ? d.games : [];
  var deals = d.other_dollar_deals || { intro:'', offers:[] };
  var html = pageHeading('🎮', 'بازی‌ها و محصولات', 'دسته‌های بازی، گزینه‌های فروش، قیمت تومانی و پیشنهادهای جداگانه را مدیریت کنید.');
  var rate = d.exchange_rate;
  var rateStamp = rate && rate.fetched_at ? new Date(rate.fetched_at).toLocaleString('fa-IR') : '';
  html += '<div class="card"><div class="flex" style="justify-content:space-between;align-items:center"><div><div class="section-title">💱 نرخ مرجع دلار آزاد</div><div class="section-subtitle">' + (rate ? '<b>' + money(rate.rate_toman) + '</b> · منبع: ' + esc(rate.source || 'نرخ‌سنج') + (rateStamp ? ' · آخرین دریافت: ' + esc(rateStamp) : '') : 'نرخ هنوز دریافت نشده است.') + '</div><div class="hint">این نرخ فقط برای اطلاع مدیر است؛ قیمت محصولات به‌صورت خودکار تغییر نمی‌کند و همچنان دستی وارد می‌شود.</div>' + (d.exchange_rate_error ? '<div class="hint" style="color:#b43c50">' + esc(d.exchange_rate_error) + '</div>' : '') + '</div><button class="btn btn-gray" data-action="rate-refresh">🔄 دریافت نرخ تازه</button></div></div>';
  html += '<div class="card"><div class="card-heading"><div><div class="section-title">🎮 فهرست بازی‌ها</div><div class="section-subtitle">نام و ایموجی بازی‌ها را عوض کنید، بازی تازه بیفزایید یا دسته‌ای را موقتاً پنهان کنید.</div></div></div>';
  html += '<form id="gameForm"><div id="gameRows" style="display:flex;flex-direction:column;gap:9px">';
  games.forEach(function(game){ html += gameRowHtml(game); });
  html += '</div><div class="actions"><button type="button" class="btn btn-gray" data-action="game-add">➕ افزودن بازی</button><button type="submit" class="btn btn-primary">💾 ذخیرهٔ بازی‌ها</button></div><div class="hint">حذف بازی‌ای که محصول به آن متصل است ممکن نیست؛ ابتدا محصولات آن را به دستهٔ دیگری منتقل کنید. غیرفعال‌کردن، دسته را از دید مشتری پنهان می‌کند.</div></form></div>';

  html += '<div class="card"><div class="flex" style="justify-content:space-between"><div><div class="section-title" style="margin:0">📦 محصولات (' + fa(d.products.length) + ')</div><div class="hint">قیمت به تومان و برچسب فروش مانند $1 مستقل و دستی قابل تنظیم است.</div></div><button class="btn btn-primary" data-action="prod-new">➕ محصول جدید</button></div>';
  if (!d.products.length) html += '<div class="empty">هنوز محصولی ثبت نشده است.</div>';
  else {
    html += '<div style="overflow-x:auto"><table class="mt"><tr><th>عکس</th><th>نام</th><th>بازی</th><th>برچسب</th><th>قیمت واقعی</th><th>نوع</th><th>وضعیت</th><th>عملیات</th></tr>';
    d.products.forEach(function(p){
      var typeFa = p.type === 'digital' ? 'دیجیتال' : p.type === 'physical' ? 'فیزیکی' : 'خدماتی';
      var game = games.find(function(g){ return g.id === p.game_id; });
      var gameName = game ? esc((game.emoji || '🎮') + ' ' + game.name) : 'بدون دسته';
      var priceText = Number(p.price) > 0 ? money(p.price) : '<span class="badge b-off">قیمت تعیین نشده</span>';
      html += '<tr><td>' + (p.photo_file_id ? '🖼️' : '—') + '</td>';
      html += '<td><b>' + esc(p.name) + '</b></td><td>' + gameName + '</td><td><b>' + esc(p.sale_label || '—') + '</b></td><td>' + priceText + '</td><td>' + typeFa + '</td>';
      html += '<td><span class="badge ' + (p.active ? 'b-on' : 'b-off') + '">' + (p.active ? '🟢 فعال' : '🔴 غیرفعال') + '</span></td>';
      html += '<td><div class="flex"><button class="btn btn-gray btn-sm" data-action="prod-edit" data-id="' + p.id + '">✏️ ویرایش</button><button class="btn btn-danger btn-sm" data-action="prod-del" data-id="' + p.id + '">🗑️ حذف</button></div></td></tr>';
    });
    html += '</table></div>';
  }
  html += '</div>';

  return html;
}

function openProductModal(id){
  api('/api/catalog').then(function(d){
    var p = null;
    if (id) p = d.products.find(function(x){ return Number(x.id) === Number(id); });
    var title = p ? '✏️ ویرایش محصول' : '➕ محصول جدید';
    var games = Array.isArray(d.games) ? d.games : [];
    var selectedGame = p ? String(p.game_id || '') : '';
    var gameOptions = '<option value="">بدون دسته</option>' + games.map(function(g){
      return '<option value="' + esc(g.id) + '"' + (selectedGame === g.id ? ' selected' : '') + '>' + esc((g.emoji || '🎮') + ' ' + g.name + (g.active === false ? ' · غیرفعال' : '')) + '</option>';
    }).join('');
    var html = '<div class="modal-overlay" data-action="modal-close"><div class="modal" onclick="event.stopPropagation()"><h3>' + title + '</h3>';
    html += '<form id="productForm" data-id="' + (p ? p.id : '') + '"><div class="form-grid">';
    html += field('نام محصول', '<input name="name" required value="' + esc(p ? p.name : '') + '">');
    html += field('بازی / دسته', '<select name="game_id">' + gameOptions + '</select>');
    html += field('برچسب فروش یا حجم کانفیگ (مثلاً ۳۰ گیگ)', '<input name="sale_label" maxlength="40" value="' + esc(p ? p.sale_label : '$1') + '" placeholder="$1">');
    html += field('بهای تمام‌شده (تومان، برای محاسبه سود دعوت)', '<input name="cost" type="number" min="0" value="'+esc(p ? p.cost : '')+'">');
    html += field('قیمت واقعی (تومان)', '<input name="price" type="number" min="0" required value="' + (p ? p.price : '') + '"><div class="hint">مبلغ تومان دستی وارد می‌شود؛ برای فعال‌کردن محصول باید بیشتر از صفر باشد.</div>');
    html += field('نوع کالا', '<select name="type"><option value="digital"' + (!p || p.type === 'digital' ? ' selected' : '') + '>دیجیتال</option><option value="physical"' + (p && p.type === 'physical' ? ' selected' : '') + '>فیزیکی</option><option value="service"' + (p && p.type === 'service' ? ' selected' : '') + '>خدماتی</option></select>');
    html += field('عکس محصول', '<input type="file" name="photoFile" accept="image/*"><div class="hint">اگر عکس جدید انتخاب کنید، جایگزین می‌شود. در غیر این صورت عکس قبلی می‌ماند.</div><input type="hidden" name="photo_file_id" value="' + esc(p ? p.photo_file_id : '') + '">');
    html += field('توضیحات', '<textarea name="description">' + esc(p ? p.description : '') + '</textarea>', true);
    html += field('متن تحویل (هنگام ارسال برای مشتری)', '<textarea name="delivery_text">' + esc(p ? p.delivery_text : '') + '</textarea>', true);
    html += field('لینک تحویل (اختیاری)', '<input name="delivery_link" value="' + esc(p ? p.delivery_link : '') + '" placeholder="https://...">');
    html += field('وضعیت', '<select name="active"><option value="1"' + (!p || p.active && Number(p.price) > 0 ? ' selected' : '') + '>🟢 فعال</option><option value="0"' + (p && (!p.active || Number(p.price) <= 0) ? ' selected' : '') + '>🔴 غیرفعال</option></select>');
    html += '</div><div class="actions"><button type="button" class="btn btn-gray" data-action="modal-close">انصراف</button><button type="submit" class="btn btn-primary">💾 ذخیره</button></div></form></div></div>';
    $('#modalRoot').innerHTML = html;
  }).catch(function(err){ toast(err.message, false); });
}
function field(label, inner, full){ return '<div class="field' + (full ? ' full' : '') + '"><label>' + label + '</label>' + inner + '</div>'; }

async function saveProduct(form){
  var fd = new FormData(form);
  var file = fd.get('photoFile');
  var fileId = fd.get('photo_file_id');
  if (file && file.size > 0) {
    var up = new FormData();
    up.append('file', file);
    var res = await fetch('/api/upload-photo', { method: 'POST', body: up });
    var data = await res.json();
    if (!data.ok) throw new Error(data.error || 'آپلود عکس ناموفق بود');
    fileId = data.file_id;
  }
  var body = {
    name: fd.get('name'), price: Number(fd.get('price')), type: fd.get('type'),
    cost: fd.get('cost'), game_id: fd.get('game_id'), sale_label: fd.get('sale_label'),
    description: fd.get('description'), delivery_text: fd.get('delivery_text'),
    delivery_link: fd.get('delivery_link'), photo_file_id: fileId, active: fd.get('active') === '1'
  };
  var id = form.dataset.id;
  if (id) await api('/api/products/' + id, { method: 'PUT', body: body });
  else await api('/api/products', { method: 'POST', body: body });
  closeModal();
  toast('✅ محصول ذخیره شد');
  render();
}

// ================= سفارش‌ها =================
async function pageOrders(){
  var d = await api('/api/orders?status=' + encodeURIComponent(state.orderFilter));
  var tabs = [['all','همه'],['pending','⏳ در انتظار بررسی'],['unpaid','💳 در انتظار پرداخت'],['confirmed','✅ تأیید شده'],['shipped','🚚 ارسال شده'],['completed','🎉 تکمیل شده'],['rejected','❌ رد شده']];
  var current = tabs.find(function(t){ return t[0] === state.orderFilter; }) || tabs[0];
  var html = pageHeading('🧾', 'سفارش‌ها', 'سفارش‌ها را بر پایهٔ وضعیت ببین و سریع‌تر پیگیری کن.');
  html += '<div class="tabs" role="group" aria-label="فیلتر وضعیت سفارش‌ها">';
  tabs.forEach(function(t){ html += '<button type="button" class="tab' + (state.orderFilter === t[0] ? ' active' : '') + '" data-action="order-filter" data-f="' + t[0] + '">' + t[1] + '</button>'; });
  html += '</div><div class="card"><div class="card-heading"><div><div class="section-title">' + (state.orderFilter === 'all' ? 'همهٔ سفارش‌ها' : current[1]) + '</div><div class="section-subtitle">برای دیدن رسید و تغییر وضعیت، سفارش را باز کن.</div></div><span class="badge b-unpaid">' + fa(d.orders.length) + ' سفارش</span></div>';
  if (!d.orders.length) html += '<div class="empty">سفارشی با این وضعیت پیدا نشد.</div>';
  else {
    html += '<table><tr><th>کد سفارش</th><th>مشتری</th><th>محصول</th><th>مبلغ</th><th>روش پرداخت</th><th>وضعیت</th><th>تاریخ</th><th>جزئیات</th></tr>';
    d.orders.forEach(function(o){
      html += '<tr><td><b>' + esc(o.order_code) + '</b></td><td>' + esc(o.username || ('کاربر ' + fa(o.user_id))) + '</td><td>' + esc(o.product_name) + '</td><td>' + money(o.final_price) + '</td><td>' + (o.payment_method === 'online' ? '💻 آنلاین' : '💳 کارت‌به‌کارت') + '</td><td><span class="badge ' + (STATUS_CLS[o.status] || 'b-pending') + '">' + (STATUS_FA[o.status] || o.status) + '</span></td><td>' + esc(o.created_at || '') + '</td>';
      html += '<td><button class="btn btn-gray btn-sm" data-action="order-view" data-id="' + o.id + '">👀 مشاهده</button></td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  return html;
}

function openOrderModal(id){
  api('/api/orders?status=all').then(function(d){
    var o = d.orders.find(function(x){ return x.id === id; });
    if (!o) return;
    var html = '<div class="modal-overlay" data-action="modal-close"><div class="modal" onclick="event.stopPropagation()"><h3>🧾 سفارش ' + esc(o.order_code) + '</h3>';
    html += '<table>';
    html += row('👤 مشتری', esc(o.username || '') + ' (id: ' + fa(o.user_id) + ')');
    html += row('🛍️ محصول', esc(o.product_name));
    html += row('💰 قیمت', money(o.price));
    if (o.discount_amount > 0) html += row('🎟️ تخفیف', '-' + money(o.discount_amount) + ' (' + esc(o.discount_code) + ')');
    html += row('💵 مبلغ نهایی', '<b>' + money(o.final_price) + '</b>');
    html += row('💳 روش پرداخت', o.payment_method === 'online' ? '💻 آنلاین' : '💳 کارت‌به‌کارت');
    html += row('📊 وضعیت', '<span class="badge ' + (STATUS_CLS[o.status] || 'b-pending') + '">' + (STATUS_FA[o.status] || o.status) + '</span>');
    html += row('🕐 تاریخ', esc(o.created_at || ''));
    if(o.account_details) html += row('اطلاعات خرید',esc(o.account_details));
    if (o.admin_note) html += row('📝 یادداشت', esc(o.admin_note));
    html += '</table>';
    html += '<form id="orderForm" data-id="' + o.id + '" data-status="' + o.status + '" class="mt"><div class="field"><label>یادداشت ادمین (اختیاری)</label><input name="admin_note" value="' + esc(o.admin_note || '') + '"></div>';
    html += '<div class="actions">';
    if (o.status === 'pending' || o.status === 'unpaid') {
      html += '<button type="button" class="btn btn-success" data-action="order-status" data-id="' + o.id + '" data-s="confirmed">✅ تأیید</button>';
      html += '<button type="button" class="btn btn-danger" data-action="order-status" data-id="' + o.id + '" data-s="rejected">❌ رد</button>';
    }
    if (o.status === 'confirmed') html += '<button type="button" class="btn btn-primary" data-action="order-status" data-id="' + o.id + '" data-s="shipped">🚚 ارسال / تحویل</button>';
    if (o.status === 'shipped') html += '<button type="button" class="btn btn-success" data-action="order-status" data-id="' + o.id + '" data-s="completed">🎉 تکمیل سفارش</button>';
    html += '<button type="submit" class="btn btn-gray">💾 ذخیره یادداشت</button>';
    html += '<button type="button" class="btn btn-gray" data-action="modal-close">بستن</button>';
    html += '</div></form></div></div>';
    $('#modalRoot').innerHTML = html;
  });
}
function row(k, v){ return '<tr><td style="width:130px;color:#64748b;font-weight:700">' + k + '</td><td>' + v + '</td></tr>'; }

// ================= کدهای تخفیف =================
async function pageDiscounts(){
  var d = await api('/api/discounts');
  var html = pageHeading('🎟️', 'کدهای تخفیف', 'ساخت و مدیریت پیشنهادهای فروشگاه');
  html += '<div class="card"><div class="section-title">➕ ساخت کد تخفیف جدید</div><form id="discountForm"><div class="form-grid">';
  html += field('کد تخفیف', '<input name="code" required placeholder="مثلاً: OFF20"><div class="hint">اگر خالی بماند، کد تصادفی ساخته می‌شود.</div>');
  html += field('نوع تخفیف', '<select name="type"><option value="percent">درصدی (%)</option><option value="fixed">مبلغ ثابت (تومان)</option></select>');
  html += field('مقدار تخفیف', '<input name="value" type="number" min="1" required>');
  html += field('حداکثر دفعات استفاده (۰ = نامحدود)', '<input name="max_uses" type="number" min="0" value="0">');
  html += field('تاریخ انقضا (اختیاری)', '<input name="expires_at" type="datetime-local">');
  html += '</div><div class="actions mt"><button type="submit" class="btn btn-primary">💾 ذخیره کد</button></div></form></div>';
  html += '<div class="card"><div class="section-title">📋 کدهای موجود</div>';
  if (!d.discounts.length) html += '<div class="empty">هنوز کد تخفیفی ساخته نشده است.</div>';
  else {
    html += '<table><tr><th>کد</th><th>نوع</th><th>مقدار</th><th>استفاده شده</th><th>وضعیت</th><th>عملیات</th></tr>';
    d.discounts.forEach(function(c){
      var val = c.type === 'percent' ? fa(c.value) + '٪' : money(c.value);
      var uses = fa(c.used_count) + (c.max_uses > 0 ? ' از ' + fa(c.max_uses) : ' (نامحدود)');
      html += '<tr><td><b>' + esc(c.code) + '</b></td><td>' + (c.type === 'percent' ? 'درصدی' : 'ثابت') + '</td><td>' + val + '</td><td>' + uses + '</td><td><span class="badge ' + (c.active ? 'b-on' : 'b-off') + '">' + (c.active ? '🟢 فعال' : '🔴 غیرفعال') + '</span></td>';
      html += '<td><div class="flex"><button class="btn btn-gray btn-sm" data-action="disc-toggle" data-id="' + c.id + '">' + (c.active ? '🔴 غیرفعال' : '🟢 فعال') + '</button><button class="btn btn-danger btn-sm" data-action="disc-del" data-id="' + c.id + '">🗑️ حذف</button></div></td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  return html;
}

// ================= تیکت‌ها =================
async function pageTickets(){
  var d = await api('/api/tickets?status=' + encodeURIComponent(state.ticketFilter));
  var tabs = [['open','🟢 باز'],['answered','✅ پاسخ داده شده'],['closed','🔴 بسته'],['all','همه']];
  var current = tabs.find(function(t){ return t[0] === state.ticketFilter; }) || tabs[0];
  var html = pageHeading('🎧', 'پشتیبانی مشتریان', 'پیام‌ها را بر پایهٔ وضعیت دسته‌بندی و پیگیری کن.');
  html += '<div class="tabs" role="group" aria-label="فیلتر وضعیت تیکت‌ها">';
  tabs.forEach(function(t){ html += '<button type="button" class="tab' + (state.ticketFilter === t[0] ? ' active' : '') + '" data-action="ticket-filter" data-f="' + t[0] + '">' + t[1] + '</button>'; });
  html += '</div><div class="card"><div class="card-heading"><div><div class="section-title">' + (state.ticketFilter === 'all' ? 'همهٔ تیکت‌ها' : current[1]) + '</div><div class="section-subtitle">برای پاسخ‌دادن یا بستن تیکت، آن را باز کن.</div></div><span class="badge b-open">' + fa(d.tickets.length) + ' تیکت</span></div>';
  if (!d.tickets.length) html += '<div class="empty">تیکتی با این وضعیت پیدا نشد.</div>';
  else {
    html += '<table><tr><th>شماره</th><th>کاربر</th><th>پیام</th><th>وضعیت</th><th>تاریخ</th><th>جزئیات</th></tr>';
    d.tickets.forEach(function(t){
      html += '<tr><td><b>#' + fa(t.id) + '</b></td><td>' + esc(t.username || ('کاربر ' + fa(t.user_id))) + '</td><td>' + esc(String(t.message).slice(0, 70)) + (String(t.message).length > 70 ? '…' : '') + '</td><td><span class="badge ' + (t.status === 'open' ? 'b-open' : t.status === 'answered' ? 'b-answered' : 'b-closed') + '">' + (TICKET_FA[t.status] || t.status) + '</span></td><td>' + esc(t.created_at || '') + '</td>';
      html += '<td><button class="btn btn-gray btn-sm" data-action="ticket-view" data-id="' + t.id + '">👀 مشاهده</button></td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  return html;
}

function openTicketModal(id){
  api('/api/tickets?status=all').then(function(d){
    var t = d.tickets.find(function(x){ return x.id === id; });
    if (!t) return;
    var html = '<div class="modal-overlay" data-action="modal-close"><div class="modal" onclick="event.stopPropagation()"><h3>🎫 تیکت #' + fa(t.id) + '</h3>';
    html += '<table>' + row('👤 کاربر', esc(t.username || '') + ' (id: ' + fa(t.user_id) + ')') + row('💬 پیام', esc(t.message)) + row('📊 وضعیت', TICKET_FA[t.status] || t.status) + '</table>';
    html += '<form id="ticketForm" data-id="' + t.id + '" class="mt"><div class="field"><label>✍️ پاسخ شما</label><textarea name="admin_reply" placeholder="پاسخ را بنویسید...">' + esc(t.admin_reply || '') + '</textarea></div>';
    html += '<div class="actions"><button type="button" class="btn btn-gray" data-action="ticket-close" data-id="' + t.id + '">🔴 بستن تیکت</button><button type="submit" class="btn btn-primary">📤 ارسال پاسخ</button><button type="button" class="btn btn-gray" data-action="modal-close">بستن</button></div></form></div></div>';
    $('#modalRoot').innerHTML = html;
  });
}

// ================= گزارش‌ها =================
async function pageReports(){
  var d = await api('/api/reports');
  var html = pageHeading('📈', 'گزارش‌ها', 'نمای کلی فروش و عملکرد محصولات');
  html += '<div class="stats-grid">';
  html += stat('🧾', fa(d.totalOrders), 'کل سفارش‌ها');
  html += stat('💰', money(d.revenue), 'درآمد کل');
  html += '</div>';
  html += '<div class="card"><div class="section-title">📅 سفارش‌های ۷ روز اخیر</div>';
  if (!d.days.length) html += '<div class="empty">داده‌ای وجود ندارد.</div>';
  else {
    var max = Math.max.apply(null, d.days.map(function(x){ return x.c; }));
    d.days.forEach(function(x){
      var pct = max > 0 ? Math.round(x.c / max * 100) : 0;
      html += '<div class="bar-row"><div class="lbl">' + esc(x.d) + '</div><div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div><div class="val">' + fa(x.c) + '</div></div>';
    });
  }
  html += '</div>';
  html += '<div class="card"><div class="section-title">🏆 پرفروش‌ترین محصولات</div>';
  if (!d.top.length) html += '<div class="empty">هنوز فروشی ثبت نشده است.</div>';
  else {
    html += '<table><tr><th>محصول</th><th>تعداد فروش</th><th>مبلغ فروش</th></tr>';
    d.top.forEach(function(x){
      html += '<tr><td><b>' + esc(x.product_name) + '</b></td><td>' + fa(x.c) + '</td><td>' + money(x.s) + '</td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  html += '<div class="card"><div class="section-title">📊 وضعیت سفارش‌ها</div>';
  if (!d.byStatus.length) html += '<div class="empty">داده‌ای وجود ندارد.</div>';
  else {
    html += '<table><tr><th>وضعیت</th><th>تعداد</th><th>مبلغ</th></tr>';
    d.byStatus.forEach(function(x){
      html += '<tr><td><span class="badge ' + (STATUS_CLS[x.status] || 'b-pending') + '">' + (STATUS_FA[x.status] || x.status) + '</span></td><td>' + fa(x.c) + '</td><td>' + money(x.s) + '</td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  return html;
}

// ================= پیام جمعی =================
function pageBroadcast(){
  var html = pageHeading('📢', 'پیام جمعی', 'اطلاع‌رسانی هم‌زمان به مشتریان فروشگاه') + '<div class="card">';
  html += '<div class="section-title">✉️ ارسال پیام به همه کاربران</div>';
  html += '<form id="broadcastForm"><div class="field"><label>متن پیام</label><textarea name="message" required placeholder="پیام خود را بنویسید..."></textarea><div class="hint">این پیام برای همه کاربرانی که ربات را استارت کرده‌اند ارسال می‌شود.</div></div>';
  html += '<div class="actions mt"><button type="submit" class="btn btn-primary">📤 ارسال پیام</button></div></form></div>';
  return html;
}

// ================= تنظیمات =================
var MINIAPP_TEXT_LABELS = {
  tagline:'زیرعنوان لوگو', kicker:'برچسب بالای ویترین', headline:'عنوان اصلی ویترین', heroText:'توضیح ویترین', heroBadge:'نشان تجربهٔ خرید',
  search:'راهنمای جست‌وجو', catalog:'عنوان فهرست کالاها', catalogSub:'زیرعنوان فهرست کالاها', gamesTitle:'عنوان فهرست بازی‌ها', gameCount:'عنوان شمارندهٔ بازی', backToGames:'دکمهٔ بازگشت به بازی‌ها', otherProducts:'عنوان سایر محصولات', productCount:'عنوان شمارندهٔ محصول', details:'دکمهٔ مشاهده',
  price:'برچسب قیمت', item:'عنوان عمومی کالا', emptyTitle:'عنوان فروشگاه خالی', emptyText:'توضیح فروشگاه خالی', noResults:'پیام جست‌وجوی بی‌نتیجه', buy:'دکمهٔ خرید', close:'دکمهٔ بستن',
  themes:'عنوان انتخاب پوسته', themeDark:'نام پوستهٔ تیره', themeBlack:'نام پوستهٔ مشکی', themeRed:'نام پوستهٔ قرمز', themeWhite:'نام پوستهٔ روشن',
  gateTitle:'عنوان پیام ورود از تلگرام', gateText:'توضیح ورود از تلگرام', footer:'متن پایین صفحه', unavailable:'پیام محصول ناموجود', botMissing:'پیام نبود پیوند ربات',
  loadError:'پیام خطای بارگذاری', loading:'پیام بارگذاری', noImage:'متن عکس ناموجود', productLabel:'برچسب محصول', botStart:'عنوان ادامه در تلگرام',
  joinTitle:'عنوان عضویت اجباری', joinText:'توضیح عضویت اجباری', joinButton:'دکمهٔ عضویت کانال/گروه', checkJoin:'دکمهٔ بررسی عضویت', phoneRequired:'پیام تأیید شماره', openBot:'دکمهٔ بازگشت به ربات', languageButton:'متن دکمهٔ تغییر زبان', switchLanguage:'متن دسترس‌پذیری تغییر زبان'
};
var MINIAPP_TEXT_DEFAULTS = {
  fa:{tagline:'خرید آسان، تجربه‌ای متفاوت',kicker:'ویترین هوشمند',headline:'چیزهای خوب، فقط یک لمس دورند',heroText:'محصول دلخواهتان را پیدا کنید و در چند قدم ساده سفارش دهید.',heroBadge:'تجربهٔ خرید سریع و امن',search:'جست‌وجوی محصول...',catalog:'محصولات فروشگاه',catalogSub:'انتخابی برای سلیقهٔ شما',gamesTitle:'بازی‌ها',gameCount:'بازی',backToGames:'بازگشت به فهرست بازی‌ها',otherProducts:'سایر محصولات',productCount:'محصول',details:'مشاهده',price:'قیمت',item:'کالا',emptyTitle:'هنوز محصولی اینجا نیست',emptyText:'به‌زودی محصولات تازه به فروشگاه اضافه می‌شوند. دوباره سر بزنید.',noResults:'محصولی با این عبارت پیدا نشد.',buy:'🛒 ادامهٔ خرید در ربات',close:'بستن',themes:'پوستهٔ فروشگاه',themeDark:'تیره',themeBlack:'مشکی',themeRed:'قرمز',themeWhite:'روشن',gateTitle:'فروشگاه را در تلگرام باز کنید',gateText:'برای دیدن کالاها و خرید امن، این صفحه را از دکمهٔ مینی‌اپ در گفت‌وگوی ربات باز کنید.',footer:'خرید امن و آسان، در',unavailable:'این محصول در حال حاضر موجود نیست.',botMissing:'پیوند ربات تنظیم نشده است؛ لطفاً از گفت‌وگوی ربات خرید را آغاز کنید.',loadError:'بارگذاری فروشگاه انجام نشد. اتصال را بررسی و دوباره تلاش کنید.',loading:'در حال بارگذاری محصولات...',noImage:'بدون عکس',productLabel:'محصول',botStart:'آغاز خرید در تلگرام',joinTitle:'برای ادامه عضو شوید',joinText:'برای مشاهدهٔ محصولات، در همهٔ کانال‌ها و گروه‌های زیر عضو شوید.',joinButton:'عضویت در کانال/گروه',checkJoin:'بررسی عضویت',phoneRequired:'برای ادامه، شمارهٔ همراه خود را در گفت‌وگوی ربات تأیید کنید.',openBot:'بازگشت به ربات و تأیید شماره',languageButton:'EN',switchLanguage:'تغییر زبان'},
  en:{tagline:'A smoother way to shop',kicker:'A smarter storefront',headline:'Good finds, just one tap away',heroText:'Find what you love and place an order in a few simple steps.',heroBadge:'Fast and secure shopping',search:'Search products...',catalog:'Shop products',catalogSub:'A little something for you',gamesTitle:'Games',gameCount:'games',backToGames:'Back to games',otherProducts:'Other products',productCount:'products',details:'View',price:'Price',item:'item',emptyTitle:'Nothing here just yet',emptyText:'New products will be added soon. Please check back.',noResults:'No products match that search.',buy:'🛒 Continue in bot',close:'Close',themes:'Store appearance',themeDark:'Dark',themeBlack:'Black',themeRed:'Red',themeWhite:'Light',gateTitle:'Open this shop in Telegram',gateText:'To browse products and place a secure order, open this page from the Mini App button in your bot chat.',footer:'Secure, simple shopping at',unavailable:'This product is currently unavailable.',botMissing:'The bot link is not configured. Please start your order in the bot chat.',loadError:'The shop could not be loaded. Check your connection and try again.',loading:'Loading products...',noImage:'No photo',productLabel:'Product',botStart:'Continue in Telegram',joinTitle:'Join to continue',joinText:'Join all of the channels and groups below to view the store.',joinButton:'Join channel/group',checkJoin:'Check membership',phoneRequired:'Verify your phone number in the bot chat to continue.',openBot:'Return to bot to verify',languageButton:'فا',switchLanguage:'Switch language'}
};
var MINIAPP_LONG_TEXTS = ['headline','heroText','emptyText','gateText','footer','botMissing','loadError','joinText','phoneRequired'];
function readJoinChannels(s){
  var channels=[];
  try { var parsed=JSON.parse(s.force_join_channels||'[]'); if(Array.isArray(parsed)) channels=parsed; } catch(e) {}
  if(!channels.length&&s.force_join_channel) channels=[{channel:s.force_join_channel,link:s.force_join_link||''}];
  if(!channels.length) channels=[{channel:'',link:''}];
  return channels;
}
function readMiniAppTexts(s){try{var parsed=JSON.parse(s.miniapp_texts||'{}');return parsed&&typeof parsed==='object'?parsed:{}}catch(e){return {}}}
function renderMiniAppTextFields(language,custom){
  return Object.keys(MINIAPP_TEXT_LABELS).map(function(key){
    var value=custom[language]&&typeof custom[language][key]==='string'?custom[language][key]:MINIAPP_TEXT_DEFAULTS[language][key];
    var safe=esc(value==null?'':value);
    var input=MINIAPP_LONG_TEXTS.indexOf(key)>=0?'<textarea name="miniapp_'+language+'_'+key+'">'+safe+'</textarea>':'<input name="miniapp_'+language+'_'+key+'" value="'+safe+'">';
    return field(MINIAPP_TEXT_LABELS[key],input,MINIAPP_LONG_TEXTS.indexOf(key)>=0);
  }).join('');
}
async function pageSettings(){
  var d = await api('/api/settings');
  var s = d.settings;
  var joinChannels = readJoinChannels(s);
  var miniappTexts = readMiniAppTexts(s);
  var html = pageHeading('⚙️', 'تنظیمات فروشگاه', 'اطلاعات، پرداخت، عضویت و امنیت را یک‌جا مدیریت کن.');
  html += '<form id="settingsForm"><div class="card"><div class="section-title">🏪 اطلاعات عمومی</div><div class="form-grid">';
  html += field('نام فروشگاه', '<input name="shop_name" value="' + esc(s.shop_name) + '">');
  html += field('شماره کارت پرداخت', '<input name="card_number" value="' + esc(s.card_number) + '" placeholder="6037-xxxx-xxxx-xxxx">');
  html += field('نام صاحب کارت', '<input name="card_owner" value="' + esc(s.card_owner) + '">');
  html += field('متن خوش‌آمدگویی (پیام /start)', '<textarea name="welcome_text">' + esc(s.welcome_text) + '</textarea>', true);
  html += field('متن اعتماد به مجموعه','<textarea name="trust_text">'+esc(s.trust_text)+'</textarea>',true);
  html += field('لینک‌های اعتماد (هر خط یک نشانی HTTPS)','<textarea name="trust_links">'+esc(s.trust_links)+'</textarea>',true);
  html += field('راهنمای خرید', '<textarea name="guide_text">' + esc(s.guide_text) + '</textarea>', true);
  html += field('نام کاربری تلگرام پشتیبانی پس از پرداخت', '<input name="support_username" placeholder="@username" value="' + esc(s.support_username || '') + '">');
  html += field('اطلاعات پشتیبانی و ساعت کاری', '<textarea name="support_info">' + esc(s.support_info) + '</textarea>', true);
  html += '</div></div>';

  html += '<div class="card"><div class="card-heading"><div><div class="section-title">📣 کانال‌ها و گروه‌های اسپانسر/جوین اجباری</div><div class="section-subtitle">در صورت فعال‌سازی، مشتری پیش از ورود به فروشگاه این مراحل را انجام می‌دهد.</div></div></div>';
  html += '<div class="check-row"><input type="checkbox" name="force_join_enabled" ' + (s.force_join_enabled === '1' ? 'checked' : '') + '><div><b>الزام عضویت در کانال‌ها و گروه‌ها</b><div class="hint">کاربر باید در همهٔ کانال‌ها و گروه‌های ثبت‌شده عضو باشد. برای بررسی عضویت، ربات را در هرکدام مدیر کنید.</div></div></div>';
  html += '<div id="joinChannels" class="join-channels mt">';
  joinChannels.forEach(function(channel){
    html += '<div class="join-channel-row" data-join-row><div class="field"><label>شناسهٔ کانال یا گروه</label><input name="join_channel" value="' + esc(channel.channel || '') + '" placeholder="@username یا شناسهٔ منفی مثل -100…"></div>';
    html += '<div class="field"><label>پیوند عضویت</label><input name="join_link" value="' + esc(channel.link || '') + '" placeholder="https://t.me/..."><div class="hint">برای گروه یا کانال عمومیِ دارای @username خالی بگذارید؛ پیوند خودکار ساخته می‌شود. برای مورد خصوصی، شناسه و پیوند دعوت HTTPS لازم است.</div></div>';
    html += '<button type="button" class="btn btn-danger btn-sm join-remove" data-action="join-remove" aria-label="حذف مورد">حذف</button></div>';
  });
  html += '</div><div class="actions"><button type="button" class="btn btn-gray btn-sm" data-action="join-add">➕ افزودن کانال/گروه</button></div><div class="hint">برای افزودن هر تعداد مورد، روی «افزودن کانال/گروه» بزنید؛ برنامه سقف ثابت ندارد. شناسهٔ عمومی @username و برای مورد خصوصی شناسهٔ عددی منفی به‌همراه پیوند دعوت HTTPS لازم است. ربات را در همهٔ کانال‌ها و گروه‌ها مدیر کنید.</div>';
  html += '<div class="check-row mt"><input type="checkbox" name="phone_required" ' + (s.phone_required === '1' ? 'checked' : '') + '><div><b>تأیید شماره پیش از نمایش پیوند عضویت</b><div class="hint">این گزینه فقط همراه با عضویت اجباری کار می‌کند. شماره از مخاطب خود کاربر دریافت و با +98 ذخیره می‌شود؛ پیامک ارسال نمی‌شود.</div></div></div></div>';

  html += '<div class="card"><div class="section-title">🔔 قالب پیام‌های وضعیت سفارش</div><div class="hint" style="margin-bottom:12px">متغیرهای قابل استفاده: {order_code} کد سفارش — {product_name} نام محصول — {price} مبلغ</div><div class="form-grid">';
  html += field('پیام «در انتظار بررسی»', '<textarea name="msg_order_pending">' + esc(s.msg_order_pending) + '</textarea>');
  html += field('پیام «تأیید شده»', '<textarea name="msg_order_confirmed">' + esc(s.msg_order_confirmed) + '</textarea>');
  html += field('پیام «ارسال شده»', '<textarea name="msg_order_shipped">' + esc(s.msg_order_shipped) + '</textarea>');
  html += field('پیام «تکمیل شده»', '<textarea name="msg_order_completed">' + esc(s.msg_order_completed) + '</textarea>');
  html += field('پیام «رد شده»', '<textarea name="msg_order_rejected">' + esc(s.msg_order_rejected) + '</textarea>');
  html += '</div></div>';

  html += '<div class="card"><div class="section-title">💳 پرداخت آنلاین (زرین‌پال)</div>';
  html += '<div class="check-row"><input type="checkbox" name="pay_enabled" ' + (s.pay_enabled === '1' ? 'checked' : '') + '><div><b>فعال‌سازی پرداخت آنلاین</b><div class="hint">تا وقتی فعال نشود، در ربات نمایش داده نمی‌شود.</div></div></div>';
  html += '<div class="form-grid mt">' + field('مرچنت آیدی زرین‌پال (Merchant ID)', '<input name="pay_merchant_id" value="' + esc(s.pay_merchant_id) + '" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">') + '</div></div>';

  html += '<div class="card"><div class="section-title">🤖 دستیار هوشمند</div>';
  html += '<div class="check-row"><input type="checkbox" name="ai_enabled" ' + (s.ai_enabled === '1' ? 'checked' : '') + '><div><b>فعال‌سازی دستیار هوشمند</b><div class="hint">دستیار از Workers AI استفاده می‌کند؛ سهمیهٔ رایگان روزانه محدود است و مصرف بالاتر ممکن است هزینه داشته باشد.</div></div></div></div>';

  html += '<div class="card"><div class="section-title">📱 متن‌ها و زبان‌های مینی‌اپ</div><div class="hint" style="margin-bottom:12px">همهٔ برچسب‌ها و پیام‌های رابط را برای فارسی و انگلیسی ویرایش کنید. در مینی‌اپ، کاربر می‌تواند زبان را عوض کند؛ فیلد خالی از متن پیش‌فرض استفاده می‌کند.</div>';
  html += '<details class="miniapp-copy-block" open><summary>🇮🇷 متن‌های فارسی</summary><div class="form-grid mt">' + renderMiniAppTextFields('fa', miniappTexts) + '</div></details>';
  html += '<details class="miniapp-copy-block"><summary>🇬🇧 English interface text</summary><div class="form-grid mt">' + renderMiniAppTextFields('en', miniappTexts) + '</div></details></div>';

  if (state.isOwner) {
    html += '<div class="card"><div class="section-title">🔐 امنیت مدیر اصلی</div><div class="form-grid">';
    html += field('کد مدیریت', '<input value="' + esc(s.claim_code) + '" readonly><div class="hint">در ربات: /claim CODE</div>');
    html += field('رمز عبور جدید پنل (اختیاری)', '<input name="new_password" type="password" minlength="10" autocomplete="new-password" placeholder="دست‌کم ۱۰ نویسه">');
    html += '</div><div class="actions mt"><button type="button" class="btn btn-warning" data-action="regen-claim">🔄 ساخت کد مدیریت جدید</button></div></div>';
  } else {
    html += '<div class="card"><div class="section-title">🔐 دسترسی مدیر</div><div class="hint">مدیر اصلی، فهرست مدیران و تنظیمات امنیتی حساب را مدیریت می‌کند.</div></div>';
  }

  html += '<div class="actions"><button type="submit" class="btn btn-primary" style="padding:13px 34px;font-size:16px">💾 ذخیره همه تنظیمات</button></div></form>';
  return html;
}

// ================= پشتیبان‌گیری =================
async function pageAdmins(){
  var d = await api('/api/admins');
  var html = pageHeading('👑', 'مدیران فروشگاه', 'هر تعداد مدیر لازم است اضافه کن؛ دسترسی ربات و پنل را از یک‌جا مدیریت کن.');
  html += '<div class="dashboard-grid"><div class="card"><div class="card-heading"><div><div class="section-title">➕ افزودن مدیر کامل</div><div class="section-subtitle">این فرد به امکانات مدیریتی ربات و پنل دسترسی خواهد داشت.</div></div></div>';
  html += '<form id="adminForm"><div class="form-grid">';
  html += field('شناسهٔ تلگرام مدیر جدید', '<input name="user_id" inputmode="numeric" type="number" min="1" required placeholder="شناسهٔ عددی تلگرام">');
  html += field('رمز جداگانهٔ ورود به پنل', '<input name="password" type="password" minlength="10" required autocomplete="new-password" placeholder="دست‌کم ۱۰ نویسه">');
  html += '</div><div class="hint">مدیر جدید در تلگرام به ربات پیام بدهد و دستور /id را بفرستد؛ شناسه‌ای که می‌گیرد را اینجا وارد کن. پس از ذخیره، رمز پنل را امن به او بده.</div><div class="actions"><button class="btn btn-primary" type="submit">👑 افزودن مدیر</button></div></form></div>';
  html += '<div class="card"><div class="card-heading"><div><div class="section-title">🛡️ دسترسی‌های مدیران</div><div class="section-subtitle">حذف مدیر، دسترسی ربات و پنل او را لغو می‌کند.</div></div><span class="badge b-unpaid">' + fa(d.admins.length) + ' مدیر</span></div>';
  if (!d.admins.length) html += '<div class="empty">مدیری ثبت نشده است.</div>';
  else {
    html += '<div class="quick-list">';
    d.admins.forEach(function(a){
      var label = a.username ? '@' + a.username : (a.first_name || 'مدیر فروشگاه');
      html += '<div class="quick-item"><div class="quick-icon">' + (a.is_owner ? '👑' : '🛡️') + '</div><div class="quick-info"><strong>' + esc(label) + '</strong><small>شناسه: ' + fa(a.user_id) + ' · ' + (a.panel_access ? 'دسترسی ربات و پنل' : 'دسترسی مدیریت ربات غیرفعال') + '</small></div>';
      html += '<button class="btn btn-danger btn-sm" data-action="admin-remove" data-id="' + a.user_id + '">لغو دسترسی</button>';
      html += '</div>';
    });
    html += '</div>';
  }
  html += '</div></div>';
  return html;
}

function pageBackup(){
  var html = pageHeading('💾', 'پشتیبان‌گیری', 'ذخیره یا بازگردانی امن اطلاعات فروشگاه');
  html += '<div class="card"><div class="section-title">⬇️ تهیه نسخه پشتیبان</div><p style="color:#64748b;font-size:14px;margin-bottom:14px">یک فایل JSON از اطلاعات فروشگاه، سفارش‌ها، مشتری‌ها و تنظیمات دانلود می‌شود. فایل را در جای امن نگه دارید.</p><button class="btn btn-primary" data-action="backup-export">⬇️ دانلود نسخه پشتیبان</button></div>';
  html += '<div class="card"><div class="section-title">⬆️ بازیابی اطلاعات</div><p style="color:#64748b;font-size:14px;margin-bottom:14px">⚠️ بازیابی، اطلاعات فعلی را با محتوای فایل جایگزین می‌کند. فقط مدیر اصلی به این بخش دسترسی دارد.</p><input type="file" id="restoreFile" accept=".json"><div class="actions mt"><button class="btn btn-danger" data-action="backup-restore">🔄 بازیابی اطلاعات</button></div></div>';
  return html;
}

function closeModal(){ $('#modalRoot').innerHTML = ''; }

// ================= رویدادهای کلیک =================
document.addEventListener('click', async function(e){
  var el = e.target.closest('[data-action]');
  if (!el) return;
  var action = el.dataset.action;
  try {
    if (action === 'nav') go(el.dataset.page);
    else if (action === 'logout') { await api('/api/logout', { method: 'POST' }); location.reload(); }
    else if (action === 'refresh') render();
    else if (action === 'join-add') {
      $('#joinChannels').insertAdjacentHTML('beforeend', '<div class="join-channel-row" data-join-row><div class="field"><label>شناسهٔ کانال یا گروه</label><input name="join_channel" placeholder="@username یا شناسهٔ منفی مثل -100…"></div><div class="field"><label>پیوند عضویت</label><input name="join_link" placeholder="https://t.me/..."><div class="hint">برای گروه یا کانال عمومیِ دارای @username خالی بگذارید؛ پیوند خودکار ساخته می‌شود. برای مورد خصوصی، شناسه و پیوند دعوت HTTPS لازم است.</div></div><button type="button" class="btn btn-danger btn-sm join-remove" data-action="join-remove" aria-label="حذف مورد">حذف</button></div>');
    }
    else if (action === 'join-remove') {
      var row=el.closest('[data-join-row]');
      var rows=document.querySelectorAll('#joinChannels [data-join-row]');
      if (rows.length<=1) { row.querySelector('[name="join_channel"]').value=''; row.querySelector('[name="join_link"]').value=''; }
      else row.remove();
    }
    else if (action === 'game-add') {
      $('#gameRows').insertAdjacentHTML('beforeend', gameRowHtml({ id:'', name:'', emoji:'🎮', active:true }));
    }
    else if (action === 'game-remove') {
      var gameRow=el.closest('[data-game-row]');
      if (gameRow) gameRow.remove();
    }
    else if (action === 'offer-add') {
      $('#otherOfferRows').insertAdjacentHTML('beforeend', offerRowHtml({ title:'', description:'', sale_label:'$1', url:'' }));
    }
    else if (action === 'offer-remove') {
      var offerRow=el.closest('[data-offer-row]');
      if (offerRow) offerRow.remove();
    }
    else if (action === 'admin-remove') {
      if (confirm('دسترسی این مدیر از ربات و پنل لغو شود؟')) {
        await api('/api/admins/' + el.dataset.id, { method: 'DELETE' });
        toast('دسترسی مدیر لغو شد');
        render();
      }
    }
    else if (action === 'modal-close') closeModal();
    else if (action === 'rate-refresh') {
      var rateResult = await api('/api/exchange-rate/refresh', { method: 'POST', body: {} });
      toast((rateResult.cached ? '💱 نرخ دریافت‌شدهٔ اخیر: ' : '💱 نرخ مرجع به‌روز شد: ') + money(rateResult.exchange_rate.rate_toman));
      render();
    }
    else if (action === 'prod-new') openProductModal();
    else if (action === 'prod-edit') openProductModal(Number(el.dataset.id));
    else if (action === 'prod-del') {
      if (confirm('این محصول حذف شود؟')) { await api('/api/products/' + el.dataset.id, { method: 'DELETE' }); toast('🗑️ محصول حذف شد'); render(); }
    }
    else if (action === 'order-filter') { state.orderFilter = el.dataset.f; render(); }
    else if (action === 'order-view') openOrderModal(Number(el.dataset.id));
    else if (action === 'order-status') {
      var form = $('#orderForm');
      var note = form ? new FormData(form).get('admin_note') : '';
      await api('/api/orders/' + el.dataset.id, { method: 'PUT', body: { status: el.dataset.s, admin_note: note } });
      closeModal(); toast('✅ وضعیت سفارش به‌روز شد'); render();
    }
    else if (action === 'disc-toggle') {
      var d = await api('/api/discounts');
      var c = d.discounts.find(function(x){ return x.id === Number(el.dataset.id); });
      await api('/api/discounts/' + c.id, { method: 'PUT', body: { active: !c.active } });
      toast('✅ به‌روز شد'); render();
    }
    else if (action === 'disc-del') {
      if (confirm('این کد تخفیف حذف شود؟')) { await api('/api/discounts/' + el.dataset.id, { method: 'DELETE' }); toast('🗑️ حذف شد'); render(); }
    }
    else if (action === 'ticket-filter') { state.ticketFilter = el.dataset.f; render(); }
    else if (action === 'ticket-view') openTicketModal(Number(el.dataset.id));
    else if (action === 'ticket-close') {
      await api('/api/tickets/' + el.dataset.id, { method: 'PUT', body: { status: 'closed' } });
      closeModal(); toast('🔴 تیکت بسته شد'); render();
    }
    else if (action === 'regen-claim') {
      if (confirm('کد مدیریت فعلی باطل و کد جدید ساخته شود؟')) {
        await api('/api/settings', { method: 'PUT', body: { regen_claim: true } });
        toast('🔑 کد مدیریت جدید ساخته شد'); render();
      }
    }
    else if (action === 'backup-export') {
      var a = document.createElement('a');
      a.href = '/api/backup';
      a.download = 'shop-backup.json';
      a.click();
      toast('⬇️ در حال دانلود...');
    }
    else if (action === 'backup-restore') {
      var f = $('#restoreFile').files[0];
      if (!f) { toast('ابتدا فایل پشتیبان را انتخاب کنید', false); return; }
      if (!confirm('⚠️ همه اطلاعات فعلی حذف و با فایل پشتیبان جایگزین می‌شود. ادامه می‌دهید؟')) return;
      var text = await f.text();
      var data = JSON.parse(text);
      await api('/api/restore', { method: 'POST', body: { data: data } });
      toast('✅ اطلاعات بازیابی شد');
      render();
    }
  } catch(err) { toast(err.message, false); }
});

// ================= رویدادهای فرم =================
document.addEventListener('submit', async function(e){
  e.preventDefault();
  var form = e.target;
  try {
    if (form.id === 'loginForm') {
      await api('/api/login', { method: 'POST', body: { password: $('#loginPass').value } });
      toast('✅ خوش آمدید!');
      showApp();
    }
    else if (form.id === 'productForm') await saveProduct(form);
    else if (form.id === 'gameForm') {
      var games = [];
      Array.prototype.forEach.call(form.querySelectorAll('[data-game-row]'), function(row, index){
        var id = String(row.querySelector('[name="game_id"]').value || '').trim();
        if (!id) id = 'game-' + Date.now().toString(36) + '-' + index;
        games.push({
          id: id,
          name: String(row.querySelector('[name="game_name"]').value || '').trim(),
          emoji: String(row.querySelector('[name="game_emoji"]').value || '🎮').trim(),
          active: row.querySelector('[name="game_active"]').checked
        });
      });
      await api('/api/catalog/games', { method: 'PUT', body: { games: games } });
      toast('🎮 فهرست بازی‌ها ذخیره شد'); render();
    }
    else if (form.id === 'otherDealsForm') {
      var offers = [];
      Array.prototype.forEach.call(form.querySelectorAll('[data-offer-row]'), function(row){
        offers.push({
          title: String(row.querySelector('[name="offer_title"]').value || '').trim(),
          description: String(row.querySelector('[name="offer_description"]').value || '').trim(),
          sale_label: String(row.querySelector('[name="offer_label"]').value || '$1').trim(),
          url: String(row.querySelector('[name="offer_url"]').value || '').trim()
        });
      });
      var intro = String(new FormData(form).get('other_intro') || '').trim();
      await api('/api/catalog/other-deals', { method: 'PUT', body: { intro: intro, offers: offers } });
      toast('💵 پیشنهادهای جداگانه ذخیره شد'); render();
    }
    else if (form.id === 'orderForm') {
      var fd = new FormData(form);
      await api('/api/orders/' + form.dataset.id, { method: 'PUT', body: { status: form.dataset.status, admin_note: fd.get('admin_note') } });
      closeModal(); toast('💾 یادداشت ذخیره شد'); render();
    }
    else if (form.id === 'ticketForm') {
      var fd2 = new FormData(form);
      await api('/api/tickets/' + form.dataset.id, { method: 'PUT', body: { admin_reply: fd2.get('admin_reply') } });
      closeModal(); toast('📤 پاسخ ارسال شد'); render();
    }
    else if (form.id === 'discountForm') {
      var fd3 = new FormData(form);
      var code = String(fd3.get('code') || '').trim().toUpperCase();
      if (!code) {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        code = '';
        for (var i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
      }
      var exp = fd3.get('expires_at');
      await api('/api/discounts', { method: 'POST', body: { code: code, type: fd3.get('type'), value: Number(fd3.get('value')), max_uses: Number(fd3.get('max_uses') || 0), expires_at: exp ? new Date(exp).toISOString().slice(0, 19).replace('T', ' ') : '' } });
      toast('🎟️ کد تخفیف ساخته شد: ' + code);
      render();
    }
    else if (form.id === 'broadcastForm') {
      var fd4 = new FormData(form);
      var r = await api('/api/broadcast', { method: 'POST', body: { message: fd4.get('message') } });
      toast('📤 پیام برای ' + fa(r.sent) + ' نفر ارسال شد');
      form.reset();
    }
    else if (form.id === 'adminForm') {
      var af = new FormData(form);
      await api('/api/admins', { method: 'POST', body: { user_id: Number(af.get('user_id')), password: af.get('password') } });
      toast('👑 مدیر اضافه شد؛ رمز جداگانهٔ پنل را امن به او بده');
      form.reset();
      render();
    }
    else if (form.id === 'settingsForm') {
      var fd5 = new FormData(form);
      var body = {};
      ['trust_text','trust_links','shop_name','welcome_text','guide_text','support_username','support_info','card_number','card_owner','msg_order_pending','msg_order_confirmed','msg_order_shipped','msg_order_completed','msg_order_rejected','pay_merchant_id'].forEach(function(k){ body[k] = fd5.get(k); });
      body.force_join_channels = JSON.stringify(Array.prototype.map.call(document.querySelectorAll('#joinChannels [data-join-row]'), function(row){
        return { channel: row.querySelector('[name="join_channel"]').value.trim(), link: row.querySelector('[name="join_link"]').value.trim() };
      }).filter(function(item){ return item.channel || item.link; }));
      var miniappTextMap = { fa: {}, en: {} };
      Object.keys(MINIAPP_TEXT_LABELS).forEach(function(key){
        miniappTextMap.fa[key] = String(fd5.get('miniapp_fa_' + key) || '');
        miniappTextMap.en[key] = String(fd5.get('miniapp_en_' + key) || '');
      });
      body.miniapp_texts = JSON.stringify(miniappTextMap);
      body.pay_enabled = fd5.get('pay_enabled') ? '1' : '0';
      body.ai_enabled = fd5.get('ai_enabled') ? '1' : '0';
      body.force_join_enabled = fd5.get('force_join_enabled') ? '1' : '0';
      body.phone_required = fd5.get('phone_required') ? '1' : '0';
      var np = fd5.get('new_password');
      if (np) body.new_password = np;
      await api('/api/settings', { method: 'PUT', body: body });
      toast('💾 تنظیمات ذخیره شد');
      render();
    }
  } catch(err) { toast(err.message, false); }
});

// ================= شروع =================
(async function init(){
  try {
    var me = await api('/api/me');
    if (me.ok) { state.isOwner = me.is_owner === true; showApp(); } else showLogin();
  } catch(e) { showLogin(); }
})();
</script>
</body>
</html>`;

export function renderPanel() {
  return new Response(PANEL_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
