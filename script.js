// ===== ข้อมูล (เก็บใน localStorage) =====
const K = 'mypos2';
let db = Object.assign({ customers: [], products: [], suppliers: [], staff: [], bills: [], parked: [], purchases: [], tx: [], exps: [], expItems: [] }, JSON.parse(localStorage.getItem(K) || '{}'));
const save = () => localStorage.setItem(K, JSON.stringify(db));

// ===== ตัวช่วย =====
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nowS = () => { const d = new Date(); return ymd(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const fm = n => Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fd = s => new Date(s).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
const uid = () => String(Date.now() + Math.floor(Math.random() * 1000));
const n = x => parseFloat(x) || 0;
const sum = (a, k = 'total') => a.reduce((s, x) => s + (+x[k] || 0), 0);
function rng(p) {
  const t = new Date(), y = t.getFullYear(), m = t.getMonth(); let a = new Date(t);
  if (p === 'week') a.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  if (p === 'month') a = new Date(y, m, 1);
  if (p === 'year') a = new Date(y, 0, 1);
  return [ymd(a), ymd(t)];
}
const inR = (d, a, b) => { d = d.slice(0, 10); return d >= a && d <= b; };
const per = (d, p) => p === 'all' || inR(d, ...rng(p));
const PO = [['all', 'ทั้งหมด'], ['day', 'วันนี้'], ['week', 'สัปดาห์นี้'], ['month', 'เดือนนี้'], ['year', 'ปีนี้']];
const selH = (o, cur, js) => `<select class="inp !w-auto" onchange="${js}">${o.map(([v, l]) => `<option value="${esc(v)}" ${cur === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;

const WALK = 'ลูกค้าหน้าร้าน (ทั่วไป)';
const PAY = { cash: 'เงินสด', transfer: 'เงินโอน' };
const TX = { wage: 'จ่ายค่าจ้าง', adv: 'เบิกล่วงหน้า', dep: 'ฝากเงิน', rep: 'หักคืนเงินเบิก' };
const stat = b => b.status === 'paid' ? `ชำระแล้ว (${PAY[b.pay]})` : 'ค้างชำระ';
let cust = WALK, cart = [], pcart = [], view = 'home', split = 'bill', sup = '';
let F = { p: 'all', s: 'all', c: 'all' }, ST = { tab: 'list', id: null, p: 'all' };
let S = { p: 'day', from: ymd(new Date()), to: ymd(new Date()) };

// ===== Modal / Toast / ฟอร์ม =====
function modal(h) { $('#mbox').style.maxWidth = ''; $('#mbox').innerHTML = h; $('#mbox').oninput = null; $('#modal').classList.remove('hidden'); }
function closeM() { $('#modal').classList.add('hidden'); }
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 2500); }
let npA = null;
function setNp(i) { npA = i; document.querySelectorAll('#mbox .np').forEach(x => x.classList.toggle('act', x === i)); }
function np(k) {
  if (!npA) return; let v = npA.value;
  if (k === '⌫') v = v.slice(0, -1); else if (k === 'C') v = '';
  else if (k === '.') { if (v.includes('.')) return; v = (v || '0') + '.'; }
  else v = v === '0' ? k : v + k;
  npA.value = v; const m = $('#mbox'); if (m.oninput) m.oninput();
}
function form(title, fields, ok, extra = '') {
  const hasNum = fields.some(f => f.t === 'number');
  const fh = fields.map(f => `<label class="block text-sm font-bold text-slate-500 mt-2">${f.l}</label>` +
    (f.o ? `<select id="f_${f.k}" class="inp">${f.o.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`
      : f.t === 'number' ? `<input id="f_${f.k}" class="inp np" readonly inputmode="none" value="${esc(f.v ?? '')}">`
        : `<input id="f_${f.k}" class="inp" type="${f.t || 'text'}" value="${esc(f.v ?? '')}">`)).join('');
  const pad = hasNum ? `<div class="w-64"><div class="grid grid-cols-3 gap-2 mt-2">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(k => `<button type="button" class="numpad-btn" onclick="np('${k}')">${k}</button>`).join('')}</div><button type="button" class="btn w-full mt-2" onclick="np('C')">ล้างช่องนี้</button></div>` : '';
  modal(`<h3 class="text-2xl font-bold mb-2">${esc(title)}</h3><div class="flex gap-4"><div class="flex-1">${fh}${extra}</div>${pad}</div><div class="flex gap-2 mt-4"><button class="btn flex-1" onclick="closeM()">ยกเลิก</button><button class="btn p flex-1" id="fok">ตกลง</button></div>`);
  $('#mbox').style.maxWidth = hasNum ? '48rem' : '';
  document.querySelectorAll('#mbox .np').forEach(i => i.onclick = () => setNp(i));
  const f1 = document.querySelector('#mbox .np'); if (f1) setNp(f1);
  $('#fok').onclick = () => { const v = {}; fields.forEach(f => v[f.k] = $('#f_' + f.k).value.trim()); ok(v); };
  const i = $('#mbox input:not(.np)'); if (i) i.focus();
}
function pr(html) { $('#print-area').innerHTML = html; window.print(); }

// ===== ใบเสร็จ =====
const HEAD = `<div class="text-center font-black text-2xl">ร้านปลาเม้า</div><div class="text-center text-xs font-semibold">551/145 ถนนมิตรภาพ (ซอย 10) ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000</div><div class="text-center text-xs font-semibold">โทร: 081-760-2807</div>`;
const line = i => `<div class="flex justify-between items-start"><div><b>${esc(i.name)} / ${i.qty}${i.unit === 'kg' ? ' kg' : ' ชิ้น'}${i.cnt ? ' (' + i.cnt + ' ตัว)' : ''}</b><div class="text-[11px]">(@฿${fm(i.price)}${i.unit === 'kg' ? '/kg' : '/หน่วย'})</div></div><b>฿${fm(i.total)}</b></div>`;
const cartLines = (a, fn) => a.length ? a.map(i => `<div class="flex gap-1"><div class="flex-1">${line(i)}</div><button class="text-rose-600 no-print" onclick="${fn}('${i.id}')">✕</button></div>`).join('') : '<div class="text-center text-slate-400 py-6">- ยังไม่มีรายการ -</div>';
function body(b) {
  if (!b.merged) return b.items.map(line).join('');
  const g = {}; b.merged.forEach(m => { const k = split === 'day' ? m.date.slice(0, 10) : m.id; (g[k] = g[k] || []).push(m); });
  return Object.entries(g).map(([k, ms]) => `<div class="border-t border-dashed border-black pt-1 mt-1"><div class="font-bold text-xs">${split === 'day' ? 'วันที่ ' + new Date(k).toLocaleDateString('th-TH') : 'บิล ' + k + ' (' + fd(ms[0].date) + ')'}</div>${ms.map(m => m.items.map(line).join('')).join('')}<div class="text-right text-sm font-bold">รวม ฿${fm(sum(ms))}</div></div>`).join('');
}
const receipt = (b, pre) => `<div class="receipt">${HEAD}<div class="font-extrabold text-center border-y-2 border-black my-2 py-1">ใบเสร็จรับเงิน</div><div class="text-xs mb-1">${b.id ? 'เลขที่: ' + b.id + '<br>' : ''}เวลา: ${fd(b.date)}<br>ลูกค้า: <b>${esc(b.customer)}</b>${b.status ? '<br>สถานะ: ' + stat(b) : ''}</div><div class="border-t-2 border-black pt-1 space-y-1">${pre || body(b)}</div><div class="border-t-2 border-black mt-2 pt-1 flex justify-between text-xl font-black"><span>รวมทั้งสิ้น</span><span>฿${fm(b.total)}</span></div><div class="text-center text-xs mt-3">Line: @yourstore<br><b>" THANK YOU "</b></div></div>`;

// ===== หน้าจอ =====
const tile = (e, l, v, c) => `<button onclick="go('${v}')" class="${c} text-white rounded-2xl p-6 text-center font-extrabold text-xl shadow active:scale-95"><div class="text-4xl mb-1">${e}</div>${l}</button>`;
const pgrid = t => `<div class="pgrid">${db.products.map(p => `<div class="pbtn" onclick="tap('${p.id}','${t}')"><button class="x" onclick="event.stopPropagation();delProd('${p.id}')">✕</button><b>${esc(p.name)}</b><small>${p.type === 'kg' ? 'ชั่งน้ำหนัก' : 'ชิ้น/ถุง'}</small></div>`).join('') || '<p class="text-slate-400">ยังไม่มีปุ่มสินค้า กด "+ สร้างปุ่มสินค้า"</p>'}</div>`;
const txTable = (rows, showName) => `<table class="w-full text-sm">${rows.map(t => `<tr><td>${fd(t.date)}</td>${showName ? `<td>${esc(sname(t.sid))}</td>` : ''}<td>${TX[t.type]}</td><td class="text-right font-bold">฿${fm(t.amount)}</td><td class="text-xs text-slate-500">${esc(t.note || '')}</td><td><button class="text-rose-600" onclick="delTx('${t.id}')">✕</button></td></tr>`).join('') || '<tr><td class="text-slate-400">ไม่มีรายการ</td></tr>'}</table>`;
const sname = id => (db.staff.find(s => s.id == id) || {}).name || '-';
const nameBox = (key, label, onsel) => `<div class="card"><div class="flex justify-between mb-2"><b>${label}</b><button class="btn g" onclick="addName('${key}','ชื่อ')">+ เพิ่มรายชื่อ</button></div><div class="grid grid-cols-3 gap-2">${db[key].map((c, i) => `<div class="border rounded-xl p-2 flex gap-1 items-center"><button class="btn p flex-1" onclick="${onsel}(${i})">${esc(c)}</button><button class="text-rose-600" onclick="delName('${key}',${i})">🗑</button></div>`).join('') || '<p class="text-slate-400">ยังไม่มีรายชื่อ</p>'}</div></div>`;

const V = {
  home: () => `<div class="grid grid-cols-3 gap-4 max-w-4xl mx-auto mt-4">${tile('🛒', 'เมนูการขาย', 'cust', 'bg-indigo-600 col-span-3')}${tile('🧾', 'ประวัติบิล', 'bills', 'bg-sky-600')}${tile('📦', 'ซื้อเข้า', 'purchase', 'bg-emerald-600')}${tile('👷', 'ค่าจ้างพนักงาน', 'staff', 'bg-amber-600')}${tile('💸', 'รายจ่ายทั่วไป', 'exp', 'bg-rose-600')}${tile('📊', 'สรุปบัญชี', 'sum', 'bg-slate-700')}</div>`,

  cust: () => `<div class="max-w-4xl mx-auto grid gap-3"><button class="btn p text-2xl py-8" onclick="selCust(WALK)">👤 ${WALK}</button>${nameBox('customers', 'ลูกค้าประจำ', 'selReg')}</div>`,

  pos: () => `<div class="flex gap-3" style="height:calc(100vh - 70px)"><div class="card flex-1 overflow-y-auto"><div class="flex flex-wrap gap-2 items-center mb-3"><b>ลูกค้า:</b><span class="bg-indigo-100 text-indigo-900 font-bold px-3 py-1 rounded-lg">${esc(cust)}</span><button class="btn" onclick="editCust()">✏️ แก้ชื่อ</button><button class="btn" onclick="go('cust')">เปลี่ยนลูกค้า</button><button class="btn a" onclick="parkedList()">🕐 บิลที่พัก (${db.parked.length})</button><button class="btn p ml-auto" onclick="addProd()">+ สร้างปุ่มสินค้า</button></div>${pgrid('c')}</div><div class="w-[420px] flex flex-col gap-2"><div class="card flex-1 overflow-y-auto">${receipt({ date: nowS(), customer: cust, total: sum(cart) }, cartLines(cart, 'delCart'))}</div><div class="grid grid-cols-3 gap-2"><button class="btn r" onclick="clearCart()">ยกเลิกบิล</button><button class="btn a" onclick="park()">พักบิล</button><button class="btn g" onclick="payM()">ชำระเงิน</button></div></div></div>`,

  bills: () => {
    const L = db.bills.filter(b => per(b.date, F.p) && (F.s === 'all' || b.status === F.s) && (F.c === 'all' || b.customer === F.c));
    const cs = [['all', 'ลูกค้าทั้งหมด'], ...[...new Set(db.bills.map(b => b.customer))].map(c => [c, c])];
    return `<div class="card"><div class="flex flex-wrap gap-2 items-center mb-3">${selH(PO, F.p, "F.p=this.value;render()")}${selH(cs, F.c, "F.c=this.value;render()")}${selH([['all', 'ทุกสถานะ'], ['unpaid', 'ค้างชำระ'], ['paid', 'ชำระแล้ว']], F.s, "F.s=this.value;render()")}<button class="btn p ml-auto" onclick="mergeSel()">รวมบิลที่เลือก</button><button class="btn r" onclick="cancelSel()">ยกเลิกที่เลือก</button></div><table class="w-full text-sm"><tr class="font-bold"><td></td><td>เลขที่</td><td>วันที่</td><td>ลูกค้า</td><td class="text-right">ยอดรวม</td><td>สถานะ</td><td></td></tr>${L.map(b => `<tr><td><input type="checkbox" class="bc" value="${b.id}"></td><td class="font-bold">${b.id}</td><td class="text-xs">${fd(b.date)}</td><td>${esc(b.customer)}${b.merged ? ' <span class="text-xs bg-indigo-100 px-1 rounded">รวมบิล</span>' : ''}</td><td class="text-right font-black">฿${fm(b.total)}</td><td><span class="px-2 py-0.5 rounded-full text-xs font-bold ${b.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${stat(b)}</span></td><td><button class="btn" onclick="openBill('${b.id}')">เปิดดู</button></td></tr>`).join('') || '<tr><td colspan="7" class="text-center text-slate-400 p-6">ไม่พบบิล</td></tr>'}</table></div>`;
  },

  purchase: () => `<div class="flex gap-3" style="height:calc(100vh - 70px)"><div class="card flex-1 overflow-y-auto"><div class="flex flex-wrap gap-2 items-center mb-3"><b>ซื้อจาก:</b>${selH([['', '-- เลือกผู้ขาย --'], ...db.suppliers.map(s => [s, s])], sup, "sup=this.value;render()")}<button class="btn g" onclick="addName('suppliers','ชื่อผู้ขาย')">+ ผู้ขาย</button><button class="btn r" onclick="delSup()">ลบผู้ขาย</button><button class="btn p ml-auto" onclick="addProd()">+ สร้างปุ่มสินค้า</button></div>${pgrid('p')}</div><div class="w-[440px] flex flex-col gap-2 overflow-y-auto"><div class="card"><b>รายการซื้อเข้า (${esc(sup || 'ยังไม่เลือกผู้ขาย')})</b><div class="space-y-1 my-2">${cartLines(pcart, 'delP')}</div><div class="flex justify-between font-black text-lg border-t pt-1"><span>รวม</span><span>฿${fm(sum(pcart))}</span></div><button class="btn g w-full mt-2" onclick="savePur()">ยืนยัน (ค้างจ่าย)</button></div><div class="card space-y-2"><b>ประวัติซื้อเข้า</b>${db.purchases.map(p => `<div class="border rounded-xl p-2 text-sm"><div class="flex justify-between"><b>${esc(p.supplier)}</b><span class="text-xs">${fd(p.date)}</span></div><div class="text-xs text-slate-500">${p.items.map(i => esc(i.name) + ' ' + i.qty).join(', ')}</div><div class="flex justify-between"><b>฿${fm(p.total)}</b><b class="${p.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}">${p.status === 'paid' ? 'จ่ายแล้ว (' + PAY[p.pay] + ')' : 'ค้างจ่าย'}</b></div><div class="flex gap-1 mt-1">${p.status === 'paid' ? '' : `<button class="btn g" onclick="choosePay('p','${p.id}')">เปลี่ยนเป็นจ่ายแล้ว</button>`}<button class="btn r" onclick="delPur('${p.id}')">ลบ</button></div></div>`).join('') || '<p class="text-slate-400 text-sm">ยังไม่มีรายการ</p>'}</div></div></div>`,

  staff: () => {
    const tabs = `<div class="flex gap-2 mb-3"><button class="btn ${ST.tab === 'list' ? 'p' : ''}" onclick="ST.tab='list';ST.id=null;render()">รายชื่อพนักงาน</button><button class="btn ${ST.tab === 'all' ? 'p' : ''}" onclick="ST.tab='all';ST.id=null;render()">ดูรวมทุกคน</button></div>`;
    if (ST.tab === 'all') {
      const rows = db.tx.filter(t => per(t.date, ST.p)).sort((a, b) => b.date.localeCompare(a.date));
      return `<div class="max-w-4xl mx-auto">${tabs}<div class="card"><div class="mb-2 flex gap-2 items-center"><b>ช่วงเวลา</b>${selH(PO, ST.p, "ST.p=this.value;render()")}</div>${txTable(rows, true)}<div class="mt-2 text-sm">${Object.entries(TX).map(([k, l]) => `${l}: <b>฿${fm(sum(rows.filter(t => t.type === k), 'amount'))}</b>`).join(' | ')}</div></div></div>`;
    }
    const s = db.staff.find(x => x.id == ST.id);
    if (s) {
      const tx = db.tx.filter(t => t.sid == s.id).sort((a, b) => b.date.localeCompare(a.date));
      const adv = sum(tx.filter(t => t.type === 'adv'), 'amount') - sum(tx.filter(t => t.type === 'rep'), 'amount'), dep = sum(tx.filter(t => t.type === 'dep'), 'amount');
      return `<div class="max-w-4xl mx-auto">${tabs}<div class="card"><div class="flex justify-between items-center mb-2"><div><b class="text-xl">${esc(s.name)}</b> <span class="text-sm text-slate-500">${s.type === 'daily' ? 'รายวัน' : 'รายเดือน'}${s.rate ? ' ฿' + fm(s.rate) : ''}</span></div><button class="btn" onclick="ST.id=null;render()">← กลับ</button></div><div class="grid grid-cols-2 gap-2 mb-3"><div class="bg-amber-50 rounded-xl p-2">ยอดเบิกค้างหักคืน<div class="font-black text-xl">฿${fm(adv)}</div></div><div class="bg-emerald-50 rounded-xl p-2">เงินฝากคงเหลือ<div class="font-black text-xl">฿${fm(dep)}</div></div></div><div class="grid grid-cols-4 gap-2 mb-3">${Object.entries(TX).map(([k, l]) => `<button class="btn p" onclick="txForm('${s.id}','${k}')">${l}</button>`).join('')}</div>${txTable(tx, false)}</div></div>`;
    }
    return `<div class="max-w-4xl mx-auto">${tabs}<div class="card"><div class="flex justify-between mb-2"><b>พนักงาน</b><button class="btn g" onclick="addStaff()">+ สร้างรายชื่อพนักงาน</button></div><div class="grid grid-cols-3 gap-2">${db.staff.map(s => `<div class="border rounded-xl p-2 flex gap-1 items-center"><button class="btn p flex-1" onclick="ST.id='${s.id}';render()">${esc(s.name)}<br><small>${s.type === 'daily' ? 'รายวัน' : 'รายเดือน'}</small></button><button class="text-rose-600" onclick="delStaff('${s.id}')">🗑</button></div>`).join('') || '<p class="text-slate-400">ยังไม่มีพนักงาน</p>'}</div></div></div>`;
  },

  exp: () => `<div class="max-w-3xl mx-auto grid gap-3"><div class="card"><div class="flex justify-between mb-2"><b>รายการที่ใช้บ่อย (กดเพื่อกรอกยอด)</b><div class="flex gap-1"><button class="btn p" onclick="addExpItem()">+ สร้างปุ่มรายการ</button><button class="btn" onclick="tapExp(-1)">+ อื่นๆ</button></div></div><div class="flex flex-wrap gap-2">${db.expItems.map((e, i) => `<div class="pbtn" onclick="tapExp(${i})"><button class="x" onclick="event.stopPropagation();delExpItem(${i})">✕</button><b>${esc(e)}</b></div>`).join('') || '<p class="text-slate-400">ยังไม่มีปุ่มรายการ</p>'}</div></div><div class="card"><b>ประวัติรายจ่าย</b><table class="w-full text-sm">${db.exps.map(e => `<tr><td>${fd(e.date)}</td><td>${esc(e.name)}</td><td class="text-right font-bold">฿${fm(e.amount)}</td><td><button class="text-rose-600" onclick="delExp('${e.id}')">✕</button></td></tr>`).join('')}</table><div class="text-right font-black mt-2">รวม ฿${fm(sum(db.exps, 'amount'))}</div></div></div>`,

  sum: () => `<div class="max-w-xl mx-auto card"><div class="flex gap-1 mb-2">${[['day', 'รายวัน'], ['week', 'สัปดาห์'], ['month', 'เดือน'], ['year', 'ปี']].map(([p, l]) => `<button class="btn flex-1 ${S.p === p ? 'p' : ''}" onclick="setP('${p}')">${l}</button>`).join('')}</div><div class="flex gap-2 items-center mb-3">จาก<input type="date" class="inp" value="${S.from}" onchange="S.from=this.value;S.p='';render()">ถึง<input type="date" class="inp" value="${S.to}" onchange="S.to=this.value;S.p='';render()"></div><div class="space-y-1">${rowsH(calc())}</div><div class="grid grid-cols-2 gap-2 mt-4"><button class="btn p" onclick="printSum()">🖨 พิมพ์สลิปสรุปบัญชี</button><button class="btn r" onclick="wipe()">ลบประวัติทั้งหมด</button></div></div>`
};

function render() { $('#home').classList.toggle('hidden', view === 'home'); $('#app').innerHTML = V[view](); }
function go(v) { view = v; render(); }

// ===== ลูกค้า / รายชื่อ =====
function selCust(name) { cust = name; go('pos'); }
function selReg(i) { selCust(db.customers[i]); }
function editCust() { form('แก้ชื่อลูกค้าในบิลนี้', [{ k: 'n', l: 'ชื่อลูกค้า', v: cust === WALK ? '' : cust }], v => { cust = v.n || WALK; closeM(); render(); }); }
function addName(key, l) { form('เพิ่มรายชื่อ', [{ k: 'n', l }], v => { if (v.n && !db[key].includes(v.n)) { db[key].push(v.n); save(); } closeM(); render(); }); }
function delName(key, i) { if (confirm('ลบรายชื่อนี้?')) { db[key].splice(i, 1); save(); render(); } }
function delSup() { const i = db.suppliers.indexOf(sup); if (i < 0) return alert('เลือกผู้ขายก่อน'); if (confirm('ลบผู้ขาย ' + sup + '?')) { db.suppliers.splice(i, 1); sup = ''; save(); render(); } }

// ===== สินค้า =====
function addProd() {
  form('สร้างปุ่มสินค้าใหม่', [{ k: 'n', l: 'ชื่อสินค้า' }, { k: 't', l: 'ประเภท', o: [['kg', 'ชั่งน้ำหนัก (กก. × ราคา/กก.)'], ['unit', 'ขายเป็นชิ้น/ถุง (จำนวน × ราคา)']] }, { k: 'p', l: 'ราคาตั้งต้น (ใช้กับแบบชิ้น/ถุง ไม่บังคับ)', t: 'number' }],
    v => { if (!v.n) return; db.products.push({ id: uid(), name: v.n, type: v.t, price: n(v.p) }); save(); closeM(); render(); });
}
function delProd(id) { if (confirm('ลบปุ่มสินค้านี้?')) { db.products = db.products.filter(p => p.id != id); save(); render(); } }
function tap(id, t) {
  const p = db.products.find(x => x.id == id), k = p.type === 'kg';
  const fl = [{ k: 'q', l: k ? 'น้ำหนัก (kg)' : 'จำนวน (ชิ้น/ถุง)', t: 'number' }, { k: 'p', l: k ? 'ราคาต่อ kg (บาท)' : 'ราคาต่อหน่วย (บาท)', t: 'number', v: k ? '' : (p.price || '') }];
  if (k) fl.push({ k: 'c', l: 'จำนวนตัว (ไม่บังคับ)', t: 'number' });
  form(p.name, fl,
    v => { const q = n(v.q), pc = n(v.p); if (q <= 0 || pc <= 0) return toast('กรอกจำนวนและราคาให้ครบ'); (t === 'c' ? cart : pcart).push({ id: uid(), name: p.name, unit: p.type, qty: q, price: pc, total: q * pc, cnt: n(v.c) }); closeM(); render(); },
    '<div class="text-right text-3xl font-black text-indigo-700 mt-3">฿<span id="lt">0.00</span></div>');
  const upd = () => $('#lt').textContent = fm(n($('#f_q').value) * n($('#f_p').value));
  $('#mbox').oninput = upd; upd();
}

// ===== ขาย =====
function delCart(id) { cart = cart.filter(i => i.id != id); render(); }
function clearCart() { if (cart.length && confirm('ยกเลิกบิลนี้?')) { cart = []; render(); } }
function park() { if (!cart.length) return alert('ไม่มีรายการให้พัก'); db.parked.push({ id: uid(), customer: cust, items: cart, time: nowS() }); save(); cart = []; toast('พักบิลแล้ว'); render(); }
function parkedList() {
  modal(`<div class="flex justify-between mb-2"><b>บิลที่พักไว้</b><button onclick="closeM()">✕</button></div>${db.parked.map(b => `<div class="border rounded-xl p-2 mb-2 flex justify-between items-center"><div><b>${esc(b.customer)}</b><div class="text-xs">${b.items.length} รายการ ฿${fm(sum(b.items))}</div></div><div class="flex gap-1"><button class="btn a" onclick="restore('${b.id}')">ดึงกลับ</button><button class="btn r" onclick="delParked('${b.id}')">ลบ</button></div></div>`).join('') || '<p class="text-slate-400">ไม่มีบิลที่พัก</p>'}`);
}
function restore(id) { const b = db.parked.find(x => x.id == id); cart = b.items; cust = b.customer; db.parked = db.parked.filter(x => x.id != id); save(); closeM(); render(); }
function delParked(id) { db.parked = db.parked.filter(x => x.id != id); save(); parkedList(); render(); }
function payM() {
  if (!cart.length) return alert('เพิ่มสินค้าก่อน');
  modal(`<div class="text-center mb-3"><div class="text-slate-500">ยอดรวม</div><div class="text-4xl font-black text-emerald-600">฿${fm(sum(cart))}</div></div><div class="space-y-2"><button class="btn g w-full py-3" onclick="sale('paid','cash')">เงินสด (เปิดลิ้นชัก)</button><button class="btn p w-full py-3" onclick="sale('paid','transfer')">เงินโอน</button><button class="btn a w-full py-3" onclick="sale('unpaid')">ค้างชำระ</button><button class="btn w-full" onclick="closeM()">ยกเลิก</button></div>`);
}
function sale(st, m) {
  const b = { id: 'INV-' + uid().slice(-6), date: nowS(), customer: cust, items: cart, total: sum(cart), status: st, pay: m || null, paidAt: st === 'paid' ? nowS() : null };
  db.bills.unshift(b); save(); cart = []; render(); openBill(b.id);
  if (m === 'cash') toast('🔊 เปิดลิ้นชักเก็บเงินแล้ว');
}

// ===== ประวัติบิล =====
function openBill(id) {
  const b = db.bills.find(x => x.id == id); if (!b) return;
  modal(`<div class="flex justify-between mb-2"><b>รายละเอียดใบเสร็จ</b><button onclick="closeM()">✕</button></div>${b.merged ? `<div class="flex gap-1 mb-2"><button class="btn flex-1 ${split === 'bill' ? 'p' : ''}" onclick="split='bill';openBill('${id}')">แยกรายบิล</button><button class="btn flex-1 ${split === 'day' ? 'p' : ''}" onclick="split='day';openBill('${id}')">แยกรายวัน</button></div>` : ''}<div id="rc">${receipt(b)}</div><div class="grid grid-cols-2 gap-2 mt-3">${b.status === 'unpaid' ? `<button class="btn g col-span-2" onclick="choosePay('b','${id}')">เปลี่ยนสถานะเป็น "ชำระแล้ว"</button>` : ''}<button class="btn" onclick="share('${id}')">แชร์บิล</button><button class="btn p" onclick="pr($('#rc').innerHTML)">พิมพ์ (80mm)</button></div>`);
}
function choosePay(kind, id) {
  modal(`<b class="block mb-3">เลือกประเภทการชำระเงิน</b><div class="space-y-2"><button class="btn g w-full py-3" onclick="doPay('${kind}','${id}','cash')">เงินสด${kind === 'b' ? ' (เปิดลิ้นชัก)' : ''}</button><button class="btn p w-full py-3" onclick="doPay('${kind}','${id}','transfer')">เงินโอน</button><button class="btn w-full" onclick="closeM()">ยกเลิก</button></div>`);
}
function doPay(kind, id, m) {
  const x = (kind === 'b' ? db.bills : db.purchases).find(x => x.id == id);
  x.status = 'paid'; x.pay = m; x.paidAt = nowS(); save(); closeM(); render();
  if (kind === 'b') { openBill(id); if (m === 'cash') toast('🔊 เปิดลิ้นชักเก็บเงินแล้ว'); } else toast('อัปเดตแล้ว');
}
function share(id) {
  const b = db.bills.find(x => x.id == id), t = `ร้านปลาเม้า\nบิล ${b.id}\nลูกค้า: ${b.customer}\nยอดรวม ฿${fm(b.total)}\nสถานะ: ${stat(b)}`;
  navigator.share ? navigator.share({ text: t }) : navigator.clipboard.writeText(t).then(() => toast('คัดลอกแล้ว'));
}
function mergeSel() {
  const ids = [...document.querySelectorAll('.bc:checked')].map(c => c.value), bs = db.bills.filter(b => ids.includes(b.id));
  if (bs.length < 2 || bs.some(b => b.status !== 'unpaid')) return alert('เลือกบิลค้างชำระอย่างน้อย 2 บิล');
  if (new Set(bs.map(b => b.customer)).size > 1) return alert('รวมได้เฉพาะลูกค้ารายเดียวกัน');
  const ch = bs.flatMap(b => b.merged || [b]);
  db.bills = db.bills.filter(b => !ids.includes(b.id));
  db.bills.unshift({ id: 'MG-' + uid().slice(-5), date: nowS(), customer: bs[0].customer, items: [], merged: ch, total: sum(ch), status: 'unpaid', pay: null });
  save(); toast('รวมบิลแล้ว'); render();
}
function cancelSel() {
  const ids = [...document.querySelectorAll('.bc:checked')].map(c => c.value);
  if (!ids.length) return alert('เลือกบิลก่อน');
  if (confirm(`ยกเลิก (ลบ) ${ids.length} บิลที่เลือก?`)) { db.bills = db.bills.filter(b => !ids.includes(b.id)); save(); render(); }
}

// ===== ซื้อเข้า =====
function delP(id) { pcart = pcart.filter(i => i.id != id); render(); }
function savePur() {
  if (!sup) return alert('เลือกผู้ขายก่อน'); if (!pcart.length) return alert('ไม่มีรายการ');
  db.purchases.unshift({ id: uid(), date: nowS(), supplier: sup, items: pcart, total: sum(pcart), status: 'unpaid', pay: null }); save(); pcart = []; toast('บันทึกแล้ว (ค้างจ่าย)'); render();
}
function delPur(id) { if (confirm('ลบรายการซื้อนี้?')) { db.purchases = db.purchases.filter(p => p.id != id); save(); render(); } }

// ===== พนักงาน =====
function addStaff() {
  form('สร้างรายชื่อพนักงาน', [{ k: 'n', l: 'ชื่อพนักงาน' }, { k: 't', l: 'ประเภทการจ่าย', o: [['daily', 'รายวัน'], ['monthly', 'รายเดือน']] }, { k: 'r', l: 'ค่าจ้างมาตรฐาน (ไม่บังคับ)', t: 'number' }],
    v => { if (!v.n) return; db.staff.push({ id: uid(), name: v.n, type: v.t, rate: n(v.r) }); save(); closeM(); render(); });
}
function delStaff(id) { if (confirm('ลบพนักงานและประวัติทั้งหมดของคนนี้?')) { db.staff = db.staff.filter(s => s.id != id); db.tx = db.tx.filter(t => t.sid != id); save(); render(); } }
function txForm(sid, type) {
  const s = db.staff.find(x => x.id == sid);
  form(TX[type] + ' - ' + s.name, [{ k: 'a', l: 'จำนวนเงิน (บาท)', t: 'number', v: type === 'wage' && s.rate ? s.rate : '' }, { k: 'd', l: 'วันที่', t: 'date', v: ymd(new Date()) }, { k: 'n', l: 'หมายเหตุ' }],
    v => { if (n(v.a) <= 0 || !v.d) return toast('กรอกจำนวนเงินและวันที่'); db.tx.push({ id: uid(), sid: s.id, type, amount: n(v.a), date: v.d + 'T' + nowS().slice(11), note: v.n }); save(); closeM(); render(); });
}
function delTx(id) { if (confirm('ลบรายการนี้?')) { db.tx = db.tx.filter(t => t.id != id); save(); render(); } }

// ===== รายจ่ายทั่วไป =====
function addExpItem() { form('สร้างปุ่มรายการ', [{ k: 'n', l: 'ชื่อรายการ (เช่น ค่าน้ำ)' }], v => { if (v.n) { db.expItems.push(v.n); save(); } closeM(); render(); }); }
function delExpItem(i) { if (confirm('ลบปุ่มนี้?')) { db.expItems.splice(i, 1); save(); render(); } }
function tapExp(i) {
  form('บันทึกรายจ่าย', [{ k: 'n', l: 'รายการ', v: i < 0 ? '' : db.expItems[i] }, { k: 'a', l: 'จำนวนเงิน (บาท)', t: 'number' }],
    v => { if (!v.n || n(v.a) <= 0) return toast('กรอกให้ครบ'); db.exps.unshift({ id: uid(), date: nowS(), name: v.n, amount: n(v.a) }); save(); closeM(); render(); });
}
function delExp(id) { if (confirm('ลบรายการนี้?')) { db.exps = db.exps.filter(e => e.id != id); save(); render(); } }

// ===== สรุปบัญชี =====
function setP(p) { const [a, b] = rng(p); S = { p, from: a, to: b }; render(); }
function calc() {
  const a = S.from, b = S.to, ir = d => d && inR(d, a, b), sT = t => sum(db.tx.filter(x => x.type === t && ir(x.date)), 'amount');
  const pb = db.bills.filter(x => x.status === 'paid' && ir(x.paidAt || x.date));
  const inc = sum(pb), buy = sum(db.purchases.filter(x => x.status === 'paid' && ir(x.paidAt))), wage = sT('wage'), adv = sT('adv'), gen = sum(db.exps.filter(x => ir(x.date)), 'amount'), exp = buy + wage + adv + gen;
  return [['รายรับ (ชำระแล้ว)', inc, 1], ['  เงินสด', sum(pb.filter(x => x.pay === 'cash'))], ['  เงินโอน', sum(pb.filter(x => x.pay === 'transfer'))],
  ['รายจ่าย', exp, 1], ['  ซื้อเข้า (จ่ายแล้ว)', buy], ['  ค่าจ้าง', wage], ['  เบิกล่วงหน้า', adv], ['  รายจ่ายทั่วไป', gen],
  ['กำไร/ขาดทุนสุทธิ', inc - exp, 1], ['ลูกค้าค้างชำระ', sum(db.bills.filter(x => x.status === 'unpaid' && ir(x.date)))], ['ค้างจ่ายผู้ขาย', sum(db.purchases.filter(x => x.status === 'unpaid' && ir(x.date)))], ['เงินฝากพนักงาน (ไม่นับเป็นรายจ่าย)', sT('dep')]];
}
const rowsH = r => r.map(([l, v, b]) => `<div class="flex justify-between ${b ? 'font-black border-t mt-1 pt-1' : ''}"><span>${l.replace(/^ +/, '&nbsp;&nbsp;')}</span><span>฿${fm(v)}</span></div>`).join('');
function printSum() { pr(`<div class="receipt">${HEAD}<div class="font-extrabold text-center border-y-2 border-black my-2 py-1">สรุปบัญชี<br><span class="text-xs">${S.from} ถึง ${S.to}</span></div><div class="text-sm space-y-1">${rowsH(calc())}</div><div class="text-center text-xs mt-3">พิมพ์เมื่อ ${fd(nowS())}</div></div>`); }
function wipe() {
  if (!confirm('ลบประวัติทั้งหมด (บิล ซื้อเข้า ค่าจ้าง รายจ่าย บิลพัก)?\nรายชื่อและปุ่มสินค้าจะยังอยู่')) return;
  if (!confirm('ยืนยันอีกครั้ง! ลบแล้วกู้คืนไม่ได้')) return;
  Object.assign(db, { bills: [], parked: [], purchases: [], tx: [], exps: [] }); save(); toast('ลบประวัติทั้งหมดแล้ว'); render();
}

render();
