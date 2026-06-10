import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, Row } from "@tanstack/react-table";
import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
  type Dispatch,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { PAGE_SIZE } from "../constants";
import useFetchLogs, {
  type MessageType,
  type Logs,
} from "../hooks/useFetchLogs";
import { ChevronRight, ChevronDown, Funnel } from "lucide-react";
import Checkbox from "./Checkbox";

import styles from "./LogDataGrid.module.scss";

const STORAGE_KEY = "log-grid-column-widths";

interface RenderRowExpandParams {
  row: Row<Logs>;
  expandedRows: Set<string>;
  setExpandedRows: Dispatch<SetStateAction<Set<string>>>;
}

const renderRowExpand = ({
  row,
  expandedRows,
  setExpandedRows,
}: RenderRowExpandParams) => {
  const isExpanded = expandedRows.has(row.id);
  if (isExpanded) {
    return (
      <ChevronDown
        onClick={() => {
          expandedRows.delete(row.id);
          setExpandedRows(new Set<string>(expandedRows));
        }}
      />
    );
  }
  return (
    <ChevronRight
      onClick={() => {
        expandedRows.add(row.id);
        setExpandedRows(new Set<string>(expandedRows));
      }}
    />
  );
};

interface FilterCheckboxChangeFnParams {
  currentFilter: MessageType;
  setLogLevelFilters: Dispatch<SetStateAction<Set<MessageType>>>;
}

const filterCheckboxChangeFn = ({
  currentFilter,
  setLogLevelFilters,
}: FilterCheckboxChangeFnParams) => {
  setLogLevelFilters((prev) => {
    const next = new Set(prev);
    if (next.has(currentFilter)) {
      next.delete(currentFilter);
    } else {
      next.add(currentFilter);
    }
    return next;
  });
};

const columns: ColumnDef<Logs>[] = [
  {
    accessorKey: "expandButton",
    header: "",
    size: 32,
    minSize: 32,
  },
  {
    accessorKey: "messageType",
    header: "Log Level",
    size: 140,
    minSize: 100,
  },
  {
    accessorKey: "subsystem",
    header: "Subsystem",
    size: 220,
    minSize: 150,
  },
  {
    accessorKey: "eventMessage",
    header: "Message",
    size: 700,
    minSize: 300,
  },
  {
    accessorKey: "timestamp",
    header: "Timestamp",
    size: 250,
    minSize: 200,
  },
];

export default function LogDataGrid() {
  const parentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    new Set<string>(),
  );
  const [logLevelFilters, setLogLevelFilters] = useState<Set<MessageType>>(
    new Set<MessageType>(["Default", "Info", "Debug", "Error"]),
  );
  const [showLogLevelFilters, setShowLogLevelFilters] = useState(false);
  const fetchLogsParams = useMemo(
    () => ({
      limit: PAGE_SIZE,
      logLevels: [...logLevelFilters],
    }),
    [logLevelFilters],
  );
  const { rows, hasMore, fetchLogs } = useFetchLogs(fetchLogsParams);

  const [columnSizing, setColumnSizing] = useState<Record<string, number>>(
    () => {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return {};
      }

      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    },
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }

    setLoading(true);

    try {
      await fetchLogs();
    } finally {
      setLoading(false);
    }
  }, [hasMore, fetchLogs]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),

    columnResizeMode: "onChange",

    state: {
      columnSizing,
    },

    onColumnSizingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(columnSizing) : updater;

      setColumnSizing(next);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    },
  });

  const virtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 15,
  });

  const virtualRows = virtualizer.getVirtualItems();

  const MessageTypeFilterCheckbox = ({ label }: { label: MessageType }) => (
    <Checkbox
      id={`${label}Checkbox`}
      label={label}
      isChecked={logLevelFilters.has(label)}
      onChange={() =>
        filterCheckboxChangeFn({
          currentFilter: label,
          setLogLevelFilters,
        })
      }
    />
  );

  // fetches more logs when options change
  useEffect(() => {
    loadMore();
  }, [fetchLogs]);

  // fetches logs upon reaching the end of the table
  useEffect(() => {
    const lastItem = virtualRows[virtualRows.length - 1];

    if (!lastItem) {
      return;
    }

    if (lastItem.index >= rows.length - 10 && hasMore && !loading) {
      loadMore();
    }
  }, [virtualRows, rows.length, hasMore, loadMore]);

  return (
    <div className={styles.wrapper}>
      <table className={styles.headerTable}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  className={styles.headerRow}
                  key={header.id}
                  style={{
                    width: header.getSize(),
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {header.column.columnDef.header === "Log Level" && (
                    <div className={styles.headerFilter}>
                      <Funnel
                        onClick={() => setShowLogLevelFilters((prev) => !prev)}
                        size="20"
                      />
                      {showLogLevelFilters && (
                        <div className={styles.headerFilterPopover}>
                          <MessageTypeFilterCheckbox label={"Default"} />
                          <MessageTypeFilterCheckbox label={"Info"} />
                          <MessageTypeFilterCheckbox label={"Debug"} />
                          <MessageTypeFilterCheckbox label={"Error"} />
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={styles.resizeHandler}
                  />
                </th>
              ))}
            </tr>
          ))}
        </thead>
      </table>
      <div ref={parentRef} className={styles.bodyWrapper}>
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: "relative",
          }}
        >
          <table className={styles.bodyTable}>
            <tbody>
              {virtualRows.map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index];

                return (
                  <tr
                    key={row.id}
                    className={styles.bodyRow}
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell, index) => (
                      <td
                        key={`${virtualRow.key}-${index}`}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        className={clsx({
                          [styles.bodyCell]: true,
                          [styles.firstCell]: index === 0,
                          [styles.collapsedCell]: !expandedRows.has(row.id),
                        })}
                        style={{
                          width: cell.column.getSize(),
                        }}
                      >
                        {index === 0 &&
                          renderRowExpand({
                            row,
                            expandedRows,
                            setExpandedRows,
                          })}
                        {flexRender(
                          cell.column.columnDef.cell ??
                            (() => String(cell.getValue())),
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {loading && <div className={styles.loading}>Loading...</div>}
      </div>
    </div>
  );
}
