package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"time"
)

var orderIDPattern = regexp.MustCompile(`^VPHONE-\d+$`)

const statusURL = "https://api.sandbox.midtrans.com/v2/%s/status"

type midtransStatus struct {
	StatusCode        string `json:"status_code"`
	TransactionStatus string `json:"transaction_status"`
	FraudStatus       string `json:"fraud_status"`
	PaymentType       string `json:"payment_type"`
	GrossAmount       string `json:"gross_amount"`
}

func toResult(s midtransStatus) string {
	switch s.TransactionStatus {
	case "settlement":
		return "success"
	case "capture":
		if s.FraudStatus == "accept" || s.FraudStatus == "" {
			return "success"
		}
		return "pending"
	case "pending", "authorize":
		return "pending"
	default:
		return "error"
	}
}

func handleStatus(w http.ResponseWriter, r *http.Request) {
	orderID := r.URL.Query().Get("order_id")
	if !orderIDPattern.MatchString(orderID) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid order_id"})
		return
	}

	req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf(statusURL, url.PathEscape(orderID)), nil)
	req.SetBasicAuth(os.Getenv("MIDTRANS_SERVER_KEY"), "")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("midtrans status request failed:", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "payment provider unreachable"})
		return
	}
	defer resp.Body.Close()

	var ms midtransStatus
	json.NewDecoder(resp.Body).Decode(&ms)

	if resp.StatusCode == http.StatusNotFound || ms.StatusCode == "404" {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "order not found"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"order_id":           orderID,
		"result":             toResult(ms),
		"transaction_status": ms.TransactionStatus,
		"payment_type":       ms.PaymentType,
		"gross_amount":       ms.GrossAmount,
	})
}
