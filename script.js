/* =========================================================
   STORE POS V2
   ระบบ POS แบบ LocalStorage
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const STORAGE = {

  customers: "storePos_v2_customers",

  products: "storePos_v2_products",

  parked: "storePos_v2_parked",

  history: "storePos_v2_history",

  invoice: "storePos_v2_invoice"

};


/* =========================================================
   DEFAULT DATA
========================================================= */

const DEFAULT_CUSTOMERS = [
  "ร้านเจ๊พร",
  "คุณสมชาย",
  "ร้านก๋วยเตี๋ยวป้าป้อม"
];


const DEFAULT_PRODUCTS = [

  {
    id: 1,
    name: "หมูเนื้อแดง",
    price: 150
  },

  {
    id: 2,
    name: "สามชั้น",
    price: 180
  },

  {
    id: 3,
    name: "สันนอก",
    price: 160
  },

  {
    id: 4,
    name: "ซี่โครงหมู",
    price: 170
  },

  {
    id: 5,
    name: "หมูบด",
    price: 140
  }

];


/* =========================================================
   STATE
========================================================= */

let customers =
  load(STORAGE.customers, DEFAULT_CUSTOMERS);

let products =
  load(STORAGE.products, DEFAULT_PRODUCTS);

let parkedBills =
  load(STORAGE.parked, []);

let billHistory =
  load(STORAGE.history, []);


let cart = [];

let purchaseItems = [];

let currentCustomer =
  "ลูกค้าหน้าร้าน (ทั่วไป)";

let currentBillNo = null;

let selectedProduct = null;

let activeNumpadField = "weight";

let currentViewingBill = null;


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    lucide.createIcons();

    updateCustomerFilter();

    updateParkedBadge();

    navTo("screen-home");

  }
);


/* =========================================================
   STORAGE
========================================================= */

function load(key, fallback) {

  try {

    const data =
      localStorage.getItem(key);

    return data
      ? JSON.parse(data)
      : fallback;

  } catch (error) {

    console.error(error);

    return fallback;

  }

}


function save(key, data) {

  localStorage.setItem(
    key,
    JSON.stringify(data)
  );

}


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHtml(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


/* =========================================================
   INVOICE NUMBER
========================================================= */

function generateInvoiceNo(prefix = "INV") {

  let sequence =
    Number(
      localStorage.getItem(
        STORAGE.invoice
      ) || 0
    );

  sequence++;

  localStorage.setItem(
    STORAGE.invoice,
    sequence
  );


  const now = new Date();


  const date =
    now.getFullYear() +

    String(
      now.getMonth() + 1
    ).padStart(2, "0") +

    String(
      now.getDate()
    ).padStart(2, "0");


  return `${prefix}-${date}-${String(sequence).padStart(4, "0")}`;

}


/* =========================================================
   NAVIGATION
========================================================= */

function navTo(screenId) {

  document
    .querySelectorAll("main > section")
    .forEach(section => {

      section.classList.add("hidden");

    });


  const screen =
    document.getElementById(screenId);

  if (!screen) return;


  screen.classList.remove("hidden");


  const homeButton =
    document.getElementById("btn-home");


  homeButton.classList.toggle(
    "hidden",
    screenId === "screen-home"
  );


  if (
    screenId ===
    "screen-regular-customers"
  ) {

    renderCustomers();

  }


  if (
    screenId === "screen-pos"
  ) {

    if (!currentBillNo) {

      currentBillNo =
        generateInvoiceNo();

    }

    renderPOS();

  }


  if (
    screenId ===
    "screen-bill-history"
  ) {

    updateCustomerFilter();

    renderBillHistory();

  }


  lucide.createIcons();

}


/* =========================================================
   CUSTOMER
========================================================= */

function renderCustomers() {

  const grid =
    document.getElementById(
      "regular-customer-grid"
    );


  if (!customers.length) {

    grid.innerHTML = `
      <div>
        ยังไม่มีลูกค้าประจำ
      </div>
    `;

    return;

  }


  grid.innerHTML =
    customers.map(
      (name, index) => `

      <div class="customer-item">

        <strong>
          ${escapeHtml(name)}
        </strong>

        <div class="customer-item-actions">

          <button
            style="background:#4f46e5;color:white"
            onclick="selectCustomerByIndex(${index})"
          >
            เลือก
          </button>

          <button
            style="background:#fee2e2;color:#dc2626"
            onclick="deleteCustomer(${index})"
          >
            ลบ
          </button>

        </div>

      </div>

    `
    ).join("");

}


function selectCustomerByIndex(index) {

  selectCustomer(
    customers[index]
  );

}


function selectCustomer(name) {

  currentCustomer = name;

  currentBillNo =
    currentBillNo ||
    generateInvoiceNo();


  navTo("screen-pos");

}


function showAddCustomerModal() {

  document
    .getElementById(
      "modal-add-customer"
    )
    .classList.remove("hidden");


  setTimeout(
    () =>
      document
        .getElementById(
          "new-customer-name"
        )
        .focus(),
    100
  );

}


function saveNewCustomer() {

  const input =
    document.getElementById(
      "new-customer-name"
    );


  const name =
    input.value.trim();


  if (!name) {

    alert(
      "กรุณากรอกชื่อลูกค้า"
    );

    return;

  }


  if (customers.includes(name)) {

    alert(
      "มีชื่อลูกค้านี้แล้ว"
    );

    return;

  }


  customers.push(name);

  save(
    STORAGE.customers,
    customers
  );


  input.value = "";

  closeModal(
    "modal-add-customer"
  );


  renderCustomers();

  updateCustomerFilter();

  showToast(
    "เพิ่มลูกค้าเรียบร้อย"
  );

}


function deleteCustomer(index) {

  if (
    !confirm(
      "ต้องการลบลูกค้ารายนี้หรือไม่?"
    )
  ) {

    return;

  }


  customers.splice(
    index,
    1
  );


  save(
    STORAGE.customers,
    customers
  );


  renderCustomers();

  updateCustomerFilter();

  showToast(
    "ลบลูกค้าเรียบร้อย"
  );

}


/* =========================================================
   PRODUCTS
========================================================= */

function renderProducts() {

  const grid =
    document.getElementById(
      "product-buttons-grid"
    );


  if (!products.length) {

    grid.innerHTML = `
      <div>
        ยังไม่มีสินค้า
      </div>
    `;

    return;

  }


  grid.innerHTML =
    products.map(
      (product, index) => `

      <div class="product-card">

        <button
          class="product-delete"
          onclick="deleteProduct(${index})"
        >
          ×
        </button>


        <button
          style="
            width:100%;
            height:100%;
            text-align:left;
            background:none;
          "
          onclick="openNumpad(${product.id})"
        >

          <i data-lucide="package"></i>

          <strong>
            ${escapeHtml(product.name)}
          </strong>

          <small>
            ฿${Number(product.price).toFixed(2)} / kg
          </small>

        </button>

      </div>

    `
    ).join("");


  lucide.createIcons();

}


function showAddProductModal() {

  document
    .getElementById(
      "modal-add-product"
    )
    .classList.remove("hidden");


  setTimeout(
    () =>
      document
        .getElementById(
          "new-product-name"
        )
        .focus(),
    100
  );

}


function saveNewProduct() {

  const name =
    document
      .getElementById(
        "new-product-name"
      )
      .value
      .trim();


  const price =
    Number(
      document
        .getElementById(
          "new-product-default-price"
        )
        .value
    );


  if (!name) {

    alert(
      "กรุณากรอกชื่อสินค้า"
    );

    return;

  }


  if (
    !Number.isFinite(price) ||
    price < 0
  ) {

    alert(
      "กรุณากรอกราคาให้ถูกต้อง"
    );

    return;

  }


  products.push({

    id: Date.now(),

    name,

    price

  });


  save(
    STORAGE.products,
    products
  );


  document.getElementById(
    "new-product-name"
  ).value = "";


  document.getElementById(
    "new-product-default-price"
  ).value = "";


  closeModal(
    "modal-add-product"
  );


  renderProducts();


  showToast(
    "สร้างสินค้าเรียบร้อย"
  );

}


function deleteProduct(index) {

  if (
    !confirm(
      "ต้องการลบสินค้านี้หรือไม่?"
    )
  ) return;


  products.splice(
    index,
    1
  );


  save(
    STORAGE.products,
    products
  );


  renderProducts();


  showToast(
    "ลบสินค้าเรียบร้อย"
  );

}


/* =========================================================
   POS
========================================================= */

function renderPOS() {

  document.getElementById(
    "pos-customer-name"
  ).textContent =
    currentCustomer;


  document.getElementById(
    "receipt-customer"
  ).textContent =
    currentCustomer;


  document.getElementById(
    "receipt-no"
  ).textContent =
    currentBillNo;


  document.getElementById(
    "receipt-time"
  ).textContent =
    new Date().toLocaleTimeString(
      "th-TH",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );


  renderProducts();

  renderCart();

  updateParkedBadge();

}


/* =========================================================
   NUMPAD
========================================================= */

function openNumpad(productId) {

  selectedProduct =
    products.find(
      product =>
        product.id === productId
    );


  if (!selectedProduct) return;


  document.getElementById(
    "numpad-product-title"
  ).textContent =
    selectedProduct.name;


  document.getElementById(
    "input-numpad-weight"
  ).textContent = "1";


  document.getElementById(
    "input-numpad-price"
  ).textContent =
    Number(
      selectedProduct.price
    ).toString();


  setActiveNumpadField(
    "weight"
  );


  calculateNumpadTotal();


  document
    .getElementById(
      "modal-numpad"
    )
    .classList.remove("hidden");

}


function setActiveNumpadField(field) {

  activeNumpadField = field;


  document
    .getElementById(
      "field-weight-container"
    )
    .classList.toggle(
      "active",
      field === "weight"
    );


  document
    .getElementById(
      "field-price-container"
    )
    .classList.toggle(
      "active",
      field === "price"
    );

}


function getNumpadValue(field) {

  return Number(
    document
      .getElementById(
        field === "weight"
          ? "input-numpad-weight"
          : "input-numpad-price"
      )
      .textContent
  ) || 0;

}


function setNumpadValue(
  field,
  value
) {

  document
    .getElementById(
      field === "weight"
        ? "input-numpad-weight"
        : "input-numpad-price"
    )
    .textContent =
    value;

}


function pressNumpad(value) {

  let current =
    document
      .getElementById(
        activeNumpadField === "weight"
          ? "input-numpad-weight"
          : "input-numpad-price"
      )
      .textContent;


  if (value === "CLEAR") {

    current = "0";

  }

  else if (value === "DEL") {

    current =
      current.length > 1
        ? current.slice(0, -1)
        : "0";

  }

  else if (value === ".") {

    if (!current.includes(".")) {

      current += ".";

    }

  }

  else {

    if (
      current === "0"
    ) {

      current = value;

    } else {

      current += value;

    }

  }


  setNumpadValue(
    activeNumpadField,
    current
  );


  calculateNumpadTotal();

}


function calculateNumpadTotal() {

  const weight =
    getNumpadValue("weight");


  const price =
    getNumpadValue("price");


  const total =
    weight * price;


  document.getElementById(
    "numpad-calculated-total"
  ).textContent =
    total.toFixed(2);

}


function confirmNumpadAdd() {

  if (!selectedProduct) return;


  const weight =
    getNumpadValue("weight");


  const price =
    getNumpadValue("price");


  if (
    weight <= 0 ||
    price < 0
  ) {

    alert(
      "กรุณากรอกข้อมูลให้ถูกต้อง"
    );

    return;

  }


  cart.push({

    id: Date.now(),

    productId:
      selectedProduct.id,

    name:
      selectedProduct.name,

    weight,

    pricePerKg:
      price,

    total:
      weight * price

  });


  closeModal(
    "modal-numpad"
  );


  renderCart();


  showToast(
    "เพิ่มสินค้าลงบิลแล้ว"
  );

}


/* =========================================================
   CART
========================================================= */

function renderCart() {

  const container =
    document.getElementById(
      "receipt-items-list"
    );


  if (!cart.length) {

    container.innerHTML = `
      <div
        style="
          text-align:center;
          color:#999;
          padding:35px 0;
        "
      >
        ยังไม่มีสินค้า
      </div>
    `;

  }

  else {

    container.innerHTML =
      cart.map(
        (item, index) => `

        <div class="receipt-item">

          <div class="receipt-item-name">

            <strong>
              ${escapeHtml(item.name)}
            </strong>

            <div style="font-size:10px">
              ${item.weight.toFixed(3)}
              kg ×
              ฿${item.pricePerKg.toFixed(2)}
            </div>

            <button
              onclick="removeCartItem(${index})"
              style="
                color:#dc2626;
                background:none;
                font-size:10px;
                padding:0;
              "
            >
              ลบ
            </button>

          </div>

          <strong>
            ฿${item.total.toFixed(2)}
          </strong>

        </div>

      `
      ).join("");

  }


  const total =
    cart.reduce(
      (sum, item) =>
        sum + item.total,
      0
    );


  document.getElementById(
    "receipt-total"
  ).textContent =
    total.toFixed(2);


  document.getElementById(
    "receipt-no"
  ).textContent =
    currentBillNo || "-";

}


function removeCartItem(index) {

  cart.splice(
    index,
    1
  );

  renderCart();

}


function cancelCurrentBill() {

  if (
    !cart.length &&
    !currentBillNo
  ) return;


  if (
    !confirm(
      "ต้องการยกเลิกบิลปัจจุบันหรือไม่?"
    )
  ) return;


  cart = [];

  currentBillNo =
    generateInvoiceNo();


  renderCart();

  showToast(
    "ยกเลิกบิลแล้ว"
  );

}


/* =========================================================
   PAYMENT
========================================================= */

function showPaymentModal() {

  if (!cart.length) {

    alert(
      "ยังไม่มีสินค้าในบิล"
    );

    return;

  }


  const total =
    cart.reduce(
      (sum, item) =>
        sum + item.total,
      0
    );


  document.getElementById(
    "payment-modal-total"
  ).textContent =
    `฿${total.toFixed(2)}`;


  document
    .getElementById(
      "modal-payment"
    )
    .classList.remove("hidden");

}


function processPayment(status) {

  if (!cart.length) return;


  const total =
    cart.reduce(
      (sum, item) =>
        sum + item.total,
      0
    );


  const bill = {

    id:
      currentBillNo,

    date:
      new Date().toISOString(),

    customer:
      currentCustomer,

    items:
      structuredClone(cart),

    total,

    status

  };


  billHistory.unshift(
    bill
  );


  save(
    STORAGE.history,
    billHistory
  );


  if (
    status.includes("เงินสด")
  ) {

    openCashDrawerManual();

  }


  cart = [];

  currentBillNo =
    generateInvoiceNo();


  closeModal(
    "modal-payment"
  );


  renderPOS();


  showToast(
    "บันทึกการขายเรียบร้อย"
  );

}


/* =========================================================
   PARK BILL
========================================================= */

function parkBillManual() {

  if (!cart.length) {

    alert(
      "ไม่มีรายการสินค้าให้พัก"
    );

    return;

  }


  parkedBills.push({

    id:
      currentBillNo,

    date:
      new Date().toISOString(),

    customer:
      currentCustomer,

    items:
      structuredClone(cart),

    total:
      cart.reduce(
        (sum, item) =>
          sum + item.total,
        0
      )

  });


  save(
    STORAGE.parked,
    parkedBills
  );


  cart = [];

  currentBillNo =
    generateInvoiceNo();


  renderPOS();


  showToast(
    "พักบิลเรียบร้อย"
  );

}


function showParkedBillsModal() {

  renderParkedBills();


  document
    .getElementById(
      "modal-parked-bills"
    )
    .classList.remove("hidden");

}


function renderParkedBills() {

  const container =
    document.getElementById(
      "parked-bills-modal-list"
    );


  if (!parkedBills.length) {

    container.innerHTML = `
      <div
        style="
          text-align:center;
          padding:30px;
          color:#94a3b8;
        "
      >
        ไม่มีบิลที่พักไว้
      </div>
    `;

    return;

  }


  container.innerHTML =
    parkedBills.map(
      (bill, index) => `

      <div class="parked-item">

        <strong>
          ${escapeHtml(bill.id)}
        </strong>

        <small>
          ${escapeHtml(bill.customer)}
          · ฿${bill.total.toFixed(2)}
        </small>

        <div class="parked-actions">

          <button
            style="
              background:#4f46e5;
              color:white;
            "
            onclick="resumeParkedBill(${index})"
          >
            เรียกบิล
          </button>

          <button
            style="
              background:#fee2e2;
              color:#dc2626;
            "
            onclick="deleteParkedBill(${index})"
          >
            ลบ
          </button>

        </div>

      </div>

    `
    ).join("");

}


function resumeParkedBill(index) {

  const bill =
    parkedBills[index];


  if (!bill) return;


  if (cart.length) {

    if (
      !confirm(
        "มีรายการในบิลปัจจุบัน ต้องการทิ้งรายการเดิมหรือไม่?"
      )
    ) return;

  }


  cart =
    structuredClone(
      bill.items
    );


  currentBillNo =
    bill.id;


  currentCustomer =
    bill.customer;


  parkedBills.splice(
    index,
    1
  );


  save(
    STORAGE.parked,
    parkedBills
  );


  closeModal(
    "modal-parked-bills"
  );


  renderPOS();


  showToast(
    "เรียกบิลกลับมาแล้ว"
  );

}


function deleteParkedBill(index) {

  if (
    !confirm(
      "ต้องการลบบิลที่พักหรือไม่?"
    )
  ) return;


  parkedBills.splice(
    index,
    1
  );


  save(
    STORAGE.parked,
    parkedBills
  );


  renderParkedBills();

  updateParkedBadge();

}


function updateParkedBadge() {

  const badge =
    document.getElementById(
      "parked-badge"
    );


  if (badge) {

    badge.textContent =
      parkedBills.length;

  }

}


/* =========================================================
   BILL HISTORY
========================================================= */

function updateCustomerFilter() {

  const select =
    document.getElementById(
      "filter-customer-group"
    );


  if (!select) return;


  const names = [
    "ลูกค้าทั้งหมด",
    "ลูกค้าหน้าร้าน (ทั่วไป)",
    ...customers
  ];


  select.innerHTML =
    names.map(
      name => `
        <option value="${escapeHtml(name)}">
          ${escapeHtml(name)}
        </option>
      `
    ).join("");

}


function renderBillHistory() {

  const body =
    document.getElementById(
      "bill-history-table-body"
    );


  if (!body) return;


  const period =
    document.getElementById(
      "filter-period"
    ).value;


  const customer =
    document.getElementById(
      "filter-customer-group"
    ).value;


  const status =
    document.getElementById(
      "filter-status"
    ).value;


  const now =
    new Date();


  const filtered =
    billHistory.filter(
      bill => {

        const date =
          new Date(
            bill.date
          );


        if (
          period === "day" &&
          date.toDateString() !==
            now.toDateString()
        ) {

          return false;

        }


        if (
          period === "week"
        ) {

          const days =
            (
              now - date
            ) /
            86400000;


          if (
            days < 0 ||
            days > 7
          ) {

            return false;

          }

        }


        if (
          period === "month" &&
          (
            date.getMonth() !==
              now.getMonth() ||

            date.getFullYear() !==
              now.getFullYear()
          )
        ) {

          return false;

        }


        if (
          customer !==
            "ลูกค้าทั้งหมด" &&
          bill.customer !==
            customer
        ) {

          return false;

        }


        if (
          status !== "all" &&
          !bill.status.includes(status)
        ) {

          return false;

        }


        return true;

      }
    );


  if (!filtered.length) {

    body.innerHTML = `
      <tr>
        <td
          colspan="7"
          style="
            text-align:center;
            padding:35px;
            color:#94a3b8;
          "
        >
          ไม่พบรายการ
        </td>
      </tr>
    `;

    return;

  }


  body.innerHTML =
    filtered.map(
      bill => `

      <tr>

        <td>

          ${
            bill.status.includes(
              "ค้างชำระ"
            )

            ? `
              <input
                type="checkbox"
                class="bill-checkbox"
                value="${escapeHtml(bill.id)}"
              >
            `

            : ""
          }

        </td>


        <td>
          <strong>
            ${escapeHtml(bill.id)}
          </strong>
        </td>


        <td>
          ${new Date(
            bill.date
          ).toLocaleString("th-TH")}
        </td>


        <td>
          ${escapeHtml(
            bill.customer
          )}
        </td>


        <td class="text-right">
          <strong>
            ฿${bill.total.toFixed(2)}
          </strong>
        </td>


        <td>

          <span
            style="
              padding:4px 8px;
              border-radius:20px;
              background:${
                bill.status.includes(
                  "ค้างชำระ"
                )
                ? "#fef3c7"
                : "#dcfce7"
              };
              color:${
                bill.status.includes(
                  "ค้างชำระ"
                )
                ? "#92400e"
                : "#166534"
              };
              font-size:11px;
              font-weight:800;
            "
          >
            ${escapeHtml(
              bill.status
            )}
          </span>

        </td>


        <td>

          <button
            class="btn btn-indigo"
            style="min-height:34px;padding:5px 10px"
            onclick="viewBill('${escapeHtml(bill.id)}')"
          >
            เปิดดู
          </button>

        </td>

      </tr>

    `
    ).join("");

}


/* =========================================================
   BILL DETAIL
========================================================= */

function viewBill(id) {

  currentViewingBill =
    billHistory.find(
      bill => bill.id === id
    );


  if (!currentViewingBill) return;


  const bill =
    currentViewingBill;


  const container =
    document.getElementById(
      "print-receipt-modal"
    );


  container.innerHTML = `

    <div class="detail-receipt">

      <div class="receipt-title">
        STORE POS
      </div>

      <div class="receipt-center">
        ใบเสร็จรับเงิน
      </div>

      <br>

      <div>
        เลขที่:
        ${escapeHtml(bill.id)}
      </div>

      <div>
        วันที่:
        ${new Date(
          bill.date
        ).toLocaleString("th-TH")}
      </div>

      <div>
        ลูกค้า:
        ${escapeHtml(
          bill.customer
        )}
      </div>

      <br>

      ${bill.items.map(
        item => `

          <div
            style="
              display:flex;
              justify-content:space-between;
              margin-bottom:8px;
            "
          >

            <div>

              <strong>
                ${escapeHtml(
                  item.name
                )}
              </strong>

              <div style="font-size:10px">
                ${item.weight.toFixed(3)}
                kg ×
                ฿${item.pricePerKg.toFixed(2)}
              </div>

            </div>

            <strong>
              ฿${item.total.toFixed(2)}
            </strong>

          </div>

        `
      ).join("")}


      <div class="receipt-total">

        <strong>
          รวม
        </strong>

        <strong>
          ฿${bill.total.toFixed(2)}
        </strong>

      </div>


      <div class="receipt-thank">
        ${escapeHtml(
          bill.status
        )}
      </div>

    </div>

  `;


  const statusContainer =
    document.getElementById(
      "toggle-status-container"
    );


  if (
    bill.status.includes(
      "ค้างชำระ"
    )
  ) {

    statusContainer.innerHTML = `

      <button
        class="btn btn-green full-width"
        onclick="markBillPaid('${escapeHtml(bill.id)}')"
      >
        ✓ เปลี่ยนเป็นชำระแล้ว
      </button>

    `;

  } else {

    statusContainer.innerHTML = "";

  }


  document
    .getElementById(
      "modal-bill-detail"
    )
    .classList.remove("hidden");

}


function markBillPaid(id) {

  const bill =
    billHistory.find(
      item => item.id === id
    );


  if (!bill) return;


  bill.status =
    "ชำระแล้ว (เงินสด)";


  save(
    STORAGE.history,
    billHistory
  );


  viewBill(id);

  renderBillHistory();

  showToast(
    "เปลี่ยนสถานะเป็นชำระแล้ว"
  );

}


/* =========================================================
   MERGE BILLS
========================================================= */

function mergeSelectedBills() {

  const checked =
    Array.from(
      document.querySelectorAll(
        ".bill-checkbox:checked"
      )
    );


  if (checked.length < 2) {

    alert(
      "กรุณาเลือกบิลค้างชำระอย่างน้อย 2 ใบ"
    );

    return;

  }


  const ids =
    checked.map(
      checkbox =>
        checkbox.value
    );


  const bills =
    billHistory.filter(
      bill =>
        ids.includes(
          bill.id
        )
    );


  const customers =
    [
      ...new Set(
        bills.map(
          bill =>
            bill.customer
        )
      )
    ];


  if (customers.length > 1) {

    alert(
      "สามารถรวมบิลของลูกค้าคนเดียวกันเท่านั้น"
    );

    return;

  }


  const merged = {

    id:
      generateInvoiceNo(
        "MERGE"
      ),

    date:
      new Date().toISOString(),

    customer:
      customers[0] +
      " (รวมบิล)",

    items:
      bills.flatMap(
        bill =>
          bill.items
      ),

    total:
      bills.reduce(
        (sum, bill) =>
          sum + bill.total,
        0
      ),

    status:
      "ค้างชำระ"

  };


  billHistory =
    billHistory.filter(
      bill =>
        !ids.includes(
          bill.id
        )
    );


  billHistory.unshift(
    merged
  );


  save(
    STORAGE.history,
    billHistory
  );


  renderBillHistory();


  showToast(
    "รวมบิลเรียบร้อย"
  );

}


/* =========================================================
   PURCHASE
========================================================= */

function addPurchaseItem() {

  const name =
    document
      .getElementById(
        "p-name"
      )
      .value
      .trim();


  const qty =
    document
      .getElementById(
        "p-qty"
      )
      .value
      .trim();


  const price =
    Number(
      document
        .getElementById(
          "p-price"
        )
        .value
    ) || 0;


  if (!name || !qty) {

    alert(
      "กรุณากรอกสินค้าและจำนวน"
    );

    return;

  }


  purchaseItems.push({

    name,

    qty,

    price

  });


  document.getElementById(
    "p-name"
  ).value = "";


  document.getElementById(
    "p-qty"
  ).value = "";


  document.getElementById(
    "p-price"
  ).value = "";


  renderPurchase();

}


function renderPurchase() {

  const body =
    document.getElementById(
      "purchase-table-body"
    );


  body.innerHTML =
    purchaseItems.map(
      (item, index) => `

      <tr>

        <td>
          ${escapeHtml(
            item.name
          )}
        </td>

        <td>
          ${escapeHtml(
            item.qty
          )}
        </td>

        <td class="text-right">
          ฿${item.price.toFixed(2)}
        </td>

        <td>

          <button
            onclick="removePurchase(${index})"
            style="
              color:#dc2626;
              background:none;
              font-size:20px;
            "
          >
            ×
          </button>

        </td>

      </tr>

    `
    ).join("");

}


function removePurchase(index) {

  purchaseItems.splice(
    index,
    1
  );

  renderPurchase();

}


function savePurchaseOrder() {

  if (!purchaseItems.length) {

    alert(
      "ยังไม่มีรายการซื้อเข้า"
    );

    return;

  }


  /*
    ตอนนี้บันทึกเฉพาะในระบบจำลอง
    สามารถต่อฐานข้อมูลภายหลังได้
  */


  purchaseItems = [];

  renderPurchase();

  showToast(
    "บันทึกรายการซื้อเข้าแล้ว"
  );

}


/* =========================================================
   EXPENSE
========================================================= */

function addExpense(type) {

  const amount =
    prompt(
      `กรอกจำนวนเงินสำหรับ ${type}`
    );


  if (
    amount === null ||
    amount.trim() === ""
  ) return;


  const value =
    Number(amount);


  if (
    !Number.isFinite(value) ||
    value < 0
  ) {

    alert(
      "กรุณากรอกจำนวนเงินให้ถูกต้อง"
    );

    return;

  }


  showToast(
    `${type} ฿${value.toFixed(2)} บันทึกแล้ว`
  );

}


/* =========================================================
   CASH DRAWER
========================================================= */

function openCashDrawerManual() {

  /*
    สำหรับเครื่อง POS จริง
    สามารถต่อ Web Serial / ESC-POS
    หรือระบบ Printer SDK ในภายหลังได้
  */

  showToast(
    "คำสั่งเปิดลิ้นชักถูกเรียกแล้ว"
  );

}


/* =========================================================
   SHARE
========================================================= */

async function shareBill() {

  if (!currentViewingBill)
    return;


  const bill =
    currentViewingBill;


  const text =

`ใบเสร็จ STORE POS

เลขที่: ${bill.id}

ลูกค้า: ${bill.customer}

ยอดรวม: ฿${bill.total.toFixed(2)}

สถานะ: ${bill.status}`;


  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title:
          "ใบเสร็จ STORE POS",

        text

      });

    }

    catch (error) {

      if (
        error.name !==
        "AbortError"
      ) {

        showToast(
          "ไม่สามารถแชร์ได้"
        );

      }

    }

  }

  else if (
    navigator.clipboard
  ) {

    await navigator.clipboard.writeText(
      text
    );

    showToast(
      "คัดลอกใบเสร็จแล้ว"
    );

  }

  else {

    alert(text);

  }

}


/* =========================================================
   PRINT
========================================================= */

function printBill() {

  window.print();

}


/* =========================================================
   MODAL
========================================================= */

function closeModal(id) {

  const modal =
    document.getElementById(id);


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );


  document.getElementById(
    "toast-msg"
  ).textContent =
    message;


  toast.classList.remove(
    "hidden"
  );


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(
      () => {

        toast.classList.add(
          "hidden"
        );

      },
      2500
    );

}


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      document
        .querySelectorAll(
          ".modal"
        )
        .forEach(
          modal =>
            modal.classList.add(
              "hidden"
            )
        );

    }

  }
);
