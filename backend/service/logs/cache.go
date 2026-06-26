package logs

import (
	"sync"
	"time"
)

var	mu sync.RWMutex
var	logs []LogSummary
var logSubsystems []string
var	fetchedAt time.Time


func SetLogs(newLogs []LogSummary, mostRecentlyFetched time.Time) {
	mu.Lock()
	defer mu.Unlock()
	logs = newLogs
	logSubsystemsSet := make(map[string]struct{})
	newLogSubsystems := make([]string, 0)
	for _, log := range newLogs {
		if _, exists := logSubsystemsSet[log.Subsystem]; !exists && log.Subsystem != "" {
			logSubsystemsSet[log.Subsystem] = struct{}{}
			newLogSubsystems = append(newLogSubsystems, log.Subsystem)
		}
	}
	logSubsystems = newLogSubsystems
	fetchedAt = mostRecentlyFetched
}

func GetLogs() []LogSummary {
	mu.RLock()
	defer mu.RUnlock()
	return logs
}

func GetFetchedAt() time.Time {
	mu.RLock()
	defer mu.RUnlock()
	return fetchedAt
}

func GetLogSubsystems() []string {
	mu.RLock()
	defer mu.RUnlock()
	return logSubsystems
}