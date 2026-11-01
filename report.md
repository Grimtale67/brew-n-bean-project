# 專題報告

## 1. 名稱

- 專題名稱：Brew & Bean — 咖啡館 POS 點餐系統
- 學號：（請填寫）
- GitHub連結：https://github.com/Grimtale67/brew-n-bean-project
- 網頁連結：https://grimtale67.github.io/brew-n-bean-project/

---

## 2. 目的

咖啡館點餐時，店員需要快速記錄客人點的飲料，並正確算出總金額，如果用手寫或心算，很容易漏記或算錯。本專題使用 HTML、CSS 與 JavaScript，製作一個可以在瀏覽器中操作的點餐系統，讓店員能夠點餐、調整數量、自動計算金額，並在結帳後產生收據、開始下一筆訂單。

---

## 3. 功能

- 開啟網頁後，畫面會顯示 8 種飲料，每張卡片有圖片、名稱、分類、價格與「Add」按鈕。
- 按上方的分類按鈕（All、Coffee、Latte、Non-Coffee），畫面只會顯示該分類的飲料。
- 按「Add」，飲料會加入右側的訂單；重複按同一種飲料時，不會多一行，而是數量加 1。
- 按訂單裡的「+」，該飲料數量加 1；按「−」數量減 1，但數量不會低於 1，低於時會跳出提示訊息。
- 按「Remove」，該飲料會直接從訂單中移除。
- 每次訂單改變，品項數量、小計與總金額（NT$）都會立刻自動更新，不需要重新整理網頁。
- 按「Clear Order」，會先跳出確認視窗，按「Yes, continue」才會清空整筆訂單；如果訂單本來就是空的，會顯示提示訊息。
- 按「Checkout」，如果訂單是空的，會顯示提示訊息而且不會結帳；如果有資料，會跳出收據（店名、訂單編號、日期時間、品項、數量、單價、總金額），並把訂單清空。
- 按收據上的「Start New Order」，收據關閉，可以開始下一筆訂單。
- 按左側選單的「POS」或「Menu」，可以切換頁面；Menu 頁面會用表格列出所有飲料與價格。

---

## 4. 程式運作流程說明

程式用兩個陣列記錄資料：`menu` 是菜單，`currentOrder` 是客人點的飲料。畫面上看到的內容，都是根據這兩個陣列畫出來的。

### 步驟 1：建立 `menu` 陣列，存放菜單資料

說明：`menu` 陣列裡的每一筆是一個物件，記錄飲料的編號 (`id`)、名稱 (`name`)、分類 (`category`)、價格 (`price`) 與圖片 (`image`)。這份資料固定不變。

```js
const menu = [
  { id: 1, name: "Iced Americano",    category: "Coffee",     price: 80,  image: createDrinkImage("#3b2417", "iced", false) },
  { id: 2, name: "Hot Americano",     category: "Coffee",     price: 75,  image: createDrinkImage("#3b2417", "hot", false) },
  { id: 3, name: "Iced Latte",        category: "Latte",      price: 100, image: createDrinkImage("#c49a6c", "iced", false) },
  { id: 4, name: "Hot Latte",         category: "Latte",      price: 95,  image: createDrinkImage("#c49a6c", "hot", false) },
  { id: 5, name: "Matcha Latte",      category: "Latte",      price: 110, image: createDrinkImage("#8fae6b", "iced", false) },
  { id: 6, name: "Chocolate",         category: "Non-Coffee", price: 95,  image: createDrinkImage("#5a3320", "hot", true) },
  { id: 7, name: "Caramel Macchiato", category: "Coffee",     price: 120, image: createDrinkImage("#d19a4f", "iced", true) },
  { id: 8, name: "Strawberry Milk",   category: "Non-Coffee", price: 100, image: createDrinkImage("#f4a3b5", "iced", false) }
];
```

程式碼說明：用中括號 `[ ]` 建立陣列，大括號 `{ }` 建立物件。`id` 不可重複，之後要靠它辨識是哪一杯飲料。`image` 是由 `createDrinkImage()` 畫出來的飲料圖片，所以圖片不會因為網路問題而壞掉。

### 步驟 2：建立 `currentOrder` 陣列，存放客人點的飲料

說明：`currentOrder` 一開始是空陣列。客人點餐後，會放入像 `{ id: 1, name: "Iced Americano", price: 80, quantity: 2 }` 的物件，其中 `quantity` 是數量。

```js
let currentOrder = [];
```

程式碼說明：空陣列代表目前沒有點任何飲料。這裡用 `let` 而不是 `const`，因為清空或移除品項時，會把整個陣列換成新的陣列。

### 步驟 3：頁面載入時啟動程式（`init`）

說明：頁面打開時，程式會畫出菜單、菜單表格與（空的）訂單，並讓所有按鈕可以被點擊。

```js
function init() {
  renderMenu();
  renderMenuTable();
  renderOrder();
  setupEventListeners();
}
```

程式碼說明：`init()` 依序呼叫四個函式：前三個負責「根據陣列畫畫面」，`setupEventListeners()` 負責讓按鈕有反應。檔案最後一行的 `init();` 會真正啟動它。

### 步驟 4：抓取 `menu` 的資料，畫出商品卡片（`renderMenu`）

說明：先判斷目前選的分類。選 All 就顯示全部飲料，否則只留下分類相符的飲料。接著用 `map` 為每種飲料產生一張卡片，內容包含圖片、名稱、分類、價格與「Add」按鈕。按鈕上用 `data-id` 記錄這杯飲料的編號，方便之後知道按的是哪一杯。

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

程式碼說明：`filter` 會建立一個新陣列，只保留符合條件的飲料；`map` 會把每個飲料物件轉成一段 HTML；`join("")` 把所有 HTML 接成同一個字串，再用 `innerHTML` 放進畫面。反引號裡的 `${ }` 會被換成變數的值。

### 步驟 5：偵測分類按鈕，切換分類（`setupEventListeners`）

說明：按下分類按鈕後，程式先更新「目前選的分類」，再重新畫出按鈕外觀與商品卡片。

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

程式碼說明：這裡只在外層容器放一個監聽器（事件委派）。`event.target.closest()` 會找出實際被點的按鈕，如果點到的不是篩選按鈕就用 `return` 結束；`dataset.category` 讀出按鈕上存的分類名稱。

### 步驟 6：偵測「Add」按鈕，加入 `currentOrder` 陣列（`addToOrder`）

說明：按下「Add」後，程式用飲料編號到 `menu` 找出這杯飲料，再檢查 `currentOrder` 裡是否已經有它：

- 已經有：把該筆的數量 `quantity` 加 1（超過 99 時不加，並顯示提示）
- 還沒有：建立新的物件，數量設為 1，放進 `currentOrder`

修改完資料後，呼叫 `renderOrder()` 更新畫面。

```js
function addToOrder(productId) {
  // Find the product in the menu array
  const product = menu.find(function (item) {
    return item.id === productId;
  });

  // Error handling: the product should always exist, but we check anyway
  if (!product) {
    showToast("Sorry, that drink could not be found.", "error");
    return;
  }

  // Check whether this drink is already in the order
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
  showToast(product.name + " added to order.", "success");
}
```

程式碼說明：`find` 找到會回傳該筆資料，找不到回傳 `undefined`，所以後面用 `if (!product)` 擋掉找不到的情況；`push` 把新物件加到陣列最後面；修改完陣列之後才呼叫 `renderOrder()`，確保畫面和資料一致。

### 步驟 7：偵測訂單中的「+」「−」「Remove」按鈕（`setupEventListeners`）

說明：這三個按鈕都帶有 `data-action`（要做什麼動作）與 `data-id`（對哪一杯做）兩個資訊。程式讀出這兩個值，再依照動作呼叫不同的函式。

```js
orderItems.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const productId = Number(button.dataset.id);
  const action = button.dataset.action;

  // Conditional: decide what to do based on which button was clicked
  if (action === "increase") {
    updateQuantity(productId, 1);
  } else if (action === "decrease") {
    updateQuantity(productId, -1);
  } else if (action === "remove") {
    removeFromOrder(productId);
  }
});
```

程式碼說明：`dataset` 讀出來是字串，要用 `Number()` 轉成數字才能和 `id` 比較；`if / else if` 依照 `action` 的值決定呼叫哪個函式。因為訂單按鈕是每次重新畫出來的，所以監聽器放在外層容器，才不會因為按鈕被重畫而失效。

### 步驟 8：修改數量，並檢查數量是否合理（`updateQuantity`）

說明：先算出「如果修改的話」新的數量，但還沒有真的改動資料。如果新數量小於 1，或大於上限 99，就顯示提示訊息並結束；只有合理的數值才會存進陣列，然後重新畫出畫面。

```js
function updateQuantity(productId, change) {
  const item = currentOrder.find(function (orderItem) {
    return orderItem.id === productId;
  });

  // If the item is not in the order, do nothing
  if (!item) {
    return;
  }

  const newQuantity = item.quantity + change; // the quantity we WOULD get

  // Validate: quantity must never be zero or negative
  if (newQuantity < 1) {
    showToast("Quantity can't go below 1. Use Remove to delete the drink.", "warning");
    return;
  }

  // Validate: quantity must not be too large
  if (newQuantity > MAX_QUANTITY) {
    showToast("Maximum quantity is " + MAX_QUANTITY + ".", "warning");
    return;
  }

  item.quantity = newQuantity; // update the array first
  renderOrder();               // then update the screen
}
```

程式碼說明：`change` 是 +1 或 −1；先用 `newQuantity` 暫存結果，驗證通過才寫回 `item.quantity`，這樣數量永遠不會變成 0 或負數。

### 步驟 9：移除單一品項（`removeFromOrder`）

說明：按「Remove」後，把指定的那一筆從 `currentOrder` 中拿掉，再重新畫出畫面。

```js
function removeFromOrder(productId) {
  // filter() keeps every item EXCEPT the one we want to remove
  currentOrder = currentOrder.filter(function (item) {
    return item.id !== productId;
  });

  renderOrder();
  showToast("Item removed.", "info");
}
```

程式碼說明：`filter` 會建立新陣列，保留 `id` 和要移除的飲料「不一樣」的所有品項，再用這個新陣列取代原本的 `currentOrder`。

### 步驟 10：抓取 `currentOrder` 的資料，畫出訂單面板（`renderOrder`）

說明：每次都根據最新的 `currentOrder` 重新畫出右側訂單：

- `currentOrder` 是空的：顯示「No drinks yet」的提示
- `currentOrder` 有資料：每一筆畫出名稱、單價、小計，以及「−」「+」「Remove」按鈕

畫完清單後，也會更新品項數量、小計與總金額。

```js
function renderOrder() {
  // Conditional: show an empty message if there is nothing in the order
  if (currentOrder.length === 0) {
    orderItems.innerHTML = `
      <div class="empty-order">
        <span class="big">🛍️</span>
        No drinks yet.<br />Tap "Add" on a drink to start an order.
      </div>
    `;
  } else {
    // Turn each order item object into HTML
    orderItems.innerHTML = currentOrder.map(function (item) {
      return `
        <div class="order-item">
          <div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">${formatCurrency(item.price)} each</div>
          </div>
          <div class="item-line-total">${formatCurrency(item.price * item.quantity)}</div>
          <div class="item-controls">
            <button class="qty-btn" data-action="decrease" data-id="${item.id}">−</button>
            <span class="qty-number">${item.quantity}</span>
            <button class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
            <button class="remove-btn" data-action="remove" data-id="${item.id}">Remove</button>
          </div>
        </div>
      `;
    }).join("");
  }

  // Update the item count badge and the totals using the array data
  const itemCount = calculateItemCount();
  orderCount.textContent = itemCount + (itemCount === 1 ? " item" : " items");

  const total = calculateTotal();
  subtotalAmount.textContent = formatCurrency(total);
  totalAmount.textContent = formatCurrency(total);
}
```

程式碼說明：`currentOrder.length === 0` 用來判斷陣列是否為空；每個按鈕都帶有 `data-action` 與 `data-id`，步驟 7 就是靠這兩個值判斷要做什麼；畫面上的數字都是呼叫函式算出來的，不是手動寫死的。

### 步驟 11：計算總金額與品項數量（`calculateTotal`）

說明：用 `reduce` 把 `currentOrder` 裡每一筆的「單價 × 數量」加總。這個函式會在每次 `renderOrder()` 時執行，所以每次訂單改變，總金額都會同步更新。

```js
function calculateTotal() {
  // reduce() starts at 0 and adds each item's line total
  return currentOrder.reduce(function (sum, item) {
    return sum + item.price * item.quantity;
  }, 0);
}
```

程式碼說明：`reduce` 會把陣列累加成一個值，`sum` 是目前累加的結果，最後的 `0` 是起始值。例如 Iced Americano 80 × 2 加上 Hot Latte 95 × 1，總金額是 255。品項數量由 `calculateItemCount()` 用同樣的方式把所有 `quantity` 加起來。

### 步驟 12：偵測「Clear Order」按鈕，確認後清空訂單（`clearOrder`、`emptyOrder`）

說明：

- `currentOrder` 是空的：顯示提示「The order is already empty.」
- `currentOrder` 有資料：跳出確認視窗，按「Yes, continue」後才把 `currentOrder` 設回空陣列，並呼叫 `renderOrder()` 更新畫面

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
function showConfirm(message, onConfirm) {
  confirmMessage.textContent = message;
  pendingConfirmAction = onConfirm; // remember what to do on "Yes"
  openModal(confirmModal);
}
```

```js
confirmYesBtn.addEventListener("click", function () {
  closeModal(confirmModal);
  if (pendingConfirmAction) {
    pendingConfirmAction(); // run the action that was waiting for confirmation
    pendingConfirmAction = null;
  }
});
```

```js
function emptyOrder() {
  currentOrder = [];
  renderOrder();
  showToast("Order cleared.", "info");
}
```

程式碼說明：`clearOrder()` 本身不會刪除資料，它把函式 `emptyOrder` 交給 `showConfirm()` 先記起來（存在 `pendingConfirmAction`）。使用者按「Yes」時才執行這個被記住的函式，按「Cancel」就不執行，所以不會誤刪。這裡用自訂的確認視窗，取代瀏覽器的 `confirm`。

### 步驟 13：偵測「Checkout」按鈕，結帳並重設訂單（`checkout`）

說明：先檢查訂單是否為空，空的就顯示提示並結束。如果有資料，就把收據需要的資料整理成一個物件，顯示收據視窗，然後把訂單重設為空陣列，並讓訂單編號加 1。

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

程式碼說明：收據要在重設訂單「之前」先存好。`currentOrder = []` 是建立一個新的空陣列，收據物件裡的 `items` 仍然指向舊的陣列，所以收據內容不會消失。整段程式放在 `try...catch` 裡，如果發生意外錯誤，會顯示提示訊息而不是讓程式當掉。

### 步驟 14：把收據畫出來（`renderReceipt`）

說明：用 `map` 為每一項購買的飲料產生一行收據（名稱、數量 × 單價、小計），再與訂單編號、日期時間、總金額組合，放進收據視窗。

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

程式碼說明：這和步驟 4、步驟 10 一樣，都是「陣列 → `map` → HTML 字串 → `innerHTML`」的做法；咖啡館名稱寫在 `index.html` 的收據視窗裡。

### 步驟 15：偵測「Start New Order」按鈕，開始新訂單（`startNewOrder`）

說明：按下後收據視窗關閉。訂單在結帳時就已經重設為空的，所以店員可以直接服務下一位客人。

```js
function startNewOrder() {
  closeModal(receiptModal);
  showToast("Ready for a new order!", "success");
}
```

程式碼說明：視窗是透過加上 CSS class `hidden` 來隱藏的，全程不需要重新整理網頁。

### 整體原則

步驟 6、8、9、12、13 都遵守同一個原則：**先修改陣列，再根據陣列重新畫出畫面。** 這樣畫面上的內容一定和資料一致，網頁也不需要重新整理。
