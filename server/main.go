package main

import (
	"log"
	"net/http"
	"os"
)

func main() {

	mux := http.NewServeMux()

	files := http.FileServer(http.Dir("."))
	for _, p := range []string{"/css/", "/html/", "/js/", "/images/"} {
		mux.Handle(p, files)
	}

	mux.HandleFunc("/{$}", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/html//index.html", http.StatusFound)
	})

	if os.Getenv("MIDTRANS_SERVER_KEY") == "" || os.Getenv("MIDTRANS_CLIENT_KEY") == "" {
		log.Fatal("set MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY first")
	}

	mux.HandleFunc("GET /api/config", handleConfig)
	mux.HandleFunc("GET /api/status",handleStatus)
	mux.HandleFunc("GET /api/products",handleProducts)
	mux.HandleFunc("POST /api/checkout", handleCheckout)

	log.Println("V-Phone is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))

}
