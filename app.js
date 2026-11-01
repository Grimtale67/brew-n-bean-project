/* ==========================================================
   Brew & Bean — Café POS System
   Vanilla JavaScript (no frameworks, no backend)

   GOLDEN RULE OF THIS PROGRAM:
   The arrays (menu and currentOrder) are the "source of truth".
   Every time something changes we update the ARRAY first,
   then call a render function to redraw the screen from it.
   ========================================================== */


/* ==========================================================
   1. DATA (arrays and objects)
   ========================================================== */

// Purpose: Builds a small drink picture (SVG) and returns it as an image URL.
// We draw the pictures ourselves so they always load and never show as broken images.
function createDrinkImage(liquidColor, cupType, hasCream) {
  let cup = "";

  if (cupType === "iced") {
    // Tall glass with ice cubes and a straw
    cup =
      '<line x1="175" y1="30" x2="160" y2="150" stroke="#c9553d" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M105 60 L195 60 L186 182 Q150 192 114 182 Z" fill="#ffffff" fill-opacity="0.65" stroke="#d9cbb8" stroke-width="3"/>' +
      '<path d="M109 90 L191 90 L184 178 Q150 187 116 178 Z" fill="' + liquidColor + '"/>' +
      '<rect x="122" y="96" width="26" height="26" rx="5" fill="#ffffff" fill-opacity="0.55" transform="rotate(12 135 109)"/>' +
      '<rect x="152" y="112" width="26" height="26" rx="5" fill="#ffffff" fill-opacity="0.5" transform="rotate(-10 165 125)"/>' +
      '<rect x="128" y="132" width="24" height="24" rx="5" fill="#ffffff" fill-opacity="0.45" transform="rotate(6 140 144)"/>';
  } else {
    // Hot mug with a handle and steam
    cup =
      '<path d="M120 28 Q112 44 122 58 M150 22 Q142 40 152 56 M180 28 Q172 44 182 58" stroke="#c9b8a2" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M198 100 Q232 100 232 130 Q232 160 198 160" stroke="#ffffff" stroke-width="12" fill="none"/>' +
      '<rect x="84" y="82" width="120" height="104" rx="20" fill="#ffffff" stroke="#d9cbb8" stroke-width="3"/>' +
      '<ellipse cx="144" cy="92" rx="52" ry="10" fill="' + liquidColor + '"/>';
  }

  if (hasCream) {
    // A little whipped-cream swirl on top
    cup += '<ellipse cx="150" cy="70" rx="38" ry="14" fill="#ffffff" stroke="#eadfce" stroke-width="2"/>' +
           '<ellipse cx="150" cy="60" rx="22" ry="10" fill="#ffffff" stroke="#eadfce" stroke-width="2"/>';
  }

  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 225">' +
    '<rect width="300" height="225" fill="#f3e9dc"/>' +
    '<ellipse cx="150" cy="198" rx="85" ry="10" fill="#000000" fill-opacity="0.08"/>' +
    cup +
    '</svg>';

  // Turn the SVG text into a URL that an <img> tag can use
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// The menu array: each drink is an object with id, name, category, price and image
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

// The current order: starts empty. Each item looks like { id, name, price, quantity }
let currentOrder = [];

// Which category filter is selected right now
let selectedCategory = "All";

// The next order number (goes up by 1 after each checkout)
let orderCounter = 1001;

// The biggest quantity allowed for one drink
const MAX_QUANTITY = 99;

// Remembers what to do if the user presses "Yes" in the confirm window
let pendingConfirmAction = null;


/* ==========================================================
   2. GRAB HTML ELEMENTS (so we can use them in functions)
   ========================================================== */

const productGrid = document.getElementById("productGrid");
const categoryFilters = document.getElementById("categoryFilters");
const orderItems = document.getElementById("orderItems");
const orderCount = document.getElementById("orderCount");
const subtotalAmount = document.getElementById("subtotalAmount");
const totalAmount = document.getElementById("totalAmount");
const clearOrderBtn = document.getElementById("clearOrderBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const menuTableBody = document.getElementById("menuTableBody");

const receiptModal = document.getElementById("receiptModal");
const receiptBody = document.getElementById("receiptBody");
const newOrderBtn = document.getElementById("newOrderBtn");

const confirmModal = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmYesBtn = document.getElementById("confirmYesBtn");
const confirmNoBtn = document.getElementById("confirmNoBtn");

const toastContainer = document.getElementById("toastContainer");


/* ==========================================================
   3. HELPER FUNCTIONS
   ========================================================== */

// Purpose: Turns a number into a price string like "NT$1,200" so all prices look the same.
function formatCurrency(amount) {
  return "NT$" + amount.toLocaleString("en-US");
}

// Purpose: Shows a small friendly message in the corner of the screen for 2.5 seconds.
// The type can be "success", "error", "warning" or "info" (it changes the color).
function showToast(message, type) {
  const toast = document.createElement("div"); // create a new element
  toast.className = "toast " + type;
  toast.textContent = message;
  toastContainer.appendChild(toast); // add it to the page

  // Remove the toast after 2.5 seconds
  setTimeout(function () {
    toast.remove();
  }, 2500);
}

// Purpose: Makes a modal window visible by removing the "hidden" CSS class.
function openModal(modalElement) {
  modalElement.classList.remove("hidden");
}

// Purpose: Hides a modal window by adding the "hidden" CSS class.
function closeModal(modalElement) {
  modalElement.classList.add("hidden");
}

// Purpose: Opens the confirm window with a question. If the user presses "Yes",
// the function we passed in (onConfirm) is run.
function showConfirm(message, onConfirm) {
  confirmMessage.textContent = message;
  pendingConfirmAction = onConfirm; // remember what to do on "Yes"
  openModal(confirmModal);
}

// Purpose: Switches between the POS, Menu and About pages without reloading the browser.
function showView(viewName) {
  const allViews = document.querySelectorAll(".view");
  allViews.forEach(function (view) {
    // Show the view whose id matches, hide all the others
    if (view.id === "view-" + viewName) {
      view.classList.remove("hidden");
    } else {
      view.classList.add("hidden");
    }
  });

  // Highlight the matching sidebar button
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(function (button) {
    if (button.dataset.view === viewName) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}


/* ==========================================================
   4. RENDER FUNCTIONS (draw the screen from the arrays)
   ========================================================== */

// Purpose: Draws the product cards on the screen using the menu array,
// showing only the drinks that match the selected category.
function renderMenu() {
  let visibleProducts;

  // Conditional: "All" shows everything, otherwise filter by category
  if (selectedCategory === "All") {
    visibleProducts = menu;
  } else {
    visibleProducts = menu.filter(function (product) {
      return product.category === selectedCategory; // keep only matching drinks
    });
  }

  // If nothing matches, show a friendly note
  if (visibleProducts.length === 0) {
    productGrid.innerHTML = '<p class="empty-note">No drinks in this category yet.</p>';
    return;
  }

  // Turn each product object into a block of HTML, then join them together
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
}

// Purpose: Highlights the category button that is currently selected.
function renderCategoryButtons() {
  const buttons = categoryFilters.querySelectorAll(".filter-btn");
  buttons.forEach(function (button) {
    if (button.dataset.category === selectedCategory) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

// Purpose: Draws the current order list and updates the item count and totals from the currentOrder array.
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

// Purpose: Fills the Menu page table from the menu array.
function renderMenuTable() {
  menuTableBody.innerHTML = menu.map(function (product) {
    return `
      <tr>
        <td><img class="menu-thumb" src="${product.image}" alt="${product.name}" /></td>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td class="right">${formatCurrency(product.price)}</td>
      </tr>
    `;
  }).join("");
}


/* ==========================================================
   5. ORDER FUNCTIONS (change the array, then re-render)
   ========================================================== */

// Purpose: Adds a drink to the order. If it is already there, it only increases the quantity.
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

// Purpose: Changes a drink's quantity by +1 or -1 and never allows it to go below 1 or above the maximum.
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

// Purpose: Removes one drink from the order completely.
function removeFromOrder(productId) {
  // filter() keeps every item EXCEPT the one we want to remove
  currentOrder = currentOrder.filter(function (item) {
    return item.id !== productId;
  });

  renderOrder();
  showToast("Item removed.", "info");
}

// Purpose: Asks the user to confirm before clearing the order (so nothing is deleted by accident).
function clearOrder() {
  // Conditional: nothing to clear if the order is already empty
  if (currentOrder.length === 0) {
    showToast("The order is already empty.", "info");
    return;
  }

  showConfirm("This will remove all drinks from the current order.", emptyOrder);
}

// Purpose: Actually empties the order array and updates the screen (runs after the user confirms).
function emptyOrder() {
  currentOrder = [];
  renderOrder();
  showToast("Order cleared.", "info");
}

// Purpose: Adds up price x quantity for every item in the order and returns the total.
function calculateTotal() {
  // reduce() starts at 0 and adds each item's line total
  return currentOrder.reduce(function (sum, item) {
    return sum + item.price * item.quantity;
  }, 0);
}

// Purpose: Counts how many drinks are in the order in total (adds up all quantities).
function calculateItemCount() {
  return currentOrder.reduce(function (count, item) {
    return count + item.quantity;
  }, 0);
}


/* ==========================================================
   6. CHECKOUT AND RECEIPT
   ========================================================== */

// Purpose: Finishes the order: checks it is not empty, shows the receipt, then resets the order.
function checkout() {
  // Error handling: do not allow checkout with an empty order
  if (currentOrder.length === 0) {
    showToast("Your order is empty. Please add a drink first.", "warning");
    return;
  }

  try {
    // Save everything the receipt needs in one object
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
  } catch (error) {
    // If anything unexpected goes wrong, show a message instead of crashing
    console.error(error);
    showToast("Something went wrong during checkout. Please try again.", "error");
  }
}

// Purpose: Builds the receipt HTML (order number, date, items, total) and puts it in the receipt window.
function renderReceipt(receipt) {
  // Build one line for each purchased drink
  const lines = receipt.items.map(function (item) {
    return `
      <div class="receipt-line">
        <span>${item.name}</span>
        <span class="amount">${formatCurrency(item.price * item.quantity)}</span>
        <span class="sub">${item.quantity} × ${formatCurrency(item.price)}</span>
      </div>
    `;
  }).join("");

  receiptBody.innerHTML = `
    <div class="receipt-meta">
      <div><span>Order No.</span><strong>#${receipt.orderNumber}</strong></div>
      <div><span>Date &amp; Time</span><span>${receipt.dateTime.toLocaleString()}</span></div>
    </div>
    ${lines}
    <div class="receipt-total">
      <span>Total</span>
      <span>${formatCurrency(receipt.total)}</span>
    </div>
  `;
}

// Purpose: Closes the receipt so the cashier can start serving the next customer.
function startNewOrder() {
  closeModal(receiptModal);
  showToast("Ready for a new order!", "success");
}


/* ==========================================================
   7. EVENT LISTENERS
   ========================================================== */

// Purpose: Connects all buttons on the page to the functions above.
function setupEventListeners() {
  // Sidebar navigation: each button has data-view="pos" / "menu" / "about"
  document.querySelectorAll(".nav-btn").forEach(function (button) {
    button.addEventListener("click", function () {
      showView(button.dataset.view);
    });
  });

  // Category filters: change the selected category, then redraw
  categoryFilters.addEventListener("click", function (event) {
    const button = event.target.closest(".filter-btn");
    if (!button) {
      return; // the click was not on a filter button
    }
    selectedCategory = button.dataset.category;
    renderCategoryButtons();
    renderMenu();
  });

  // "Add" buttons: one listener on the grid handles every card (event delegation)
  productGrid.addEventListener("click", function (event) {
    const button = event.target.closest(".add-btn");
    if (!button) {
      return;
    }
    addToOrder(Number(button.dataset.id)); // data-id is text, so convert to a number
  });

  // Order list buttons: +, -, and Remove
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

  clearOrderBtn.addEventListener("click", clearOrder);
  checkoutBtn.addEventListener("click", checkout);
  newOrderBtn.addEventListener("click", startNewOrder);

  // Confirm window buttons
  confirmYesBtn.addEventListener("click", function () {
    closeModal(confirmModal);
    if (pendingConfirmAction) {
      pendingConfirmAction(); // run the action that was waiting for confirmation
      pendingConfirmAction = null;
    }
  });

  confirmNoBtn.addEventListener("click", function () {
    closeModal(confirmModal);
    pendingConfirmAction = null; // forget the action: nothing is deleted
  });
}


/* ==========================================================
   8. START THE APP
   ========================================================== */

// Purpose: Runs once when the page loads: draws everything and connects the buttons.
function init() {
  renderMenu();
  renderMenuTable();
  renderOrder();
  setupEventListeners();
}

init();
