# V-Phone

A demo smartphone store with a cart and a simulated checkout using the
[Midtrans](https://midtrans.com) Snap sandbox. Frontend is plain HTML/CSS/JS;
the backend is a small Go server (standard library only).

## Features
- Product catalog and shopping cart (stored in the browser)
- Checkout for multiple items through Midtrans Snap
- Result page that verifies the real payment status with Midtrans
  (the server holds the price list and the Server Key; the browser never does)

## Run it
1. Get sandbox keys from the [Midtrans dashboard](https://dashboard.midtrans.com)
   (Sandbox environment → Settings → Access Keys).
2. Set them as environment variables:

   ```powershell
   # Windows PowerShell
   $env:MIDTRANS_SERVER_KEY="SB-Mid-server-..."
   $env:MIDTRANS_CLIENT_KEY="SB-Mid-client-..."
   ```
   ```bash
   # Linux / macOS
   export MIDTRANS_SERVER_KEY="SB-Mid-server-..."
   export MIDTRANS_CLIENT_KEY="SB-Mid-client-..."
   ```
3. From the project root (Go 1.22+):

   ```
   go run ./server
   ```
4. Open http://localhost:8080

## Test payments
Use the cards in Midtrans's sandbox testing docs, for example a successful
card `4811 1111 1111 1114`, expiry `12/30`, CVV `123`, OTP `112`.

> Sandbox only. No real money is charged.