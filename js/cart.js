const loadingEl = document.getElementById("cart-loading");
const emptyEl = document.getElementById("cart-empty");
const contentEl = document.getElementById("cart-content");
const itemsEl = document.getElementById("cart-items");
const totalEl = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout-btn");

let catalog = {};

const rupiah = (n) => "Rp " + Number(n).toLocaleString("id-ID");


function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// drop unknown products and fix bad quantities.
function sanitizeCart() {
  const cart = getCart();
  const clean = {};
  for (const [id, q] of Object.entries(cart)) {
    const n = Math.min(Math.floor(Number(q)), MAX_PER_ITEM);
    if (catalog[id] && n >= 1) clean[id] = n;
  }
  if (JSON.stringify(clean) !== JSON.stringify(cart)) saveCart(clean);
  return clean;
}

function render() {
  const cart = sanitizeCart();
  const ids = Object.keys(cart);

  loadingEl.style.display = "none";
  emptyEl.style.display = ids.length ? "none" : "block";
  contentEl.style.display = ids.length ? "block" : "none";
  itemsEl.replaceChildren();

  let total = 0;
  ids.forEach((id) => {
    const p = catalog[id];
    const q = cart[id];
    total += p.price * q;

    const row = el("div", "cart-row");

    const img = el("img");
    img.src = p.image;
    img.alt = p.name;

    const info = el("div", "cart-info");
    info.append(el("div", "cart-name", p.name), el("div", "cart-unit", rupiah(p.price)));

    const qty = el("div", "cart-qty");
    const minus = el("button", null, "−");
    minus.dataset.action = "dec";
    minus.dataset.id = id;
    minus.disabled = q <= 1;
    minus.setAttribute("aria-label", "Decrease quantity");
    const plus = el("button", null, "+");
    plus.dataset.action = "inc";
    plus.dataset.id = id;
    plus.disabled = q >= MAX_PER_ITEM;
    plus.setAttribute("aria-label", "Increase quantity");
    qty.append(minus, el("span", null, String(q)), plus);

    const line = el("div", "cart-line-total", rupiah(p.price * q));

    const remove = el("button", "cart-remove");
    remove.dataset.action = "remove";
    remove.dataset.id = id;
    remove.setAttribute("aria-label", "Remove " + p.name);
    remove.append(el("i", "fas fa-trash"));

    row.append(img, info, qty, line, remove);
    itemsEl.append(row);
  });

  totalEl.textContent = rupiah(total);
}

itemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const cart = getCart();
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "inc") cart[id] = Math.min((cart[id] || 0) + 1, MAX_PER_ITEM);
  if (action === "dec") cart[id] = Math.max((cart[id] || 1) - 1, 1);
  if (action === "remove") delete cart[id];

  saveCart(cart);
  render();
});

checkoutBtn.addEventListener("click", async () => {
  const items = Object.entries(sanitizeCart()).map(([product_id, quantity]) => ({
    product_id,
    quantity,
  }));
  if (items.length === 0) return;

  const originalText = checkoutBtn.textContent;
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = "Loading...";

  try {
    await loadSnap();

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Checkout failed");

    localStorage.setItem("vphone_last_order", data.order_id);

    window.snap.pay(data.token, {
      onSuccess: () => goToResult("success", data.order_id),
      onPending: () => goToResult("pending", data.order_id),
      onError: () => goToResult("error", data.order_id),
      onClose: () => console.log("popup closed without finishing"),
    });
  } catch (err) {
    alert(err.message);
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = originalText;
  }
});

async function init() {
  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error();
    const list = await res.json();
    catalog = Object.fromEntries(list.map((p) => [p.id, p]));
    render();
  } catch {
    loadingEl.textContent = "Couldn't load the cart. Please refresh the page.";
  }
}

init();