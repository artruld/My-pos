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

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  event.currentTarget.classList.add('active');
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
  document.getElementById('input-param1').value = activeProduct.price;
  
  const p2 = document.getElementById('input-param2');
  if (activeProduct.type === 'unit') {
    document.getElementById('input-param1-label').innerText = 'ราคา/ชิ้น';
    document.getElementById('input-param2-label').innerText = 'จำนวน (ชิ้น)';
    p2.value = '1';
  } else {
    document.getElementById('input-param1-label').innerText = 'ราคา/กก.';
    document.getElementById('input-param2-label').innerText = 'น้ำหนัก (กก.)';
    p2.value = ''; // ว่างไว้ให้คีย์เอง
  }
  activeInputTarget = 'param2';
  p2.focus();
  calculateActiveTotal();
}

function setActiveInput(target) { activeInputTarget = target; }

function pressNumpad(val) {
  const input = document.getElementById(`input-${activeInputTarget}`);
  if (val === 'C') input.value = '';
  else input.value += val;
  calculateActiveTotal();
}

function calculateActiveTotal() {
  const p1 = parseFloat(document.getElementById('input-param1').value) || 0;
  const p2 = parseFloat(document.getElementById('input-param2').value) || 0;
  document.getElementById('input-total').value = (p1 * p2).toFixed(2);
}

function addItemToCart() {
  if (!activeProduct) return alert('เลือกสินค้าก่อนครับ');
  const qty = parseFloat(document.getElementById('input-param2').value);
  const price = parseFloat(document.getElementById('input-param1').value);
  const total = parseFloat(document.getElementById('input-total').value);

  if (!qty || qty <= 0) return alert('กรอกจำนวนหรือน้ำหนัก');

  currentCart.push({ name: activeProduct.name, type: activeProduct.type, price, qty, total });
  renderReceiptCart();
  document.getElementById('input-param2').value = '';
  document.getElementById('input-total').value = '';
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
  window.print();
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

function renderSalesHistory(filter = 'all') {
  const tbody = document.getElementById('history-table-body');
  let list = appState.sales;
  if (filter === 'unpaid') list = list.filter(s => s.status === 'unpaid');
  if (filter === 'paid') list = list.filter(s => s.status === 'paid');

  tbody.innerHTML = list.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${new Date(s.date).toLocaleString('th-TH')}</td>
      <td>${s.customer}</td>
      <td><strong>${s.total.toFixed(2)}</strong></td>
      <td>${s.paymentMethod}</td>
      <td><span class="${s.status === 'paid' ? 'text-success' : 'text-danger'}">${s.status === 'paid' ? 'ชำระแล้ว' : 'ค้างชำระ'}</span></td>
      <td>
        ${s.status === 'unpaid' ? `<button class="btn-sm btn-success" onclick="markSalePaid('${s.id}')">ชำระเงิน</button>` : ''}
        <button class="btn-sm btn-danger" onclick="cancelSale('${s.id}')">ยกเลิก</button>
      </td>
    </tr>
  `).join('');
}

function markSalePaid(id) {
  const sale = appState.sales.find(s => s.id === id);
  if (sale) {
    sale.status = 'paid';
    sale.paymentMethod = confirm('ชำระด้วยเงินสด?') ? 'เงินสด' : 'เงินโอน';
    saveData();
    renderSalesHistory();
  }
}

function cancelSale(id) {
  if (confirm('ยืนยันยกเลิกบิลนี้?')) {
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

  if (!itemName || price <= 0) return alert('กรอกข้อมูลให้ครบ');

  appState.purchases.unshift({ id: Date.now(), date: new Date().toISOString(), supplier: supName, itemName, qty, total: price, status: 'unpaid' });
  saveData();
  renderPurchaseHistory();
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
      <td>${p.status === 'unpaid' ? `<button class="btn-sm btn-success" onclick="markPurPaid(${p.id})">ชำระ</button>` : ''}</td>
    </tr>
  `).join('');
}

function markPurPaid(id) {
  const pur = appState.purchases.find(p => p.id === id);
  if (pur) { pur.status = 'paid'; saveData(); renderPurchaseHistory(); }
}

function switchExpenseSubTab(sub) {
  document.getElementById('subtab-general-view').style.display = sub === 'general' ? 'block' : 'none';
  document.getElementById('subtab-wages-view').style.display = sub === 'wages' ? 'block' : 'none';
}

function saveGeneralExpense() {
  const title = document.getElementById('exp-title').value;
  const amount = parseFloat(document.getElementById('exp-amount').value) || 0;
  if (!title || amount <= 0) return alert('กรอกข้อมูลให้ครบ');
  appState.expenses.unshift({ id: Date.now(), date: new Date().toISOString(), title, amount });
  saveData();
  renderGeneralExpenses();
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
  if (!empName || amount <= 0) return alert('กรอกข้อมูลให้ครบ');
  appState.wages.unshift({ id: Date.now(), date: new Date().toISOString(), empName, type, amount });
  saveData();
  renderEmployeeLedger();
}

function renderEmployeeLedger() {
  const tbody = document.getElementById('wage-table-body');
  const labels = { pay: '🟢 จ่ายค่าจ้าง', advance: '🔴 เบิกเงิน', deposit: '🔵 ฝากเงิน' };
  tbody.innerHTML = appState.wages.map(w => `
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

function setDashboardRange(type) {
  const startInput = document.getElementById('dash-start-date');
  const endInput = document.getElementById('dash-end-date');
  const now = new Date();
  startInput.value = now.toISOString().split('T')[0];
  endInput.value = now.toISOString().split('T')[0];
  calculateDashboard();
}

function calculateDashboard() {
  let salesTotal = 0, salesCash = 0, salesTransfer = 0;
  appState.sales.filter(s => s.status === 'paid').forEach(s => {
    salesTotal += s.total;
    if (s.paymentMethod === 'เงินสด') salesCash += s.total;
    else salesTransfer += s.total;
  });

  let purTotal = 0, purPaid = 0, purUnpaid = 0;
  appState.purchases.forEach(p => {
    purTotal += p.total;
    if (p.status === 'paid') purPaid += p.total;
    else purUnpaid += p.total;
  });

  let expTotal = appState.expenses.reduce((s, e) => s + e.amount, 0);
  let wageTotal = appState.wages.filter(w => w.type === 'pay').reduce((s, w) => s + w.amount, 0);

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

function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function openAddProductModal() { document.getElementById('modal-add-product').style.display = 'flex'; }
function openAddEmployeeModal() { document.getElementById('modal-add-emp').style.display = 'flex'; }
function openAddSupplierModal() { document.getElementById('modal-add-supplier').style.display = 'flex'; }
function openResetModal() { document.getElementById('modal-reset').style.display = 'flex'; }

function saveNewProduct() {
  const name = document.getElementById('new-prod-name').value;
  const type = document.getElementById('new-prod-type').value;
  const price = parseFloat(document.getElementById('new-prod-price').value) || 0;
  if (!name || price <= 0) return alert('กรอกข้อมูลให้ครบ');
  appState.products.push({ id: Date.now(), name, price, type });
  saveData();
  renderProductGrid();
  closeModal('modal-add-product');
}

function saveNewEmployee() {
  const name = document.getElementById('new-emp-name').value;
  if (!name) return alert('กรอกชื่อพนักงาน');
  appState.employees.push({ id: Date.now(), name });
  saveData();
  renderEmployeesDropdown();
  closeModal('modal-add-emp');
}

function saveNewSupplier() {
  const name = document.getElementById('new-sup-name').value;
  if (!name) return alert('กรอกชื่อผู้ขาย');
  appState.suppliers.push({ id: Date.now(), name });
  saveData();
  renderSuppliersDropdown();
  closeModal('modal-add-supplier');
}

function renderSuppliersDropdown() {
  const select = document.getElementById('pur-supplier-select');
  select.innerHTML = appState.suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  const prodSelect = document.getElementById('pur-product-select');
  prodSelect.innerHTML = appState.products.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
}

function renderEmployeesDropdown() {
  const select = document.getElementById('wage-emp-select');
  select.innerHTML = appState.employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

function executeReset() {
  if (document.getElementById('reset-confirm-input').value === 'RESET') {
    localStorage.clear();
    alert('ล้างข้อมูลเรียบร้อย');
    location.reload();
  } else {
    alert('พิมพ์ RESET ไม่ถูกต้อง');
  }
}
