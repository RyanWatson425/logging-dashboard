package main

import (
	"encoding/json"
	"fmt"

	"github.com/RyanWatson425/logging-dashboard/utils"
)

// {
//   "timezoneName" : "",
//   "messageType" : "Default",
//   "eventType" : "logEvent",
//   "source" : null,
//   "formatString" : "[%@] Dispatching digitizer event with %lu children,%@ _eventMask=0x%lx _childEventMask=0x%lx Cancel=%d Touching=%ld inRange=%ld",
//   "userID" : 88,
//   "activityIdentifier" : 0,
//   "subsystem" : "com.apple.Multitouch",
//   "category" : "Plugin",
//   "threadID" : 46308219,
//   "senderImageUUID" : "13B9BBE0-A09C-31A3-8812-6FCA5CC5066A",
//   "backtrace" : {
//     "frames" : [
//       {
//         "imageOffset" : 177920,
//         "imageUUID" : "13B9BBE0-A09C-31A3-8812-6FCA5CC5066A"
//       }
//     ]
//   },
//   "bootUUID" : "A11698FE-2303-48AD-A8C0-18D1B9380C34",
//   "processImagePath" : "\/System\/Library\/PrivateFrameworks\/SkyLight.framework\/Versions\/A\/Resources\/WindowServer",
//   "senderImagePath" : "\/System\/Library\/HIDPlugins\/ServicePlugins\/HSTouchHIDService.plugin\/Contents\/MacOS\/HSTouchHIDService",
//   "timestamp" : "2026-05-07 19:48:34.701580-0500",
//   "machTimestamp" : 88435680572874,
//   "eventMessage" : "[TP] Dispatching digitizer event with 2 children, _eventMask=0x2 _childEventMask=0x2 Cancel=0 Touching=0 inRange=1",
//   "processImageUUID" : "4C4CDB5D-365C-32AF-BAFD-F68C76A4F625",
//   "traceID" : 5073052195487748,
//   "processID" : 453,
//   "senderProgramCounter" : 177920,
//   "parentActivityIdentifier" : 0
// }

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
	MessageType string
	UserID uint64
	Timestamp string
	Message string
	ProcessID uint64
}

func LogToLogSummary(logs []Log) []LogSummary {
	retVal := make([]LogSummary, len(logs))
	for i, log := range logs {
		retVal[i] = LogSummary{
			MessageType: log.MessageType,
			UserID: log.UserID,
			Timestamp: log.Timestamp,
			Message: log.EventMessage,
			ProcessID: log.ProcessID,
		}
	}
	return retVal
}

func main() {
	marshalledLogs, err := utils.GetRecentLogs("15s")

	if err != nil {
		fmt.Printf("Failed to call GetRecentLogs: %v", err)
	}

	var logs []Log
	err = json.Unmarshal(marshalledLogs, &logs)

	if err != nil {
		fmt.Printf("Failed to marshal logs: %v", err)
	}

	summarizedLogs := LogToLogSummary(logs)
	fmt.Println("Marshalled Logs")
	fmt.Println(string(marshalledLogs))
	fmt.Println("JSON Logs")
	fmt.Println(logs)
	fmt.Println("Summarized Logs")
	// TOOD: marshall back to get in printable format
	fmt.Println(summarizedLogs)
}