import {
  Cell,
  Column,
  ColumnHeader,
  VirtuosoDataTable,
  localModel,
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

interface Logs {
  messageType: MessageType;
  timestamp: string;
  subsystem: string;
  category: string;
  processId: number;
  processImagePath: string;
  userId: number;
}

const model = localModel<Logs>({ data: [] });

const LogDataGrid = () => {
  return (
    <VirtuosoDataTable
      model={model}
      style={{
        height: 360,
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <Column field="messageType">
        <ColumnHeader>
          {() => (
            <div
              style={{
                padding: "0 12px",
                fontWeight: 600,
                height: 44,
                display: "flex",
                alignItems: "center",
              }}
            >
              Log Level
            </div>
          )}
        </ColumnHeader>
        <Cell>
          {({ cellValue }) => (
            <div
              style={{
                padding: "0 12px",
                height: 44,
                display: "flex",
                alignItems: "center",
              }}
            >
              {String(cellValue)}
            </div>
          )}
        </Cell>
      </Column>
      <Column field="subsystem">
        <ColumnHeader>
          {() => (
            <div
              style={{
                padding: "0 12px",
                fontWeight: 600,
                height: 44,
                display: "flex",
                alignItems: "center",
              }}
            >
              Subsystem
            </div>
          )}
        </ColumnHeader>
        <Cell>
          {({ cellValue }) => (
            <div
              style={{
                padding: "0 12px",
                height: 44,
                display: "flex",
                alignItems: "center",
              }}
            >
              {String(cellValue)}
            </div>
          )}
        </Cell>
      </Column>
      <Column field="eventMessage">
        <ColumnHeader>
          {() => (
            <div
              style={{
                padding: "0 12px",
                fontWeight: 600,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              Message
            </div>
          )}
        </ColumnHeader>
        <Cell>
          {({ cellValue }) => (
            <div
              style={{
                padding: "0 12px",
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Number(cellValue)}
            </div>
          )}
        </Cell>
      </Column>
      <Column field="timestamp">
        <ColumnHeader>
          {() => (
            <div
              style={{
                padding: "0 12px",
                fontWeight: 600,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              Timestamp
            </div>
          )}
        </ColumnHeader>
        <Cell>
          {({ cellValue }) => (
            <div
              style={{
                padding: "0 12px",
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {Number(cellValue)}
            </div>
          )}
        </Cell>
      </Column>
    </VirtuosoDataTable>
  );
};

export default LogDataGrid;
