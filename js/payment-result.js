const params = new URLSearchParams(window.location.search);
const orderId = params.get("order_id"); // the ONLY thing we take from the URL

const states = {
  success: {
    icon: "fa-check-circle",
    title: "Payment successful",
    message: "Your payment was received. Your V-Phone is on its way!",
  },
  pending: {
    icon: "fa-clock",
    title: "Waiting for payment",
    message: "Your order is created. Finish the payment, then press \"Check again\".",
  },
  error: {
    icon: "fa-times-circle",
    title: "Payment failed",
    message: "The payment was declined, cancelled or expired. You can go back and try again.",
  },
  unknown: {
    icon: "fa-question-circle",
    title: "We couldn't confirm this order",
    message: "The order wasn't found, or we couldn't reach the payment provider.",
  },
};

const card = document.getElementById("result-card");
const icon = document.getElementById("result-icon");
const refreshBtn = document.getElementById("result-refresh");

function render(key, data) {
  const s = states[key];
  card.className = "result-card result-" + key;
  icon.className = "fas " + s.icon;

  document.getElementById("result-title").textContent = s.title;
  document.getElementById("result-message").textContent = s.message;
  document.getElementById("result-order").textContent = orderId || "-";
  document.getElementById("result-amount").textContent =
    data && data.gross_amount
      ? "Rp " + Number(data.gross_amount).toLocaleString("id-ID")
      : "-";
  refreshBtn.style.display = key === "pending" ? "inline-block" : "none";
}

async function checkStatus() {
  if (!orderId) {
    console.warn("No order_id in the URL");
    return render("unknown");
  }

  let data;
  try {
    const res = await fetch("/api/status?order_id=" + encodeURIComponent(orderId));
    console.log("status response:", res.status);
    if (!res.ok) return render("unknown");
    data = await res.json();
    console.log("status data:", data);
    render(data.result, data);
  } catch (err) {
    console.error("status check failed:", err);
    return render("unknown");
  }
  
  if (data.result === "success" && localStorage.getItem("vphone_last_order") === orderId) {
    try {
      saveCart({});
      localStorage.removeItem("vphone_last_order");
    } catch (err) {
      console.error("could not clear cart:", err);
    }
  }
}
refreshBtn.addEventListener("click", checkStatus);
checkStatus();