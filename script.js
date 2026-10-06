// --- Initial Data & State ---
const defaultProducts = [
  { id: 1, name: 'ปลากะพง', type: 'weighted', defaultPrice: 180 },
  { id: 2, name: 'ปลาทับทิม', type: 'weighted', defaultPrice: 100 },
  { id: 3, name: 'ปลาหมึกสด', type: 'weighted', defaultPrice: 220 },
  { id: 4, name: 'กุ้งขาว', type: 'weighted', defaultPrice: 250 },
  { id: 5, name: 'เกลือ (ถุง)', type: 'fixed', defaultPrice: 20 },
  { id: 6, name: 'น้ำนวดปลา', type: 'fixed', defaultPrice: 15 }
];

let products = [...defaultProducts];
let cart = [];
let selectedProduct = null;

// Database State (Stored in localStorage)
let bills = JSON.parse(localStorage.getItem('pos_bills')) || [];
let purchases = JSON.parse(localStorage.getItem('pos_purchases')) || [];
let employees = JSON.parse(localStorage.getItem('pos_employees')) || [];
let empTransactions = JSON.parse(localStorage.getItem('pos_emp_tx')) || [];
let expenses = JSON.parse(localStorage.getItem('pos_expenses')) || [];

let summaryFilterState = 'daily';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  renderCart();
  renderHistory();
  renderPurchases();
  renderEmployees();
  renderExpenses();
  renderSummary();
});

// Save State Helper
function saveData() {
  localStorage.setItem('pos_bills', JSON.stringify(bills));
  localStorage.setItem('pos_purchases', JSON.stringify(purchases));
  localStorage.setItem('pos_employees', JSON.stringify(employees));
  localStorage.setItem('pos_emp_tx', JSON.stringify(empTransactions));
  localStorage.setItem('pos_expenses', JSON.stringify(expenses));
}

// Navigation Tabs
function switchTab(tabId) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById(`tab-${tabId}`).classList.add('active');

  if (tabId === 'history') renderHistory();
  if (tabId === 'purchases') renderPurchases();
  if (tabId === 'payroll') { renderEmployees(); renderExpenses(); }
  if (tabId === 'summary') renderSummary();
}

function switchPayrollSub(subId) {
  document.querySelectorAll('.btn-sub').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));

  event.target.classList.add('active');
  document.getElementById(`sub-${subId}`).classList.add('active');
}

// --- Sales & Product Grid ---
function renderProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = products.map(p => `
    <div class="product-card" onclick="handleProductClick(${p.id})">
      <div class="p-name">${p.name}</div>
      <div class="p-price">฿${p.defaultPrice} ${p.type === 'weighted' ? '/ กก.' : '/ ชิ้น'}</div>
      <div class="p-badge">${p.type === 'weighted' ? 'ชั่งน้ำหนัก' : 'นับชิ้น/ถุง'}</div>
    </div>
  `).join('');
}

function handleProductClick(productId) {
  selectedProduct = products.find(p => p.id === productId);
  document.getElementById('modalProductName').textContent = selectedProduct.name;
  
  // ให้ช่องคีย์ราคาและน้ำหนักเป็นช่องว่างเปล่า (Empty) ตั้งแต่แรก
  document.getElementById('inputQty').value = '';
  document.getElementById('inputUnitPrice').value = selectedProduct.defaultPrice || '';
  
  openModal('modalWeightInput');
}

function confirmAddToCart() {
  const qty = parseFloat(document.getElementById('inputQty').value);
  const unitPrice = parseFloat(document.getElementById('inputUnitPrice').value);

  if (!qty || qty <= 0 || !unitPrice || unitPrice <= 0) {
    alert('กรุณากรอกจำนวน/น้ำหนัก และราคาให้ถูกต้อง');
    return;
  }

  const itemTotal = qty * unitPrice;
  cart.push({
    id: Date.now(),
    productId: selectedProduct.id,
    name: selectedProduct.name,
    qty: qty,
    unitPrice: unitPrice,
    total: itemTotal,
    type: selectedProduct.type
  });

  closeModal('modalWeightInput');
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

function renderCart() {
  const tbody = document.getElementById('cartTableBody');
  tbody.innerHTML = cart.map((item, idx) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.qty} ${item.type === 'weighted' ? 'กก.' : 'ชิ้น'}</td>
      <td>฿${item.unitPrice}</td>
      <td>฿${item.total.toFixed(2)}</td>
      <td><button class="btn-danger" style="padding: 2px 6px; font-size: 0.75rem;" onclick="removeFromCart(${idx})">X</button></td>
    </tr>
  `).join('');

  const grandTotal = cart.reduce((sum, i) => sum + i.total, 0);
  document.getElementById('cartTotalDisplay').textContent = `฿${grandTotal.toFixed(2)}`;
}

// --- Payment & Checkout ---
function openPaymentModal() {
  if (cart.length === 0) {
    alert('ไม่มีสินค้าในตะกร้า');
    return;
  }
  openModal('modalPayment');
}

function processPayment(paymentMethod) {
  const customerName = document.getElementById('customerName').value.trim() || 'ลูกค้าหน้าร้าน';
  const grandTotal = cart.reduce((sum, i) => sum + i.total, 0);

  const newBill = {
    billNo: 'POS-' + Date.now().toString().slice(-6),
    dateTime: new Date().toISOString(),
    customerName: customerName,
    items: [...cart],
    total: grandTotal,
    paymentMethod: paymentMethod, // 'เงินสด' หรือ 'เงินโอน'
    status: 'ชำระแล้ว'
  };

  bills.unshift(newBill);
  saveData();

  // พิมพ์ใบเสร็จสลิป
  printReceipt(newBill);

  // รีเซ็ตหน้าขาย
  cart = [];
  renderCart();
  closeModal('modalPayment');

  if (paymentMethod === 'เงินสด') {
    alert('ชำระเงินสดเรียบร้อย (ส่งสัญญาณเปิดลิ้นชักเก็บเงิน)');
  } else {
    alert('ชำระเงินโอนเรียบร้อย');
  }
}

// --- Thermal Receipt Printing ---
function printReceipt(bill) {
  const printArea = document.getElementById('printContainer');
  const dateObj = new Date(bill.dateTime);
  const formattedDate = dateObj.toLocaleDateString('th-TH') + ' ' + dateObj.toLocaleTimeString('th-TH');

  printArea.innerHTML = `
    <div class="receipt-header">
      <div class="receipt-title">ร้านปลาเม้า</div>
      <div>551/145 ถนนมิตรภาพ (ซอย 10) ตำบลในเมือง</div>
      <div>อำเภอเมืองนครราชสีมา จังหวัดนครราชสีมา 30000</div>
      <div>เบอร์โทร 081-760-2807</div>
    </div>
    <div class="receipt-divider"></div>
    <div>บิลเลขที่: ${bill.billNo}</div>
    <div>วันที่: ${formattedDate}</div>
    <div>ลูกค้า: ${bill.customerName}</div>
    <div class="receipt-divider"></div>
    <table class="receipt-table">
      <thead>
        <tr>
          <th>รายการ</th>
          <th class="num">จำนวน</th>
          <th class="num">รวม</th>
        </tr>
      </thead>
      <tbody>
        ${bill.items.map(i => `
          <tr>
            <td>${i.name}</td>
            <td class="num">${i.qty} x${i.unitPrice}</td>
            <td class="num">${i.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="receipt-divider"></div>
    <div style="display:flex; justify-content:space-between; font-weight:bold;">
      <span>รวมทั้งสิ้น:</span>
      <span>฿${bill.total.toFixed(2)}</span>
    </div>
    <div>ชำระโดย: ${bill.paymentMethod}</div>
    <div class="receipt-divider"></div>
    <div style="text-align:center; margin-top:10px;">ขอบคุณที่อุดหนุนครับ</div>
  `;

  window.print();
}

// --- Bill History ---
function renderHistory() {
  const container = document.getElementById('historyListContainer');
  const filterDate = document.getElementById('historyDateFilter').value;

  let filteredBills = bills;
  if (filterDate) {
    filteredBills = bills.filter(b => b.dateTime.startsWith(filterDate));
  }

  if (filteredBills.length === 0) {
    container.innerHTML = '<p style="color:#64748b;">ไม่พบประวัติบิลขาย</p>';
    return;
  }

  container.innerHTML = filteredBills.map(b => `
    <div style="border:1px solid #cbd5e1; border-radius:8px; padding:12px; margin-bottom:12px; background:${b.status === 'ยกเลิก' ? '#fef2f2' : '#fff'};">
      <div style="display:flex; justify-style:space-between; align-items:center; border-bottom:1px solid #f1f5f9; padding-bottom:6px; margin-bottom:8px;">
        <div>
          <strong>เลขที่: ${b.billNo}</strong> | ลูกค้า: ${b.customerName} | วันที่: ${new Date(b.dateTime).toLocaleString('th-TH')}
        </div>
        <div>
          <span style="font-weight:bold; color:${b.status === 'ชำระแล้ว' ? '#16a34a' : '#dc2626'};">${b.status} (${b.paymentMethod})</span>
          ${b.status !== 'ยกเลิก' ? `<button class="btn-danger" style="margin-left:10px; padding:4px 8px; font-size:0.8rem;" onclick="cancelBill('${b.billNo}')">ยกเลิกบิล</button>` : ''}
        </div>
      </div>
      <table style="width:100%; font-size:0.85rem;">
        ${b.items.map(i => `
          <tr>
            <td>- ${i.name} (${i.qty} x ฿${i.unitPrice})</td>
            <td style="text-align:right;">฿${i.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
      <div style="text-align:right; font-weight:bold; margin-top:6px; color:#0f172a;">
        ยอดสุทธิ: ฿${b.total.toFixed(2)}
      </div>
    </div>
  `).join('');
}

function cancelBill(billNo) {
  if (confirm(`คุณต้องการยกเลิกบิลเลขที่ ${billNo} ใช่หรือไม่?`)) {
    const bill = bills.find(b => b.billNo === billNo);
    if (bill) {
      bill.status = 'ยกเลิก';
      saveData();
      renderHistory();
    }
  }
}

// --- Purchases (เจ้าหนี้) ---
function openAddPurchaseModal() {
  document.getElementById('purchaseVendor').value = '';
  document.getElementById('purchaseItemName').value = '';
  document.getElementById('purchaseTotal').value = '';
  openModal('modalAddPurchase');
}

function savePurchase() {
  const vendor = document.getElementById('purchaseVendor').value.trim();
  const itemName = document.getElementById('purchaseItemName').value.trim();
  const total = parseFloat(document.getElementById('purchaseTotal').value);

  if (!vendor || !itemName || !total) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    return;
  }

  purchases.unshift({
    id: 'PUR-' + Date.now().toString().slice(-6),
    dateTime: new Date().toISOString(),
    vendor: vendor,
    itemName: itemName,
    total: total,
    status: 'ค้างชำระ' // เริ่มต้นคงสถานะค้างชำระก่อน
  });

  saveData();
  renderPurchases();
  closeModal('modalAddPurchase');
}

function togglePurchasePaid(id) {
  const pur = purchases.find(p => p.id === id);
  if (pur) {
    pur.status = pur.status === 'ค้างชำระ' ? 'ชำระแล้ว' : 'ค้างชำระ';
    saveData();
    renderPurchases();
  }
}

function renderPurchases() {
  const tbody = document.getElementById('purchasesTableBody');
  tbody.innerHTML = purchases.map(p => `
    <tr>
      <td>${new Date(p.dateTime).toLocaleDateString('th-TH')}</td>
      <td>${p.vendor}</td>
      <td>${p.itemName}</td>
      <td>฿${p.total.toFixed(2)}</td>
      <td>
        <span style="color: ${p.status === 'ชำระแล้ว' ? '#16a34a' : '#ea580c'}; font-weight:bold;">
          ${p.status}
        </span>
      </td>
      <td>
        <button class="${p.status === 'ค้างชำระ' ? 'btn-success' : 'btn-secondary'}" onclick="togglePurchasePaid('${p.id}')">
          ${p.status === 'ค้างชำระ' ? 'เปลี่ยนเป็นชำระแล้ว' : 'เปลี่ยนเป็นค้างชำระ'}
        </button>
      </td>
    </tr>
  `).join('');
}

// --- Employee & Payroll ---
function openAddEmployeeModal() {
  document.getElementById('empName').value = '';
  openModal('modalAddEmployee');
}

function saveEmployee() {
  const name = document.getElementById('empName').value.trim();
  const type = document.getElementById('empType').value;

  if (!name) return;

  employees.push({ id: Date.now(), name: name, type: type });
  saveData();
  renderEmployees();
  closeModal('modalAddEmployee');
}

function openEmpTxModal(empId, empName) {
  document.getElementById('empTxEmpId').value = empId;
  document.getElementById('empTxTitle').textContent = `บันทึกรายการ: ${empName}`;
  document.getElementById('empTxAmount').value = '';
  document.getElementById('empTxNote').value = '';
  openModal('modalEmpTx');
}

function saveEmpTx() {
  const empId = parseInt(document.getElementById('empTxEmpId').value);
  const type = document.getElementById('empTxType').value;
  const amount = parseFloat(document.getElementById('empTxAmount').value);
  const note = document.getElementById('empTxNote').value.trim();

  if (!amount || amount <= 0) {
    alert('กรุณากรอกจำนวนเงิน');
    return;
  }

  empTransactions.unshift({
    id: Date.now(),
    empId: empId,
    dateTime: new Date().toISOString(),
    type: type,
    amount: amount,
    note: note
  });

  saveData();
  renderEmployees();
  closeModal('modalEmpTx');
}

function viewEmpHistory(empId, empName) {
  document.getElementById('empHistoryTitle').textContent = `ประวัติทางการเงิน: ${empName}`;
  const tbody = document.getElementById('empHistoryTableBody');
  const txs = empTransactions.filter(t => t.empId === empId);

  tbody.innerHTML = txs.map(t => `
    <tr>
      <td>${new Date(t.dateTime).toLocaleDateString('th-TH')}</td>
      <td>${t.type}</td>
      <td style="color: ${t.type === 'จ่ายค่าจ้าง' ? '#dc2626' : '#0284c7'}; font-weight:bold;">฿${t.amount.toFixed(2)}</td>
      <td>${t.note || '-'}</td>
    </tr>
  `).join('');

  openModal('modalEmpHistory');
}

function renderEmployees() {
  const grid = document.getElementById('employeeGrid');
  grid.innerHTML = employees.map(e => {
    const txs = empTransactions.filter(t => t.empId === e.id);
    const paid = txs.filter(t => t.type === 'จ่ายค่าจ้าง').reduce((s, t) => s + t.amount, 0);
    const advance = txs.filter(t => t.type === 'เบิกล่วงหน้า').reduce((s, t) => s + t.amount, 0);
    const deposit = txs.filter(t => t.type === 'ฝากเงิน').reduce((s, t) => s + t.amount, 0);

    return `
      <div class="emp-card">
        <h4>${e.name} (${e.type})</h4>
        <p>จ่ายค่าจ้างรวม: <strong>฿${paid.toFixed(2)}</strong></p>
        <p>เบิกล่วงหน้าคงค้าง: <strong style="color:#dc2626;">฿${advance.toFixed(2)}</strong></p>
        <p>ยอดเงินฝาก: <strong style="color:#16a34a;">฿${deposit.toFixed(2)}</strong></p>
        <div class="emp-card-actions">
          <button class="btn-primary" onclick="openEmpTxModal(${e.id}, '${e.name}')">+ ทำรายการ</button>
          <button class="btn-secondary" onclick="viewEmpHistory(${e.id}, '${e.name}')">ดูประวัติ</button>
        </div>
      </div>
    `;
  }).join('');
}

// --- Expenses ---
function openAddExpenseModal() {
  document.getElementById('expTitle').value = '';
  document.getElementById('expAmount').value = '';
  openModal('modalAddExpense');
}

function saveExpense() {
  const title = document.getElementById('expTitle').value.trim();
  const amount = parseFloat(document.getElementById('expAmount').value);

  if (!title || !amount) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    return;
  }

  expenses.unshift({
    id: Date.now(),
    dateTime: new Date().toISOString(),
    title: title,
    amount: amount
  });

  saveData();
  renderExpenses();
  closeModal('modalAddExpense');
}

function renderExpenses() {
  const tbody = document.getElementById('expenseTableBody');
  tbody.innerHTML = expenses.map(x => `
    <tr>
      <td>${new Date(x.dateTime).toLocaleDateString('th-TH')}</td>
      <td>${x.title}</td>
      <td style="color:#dc2626; font-weight:bold;">฿${x.amount.toFixed(2)}</td>
    </tr>
  `).join('');
}

// --- Account Summary ---
function setSummaryFilter(type) {
  summaryFilterState = type;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderSummary();
}

function renderSummary() {
  const now = new Date();
  
  const filterFn = (dateTimeStr) => {
    const d = new Date(dateTimeStr);
    if (summaryFilterState === 'daily') {
      return d.toDateString() === now.toDateString();
    }
    if (summaryFilterState === 'weekly') {
      const diffTime = Math.abs(now - d);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (summaryFilterState === 'monthly') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (summaryFilterState === 'yearly') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // รวมยอดขายเฉพาะบิลที่ไม่ถูกยกเลิก
  const revenue = bills
    .filter(b => b.status !== 'ยกเลิก' && filterFn(b.dateTime))
    .reduce((s, b) => s + b.total, 0);

  // ยอดซื้อเข้า
  const purTotal = purchases
    .filter(p => filterFn(p.dateTime))
    .reduce((s, p) => s + p.total, 0);

  // รายจ่ายทั่วไป + รายจ่ายค่าจ้างพนักงาน
  const expTotal = expenses
    .filter(x => filterFn(x.dateTime))
    .reduce((s, x) => s + x.amount, 0);

  const payrollTotal = empTransactions
    .filter(t => t.type === 'จ่ายค่าจ้าง' && filterFn(t.dateTime))
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = expTotal + payrollTotal;
  const netProfit = revenue - purTotal - totalExpense;

  document.getElementById('summaryRevenue').textContent = `฿${revenue.toFixed(2)}`;
  document.getElementById('summaryPurchases').textContent = `฿${purTotal.toFixed(2)}`;
  document.getElementById('summaryExpenses').textContent = `฿${totalExpense.toFixed(2)}`;
  document.getElementById('summaryProfit').textContent = `฿${netProfit.toFixed(2)}`;
}

// พิมพ์สลิปสรุปบัญชี
function printSummaryReport() {
  const printArea = document.getElementById('printContainer');
  const revenue = document.getElementById('summaryRevenue').textContent;
  const purTotal = document.getElementById('summaryPurchases').textContent;
  const expTotal = document.getElementById('summaryExpenses').textContent;
  const netProfit = document.getElementById('summaryProfit').textContent;

  printArea.innerHTML = `
    <div class="receipt-header">
      <div class="receipt-title">สรุปบัญชี - ร้านปลาเม้า</div>
      <div>ช่วงเวลา: ${summaryFilterState.toUpperCase()}</div>
      <div>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</div>
    </div>
    <div class="receipt-divider"></div>
    <table class="receipt-table">
      <tr><td>ยอดขายรวม:</td><td class="num">${revenue}</td></tr>
      <tr><td>ยอดซื้อเข้ารวม:</td><td class="num">${purTotal}</td></tr>
      <tr><td>รายจ่ายรวม:</td><td class="num">${expTotal}</td></tr>
    </table>
    <div class="receipt-divider"></div>
    <div style="display:flex; justify-style:space-between; font-size:14px; font-weight:bold;">
      <span>กำไรสุทธิ:</span>
      <span>${netProfit}</span>
    </div>
    <div class="receipt-divider"></div>
  `;

  window.print();
}

// ลบประวัติทั้งหมด
function confirmResetAllData() {
  const pwd = prompt('คำเตือน! การลบประวัติจะลบข้อมูลบิล รายจ่าย และบันทึกทั้งหมด\nกรุณาพิมพ์ "DELETE" เพื่อยืนยัน:');
  if (pwd === 'DELETE') {
    bills = [];
    purchases = [];
    employees = [];
    empTransactions = [];
    expenses = [];
    saveData();
    location.reload();
  }
}

// Modal Helpers
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}
