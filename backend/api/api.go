package api

import (
	"fmt"
	"net/http"
	"os"

	"github.com/RyanWatson425/logging-dashboard/service/logs"
)

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        // Add other CORS headers as needed
        next.ServeHTTP(w, r)
    })
}

func Serve() {
	mux := http.NewServeMux()
	mux.HandleFunc("/logs", corsMiddleware(logs.HandleGetLogs))

	fmt.Printf("listening on %s\n", "localhost:8080")
	if err := http.ListenAndServe("localhost:8080", mux); err != nil {
		fmt.Fprintf(os.Stderr, "error listening and serving: %s\n", err)
	}
}