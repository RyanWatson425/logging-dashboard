package main

import (
	"github.com/RyanWatson425/logging-dashboard/api"
)

// TODO: add query params support for length/sorting/filtering,
//       add pagination support
func main() {
	api.Serve()
}
