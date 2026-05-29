import {
  Cell,
  Column,
  ColumnHeader,
  VirtuosoDataTable,
  defaultAppendViewportHandler,
  remoteModel,
} from "@virtuoso.dev/data-table";
import { useState } from "react";

import { PAGE_SIZE } from "../constants";
import {
  fetchLogs,
  type Logs,
  type FetchLogsParams,
} from "../hooks/useFetchLogs";

// TODO: make column into reusable component
// TODO: use hook to fetch logging data
// TODO: include header buttons somewhere to toggle visiblity of columns
// TODO: allow for searching
// TODO: build a menu for filtering columns
const LogDataGrid = () => {
  const [model] = useState(() =>
    remoteModel<Logs, FetchLogsParams>({
      mode: "append",
      fetch: fetchLogs,
      initialParams: {},
      onViewportChange: defaultAppendViewportHandler,
      pageSize: PAGE_SIZE,
    }),
  );
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
              {String(cellValue)}
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
              {String(cellValue)}
            </div>
          )}
        </Cell>
      </Column>
    </VirtuosoDataTable>
  );
};

export default LogDataGrid;
