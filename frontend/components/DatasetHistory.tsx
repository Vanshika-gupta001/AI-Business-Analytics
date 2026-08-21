"use client";

import { useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";

import {
  History,
  FileSpreadsheet,
  FileText,
  Loader2,
  ArrowRight,
  Trash2,
  Search
} from "lucide-react";

import { apiFetch } from "../lib/api";


type HistoryItem = {

  dataset_id: string;
  filename: string;
  rows: number;
  columns: number;
  health_score: number | null;
  grade: string | null;
  created_at: string;

};

type SortOption = "newest" | "oldest" | "health_desc" | "health_asc" | "name";


function formatDate(iso: string) {

  try {

    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });

  } catch {

    return iso;

  }

}


export default function DatasetHistory({

  refreshKey,

  onSelect

}: {

  refreshKey?: string;
  onSelect: (data: any) => void;

}) {

  const [items, setItems] = useState<HistoryItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [openingId, setOpeningId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [gradeFilter, setGradeFilter] = useState("all");


  useEffect(() => {

    let cancelled = false;

    async function loadHistory() {

      setLoading(true);

      try {

        const response = await apiFetch("/datasets");

        if (!response.ok) return;

        const data = await response.json();

        if (!cancelled) setItems(data);

      } catch (err) {

        console.error("Failed to load dataset history:", err);

      } finally {

        if (!cancelled) setLoading(false);

      }

    }

    loadHistory();

    return () => {
      cancelled = true;
    };

  }, [refreshKey]);


  async function openDataset(id: string) {

    setOpeningId(id);

    try {

      const response = await apiFetch(`/datasets/${id}`);

      if (!response.ok) return;

      const data = await response.json();

      onSelect(data);

      document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });

    } catch (err) {

      console.error("Failed to open dataset:", err);

    } finally {

      setOpeningId(null);

    }

  }


  async function deleteDataset(id: string, e: React.MouseEvent) {

    e.stopPropagation();

    const confirmed = window.confirm(
      "Delete this dataset? This also removes its chat history and training runs."
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {

      const response = await apiFetch(`/datasets/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {

        const errBody = await response.json().catch(() => null);

        throw new Error(errBody?.detail || "Delete failed.");

      }

      setItems((prev) => prev.filter((item) => item.dataset_id !== id));

    } catch (err) {

      console.error("Failed to delete dataset:", err);

      alert("Could not delete this dataset. Please try again.");

    } finally {

      setDeletingId(null);

    }

  }


  async function downloadFile(id: string, format: "csv" | "pdf", e: React.MouseEvent) {

    e.stopPropagation();

    setDownloadingId(`${id}-${format}`);

    try {

      const response = await apiFetch(`/datasets/${id}/download/${format}`);

      if (!response.ok) {
        throw new Error(`${format.toUpperCase()} not available for this dataset.`);
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      const disposition = response.headers.get("Content-Disposition") || "";

      const match = disposition.match(/filename="?([^"]+)"?/);

      link.download = match ? match[1] : `dataset.${format}`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (err) {

      console.error(`Failed to download ${format}:`, err);

    } finally {

      setDownloadingId(null);

    }

  }


  const availableGrades = useMemo(() => {

    const grades = new Set(items.map((i) => i.grade).filter(Boolean) as string[]);

    return Array.from(grades).sort();

  }, [items]);


  const visibleItems = useMemo(() => {

    let result = items;

    if (search.trim()) {

      const query = search.toLowerCase();

      result = result.filter((i) => i.filename.toLowerCase().includes(query));

    }

    if (gradeFilter !== "all") {

      result = result.filter((i) => i.grade === gradeFilter);

    }

    const sorted = [...result];

    switch (sortBy) {

      case "newest":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;

      case "oldest":
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;

      case "health_desc":
        sorted.sort((a, b) => (b.health_score ?? -1) - (a.health_score ?? -1));
        break;

      case "health_asc":
        sorted.sort((a, b) => (a.health_score ?? 999) - (b.health_score ?? 999));
        break;

      case "name":
        sorted.sort((a, b) => a.filename.localeCompare(b.filename));
        break;

    }

    return sorted;

  }, [items, search, gradeFilter, sortBy]);


  if (loading) {

    return (

      <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-sm py-4">

        <Loader2 size={16} className="animate-spin" />

        Loading history...

      </div>

    );

  }

  if (items.length === 0) {

    return (

      <div

        className="
        bg-[var(--color-surface)]
        border
        border-[var(--color-border)]
        rounded-xl
        p-8
        text-center
        text-[var(--color-text-muted)]
        text-sm
        "

      >

        No datasets analyzed yet — upload a CSV to get started.

      </div>

    );

  }

  return (

    <motion.div

      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}

      className="
      bg-[var(--color-surface)]
      border
      border-[var(--color-border)]
      rounded-xl
      p-6
      "

    >

      <div className="flex items-center gap-3 mb-5">

        <div className="p-3 rounded-lg bg-[var(--color-accent-dim)]">

          <History className="text-[var(--color-accent)]" size={22} />

        </div>

        <div>

          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">

            Dataset History

          </h2>

          <p className="text-sm text-[var(--color-text-secondary)]">

            {items.length} dataset{items.length !== 1 ? "s" : ""} analyzed

          </p>

        </div>

      </div>

      {/* Filters */}

      <div className="flex flex-wrap items-center gap-3 mb-4">

        <div className="relative flex-1 min-w-[180px]">

          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />

          <input

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            placeholder="Search by filename..."

            className="
            w-full
            bg-[var(--color-ink)]
            border
            border-[var(--color-border)]
            rounded-lg
            pl-9
            pr-3
            py-2
            text-sm
            outline-none
            focus:border-[var(--color-accent)]
            transition
            "

          />

        </div>

        <select

          value={sortBy}

          onChange={(e) => setSortBy(e.target.value as SortOption)}

          className="
          bg-[var(--color-ink)]
          border
          border-[var(--color-border)]
          rounded-lg
          px-3
          py-2
          text-sm
          outline-none
          focus:border-[var(--color-accent)]
          transition
          "

        >

          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="health_desc">Health score: high to low</option>
          <option value="health_asc">Health score: low to high</option>
          <option value="name">Name: A to Z</option>

        </select>

        <select

          value={gradeFilter}

          onChange={(e) => setGradeFilter(e.target.value)}

          className="
          bg-[var(--color-ink)]
          border
          border-[var(--color-border)]
          rounded-lg
          px-3
          py-2
          text-sm
          outline-none
          focus:border-[var(--color-accent)]
          transition
          "

        >

          <option value="all">All grades</option>

          {availableGrades.map((grade) => (
            <option key={grade} value={grade}>Grade {grade}</option>
          ))}

        </select>

      </div>

      {/* Table */}

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">

        <table className="w-full text-sm">

          <thead>

            <tr className="bg-[var(--color-ink)]">

              <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">File</th>
              <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Rows</th>
              <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Columns</th>
              <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Health</th>
              <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-medium">Uploaded</th>
              <th className="text-right px-4 py-3 text-[var(--color-text-muted)] font-medium">Actions</th>

            </tr>

          </thead>

          <tbody>

            {visibleItems.map((item) => (

              <tr

                key={item.dataset_id}

                onClick={() => {
                  if (openingId === null && deletingId === null) {
                    openDataset(item.dataset_id);
                  }
                }}

                className="
                border-t
                border-[var(--color-border)]
                hover:bg-[var(--color-ink)]
                cursor-pointer
                transition-colors
                "

              >

                <td className="px-4 py-3">

                  <div className="flex items-center gap-2.5">

                    <FileSpreadsheet size={16} className="text-[var(--color-accent)] flex-shrink-0" />

                    <span className="text-[var(--color-text-primary)] font-medium truncate max-w-[220px]">

                      {item.filename}

                    </span>

                  </div>

                </td>

                <td className="px-4 py-3 text-[var(--color-text-secondary)] data-num">{item.rows}</td>

                <td className="px-4 py-3 text-[var(--color-text-secondary)] data-num">{item.columns}</td>

                <td className="px-4 py-3">

                  {item.health_score !== null ? (

                    <span className="data-num text-xs text-[var(--color-accent)] bg-[var(--color-accent-dim)] px-2 py-1 rounded-full">

                      {item.health_score}/100

                    </span>

                  ) : (

                    <span className="text-[var(--color-text-muted)]">—</span>

                  )}

                </td>

                <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs whitespace-nowrap">

                  {formatDate(item.created_at)}

                </td>

                <td className="px-4 py-3">

                  <div className="flex items-center justify-end gap-3">

                    <button

                      onClick={(e) => downloadFile(item.dataset_id, "csv", e)}

                      disabled={downloadingId !== null}

                      title="Download CSV"

                      className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40"

                    >

                      {downloadingId === `${item.dataset_id}-csv` ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <FileSpreadsheet size={15} />
                      )}

                    </button>

                    <button

                      onClick={(e) => downloadFile(item.dataset_id, "pdf", e)}

                      disabled={downloadingId !== null}

                      title="Download PDF report"

                      className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40"

                    >

                      {downloadingId === `${item.dataset_id}-pdf` ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <FileText size={15} />
                      )}

                    </button>

                    <button

                      onClick={(e) => deleteDataset(item.dataset_id, e)}

                      disabled={deletingId !== null}

                      title="Delete this dataset"

                      className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors disabled:opacity-40"

                    >

                      {deletingId === item.dataset_id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}

                    </button>

                    {openingId === item.dataset_id ? (
                      <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />
                    ) : (
                      <ArrowRight size={16} className="text-[var(--color-text-muted)]" />
                    )}

                  </div>

                </td>

              </tr>

            ))}

            {visibleItems.length === 0 && (

              <tr>

                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-muted)]">

                  No datasets match your filters.

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </motion.div>

  );

}