import axios from "axios";

//  MessageType string // enum ["", "Info", "Error", "Default", "Debug"]
// 	Timestamp string // YYYY-MM-DD HH:MM:SS.mmmmmm[+_]ZZZZ
// 	EventMessage string // readable log content
// 	Subsystem string // system component (ex. com.apple.bluetooth)
// 	Category string // activity type (ex. connection, Plugin)
// 	ProcessID uint64 // which process generated the log
// 	ProcessImagePath string // human readable app name (ex. /usr/libexec/bluetoothd)
// 	UserID uint64 // 0 root user, 1-499 syst
type MessageType = "" | "Info" | "Error" | "Default" | "Debug";

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

export interface FetchLogsParams {
  page?: number;
  limit?: number;
  processes?: string[];
  logLevels?: MessageType[];
  shouldRefresh?: boolean;
  signal?: AbortSignal;
}

export interface FetchLogsResult {
  rows: Logs[];
  hasMore: boolean;
  page: number;
}

export const fetchLogs = async ({
  page = 0,
  limit = 50,
  processes,
  logLevels,
  shouldRefresh,
  signal,
}: FetchLogsParams): Promise<FetchLogsResult> => {
  const url = new URL("http://localhost:8080/logs");

  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(limit));

  if (processes) {
    url.searchParams.set("processes", processes.toString());
  }
  if (logLevels) {
    url.searchParams.set("logLevels", logLevels.toString());
  }
  if (shouldRefresh) {
    url.searchParams.set("shouldRefresh", String(shouldRefresh));
  }

  const response = await axios.get<GetLogsResponse>(url.toString(), { signal });

  const formattedLogs = response.data.data.map((responseLog) => ({
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
  const hasMore = formattedLogs.length === limit;

  return {
    rows: formattedLogs,
    hasMore,
    page: hasMore ? page + 1 : page,
  };
};
