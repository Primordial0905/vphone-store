const hamburger = document.querySelector(".hamburger")
const navLeft = document.querySelector(".nav-left")
const navRight = document.querySelector(".nav-right")

// hamburger menu
if (hamburger) {
  hamburger.addEventListener("click", () => {
    navLeft.classList.toggle("active")
    navRight.classList.toggle("active")
    hamburger.classList.toggle("active")
  })
}

const slides = document.querySelectorAll(".slide")
const dots = document.querySelectorAll(".dot")
const prevBtn = document.querySelector(".prev-btn")
const nextBtn = document.querySelector(".next-btn")

let currentSlide = 0;

// slider
function updateSlide(index) {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === index);
    dots[i].classList.toggle("active", i === index);
  });
  currentSlide = index;
}

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => updateSlide(index));
});

if (prevBtn) {
  prevBtn.addEventListener("click", () => updateSlide((currentSlide - 1 + slides.length) % slides.length));
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => updateSlide((currentSlide + 1) % slides.length));
}

setInterval(() => {
  updateSlide((currentSlide + 1) % slides.length);
}, 5000);

const filterBtns = document.querySelectorAll(".filter-btn");
const productCards = document.querySelectorAll(".product-card");

// filter
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((btn) => btn.classList.remove("active"));
    btn.classList.add("active");

    const filter = btn.getAttribute("data-filter");

    productCards.forEach((card) => {
      card.style.display = (filter === "all" || card.getAttribute("data-category") === filter) ? "block" : "none";
    });
  });
});


// cart button

const CART_KEY = "vphone_cart";
const MAX_PER_ITEM = 5;
let snapLoading = null;

function loadSnap(){
  if (snapLoading) return snapLoading;
  snapLoading = fetch("/api/config")
  .then((res) => res.json())
  .then(
    ({client_key}) =>
      new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://app.sandbox.midtrans.com/snap/snap.js";
        s.setAttribute("data-client-key",client_key);
        s.onload = resolve;
        s.onerror = () => reject(new Error("Could not load Midtrans"));
        document.head.appendChild(s);
      })  
  );
  snapLoading.catch(() => {snapLoading = null;});
  return snapLoading;
}

function goToResult(status, orderId) {
  const q = new URLSearchParams({ status, order_id: orderId || "" });
  window.location.href = "/html/payment-result.html?" + q.toString();
}

function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY));
    return cart && typeof cart === "object" ? cart : {};
  } catch {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function cartCount() {
  return Object.values(getCart()).reduce((sum, q) => sum + q, 0);
}

function addToCart(productId) {
  const cart = getCart();
  cart[productId] = Math.min((cart[productId] || 0) + 1, MAX_PER_ITEM);
  saveCart(cart);
}

function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const n = cartCount();
  badge.textContent = n;
  badge.style.display = n > 0 ? "inline-block" : "none";
}

document.querySelectorAll(".buy-btn").forEach((button) => {
  button.addEventListener("click", () => {
    addToCart(button.dataset.id);

    const original = button.textContent;
    button.textContent = "Added ✓";
    button.disabled = true;
    setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
    }, 800);
  });
});

updateCartBadge();

// see password
const togglePasswordButtons = document.querySelectorAll(".toggle-password")
togglePasswordButtons.forEach((button) => {
  button.addEventListener("click", function () {
    const targetId = this.getAttribute("data-target")
    const passwordInput = document.getElementById(targetId)

    if (passwordInput.type === "password") {
      passwordInput.type = "text"
      this.classList.remove("fa-eye-slash")
      this.classList.add("fa-eye")
    } else {
      passwordInput.type = "password"
      this.classList.remove("fa-eye")
      this.classList.add("fa-eye-slash")
    }
  })
})
