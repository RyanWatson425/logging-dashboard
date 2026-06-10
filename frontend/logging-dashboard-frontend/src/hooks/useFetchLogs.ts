import axios from "axios";
import { useRef, useCallback, useState, useEffect } from "react";

//  MessageType string // enum ["", "Info", "Error", "Default", "Debug"]
// 	Timestamp string // YYYY-MM-DD HH:MM:SS.mmmmmm[+_]ZZZZ
// 	EventMessage string // readable log content
// 	Subsystem string // system component (ex. com.apple.bluetooth)
// 	Category string // activity type (ex. connection, Plugin)
// 	ProcessID uint64 // which process generated the log
// 	ProcessImagePath string // human readable app name (ex. /usr/libexec/bluetoothd)
// 	UserID uint64 // 0 root user, 1-499 syst
export type MessageType = "Info" | "Error" | "Default" | "Debug";

export interface Logs {
  messageType: MessageType;
  eventMessage: string;
  timestamp: string;
  subsystem: string;
  category: string;
  processId: number;
  processImagePath: string;
  userId: number;
}

export interface GetLogsResponse {
  fetchedAt: string;
  data: {
    MessageType: MessageType;
    EventMessage: string;
    Timestamp: string;
    Subsystem: string;
    Category: string;
    ProcessId: number;
    ProcessImagePath: string;
    UserID: number;
  }[];
}

export interface UseFetchLogsParams {
  limit?: number;
  processes?: string[];
  logLevels?: MessageType[];
  shouldRefresh?: boolean;
  signal?: AbortSignal;
  search?: string;
}

export interface FetchLogsResult {
  rows: Logs[];
  hasMore: boolean;
  page: number;
}

const useFetchLogs = ({
  limit = 50,
  processes,
  logLevels,
  shouldRefresh,
  signal,
  search,
}: UseFetchLogsParams) => {
  const currentPage = useRef<number>(0);
  const stringifiedParams = JSON.stringify({
    limit,
    processes,
    logLevels,
    shouldRefresh,
    search,
  });
  const currentOptions = useRef<string>(stringifiedParams);
  const [rows, setRows] = useState<Logs[]>([]);
  const [hasMore, setHasMore] = useState(true);

  if (stringifiedParams !== currentOptions.current) {
    currentOptions.current = stringifiedParams;
    currentPage.current = 0;
    setRows([]);
  }

  const fetchLogs = useCallback(async () => {
    const page = currentPage.current;
    currentPage.current += 1;
    const url = new URL("http://localhost:8080/logs");

    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(limit));

    if (processes) {
      url.searchParams.set("processes", JSON.stringify(processes));
    }
    if (logLevels) {
      url.searchParams.set("logLevels", JSON.stringify(logLevels));
    }
    if (shouldRefresh) {
      url.searchParams.set("shouldRefresh", String(shouldRefresh));
    }
    if (search.length > 0) {
      url.searchParams.set("search", search);
    }

    const response = await axios.get<GetLogsResponse>(url.toString(), {
      signal,
    });

    const formattedLogs: Logs[] = response.data.data.map((responseLog) => ({
      messageType: responseLog.MessageType,
      eventMessage: responseLog.EventMessage,
      timestamp: responseLog.Timestamp,
      subsystem: responseLog.Subsystem,
      category: responseLog.Category,
      processId: responseLog.ProcessId,
      processImagePath: responseLog.ProcessImagePath,
      userId: responseLog.UserID,
    }));

    // Determine if there are more pages based on whether we received a full page
    setHasMore(formattedLogs.length === limit);
    setRows((prev) => [...prev, ...formattedLogs]);
    setHasMore(formattedLogs.length === limit);
  }, [
    limit,
    JSON.stringify(processes),
    JSON.stringify(logLevels),
    shouldRefresh,
    search,
  ]);

  useEffect(() => {
    currentPage.current = 0;
    setRows([]);
    setHasMore(true);
  }, [limit, processes, logLevels, shouldRefresh, search]);

  return {
    rows,
    hasMore,
    fetchLogs,
  };
};

export default useFetchLogs;
