"use client";

import { useMemo, useState } from "react";

import { motion } from "framer-motion";

import {
  Target,
  Loader2,
  AlertCircle,
  Play,
  TrendingUp,
  TrendingDown,
  Sliders,
  Gauge,
  History,
  X
} from "lucide-react";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { apiFetch } from "../lib/api";

export default function ScenarioSimulatorCard({

  data

}: {

  data: any;

}) {

  const allColumns: any[] = data?.column_summary || [];

  // Only numeric columns are usable — the backend's Bayesian optimizer
  // needs a continuous regression target and continuous search
  // dimensions (see scenario_optimizer.py).
  const numericColumns = useMemo(() => {

    return allColumns.filter((col) =>
      col.type?.includes("int") || col.type?.includes("float")
    );

  }, [allColumns]);

  const [targetColumn, setTargetColumn] = useState<string>(
    numericColumns[0]?.column || ""
  );

  const [controllableColumns, setControllableColumns] = useState<string[]>([]);

  const [direction, setDirection] = useState<"maximize" | "minimize">("maximize");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [result, setResult] = useState<any>(null);

  // Every completed run this session, newest first — lets someone
  // compare "aggressive discount" vs "conservative pricing" side by
  // side instead of losing the previous result the moment a new one
  // is run. Session-only (not persisted) by design: these are
  // exploratory what-ifs, not saved decisions.
  const [runHistory, setRunHistory] = useState<any[]>([]);

  function toggleControllable(column: string) {

    setControllableColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );

  }

  async function runOptimization() {

    if (!targetColumn || controllableColumns.length === 0 || !data?.dataset_id) return;

    setLoading(true);

    setError("");

    setResult(null);

    try {

      const response = await apiFetch(

        "/scenario/optimize",

        {

          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            dataset_id: data.dataset_id,

            target_column: targetColumn,

            controllable_columns: controllableColumns,

            direction

          })

        }

      );

      const responseData = await response.json();

      if (!response.ok) {

        throw new Error(responseData.detail || "Scenario optimization failed");

      }

      setResult(responseData);

      setRunHistory((prev) => [
        {
          id: `${Date.now()}`,
          label: `${direction === "maximize" ? "Max" : "Min"} ${targetColumn}`,
          ...responseData
        },
        ...prev
      ].slice(0, 5)); // keep the last 5 — enough to compare without cluttering the card

    } catch (err: any) {

      setError(err.message || "Something went wrong while running the simulation.");

    } finally {

      setLoading(false);

    }

  }

  function removeFromHistory(id: string) {

    setRunHistory((prev) => prev.filter((run) => run.id !== id));

  }

  if (!data?.dataset_id || numericColumns.length < 2) {

    return null;

  }

  // Convergence data for the chart: the model's predicted target value
  // at each Bayesian optimization iteration, so the search "settling"
  // on an answer is visible rather than just showing the final number.
  const convergenceData = (result?.exploration_trace || []).map(
    (point: any, index: number) => ({
      iteration: index + 1,
      value: point[result.target_column]
    })
  );

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

        <div className="p-3 rounded-xl bg-[var(--color-teal)]/15">

          <Sliders className="text-[var(--color-teal)]" size={28} />

        </div>

        <div>

          <h2 className="text-xl font-semibold">Scenario Simulator</h2>

          <p className="text-sm text-[var(--color-text-secondary)]">

            Find the variable combination that best drives a target KPI (Bayesian Optimization)

          </p>

        </div>

      </div>

      {/* Target KPI */}

      <div className="mb-5">

        <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">

          Target KPI to optimize

        </label>

        <select

          value={targetColumn}

          onChange={(e) => {
            setTargetColumn(e.target.value);
            setControllableColumns((prev) => prev.filter((c) => c !== e.target.value));
          }}

          className="
          mt-2
          w-full
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

          {numericColumns.map((col) => (

            <option key={col.column} value={col.column}>

              {col.column}

            </option>

          ))}

        </select>

      </div>

      {/* Direction */}

      <div className="flex gap-2 mb-5">

        <button

          onClick={() => setDirection("maximize")}

          className={

            direction === "maximize"

              ? "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30"
              : "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-ink)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"

          }

        >

          <TrendingUp size={15} />
          Maximize

        </button>

        <button

          onClick={() => setDirection("minimize")}

          className={

            direction === "minimize"

              ? "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-danger)]/15 text-[var(--color-danger)] border border-[var(--color-danger)]/30"
              : "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-ink)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"

          }

        >

          <TrendingDown size={15} />
          Minimize

        </button>

      </div>

      {/* Controllable variables */}

      <div className="mb-6">

        <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">

          Controllable variables (pick 1–4)

        </label>

        <div className="flex flex-wrap gap-2 mt-2">

          {numericColumns

            .filter((col) => col.column !== targetColumn)

            .map((col) => {

              const active = controllableColumns.includes(col.column);

              return (

                <button

                  key={col.column}

                  onClick={() => toggleControllable(col.column)}

                  className={

                    active

                      ? "px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)]/40"
                      : "px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-ink)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"

                  }

                >

                  {col.column}

                </button>

              );

            })}

        </div>

      </div>

      <button

        onClick={runOptimization}

        disabled={loading || !targetColumn || controllableColumns.length === 0}

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
        mb-6
        "

      >

        {loading ? (

          <>
            <Loader2 size={16} className="animate-spin" />
            Running Bayesian Optimization...
          </>

        ) : (

          <>
            <Play size={16} />
            Run Simulation
          </>

        )}

      </button>

      {error && (

        <div className="flex items-center gap-2 text-[var(--color-danger)] text-sm mb-4">

          <AlertCircle size={16} />
          {error}

        </div>

      )}

      {result && (

        <div className="space-y-6">

          {/* Recommended scenario */}

          <div

            className="
            bg-[var(--color-ink)]
            border
            border-[var(--color-accent)]/30
            rounded-xl
            p-5
            "

          >

            <div className="flex items-center gap-2 mb-4">

              <Target size={16} className="text-[var(--color-accent)]" />

              <p className="text-sm font-medium text-[var(--color-text-primary)]">

                Recommended scenario

              </p>

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">

              {Object.entries(result.best_values).map(([key, value]) => (

                <div key={key}>

                  <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-wide">

                    {key}

                  </p>

                  <p className="data-num text-lg font-semibold mt-1">

                    {String(value)}

                  </p>

                </div>

              ))}

            </div>

            <div className="pt-4 border-t border-[var(--color-border)]">

              <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-wide">

                Predicted {result.target_column}

              </p>

              <p className="data-num text-2xl font-bold text-[var(--color-accent)] mt-1">

                {result.predicted_target}

              </p>

            </div>

          </div>

          {/* Convergence chart */}

          <div>

            <p className="text-sm text-[var(--color-text-secondary)] mb-3">

              Optimization convergence ({result.iterations_run} evaluations)

            </p>

            <div className="bg-[var(--color-ink)] border border-[var(--color-border)] rounded-xl p-4 h-64">

              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={convergenceData}>

                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />

                  <XAxis

                    dataKey="iteration"

                    stroke="var(--color-text-muted)"

                    fontSize={12}

                    label={{ value: "Iteration", position: "insideBottom", offset: -5, fill: "var(--color-text-muted)", fontSize: 11 }}

                  />

                  <YAxis stroke="var(--color-text-muted)" fontSize={12} />

                  <Tooltip

                    contentStyle={{

                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "12px"

                    }}

                  />

                  <Line

                    type="monotone"

                    dataKey="value"

                    stroke="var(--color-accent)"

                    strokeWidth={2}

                    dot={{ r: 3 }}

                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

            <p className="text-xs text-[var(--color-text-muted)] mt-2">

              Each point is one combination the optimizer tried — the Gaussian Process
              surrogate steers later evaluations toward higher-scoring regions instead of
              searching blindly.

            </p>

          </div>

          {/* Sensitivity / tornado chart */}

          {result.sensitivity?.length > 0 && (

            <div>

              <div className="flex items-center gap-2 mb-3">

                <Gauge size={16} className="text-[var(--color-text-secondary)]" />

                <p className="text-sm text-[var(--color-text-secondary)]">

                  Sensitivity — which lever matters most

                </p>

              </div>

              <div

                className="bg-[var(--color-ink)] border border-[var(--color-border)] rounded-xl p-4"

                style={{ height: Math.max(160, result.sensitivity.length * 50) }}

              >

                <ResponsiveContainer width="100%" height="100%">

                  <BarChart

                    data={result.sensitivity}

                    layout="vertical"

                    margin={{ left: 10, right: 20 }}

                  >

                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />

                    <XAxis type="number" stroke="var(--color-text-muted)" fontSize={12} />

                    <YAxis

                      type="category"

                      dataKey="variable"

                      stroke="var(--color-text-muted)"

                      fontSize={12}

                      width={110}

                    />

                    <Tooltip

                      contentStyle={{

                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        fontSize: "12px"

                      }}

                      formatter={(value: any, name: any, props: any) => [

                        `${props.payload.low_target} → ${props.payload.high_target}`,
                        "Predicted range"

                      ]}

                    />

                    {/* Invisible base bar positions the visible bar at
                        low_target instead of starting from zero — this
                        is what makes it a "floating range" bar
                        (tornado chart) instead of a normal bar chart. */}

                    <Bar dataKey="low_target" stackId="range" fill="transparent" />

                    <Bar

                      dataKey="impact_range"

                      stackId="range"

                      fill="var(--color-teal)"

                      radius={[0, 4, 4, 0]}

                    />

                  </BarChart>

                </ResponsiveContainer>

              </div>

              <p className="text-xs text-[var(--color-text-muted)] mt-2">

                Each bar shows how far {result.target_column} moves when that one variable
                is swept across its full range, holding every other variable at the
                recommended value — longer bar means a more powerful lever.

              </p>

            </div>

          )}

        </div>

      )}

      {/* Scenario comparison history */}

      {runHistory.length > 1 && (

        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">

          <div className="flex items-center gap-2 mb-4">

            <History size={16} className="text-[var(--color-text-secondary)]" />

            <p className="text-sm text-[var(--color-text-secondary)]">

              Compare this session's scenarios

            </p>

          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">

            <table className="w-full text-sm">

              <thead>

                <tr className="bg-[var(--color-ink)]">

                  <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Scenario</th>
                  <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Variables</th>
                  <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Predicted target</th>
                  <th className="px-4 py-2.5"></th>

                </tr>

              </thead>

              <tbody>

                {runHistory.map((run) => (

                  <tr key={run.id} className="border-t border-[var(--color-border)]">

                    <td className="px-4 py-2.5 text-[var(--color-text-primary)] font-medium">

                      {run.label}

                    </td>

                    <td className="px-4 py-2.5 text-[var(--color-text-secondary)] text-xs">

                      {Object.entries(run.best_values)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")}

                    </td>

                    <td className="px-4 py-2.5 data-num text-[var(--color-accent)] font-semibold">

                      {run.predicted_target}

                    </td>

                    <td className="px-4 py-2.5 text-right">

                      <button

                        onClick={() => removeFromHistory(run.id)}

                        className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"

                      >

                        <X size={14} />

                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </motion.div>

  );

}