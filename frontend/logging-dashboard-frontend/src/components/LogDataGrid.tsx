import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { PAGE_SIZE } from "../constants";
import { fetchLogs, type Logs } from "../hooks/useFetchLogs";

const STORAGE_KEY = "log-grid-column-widths";

export default function LogDataGrid() {
  const parentRef = useRef<HTMLDivElement>(null);

  const [rows, setRows] = useState<Logs[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState<number>(0);

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
    estimateSize: () => 44,
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
                    width: header.getSize(),
                    position: "relative",
                    textAlign: "left",
                    padding: "0 12px",
                    height: 44,
                    borderBottom: "1px solid var(--border)",
                    userSelect: "none",
                    background: "white",
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
                      width: 6,
                      height: "100%",
                      cursor: "col-resize",
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
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{
                          width: cell.column.getSize(),
                          height: 44,
                          padding: "0 12px",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          borderBottom: "1px solid #eee",
                          fontVariantNumeric:
                            cell.column.id === "timestamp"
                              ? "tabular-nums"
                              : undefined,
                        }}
                      >
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
