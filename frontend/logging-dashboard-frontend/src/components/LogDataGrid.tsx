import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
  Dispatch,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { PAGE_SIZE } from "../constants";
import { fetchLogs, type Logs } from "../hooks/useFetchLogs";
import { ChevronRight, ChevronDown } from "lucide-react";

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

export default function LogDataGrid() {
  const parentRef = useRef<HTMLDivElement>(null);

  const [rows, setRows] = useState<Logs[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState<number>(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    new Set<string>(),
  );

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
      const result = await fetchLogs({
        page,
        limit: PAGE_SIZE,
      });

      setRows((prev) => [...prev, ...result.rows]);
      setPage(result.page as number);
      setHasMore(result.hasMore);
    } finally {
      setLoading(false);
    }
  }, [page, hasMore, loading]);

  useEffect(() => {
    loadMore();
  }, []);

  const columns = useMemo<ColumnDef<Logs>[]>(
    () => [
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
    ],
    [],
  );

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

  useEffect(() => {
    const lastItem = virtualRows[virtualRows.length - 1];

    if (!lastItem) {
      return;
    }

    if (lastItem.index >= rows.length - 10 && hasMore && !loading) {
      loadMore();
    }
  }, [virtualRows, rows.length, hasMore, loading, loadMore]);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <table
        style={{
          width: "100%",
          tableLayout: "fixed",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    position: "relative",
                    width: header.getSize(),
                    textAlign: "start",
                    padding: "0 0.75rem",
                    height: "2.5rem",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg)",
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}

                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      width: 2,
                      height: "1.5rem",
                      marginBlockStart: "0.5rem",
                      cursor: "col-resize",
                      userSelect: "none",
                      backgroundColor: "var(--text)",
                    }}
                  />
                </th>
              ))}
            </tr>
          ))}
        </thead>
      </table>

      <div
        ref={parentRef}
        style={{
          height: 360,
          overflow: "auto",
        }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: "relative",
          }}
        >
          <table
            style={{
              width: "100%",
              tableLayout: "fixed",
              borderCollapse: "collapse",
            }}
          >
            <tbody>
              {virtualRows.map((virtualRow) => {
                const row = table.getRowModel().rows[virtualRow.index];

                return (
                  <tr
                    key={row.id}
                    style={{
                      position: "absolute",
                      transform: `translateY(${virtualRow.start}px)`,
                      width: "100%",
                      display: "table",
                      tableLayout: "fixed",
                    }}
                  >
                    {row.getVisibleCells().map((cell, index) => (
                      <td
                        key={`${virtualRow.key}-${index}`}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        style={{
                          ...(!expandedRows.has(row.id)
                            ? {
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                              }
                            : {}),
                          width: cell.column.getSize(),
                          padding: "5px 0.75rem",
                          borderBottom: "1px solid var(--border)",
                          fontSize: "0.8rem",
                          lineHeight: "1.25",
                          fontVariantNumeric:
                            cell.column.id === "timestamp"
                              ? "tabular-nums"
                              : undefined,
                          ...(index === 0
                            ? {
                                padding: "5px 0.75rem 3px",
                              }
                            : {}),
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

        {loading && (
          <div
            style={{
              padding: 16,
              textAlign: "center",
            }}
          >
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}
