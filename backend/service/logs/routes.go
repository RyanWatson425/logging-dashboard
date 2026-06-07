package logs

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"slices"
	"strconv"
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

func filterLogs(logs []LogSummary, logLevels []string, processes []uint64) []LogSummary {
	shouldFilterLevels := len(logLevels) > 0
	shouldFilterProcesses := len(processes) > 0
	if !shouldFilterLevels && !shouldFilterProcesses {
		return logs
	}

	shouldRetainLogLevel := func (log LogSummary) bool {
		if !shouldFilterLevels || slices.Contains(logLevels, log.MessageType) {
			return true
		}
		return false
	}
	shouldRetainProcess := func (log LogSummary) bool {
		if !shouldFilterProcesses || slices.Contains(processes, log.ProcessID) {
			return true
		}
		return false
	}

	filteredLogs := []LogSummary{}
	for _, log := range logs {
		if log.MessageType != "" && shouldRetainLogLevel(log) && shouldRetainProcess(log) {
			filteredLogs = append(filteredLogs, log)
		}
	}

	return filteredLogs
}

type LogQueryParams struct {
	Page int
	PageSize int
	LogLevels []string
	shouldRefresh bool
	processes []uint64
}

func fetchLogs(queryParams LogQueryParams) ([]LogSummary, time.Time, error) {
	currentLogs := GetLogs()
	// Fetch raw logs
	if currentLogs == nil || queryParams.shouldRefresh {
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

	// Filter by query params
	currentLogs = filterLogs(currentLogs, queryParams.LogLevels, queryParams.processes)

	// Handle pagination
	pageStartIdx := queryParams.PageSize * queryParams.Page
	pageEndIdx := queryParams.PageSize + queryParams.PageSize * queryParams.Page
	if len(currentLogs) < pageStartIdx {
		currentLogs = make([]LogSummary, 0)
	} else if len(currentLogs) > pageStartIdx && len(currentLogs) <= pageEndIdx {
		currentLogs = currentLogs[pageStartIdx:]
	} else {
		currentLogs = currentLogs[pageStartIdx:pageEndIdx]
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
	currentPage := 0
	if queryParamsMap.Has("page") {
		currentPage, err = strconv.Atoi(queryParamsMap.Get("page"))
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to convert page query parameter to int: %v", err), http.StatusBadRequest)
		}
	}
	logLevels := make([]string, 0)
	if queryParamsMap.Has("logLevels") {
		err := json.Unmarshal([]byte(queryParamsMap.Get("logLevels")), &logLevels)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to unmarshal logLevels query parameter: %v", err), http.StatusBadRequest)
		}
	}
	processes := make([]uint64, 0)
	if queryParamsMap.Has("processes") {
		err := json.Unmarshal([]byte(queryParamsMap.Get("processes")), &processes)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to unmarshal processes query parameter: %v", err), http.StatusBadRequest)
		}
	}
	queryParams := LogQueryParams{
		Page: currentPage,
		PageSize: 20,
		LogLevels: logLevels,
		shouldRefresh: shouldRefresh,
		processes: processes,
	}
	summarizedLogs, fetchedAt, err := fetchLogs(queryParams)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to call fetchLogs: %v", err), http.StatusInternalServerError)
	}

	// if queryParamsMap.Has("logLevels") {
	// 	var logLevels []string
	// 	err := json.Unmarshal([]byte(queryParamsMap.Get("logLevels")), &logLevels)
	// 	if err != nil {
	// 		http.Error(w, fmt.Sprintf("Failed to unmarhsal logLevels query parameter: %v", err), http.StatusBadRequest)
	// 	}
	// 	summarizedLogs = filterLogLevels(summarizedLogs, logLevels)
	// }

	returnBody := struct{ FetchedAt time.Time `json:"fetchedAt"`; Data []LogSummary `json:"data"` }{ FetchedAt: fetchedAt, Data: summarizedLogs }

	jsonReturnBody, err := json.MarshalIndent(returnBody, "", "  ")
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to marshal HandleGetLogs return body: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonReturnBody)
}