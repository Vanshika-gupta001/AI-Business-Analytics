"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingUp, TrendingDown, ShieldCheck } from "lucide-react";


type AnomalyDetail = {
  column: string;
  row_index: number;
  value: number;
  z_score: number;
  direction: "unusually high" | "unusually low";
};

export default function AnomalyDetectionCard({

  data

}: {

  data: any;

}) {

  const anomalies = data?.anomalies;

  if (!anomalies) return null;

  const total: number = anomalies.total_anomalies || 0;

  const details: AnomalyDetail[] = anomalies.details || [];

  return (

    <motion.div

      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}

      className="
      bg-[var(--color-surface)]
      border border-[var(--color-border)]
      rounded-xl
      p-6
      "

    >

      <div className="flex items-center gap-3 mb-5">

        <div className={`p-3 rounded-lg ${total > 0 ? "bg-[var(--color-danger)]/15" : "bg-[var(--color-success)]/15"}`}>

          {total > 0 ? (
            <AlertTriangle className="text-[var(--color-danger)]" size={22} />
          ) : (
            <ShieldCheck className="text-[var(--color-success)]" size={22} />
          )}

        </div>

        <div>

          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">

            Anomaly Detection

          </h2>

          <p className="text-sm text-[var(--color-text-secondary)]">

            {total > 0

              ? `${total} statistical outlier${total > 1 ? "s" : ""} found (values more than 3 standard deviations from the mean)`

              : "No statistical outliers detected in numeric columns"

            }

          </p>

        </div>

      </div>

      {details.length > 0 && (

        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">

          <table className="w-full text-sm">

            <thead>

              <tr className="bg-[var(--color-ink)]">

                <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Row</th>
                <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Column</th>
                <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Value</th>
                <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Z-score</th>
                <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Why it's flagged</th>

              </tr>

            </thead>

            <tbody>

              {details.map((d, index) => (

                <tr key={index} className="border-t border-[var(--color-border)]">

                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] data-num">#{d.row_index}</td>

                  <td className="px-4 py-2.5 text-[var(--color-text-primary)] font-medium">{d.column}</td>

                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] data-num">{d.value}</td>

                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] data-num">{d.z_score}</td>

                  <td className="px-4 py-2.5">

                    <span className="flex items-center gap-1.5 text-xs text-[var(--color-danger)]">

                      {d.direction === "unusually high" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}

                      {d.direction}

                    </span>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </motion.div>

  );

}