package utils

import (
	"fmt"
	"os/exec"
	"time"
)

func executeLogCommand(args ...string) ([]byte, time.Time, error) {
	logBinary, err := exec.LookPath("log")
	if err != nil {
		return nil, time.Time{}, fmt.Errorf("Failed to get log binary path: %v", err)
	}
	cmd := exec.Command(logBinary, args...)

	output, err := cmd.Output()
	if err != nil {
		return nil, time.Time{}, fmt.Errorf("Failed to execute log command %v", err)
	}

	return output, time.Now(), nil
}

func GetRecentLogs(last string) ([]byte, time.Time, error) {
	output, fetchedAt, err := executeLogCommand("show", "--last", last, "--style", "json", "--info", "--debug")

	if err != nil {
		return nil, time.Time{}, fmt.Errorf("Failed to get logs from last %s: %v", last, err)
	}
	return output, fetchedAt, nil
}