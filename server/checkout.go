package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

type Product struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Price int64  `json:"price"`
	Image string `json:"image"`
}

var catalog = []Product{
	{"pro-x", "V-Phone Pro X", 14399000, "/images/phone1.jpg"},
	{"pro", "V-Phone Pro", 11199000, "/images/phone2.jpg"},
	{"pixel", "V-Phone Pixel", 12799000, "/images/phone3.jpg"},
	{"pixel-lite", "V-Phone Pixel Lite", 9599000, "/images/phone4.jpg"},
	{"lite", "V-Phone Lite", 6399000, "/images/phone5.jpg"},
	{"essential", "V-Phone Essential", 3999000, "/images/phone6.jpg"},
}

var products = func() map[string]Product {
	m := make(map[string]Product, len(catalog))
	for _, p := range catalog {
		m[p.ID] = p
	}
	return m
}()

const (
	snapURL       = "https://app.sandbox.midtrans.com/snap/v1/transactions"
	maxPerProduct = 5
	maxLines      = 10
)

type cartItem struct {
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type checkoutRequest struct {
	Items []cartItem `json:"items"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func handleConfig(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"client_key": os.Getenv("MIDTRANS_CLIENT_KEY"),
	})
}

func handleProducts(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, catalog)
}

func handleCheckout(w http.ResponseWriter, r *http.Request) {
	var req checkoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}
	if len(req.Items) == 0 || len(req.Items) > maxLines {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "cart is empty or too large"})
		return
	}

	qty := map[string]int{}
	var order []string
	for _, it := range req.Items {
		if _, ok := products[it.ProductID]; !ok {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "unknown product: " + it.ProductID})
			return
		}
		if it.Quantity < 1 {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "quantity must be at least 1"})
			return
		}
		if _, seen := qty[it.ProductID]; !seen {
			order = append(order, it.ProductID)
		}
		qty[it.ProductID] += it.Quantity
		if qty[it.ProductID] > maxPerProduct {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": fmt.Sprintf("max %d per product", maxPerProduct)})
			return
		}
	}

	var total int64
	items := make([]map[string]any, 0, len(order))
	for _, id := range order {
		p := products[id]
		q := qty[id]
		total += p.Price * int64(q)
		items = append(items, map[string]any{
			"id":       p.ID,
			"name":     p.Name,
			"price":    p.Price,
			"quantity": q,
		})
	}

	orderID := fmt.Sprintf("VPHONE-%d", time.Now().UnixNano())
	payload := map[string]any{
		"transaction_details": map[string]any{
			"order_id":     orderID,
			"gross_amount": total,
		},
		"item_details": items,
	}
	body, _ := json.Marshal(payload)

	mreq, _ := http.NewRequest(http.MethodPost, snapURL, bytes.NewReader(body))
	mreq.SetBasicAuth(os.Getenv("MIDTRANS_SERVER_KEY"), "")
	mreq.Header.Set("Content-Type", "application/json")
	mreq.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(mreq)
	if err != nil {
		log.Println("midtrans request failed:", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "payment provider unreachable"})
		return
	}
	defer resp.Body.Close()

	var out struct {
		Token         string   `json:"token"`
		ErrorMessages []string `json:"error_messages"`
	}
	json.NewDecoder(resp.Body).Decode(&out)

	if resp.StatusCode >= 300 || out.Token == "" {
		log.Printf("midtrans error (HTTP %d): %v", resp.StatusCode, out.ErrorMessages)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "could not create transaction"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"token": out.Token, "order_id": orderID})
}
