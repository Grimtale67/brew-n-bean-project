# Brew & Bean — 現代咖啡館 POS 系統

**學號：** [23107142]

**GitHub 連結：** [https://github.com/Grimtale67/brew-n-bean-project]

---

## 1. 專案目的

Brew & Bean 是一個為小型咖啡館設計的銷售點（POS）網頁應用程式。店員可以瀏覽菜單、建立顧客的訂單、調整數量，並在結帳時產生收據。本專案只使用純 HTML、CSS 與 JavaScript（不使用任何框架，也沒有後端），用來展示陣列、物件、陣列方法、DOM 操作與事件處理等 JavaScript 核心概念。

## 2. 主要功能

- 依據 `menu` 陣列動態產生商品卡片
- 商品分類篩選（All、Coffee、Latte、Non-Coffee）
- 將飲品加入訂單（重複加入同一飲品時，只會增加數量）
- 在訂單面板中增加、減少數量，或移除品項
- 清空整筆訂單（清空前會跳出確認視窗）
- 即時計算小計與總金額（NT$）
- 結帳並顯示收據視窗（咖啡館名稱、訂單編號、日期時間、品項、數量、單價、總金額）
- 結帳後可開始新訂單
- 使用友善的提示訊息（toast）取代瀏覽器內建的 `alert()`
- 側邊欄可在 POS 與 Menu 頁面之間切換
- 響應式版面，支援桌機、平板與手機

## 3. 程式流程

### 步驟 1 — 載入頁面並啟動程式

**發生什麼事：** 頁面開啟時，程式會畫出菜單、菜單表格與（空的）訂單，並將所有按鈕綁定事件。

**函式：** `init()`

```js
function init() {
  renderMenu();
  renderMenuTable();
  renderOrder();
  setupEventListeners();
}
```

**程式如何運作：** `init()` 依序呼叫其他函式。render 函式會讀取陣列並建立畫面，`setupEventListeners()` 則讓按鈕可以回應點擊。檔案最後一行的 `init();` 負責啟動整個程式。

---

### 步驟 2 — 顯示並篩選菜單

**發生什麼事：** 程式依據 `menu` 陣列產生商品卡片。如果選了某個分類，就只顯示該分類的飲品。

**函式：** `renderMenu()`

```js
if (selectedCategory === "All") {
  visibleProducts = menu;
} else {
  visibleProducts = menu.filter(function (product) {
    return product.category === selectedCategory; // keep only matching drinks
  });
}
```

```js
productGrid.innerHTML = visibleProducts.map(function (product) {
  return `
    <article class="product-card">
      <img class="product-img" src="${product.image}" alt="${product.name}" />
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <span class="product-category">${product.category}</span>
        <div class="product-footer">
          <span class="product-price">${formatCurrency(product.price)}</span>
          <button class="add-btn" data-id="${product.id}">Add</button>
        </div>
      </div>
    </article>
  `;
}).join("");
```

**程式如何運作：** `if` 判斷目前選擇的分類。`.filter()` 只保留分類相符的飲品。`.map()` 把每個商品物件轉換成一段 HTML，`.join("")` 再把所有片段合併成一個字串，用 `innerHTML` 放進頁面中。

---

### 步驟 3 — 使用者點擊分類按鈕

**發生什麼事：** 點擊分類按鈕後，會更新目前選擇的分類並重新畫出商品區。

**函式：** `setupEventListeners()`（分類篩選的監聽器），接著呼叫 `renderCategoryButtons()` 與 `renderMenu()`

```js
categoryFilters.addEventListener("click", function (event) {
  const button = event.target.closest(".filter-btn");
  if (!button) {
    return; // the click was not on a filter button
  }
  selectedCategory = button.dataset.category;
  renderCategoryButtons();
  renderMenu();
});
```

**程式如何運作：** 只在篩選按鈕的外層容器上放一個監聽器。`event.target.closest()` 會找出實際被點擊的按鈕。程式先更新變數 `selectedCategory`，再依據它重新畫出按鈕與商品區。

---

### 步驟 4 — 使用者將飲品加入訂單

**發生什麼事：** 點擊「Add」會把飲品放進訂單。如果該飲品已在訂單中，只會把數量加一，不會產生重複的品項。

**函式：** `addToOrder(productId)`

```js
const product = menu.find(function (item) {
  return item.id === productId;
});
```

```js
const existingItem = currentOrder.find(function (item) {
  return item.id === productId;
});

if (existingItem) {
  // Already in the order: increase quantity (but not past the maximum)
  if (existingItem.quantity >= MAX_QUANTITY) {
    showToast("Maximum quantity reached for " + product.name + ".", "warning");
    return;
  }
  existingItem.quantity += 1;
} else {
  // Not in the order yet: create a new order item object
  currentOrder.push({
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1
  });
}

renderOrder(); // redraw the screen from the updated array
```

**程式如何運作：** `.find()` 先在 `menu` 中找到該商品，再到 `currentOrder` 中找有沒有相同的商品。如果有，就修改它的 `quantity`；如果沒有，就用 `push` 加入一個新的訂單品項物件。陣列更新完成後，`renderOrder()` 會重新畫出訂單面板。

---

### 步驟 5 — 使用者調整數量

**發生什麼事：** 「+」與「−」按鈕可以改變數量，而且數量永遠不會變成 0 或負數。

**函式：** `updateQuantity(productId, change)`

```js
const newQuantity = item.quantity + change; // the quantity we WOULD get

// Validate: quantity must never be zero or negative
if (newQuantity < 1) {
  showToast("Quantity can't go below 1. Use Remove to delete the drink.", "warning");
  return;
}
```

```js
item.quantity = newQuantity; // update the array first
renderOrder();               // then update the screen
```

**程式如何運作：** 函式先算出「如果修改的話」新的數量，但還沒有真的改動資料。如果結果小於 1，就顯示提示訊息並用 `return` 結束函式。只有合法的數值才會存進陣列，之後再重新畫出畫面。

---

### 步驟 6 — 使用者移除品項

**發生什麼事：** 「Remove」會把一項飲品從訂單中完全刪除。

**函式：** `removeFromOrder(productId)`

```js
currentOrder = currentOrder.filter(function (item) {
  return item.id !== productId;
});

renderOrder();
```

**程式如何運作：** `.filter()` 會建立一個新陣列，保留除了指定 id 以外的所有品項。這個新陣列會取代原本的 `currentOrder`，然後重新畫出訂單面板。

---

### 步驟 7 — 使用者清空訂單

**發生什麼事：** 點擊「Clear Order」會先跳出確認視窗，只有按下「Yes, continue」才會真的清空訂單。

**函式：** `clearOrder()` 與 `emptyOrder()`

```js
function clearOrder() {
  // Conditional: nothing to clear if the order is already empty
  if (currentOrder.length === 0) {
    showToast("The order is already empty.", "info");
    return;
  }

  showConfirm("This will remove all drinks from the current order.", emptyOrder);
}
```

```js
function emptyOrder() {
  currentOrder = [];
  renderOrder();
  showToast("Order cleared.", "info");
}
```

**程式如何運作：** `clearOrder()` 本身不會刪除任何資料，它只是把函式 `emptyOrder` 交給 `showConfirm()` 保存起來。如果使用者按「Yes」，就會執行被保存的函式；如果按「Cancel」，該函式會被捨棄，什麼都不會被刪除。

---

### 步驟 8 — 計算總金額

**發生什麼事：** 每次訂單變動後，總金額與品項總數都會從陣列重新計算。

**函式：** `calculateTotal()`

```js
return currentOrder.reduce(function (sum, item) {
  return sum + item.price * item.quantity;
}, 0);
```

**程式如何運作：** `.reduce()` 從 0 開始，逐一走過每個訂單品項，累加「單價 × 數量」。最後回傳的數字會由 `renderOrder()` 透過 `formatCurrency()` 顯示在畫面上。

---

### 步驟 9 — 重新畫出訂單面板

**發生什麼事：** 訂單清單、品項數量、小計與總金額，都會依據 `currentOrder` 重新建立。

**函式：** `renderOrder()`

```js
const itemCount = calculateItemCount();
orderCount.textContent = itemCount + (itemCount === 1 ? " item" : " items");

const total = calculateTotal();
subtotalAmount.textContent = formatCurrency(total);
totalAmount.textContent = formatCurrency(total);
```

**程式如何運作：** 畫面上顯示的數字從來不是手動輸入的，而是永遠由陣列計算出來，所以畫面與資料不會不一致。

---

### 步驟 10 — 使用者結帳

**發生什麼事：** 如果訂單是空的，結帳會被擋下並顯示友善的訊息；否則會建立收據、顯示收據視窗，並重設訂單。

**函式：** `checkout()`

```js
if (currentOrder.length === 0) {
  showToast("Your order is empty. Please add a drink first.", "warning");
  return;
}
```

```js
const receipt = {
  orderNumber: "BB-" + orderCounter,
  dateTime: new Date(),
  items: currentOrder,
  total: calculateTotal()
};

renderReceipt(receipt);
openModal(receiptModal);

// Reset the order for the next customer (the receipt keeps the old array)
currentOrder = [];
orderCounter += 1;
renderOrder();
```

**程式如何運作：** 程式在重設訂單之前，先把收據資料存成一個物件。`currentOrder = []` 會建立一個新的空陣列，因此收據物件仍然保有舊的品項。訂單編號計數器加一，讓下一筆訂單有新的編號。整段程式放在 `try...catch` 中，萬一發生意外錯誤，會顯示訊息而不是讓程式當掉。

---

### 步驟 11 — 顯示收據

**發生什麼事：** 收據視窗會顯示咖啡館名稱、訂單編號、日期時間、每項飲品的數量與價格，以及最終總金額。

**函式：** `renderReceipt(receipt)`

```js
const lines = receipt.items.map(function (item) {
  return `
    <div class="receipt-line">
      <span>${item.name}</span>
      <span class="amount">${formatCurrency(item.price * item.quantity)}</span>
      <span class="sub">${item.quantity} × ${formatCurrency(item.price)}</span>
    </div>
  `;
}).join("");
```

**程式如何運作：** `.map()` 為每一項購買的飲品建立一行收據內容。這些內容再與訂單編號、日期與總金額組合起來，放進收據視窗中。咖啡館名稱則寫在 `index.html` 的收據視窗裡。

---

### 步驟 12 — 開始新訂單

**發生什麼事：** 收據視窗關閉，店員可以服務下一位顧客。訂單在結帳時就已經被重設為空的。

**函式：** `startNewOrder()`

```js
function startNewOrder() {
  closeModal(receiptModal);
  showToast("Ready for a new order!", "success");
}
```

**程式如何運作：** 視窗是透過加上 CSS class `hidden` 來隱藏的，全程不需要重新整理頁面。

---

## 4. 本專案如何展示各項必要概念

### 陣列與物件（Arrays and Objects）

- `menu` 是由商品物件組成的陣列，每個物件包含 `id`、`name`、`category`、`price` 與 `image`。
- `currentOrder` 是由訂單品項物件組成的陣列，每個物件包含 `id`、`name`、`price` 與 `quantity`。
- 收據同樣是一個物件，包含 `orderNumber`、`dateTime`、`items` 與 `total`。

```js
const menu = [
  { id: 1, name: "Iced Americano",    category: "Coffee",     price: 80,  image: createDrinkImage("#3b2417", "iced", false) },
  { id: 2, name: "Hot Americano",     category: "Coffee",     price: 75,  image: createDrinkImage("#3b2417", "hot", false) },
```

### 陣列方法（Array Methods）

| 方法 | 使用位置 | 用途 |
|---|---|---|
| `.find()` | `addToOrder()`、`updateQuantity()` | 依 id 找出商品或訂單中已存在的品項 |
| `.filter()` | `renderMenu()`、`removeFromOrder()` | 篩選單一分類的飲品；從訂單中移除某個品項 |
| `.map()` | `renderMenu()`、`renderOrder()`、`renderReceipt()` | 把物件轉換成 HTML |
| `.reduce()` | `calculateTotal()`、`calculateItemCount()` | 加總價格與飲品數量 |

### DOM 操作（DOM Manipulation）

- 建立與更新元素：用 `innerHTML` 產生商品卡片、訂單品項與收據；用 `document.createElement()` 建立提示訊息（toast）。
- 用 `classList.add("hidden")` 與 `classList.remove("hidden")` 顯示或隱藏視窗與頁面。

```js
function openModal(modalElement) {
  modalElement.classList.remove("hidden");
}
```

### 事件處理（Event Handling）

- `addEventListener("click", ...)` 用於分類篩選、Add 按鈕、數量按鈕、Remove、Clear Order、Checkout、New Order，以及確認視窗的按鈕。
- Add 按鈕與訂單中的按鈕使用**事件委派（event delegation）**：只在外層容器放一個監聽器，就能處理容器內所有按鈕的點擊。

```js
clearOrderBtn.addEventListener("click", clearOrder);
checkoutBtn.addEventListener("click", checkout);
newOrderBtn.addEventListener("click", startNewOrder);
```

### 函式（Functions）

每項重要工作都有自己的函式，並在上方寫有用途註解：`renderMenu()`、`renderOrder()`、`addToOrder()`、`updateQuantity()`、`removeFromOrder()`、`clearOrder()`、`calculateTotal()`、`checkout()`、`renderReceipt()`，以及輔助函式如 `formatCurrency()`、`showToast()`、`openModal()`、`closeModal()` 與 `showConfirm()`。

### 條件判斷（Conditional Statements）

- `if (existingItem)` 判斷飲品是否已在訂單中。
- `if (currentOrder.length === 0)` 判斷訂單是否為空（用於 `checkout()`、`clearOrder()` 與 `renderOrder()`）。
- `if (newQuantity < 1)` 驗證數量。
- `if (selectedCategory === "All")` 處理分類選擇。
- `if / else if` 依按鈕種類決定要增加、減少還是移除。

```js
if (action === "increase") {
  updateQuantity(productId, 1);
} else if (action === "decrease") {
  updateQuantity(productId, -1);
} else if (action === "remove") {
  removeFromOrder(productId);
}
```

### 錯誤處理（Error Handling）

- **空訂單：** `checkout()` 會停止執行並顯示友善的訊息。
- **無效數量：** `updateQuantity()` 不允許數量小於 1 或超過 `MAX_QUANTITY`。
- **清空訂單的確認：** `showConfirm()` 會在刪除所有品項前先詢問使用者。
- **意外錯誤：** `checkout()` 中的 `try...catch` 會顯示訊息，而不是讓程式當掉。
- **找不到商品：** `addToOrder()` 會檢查 `.find()` 是否真的找到商品。

```js
if (!product) {
  showToast("Sorry, that drink could not be found.", "error");
  return;
}
```

### 資料同步（Data Synchronization）

陣列是唯一的資料來源（single source of truth）。每個操作都遵循相同的模式：

1. 先修改陣列（`push`、修改 `quantity`、`filter`，或重設為 `[]`）。
2. 呼叫 render 函式（`renderOrder()` 或 `renderMenu()`）。
3. 畫面依據陣列重新建立。

總金額從來不會直接在畫面上修改，而是永遠由 `calculateTotal()` 從 `currentOrder` 重新計算，因此畫面永遠與資料一致，頁面也完全不需要重新整理。

```js
item.quantity = newQuantity; // update the array first
renderOrder();               // then update the screen
```

---

## 5. 檔案說明

| 檔案 | 用途 |
|---|---|
| `index.html` | 頁面結構：側邊欄、商品區、訂單面板、視窗 |
| `style.css` | 外觀設計：色彩、版面、卡片、視窗與響應式規則 |
| `app.js` | 所有程式邏輯：資料、畫面渲染、訂單管理、結帳 |
| `report.md` | 本報告 |
