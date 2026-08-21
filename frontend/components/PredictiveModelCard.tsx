"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";

import {
  Brain,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Play,
  BarChart3
} from "lucide-react";

import { apiFetch } from "../lib/api";

export default function PredictiveModelCard({

  data

}: {

  data: any;

}) {

  const allColumns: any[] = data?.column_summary || [];

  const totalRows: number = data?.dataset_info?.rows || 0;
  
  // Exclude columns that look like identifiers or free text (e.g. "Name")
  // from the target dropdown — predicting a unique-per-row column is
  // never a meaningful modeling target. Numeric columns are never
  // excluded here, since a continuous numeric column can always be a
  // valid regression target regardless of how many distinct values it has.
  const eligibleColumns = useMemo(() => {

    const MAX_CLASSIFICATION_UNIQUE = 20;

    return allColumns.filter((col) => {

      const isNumeric = col.type?.includes("int") || col.type?.includes("float");

      if (isNumeric) return true;

      const uniqueRatio = totalRows > 0 ? col.unique / totalRows : 0;

      const looksLikeId = uniqueRatio > 0.9;

      const tooManyCategories = col.unique > MAX_CLASSIFICATION_UNIQUE;

      return !looksLikeId && !tooManyCategories;

    });

  }, [allColumns, totalRows]);

  const excludedCount = allColumns.length - eligibleColumns.length;

  const [targetColumn, setTargetColumn] = useState<string>(
    eligibleColumns[0]?.column || ""
  );

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [result, setResult] = useState<any>(null);

  async function trainModel() {

    if (!targetColumn || !data?.dataset_id) return;

    setLoading(true);

    setError("");

    setResult(null);

    try {

      const response = await apiFetch(

        "/train",

        {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            dataset_id: data.dataset_id,

            target_column: targetColumn

          })

        }

      );

      const responseData = await response.json();

      if (!response.ok) {

        throw new Error(responseData.detail || "Training failed");

      }

      setResult(responseData);

    } catch (err: any) {

      setError(err.message || "Something went wrong while training the model.");

    } finally {

      setLoading(false);

    }

  }

  if (!data?.dataset_id || eligibleColumns.length === 0) {

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
      
      <div className="flex items-center gap-3 mb-6">

        <div className="p-3 rounded-xl bg-[var(--color-success)]/15">

          <Brain className="text-[var(--color-success)]" size={28} />

        </div>

        <div>

          <h2 className="text-xl font-semibold">Predictive Modeling</h2>

          <p className="text-sm text-[var(--color-text-secondary)]">

            Train a real baseline model on this dataset

          </p>

        </div>

      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-2">

        <select

          value={targetColumn}

          onChange={(e) => setTargetColumn(e.target.value)}

          className="
          flex-1
          bg-[var(--color-ink)]
          border
          border-[var(--color-border)]
          rounded-xl
          px-4
          py-2.5
          text-sm
          outline-none
          focus:border-[var(--color-accent)]
          transition
          "

        >

          {eligibleColumns.map((col) => (

            <option key={col.column} value={col.column}>

              {col.column} ({col.type})

            </option>

          ))}

        </select>

        <button

          onClick={trainModel}

          disabled={loading || !targetColumn}

          className="
          bg-[var(--color-accent)]
          hover:opacity-90
          text-[var(--color-ink)]
          font-semibold
          rounded-xl
          px-5
          py-2.5
          text-sm
          flex
          items-center
          justify-center
          gap-2
          disabled:opacity-40
          transition
          "

        >

          {loading ? (

            <>
              <Loader2 size={16} className="animate-spin" />
              Training...
            </>

          ) : (

            <>
              <Play size={16} />
              Train Model
            </>

          )}

        </button>

      </div>

      {excludedCount > 0 && (

        <p className="text-xs text-[var(--color-text-muted)] mb-4">

          {excludedCount} column{excludedCount > 1 ? "s" : ""} hidden from this list —
          they look like identifiers or free text (nearly every value is unique), which
          isn't something a model can meaningfully predict.

        </p>

      )}

      {error && (

        <div className="flex items-center gap-2 text-[var(--color-danger)] text-sm mb-4">

          <AlertCircle size={16} />

          {error}

        </div>

      )}

      {result && (

        <div className="space-y-5">

          {result.low_sample_warning && (

            <div

              className="
              flex items-start gap-2
              bg-[var(--color-accent-dim)]
              border border-[var(--color-accent)]/30
              rounded-lg
              px-4 py-3
              text-sm
              text-[var(--color-accent)]
              "

            >

              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />

              <span>

                Small sample size ({result.rows_used} rows). Treat these results as
                directional, not production-grade — aim for 200+ rows for a more
                reliable model.

              </span>

            </div>

          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

            <StatBlock label="Problem Type" value={result.problem_type} />

            <StatBlock label="Algorithm" value={result.algorithm} small />

            <StatBlock label="Train Rows" value={String(result.train_rows)} />

            <StatBlock label="Test Rows" value={String(result.test_rows)} />

          </div>

          <div>

            <p className="text-sm text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">

              <BarChart3 size={16} />
              Model Performance

            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

              {Object.entries(result.metrics).map(([key, value]) => (

                <div

                  key={key}

                  className="bg-[var(--color-ink)] border border-[var(--color-border)] rounded-xl p-4"

                >

                  <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-wide">

                    {key.replace(/_/g, " ")}

                  </p>

                  <p className="text-2xl font-bold mt-1">

                    {String(value)}

                  </p>

                </div>

              ))}

            </div>

          </div>

          {result.feature_importance?.length > 0 && (

            <div>

              <p className="text-sm text-[var(--color-text-secondary)] mb-3">

                Top Feature Importance

              </p>

              <div className="space-y-2">

                {result.feature_importance.map((item: any) => (

                  <div key={item.feature} className="flex items-center gap-3">

                    <span className="text-xs text-[var(--color-text-secondary)] w-32 truncate">

                      {item.feature}

                    </span>

                    <div className="flex-1 bg-[var(--color-ink)] border border-[var(--color-border)] rounded-full h-2 overflow-hidden">

                      <div

                        className="bg-[var(--color-accent)] h-full"

                        style={{

                          width: `${Math.min(100, item.importance * 100 * 4)}%`

                        }}

                      />

                    </div>

                    <span className="text-xs text-[var(--color-text-muted)] w-12 text-right">

                      {(item.importance * 100).toFixed(1)}%

                    </span>

                  </div>

                ))}

              </div>

            </div>

          )}

        </div>

      )}

    </motion.div>

  );

}

function StatBlock({

  label,

  value,

  small

}: {

  label: string;
  value: string;
  small?: boolean;

}) {

  return (

    <div className="bg-[var(--color-ink)] border border-[var(--color-border)] rounded-xl p-4">

      <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-wide">

        {label}

      </p>

      <p className={small ? "text-sm font-semibold mt-1" : "text-xl font-bold mt-1 capitalize"}>

        {value}

      </p>

    </div>

  );

}