import axios from "axios";
import type {
  AppendFetchParams,
  AppendFetchResult,
} from "@virtuoso.dev/data-table";

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
  pageSize?: number;
  processes?: string[];
  logLevels?: MessageType[];
  shouldRefresh?: boolean;
}

export const fetchLogs = async ({
  cursor,
  limit,
  params,
  signal,
}: AppendFetchParams<FetchLogsParams>): Promise<AppendFetchResult<Logs>> => {
  const url = new URL("http://localhost:8080/logs");

  // Use cursor as page number (cursor is 0 for first page)
  const page = (cursor as number) || 0;
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(limit));

  if (params.processes) {
    url.searchParams.set("processes", params.processes.toString());
  }
  if (params.logLevels) {
    url.searchParams.set("logLevels", params.logLevels.toString());
  }
  if (params.shouldRefresh) {
    url.searchParams.set("shouldRefresh", String(params.shouldRefresh));
  }

  const response = await axios.get<GetLogsResponse>(url.toString(), { signal });

  // Determine if there are more pages based on whether we received a full page
  const hasMore = response.data.data.length === limit;

  // Increment cursor for next page
  const nextCursor = hasMore ? page + 1 : page;
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

  return {
    rows: formattedLogs,
    hasMore,
    cursor: nextCursor,
  };
};
