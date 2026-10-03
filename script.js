// สถานะของระบบและการเก็บข้อมูลใน LocalStorage
let currentCustomer = "ลูกค้าหน้าร้าน (ทั่วไป)";
let regularCustomers = JSON.parse(localStorage.getItem('regularCustomers')) || ['ร้านเจ๊พร', 'คุณสมชาย', 'ร้านก๋วยเตี๋ยวป้าป้อม'];
let productButtons = JSON.parse(localStorage.getItem('productButtons')) || [
  { id: 1, name: 'หมูเนื้อแดง', defaultPrice: 150 },
  { id: 2, name: 'สามชั้น', defaultPrice: 180 },
  { id: 3, name: 'สันนอก', defaultPrice: 160 },
  { id: 4, name: 'ซี่โครงหมู', defaultPrice: 170 },
  { id: 5, name: 'หมูบด', defaultPrice: 140 }
];

let cart = [];
let parkedBills = JSON.parse(localStorage.getItem('parkedBills')) || [];
let billHistory = JSON.parse(localStorage.getItem('billHistory')) || [];
let purchaseItems = [];

// ตัวแปรชั่วคราวสำหรับ Popups
let selectedProduct = null;
let activeNumpadField = 'weight';
let currentViewingBill = null;

// เริ่มต้นระบบ
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  updateCustomerDropdownFilter();
});

// การสลับหน้าจอ (Navigation)
function navTo(screenId) {
  document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
  document.getElementById(screenId).classList.remove('hidden');

  const btnHome = document.getElementById('btn-home');
  if (screenId === 'screen-home') {
    btnHome.classList.add('hidden');
  } else {
    btnHome.classList.remove('hidden');
  }

  if(screenId === 'screen-regular-customers') renderRegularCustomersGrid();
  if(screenId === 'screen-pos') renderPOS();
  if(screenId === 'screen-bill-history') {
    updateCustomerDropdownFilter();
    renderBillHistory();
  }
}

// จัดการลูกค้าประจำ
function renderRegularCustomersGrid() {
  const container = document.getElementById('regular-customer-grid');
  if (regularCustomers.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-8 text-slate-400">ยังไม่มีรายชื่อลูกค้าประจำ</div>`;
    return;
  }
  container.innerHTML = regularCustomers.map((cust, idx) => `
    <div class="bg-slate-50 border border-slate-200 hover:border-indigo-500 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all">
      <span class="font-bold text-slate-800 text-lg">${cust}</span>
      <div class="flex gap-2">
        <button onclick="selectCustomer('${cust}')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs shadow-sm">เลือก</button>
        <button onclick="deleteCustomer(${idx})" class="text-rose-500 hover:bg-rose-100 p-2 rounded-xl"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

function selectCustomer(name) {
  currentCustomer = name;
  document.getElementById('pos-customer-name').innerText = name;
  navTo('screen-pos');
}

function showAddCustomerModal() {
  document.getElementById('modal-add-customer').classList.remove('hidden');
}

function saveNewCustomer() {
  const nameInput = document.getElementById('new-customer-name');
  if (nameInput.value.trim()) {
    regularCustomers.push(nameInput.value.trim());
    localStorage.setItem('regularCustomers', JSON.stringify(regularCustomers));
    nameInput.value = '';
    closeModal('modal-add-customer');
    renderRegularCustomersGrid();
    showToast('เพิ่มลูกค้าประจำเรียบร้อย');
  }
}

function deleteCustomer(idx) {
  if (confirm('ยืนยันลบรายชื่อลูกค้านี้?')) {
    regularCustomers.splice(idx, 1);
    localStorage.setItem('regularCustomers', JSON.stringify(regularCustomers));
    renderRegularCustomersGrid();
    showToast('ลบรายชื่อเรียบร้อย');
  }
}

// จัดการปุ่มสินค้า (พร้อมปุ่มลบสินค้า)
function renderProductButtons() {
  const grid = document.getElementById('product-buttons-grid');
  grid.innerHTML = productButtons.map((p, idx) => `
    <div class="bg-indigo-50/80 hover:bg-indigo-100 border-2 border-indigo-200 p-4 rounded-2xl flex flex-col justify-between space-y-2 relative group transition-all">
      <button onclick="deleteProductButton(${idx})" class="absolute top-2 right-2 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-all">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
      <div onclick="openNumpadModal(${p.id})" class="cursor-pointer space-y-1">
        <i data-lucide="package" class="w-6 h-6 text-indigo-600"></i>
        <div class="font-extrabold text-slate-800 text-lg leading-tight">${p.name}</div>
        <div class="text-xs font-bold text-indigo-600">฿${p.defaultPrice} / kg</div>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

function showAddProductModal() {
  document.getElementById('modal-add-product').classList.remove('hidden');
}

function saveNewProductButton() {
  const name = document.getElementById('new-product-name').value.trim();
  const price = parseFloat(document.getElementById('new-product-default-price').value) || 0;
  if (name) {
    productButtons.push({ id: Date.now(), name, defaultPrice: price });
    localStorage.setItem('productButtons', JSON.stringify(productButtons));
    document.getElementById('new-product-name').value = '';
    document.getElementById('new-product-default-price').value = '';
    closeModal('modal-add-product');
    renderProductButtons();
    showToast('สร้างปุ่มสินค้าใหม่เรียบร้อย');
  }
}

function deleteProductButton(idx) {
  if(confirm('คุณต้องการลบปุ่มสินค้านี้ใช่หรือไม่?')) {
    productButtons.splice(idx, 1);
    localStorage.setItem('productButtons', JSON.stringify(productButtons));
    renderProductButtons();
    showToast('ลบปุ่มสินค้าเรียบร้อย');
  }
}

// Numpad และ คำนวณน้ำหนัก * ราคาต่อ 1 กก.
function openNumpadModal(productId) {
  selectedProduct = productButtons.find(p => p.id === productId);
  if(!selectedProduct) return;

  document.getElementById('numpad-product-title').innerText = selectedProduct.name;
  document.getElementById('input-numpad-weight').value = '1';
  document.getElementById('input-numpad-price').value = selectedProduct.defaultPrice || 0;
  
  setActiveNumpadField('weight');
  calculateNumpadTotal();
  document.getElementById('modal-numpad').classList.remove('hidden');
}

function setActiveNumpadField(field) {
  activeNumpadField = field;
  const wBox = document.getElementById('field-weight-container');
  const pBox = document.getElementById('field-price-container');

  if (field === 'weight') {
    wBox.className = "p-3 border-2 border-indigo-500 bg-indigo-50/50 rounded-2xl cursor-pointer";
    pBox.className = "p-3 border-2 border-slate-200 rounded-2xl cursor-pointer";
  } else {
    pBox.className = "p-3 border-2 border-indigo-500 bg-indigo-50/50 rounded-2xl cursor-pointer";
    wBox.className = "p-3 border-2 border-slate-200 rounded-2xl cursor-pointer";
  }
}

function pressNumpad(val) {
  const input = activeNumpadField === 'weight' 
    ? document.getElementById('input-numpad-weight') 
    : document.getElementById('input-numpad-price');

  let cur = input.value;

  if (val === 'CLEAR') {
    input.value = '0';
  } else if (val === 'DEL') {
    input.value = cur.length > 1 ? cur.slice(0, -1) : '0';
  } else if (cur === '0' && val !== '.') {
    input.value = val;
  } else {
    input.value += val;
  }

  calculateNumpadTotal();
}

function calculateNumpadTotal() {
  const weight = parseFloat(document.getElementById('input-numpad-weight').value) || 0;
  const pricePerKg = parseFloat(document.getElementById('input-numpad-price').value) || 0;
  const total = weight * pricePerKg;
  document.getElementById('numpad-calculated-total').innerText = total.toFixed(2);
}

function confirmNumpadAdd() {
  const weight = parseFloat(document.getElementById('input-numpad-weight').value) || 0;
  const pricePerKg = parseFloat(document.getElementById('input-numpad-price').value) || 0;
  const total = weight * pricePerKg;

  if (selectedProduct && weight > 0) {
    cart.push({
      id: Date.now(),
      name: selectedProduct.name,
      weight: weight,
      pricePerKg: pricePerKg,
      total: total
    });
    closeModal('modal-numpad');
    renderPOS();
  }
}

// POS & Cart Operations
function removeItemFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  renderPOS();
}

function cancelCurrentBill() {
  if(cart.length === 0) return;
  if(confirm('ยกเลิกบิลนี้และล้างรายการสินค้าทั้งหมด?')) {
    cart = [];
    renderPOS();
    showToast('ยกเลิกบิลเรียบร้อย');
  }
}

function renderPOS() {
  renderProductButtons();

  const receiptList = document.getElementById('receipt-items-list');
  const totalSum = cart.reduce((s, i) => s + i.total, 0);

  document.getElementById('receipt-total').innerText = totalSum.toFixed(2);
  document.getElementById('receipt-customer').innerText = currentCustomer;
  document.getElementById('parked-badge').innerText = parkedBills.length;
  document.getElementById('receipt-no').innerText = 'INV-' + Math.floor(1000 + Math.random() * 9000);
  
  const now = new Date();
  document.getElementById('receipt-time').innerText = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  if(cart.length === 0) {
    receiptList.innerHTML = `<div class="text-center text-slate-400 py-6 text-sm font-semibold">- ยังไม่มีรายการสินค้า -</div>`;
  } else {
    receiptList.innerHTML = cart.map(item => `
      <div class="flex justify-between items-start text-black font-semibold">
        <div class="max-w-[200px]">
          <div class="font-extrabold text-base">${item.name} /${item.weight} kg</div>
          <div class="text-[11px] text-slate-600">(@฿${item.pricePerKg.toFixed(2)}/kg)</div>
        </div>
        <div class="flex items-center gap-1">
          <span class="font-extrabold text-base">฿${item.total.toFixed(2)}</span>
          <button onclick="removeItemFromCart(${item.id})" class="text-rose-500 hover:bg-rose-100 p-0.5 rounded no-print">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `).join('');
  }
  lucide.createIcons();
}

function openCashDrawerManual() {
  showToast('🔊 เปิดลิ้นชักเก็บเงินแล้ว!');
}

// พักบิล
function parkBillManual() {
  if(cart.length === 0) return alert('ไม่มีรายการในบิลให้พัก');
  parkedBills.push({
    id: Date.now(),
    customer: currentCustomer,
    items: [...cart],
    time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  });
  localStorage.setItem('parkedBills', JSON.stringify(parkedBills));
  cart = [];
  showToast('พักบิลเรียบร้อยแล้ว');
  renderPOS();
}

function showParkedBillsModal() {
  const container = document.getElementById('parked-bills-modal-list');
  if(parkedBills.length === 0) {
    container.innerHTML = `<p class="text-sm text-slate-400 py-8 text-center font-bold">ไม่มีบิลที่พักไว้</p>`;
  } else {
    container.innerHTML = parkedBills.map(b => {
      const total = b.items.reduce((s, i) => s + i.total, 0);
      return `
        <div class="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex justify-between items-center">
          <div>
            <div class="font-extrabold text-slate-800">${b.customer} <span class="text-xs bg-amber-200 px-2 py-0.5 rounded-full">${b.time}</span></div>
            <div class="text-xs text-slate-600 mt-1">${b.items.length} รายการ - รวม: <strong>฿${total.toFixed(2)}</strong></div>
          </div>
          <button onclick="restoreParkedBill(${b.id})" class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-xl">ดึงบิลทำต่อ</button>
        </div>
      `;
    }).join('');
  }
  document.getElementById('modal-parked-bills').classList.remove('hidden');
}

function restoreParkedBill(id) {
  const bill = parkedBills.find(b => b.id === id);
  if(bill) {
    cart = [...bill.items];
    currentCustomer = bill.customer;
    parkedBills = parkedBills.filter(b => b.id !== id);
    localStorage.setItem('parkedBills', JSON.stringify(parkedBills));
    closeModal('modal-parked-bills');
    renderPOS();
    showToast('ดึงบิลกลับมาทำต่อเรียบร้อย');
  }
}

// ชำระเงิน
function showPaymentModal() {
  if(cart.length === 0) return alert('กรุณาเพิ่มสินค้าก่อนชำระเงิน');
  const totalSum = cart.reduce((sum, item) => sum + item.total, 0);
  document.getElementById('payment-modal-total').innerText = `฿${totalSum.toFixed(2)}`;
  document.getElementById('modal-payment').classList.remove('hidden');
}

function processPayment(status) {
  const totalSum = cart.reduce((sum, item) => sum + item.total, 0);
  const newBill = {
    id: 'INV-' + Math.floor(100000 + Math.random() * 900000),
    date: new Date().toISOString(),
    customer: currentCustomer,
    items: [...cart],
    total: totalSum,
    status: status
  };

  billHistory.unshift(newBill);
  localStorage.setItem('billHistory', JSON.stringify(billHistory));

  cart = [];
  closeModal('modal-payment');
  renderPOS();
  showToast('บันทึกการขายเรียบร้อย!');
}

// ประวัติบิลและการกรอง
function updateCustomerDropdownFilter() {
  const select = document.getElementById('filter-customer-group');
  const uniqueCustomers = ['ลูกค้าทั้งหมด', 'ลูกค้าหน้าร้าน (ทั่วไป)', ...regularCustomers];
  select.innerHTML = uniqueCustomers.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderBillHistory() {
  const period = document.getElementById('filter-period').value;
  const customerGroup = document.getElementById('filter-customer-group').value;
  const statusFilter = document.getElementById('filter-status').value;

  const now = new Date();
  let filtered = billHistory.filter(b => {
    const bDate = new Date(b.date);
    
    if(period === 'day' && bDate.toDateString() !== now.toDateString()) return false;
    if(period === 'week') {
      const diffDays = (now - bDate) / (1000 * 3600 * 24);
      if(diffDays > 7) return false;
    }
    if(period === 'month' && (bDate.getMonth() !== now.getMonth() || bDate.getFullYear() !== now.getFullYear())) return false;

    if(customerGroup !== 'ลูกค้าทั้งหมด' && b.customer !== customerGroup) return false;
    if(statusFilter !== 'all' && !b.status.includes(statusFilter)) return false;

    return true;
  });

  const body = document.getElementById('bill-history-table-body');
  if(filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400 font-bold">ไม่พบประวัติบิลตามเงื่อนไขที่เลือก</td></tr>`;
  } else {
    body.innerHTML = filtered.map(b => `
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="p-3 text-center">
          <input type="checkbox" class="bill-checkbox w-4 h-4 text-indigo-600 rounded" value="${b.id}" ${b.status.includes('ค้างชำระ') ? '' : 'disabled'}>
        </td>
        <td class="p-3 font-extrabold text-slate-800">${b.id}</td>
        <td class="p-3 text-xs text-slate-500">${new Date(b.date).toLocaleString('th-TH')}</td>
        <td class="p-3 font-bold text-slate-700">${b.customer}</td>
        <td class="p-3 text-right font-black text-indigo-700">฿${b.total.toFixed(2)}</td>
        <td class="p-3 text-center">
          <span class="px-3 py-1 rounded-full text-xs font-bold ${             b.status.includes('ชำระแล้ว') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'           }">${b.status}</span>
        </td>
        <td class="p-3 text-center">
          <button onclick="viewBillDetails('${b.id}')" class="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-xl font-bold text-xs">เปิดดู</button>
        </td>
      </tr>
    `).join('');
  }
}

// ดูรายละเอียด พิมพ์ แชร์ เปลี่ยนสถานะ
function viewBillDetails(billId) {
  currentViewingBill = billHistory.find(b => b.id === billId);
  if(!currentViewingBill) return;

  const container = document.getElementById('print-receipt-modal');
  container.innerHTML = `
    <div class="receipt-80mm shadow-none border p-4 font-mono text-slate-900">
      <div class="text-center font-black text-2xl tracking-tight text-black">STORE POS</div>
      <div class="text-xs text-center text-black font-semibold">สาขาหลัก เมือง พิษณุโลก 65000</div>
      <div class="text-xs text-center text-black font-semibold">โทร: 081-234-5678</div>
      <div class="font-extrabold text-center border-y-2 border-black my-2 py-1 text-base">ใบเสร็จรับเงิน</div>
      
      <div class="text-xs text-black mb-2 space-y-0.5">
        <div>เลขที่: ${currentViewingBill.id}</div>
        <div>เวลา: ${new Date(currentViewingBill.date).toLocaleString('th-TH')}</div>
        <div>ลูกค้า: <strong>${currentViewingBill.customer}</strong></div>
        <div>สถานะ: <strong>${currentViewingBill.status}</strong></div>
      </div>

      <div class="border-t-2 border-black pt-2 mb-2 space-y-2">
        ${currentViewingBill.items.map(i => `
          <div class="flex justify-between items-start text-black">
            <div>
              <div class="font-extrabold text-base">${i.name} / ${i.weight} kg</div>
              <div class="text-[11px] text-slate-600">(@฿${i.pricePerKg.toFixed(2)}/kg)</div>
            </div>
            <span class="font-extrabold text-base">฿${i.total.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      <div class="border-t-2 border-black pt-2 my-2 flex justify-between items-center font-black text-xl text-black">
        <span>ทั้งสิ้น</span>
        <span>฿${currentViewingBill.total.toFixed(2)}</span>
      </div>

      <div class="text-center mt-4 pt-2 border-t border-dashed border-gray-400 text-xs text-black">
        <p>" THANK YOU "</p>
      </div>
    </div>
  `;

  const toggleContainer = document.getElementById('toggle-status-container');
  if(currentViewingBill.status.includes('ค้างชำระ')) {
    toggleContainer.innerHTML = `
      <button onclick="markBillAsPaid('${currentViewingBill.id}')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl mb-2 flex items-center justify-center gap-2">
        <i data-lucide="check-circle" class="w-5 h-5"></i> เปลี่ยนสถานะเป็น "ชำระแล้ว"
      </button>
    `;
  } else {
    toggleContainer.innerHTML = ``;
  }

  lucide.createIcons();
  document.getElementById('modal-bill-detail').classList.remove('hidden');
}

function markBillAsPaid(billId) {
  const bill = billHistory.find(b => b.id === billId);
  if(bill) {
    bill.status = 'ชำระแล้ว (เงินสด)';
    localStorage.setItem('billHistory', JSON.stringify(billHistory));
    viewBillDetails(billId);
    renderBillHistory();
    showToast('อัปเดตสถานะเป็นชำระแล้ว');
  }
}

function printCurrentBillModal() {
  window.print();
}

function shareBillModal() {
  if(!currentViewingBill) return;
  const text = `ใบเสร็จเลขที่: ${currentViewingBill.id}\nลูกค้า: ${currentViewingBill.customer}\nยอดรวม: ฿${currentViewingBill.total.toFixed(2)}\nสถานะ: ${currentViewingBill.status}`;
  if (navigator.share) {
    navigator.share({ title: 'ใบเสร็จรับเงิน', text: text });
  } else {
    navigator.clipboard.writeText(text);
    showToast('คัดลอกรายละเอียดบิลลง Clipboard แล้ว');
  }
}

// รวมบิล
function mergeSelectedBills() {
  const selectedBoxes = document.querySelectorAll('.bill-checkbox:checked');
  if(selectedBoxes.length < 2) return alert('กรุณาเลือกบิลค้างชำระอย่างน้อย 2 บิลขึ้นไปเพื่อรวมบิล');

  const selectedIds = Array.from(selectedBoxes).map(cb => cb.value);
  const billsToMerge = billHistory.filter(b => selectedIds.includes(b.id));

  const customerNames = [...new Set(billsToMerge.map(b => b.customer))];
  if(customerNames.length > 1) return alert('สามารถรวมบิลได้เฉพาะลูกค้ารายเดียวกันเท่านั้น');

  let combinedItems = [];
  let combinedTotal = 0;

  billsToMerge.forEach(b => {
    combinedItems = [...combinedItems, ...b.items];
    combinedTotal += b.total;
  });

  const mergedBill = {
    id: 'MERGE-' + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toISOString(),
    customer: customerNames[0] + ' (รวมบิล)',
    items: combinedItems,
    total: combinedTotal,
    status: 'ค้างชำระ'
  };

  billHistory = billHistory.filter(b => !selectedIds.includes(b.id));
  billHistory.unshift(mergedBill);
  localStorage.setItem('billHistory', JSON.stringify(billHistory));

  renderBillHistory();
  showToast('รวมบิลค้างชำระเรียบร้อยแล้ว');
}

// ซื้อเข้า
function addPurchaseItem() {
  const name = document.getElementById('p-name').value.trim();
  const qty = document.getElementById('p-qty').value.trim();
  const price = parseFloat(document.getElementById('p-price').value) || 0;

  if(name && qty) {
    purchaseItems.push({ name, qty, price });
    document.getElementById('p-name').value = '';
    document.getElementById('p-qty').value = '';
    document.getElementById('p-price').value = '';
    renderPurchaseTable();
  }
}

function renderPurchaseTable() {
  const body = document.getElementById('purchase-table-body');
  body.innerHTML = purchaseItems.map(i => `
    <tr>
      <td class="p-3 font-bold text-slate-800">${i.name}</td>
      <td class="p-3 text-slate-600">${i.qty}</td>
      <td class="p-3 text-right font-black text-slate-800">฿${i.price.toFixed(2)}</td>
    </tr>
  `).join('');
}

function savePurchaseOrder() {
  if(purchaseItems.length === 0) return alert('ไม่มีรายการซื้อเข้า');
  showToast('บันทึกรายการซื้อเข้าเรียบร้อย');
  purchaseItems = [];
  renderPurchaseTable();
}

// ฟังก์ชันเปิด/ปิด Modal และแจ้งเตือน Toast
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').innerText = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}
