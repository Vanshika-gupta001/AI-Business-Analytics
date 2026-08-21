"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";

import {
  Table2,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const ROWS_PER_PAGE = 10;

export default function DatasetPreviewTable({

  data

}: {

  data: any;

}) {

  const rows: any[] = data?.preview || [];

  const columns: string[] = useMemo(() => {

    if (rows.length === 0) return [];

    return Object.keys(rows[0]);

  }, [rows]);

  const [search, setSearch] = useState("");

  const [sortColumn, setSortColumn] = useState<string | null>(null);

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(1);

  function handleSort(column: string) {

    if (sortColumn === column) {

      setSortDirection(sortDirection === "asc" ? "desc" : "asc");

    } else {

      setSortColumn(column);
      setSortDirection("asc");

    }

    setPage(1);

  }

  const filteredRows = useMemo(() => {

    if (!search.trim()) return rows;

    const query = search.toLowerCase();

    return rows.filter((row) =>

      columns.some((col) =>

        String(row[col] ?? "")
          .toLowerCase()
          .includes(query)

      )

    );

  }, [rows, columns, search]);

  const sortedRows = useMemo(() => {

    if (!sortColumn) return filteredRows;

    const copy = [...filteredRows];

    copy.sort((a, b) => {

      const valA = a[sortColumn];
      const valB = b[sortColumn];

      const numA = Number(valA);
      const numB = Number(valB);

      let comparison = 0;

      if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {

        comparison = numA - numB;

      } else {

        comparison = String(valA ?? "").localeCompare(String(valB ?? ""));

      }

      return sortDirection === "asc" ? comparison : -comparison;

    });

    return copy;

  }, [filteredRows, sortColumn, sortDirection]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedRows.length / ROWS_PER_PAGE)
  );

  const paginatedRows = useMemo(() => {

    const start = (page - 1) * ROWS_PER_PAGE;

    return sortedRows.slice(start, start + ROWS_PER_PAGE);

  }, [sortedRows, page]);

  if (!rows || rows.length === 0) {

    return null;

  }

  return (

    <motion.div

      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}

      className="
      bg-[var(--color-surface)]
      border
      border-[var(--color-border)]
      rounded-xl
      p-6
      
      "

    >

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">

        <div className="flex items-center gap-3">

          <div className="p-3 rounded-xl bg-[var(--color-accent-dim)]">

            <Table2 className="text-[var(--color-accent)]" size={28} />

          </div>

          <div>

            <h2 className="text-xl font-semibold">Dataset Preview</h2>

            <p className="text-sm text-[var(--color-text-secondary)]">

              Showing {paginatedRows.length} of {sortedRows.length} rows

            </p>

          </div>

        </div>

        <div className="relative">

          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />

          <input

            value={search}

            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}

            placeholder="Search rows..."

            className="
            bg-[var(--color-ink)]
            border
            border-[var(--color-border)]
            rounded-xl
            pl-9
            pr-4
            py-2
            text-sm
            outline-none
            focus:border-[var(--color-accent)]
            transition
            w-56
            "

          />

        </div>

      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">

        <table className="w-full text-sm">

          <thead>

            <tr className="bg-[var(--color-ink)]/60">

              {columns.map((col) => (

                <th

                  key={col}

                  onClick={() => handleSort(col)}

                  className="
                  text-left
                  px-4
                  py-3
                  text-[var(--color-text-secondary)]
                  font-medium
                  cursor-pointer
                  select-none
                  hover:text-[var(--color-text-primary)]
                  transition
                  whitespace-nowrap
                  "

                >

                  <span className="flex items-center gap-1.5">

                    {col}

                    {sortColumn === col ? (

                      sortDirection === "asc" ? (

                        <ArrowUp size={13} />

                      ) : (

                        <ArrowDown size={13} />

                      )

                    ) : (

                      <ArrowUpDown size={13} className="opacity-30" />

                    )}

                  </span>

                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {paginatedRows.map((row, index) => (

              <tr

                key={index}

                className="
                border-t
                border-[var(--color-border)]
                hover:bg-[var(--color-surface-raised)]/40
                transition
                "

              >

                {columns.map((col) => (

                  <td

                    key={col}

                    className="
                    px-4
                    py-3
                    text-[var(--color-text-secondary)]
                    whitespace-nowrap
                    "

                  >

                    {String(row[col] ?? "")}

                  </td>

                ))}

              </tr>

            ))}

            {paginatedRows.length === 0 && (

              <tr>

                <td

                  colSpan={columns.length}

                  className="px-4 py-8 text-center text-[var(--color-text-muted)]"

                >

                  No matching rows found.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

      {totalPages > 1 && (

        <div className="flex items-center justify-between mt-4">

          <p className="text-xs text-[var(--color-text-muted)]">

            Page {page} of {totalPages}

          </p>

          <div className="flex items-center gap-2">

            <button

              onClick={() => setPage((p) => Math.max(1, p - 1))}

              disabled={page === 1}

              className="
              p-2
              rounded-lg
              bg-[var(--color-surface-raised)]
              hover:bg-[var(--color-surface-raised)]
              disabled:opacity-30
              transition
              "

            >

              <ChevronLeft size={16} />

            </button>

            <button

              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}

              disabled={page === totalPages}

              className="
              p-2
              rounded-lg
              bg-[var(--color-surface-raised)]
              hover:bg-[var(--color-surface-raised)]
              disabled:opacity-30
              transition
              "

            >

              <ChevronRight size={16} />

            </button>

          </div>

        </div>

      )}

    </motion.div>

  );

}
