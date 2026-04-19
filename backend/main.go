package main

import (
	"fmt"

	"github.com/RyanWatson425/logging-dashboard/utils"
)

func main() {
	logs, err := utils.GetRecentLogs(("5m"))
	if err != nil {
		fmt.Printf("Failed to call GetRecentLogs: %v", err)
	}
	fmt.Println(logs)
}