package logs

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"slices"
	"time"

	"github.com/RyanWatson425/logging-dashboard/utils"
)

type Frame struct {
	ImageOffset int `json:"imageOffset"`
	ImageUUID string `json:"imageUUID"`
}

type Backtrace struct {
	Frames []Frame `json:"frames"`
}

type Log struct {
	TimezoneName string `json:"timezoneName"`
	MessageType string `json:"messageType"`
	EventType string `json:"eventType"`
	Source *string `json:"source"`
	FormatString string `json:"formatString"`
	UserID uint64 `json:"userID"`
	ActivityIdentifier uint64 `json:"activityIdentifier"`
	Subsystem string `json:"subsystem"`
	Category string `json:"category"`
	ThreadID uint64 `json:"threadID"`
	SenderImageUUID string `json:"senderImageUUID"`
	Backtrace Backtrace `json:"backtrace"`
	BootUUID string `json:"bootUUID"`
	ProcessImagePath string `json:"processImagePath"`
	SenderImagePath string `json:"senderImagePath"`
	Timestamp string `json:"timestamp"`
	MachTimestamp uint64 `json:"machTimestamp"`
	EventMessage string `json:"eventMessage"`
	ProcessImageUUID string `json:"processImageUUID"`
	TraceID uint64 `json:"traceID"`
	ProcessID uint64 `json:"processID"`
	SenderProgramCounter uint64 `json:"senderProgramCounter"`
	ParentActivityIdentifier uint64 `json:"parentActivityIdentifier"`
}

type LogSummary struct {
	MessageType string // enum ["", "Info", "Error", "Default", "Debug"]
	Timestamp string // YYYY-MM-DD HH:MM:SS.mmmmmm[+_]ZZZZ
	EventMessage string // readable log content
	Subsystem string // system component (ex. com.apple.bluetooth)
	Category string // activity type (ex. connection, Plugin)
	ProcessID uint64 // which process generated the log
	ProcessImagePath string // human readable app name (ex. /usr/libexec/bluetoothd)
	UserID uint64 // 0 root user, 1-499 system/daemon users, 501-999 human users, 1000+ Network/Mobile/Active Directory accounts
}

func LogToLogSummary(logs []Log) []LogSummary {
	retVal := make([]LogSummary, len(logs))
	for i, log := range logs {
		retVal[i] = LogSummary{
			MessageType: log.MessageType,
			Timestamp: log.Timestamp,
			EventMessage: log.EventMessage,
			Subsystem: log.Subsystem,
			Category: log.Category,
			ProcessID: log.ProcessID,
			ProcessImagePath: log.ProcessImagePath,
			UserID: log.UserID,
		}
	}
	return retVal
}

func filterLogLevels(logs []LogSummary, logLevels []string) []LogSummary {
	filteredLogs := []LogSummary{}
	for _, log := range logs {
		if slices.Contains(logLevels, log.MessageType) {
			filteredLogs = append(filteredLogs, log)
		}
	}

	return filteredLogs
}

func fetchLogs(shouldRefresh bool) ([]LogSummary, time.Time, error) {
	currentLogs := GetLogs()
	if currentLogs == nil || shouldRefresh {
		marshalledLogs, fetchedAt, err := utils.GetRecentLogs("15s")

		if err != nil {
			return nil, time.Time{}, fmt.Errorf("Failed to call GetRecentLogs: %v", err)
		}

		var logs []Log
		err = json.Unmarshal(marshalledLogs, &logs)
		if err != nil {
			return nil, time.Time{}, fmt.Errorf("Failed to unmarshal logs: %v", err)
		}

		currentLogs = LogToLogSummary(logs)
		SetLogs(currentLogs, fetchedAt)
	}

	return currentLogs, GetFetchedAt(), nil
}


func HandleGetLogs(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, fmt.Sprintf("Method %s is not supported ", r.Method), http.StatusMethodNotAllowed)
		return
	}

	parsedUrl, err := url.Parse(r.URL.String())
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to parse query params: %v", err), http.StatusBadRequest)
		return
	}
	queryParamsMap := parsedUrl.Query()

	shouldRefresh := false
	if queryParamsMap.Has("shouldRefresh") {
		shouldRefresh = true
	}
	summarizedLogs, fetchedAt, err := fetchLogs(shouldRefresh)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to call fetchLogs: %v", err), http.StatusInternalServerError)
	}

	if queryParamsMap.Has("logLevels") {
		var logLevels []string
		err := json.Unmarshal([]byte(queryParamsMap.Get("logLevels")), &logLevels)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to unmarhsal logLevels query parameter: %v", err), http.StatusBadRequest)
		}
		summarizedLogs = filterLogLevels(summarizedLogs, logLevels)
	}

	returnBody := struct{ FetchedAt time.Time `json:"fetchedAt"`; Logs []LogSummary `json:"logs"` }{ FetchedAt: fetchedAt, Logs: summarizedLogs }

	jsonReturnBody, err := json.MarshalIndent(returnBody, "", "  ")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to marshal HandleGetLogs return body: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonReturnBody)
}