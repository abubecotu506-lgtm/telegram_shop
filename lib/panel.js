// ============================================================
//  پنل وب ادمین (HTML/CSS/JS داخل Worker)
// ============================================================

const PANEL_HTML = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>پنل مدیریت فروشگاه</title>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Vazirmatn',Tahoma,sans-serif;background:#f1f5f9;color:#1e293b;min-height:100vh}
button{font-family:inherit;cursor:pointer}
input,select,textarea{font-family:inherit}
/* ---------- صفحه ورود ---------- */
#loginBox{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.login-card{background:#fff;border-radius:20px;box-shadow:0 20px 50px rgba(0,0,0,.12);padding:40px 32px;width:100%;max-width:380px;text-align:center}
.login-card h1{font-size:26px;margin-bottom:8px}
.login-card p{color:#64748b;margin-bottom:24px;font-size:14px}
.login-card input{width:100%;padding:13px 16px;border:2px solid #e2e8f0;border-radius:12px;font-size:16px;margin-bottom:14px;text-align:center;transition:border-color .2s}
.login-card input:focus{outline:none;border-color:#6366f1}
.btn{display:inline-flex;align-items:center;gap:6px;border:none;border-radius:10px;padding:10px 18px;font-size:14px;font-weight:700;transition:transform .1s,opacity .2s}
.btn:hover{opacity:.9;transform:translateY(-1px)}
.btn-primary{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff}
.btn-success{background:linear-gradient(135deg,#10b981,#059669);color:#fff}
.btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff}
.btn-warning{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff}
.btn-gray{background:#e2e8f0;color:#334155}
.btn-block{width:100%;justify-content:center;padding:13px;font-size:16px}
.btn-sm{padding:6px 12px;font-size:12px;border-radius:8px}
/* ---------- چیدمان اصلی ---------- */
#app{display:flex;min-height:100vh}
aside{width:240px;background:linear-gradient(180deg,#312e81,#4c1d95);color:#fff;padding:24px 14px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column}
aside .logo{font-size:20px;font-weight:900;text-align:center;padding:10px 0 22px;border-bottom:1px solid rgba(255,255,255,.15);margin-bottom:18px}
.nav-item{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;margin-bottom:4px;cursor:pointer;font-size:14px;font-weight:500;transition:background .2s;color:#e0e7ff}
.nav-item:hover{background:rgba(255,255,255,.1)}
.nav-item.active{background:rgba(255,255,255,.2);color:#fff;font-weight:700}
aside .logout{margin-top:auto}
main{flex:1;padding:26px;max-width:1200px;margin:0 auto;width:100%}
.page-title{font-size:24px;font-weight:900;margin-bottom:20px}
/* ---------- کارت‌ها ---------- */
.card{background:#fff;border-radius:16px;box-shadow:0 4px 14px rgba(0,0,0,.06);padding:22px;margin-bottom:20px}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:20px}
.stat{background:#fff;border-radius:16px;box-shadow:0 4px 14px rgba(0,0,0,.06);padding:20px;text-align:center}
.stat .icon{font-size:30px;margin-bottom:6px}
.stat .num{font-size:24px;font-weight:900}
.stat .lbl{color:#64748b;font-size:13px;margin-top:2px}
/* ---------- جدول ---------- */
table{width:100%;border-collapse:collapse;font-size:14px}
th{background:#f8fafc;color:#475569;text-align:right;padding:11px 12px;border-bottom:2px solid #e2e8f0;font-size:13px}
td{padding:11px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
tr:hover td{background:#f8fafc}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700}
.b-pending{background:#fef3c7;color:#92400e}
.b-unpaid{background:#ede9fe;color:#5b21b6}
.b-confirmed{background:#d1fae5;color:#065f46}
.b-shipped{background:#dbeafe;color:#1e40af}
.b-completed{background:#dcfce7;color:#166534}
.b-rejected{background:#fee2e2;color:#991b1b}
.b-open{background:#d1fae5;color:#065f46}
.b-answered{background:#dbeafe;color:#1e40af}
.b-closed{background:#e2e8f0;color:#475569}
.b-on{background:#d1fae5;color:#065f46}
.b-off{background:#fee2e2;color:#991b1b}
/* ---------- فرم ---------- */
.form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.field label{display:block;font-size:13px;font-weight:700;color:#475569;margin-bottom:6px}
.field input,.field select,.field textarea{width:100%;padding:10px 12px;border:2px solid #e2e8f0;border-radius:10px;font-size:14px;transition:border-color .2s}
.field input:focus,.field select,.field textarea:focus{outline:none;border-color:#6366f1}
.field textarea{min-height:80px;resize:vertical}
.field.full{grid-column:1/-1}
.check-row{display:flex;align-items:center;gap:10px;padding:12px;background:#f8fafc;border-radius:10px}
.check-row input{width:20px;height:20px}
.hint{font-size:12px;color:#94a3b8;margin-top:4px}
.section-title{font-size:17px;font-weight:900;margin:6px 0 14px;color:#312e81}
/* ---------- مودال ---------- */
.modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px;z-index:50}
.modal{background:#fff;border-radius:18px;padding:26px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto}
.modal h3{font-size:18px;font-weight:900;margin-bottom:16px}
.modal .actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap}
/* ---------- تب‌ها ---------- */
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.tab{padding:8px 16px;border-radius:20px;border:2px solid #e2e8f0;background:#fff;font-size:13px;font-weight:700;color:#64748b}
.tab.active{background:#6366f1;color:#fff;border-color:#6366f1}
/* ---------- نمودار ---------- */
.bar-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:13px}
.bar-row .lbl{width:110px;text-align:left;color:#475569}
.bar-track{flex:1;background:#f1f5f9;border-radius:8px;height:22px;overflow:hidden}
.bar-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:8px;transition:width .5s}
.bar-row .val{width:60px;font-weight:700}
/* ---------- پیام ---------- */
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#065f46;color:#fff;padding:13px 26px;border-radius:12px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.25);z-index:100;animation:slideUp .3s}
.toast.err{background:#991b1b}
@keyframes slideUp{from{opacity:0;transform:translate(-50%,20px)}to{opacity:1;transform:translate(-50%,0)}}
.loading{text-align:center;color:#94a3b8;padding:40px;font-size:15px}
.empty{text-align:center;color:#94a3b8;padding:30px;font-size:14px}
.thumb{width:44px;height:44px;object-fit:cover;border-radius:8px}
.flex{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.mt{margin-top:14px}
@media(max-width:820px){
  aside{width:64px;padding:16px 8px}
  aside .logo{font-size:0}
  aside .logo::after{content:'🏪';font-size:24px}
  .nav-item span{display:none}
  .nav-item{justify-content:center}
  main{padding:16px}
}
</style>
</head>
<body>

<div id="loginBox" style="display:none">
  <div class="login-card">
    <h1>🏪 پنل مدیریت فروشگاه</h1>
    <p>برای ورود، رمز عبور ادمین را وارد کنید</p>
    <form id="loginForm">
      <input type="password" id="loginPass" placeholder="رمز عبور" autocomplete="current-password">
      <button class="btn btn-primary btn-block" type="submit">🔐 ورود</button>
    </form>
  </div>
</div>

<div id="app" style="display:none">
  <aside>
    <div class="logo">🏪 فروشگاه من</div>
    <div class="nav-item" data-action="nav" data-page="dashboard"><span>📊</span><span>داشبورد</span></div>
    <div class="nav-item" data-action="nav" data-page="products"><span>📦</span><span>محصولات</span></div>
    <div class="nav-item" data-action="nav" data-page="orders"><span>🧾</span><span>سفارش‌ها</span></div>
    <div class="nav-item" data-action="nav" data-page="discounts"><span>🎟️</span><span>کدهای تخفیف</span></div>
    <div class="nav-item" data-action="nav" data-page="tickets"><span>🎧</span><span>پشتیبانی</span></div>
    <div class="nav-item" data-action="nav" data-page="reports"><span>📈</span><span>گزارش‌ها</span></div>
    <div class="nav-item" data-action="nav" data-page="broadcast"><span>📢</span><span>پیام جمعی</span></div>
    <div class="nav-item" data-action="nav" data-page="settings"><span>⚙️</span><span>تنظیمات</span></div>
    <div class="nav-item" data-action="nav" data-page="backup"><span>💾</span><span>پشتیبان‌گیری</span></div>
    <div class="nav-item logout" data-action="logout"><span>🚪</span><span>خروج</span></div>
  </aside>
  <main id="page"></main>
</div>

<div id="modalRoot"></div>

<script>
var state = { page: 'dashboard', orderFilter: 'all', ticketFilter: 'open' };

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
function showApp(){ $('#loginBox').style.display = 'none'; $('#app').style.display = 'flex'; render(); }

function go(page){ state.page = page; render(); }

async function render(){
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
  } catch(e) { main.innerHTML = '<div class="card">❌ خطا: ' + esc(e.message) + '</div>'; }
}

// ================= داشبورد =================
async function pageDashboard(){
  var d = await api('/api/dashboard');
  var s = d.stats;
  var html = '<div class="page-title">📊 داشبورد</div>';
  html += '<div class="stats-grid">';
  html += stat('🧾', s.orders, 'کل سفارش‌ها');
  html += stat('⏳', s.pending, 'سفارش‌های جدید');
  html += stat('💰', money(s.revenue), 'درآمد');
  html += stat('📦', s.products, 'محصولات');
  html += stat('👥', s.users, 'کاربران');
  html += stat('🎧', s.tickets, 'تیکت‌های باز');
  html += '</div>';
  html += '<div class="card"><div class="section-title">🕐 آخرین سفارش‌ها</div>';
  if (!d.recent.length) html += '<div class="empty">هنوز سفارشی ثبت نشده است.</div>';
  else {
    html += '<table><tr><th>کد سفارش</th><th>محصول</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th></tr>';
    d.recent.forEach(function(o){
      html += '<tr><td><b>' + esc(o.order_code) + '</b></td><td>' + esc(o.product_name) + '</td><td>' + money(o.final_price) + '</td><td><span class="badge ' + (STATUS_CLS[o.status] || 'b-pending') + '">' + (STATUS_FA[o.status] || o.status) + '</span></td><td>' + esc(o.created_at || '') + '</td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  return html;
}
function stat(icon, num, lbl){ return '<div class="stat"><div class="icon">' + icon + '</div><div class="num">' + num + '</div><div class="lbl">' + lbl + '</div></div>'; }

// ================= محصولات =================
async function pageProducts(){
  var d = await api('/api/products');
  var html = '<div class="page-title">📦 محصولات</div>';
  html += '<div class="card"><div class="flex" style="justify-content:space-between"><div class="section-title" style="margin:0">لیست محصولات (' + fa(d.products.length) + ')</div><button class="btn btn-primary" data-action="prod-new">➕ محصول جدید</button></div>';
  if (!d.products.length) html += '<div class="empty">هنوز محصولی ثبت نشده است.</div>';
  else {
    html += '<table class="mt"><tr><th>عکس</th><th>نام</th><th>قیمت</th><th>نوع</th><th>وضعیت</th><th>عملیات</th></tr>';
    d.products.forEach(function(p){
      var typeFa = p.type === 'digital' ? 'دیجیتال' : p.type === 'physical' ? 'فیزیکی' : 'خدماتی';
      html += '<tr><td>' + (p.photo_file_id ? '🖼️' : '—') + '</td>';
      html += '<td><b>' + esc(p.name) + '</b></td><td>' + money(p.price) + '</td><td>' + typeFa + '</td>';
      html += '<td><span class="badge ' + (p.active ? 'b-on' : 'b-off') + '">' + (p.active ? '🟢 فعال' : '🔴 غیرفعال') + '</span></td>';
      html += '<td><div class="flex"><button class="btn btn-gray btn-sm" data-action="prod-edit" data-id="' + p.id + '">✏️ ویرایش</button><button class="btn btn-danger btn-sm" data-action="prod-del" data-id="' + p.id + '">🗑️ حذف</button></div></td></tr>';
    });
    html += '</table>';
  }
  html += '</div>';
  return html;
}

function openProductModal(id){
  api('/api/products').then(function(d){
    var p = null;
    if (id) p = d.products.find(function(x){ return x.id === id; });
    var title = p ? '✏️ ویرایش محصول' : '➕ محصول جدید';
    var html = '<div class="modal-overlay" data-action="modal-close"><div class="modal" onclick="event.stopPropagation()"><h3>' + title + '</h3>';
    html += '<form id="productForm" data-id="' + (p ? p.id : '') + '"><div class="form-grid">';
    html += field('نام محصول', '<input name="name" required value="' + esc(p ? p.name : '') + '">');
    html += field('قیمت (تومان)', '<input name="price" type="number" min="1" required value="' + (p ? p.price : '') + '">');
    html += field('نوع کالا', '<select name="type"><option value="digital"' + (p && p.type === 'digital' ? ' selected' : '') + '>دیجیتال</option><option value="physical"' + (p && p.type === 'physical' ? ' selected' : '') + '>فیزیکی</option><option value="service"' + (p && p.type === 'service' ? ' selected' : '') + '>خدماتی</option></select>');
    html += field('عکس محصول', '<input type="file" name="photoFile" accept="image/*"><div class="hint">اگر عکس جدید انتخاب کنید، جایگزین می‌شود. در غیر این صورت عکس قبلی می‌ماند.</div><input type="hidden" name="photo_file_id" value="' + esc(p ? p.photo_file_id : '') + '">');
    html += field('توضیحات', '<textarea name="description">' + esc(p ? p.description : '') + '</textarea>', true);
    html += field('متن تحویل (هنگام ارسال برای مشتری)', '<textarea name="delivery_text">' + esc(p ? p.delivery_text : '') + '</textarea>', true);
    html += field('لینک تحویل (اختیاری)', '<input name="delivery_link" value="' + esc(p ? p.delivery_link : '') + '" placeholder="https://...">');
    html += field('وضعیت', '<select name="active"><option value="1"' + (!p || p.active ? ' selected' : '') + '>🟢 فعال</option><option value="0"' + (p && !p.active ? ' selected' : '') + '>🔴 غیرفعال</option></select>');
    html += '</div><div class="actions"><button type="button" class="btn btn-gray" data-action="modal-close">انصراف</button><button type="submit" class="btn btn-primary">💾 ذخیره</button></div></form></div></div>';
    $('#modalRoot').innerHTML = html;
  });
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
  var d = await api('/api/orders?status=' + state.orderFilter);
  var tabs = [['all','همه'],['pending','⏳ در انتظار بررسی'],['unpaid','💳 در انتظار پرداخت'],['confirmed','✅ تأیید شده'],['shipped','🚚 ارسال شده'],['completed','🎉 تکمیل شده'],['rejected','❌ رد شده']];
  var html = '<div class="page-title">🧾 سفارش‌ها</div><div class="tabs">';
  tabs.forEach(function(t){ html += '<button class="tab' + (state.orderFilter === t[0] ? ' active' : '') + '" data-action="order-filter" data-f="' + t[0] + '">' + t[1] + '</button>'; });
  html += '</div><div class="card">';
  if (!d.orders.length) html += '<div class="empty">سفارشی در این بخش وجود ندارد.</div>';
  else {
    html += '<table><tr><th>کد سفارش</th><th>مشتری</th><th>محصول</th><th>مبلغ</th><th>پرداخت</th><th>وضعیت</th><th>تاریخ</th><th>عملیات</th></tr>';
    d.orders.forEach(function(o){
      html += '<tr><td><b>' + esc(o.order_code) + '</b></td><td>' + esc(o.username || ('کاربر ' + o.user_id)) + '</td><td>' + esc(o.product_name) + '</td><td>' + money(o.final_price) + '</td><td>' + (o.payment_method === 'online' ? '💻 آنلاین' : '💳 کارت‌به‌کارت') + '</td><td><span class="badge ' + (STATUS_CLS[o.status] || 'b-pending') + '">' + (STATUS_FA[o.status] || o.status) + '</span></td><td>' + esc(o.created_at || '') + '</td>';
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
  var html = '<div class="page-title">🎟️ کدهای تخفیف</div>';
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
  var d = await api('/api/tickets?status=' + state.ticketFilter);
  var tabs = [['open','🟢 باز'],['answered','✅ پاسخ داده شده'],['closed','🔴 بسته'],['all','همه']];
  var html = '<div class="page-title">🎧 پشتیبانی</div><div class="tabs">';
  tabs.forEach(function(t){ html += '<button class="tab' + (state.ticketFilter === t[0] ? ' active' : '') + '" data-action="ticket-filter" data-f="' + t[0] + '">' + t[1] + '</button>'; });
  html += '</div><div class="card">';
  if (!d.tickets.length) html += '<div class="empty">تیکتی در این بخش وجود ندارد.</div>';
  else {
    html += '<table><tr><th>شماره</th><th>کاربر</th><th>پیام</th><th>وضعیت</th><th>تاریخ</th><th>عملیات</th></tr>';
    d.tickets.forEach(function(t){
      html += '<tr><td><b>#' + fa(t.id) + '</b></td><td>' + esc(t.username || ('کاربر ' + t.user_id)) + '</td><td>' + esc(String(t.message).slice(0, 60)) + (String(t.message).length > 60 ? '...' : '') + '</td><td><span class="badge ' + (t.status === 'open' ? 'b-open' : t.status === 'answered' ? 'b-answered' : 'b-closed') + '">' + (TICKET_FA[t.status] || t.status) + '</span></td><td>' + esc(t.created_at || '') + '</td>';
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
  var html = '<div class="page-title">📈 گزارش‌ها</div>';
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
  var html = '<div class="page-title">📢 پیام جمعی</div><div class="card">';
  html += '<div class="section-title">✉️ ارسال پیام به همه کاربران</div>';
  html += '<form id="broadcastForm"><div class="field"><label>متن پیام</label><textarea name="message" required placeholder="پیام خود را بنویسید..."></textarea><div class="hint">این پیام برای همه کاربرانی که ربات را استارت کرده‌اند ارسال می‌شود.</div></div>';
  html += '<div class="actions mt"><button type="submit" class="btn btn-primary">📤 ارسال پیام</button></div></form></div>';
  return html;
}

// ================= تنظیمات =================
async function pageSettings(){
  var d = await api('/api/settings');
  var s = d.settings;
  var html = '<div class="page-title">⚙️ تنظیمات فروشگاه</div>';
  html += '<form id="settingsForm"><div class="card"><div class="section-title">🏪 اطلاعات عمومی</div><div class="form-grid">';
  html += field('نام فروشگاه', '<input name="shop_name" value="' + esc(s.shop_name) + '">');
  html += field('شماره کارت پرداخت', '<input name="card_number" value="' + esc(s.card_number) + '" placeholder="6037-xxxx-xxxx-xxxx">');
  html += field('نام صاحب کارت', '<input name="card_owner" value="' + esc(s.card_owner) + '">');
  html += field('متن خوش‌آمدگویی (پیام /start)', '<textarea name="welcome_text">' + esc(s.welcome_text) + '</textarea>', true);
  html += field('راهنمای خرید', '<textarea name="guide_text">' + esc(s.guide_text) + '</textarea>', true);
  html += field('اطلاعات پشتیبانی و ساعت کاری', '<textarea name="support_info">' + esc(s.support_info) + '</textarea>', true);
  html += '</div></div>';

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
  html += '<div class="check-row"><input type="checkbox" name="ai_enabled" ' + (s.ai_enabled === '1' ? 'checked' : '') + '><div><b>فعال‌سازی دستیار هوشمند رایگان</b><div class="hint">با هوش مصنوعی رایگان Cloudflare به سؤال‌های مشتری‌ها پاسخ می‌دهد.</div></div></div></div>';

  html += '<div class="card"><div class="section-title">🔐 امنیت</div><div class="form-grid">';
  html += field('کد مدیریت (Claim Code)', '<input value="' + esc(s.claim_code) + '" readonly><div class="hint">در ربات: /claim CODE</div>');
  html += field('رمز عبور جدید پنل (اختیاری)', '<input name="new_password" type="password" placeholder="برای تغییر رمز، اینجا بنویسید">');
  html += '</div><div class="actions mt"><button type="button" class="btn btn-warning" data-action="regen-claim">🔄 ساخت کد مدیریت جدید</button></div></div>';

  html += '<div class="actions"><button type="submit" class="btn btn-primary" style="padding:13px 34px;font-size:16px">💾 ذخیره همه تنظیمات</button></div></form>';
  return html;
}

// ================= پشتیبان‌گیری =================
function pageBackup(){
  var html = '<div class="page-title">💾 پشتیبان‌گیری و بازیابی</div>';
  html += '<div class="card"><div class="section-title">⬇️ تهیه نسخه پشتیبان</div><p style="color:#64748b;font-size:14px;margin-bottom:14px">یک فایل JSON از همه اطلاعات فروشگاه (محصولات، سفارش‌ها، کدهای تخفیف، تیکت‌ها، کاربران و تنظیمات) دانلود می‌شود.</p><button class="btn btn-primary" data-action="backup-export">⬇️ دانلود نسخه پشتیبان</button></div>';
  html += '<div class="card"><div class="section-title">⬆️ بازیابی اطلاعات</div><p style="color:#64748b;font-size:14px;margin-bottom:14px">⚠️ فایل پشتیبان را انتخاب کنید. اطلاعات فعلی با اطلاعات فایل جایگزین می‌شود!</p><input type="file" id="restoreFile" accept=".json"><div class="actions mt"><button class="btn btn-danger" data-action="backup-restore">🔄 بازیابی اطلاعات</button></div></div>';
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
    else if (action === 'modal-close') closeModal();
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
    else if (form.id === 'settingsForm') {
      var fd5 = new FormData(form);
      var body = {};
      ['shop_name','welcome_text','guide_text','support_info','card_number','card_owner','msg_order_pending','msg_order_confirmed','msg_order_shipped','msg_order_completed','msg_order_rejected','pay_merchant_id'].forEach(function(k){ body[k] = fd5.get(k); });
      body.pay_enabled = fd5.get('pay_enabled') ? '1' : '0';
      body.ai_enabled = fd5.get('ai_enabled') ? '1' : '0';
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
    if (me.ok) showApp(); else showLogin();
  } catch(e) { showLogin(); }
})();
</script>
</body>
</html>`;

export function renderPanel() {
  return new Response(PANEL_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
