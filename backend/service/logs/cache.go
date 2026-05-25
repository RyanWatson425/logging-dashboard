package logs

import (
	"sync"
	"time"
)

var	mu sync.RWMutex
var	logs []LogSummary
var	fetchedAt time.Time


func SetLogs(newLogs []LogSummary, mostRecentlyFetched time.Time) {
	mu.Lock()
	defer mu.Unlock()
	logs = newLogs
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