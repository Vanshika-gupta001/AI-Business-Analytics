"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";

import {
  ListTree,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from "lucide-react";

type ColumnStat = {

  column: string;
  type: string;
  missing: number;
  unique: number;

  mean?: number | null;
  min?: number | null;
  max?: number | null;

};

type SortKey = keyof ColumnStat;

export default function ColumnStatsTable({

  data

}: {

  data: any;

}) {

  const columnSummary: any[] = data?.column_summary || [];

  const numericSummary: any =
    data?.chart_data?.numeric_summary || {};

  const rows: ColumnStat[] = useMemo(() => {

    return columnSummary.map((col: any) => {

      const numeric = numericSummary[col.column];

      return {

        column: col.column,
        type: col.type,
        missing: col.missing,
        unique: col.unique,

        mean: numeric ? Number(numeric.mean?.toFixed?.(2) ?? numeric.mean) : null,
        min: numeric ? numeric.min : null,
        max: numeric ? numeric.max : null

      };

    });

  }, [columnSummary, numericSummary]);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<"all" | "numeric" | "categorical">("all");

  const [sortKey, setSortKey] = useState<SortKey>("column");

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  function handleSort(key: SortKey) {

    if (sortKey === key) {

      setSortDirection(sortDirection === "asc" ? "desc" : "asc");

    } else {

      setSortKey(key);
      setSortDirection("asc");

    }

  }

  const filteredRows = useMemo(() => {

    let result = rows;

    if (filter === "numeric") {

      result = result.filter((r) => r.mean !== null);

    } else if (filter === "categorical") {

      result = result.filter((r) => r.mean === null);

    }

    if (search.trim()) {

      const query = search.toLowerCase();

      result = result.filter((r) =>
        r.column.toLowerCase().includes(query) ||
        r.type.toLowerCase().includes(query)
      );

    }

    return result;

  }, [rows, filter, search]);

  const sortedRows = useMemo(() => {

    const copy = [...filteredRows];

    copy.sort((a, b) => {

      const valA = a[sortKey];
      const valB = b[sortKey];

      let comparison = 0;

      if (typeof valA === "number" && typeof valB === "number") {

        comparison = valA - valB;

      } else {

        comparison = String(valA ?? "").localeCompare(String(valB ?? ""));

      }

      return sortDirection === "asc" ? comparison : -comparison;

    });

    return copy;

  }, [filteredRows, sortKey, sortDirection]);

  if (rows.length === 0) {

    return null;

  }

  const columnHeaders: { key: SortKey; label: string }[] = [

    { key: "column", label: "Column" },
    { key: "type", label: "Type" },
    { key: "missing", label: "Missing" },
    { key: "unique", label: "Unique" },
    { key: "mean", label: "Mean" },
    { key: "min", label: "Min" },
    { key: "max", label: "Max" }

  ];

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

          <div className="p-3 rounded-xl bg-[var(--color-teal)]/10">

            <ListTree className="text-[var(--color-teal)]" size={28} />

          </div>

          <div>

            <h2 className="text-xl font-semibold">Column Statistics</h2>

            <p className="text-sm text-[var(--color-text-secondary)]">

              Per-column type, quality, and numeric stats

            </p>

          </div>

        </div>

        <div className="flex items-center gap-3 flex-wrap">

          <div className="flex bg-[var(--color-ink)] border border-[var(--color-border)] rounded-xl p-1 text-xs">

            {(["all", "numeric", "categorical"] as const).map((option) => (

              <button

                key={option}

                onClick={() => setFilter(option)}

                className={

                  filter === option

                    ? "px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-ink)] font-medium capitalize"
                    : "px-3 py-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition capitalize"

                }

              >

                {option}

              </button>

            ))}

          </div>

          <div className="relative">

            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />

            <input

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              placeholder="Search columns..."

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
              w-52
              "

            />

          </div>

        </div>

      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">

        <table className="w-full text-sm">

          <thead>

            <tr className="bg-[var(--color-ink)]/60">

              {columnHeaders.map((header) => (

                <th

                  key={header.key}

                  onClick={() => handleSort(header.key)}

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

                    {header.label}

                    {sortKey === header.key ? (

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

            {sortedRows.map((row) => (

              <tr

                key={row.column}

                className="
                border-t
                border-[var(--color-border)]
                hover:bg-[var(--color-surface-raised)]/40
                transition
                "

              >

                <td className="px-4 py-3 font-medium text-[var(--color-text-primary)] whitespace-nowrap">

                  {row.column}

                </td>

                <td className="px-4 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">

                  {row.type}

                </td>

                <td className="px-4 py-3 text-[var(--color-text-secondary)]">

                  {row.missing}

                </td>

                <td className="px-4 py-3 text-[var(--color-text-secondary)]">

                  {row.unique}

                </td>

                <td className="px-4 py-3 text-[var(--color-text-secondary)]">

                  {row.mean ?? "—"}

                </td>

                <td className="px-4 py-3 text-[var(--color-text-secondary)]">

                  {row.min ?? "—"}

                </td>

                <td className="px-4 py-3 text-[var(--color-text-secondary)]">

                  {row.max ?? "—"}

                </td>

              </tr>

            ))}

            {sortedRows.length === 0 && (

              <tr>

                <td

                  colSpan={columnHeaders.length}

                  className="px-4 py-8 text-center text-[var(--color-text-muted)]"

                >

                  No matching columns found.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </motion.div>

  );

}
