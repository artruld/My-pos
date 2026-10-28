// ===== ข้อมูล (เก็บใน localStorage) =====
const VER = '3.2.6';
const CHANGES = ['v3.2.6: บิลรวม รวมยอด: เน้นยอดบิลล่าสุด ยอดค้างรวมทั้งหมดตัวเล็ก','v3.2.5: แก้ไขบิล/วันที่บิลในประวัติ, บิลรวมแสดงรายการเฉพาะบิลล่าสุด (สลับ รวมยอด/แยกบิล), ชำระบิลรวมแบบเลือกบิล','v3.2.4: พักบิลแล้วกลับหน้าเลือกลูกค้า + ปุ่มบิลที่พัก, ลูกค้าที่ขายแล้ววันนี้ไปอยู่ท้ายรายชื่อจนกว่าจะรีเซ็ต','v3.2.3: ปุ่ม ↕ จัดลำดับ (⬆⬇) รายชื่อลูกค้า/ผู้ขาย/สินค้า ลำดับคงค้างจนกว่าจะแก้','v3.2.2: กลุ่มลูกค้า + รวมบิลกลุ่ม (ใบแจ้งยอดรวมเป็นตารางแชร์ LINE), ชีทโครงสร้างใหม่ (สรุป/รายลูกค้า/รายรับ/รายจ่าย), ลบประวัติไม่แตะข้อมูลใน Drive', 'v3.2.1: ส่งข้อมูลขึ้น Google Drive อัตโนมัติ (สำรองข้อมูล, สรุปบัญชีลง Google Sheets, รูปสลิปบิลที่ชำระแล้ว), ไฟล์สำรอง/นำเข้า, คำต่อท้ายช่องกรอก (กก. / บาท / ตัว), ใช้ "กก." แทน kg', 'v3.2.0: กรอกสินค้า Enter น้ำหนัก>ราคา>จำนวนตัว(เว้นว่างได้)>ตกลง, บิลค้างจ่ายกดรับชำระได้ทันที (โอน/เงินสด), ติ๊กหลายบิลชำระพร้อมกัน, ย้อนกลับเป็นค้างชำระ', 'v3.1.3: คีย์บอร์ดตัวเลขจริง (ซ่อนแป้นบนจอ มีปุ่มสลับ), รับเงินสดและเงินทอน, ปัดเศษลงที่ยอดบิล, ประกาศขนาด 26 กึ่งกลาง, พักบิลพร้อมประกาศ', 'v3.1.2: ชื่อลูกค้าที่ออกบิลแล้วจางจนถึงเวลารีเซ็ต (ตั้งเวลาได้ ค่าตั้งต้น 06:00) และปุ่มรีเซ็ตทันที', 'v3.1.1: ปุ่มบิลค้างจ่ายในหน้าหลัก (แสดงจำนวนและยอดรวม)', 'v3.1.0: ประกาศท้ายบิล (เลือกเป็นบางบิล, ตัวช่วยปรับราคา), ตั้งค่า Line ID ที่สลิป, ลูกค้าประจำที่ออกบิลแล้วย้ายลงล่างสุดวนเป็นรอบ', 'v3.0.2: หน้าขาย/ซื้อเข้า ขยายกล่องบิลเป็น 560 จุด แก้ข้อความล้นกล่อง', 'v3.0.1: รายการสินค้าบนหน้าจอพอดี 1 บรรทัดเหมือนสลิป, ป้อนกระดาษท้ายสลิปตั้งต้น 5 บรรทัด', 'v3.0: ใบแจ้งยอดรวม (เก็บบิลเดิม ชำระแล้วอัปเดตทุกบิล ไม่นับยอดซ้ำ ยกเลิกการรวมได้)', 'v3.0: สลิป — ตัดกระดาษโดย RawBT/แอป ปรับบรรทัดป้อนกระดาษ ลดขอบบน ชื่อสินค้า 1 บรรทัด', 'v2.x: พิมพ์ทันทีผ่าน RawBT แชร์เป็นรูป โลโก้ พักบิลอัตโนมัติ'];
const K = 'mypos2';
let db = Object.assign({ customers: [], products: [], suppliers: [], staff: [], bills: [], parked: [], purchases: [], tx: [], exps: [], expItems: [], notices: [], lineId: '', resetHour: 6, resetAt: '', custGroup: {} }, JSON.parse(localStorage.getItem(K) || '{}'));
const save = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch (e) { alert('พื้นที่เก็บข้อมูลในเครื่องเต็ม! บันทึกไม่สำเร็จ\nให้สำรองข้อมูลแล้วติดต่อผู้พัฒนาทันที'); } schedSync(); };
const mgSplit = ks => { const a = ks.slice().sort((x, y) => x.date.localeCompare(y.date)); const lat = a.pop(); return [lat, a]; };
const isMG = b => Array.isArray(b.mergedIds);
const kids = b => b.mergedIds.map(id => db.bills.find(x => x.id == id)).filter(Boolean);
const tops = () => db.bills.filter(b => !b.mergedInto);
const resetThr = () => {
  const d = new Date(); const h = +db.resetHour || 0;
  if (d.getHours() < h) d.setDate(d.getDate() - 1);
  const sch = ymd(d) + 'T' + pad(h) + ':00';
  return db.resetAt && db.resetAt > sch ? db.resetAt : sch;
};
const cartRnd = () => { const r = Math.round(sum(cart) * 100) / 100, d = r - rdn(r); return d >= 0.005 ? +d.toFixed(2) : 0; };
const rdn = x => Math.floor(Math.round(x * 100) / 100);
const grpOf = c => (db.custGroup || {})[c] || (db.customers.includes(c) ? c : 'ลูกค้าทั่วไป');
const MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const dLab = ds => { const a = ds.split('-'); return (+a[2]) + ' ' + MON[+a[1] - 1]; };
const todayS = () => ymd(new Date());
const liveNotices = () => db.notices.filter(x => x.on !== false && (!x.end || x.end >= todayS()));
const noticesOf = b => isMG(b) ? [...new Set(kids(b).flatMap(k => k.notices || []))] : (b.notices || []);
let selN = [];
const selTexts = () => liveNotices().filter(x => selN.includes(x.id)).map(x => x.text);
const rTitle = b => isMG(b) ? 'ใบแจ้งยอดรวม' : 'ใบเสร็จรับเงิน';
// ย้ายข้อมูลบิลรวมแบบเก่า (บิลเดิมฝังอยู่ข้างใน) เป็นแบบใหม่ (บิลเดิมเป็นบิลจริง ติดตรา mergedInto)
(function migrate() {
  let ch = false;
  [...db.bills].forEach(b => {
    if (!Array.isArray(b.merged)) return;
    const ids = [];
    b.merged.forEach(c => { if (!db.bills.some(x => x.id == c.id)) db.bills.push(Object.assign({}, c, { mergedInto: b.id, status: b.status, pay: b.pay || null, paidAt: b.paidAt || null })); ids.push(c.id); });
    b.mergedIds = ids; delete b.merged; ch = true;
  });
  if (ch) save();
})();

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
let freshId = null;
let cust = WALK, cart = [], pcart = [], view = 'home', split = 'sum', sup = '', EDIT = null;
let F = { p: 'all', s: 'all', c: 'all', k: false }, ST = { tab: 'list', id: null, p: 'all' };
let S = { p: 'day', from: ymd(new Date()), to: ymd(new Date()) };

// ===== Modal / Toast / ฟอร์ม =====
function modal(h) { $('#mbox').style.maxWidth = ''; $('#mbox').innerHTML = h; $('#mbox').oninput = null; $('#modal').classList.remove('hidden'); fitLines(); }
function closeM() { $('#modal').classList.add('hidden'); }
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 2500); }
let npA = null;
const padOn = () => { try { return localStorage.getItem('npad') === '1'; } catch (e) { return false; } };
const padHtml = () => `<div id="npadbox" class="w-64 ${padOn() ? '' : 'hidden'}"><div class="grid grid-cols-3 gap-2 mt-2">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(k => `<button type="button" class="numpad-btn" onclick="np('${k}')">${k}</button>`).join('')}</div><button type="button" class="btn w-full mt-2" onclick="np('C')">ล้างช่องนี้</button></div>`;
const padBtn = () => `<button type="button" class="btn flex-1" id="npt" onclick="togPad()">${padOn() ? '⌨️ ซ่อนแป้นเลข' : '⌨️ แสดงแป้นเลข'}</button>`;
function togPad() {
  const on = !padOn(); try { localStorage.setItem('npad', on ? '1' : '0'); } catch (e) { }
  $('#npadbox').classList.toggle('hidden', !on); $('#npt').textContent = on ? '⌨️ ซ่อนแป้นเลข' : '⌨️ แสดงแป้นเลข'; $('#mbox').style.maxWidth = on ? '48rem' : '';
}
document.addEventListener('keydown', e => {
  if ($('#modal').classList.contains('hidden') || e.repeat) return;
  const ok = $('#fok'); if (!ok) return;
  if (e.key === 'Escape') { e.preventDefault(); closeM(); return; }
  const el = document.activeElement, nps = [...document.querySelectorAll('#mbox .np')];
  if (el && el.tagName === 'INPUT' && !el.classList.contains('np')) { if (e.key === 'Enter') { e.preventDefault(); ok.click(); } return; }
  if (!nps.length) { if (e.key === 'Enter') { e.preventDefault(); ok.click(); } return; }
  if (!npA || !nps.includes(npA)) setNp(nps[0]);
  const i = nps.indexOf(npA);
  if (/^[0-9]$/.test(e.key)) { e.preventDefault(); np(e.key); }
  else if (e.key === '.' || e.key === ',') { e.preventDefault(); np('.'); }
  else if (e.key === 'Backspace') { e.preventDefault(); np('⌫'); }
  else if (e.key === 'Delete') { e.preventDefault(); np('C'); }
  else if (e.key === 'Tab') { e.preventDefault(); setNp(nps[(i + (e.shiftKey ? nps.length - 1 : 1)) % nps.length]); }
  else if (e.key === 'Enter') { e.preventDefault(); const nx = nps.slice(i + 1).find(x => !x.dataset.opt); if (nx) setNp(nx); else ok.click(); }
});
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
      : f.t === 'number' ? `<div class="relative"><input id="f_${f.k}" class="inp np" readonly inputmode="none" ${f.opt ? 'data-opt="1"' : ''} value="${esc(f.v ?? '')}" style="${f.u ? 'padding-right:' + (f.u.length * 15 + 36) + 'px' : ''}">${f.u ? `<span class="absolute font-bold text-slate-500 pointer-events-none" style="right:14px;top:50%;transform:translateY(-50%);font-size:1.15rem">${f.u}</span>` : ''}</div>`
        : `<input id="f_${f.k}" class="inp" type="${f.t || 'text'}" value="${esc(f.v ?? '')}">`)).join('');
  const pad = hasNum ? padHtml() : '';
  modal(`<h3 class="text-2xl font-bold mb-2">${esc(title)}</h3><div class="flex gap-4"><div class="flex-1">${fh}${extra}</div>${pad}</div><div class="flex gap-2 mt-4"><button class="btn flex-1" onclick="closeM()">ยกเลิก</button>${hasNum ? padBtn() : ''}<button class="btn p flex-1" id="fok">ตกลง</button></div>`);
  $('#mbox').style.maxWidth = hasNum && padOn() ? '48rem' : '';
  document.querySelectorAll('#mbox .np').forEach(i => i.onclick = () => setNp(i));
  const f1 = document.querySelector('#mbox .np'); if (f1) setNp(f1);
  $('#fok').onclick = () => { const v = {}; fields.forEach(f => v[f.k] = $('#f_' + f.k).value.trim()); ok(v); };
  const i = $('#mbox input:not(.np)'); if (i) i.focus();
}
// ===== พิมพ์ / แชร์เป็นรูป (วาดใบเสร็จเป็นภาพ 80mm = 576 จุด) =====
const PW = 576, PADX = 10;
const ADDR = '551/145 ถนนมิตรภาพ (ซอย 10) ตำบลในเมือง อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000', TEL = 'โทร: 081-760-2807';
const LOGO = new Image(); LOGO.src = 'logo.png';
const logoReady = new Promise(r => { LOGO.onload = LOGO.onerror = r; });
const fontsReady = () => Promise.all([document.fonts.load('400 30px Prompt', 'ก1A'), document.fonts.load('700 30px Prompt', 'ก1A')]).catch(() => { });
let PM = localStorage.getItem('pm') || 'rawbt';
let CUT = localStorage.getItem('pcut') || 'rawbt';
const FEED0 = { rawbt: 5, app: 3 };
const feedN = () => { const v = parseInt(localStorage.getItem('pf_' + CUT)); return isNaN(v) ? FEED0[CUT] : v; };
const fnt = (sz, b) => `${b ? 700 : 400} ${sz}px Prompt, sans-serif`;

function wrapT(ctx, text, maxW) {
  const t = String(text);
  let segs = typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter('th', { granularity: 'word' }).segment(t)].map(s => s.segment) : [...t];
  segs = segs.flatMap(s => ctx.measureText(s).width > maxW ? [...s] : [s]);
  const lines = []; let cur = '';
  for (const s of segs) {
    if (!cur || ctx.measureText(cur + s).width <= maxW) cur += s;
    else { lines.push(cur.trimEnd()); cur = s.trimStart(); }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function runBlocks(ctx, blocks, draw, pad = 10) {
  let y = pad; const W = PW - 2 * PADX;
  ctx.textBaseline = 'middle';
  for (const b of blocks) {
    const sz = b.sz || 26, lh = Math.round(sz * 1.45);
    if (b.t === 'gap') y += b.h;
    else if (b.t === 'rule') { const w = b.w || 3; y += 6; if (draw) { ctx.fillStyle = '#000'; ctx.fillRect(PADX, y, W, w); } y += w + 6; }
    else if (b.t === 'logo') {
      const w = b.w || 340, h = LOGO.naturalWidth ? Math.round(w * LOGO.naturalHeight / LOGO.naturalWidth) : 0;
      if (draw && h) ctx.drawImage(LOGO, (PW - w) / 2, y, w, h); y += h + 6;
    }
    else if (b.t === 'c' || b.t === 'l') {
      ctx.font = fnt(sz, b.b);
      for (const ln of wrapT(ctx, b.x, W)) {
        if (draw) { ctx.fillStyle = '#000'; ctx.textAlign = 'left'; ctx.fillText(ln, b.t === 'c' ? (PW - ctx.measureText(ln).width) / 2 : PADX, y + lh / 2); }
        y += lh;
      }
    }
    else if (b.t === 'lr' || b.t === 'item') {
      const it = b.t === 'item', ind = b.ind || 0;
      let nsz = it ? 36 : sz, rw, ls;
      if (it) {
        for (nsz = 36; nsz > 24; nsz -= 2) { ctx.font = fnt(nsz, 1); rw = ctx.measureText(b.r).width; if (ctx.measureText(b.n).width <= W - ind - rw - 14) break; }
        ctx.font = fnt(nsz, 1); rw = ctx.measureText(b.r).width;
        let t = b.n; const room = W - ind - rw - 14;
        if (ctx.measureText(t).width > room) { while (t.length > 1 && ctx.measureText(t + '…').width > room) t = t.slice(0, -1); t = t.trimEnd() + '…'; }
        ls = [t];
      } else { ctx.font = fnt(nsz, b.b); rw = ctx.measureText(b.r).width; ls = wrapT(ctx, b.l, W - ind - rw - 14); }
      const nlh = Math.round(nsz * 1.45);
      ls.forEach((ln, k) => {
        if (draw) {
          ctx.fillStyle = '#000'; ctx.textAlign = 'left'; ctx.fillText(ln, PADX + ind, y + nlh / 2);
          if (k === 0) { ctx.fillText(b.r, PW - PADX - rw, y + nlh / 2); }
        }
        y += nlh;
      });
      if (it && b.s) {
        ctx.font = fnt(24, 0);
        if (draw) { ctx.textAlign = 'left'; ctx.fillText(b.s, PADX, y + 17); }
        y += 34;
      }
      if (it) y += 6;
    }
  }
  return y + pad;
}

async function makeCanvas(blocks, k = 1, bin = true) {
  await Promise.all([fontsReady(), logoReady]);
  if (bin && blocks.length && blocks[blocks.length - 1].t === 'gap') blocks = blocks.slice(0, -1);
  const pd = bin ? 2 : 10;
  const scratch = document.createElement('canvas').getContext('2d');
  const h = runBlocks(scratch, blocks, false, pd);
  const c = document.createElement('canvas'); c.width = PW * k; c.height = h * k;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.scale(k, k);
  runBlocks(ctx, blocks, true, pd);
  if (bin) {
    const im = ctx.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const v = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11 < 170 ? 0 : 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    ctx.putImageData(im, 0, 0);
  }
  return c;
}

const headBlocks = () => [{ t: 'logo', w: 238 }, { t: 'c', x: ADDR, sz: 24, b: 1 }, { t: 'c', x: TEL, sz: 24, b: 1 }];
const itemBlock = i => ({ t: 'item', n: itemT(i), s: itemS(i), r: '฿' + fm(i.total) });
function billBlocks(b) {
  const ks = isMG(b) ? kids(b) : null;
  const L = [...headBlocks(), { t: 'rule' }, { t: 'c', x: rTitle(b), sz: 28, b: 1 }, { t: 'rule' }];
  if (b.id) L.push({ t: 'l', x: 'เลขที่: ' + b.id, sz: 26 });
  L.push({ t: 'l', x: 'เวลา: ' + fd(b.date), sz: 26 }, { t: 'l', x: 'ลูกค้า: ' + b.customer, sz: 26, b: 1 });
  if (b.status) L.push({ t: 'l', x: 'สถานะ: ' + stat(b), sz: 26 });
  if (ks) L.push({ t: 'l', x: 'รวมจาก ' + ks.length + ' บิล: ' + ks.map(k => k.id).join(', '), sz: 22 });
  L.push({ t: 'rule' });
  if (!ks) b.items.forEach(i => L.push(itemBlock(i)));
  else {
    const [lat, old] = mgSplit(ks);
    const big = split !== 'bill', sec = ms => { L.push({ t: 'l', x: 'บิล ' + ms[0].id + ' (' + fd(ms[0].date) + ')', sz: 24, b: 1 }); ms.forEach(m => m.items.forEach(i => L.push(itemBlock(i)))); L.push({ t: 'lr', l: 'รวม', r: '฿' + fm(sum(ms)), sz: big ? 44 : 28, b: 1 }, { t: 'rule', w: 1 }); };
    if (split === 'bill') ks.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach(m => sec([m]));
    else { if (lat) sec([lat]); if (old.length) { L.push({ t: 'l', x: 'ยอดค้างก่อนหน้า ' + old.length + ' บิล', sz: 22 }); old.forEach(m => L.push({ t: 'lr', l: dLab(m.date.slice(0, 10)) + ' ' + m.id, r: '฿' + fm(m.total), sz: 22 })); L.push({ t: 'rule', w: 1 }); } }
  }
  L.push({ t: 'rule' });
  if (b.rnd) L.push({ t: 'lr', l: 'ปัดเศษ', r: '-฿' + fm(b.rnd), sz: 26 });
  if (ks && split !== 'bill') L.push({ t: 'lr', l: 'ยอดค้างรวมทั้งหมด', r: '฿' + fm(b.total), sz: 24 });
  else L.push({ t: 'lr', l: 'รวมทั้งสิ้น', r: '฿' + fm(b.total), sz: 44, b: 1 });
  if (b.rcv != null) L.push({ t: 'lr', l: 'รับเงินสด', r: '฿' + fm(b.rcv), sz: 26 }, { t: 'lr', l: 'เงินทอน', r: '฿' + fm(b.chg), sz: 26, b: 1 });
  L.push({ t: 'gap', h: 8 });
  const ns = noticesOf(b);
  if (ns.length) { L.push({ t: 'rule', w: 1 }, { t: 'c', x: '** ประกาศ **', sz: 26, b: 1 }); ns.forEach(x => L.push({ t: 'c', x, sz: 26, b: 1 })); L.push({ t: 'rule', w: 1 }); }
  if (db.lineId) L.push({ t: 'c', x: 'Line: ' + db.lineId, sz: 24 });
  L.push({ t: 'c', x: '" THANK YOU "', sz: 26, b: 1 }, { t: 'gap', h: 16 });
  return L;
}
function sumBlocks() {
  const L = [...headBlocks(), { t: 'rule' }, { t: 'c', x: 'สรุปบัญชี', sz: 28, b: 1 }, { t: 'c', x: `${S.from} ถึง ${S.to}`, sz: 24 }, { t: 'rule' }];
  calc().forEach(([l, v, b]) => { if (b) L.push({ t: 'rule', w: 1 }); L.push({ t: 'lr', l: l.trim(), r: '฿' + fm(v), sz: b ? 30 : 26, b: !!b, ind: /^ /.test(l) ? 24 : 0 }); });
  L.push({ t: 'rule' }, { t: 'c', x: 'พิมพ์เมื่อ ' + fd(nowS()), sz: 22 }, { t: 'gap', h: 16 });
  return L;
}

function escpos(c) {
  const w = c.width, h = c.height, wb = w >> 3, px = c.getContext('2d').getImageData(0, 0, w, h).data;
  const out = new Uint8Array(2 + Math.ceil(h / 128) * 8 + h * wb + 8); let o = 0;
  out[o++] = 0x1B; out[o++] = 0x40;
  for (let y0 = 0; y0 < h; y0 += 128) {
    const sh = Math.min(128, h - y0);
    out.set([0x1D, 0x76, 0x30, 0x00, wb & 255, wb >> 8, sh & 255, sh >> 8], o); o += 8;
    for (let y = y0; y < y0 + sh; y++) for (let bx = 0; bx < wb; bx++) {
      let v = 0; for (let bit = 0; bit < 8; bit++) if (px[(y * w + bx * 8 + bit) * 4] < 128) v |= 0x80 >> bit;
      out[o++] = v;
    }
  }
  const tail = [0x1B, 0x64, feedN()].concat(CUT === 'app' ? [0x1D, 0x56, 0x42, 0x00] : []);
  out.set(tail, o); o += tail.length;
  return out.subarray(0, o);
}
function sendRaw(bytes) {
  let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  location.href = 'intent:base64,' + btoa(s) + '#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;';
}
async function printBlocks(blocks) {
  const c = await makeCanvas(blocks);
  if (PM === 'system') {
    const im = new Image(); im.src = c.toDataURL('image/png'); await im.decode();
    $('#print-area').replaceChildren(im); window.print();
  } else sendRaw(escpos(c));
}
function openDrawer() {
  if (PM === 'system') return toast('โหมดนี้เปิดลิ้นชักไม่ได้ (ตั้งค่า > ส่งตรงไป RawBT)');
  sendRaw(new Uint8Array([0x1B, 0x40, 0x1B, 0x70, 0x00, 0x19, 0xFA]));
}
async function safePrint(blocks) { try { await printBlocks(blocks); return true; } catch (e) { toast('พิมพ์ไม่สำเร็จ: ' + (e.message || e)); return false; } }
function printSum() { safePrint(sumBlocks()); }
function testPrint() { safePrint([...headBlocks(), { t: 'rule' }, { t: 'c', x: 'ทดสอบพิมพ์', sz: 30, b: 1 }, { t: 'c', x: fd(nowS()), sz: 24 }, { t: 'gap', h: 16 }]); }
function setPM(v) { PM = v; localStorage.setItem('pm', v); toast('บันทึกแล้ว'); }
function setCut(v) { CUT = v; localStorage.setItem('pcut', v); settings(); }
function setFeed(v) { localStorage.setItem('pf_' + CUT, v); toast('บันทึกแล้ว'); }
function settings() {
  const fo = Array.from({ length: 21 }, (_, i) => `<option value="${i}" ${feedN() === i ? 'selected' : ''}>${i}</option>`).join('');
  modal(`<div class="flex justify-between mb-3"><b class="text-xl">ตั้งค่า (v${VER})</b><button onclick="closeM()">✕</button></div>
<label class="block font-bold mb-1">ID LINE ที่แสดงบนสลิป (เว้นว่าง = ไม่แสดง)</label><input class="inp" value="${esc(db.lineId)}" onchange="db.lineId=this.value.trim();save();toast('บันทึกแล้ว')">
<div class="flex justify-between items-center mt-3 mb-1"><b>📢 ประกาศท้ายบิล</b><div class="flex gap-1"><button class="btn" onclick="priceNotice()">💲 ปรับราคา</button><button class="btn g" onclick="noticeForm()">+ เพิ่ม</button></div></div>
${db.notices.map(x => `<div class="border rounded-xl p-2 mb-1 flex gap-2 items-center"><input type="checkbox" class="w-6 h-6" ${x.on !== false ? 'checked' : ''} onchange="togNotice('${x.id}')"><button class="flex-1 text-left" onclick="noticeForm('${x.id}')"><div class="font-bold">${esc(x.text)}</div><div class="text-xs text-slate-500">${x.end ? 'แสดงถึง ' + new Date(x.end).toLocaleDateString('th-TH') + (x.end < todayS() ? ' (หมดอายุ)' : '') : 'ไม่มีวันหมด'}</div></button><button class="text-rose-600" onclick="delNotice('${x.id}')">🗑</button></div>`).join('') || '<p class="text-sm text-slate-400">ยังไม่มีประกาศ</p>'}
${cloudHtml()}
<label class="block font-bold mt-3 mb-1">รีเซ็ตสีชื่อลูกค้าประจำ (ที่ออกบิลแล้ว) ทุกวันเวลา</label><div class="flex gap-2"><select class="inp" onchange="db.resetHour=+this.value;save();toast('บันทึกแล้ว')">${Array.from({ length: 13 }, (_, h) => `<option value="${h}" ${(+db.resetHour || 0) === h ? 'selected' : ''}>${pad(h)}:00</option>`).join('')}</select><button class="btn a shrink-0" onclick="resetNow()">รีเซ็ตทันที</button></div>
<label class="block font-bold mt-3 mb-1">วิธีพิมพ์</label><select class="inp" onchange="setPM(this.value)"><option value="rawbt" ${PM === 'rawbt' ? 'selected' : ''}>ส่งตรงไป RawBT (พิมพ์ทันที)</option><option value="system" ${PM === 'system' ? 'selected' : ''}>ผ่านหน้าต่างพิมพ์ของ Android (สำรอง)</option></select>
<label class="block font-bold mt-3 mb-1">ตัดกระดาษโดย</label><select class="inp" onchange="setCut(this.value)"><option value="rawbt" ${CUT === 'rawbt' ? 'selected' : ''}>RawBT (ตัดครั้งเดียว)</option><option value="app" ${CUT === 'app' ? 'selected' : ''}>แอปนี้ (ถ้า RawBT ปิดตัดอัตโนมัติ)</option></select>
<label class="block font-bold mt-3 mb-1">ป้อนกระดาษท้ายสลิป (บรรทัด)</label><select class="inp" onchange="setFeed(this.value)">${fo}</select>
<p class="text-sm text-slate-500 mt-1">1 บรรทัด ≈ 3 มม. ถ้าท้ายสลิปโดนตัดขาดให้เพิ่ม ถ้าเว้นท้ายมากไปให้ลด</p>
<div class="grid grid-cols-2 gap-2 mt-3"><button class="btn p" onclick="testPrint()">ทดสอบพิมพ์</button><button class="btn" onclick="openDrawer()">ทดสอบเปิดลิ้นชัก</button></div>
<p class="text-sm text-slate-500 mt-3">ต้องติดตั้งแอป RawBT และตั้งเครื่องพิมพ์ในแอปให้พิมพ์ได้ก่อน ถ้าโหมดแรกไม่ทำงานให้เลือกโหมดสำรอง (โหมดสำรองเปิดลิ้นชักไม่ได้)</p>
<div class="mt-3 text-xs text-slate-500">${CHANGES.map(c => '• ' + esc(c)).join('<br>')}</div>`);
}

function resetNow() { if (confirm('รีเซ็ตสีชื่อลูกค้าประจำทั้งหมดตอนนี้?')) { db.resetAt = nowS(); save(); toast('รีเซ็ตแล้ว'); } }
// ===== สำรอง / ส่งข้อมูลขึ้น Google Drive =====
const rdJ = (k, d) => { try { return Object.assign({}, d, JSON.parse(localStorage.getItem(k) || '{}')); } catch (e) { return d; } };
const cfg = () => rdJ('mypos_cfg', { url: '', secret: '', on: false });
const syn = () => rdJ('mypos_sync', { slip: {}, rows: {}, bk: '', bkAt: 0, last: '', err: '' });
const saveCfg = c => localStorage.setItem('mypos_cfg', JSON.stringify(c));
const saveSyn = x => { try { localStorage.setItem('mypos_sync', JSON.stringify(x)); } catch (e) { } };
const hsh = str => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + str.length; };
const TXN = id => (db.staff.find(x => x.id == id) || {}).name || '-';
const grpSheet = b => b.gm ? b.group : (b.grp || grpOf(b.customer));
const SYNC_V = 2;
const SYNC_SHEETS = {
  'รายรับ': { t: [1, 2, 3, 4, 5, 8], h: ['รหัสบิล', 'วันที่ชำระ', 'เดือน', 'กลุ่มลูกค้า', 'ชื่อในบิล', 'ยอดรวม', 'ปัดเศษ', 'วิธีชำระ', 'รับเงิน', 'เงินทอน', 'รวมจากกี่บิล'], rows: () => tops().filter(b => b.status === 'paid').map(b => { const pd = (b.paidAt || b.date).replace('T', ' '); return [b.id, pd, pd.slice(0, 7), grpSheet(b), b.gm ? 'กลุ่ม ' + b.group : b.customer, b.total, b.rnd || 0, PAY[b.pay] || '', b.rcv ?? '', b.chg ?? '', isMG(b) ? b.mergedIds.length : '']; }) },
  'รายจ่าย': { t: [1, 2, 3, 4, 5, 7], h: ['รหัส', 'วันที่', 'เดือน', 'ประเภท', 'รายการ / ผู้รับ', 'จำนวนเงิน', 'วิธีชำระ / หมายเหตุ'], rows: () => {
    const R = (id, d, ty, nm, amt, nt) => { const dd = d.replace('T', ' '); return [id, dd, dd.slice(0, 7), ty, nm, amt, nt]; };
    return [...db.purchases.filter(x => x.status === 'paid').map(x => R('PU-' + x.id, x.paidAt || x.date, 'ซื้อเข้า', x.supplier, x.total, PAY[x.pay] || '')),
      ...db.tx.filter(t => t.type === 'wage' || t.type === 'adv').map(t => R('TX-' + t.id, t.date, TX[t.type], TXN(t.sid), t.amount, t.note || '')),
      ...db.exps.map(e => R('GE-' + e.id, e.date, 'รายจ่ายทั่วไป', e.name, e.amount, ''))];
  } }
};
async function gPost(body) {
  const c = cfg();
  const r = await fetch(c.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ secret: c.secret }, body)) });
  const j = await r.json(); if (!j.ok) throw new Error(j.error || 'ผิดพลาด'); return j;
}
async function slipB64(b) {
  const c = await makeCanvas(billBlocks(b), 1, true), blob = await new Promise(r => c.toBlob(r, 'image/png'));
  return await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
}
var syncing = false, syncT = null;
function schedSync() { clearTimeout(syncT); syncT = setTimeout(() => syncNow(), 20000); }
async function syncNow(manual) {
  const c = cfg(); if (!c.on || !c.url || syncing) { if (manual) toast('ยังไม่ได้เปิด/ตั้งค่าการส่งข้อมูล'); return; }
  if (!navigator.onLine) { if (manual) toast('ไม่มีอินเทอร์เน็ต'); return; }
  syncing = true; const st = syn(); let n1 = 0;
  if (st.v !== SYNC_V) { st.rows = {}; st.v = SYNC_V; }
  try {
    for (const [name, def] of Object.entries(SYNC_SHEETS)) {
      const cur = new Map(def.rows().map(r => [String(r[0]), r])), old = st.rows[name] = st.rows[name] || {}, up = [], del = [];
      cur.forEach((r, id) => { const h = hsh(JSON.stringify(r)); if (old[id] !== h) up.push([id, h, r]); });
      Object.keys(old).forEach(id => { if (!cur.has(id)) del.push(id); });
      if (!up.length && del.length) { await gPost({ action: 'rows', sheet: name, header: def.h, textCols: def.t, rows: [], del }); del.forEach(id => delete old[id]); saveSyn(st); n1 += del.length; }
      for (let i = 0; i < up.length; i += 100) {
        const ch = up.slice(i, i + 100); await gPost({ action: 'rows', sheet: name, header: def.h, textCols: def.t, rows: ch.map(x => x[2]), del: i === 0 ? del : [] });
        ch.forEach(x => { old[x[0]] = x[1]; }); if (i === 0) del.forEach(id => delete old[id]); saveSyn(st); n1 += ch.length;
      }
    }
    const pend = tops().filter(b => b.status === 'paid' && !st.slip[b.id]).slice(0, manual ? 300 : 15);
    for (const b of pend) { await gPost({ action: 'slip', name: b.id + '.png', month: (b.paidAt || b.date).slice(0, 7), data: await slipB64(b) }); st.slip[b.id] = 1; saveSyn(st); n1++; }
    const js = JSON.stringify(db), h = hsh(js);
    if (st.bkHold && db.bills.length) st.bkHold = false;
    if (!st.bkHold && h !== st.bk && (manual || Date.now() - st.bkAt > 30 * 60 * 1000)) { await gPost({ action: 'backup', date: ymd(new Date()), content: js }); st.bk = h; st.bkAt = Date.now(); }
    st.last = nowS(); st.err = '';
  } catch (e) { st.err = (e && e.message) || String(e); }
  saveSyn(st); syncing = false;
  if (manual) { toast(st.err ? 'ส่งไม่สำเร็จ: ' + st.err : 'ส่งข้อมูลเรียบร้อย'); if (!$('#modal').classList.contains('hidden') && $('#cloudbox')) settings(); }
  else if (!st.err && tops().some(b => b.status === 'paid' && !st.slip[b.id])) schedSync();
}
function cloudHtml() {
  const c = cfg(), st = syn(), np = tops().filter(b => b.status === 'paid' && !st.slip[b.id]).length;
  let kb = 0; try { kb = Math.round((localStorage.getItem(K) || '').length / 1024); } catch (e) { }
  return `<div id="cloudbox" class="mt-3 border-2 rounded-xl p-2"><b>☁️ ส่งข้อมูลขึ้น Google Drive</b>
<label class="flex items-center gap-2 mt-2 font-bold"><input type="checkbox" class="w-6 h-6" ${c.on ? 'checked' : ''} onchange="setCfg('on',this.checked)">เปิดใช้งาน</label>
<label class="block text-sm font-bold text-slate-500 mt-2">ลิงก์ Web App (จาก Apps Script)</label><input class="inp" value="${esc(c.url)}" onchange="setCfg('url',this.value.trim())">
<label class="block text-sm font-bold text-slate-500 mt-2">รหัสลับ</label><input class="inp" type="password" value="${esc(c.secret)}" onchange="setCfg('secret',this.value.trim())">
<div class="grid grid-cols-2 gap-2 mt-2"><button class="btn" onclick="testCloud()">ทดสอบเชื่อมต่อ</button><button class="btn p" onclick="syncNow(true)">ส่งตอนนี้</button><button class="btn" onclick="resetSyn()">ส่งทั้งหมดใหม่</button><button class="btn" onclick="exportData()">💾 ดาวน์โหลดไฟล์สำรอง</button><button class="btn col-span-2" onclick="$('#impf').click()">📂 นำเข้าไฟล์สำรอง</button></div>
<input id="impf" type="file" accept=".json,application/json" class="hidden" onchange="importData(this.files[0])">
<div class="text-sm mt-2 ${st.err ? 'text-rose-600' : 'text-slate-500'}">${st.err ? 'ผิดพลาด: ' + esc(st.err) + '<br>' : ''}ส่งล่าสุด: ${st.last ? fd(st.last) : 'ยังไม่เคย'} · สลิปรอส่ง ${np} ใบ<br>พื้นที่ข้อมูลในเครื่อง ${kb} KB (เต็มที่ประมาณ 5,000 KB)</div></div>`;
}
function setCfg(k, v) { const c = cfg(); c[k] = v; saveCfg(c); if (k === 'on' && v) syncNow(true); }
async function testCloud() {
  const c = cfg(); if (!c.url) return toast('ใส่ลิงก์ก่อน');
  try { await gPost({ action: 'ping' }); toast('เชื่อมต่อสำเร็จ'); } catch (e) { toast('เชื่อมต่อไม่ได้: ' + ((e && e.message) || e)); }
}
function resetSyn() { if (confirm('ส่งข้อมูล สลิป และไฟล์สำรองทั้งหมดขึ้นไปใหม่ทั้งหมด?')) { saveSyn({ slip: {}, rows: {}, bk: '', bkAt: 0, last: '', err: '' }); syncNow(true); } }
function exportData() {
  const b = new Blob([JSON.stringify(db)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = 'pos-backup-' + ymd(new Date()) + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
async function importData(f) {
  if (!f) return;
  try {
    const d = JSON.parse(await f.text()); if (!d || !Array.isArray(d.bills) || !Array.isArray(d.products)) throw new Error('ไฟล์ไม่ใช่ไฟล์สำรองของระบบนี้');
    if (!confirm(`นำเข้าไฟล์ ${f.name}\n(${d.bills.length} บิล) แทนที่ข้อมูลปัจจุบันทั้งหมด?`)) return;
    localStorage.setItem(K, JSON.stringify(d)); saveSyn({ slip: {}, rows: {}, bk: '', bkAt: 0, last: '', err: '' }); location.reload();
  } catch (e) { alert('นำเข้าไม่สำเร็จ: ' + ((e && e.message) || e)); }
}
window.addEventListener('online', () => schedSync());
setInterval(() => { const c = cfg(); if (c.on) syncNow(); }, 5 * 60 * 1000);
setTimeout(() => { const c = cfg(); if (c.on) syncNow(); }, 8000);

// ===== กลุ่มลูกค้า / รวมบิลกลุ่ม =====
function grpForm(i) {
  const nm = db.customers[i], cur = (db.custGroup || {})[nm] || '', gs = [...new Set(Object.values(db.custGroup || {}))];
  modal(`<div class="flex justify-between mb-2"><b class="text-xl">กลุ่มของ ${esc(nm)}</b><button onclick="closeM()">✕</button></div><div class="grid grid-cols-2 gap-2">${gs.map(g => `<button class="btn ${g === cur ? 'p' : ''}" onclick="setGrp(${i},this.dataset.g)" data-g="${esc(g)}">${esc(g)}</button>`).join('')}</div><button class="btn g w-full mt-3" onclick="newGrp(${i})">+ สร้างกลุ่มใหม่</button><button class="btn w-full mt-2" onclick="setGrp(${i},'')">ไม่อยู่กลุ่ม</button>`);
}
function newGrp(i) { form('สร้างกลุ่มใหม่', [{ k: 'n', l: 'ชื่อกลุ่ม (เช่น กลุ่มโรงเหล้า)' }], v => { if (!v.n) return toast('กรอกชื่อกลุ่ม'); setGrp(i, v.n); }); }
function setGrp(i, g) { db.custGroup = db.custGroup || {}; if (g) db.custGroup[db.customers[i]] = g; else delete db.custGroup[db.customers[i]]; save(); closeM(); render(); }
let GM = { g: '', from: '', to: '', off: {}, open: {} };
const gmElig = g => tops().filter(b => b.status === 'unpaid' && !isMG(b) && (db.custGroup || {})[b.customer] === g).sort((a, b) => a.date.localeCompare(b.date));
function gmSel() {
  const all = gmElig(GM.g), lo = all.length ? all[0].date.slice(0, 10) : '', hi = all.length ? all[all.length - 1].date.slice(0, 10) : '';
  if (!GM.from) GM.from = lo; if (!GM.to) GM.to = hi;
  const list = all.filter(b => { const d = b.date.slice(0, 10); return d >= GM.from && d <= GM.to; });
  return { list, sel: list.filter(b => !GM.off[b.id]) };
}
function gmM(reset) {
  const gs = [...new Set(Object.values(db.custGroup || {}))];
  if (!gs.length) return alert('ยังไม่มีกลุ่มลูกค้า\nตั้งกลุ่มที่หน้าเลือกลูกค้า (ปุ่ม 🏷 ข้างชื่อ)');
  if (reset || !gs.includes(GM.g)) GM = { g: gs[0], from: '', to: '', off: {}, open: {} };
  const { list, sel } = gmSel(), cs = [...new Set(list.map(b => b.customer))];
  const rowsH = cs.map(c => {
    const bs = list.filter(b => b.customer === c), on = bs.filter(b => !GM.off[b.id]), all = on.length === bs.length;
    return `<div class="border-2 rounded-xl mb-2 bg-indigo-50 border-indigo-200"><div class="flex items-center gap-3 p-3 text-xl font-bold"><button class="w-9 h-9 rounded-lg border-4 border-indigo-600 ${on.length ? 'bg-indigo-600 text-white' : 'bg-white'}" onclick="gmTogC(this.dataset.c)" data-c="${esc(c)}">${all ? '✓' : on.length ? '–' : ''}</button><button class="flex-1 text-left" onclick="GM.open[this.dataset.c]=!GM.open[this.dataset.c];gmM()" data-c="${esc(c)}">${esc(c)} <span class="text-base font-normal text-slate-500">${on.length}/${bs.length} บิล ${GM.open[c] ? '▲' : '▼'}</span></button><span class="font-black">฿${fm(sum(on))}</span></div>${GM.open[c] ? `<div class="bg-white border-t px-3 py-1">${bs.map(b => `<button class="w-full flex justify-between py-2 border-b border-dashed text-lg" onclick="gmTog('${b.id}')"><span>${GM.off[b.id] ? '☐' : '☑'} ${dLab(b.date.slice(0, 10))} · ${b.id}</span><span>${fm(b.total)}</span></button>`).join('')}</div>` : ''}</div>`;
  }).join('');
  modal(`<div class="flex justify-between mb-2"><b class="text-2xl">🧾 รวมบิลกลุ่มลูกค้า</b><button onclick="closeM()">✕</button></div><div class="flex flex-wrap gap-2 items-center mb-2"><b>กลุ่ม:</b>${selH(gs.map(g => [g, g]), GM.g, "GM.g=this.value;GM.from=GM.to='';GM.off={};GM.open={};gmM()")}<b>ตั้งแต่</b><input type="date" class="inp !w-auto" value="${GM.from}" onchange="GM.from=this.value;gmM()"><b>ถึง</b><input type="date" class="inp !w-auto" value="${GM.to}" onchange="GM.to=this.value;gmM()"></div><div class="text-sm text-slate-500 mb-2">แสดงบิลค้างชำระของลูกค้าในกลุ่มนี้ เลือกให้ทั้งหมดตั้งแต่เก่าสุดถึงล่าสุด ติ๊กออกได้ทีละบิลหรือทั้งราย</div>${rowsH || '<p class="text-slate-400 py-4 text-center text-lg">ไม่มีบิลค้างชำระในกลุ่มนี้</p>'}<div class="flex justify-between items-center bg-amber-100 rounded-xl p-3 text-2xl font-black mt-2"><span>รวมที่เลือก ${sel.length} บิล (${new Set(sel.map(b => b.customer)).size} ราย)</span><span class="text-rose-700">฿${fm(sum(sel))}</span></div><div class="flex gap-2 mt-3"><button class="btn flex-1" onclick="closeM()">ยกเลิก</button><button class="btn flex-1" onclick="gmPreview()">👁 ดูตัวอย่าง</button><button class="btn g flex-[1.4]" onclick="gmCreate()">สร้างใบแจ้งยอดรวม</button></div>`);
  $('#mbox').style.maxWidth = '56rem';
}
function gmTog(id) { GM.off[id] = !GM.off[id]; gmM(); }
function gmTogC(c) { const bs = gmSel().list.filter(b => b.customer === c), allOn = bs.every(b => !GM.off[b.id]); bs.forEach(b => { GM.off[b.id] = allOn; }); gmM(); }
function gmMake(ids, id, preview) {
  const ks = ids.map(i => db.bills.find(x => x.id == i)).filter(Boolean);
  return { id, date: nowS(), customer: GM.g, group: GM.g, gm: true, items: [], mergedIds: ids, total: sum(ks), status: 'unpaid', pay: null };
}
async function gmPreview() {
  const { sel } = gmSel(); if (!sel.length) return alert('เลือกบิลก่อน');
  const cvs = await gmCanvases(gmMake(sel.map(b => b.id), '(ตัวอย่าง)'));
  modal(`<div class="flex justify-between mb-2"><b class="text-xl">ตัวอย่างใบแจ้งยอดรวม</b><button onclick="closeM()">✕</button></div>${cvs.map(c => `<img src="${c.toDataURL('image/png')}" class="w-full border mb-2">`).join('')}<button class="btn w-full py-3" onclick="gmM()">← กลับไปเลือกบิล</button>`);
}
function gmCreate() {
  const { sel } = gmSel(); if (sel.length < 2) return alert('เลือกบิลอย่างน้อย 2 บิล');
  const id = 'MG-' + uid().slice(-5), ids = sel.map(b => b.id), b = gmMake(ids, id);
  sel.forEach(k => { k.mergedInto = id; }); db.bills.unshift(b); save(); closeM(); toast('สร้างใบแจ้งยอดรวมกลุ่มแล้ว'); render(); openBill(id);
}
function gmData(b) {
  const ks = kids(b), cs = []; ks.forEach(k => { if (!cs.includes(k.customer)) cs.push(k.customer); });
  cs.sort((x, y) => { const a = db.customers.indexOf(x), c = db.customers.indexOf(y); return (a < 0 ? 999 : a) - (c < 0 ? 999 : c); });
  const ds = ks.map(k => k.date.slice(0, 10)).sort(), d0 = ds[0], d1 = ds[ds.length - 1], days = [];
  for (const d = new Date(d0 + 'T00:00'); ymd(d) <= d1; d.setDate(d.getDate() + 1)) days.push(ymd(d));
  const cell = {}; ks.forEach(k => { const key = k.date.slice(0, 10) + '|' + k.customer; cell[key] = (cell[key] || 0) + k.total; });
  const tot = {}; cs.forEach(c => { tot[c] = sum(ks.filter(k => k.customer === c)); });
  return { cs, days, cell, tot, d0, d1, total: sum(ks) };
}
async function gmCanvases(b) {
  await Promise.all([fontsReady(), logoReady]);
  const D = gmData(b), ch = []; for (let i = 0; i < D.cs.length; i += 4) ch.push(D.cs.slice(i, i + 4));
  return ch.map((cs, ci) => drawGm(b, D, cs, ci, ch.length));
}
function drawGm(b, D, cs, ci, n) {
  const K = 2, W = 720, P = 24, RH = 46, DW = 150, last = ci === n - 1, colW = (W - 2 * P - DW) / cs.length;
  const m = document.createElement('canvas').getContext('2d'); m.font = fnt(32, 1);
  const title = 'ใบแจ้งยอดรวม (กลุ่ม ' + b.group + ')' + (n > 1 ? ' [' + (ci + 1) + '/' + n + ']' : ''), tl = wrapT(m, title, W - 2 * P);
  const lw = 150, lh = LOGO.naturalWidth ? Math.round(lw * LOGO.naturalHeight / LOGO.naturalWidth) : 0;
  const H = P + lh + 10 + tl.length * 46 + 40 + 40 + 16 + RH * (D.days.length + 2) + (last ? 90 : 0) + P;
  const c = document.createElement('canvas'); c.width = W * K; c.height = H * K; const x = c.getContext('2d'); x.scale(K, K);
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.textBaseline = 'middle'; x.textAlign = 'left';
  const cen = (t, y, f, col) => { x.font = f; x.fillStyle = col || '#000'; x.fillText(t, (W - x.measureText(t).width) / 2, y); };
  let y = P; if (lh) x.drawImage(LOGO, (W - lw) / 2, y, lw, lh); y += lh + 10;
  tl.forEach(t => { cen(t, y + 23, fnt(32, 1)); y += 46; });
  const pd = b.status === 'paid', stt = pd ? 'ชำระแล้ว (' + (PAY[b.pay] || '') + ')' : 'ค้างชำระ', rng = dLab(D.d0) + ' – ' + dLab(D.d1) + ' ' + (+D.d1.slice(0, 4) + 543);
  x.font = fnt(22, 0); const w1 = x.measureText('ช่วงวันที่ ' + rng + '  ').width; x.font = fnt(21, 1); const w2 = x.measureText(stt).width + 28, sx = (W - w1 - w2) / 2;
  x.font = fnt(22, 0); x.fillStyle = '#333'; x.fillText('ช่วงวันที่ ' + rng + '  ', sx, y + 20);
  x.fillStyle = pd ? '#bbf7d0' : '#fde68a'; x.beginPath(); x.roundRect(sx + w1, y + 4, w2, 32, 16); x.fill();
  x.font = fnt(21, 1); x.fillStyle = pd ? '#14532d' : '#78350f'; x.fillText(stt, sx + w1 + 14, y + 21); y += 40;
  cen('เลขที่ ' + b.id + ' · ออกเมื่อ ' + fd(b.date), y + 18, fnt(21, 0), '#333'); y += 40 + 16;
  const cx = i => P + DW + i * colW;
  const cellT = (t, xx, yy, w, al, f, col) => { x.font = f; x.fillStyle = col || '#000'; const tw = x.measureText(t).width; x.fillText(t, al === 'r' ? xx + w - 10 - tw : al === 'c' ? xx + (w - tw) / 2 : xx + 10, yy + RH / 2); };
  const box = (xx, yy, w, fill) => { if (fill) { x.fillStyle = fill; x.fillRect(xx, yy, w, RH); } x.strokeStyle = '#111'; x.lineWidth = 1; x.strokeRect(xx + .5, yy + .5, w - 1, RH - 1); };
  box(P, y, DW, '#312e81'); cellT('วันที่', P, y, DW, 'c', fnt(25, 1), '#fff');
  cs.forEach((nm, i) => { box(cx(i), y, colW, '#312e81'); let f = 25; x.font = fnt(f, 1); while (f > 15 && x.measureText(nm).width > colW - 14) { f--; x.font = fnt(f, 1); } cellT(nm, cx(i), y, colW, 'c', fnt(f, 1), '#fff'); });
  y += RH;
  D.days.forEach(d => {
    box(P, y, DW); cellT(dLab(d), P, y, DW, 'l', fnt(25, 0));
    cs.forEach((nm, i) => { box(cx(i), y, colW); const v = D.cell[d + '|' + nm]; if (v) cellT(Math.round(v * 100) % 100 ? fm(v) : Math.round(v).toLocaleString('en-US'), cx(i), y, colW, 'r', fnt(25, 0)); });
    y += RH;
  });
  box(P, y, DW, '#f6a23a'); cellT('รวม', P, y, DW, 'l', fnt(27, 1));
  cs.forEach((nm, i) => { box(cx(i), y, colW, '#f6a23a'); cellT(Math.round(D.tot[nm] * 100) % 100 ? fm(D.tot[nm]) : Math.round(D.tot[nm]).toLocaleString('en-US'), cx(i), y, colW, 'r', fnt(27, 1)); });
  y += RH;
  if (last) {
    y += 14; x.fillStyle = '#e8301f'; x.beginPath(); x.roundRect(P, y, W - 2 * P, 70, 12); x.fill();
    x.font = fnt(34, 1); x.fillStyle = '#fff'; x.fillText(pd ? 'ยอดรวมทั้งกลุ่ม' : 'ยอดที่ต้องโอน', P + 18, y + 36); const t = '฿' + fm(D.total); x.fillText(t, W - P - 18 - x.measureText(t).width, y + 36);
  }
  return c;
}
async function gmShow(b) {
  try { const cvs = await gmCanvases(b), rc = $('#rc'); if (rc) rc.innerHTML = cvs.map(c => `<img src="${c.toDataURL('image/png')}" class="w-full border mb-2">`).join(''); }
  catch (e) { const rc = $('#rc'); if (rc) rc.textContent = 'สร้างภาพไม่สำเร็จ'; }
}

// ===== ประกาศท้ายบิล =====
function togNotice(id) { const x = db.notices.find(v => v.id == id); x.on = x.on === false; save(); }
function delNotice(id) { if (confirm('ลบประกาศนี้?')) { db.notices = db.notices.filter(v => v.id != id); selN = selN.filter(v => v != id); save(); settings(); } }
function noticeForm(id, text, end) {
  const x = db.notices.find(v => v.id == id) || {};
  form(id ? 'แก้ประกาศ' : 'เพิ่มประกาศ', [{ k: 't', l: 'ข้อความ (ไม่เกิน 100 ตัวอักษร)', v: x.text ?? text ?? '' }, { k: 'e', l: 'แสดงถึงวันที่ (เว้นว่าง = ไม่มีวันหมด)', t: 'date', v: x.end ?? end ?? '' }],
    v => { if (!v.t) return toast('กรอกข้อความ'); if (v.t.length > 100) return toast('ยาวเกิน 100 ตัวอักษร'); if (id) { x.text = v.t; x.end = v.e; } else db.notices.push({ id: uid(), text: v.t, on: true, end: v.e }); save(); closeM(); settings(); });
}
function priceNotice() {
  if (!db.products.length) return toast('ยังไม่มีปุ่มสินค้า');
  modal(`<div class="flex justify-between mb-2"><b class="text-xl">เลือกสินค้าที่ปรับราคา</b><button onclick="settings()">✕</button></div><div class="grid grid-cols-3 gap-2">${db.products.map(p => `<button class="btn p" onclick="priceNotice2('${p.id}')">${esc(p.name)}</button>`).join('')}</div>`);
}
function priceNotice2(pid) {
  const p = db.products.find(x => x.id == pid);
  form('ปรับราคา ' + p.name, [{ k: 'p', l: 'ราคาใหม่ (บาท)', t: 'number' }, { k: 'd', l: 'มีผลตั้งแต่วันที่', t: 'date', v: todayS() }],
    v => { const pr = n(v.p); if (pr <= 0 || !v.d) return toast('กรอกราคาและวันที่'); const u = p.type === 'kg' ? 'กก.' : 'หน่วย';
      noticeForm(null, `ปรับราคา ${p.name} เป็น ${pr} บาท/${u} ตั้งแต่ ${new Date(v.d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`, v.d); });
}
function togN(id) { selN = selN.includes(id) ? selN.filter(v => v != id) : [...selN, id]; noticePick(); }
function noticePick() {
  const L = liveNotices();
  modal(`<div class="flex justify-between mb-2"><b class="text-xl">📢 เลือกประกาศท้ายบิลนี้</b><button onclick="closeM();render()">✕</button></div>${L.map(x => `<button class="w-full text-left border-2 rounded-xl p-3 mb-2 flex gap-3 items-center ${selN.includes(x.id) ? 'border-indigo-600 bg-indigo-50' : ''}" onclick="togN('${x.id}')"><span class="text-2xl">${selN.includes(x.id) ? '☑' : '☐'}</span><span class="font-bold text-lg">${esc(x.text)}</span></button>`).join('') || '<p class="text-slate-400 py-4">ยังไม่มีประกาศที่เปิดใช้ ไปเพิ่มที่ ⚙️ ตั้งค่า</p>'}<button class="btn p w-full py-3 mt-2" onclick="closeM();render()">ตกลง</button>`);
}

// ===== ใบเสร็จ =====
const HEAD = `<img src="logo.png" alt="ร้านปลาเม้า" style="display:block;width:48%;margin:0 auto 4px"><div class="text-center text-xs font-semibold">${ADDR}</div><div class="text-center text-xs font-semibold">${TEL}</div>`;
const itemT = i => `${i.name} / ${i.qty}${i.unit === 'kg' ? ' กก.' : ' ชิ้น'}${i.cnt ? ' (' + i.cnt + ' ตัว)' : ''}`;
const itemS = i => `(@฿${fm(i.price)}${i.unit === 'kg' ? '/กก.' : '/หน่วย'})`;
const line = i => `<div><div class="ln" style="display:flex;align-items:baseline"><b class="ln-n" style="font-size:24px;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(itemT(i))}</b><b class="ln-p" style="font-size:24px;flex-shrink:0;margin-left:8px">฿${fm(i.total)}</b></div><div style="font-size:16px">${esc(itemS(i))}</div></div>`;
function fitLines() {
  document.querySelectorAll('.ln').forEach(el => {
    const nm = el.querySelector('.ln-n'), pr = el.querySelector('.ln-p'); if (!nm || !el.offsetWidth) return;
    let sz = 24; nm.style.fontSize = pr.style.fontSize = sz + 'px';
    while (sz > 13 && nm.scrollWidth > nm.clientWidth + 1) { sz--; nm.style.fontSize = pr.style.fontSize = sz + 'px'; }
  });
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLines);
const cartLines = (a, fn) => a.length ? a.map(i => `<div class="flex gap-1"><div class="flex-1 min-w-0">${line(i)}</div><button class="text-rose-600 no-print" onclick="${fn}('${i.id}')">✕</button></div>`).join('') : '<div class="text-center text-slate-400 py-6">- ยังไม่มีรายการ -</div>';
function body(b) {
  if (!isMG(b)) return b.items.map(line).join('');
  const ks = kids(b), [lat, old] = mgSplit(ks);
  const sec = m => `<div class="border-t border-dashed border-black pt-1 mt-1"><div class="font-bold text-xs">บิล ${m.id} (${fd(m.date)})</div>${m.items.map(line).join('')}<div class="text-right ${split === 'bill' ? 'text-sm font-bold' : 'font-black'}" ${split === 'bill' ? '' : 'style="font-size:34px"'}>รวม ฿${fm(m.total)}</div></div>`;
  if (split === 'bill') return ks.slice().sort((a, b) => a.date.localeCompare(b.date)).map(sec).join('');
  return (lat ? sec(lat) : '') + (old.length ? `<div class="border-t border-dashed border-black pt-1 mt-1"><div class="text-xs">ยอดค้างก่อนหน้า ${old.length} บิล</div>${old.map(m => `<div class="flex justify-between text-sm"><span>${dLab(m.date.slice(0, 10))} ${m.id}</span><b>฿${fm(m.total)}</b></div>`).join('')}</div>` : '');
}
const noticeHtml = b => { const ns = noticesOf(b); return ns.length ? `<div class="border-t border-black mt-2 pt-1 text-center font-bold" style="font-size:18px">** ประกาศ **</div>${ns.map(x => `<div class="font-bold text-center" style="font-size:18px">${esc(x)}</div>`).join('')}<div class="border-t border-black mt-1"></div>` : ''; };
const receipt = (b, pre) => `<div class="receipt">${HEAD}<div class="font-extrabold text-center border-y-2 border-black my-2 py-1">${rTitle(b)}</div><div class="text-xs mb-1">${b.id ? 'เลขที่: ' + b.id + '<br>' : ''}เวลา: ${fd(b.date)}<br>ลูกค้า: <b>${esc(b.customer)}</b>${b.status ? '<br>สถานะ: ' + stat(b) : ''}${isMG(b) ? '<br>รวมจาก ' + kids(b).length + ' บิล' : ''}</div><div class="border-t-2 border-black pt-1 space-y-1">${pre || body(b)}</div><div class="border-t-2 border-black mt-2 pt-1">${b.rnd ? `<div class="flex justify-between text-sm"><span>ปัดเศษ</span><span>-฿${fm(b.rnd)}</span></div>` : ''}${isMG(b) && !b.gm && split !== 'bill' ? `<div class="flex justify-between text-sm"><span>ยอดค้างรวมทั้งหมด</span><span>฿${fm(b.total)}</span></div>` : `<div class="flex justify-between text-xl font-black"><span>รวมทั้งสิ้น</span><span>฿${fm(b.total)}</span></div>`}${b.rcv != null ? `<div class="flex justify-between text-sm"><span>รับเงินสด</span><span>฿${fm(b.rcv)}</span></div><div class="flex justify-between text-sm font-bold"><span>เงินทอน</span><span>฿${fm(b.chg)}</span></div>` : ''}</div>${noticeHtml(b)}<div class="text-center text-xs mt-3">${db.lineId ? 'Line: ' + esc(db.lineId) + '<br>' : ''}<b>" THANK YOU "</b></div></div>`;

// ===== หน้าจอ =====
const tile = (e, l, v, c) => `<button onclick="go('${v}')" class="${c} text-white rounded-2xl p-6 text-center font-extrabold text-xl shadow active:scale-95"><div class="text-4xl mb-1">${e}</div>${l}</button>`;
let ORDM = false;
const ordBtn = () => `<button class="btn ${ORDM ? 'g' : ''}" onclick="ORDM=!ORDM;render()">${ORDM ? '✓ เสร็จ' : '↕ จัดลำดับ'}</button>`;
function mv(key, i, d) { const a = db[key], j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; save(); render(); }
const mvB = (key, i, n) => `<div class="flex gap-1"><button class="btn flex-1 text-2xl" ${i === 0 ? 'disabled style="opacity:.3"' : ''} onclick="event.stopPropagation();mv('${key}',${i},-1)">⬆</button><button class="btn flex-1 text-2xl" ${i === n - 1 ? 'disabled style="opacity:.3"' : ''} onclick="event.stopPropagation();mv('${key}',${i},1)">⬇</button></div>`;
const pgrid = t => `<div class="mb-2 text-right">${ordBtn()}</div><div class="pgrid">${db.products.map((p, pi) => `<div class="pbtn" onclick="${ORDM ? '' : `tap('${p.id}','${t}')`}">${ORDM ? '' : `<button class="x" onclick="event.stopPropagation();delProd('${p.id}')">✕</button>`}<b>${esc(p.name)}</b><small>${p.type === 'kg' ? 'ชั่งน้ำหนัก' : 'ชิ้น/ถุง'}</small>${ORDM ? mvB('products', pi, db.products.length) : ''}</div>`).join('') || '<p class="text-slate-400">ยังไม่มีปุ่มสินค้า กด "+ สร้างปุ่มสินค้า"</p>'}</div>`;
const txTable = (rows, showName) => `<table class="w-full text-sm">${rows.map(t => `<tr><td>${fd(t.date)}</td>${showName ? `<td>${esc(sname(t.sid))}</td>` : ''}<td>${TX[t.type]}</td><td class="text-right font-bold">฿${fm(t.amount)}</td><td class="text-xs text-slate-500">${esc(t.note || '')}</td><td><button class="text-rose-600" onclick="delTx('${t.id}')">✕</button></td></tr>`).join('') || '<tr><td class="text-slate-400">ไม่มีรายการ</td></tr>'}</table>`;
const sname = id => (db.staff.find(s => s.id == id) || {}).name || '-';
const nameBox = (key, label, onsel) => {
  let ord = db[key].map((c, i) => i); const info = {};
  if (key === 'customers') {
    const thr = resetThr(), last = {}; db.bills.forEach((b, r) => { if (!isMG(b) && (!(b.customer in last) || b.date > last[b.customer].d)) last[b.customer] = { r, d: b.date }; });
    if (!ORDM) ord = [...ord.filter(i => !(last[db[key][i]] && last[db[key][i]].d > thr)), ...ord.filter(i => last[db[key][i]] && last[db[key][i]].d > thr)];
    ord.forEach(i => { const l = last[db[key][i]]; if (l && l.d > thr) info[i] = '✓ ' + (l.d.slice(0, 10) === todayS() ? l.d.slice(11) : new Date(l.d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })); });
  }
  return `<div class="card"><div class="flex justify-between mb-2"><b>${label}</b><div class="flex gap-2">${ordBtn()}<button class="btn g" onclick="addName('${key}','ชื่อ')">+ เพิ่มรายชื่อ</button></div></div><div class="grid grid-cols-3 gap-2">${ord.map(i => `<div class="border rounded-xl p-2 flex gap-1 items-center ${info[i] ? 'opacity-60' : ''}">${ORDM ? `<b class="flex-1 text-lg px-1">${esc(db[key][i])}</b>${mvB(key, i, db[key].length)}` : `<button class="btn p flex-1" onclick="${onsel}(${i})">${esc(db[key][i])}${key === 'customers' && (db.custGroup || {})[db[key][i]] ? `<br><small>กลุ่ม: ${esc(db.custGroup[db[key][i]])}</small>` : ''}${info[i] ? `<br><small>${info[i]}</small>` : ''}</button>${key === 'customers' ? `<button onclick="grpForm(${i})" title="ตั้งกลุ่ม">🏷</button>` : ''}<button class="text-rose-600" onclick="delName('${key}',${i})">🗑</button>`}</div>`).join('') || '<p class="text-slate-400">ยังไม่มีรายชื่อ</p>'}</div></div>`;
};

const V = {
  home: () => `<div class="grid grid-cols-3 gap-4 max-w-4xl mx-auto mt-4">${tile('🛒', 'เมนูการขาย', 'cust', 'bg-indigo-600 col-span-3')}${(() => { const u = tops().filter(b => b.status === 'unpaid'); return `<button onclick="showUnpaid()" class="bg-orange-500 text-white rounded-2xl p-4 text-center font-extrabold text-xl shadow active:scale-95 col-span-3">💰 บิลค้างจ่าย ${u.length ? u.length + ' บิล' : '(ไม่มี)'}</button>`; })()}${tile('🧾', 'ประวัติบิล', 'bills', 'bg-sky-600')}${tile('📦', 'ซื้อเข้า', 'purchase', 'bg-emerald-600')}${tile('👷', 'ค่าจ้างพนักงาน', 'staff', 'bg-amber-600')}${tile('💸', 'รายจ่ายทั่วไป', 'exp', 'bg-rose-600')}${tile('📊', 'สรุปบัญชี', 'sum', 'bg-slate-700')}</div>`,

  cust: () => `<div class="max-w-4xl mx-auto grid gap-3"><div class="grid grid-cols-4 gap-3"><button class="btn p text-2xl py-8 col-span-2" onclick="selCust(WALK)">👤 ${WALK}</button><button class="btn a text-xl" onclick="gmM(true)">🧾 รวมบิลกลุ่ม</button><button class="btn text-xl" onclick="parkedList()">⏸ บิลที่พัก (${db.parked.length})</button></div>${nameBox('customers', 'ลูกค้าประจำ', 'selReg')}</div>`,

  pos: () => `<div class="flex gap-3 fill"><div class="card flex-1 min-w-0 overflow-y-auto"><div class="flex flex-wrap gap-2 items-center mb-3"><b>ลูกค้า:</b><span class="bg-indigo-100 text-indigo-900 font-bold px-3 py-1 rounded-lg">${esc(cust)}</span><button class="btn" onclick="editCust()">✏️ แก้ชื่อ</button><button class="btn" onclick="go('cust')">เปลี่ยนลูกค้า</button><button class="btn a" onclick="parkedList()">🕐 บิลที่พัก (${db.parked.length})</button><button class="btn ${selN.length ? 'p' : ''}" onclick="noticePick()">📢 ประกาศ (${selTexts().length})</button><button class="btn p ml-auto" onclick="addProd()">+ สร้างปุ่มสินค้า</button></div>${pgrid('c')}</div><div class="pane w-[560px] shrink-0 flex flex-col gap-2">${EDIT ? `<div class="card bg-amber-50 border-2 border-amber-400"><b class="text-lg">✏️ กำลังแก้ไขบิล ${EDIT.id}</b><div class="flex items-center gap-2 mt-1"><b>วันที่บิล</b><input type="date" class="inp !w-auto" value="${EDIT.date}" onchange="EDIT.date=this.value"></div></div>` : ''}<div class="card flex-1 min-w-0 overflow-y-auto">${receipt({ date: nowS(), customer: cust, total: rdn(sum(cart)), rnd: cartRnd(), notices: selTexts() }, cartLines(cart, 'delCart'))}</div>${EDIT ? `<div class="grid grid-cols-2 gap-2"><button class="btn r" onclick="cancelEdit()">ยกเลิกการแก้ไข</button><button class="btn g" onclick="saveEdit()">💾 บันทึกการแก้ไข</button></div>` : `<div class="grid grid-cols-3 gap-2"><button class="btn r" onclick="clearCart()">ยกเลิกบิล</button><button class="btn a" onclick="park()">พักบิล</button><button class="btn g" onclick="payM()">ชำระเงิน</button></div>`}</div></div>`,

  bills: () => {
    const L = (F.k ? db.bills : tops()).filter(b => per(b.date, F.p) && (F.s === 'all' || b.status === F.s) && (F.c === 'all' || b.customer === F.c)).sort((a, b) => b.date.localeCompare(a.date));
    const cs = [['all', 'ลูกค้าทั้งหมด'], ...[...new Set(tops().map(b => b.customer))].map(c => [c, c])];
    return `<div class="card"><div class="flex flex-wrap gap-2 items-center mb-3">${selH(PO, F.p, "F.p=this.value;render()")}${selH(cs, F.c, "F.c=this.value;render()")}${selH([['all', 'ทุกสถานะ'], ['unpaid', 'ค้างชำระ'], ['paid', 'ชำระแล้ว']], F.s, "F.s=this.value;render()")}<label class="flex items-center gap-1 text-sm ml-auto"><input type="checkbox" ${F.k ? 'checked' : ''} onchange="F.k=this.checked;render()">แสดงบิลที่รวมแล้ว</label><button class="btn a" onclick="gmM(true)">🧾 รวมบิลกลุ่ม</button><button class="btn" onclick="selAll()">${F.c !== 'all' ? 'เลือกทั้งหมดของลูกค้านี้' : 'เลือกค้างชำระทั้งหมดที่แสดง'}</button><button class="btn g" onclick="paySel('transfer')">โอนแล้ว (ที่เลือก)</button><button class="btn a" onclick="paySel('cash')">เงินสด (ที่เลือก)</button><button class="btn p" onclick="mergeSel()">รวมบิลที่เลือก</button><button class="btn r" onclick="cancelSel()">ยกเลิกที่เลือก</button></div>${F.s === 'unpaid' ? `<div class="bg-orange-100 text-orange-900 font-black text-xl rounded-xl p-2 mb-2">ค้างจ่ายรวม ${L.filter(x => !x.mergedInto).length} บิล ฿${fm(sum(L.filter(x => !x.mergedInto)))}</div>` : ''}<table class="w-full text-sm"><tr class="font-bold"><td></td><td>เลขที่</td><td>วันที่</td><td>ลูกค้า</td><td class="text-right">ยอดรวม</td><td>สถานะ</td><td></td></tr>${L.map(b => `<tr><td>${b.mergedInto ? '' : `<input type="checkbox" class="bc" value="${b.id}" ${b.status === 'unpaid' ? 'data-un="1"' : ''}>`}</td><td class="font-bold">${b.id}</td><td class="text-xs">${fd(b.date)}</td><td>${esc(b.customer)}${isMG(b) ? ' <span class="text-xs bg-indigo-100 px-1 rounded">ใบแจ้งยอดรวม</span>' : ''}${b.mergedInto ? ' <span class="text-xs bg-slate-200 px-1 rounded">รวมแล้วใน ' + b.mergedInto + '</span>' : ''}</td><td class="text-right font-black">฿${fm(b.total)}</td><td><span class="px-2 py-0.5 rounded-full text-xs font-bold ${b.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${stat(b)}</span></td><td class="whitespace-nowrap"><div class="flex gap-1">${b.status === 'unpaid' && !b.mergedInto ? `<button class="btn g" onclick="payConfirm(['${b.id}'],'transfer')">โอนแล้ว</button><button class="btn a" onclick="payConfirm(['${b.id}'],'cash')">เงินสด</button>` : ''}<button class="btn" onclick="openBill('${b.id}')">เปิดดู</button></div></td></tr>`).join('') || '<tr><td colspan="7" class="text-center text-slate-400 p-6">ไม่พบบิล</td></tr>'}</table></div>`;
  },

  purchase: () => `<div class="flex gap-3 fill"><div class="card flex-1 min-w-0 overflow-y-auto"><div class="flex flex-wrap gap-2 items-center mb-3"><b>ซื้อจาก:</b>${selH([['', '-- เลือกผู้ขาย --'], ...db.suppliers.map(s => [s, s])], sup, "sup=this.value;render()")}<button class="btn g" onclick="addName('suppliers','ชื่อผู้ขาย')">+ ผู้ขาย</button><button class="btn r" onclick="delSup()">ลบผู้ขาย</button><button class="btn p ml-auto" onclick="addProd()">+ สร้างปุ่มสินค้า</button></div>${pgrid('p')}</div><div class="pane w-[560px] shrink-0 flex flex-col gap-2 overflow-y-auto"><div class="card"><b>รายการซื้อเข้า (${esc(sup || 'ยังไม่เลือกผู้ขาย')})</b><div class="space-y-1 my-2">${cartLines(pcart, 'delP')}</div><div class="flex justify-between font-black text-lg border-t pt-1"><span>รวม</span><span>฿${fm(sum(pcart))}</span></div><button class="btn g w-full mt-2" onclick="savePur()">ยืนยัน (ค้างจ่าย)</button></div><div class="card space-y-2"><b>ประวัติซื้อเข้า</b>${db.purchases.map(p => `<div class="border rounded-xl p-2 text-sm"><div class="flex justify-between"><b>${esc(p.supplier)}</b><span class="text-xs">${fd(p.date)}</span></div><div class="text-xs text-slate-500">${p.items.map(i => esc(i.name) + ' ' + i.qty).join(', ')}</div><div class="flex justify-between"><b>฿${fm(p.total)}</b><b class="${p.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}">${p.status === 'paid' ? 'จ่ายแล้ว (' + PAY[p.pay] + ')' : 'ค้างจ่าย'}</b></div><div class="flex gap-1 mt-1">${p.status === 'paid' ? '' : `<button class="btn g" onclick="choosePay('p','${p.id}')">เปลี่ยนเป็นจ่ายแล้ว</button>`}<button class="btn r" onclick="delPur('${p.id}')">ลบ</button></div></div>`).join('') || '<p class="text-slate-400 text-sm">ยังไม่มีรายการ</p>'}</div></div></div>`,

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

function render() { const v = $('#ver'); if (v) v.textContent = 'v' + VER; $('#home').classList.toggle('hidden', view === 'home'); $('#app').innerHTML = V[view](); fitLines(); }
function showUnpaid() { F = { p: 'all', s: 'unpaid', c: 'all', k: false }; go('bills'); }
function go(v) { if (EDIT && v !== 'pos') { cart = []; selN = []; EDIT = null; } if (view === 'pos' && !EDIT && v !== 'pos' && cart.length) { parkCart(); toast('พักบิลอัตโนมัติแล้ว'); } view = v; render(); }

// ===== ลูกค้า / รายชื่อ =====
function selCust(name) { selN = []; cust = name; go('pos'); }
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
  const fl = [{ k: 'q', l: k ? 'น้ำหนัก' : 'จำนวน', u: k ? 'กก.' : 'ชิ้น/ถุง', t: 'number' }, { k: 'p', l: 'ราคา', u: k ? 'บาท / กก.' : 'บาท / หน่วย', t: 'number', v: k ? '' : (p.price || '') }];
  if (k) fl.push({ k: 'c', l: 'จำนวนตัว (เว้นว่างได้)', u: 'ตัว', t: 'number' });
  form(p.name, fl,
    v => { const q = n(v.q), pc = n(v.p); if (q <= 0 || pc <= 0) return toast('กรอกจำนวนและราคาให้ครบ'); (t === 'c' ? cart : pcart).push({ id: uid(), name: p.name, unit: p.type, qty: q, price: pc, total: q * pc, cnt: n(v.c) }); closeM(); render(); },
    '<div class="text-right text-3xl font-black text-indigo-700 mt-3">฿<span id="lt">0.00</span></div>');
  const upd = () => $('#lt').textContent = fm(n($('#f_q').value) * n($('#f_p').value));
  $('#mbox').oninput = upd; upd();
}

// ===== ขาย =====
function delCart(id) { cart = cart.filter(i => i.id != id); render(); }
function clearCart() { if (cart.length && confirm('ยกเลิกบิลนี้?')) { cart = []; selN = []; render(); } }
function parkCart() { db.parked.push({ id: uid(), customer: cust, items: cart, time: nowS(), notices: selN.slice() }); save(); cart = []; selN = []; }
function park() { if (!cart.length) return alert('ไม่มีรายการให้พัก'); parkCart(); toast('พักบิลแล้ว'); go('cust'); }
function parkedList() {
  modal(`<div class="flex justify-between mb-2"><b>บิลที่พักไว้</b><button onclick="closeM()">✕</button></div>${db.parked.map(b => `<div class="border rounded-xl p-2 mb-2 flex justify-between items-center"><div><b>${esc(b.customer)}</b><div class="text-xs">${b.items.length} รายการ ฿${fm(sum(b.items))}</div></div><div class="flex gap-1"><button class="btn a" onclick="restore('${b.id}')">ดึงกลับ</button><button class="btn r" onclick="delParked('${b.id}')">ลบ</button></div></div>`).join('') || '<p class="text-slate-400">ไม่มีบิลที่พัก</p>'}`);
}
function restore(id) { const b = db.parked.find(x => x.id == id); if (!b) return; if (cart.length) parkCart(); cart = b.items; cust = b.customer; selN = b.notices || []; db.parked = db.parked.filter(x => x.id != id); save(); closeM(); go('pos'); }
function delParked(id) { db.parked = db.parked.filter(x => x.id != id); save(); parkedList(); render(); }
function payM() {
  if (!cart.length) return alert('เพิ่มสินค้าก่อน');
  modal(`<div class="text-center mb-3"><div class="text-slate-500">ยอดรวม</div><div class="text-4xl font-black text-emerald-600">฿${fm(rdn(sum(cart)))}</div></div><div class="space-y-2"><button class="btn g w-full py-3" onclick="cashM()">เงินสด</button><button class="btn p w-full py-3" onclick="sale('paid','transfer')">เงินโอน</button><button class="btn a w-full py-3" onclick="sale('unpaid')">ค้างชำระ</button><button class="btn w-full" onclick="closeM()">ยกเลิก</button></div>`);
}
function cashM() {
  const tot = rdn(sum(cart));
  modal(`<h3 class="text-2xl font-bold mb-2">รับเงินสด</h3><div class="flex gap-4"><div class="flex-1"><div class="text-slate-500">ยอดที่ต้องรับ</div><div class="text-5xl font-black text-emerald-600 mb-3">฿${fm(tot)}</div><label class="block text-sm font-bold text-slate-500">รับเงินสดมา (บาท)</label><input id="f_r" class="inp np" readonly inputmode="none" style="font-size:32px"><div class="grid grid-cols-3 gap-2 mt-3"><button class="btn g col-span-3 py-3" onclick="cashCheck(${tot})">รับเงินสดมาพอดี</button>${[100, 500, 1000].map(v => `<button class="btn py-3" onclick="cashCheck(${v})">฿${v.toLocaleString()}</button>`).join('')}</div></div>${padHtml()}</div><div class="flex gap-2 mt-4"><button class="btn flex-1" onclick="closeM()">ยกเลิก</button>${padBtn()}<button class="btn p flex-1" id="fok" onclick="cashCheck()">ตกลง</button></div>`);
  $('#mbox').style.maxWidth = padOn() ? '48rem' : ''; setNp($('#f_r'));
}
function cashCheck(v) {
  const tot = rdn(sum(cart)), r = v != null ? v : n($('#f_r').value);
  if (r <= 0) return toast('กรอกจำนวนเงินที่รับมา');
  if (r < tot) return toast('รับเงินไม่พอ ขาดอีก ฿' + fm(tot - r));
  cashDone(r);
}
function cashDone(r) {
  const tot = rdn(sum(cart)), chg = Math.round((r - tot) * 100) / 100;
  modal(`<div class="text-center"><div class="text-slate-500 text-xl">ยอด ฿${fm(tot)} · รับเงินสด ฿${fm(r)}</div><div class="text-slate-500 text-2xl mt-3">เงินทอน</div><div class="font-black text-rose-600 my-3" style="font-size:${chg > 0 ? 72 : 44}px">${chg > 0 ? '฿' + fm(chg) : 'ไม่มีเงินทอน'}</div></div><div class="flex gap-2 mt-2"><button class="btn flex-1 py-3" onclick="cashM()">← แก้ไข</button><button class="btn g flex-1 py-3" id="fok" onclick="sale('paid','cash',{rcv:${r},chg:${chg}})">ยืนยัน (เปิดลิ้นชัก)</button></div>`);
}
function sale(st, m, ex) {
  const b = { id: 'INV-' + uid().slice(-6), date: nowS(), customer: cust, items: cart, total: rdn(sum(cart)), status: st, pay: m || null, paidAt: st === 'paid' ? nowS() : null };
  b.grp = grpOf(cust);
  const nt = selTexts(); if (nt.length) b.notices = nt;
  if (cartRnd()) b.rnd = cartRnd();
  if (ex) Object.assign(b, ex);
  db.bills.unshift(b); save(); cart = []; selN = []; freshId = b.id; closeM(); render();
  if (m === 'cash') openDrawer();
  openBill(b.id);
}

// ===== ประวัติบิล =====
function openBill(id) {
  const b = db.bills.find(x => x.id == id); if (!b) return;
  const fresh = freshId === id;
  modal(`<div class="flex justify-between mb-2"><b>รายละเอียดใบเสร็จ</b>${fresh ? '' : `<button onclick="closeBill('${id}')">✕</button>`}</div>${isMG(b) && !b.gm ? `<div class="flex gap-1 mb-2"><button class="btn flex-1 ${split === 'sum' ? 'p' : ''}" onclick="split='sum';openBill('${id}')">รวมยอด</button><button class="btn flex-1 ${split === 'bill' ? 'p' : ''}" onclick="split='bill';openBill('${id}')">แสดงยอดแยกบิล</button></div>` : ''}<div id="rc">${b.gm ? '<div class="text-center text-slate-400 py-6">กำลังสร้างภาพ...</div>' : receipt(b)}</div><div class="grid grid-cols-2 gap-2 mt-3">${b.status === 'unpaid' && !b.mergedInto ? `<button class="btn g col-span-2" onclick="${isMG(b) ? `payMG('${id}')` : `choosePay('b','${id}')`}">เปลี่ยนสถานะเป็น "ชำระแล้ว"</button>` : ''}${b.status === 'paid' && !b.mergedInto && !fresh ? `<button class="btn col-span-2" onclick="unpay('${id}')">↩ ย้อนกลับเป็นค้างชำระ (กดผิด)</button>` : ''}${b.mergedInto ? `<div class="col-span-2 text-center text-sm text-slate-500">บิลนี้ถูกรวมใน ${b.mergedInto} ชำระที่ใบแจ้งยอดรวม</div>` : ''}${isMG(b) && b.status === 'unpaid' ? `<button class="btn col-span-2" onclick="unmerge('${id}')">ยกเลิกการรวม (แยกกลับเป็นบิลเดิม)</button>` : ''}${isMG(b) ? kids(b).map(k => `<button class="btn col-span-2" onclick="editBill('${k.id}')">✏️ แก้ไขบิล ${k.id} (${dLab(k.date.slice(0, 10))})</button>`).join('') : `<button class="btn col-span-2" onclick="editBill('${id}')">✏️ แก้ไขบิล / วันที่</button>`}<button class="btn" onclick="shareBill('${id}')">แชร์เป็นรูป</button>${b.gm ? '' : `<button class="btn p" onclick="printBill('${id}')">พิมพ์ทันที</button>`}${fresh ? `<button class="btn col-span-2" onclick="closeBill('${id}')">ปิดโดยไม่พิมพ์ (กลับไปเลือกลูกค้า)</button>` : ''}</div>`);
  if (b.gm) gmShow(b);
}
function closeBill(id) { const fresh = freshId === id; freshId = null; closeM(); if (fresh) go('cust'); }
async function printBill(id) {
  const b = db.bills.find(x => x.id == id); if (!b) return;
  if (await safePrint(billBlocks(b))) closeBill(id);
}
async function shareBill(id) {
  const b = db.bills.find(x => x.id == id); if (!b) return;
  try {
    const cvs = b.gm ? await gmCanvases(b) : [await makeCanvas(billBlocks(b), 2, false)];
    const files = [], blobs = [];
    for (let i = 0; i < cvs.length; i++) { const blob = await new Promise(r => cvs[i].toBlob(r, 'image/png')); blobs.push(blob); files.push(new File([blob], b.id + (cvs.length > 1 ? '-' + (i + 1) : '') + '.png', { type: 'image/png' })); }
    if (navigator.canShare && navigator.canShare({ files })) {
      try { await navigator.share({ files }); } catch (e) { if (e.name !== 'AbortError') toast('แชร์ไม่สำเร็จ'); return; }
    } else {
      files.forEach((f, i) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blobs[i]); a.download = f.name; a.click(); }); toast('บันทึกรูปลงเครื่องแล้ว');
    }
    closeBill(id);
  } catch (e) { toast('แชร์ไม่สำเร็จ: ' + (e.message || e)); }
}

function editBill(id) {
  const b = db.bills.find(x => x.id == id); if (!b || !b.items) return;
  if (cart.length && !EDIT && !confirm('ตะกร้าปัจจุบันมีรายการอยู่ จะถูกพักไว้ แล้วเปิดบิลนี้เพื่อแก้ไข')) return;
  if (cart.length && !EDIT) parkCart();
  cart = JSON.parse(JSON.stringify(b.items)); cust = b.customer;
  const ls = liveNotices(); selN = ls.filter(x => (b.notices || []).includes(x.text)).map(x => x.id);
  EDIT = { id, date: b.date.slice(0, 10) }; closeM(); view = 'pos'; render();
}
function cancelEdit() { cart = []; selN = []; EDIT = null; go('bills'); }
function saveEdit() {
  const b = db.bills.find(x => x.id == EDIT.id); if (!b) return cancelEdit();
  if (!cart.length) return alert('ไม่มีรายการสินค้า');
  if (!EDIT.date) return alert('เลือกวันที่');
  if (!confirm('บันทึกการแก้ไขบิล ' + b.id + '?' + (b.status === 'paid' ? '\nบิลนี้ชำระแล้ว ยอดอาจเปลี่ยน' : ''))) return;
  const old = b.total, tm = b.date.slice(10) || 'T00:00:00';
  b.items = cart; b.total = rdn(sum(cart)); const r = cartRnd(); if (r) b.rnd = r; else delete b.rnd;
  b.date = EDIT.date + tm; b.grp = grpOf(b.customer);
  const nt = selTexts(); if (nt.length) b.notices = nt; else delete b.notices;
  if (b.total !== old && b.rcv != null) { delete b.rcv; delete b.chg; }
  const par = b.mergedInto && db.bills.find(x => x.id == b.mergedInto); if (par) par.total = sum(kids(par));
  const st = syn(); delete st.slip[b.id]; if (par) delete st.slip[par.id]; saveSyn(st);
  const id = par ? par.id : b.id; cart = []; selN = []; EDIT = null; save(); view = 'bills'; render(); toast('บันทึกการแก้ไขแล้ว'); openBill(id);
}
function payMG(id) {
  const b = db.bills.find(x => x.id == id); if (!b) return;
  modal(`<div class="flex justify-between mb-2"><b class="text-xl">ชำระบิลไหนบ้าง</b><button onclick="closeM()">✕</button></div><div class="text-sm text-slate-500 mb-2">ติ๊กเฉพาะบิลที่ชำระ บิลที่ไม่ติ๊กจะแยกออกเป็นบิลค้างชำระ</div>${kids(b).slice().sort((a, c) => a.date.localeCompare(c.date)).map(k => `<label class="flex items-center gap-3 border-b py-2 text-xl"><input type="checkbox" class="mgk w-7 h-7" checked value="${k.id}" data-a="${k.total}" onchange="mgTot()"><span class="flex-1">${dLab(k.date.slice(0, 10))} · ${k.id}</span><b>฿${fm(k.total)}</b></label>`).join('')}<div class="bg-amber-100 rounded-xl p-3 text-2xl font-black mt-2 flex justify-between"><span>ยอดที่ชำระ</span><span id="mgt"></span></div><div class="grid grid-cols-2 gap-2 mt-3"><button class="btn g py-3" onclick="payMGDo('${id}','cash')">เงินสด</button><button class="btn p py-3" onclick="payMGDo('${id}','transfer')">เงินโอน</button><button class="btn col-span-2" onclick="closeM()">ยกเลิก</button></div>`);
  mgTot();
}
function mgTot() { const t = [...document.querySelectorAll('.mgk:checked')].reduce((a, c) => a + +c.dataset.a, 0); $('#mgt').textContent = '฿' + fm(t); }
function payMGDo(id, m) {
  const b = db.bills.find(x => x.id == id), ids = [...document.querySelectorAll('.mgk:checked')].map(c => c.value);
  if (!b || !ids.length) return toast('ติ๊กบิลที่ชำระก่อน');
  const all = kids(b), rest = all.filter(k => !ids.includes(k.id)), t = nowS();
  rest.forEach(k => { delete k.mergedInto; });
  b.mergedIds = ids; b.total = sum(kids(b));
  b.status = 'paid'; b.pay = m; b.paidAt = t; kids(b).forEach(k => { k.status = 'paid'; k.pay = m; k.paidAt = t; });
  if (!b.gm && ids.length === 1) { const k = kids(b)[0]; delete k.mergedInto; db.bills = db.bills.filter(x => x.id != id); save(); closeM(); render(); toast('บันทึกการชำระแล้ว'); if (m === 'cash') openDrawer(); return; }
  save(); closeM(); render(); openBill(id); toast('บันทึกการชำระแล้ว' + (rest.length ? ' (แยก ' + rest.length + ' บิลที่ไม่ชำระ)' : '')); if (m === 'cash') openDrawer();
}
function choosePay(kind, id) {
  modal(`<b class="block mb-3">เลือกประเภทการชำระเงิน</b><div class="space-y-2"><button class="btn g w-full py-3" onclick="doPay('${kind}','${id}','cash')">เงินสด${kind === 'b' ? ' (เปิดลิ้นชัก)' : ''}</button><button class="btn p w-full py-3" onclick="doPay('${kind}','${id}','transfer')">เงินโอน</button><button class="btn w-full" onclick="closeM()">ยกเลิก</button></div>`);
}
function doPay(kind, id, m) {
  const x = (kind === 'b' ? db.bills : db.purchases).find(x => x.id == id);
  x.status = 'paid'; x.pay = m; x.paidAt = nowS();
  if (kind === 'b' && isMG(x)) kids(x).forEach(k => { k.status = 'paid'; k.pay = m; k.paidAt = x.paidAt; });
  save(); closeM(); render();
  if (kind === 'b') { openBill(id); if (m === 'cash') openDrawer(); } else toast('อัปเดตแล้ว');
}

function selAll() { const c = [...document.querySelectorAll('.bc[data-un]')], all = c.every(x => x.checked); c.forEach(x => { x.checked = !all; }); }
function paySel(m) { payConfirm([...document.querySelectorAll('.bc:checked')].map(c => c.value), m); }
function payConfirm(ids, m) {
  const bs = db.bills.filter(b => ids.includes(b.id) && b.status === 'unpaid' && !b.mergedInto);
  if (!bs.length) return toast('เลือกบิลค้างชำระก่อน');
  modal(`<div class="text-center"><div class="text-xl font-bold mb-1">รับชำระ${PAY[m]}</div><div class="text-slate-500 text-lg">${bs.length} บิล</div><div class="text-5xl font-black text-emerald-600 my-3">฿${fm(sum(bs))}</div><div class="text-sm text-slate-500 mb-3">${[...new Set(bs.map(b => b.customer))].map(esc).join(', ')}</div></div><div class="flex gap-2"><button class="btn flex-1 py-3" onclick="closeM()">ยกเลิก</button><button class="btn g flex-1 py-3" id="fok" onclick="payDo('${bs.map(b => b.id).join(',')}','${m}')">ยืนยัน</button></div>`);
}
function payDo(idsS, m) {
  const t = nowS(); let c = 0;
  idsS.split(',').forEach(id => {
    const x = db.bills.find(b => b.id == id); if (!x || x.status !== 'unpaid') return;
    x.status = 'paid'; x.pay = m; x.paidAt = t; c++;
    if (isMG(x)) kids(x).forEach(k => { k.status = 'paid'; k.pay = m; k.paidAt = t; });
  });
  save(); closeM(); render(); toast('บันทึกรับชำระ ' + c + ' บิลแล้ว');
}
function unpay(id) {
  const x = db.bills.find(b => b.id == id); if (!x || x.status !== 'paid' || x.mergedInto) return;
  if (!confirm('ย้อนบิล ' + id + ' กลับเป็นค้างชำระ?')) return;
  const rs = b => { b.status = 'unpaid'; b.pay = null; b.paidAt = null; };
  rs(x); if (isMG(x)) kids(x).forEach(rs);
  save(); closeM(); render(); toast('ย้อนเป็นค้างชำระแล้ว');
}
function mergeSel() {
  const ids = [...document.querySelectorAll('.bc:checked')].map(c => c.value), bs = db.bills.filter(b => ids.includes(b.id) && !b.mergedInto);
  if (bs.length < 2 || bs.some(b => b.status !== 'unpaid')) return alert('เลือกบิลค้างชำระอย่างน้อย 2 บิล');
  if (new Set(bs.map(b => b.customer)).size > 1) return alert('รวมได้เฉพาะลูกค้ารายเดียวกัน');
  const leaf = bs.flatMap(b => isMG(b) ? kids(b) : [b]), id = 'MG-' + uid().slice(-5);
  leaf.forEach(k => { k.mergedInto = id; });
  db.bills = db.bills.filter(b => !(isMG(b) && ids.includes(b.id)));
  db.bills.unshift({ id, date: nowS(), customer: bs[0].customer, items: [], mergedIds: leaf.map(k => k.id), total: sum(leaf), status: 'unpaid', pay: null });
  save(); toast('สร้างใบแจ้งยอดรวมแล้ว'); render();
}
function unmerge(id) {
  const b = db.bills.find(x => x.id == id); if (!b || !isMG(b) || b.status !== 'unpaid') return;
  if (!confirm('ยกเลิกการรวม ' + id + ' และแยกกลับเป็นบิลเดิม?')) return;
  kids(b).forEach(k => { delete k.mergedInto; });
  db.bills = db.bills.filter(x => x.id != id); save(); closeM(); toast('แยกกลับเป็นบิลเดิมแล้ว'); render();
}
function cancelSel() {
  const ids = [...document.querySelectorAll('.bc:checked')].map(c => c.value);
  if (!ids.length) return alert('เลือกบิลก่อน');
  if (!confirm(`ยกเลิก (ลบ) ${ids.length} บิลที่เลือก?`)) return;
  db.bills.filter(b => ids.includes(b.id) && isMG(b)).forEach(b => {
    if (confirm(`${b.id}: ลบบิลเดิมที่รวมอยู่ (${kids(b).length} บิล) ด้วยไหม?\nตกลง = ลบทั้งหมด\nยกเลิก = เก็บบิลเดิมกลับเป็นบิลปกติ`)) db.bills = db.bills.filter(x => x.mergedInto !== b.id);
    else kids(b).forEach(k => { delete k.mergedInto; });
  });
  db.bills = db.bills.filter(b => !ids.includes(b.id)); save(); render();
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
  const pb = tops().filter(x => x.status === 'paid' && ir(x.paidAt || x.date));
  const inc = sum(pb), buy = sum(db.purchases.filter(x => x.status === 'paid' && ir(x.paidAt))), wage = sT('wage'), adv = sT('adv'), gen = sum(db.exps.filter(x => ir(x.date)), 'amount'), exp = buy + wage + adv + gen;
  return [['รายรับ (ชำระแล้ว)', inc, 1], ['  เงินสด', sum(pb.filter(x => x.pay === 'cash'))], ['  เงินโอน', sum(pb.filter(x => x.pay === 'transfer'))],
  ['รายจ่าย', exp, 1], ['  ซื้อเข้า (จ่ายแล้ว)', buy], ['  ค่าจ้าง', wage], ['  เบิกล่วงหน้า', adv], ['  รายจ่ายทั่วไป', gen],
  ['กำไร/ขาดทุนสุทธิ', inc - exp, 1], ['ลูกค้าค้างชำระ', sum(tops().filter(x => x.status === 'unpaid' && ir(x.date)))], ['ค้างจ่ายผู้ขาย', sum(db.purchases.filter(x => x.status === 'unpaid' && ir(x.date)))], ['เงินฝากพนักงาน (ไม่นับเป็นรายจ่าย)', sT('dep')]];
}
const rowsH = r => r.map(([l, v, b]) => `<div class="flex justify-between ${b ? 'font-black border-t mt-1 pt-1' : ''}"><span>${l.replace(/^ +/, '&nbsp;&nbsp;')}</span><span>฿${fm(v)}</span></div>`).join('');
async function wipe() {
  if (!confirm('ลบประวัติทั้งหมด (บิล ซื้อเข้า ค่าจ้าง รายจ่าย บิลพัก) เฉพาะในแอปนี้?\nข้อมูลใน Google Drive จะไม่ถูกลบ (ลบเองใน Drive ทีหลังได้)\nรายชื่อและปุ่มสินค้าจะยังอยู่')) return;
  if (!confirm('ยืนยันอีกครั้ง! ลบในแอปแล้วกู้คืนในแอปไม่ได้')) return;
  const c = cfg();
  if (c.on && c.url && navigator.onLine) {
    try { await gPost({ action: 'backup', name: 'mypos-before-wipe-' + nowS().replace(/[:T]/g, '-') + '.json', content: JSON.stringify(db) }); toast('ส่งสำเนาก่อนลบขึ้น Drive แล้ว'); }
    catch (e) { if (!confirm('ส่งสำเนาก่อนลบขึ้น Drive ไม่สำเร็จ (' + ((e && e.message) || e) + ')\nลบต่อไปหรือไม่?')) return; }
  }
  Object.assign(db, { bills: [], parked: [], purchases: [], tx: [], exps: [] });
  const st = syn(); st.rows = {}; st.bkHold = true; saveSyn(st);
  save(); toast('ลบประวัติทั้งหมดแล้ว (ข้อมูลใน Drive ยังอยู่)'); render();
}

render();
