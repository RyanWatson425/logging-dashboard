package utils

import (
	"fmt"
	"os/exec"
)

func executeLogCommand(args ...string) ([]byte, error) {
	logBinary, err := exec.LookPath("log")
	if err != nil {
		return nil, fmt.Errorf("Failed to get log binary path: %v", err)
	}
	cmd := exec.Command(logBinary, args...)

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("Failed to execute log command %v", err)
	}

	return output, nil
}

func GetRecentLogs(last string) (string, error) {
	output, err := executeLogCommand("show", "--last", last)
	if err != nil {
		return "", fmt.Errorf("Failed to get logs from last %s: %v", last, err)
	}
	return string(output), nil
}