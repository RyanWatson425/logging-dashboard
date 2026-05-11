package api

import (
	"fmt"
	"net/http"
	"os"

	"github.com/RyanWatson425/logging-dashboard/service/logs"
)

func Serve() {
	mux := http.NewServeMux()
	mux.HandleFunc("/logs", logs.HandleGetLogs)

	fmt.Printf("listening on %s\n", "localhost:8080")
	if err := http.ListenAndServe("localhost:8080", mux); err != nil {
		fmt.Fprintf(os.Stderr, "error listening and serving: %s\n", err)
	}
}