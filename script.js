let appState = {
  products: JSON.parse(localStorage.getItem('pos_products')) || [
    { id: 1, name: 'หมูเนื้อแดง', price: 150, type: 'weight' },
    { id: 2, name: 'หมูสามชั้น', price: 180, type: 'weight' },
    { id: 3, name: 'เกลือ (ถุง)', price: 20, type: 'unit' }
  ],
  customers: JSON.parse(localStorage.getItem('pos_customers')) || [{ id: 'walkin', name: 'ลูกค้าหน้าร้าน' }],
  suppliers: JSON.parse(localStorage.getItem('pos_suppliers')) || [{ id: 1, name: 'ฟาร์มหมูนครราชสีมา' }],
  employees: JSON.parse(localStorage.getItem('pos_employees')) || [{ id: 1, name: 'สมชาย สายขยัน' }],
  sales: JSON.parse(localStorage.getItem('pos_sales')) || [],
  purchases: JSON.parse(localStorage.getItem('pos_purchases')) || [],
  expenses: JSON.parse(localStorage.getItem('pos_expenses')) || [],
  wages: JSON.parse(localStorage.getItem('pos_wages')) || []
};

let currentCart = [];
let activeProduct = null;
let activeInputTarget = 'param2';
let historyFilter = 'all';
let historyGroupMode = false;
let selectedUnpaidBillId = null;

document.addEventListener('DOMContentLoaded', () => {
  renderProductGrid();
  renderSuppliersDropdown();
  renderEmployeesDropdown();
  updateReceiptDate();
  renderSalesHistory();
  renderPurchaseHistory();
  renderGeneralExpenses();
  renderEmployeeLedger();
  setDashboardRange('daily');
});

function saveData() {
  localStorage.setItem('pos_products', JSON.stringify(appState.products));
  localStorage.setItem('pos_customers', JSON.stringify(appState.customers));
  localStorage.setItem('pos_suppliers', JSON.stringify(appState.suppliers));
  localStorage.setItem('pos_employees', JSON.stringify(appState.employees));
  localStorage.setItem('pos_sales', JSON.stringify(appState.sales));
  localStorage.setItem('pos_purchases', JSON.stringify(appState.purchases));
  localStorage.setItem('pos_expenses', JSON.stringify(appState.expenses));
  localStorage.setItem('pos_wages', JSON.stringify(appState.wages));
}

function switchTab(tabName, event) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  if (event) event.currentTarget.classList.add('active');
  if (tabName === 'dashboard') calculateDashboard();
}

function renderProductGrid() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = appState.products.map(p => `
    <div class="product-btn" onclick="selectProduct(${p.id})">
      <div style="font-weight:600">${p.name}</div>
      <div style="font-size:0.75rem; color:#64748b">${p.price} ฿/${p.type === 'weight' ? 'กก.' : 'ชิ้น'}</div>
    </div>
  `).join('');
}

function selectProduct(id) {
  activeProduct = appState.products.find(p => p.id === id);
  document.getElementById('active-item-title').innerText = `รายการ: ${activeProduct.name}`;
  
  const p1 = document.getElementById('input-param1');
  const p2 = document.getElementById('input-param2');

  p1.value = activeProduct.price;

  if (activeProduct.type === 'unit') {
    document.getElementById('input-param1-label').innerText = 'ราคา/ชิ้น';
    document.getElementById('input-param2-label').innerText = 'จำนวน (ชิ้น)';
    p2.value = '1';
    activeInputTarget = 'param2';
    p2.focus();
  } else {
    document.getElementById('input-param1-label').innerText = 'ราคา/กก.';
    document.getElementById('input-param2-label').innerText = 'น้ำหนัก (กก.)';
    p2.value = ''; // ว่างเปล่าเริ่มต้นให้คีย์เอง
    activeInputTarget = 'param2';
    p2.focus();
  }
  calculateActiveTotal();
}

function setActiveInput(target) { activeInputTarget = target; }

function pressNumpad(val) {
  const input = document.getElementById(`input-${activeInputTarget}`);
  if (!input) return;
  if (val === 'C') input.value = '';
  else input.value += val;
  calculateActiveTotal();
}

function calculateActiveTotal() {
  const p1 = parseFloat(document.getElementById('input-param1').value) || 0;
  const p2 = parseFloat(document.getElementById('input-param2').value) || 0;
  const total = p1 * p2;
  document.getElementById('input-total').value = total > 0 ? total.toFixed(2) : '';
}

function addItemToCart() {
  if (!activeProduct) return alert('กรุณาเลือกรายการสินค้าก่อนครับ');
  const qty = parseFloat(document.getElementById('input-param2').value);
  const price = parseFloat(document.getElementById('input-param1').value);
  const total = parseFloat(document.getElementById('input-total').value);

  if (!qty || qty <= 0) return alert('กรุณากรอกจำนวนหรือน้ำหนัก');

  currentCart.push({ name: activeProduct.name, type: activeProduct.type, price, qty, total });
  renderReceiptCart();

  // รีเซ็ตช่องป้อนข้อมูลเป็นว่างเปล่า
  document.getElementById('input-param1').value = '';
  document.getElementById('input-param2').value = '';
  document.getElementById('input-total').value = '';
  document.getElementById('active-item-title').innerText = 'กรุณาเลือกรายการสินค้า';
  activeProduct = null;
}

function renderReceiptCart() {
  const container = document.getElementById('rec-items-list');
  let grandTotal = 0;
  container.innerHTML = currentCart.map((item, idx) => {
    grandTotal += item.total;
    return `
      <div class="r-item">
        <span>${item.name} (${item.qty} ${item.type === 'weight' ? 'กก.' : 'ชิ้น'})</span>
        <span>${item.total.toFixed(2)} <button class="btn-sm text-danger" onclick="removeItemFromCart(${idx})">x</button></span>
      </div>
    `;
  }).join('');
  document.getElementById('rec-grand-total').innerText = `${grandTotal.toFixed(2)} บาท`;
}

function removeItemFromCart(idx) {
  currentCart.splice(idx, 1);
  renderReceiptCart();
}

function clearCart() {
  currentCart = [];
  renderReceiptCart();
}

function updateReceiptDate() {
  document.getElementById('rec-date').innerText = new Date().toLocaleString('th-TH');
}

function handleCustomerSelect() {
  const name = document.getElementById('sales-cust-name').value;
  document.getElementById('rec-cust-name').innerText = name || 'ลูกค้าหน้าร้าน';
}

function updateReceiptCustomerName() {
  const name = document.getElementById('sales-cust-name').value;
  document.getElementById('rec-cust-name').innerText = name || 'ลูกค้าหน้าร้าน';
}

function openPaymentModal() {
  if (currentCart.length === 0) return alert('ไม่มีรายการในสลิป');
  const grandTotal = currentCart.reduce((s, i) => s + i.total, 0);
  document.getElementById('modal-pay-amount').innerText = grandTotal.toFixed(2);
  document.getElementById('modal-payment').style.display = 'flex';
}

function confirmPayment(method) {
  const grandTotal = currentCart.reduce((s, i) => s + i.total, 0);
  appState.sales.unshift({
    id: 'POS-' + Date.now().toString().slice(-6),
    date: new Date().toISOString(),
    customer: document.getElementById('sales-cust-name').value || 'ลูกค้าหน้าร้าน',
    items: [...currentCart],
    total: grandTotal,
    paymentMethod: method === 'cash' ? 'เงินสด' : 'เงินโอน',
    status: 'paid'
  });
  saveData();
  closeModal('modal-payment');
  if (method === 'cash') alert('สั่งเปิดลิ้นชักเก็บเงินเรียบร้อย');
  printReceipt();
  clearCart();
  renderSalesHistory();
}

function saveCartAsUnpaid() {
  if (currentCart.length === 0) return alert('ไม่มีรายการในสลิป');
  const grandTotal = currentCart.reduce((s, i) => s + i.total, 0);
  appState.sales.unshift({
    id: 'POS-' + Date.now().toString().slice(-6),
    date: new Date().toISOString(),
    customer: document.getElementById('sales-cust-name').value || 'ลูกค้าหน้าร้าน',
    items: [...currentCart],
    total: grandTotal,
    paymentMethod: 'ค้างชำระ',
    status: 'unpaid'
  });
  saveData();
  alert('บันทึกพักบิลค้างชำระเรียบร้อย');
  clearCart();
  renderSalesHistory();
}

function printReceipt() {
  const target = document.getElementById('receipt-preview');
  target.classList.add('print-target');
  window.print();
  target.classList.remove('print-target');
}

function setHistoryFilter(filter, event) {
  historyFilter = filter;
  if (event) {
    const parent = event.currentTarget.parentElement;
    parent.querySelectorAll('.btn-sm').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
  }
  renderSalesHistory();
}

function toggleHistoryGrouping(event) {
  historyGroupMode = !historyGroupMode;
  renderSalesHistory();
}

function renderSalesHistory() {
  const container = document.getElementById('history-container');
  let list = appState.sales;
  if (historyFilter === 'unpaid') list = list.filter(s => s.status === 'unpaid');
  if (historyFilter === 'paid') list = list.filter(s => s.status === 'paid');

  if (historyGroupMode) {
    // จัดกลุ่มตามวัน
    const grouped = {};
    list.forEach(s => {
      const day = new Date(s.date).toLocaleDateString('th-TH');
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(s);
    });

    container.innerHTML = Object.keys(grouped).map(day => {
      const daySales = grouped[day];
      const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0);
      return `
        <div class="daily-group-card">
          <div class="daily-group-header">
            <span>📅 วันที่: ${day} (${daySales.length} บิล)</span>
            <span>ยอดรวมทั้งสิ้น: <strong>${dayTotal.toFixed(2)} บาท</strong></span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>เลขที่บิล</th>
                <th>เวลา</th>
                <th>ลูกค้า</th>
                <th>ยอดรวม</th>
                <th>ประเภท</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${daySales.map(s => renderSaleRow(s)).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  } else {
    // แสดงแบบตารางธรรมดา
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>เลขที่บิล</th>
            <th>วันที่/เวลา</th>
            <th>ชื่อลูกค้า</th>
            <th>ยอดรวม</th>
            <th>ประเภทชำระ</th>
            <th>สถานะ</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody id="history-table-body">
          ${list.map(s => renderSaleRow(s)).join('')}
        </tbody>
      </table>
    `;
  }
}

function renderSaleRow(s) {
  return `
    <tr>
      <td>${s.id}</td>
      <td>${new Date(s.date).toLocaleString('th-TH')}</td>
      <td>${s.customer}</td>
      <td><strong>${s.total.toFixed(2)}</strong></td>
      <td>${s.paymentMethod}</td>
      <td><span class="${s.status === 'paid' ? 'text-success' : 'text-danger'}">${s.status === 'paid' ? 'ชำระแล้ว' : 'ค้างชำระ'}</span></td>
      <td>
        ${s.status === 'unpaid' ? `<button class="btn-sm btn-success" onclick="openBillPaymentModal('${s.id}')">ชำระเงิน</button>` : ''}
        <button class="btn-sm btn-danger" onclick="cancelSale('${s.id}')">ยกเลิก</button>
      </td>
    </tr>
  `;
}

function openBillPaymentModal(id) {
  const sale = appState.sales.find(s => s.id === id);
  if (!sale) return;
  selectedUnpaidBillId = id;
  document.getElementById('modal-pay-bill-id').innerText = sale.id;
  document.getElementById('modal-pay-bill-amount').innerText = sale.total.toFixed(2);
  document.getElementById('modal-pay-bill').style.display = 'flex';
}

function confirmBillPayment(method) {
  const sale = appState.sales.find(s => s.id === selectedUnpaidBillId);
  if (sale) {
    sale.status = 'paid';
    sale.paymentMethod = method;
    saveData();
    closeModal('modal-pay-bill');
    if (method === 'เงินสด') alert('สั่งเปิดลิ้นชักเก็บเงินเรียบร้อย');
    renderSalesHistory();
  }
}

function cancelSale(id) {
  if (confirm('คุณต้องการยกเลิกบิลนี้ใช่หรือไม่?')) {
    appState.sales = appState.sales.filter(s => s.id !== id);
    saveData();
    renderSalesHistory();
  }
}

function togglePurchaseItemMode() {
  const mode = document.getElementById('pur-item-type').value;
  document.getElementById('pur-existing-group').style.display = mode === 'existing' ? 'block' : 'none';
  document.getElementById('pur-custom-group').style.display = mode === 'custom' ? 'block' : 'none';
}

function savePurchaseRecord() {
  const supSelect = document.getElementById('pur-supplier-select');
  const supName = supSelect.options[supSelect.selectedIndex]?.text || 'ไม่ระบุ';
  const mode = document.getElementById('pur-item-type').value;
  let itemName = mode === 'existing' ? document.getElementById('pur-product-select').value : document.getElementById('pur-custom-name').value;
  const qty = parseFloat(document.getElementById('pur-qty').value) || 0;
  const price = parseFloat(document.getElementById('pur-price').value) || 0;

  if (!itemName || price <= 0) return alert('กรอกข้อมูลให้ครบถ้วน');

  appState.purchases.unshift({ id: Date.now(), date: new Date().toISOString(), supplier: supName, itemName, qty, total: price, status: 'unpaid' });
  saveData();
  renderPurchaseHistory();

  document.getElementById('pur-qty').value = '';
  document.getElementById('pur-price').value = '';
}

function renderPurchaseHistory() {
  const tbody = document.getElementById('purchase-table-body');
  tbody.innerHTML = appState.purchases.map(p => `
    <tr>
      <td>${new Date(p.date).toLocaleDateString('th-TH')}</td>
      <td>${p.supplier}</td>
      <td>${p.itemName} (${p.qty})</td>
      <td>${p.total.toFixed(2)}</td>
      <td><span class="${p.status === 'paid' ? 'text-success' : 'text-danger'}">${p.status === 'paid' ? 'ชำระแล้ว' : 'ค้างชำระ'}</span></td>
      <td>${p.status === 'unpaid' ? `<button class="btn-sm btn-success" onclick="markPurPaid(${p.id})">ชำระแล้ว</button>` : ''}</td>
    </tr>
  `).join('');
}

function markPurPaid(id) {
  const pur = appState.purchases.find(p => p.id === id);
  if (pur) {
    pur.status = 'paid';
    saveData();
    renderPurchaseHistory();
  }
}

function switchExpenseSubTab(sub) {
  document.getElementById('subtab-general-view').style.display = sub === 'general' ? 'block' : 'none';
  document.getElementById('subtab-wages-view').style.display = sub === 'wages' ? 'block' : 'none';
  document.getElementById('subnav-general').className = sub === 'general' ? 'btn-sm btn-primary active' : 'btn-sm btn-outline';
  document.getElementById('subnav-wages').className = sub === 'wages' ? 'btn-sm btn-primary active' : 'btn-sm btn-outline';
}

function saveGeneralExpense() {
  const title = document.getElementById('exp-title').value;
  const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
  if (!title || amount <= 0) return alert('กรอกข้อมูลให้ครบถ้วน');
  appState.expenses.unshift({ id: Date.now(), date: new Date().toISOString(), title, amount });
  saveData();
  renderGeneralExpenses();

  document.getElementById('exp-title').value = '';
  document.getElementById('exp-amount').value = '';
}

function renderGeneralExpenses() {
  const tbody = document.getElementById('expense-table-body');
  tbody.innerHTML = appState.expenses.map(e => `
    <tr>
      <td>${new Date(e.date).toLocaleDateString('th-TH')}</td>
      <td>${e.title}</td>
      <td>${e.amount.toFixed(2)}</td>
      <td><button class="btn-sm btn-danger" onclick="deleteExpense(${e.id})">ลบ</button></td>
    </tr>
  `).join('');
}

function deleteExpense(id) {
  appState.expenses = appState.expenses.filter(e => e.id !== id);
  saveData();
  renderGeneralExpenses();
}

function saveWageTransaction() {
  const empSelect = document.getElementById('wage-emp-select');
  const empName = empSelect.options[empSelect.selectedIndex]?.text;
  const type = document.getElementById('wage-type').value;
  const amount = parseFloat(document.getElementById('wage-amount').value) || 0;
  if (!empName || amount <= 0) return alert('กรอกข้อมูลให้ครบถ้วน');
  appState.wages.unshift({ id: Date.now(), date: new Date().toISOString(), empName, type, amount });
  saveData();
  renderEmployeeLedger();

  document.getElementById('wage-amount').value = '';
}

function renderEmployeeLedger() {
  const tbody = document.getElementById('wage-table-body');
  const filterEmp = document.getElementById('wage-filter-emp').value;
  const labels = { pay: '🟢 จ่ายค่าจ้าง', advance: '🔴 เบิกเงินล่วงหน้า', deposit: '🔵 ฝากเงิน' };

  let list = appState.wages;
  if (filterEmp !== 'all') {
    list = list.filter(w => w.empName === filterEmp);
  }

  tbody.innerHTML = list.map(w => `
    <tr>
      <td>${new Date(w.date).toLocaleDateString('th-TH')}</td>
      <td>${w.empName}</td>
      <td>${labels[w.type]}</td>
      <td>${w.amount.toFixed(2)}</td>
      <td><button class="btn-sm btn-danger" onclick="deleteWage(${w.id})">ลบ</button></td>
    </tr>
  `).join('');
}

function deleteWage(id) {
  appState.wages = appState.wages.filter(w => w.id !== id);
  saveData();
  renderEmployeeLedger();
}

function setDashboardRange(type, event) {
  if (event) {
    const parent = event.currentTarget.parentElement;
    parent.querySelectorAll('.btn-sm').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
  }

  const startInput = document.getElementById('dash-start-date');
  const endInput = document.getElementById('dash-end-date');
  const now = new Date();
  
  let start = new Date(now);
  if (type === 'daily') {
    start = new Date(now);
  } else if (type === 'weekly') {
    start.setDate(now.getDate() - 7);
  } else if (type === 'monthly') {
    start.setMonth(now.getMonth() - 1);
  } else if (type === 'yearly') {
    start.setFullYear(now.getFullYear() - 1);
  }

  startInput.value = start.toISOString().split('T')[0];
  endInput.value = now.toISOString().split('T')[0];
  calculateDashboard();
}

function calculateDashboard() {
  const startVal = document.getElementById('dash-start-date').value;
  const endVal = document.getElementById('dash-end-date').value;

  const startDate = startVal ? new Date(startVal + 'T00:00:00') : new Date(0);
  const endDate = endVal ? new Date(endVal + 'T23:59:59') : new Date();

  let salesTotal = 0, salesCash = 0, salesTransfer = 0;
  appState.sales.filter(s => s.status === 'paid').forEach(s => {
    const d = new Date(s.date);
    if (d >= startDate && d <= endDate) {
      salesTotal += s.total;
      if (s.paymentMethod === 'เงินสด') salesCash += s.total;
      else salesTransfer += s.total;
    }
  });

  let purTotal = 0, purPaid = 0, purUnpaid = 0;
  appState.purchases.forEach(p => {
    const d = new Date(p.date);
    if (d >= startDate && d <= endDate) {
      purTotal += p.total;
      if (p.status === 'paid') purPaid += p.total;
      else purUnpaid += p.total;
    }
  });

  let expTotal = 0;
  appState.expenses.forEach(e => {
    const d = new Date(e.date);
    if (d >= startDate && d <= endDate) expTotal += e.amount;
  });

  let wageTotal = 0;
  appState.wages.filter(w => w.type === 'pay').forEach(w => {
    const d = new Date(w.date);
    if (d >= startDate && d <= endDate) wageTotal += w.amount;
  });

  document.getElementById('sum-sales').innerText = `${salesTotal.toFixed(2)} ฿`;
  document.getElementById('sum-sales-cash').innerText = `${salesCash.toFixed(2)} ฿`;
  document.getElementById('sum-sales-transfer').innerText = `${salesTransfer.toFixed(2)} ฿`;
  document.getElementById('sum-purchases').innerText = `${purTotal.toFixed(2)} ฿`;
  document.getElementById('sum-pur-paid').innerText = `${purPaid.toFixed(2)} ฿`;
  document.getElementById('sum-pur-unpaid').innerText = `${purUnpaid.toFixed(2)} ฿`;
  document.getElementById('sum-expenses').innerText = `${expTotal.toFixed(2)} ฿`;
  document.getElementById('sum-wages').innerText = `${wageTotal.toFixed(2)} ฿`;

  const profit = salesTotal - (purTotal + expTotal + wageTotal);
  document.getElementById('sum-net-profit').innerText = `${profit.toFixed(2)} บาท`;
}

function printSummaryReceipt() {
  const startVal = document.getElementById('dash-start-date').value;
  const endVal = document.getElementById('dash-end-date').value;

  document.getElementById('sum-print-range').innerText = `${startVal} ถึง ${endVal}`;
  document.getElementById('sum-p-sales').innerText = document.getElementById('sum-sales').innerText;
  document.getElementById('sum-p-cash').innerText = document.getElementById('sum-sales-cash').innerText;
  document.getElementById('sum-p-transfer').innerText = document.getElementById('sum-sales-transfer').innerText;
  document.getElementById('sum-p-purchases').innerText = document.getElementById('sum-purchases').innerText;
  document.getElementById('sum-p-expenses').innerText = document.getElementById('sum-expenses').innerText;
  document.getElementById('sum-p-wages').innerText = document.getElementById('sum-wages').innerText;
  document.getElementById('sum-p-profit').innerText = document.getElementById('sum-net-profit').innerText;
  document.getElementById('sum-print-time').innerText = new Date().toLocaleString('th-TH');

  const template = document.getElementById('summary-print-template');
  template.classList.add('print-target');
  window.print();
  template.classList.remove('print-target');
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openAddProductModal() { document.getElementById('modal-add-product').style.display = 'flex'; }
function openAddEmployeeModal() { document.getElementById('modal-add-emp').style.display = 'flex'; }
function openAddSupplierModal() { document.getElementById('modal-add-supplier').style.display = 'flex'; }
function openResetModal() { document.getElementById('modal-reset').style.display = 'flex'; }

function saveNewProduct() {
  const name = document.getElementById('new-prod-name').value;
  const type = document.getElementById('new-prod-type').value;
  const price = parseFloat(document.getElementById('new-prod-price').value) || 0;
  if (!name || price <= 0) return alert('กรอกข้อมูลให้ครบถ้วน');
  appState.products.push({ id: Date.now(), name, price, type });
  saveData();
  renderProductGrid();
  renderSuppliersDropdown();
  closeModal('modal-add-product');
  document.getElementById('new-prod-name').value = '';
  document.getElementById('new-prod-price').value = '';
}

function saveNewEmployee() {
  const name = document.getElementById('new-emp-name').value;
  if (!name) return alert('กรอกชื่อพนักงาน');
  appState.employees.push({ id: Date.now(), name });
  saveData();
  renderEmployeesDropdown();
  closeModal('modal-add-emp');
  document.getElementById('new-emp-name').value = '';
}

function saveNewSupplier() {
  const name = document.getElementById('new-sup-name').value;
  if (!name) return alert('กรอกชื่อผู้ขาย');
  appState.suppliers.push({ id: Date.now(), name });
  saveData();
  renderSuppliersDropdown();
  closeModal('modal-add-supplier');
  document.getElementById('new-sup-name').value = '';
}

function renderSuppliersDropdown() {
  const select = document.getElementById('pur-supplier-select');
  select.innerHTML = appState.suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  const prodSelect = document.getElementById('pur-product-select');
  prodSelect.innerHTML = appState.products.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
}

function renderEmployeesDropdown() {
  const select = document.getElementById('wage-emp-select');
  const filterSelect = document.getElementById('wage-filter-emp');
  select.innerHTML = appState.employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  filterSelect.innerHTML = `<option value="all">พนักงานทุกคน</option>` + appState.employees.map(e => `<option value="${e.name}">${e.name}</option>`).join('');
}

function executeReset() {
  if (document.getElementById('reset-confirm-input').value === 'RESET') {
    localStorage.clear();
    alert('ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว');
    location.reload();
  } else {
    alert('พิมพ์ RESET ไม่ถูกต้อง');
  }
}
