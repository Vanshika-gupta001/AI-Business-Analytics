"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function HealthCard({
  score,
  status,
  grade,
  breakdown,
}: {
  score: number;
  status: string;
  grade: string;
  breakdown?: {
    completeness_score: number;
    uniqueness_score: number;
    missing_cells: number;
    total_cells: number;
    duplicate_rows: number;
    total_rows: number;
    weights: { completeness: number; uniqueness: number };
  };
}) {

  const percentage = score;

  return (

    <motion.div

      initial={{ opacity: 0, y: 20 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.5 }}

      className="
      bg-[var(--color-surface)]
      border border-[var(--color-border)]
      rounded-xl
      p-6
      "

    >

      {/* Header */}

      <div className="flex items-center gap-3">

        <div className="
          p-3
          rounded-lg
          bg-[var(--color-accent-dim)]
        ">

          <Activity 
            className="text-[var(--color-accent)]"
            size={22}
          />

        </div>


        <div>

          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">

            Data Health Score

          </h2>


          <p className="text-sm text-[var(--color-text-secondary)]">

            Dataset Quality Analysis

          </p>

        </div>

      </div>



      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-8">

        {/* Score Circle */}

        <div
          className="
          w-32
          h-32
          rounded-full
          border-4
          border-[var(--color-accent)]
          flex
          flex-col
          items-center
          justify-center
          flex-shrink-0
          "
        >

          <motion.span

            initial={{scale:0}}

            animate={{scale:1}}

            transition={{duration:0.5}}

            className="data-num text-3xl font-semibold text-[var(--color-text-primary)]"

          >

            {percentage}

          </motion.span>


          <span className="text-[var(--color-text-muted)] text-xs">

            / 100

          </span>

        </div>

        {/* Breakdown — what's actually contributing to the score */}

        {breakdown && (

          <div className="flex-1 w-full space-y-3">

            <div>

              <div className="flex items-center justify-between text-xs mb-1">

                <span className="text-[var(--color-text-secondary)]">

                  Completeness ({Math.round(breakdown.weights.completeness * 100)}% weight)

                </span>

                <span className="data-num text-[var(--color-text-primary)]">

                  {breakdown.completeness_score}%

                </span>

              </div>

              <div className="h-1.5 rounded-full bg-[var(--color-ink)] overflow-hidden">

                <div

                  className="h-full bg-[var(--color-accent)]"

                  style={{ width: `${breakdown.completeness_score}%` }}

                />

              </div>

              <p className="text-xs text-[var(--color-text-muted)] mt-1">

                {breakdown.missing_cells} of {breakdown.total_cells} cells missing

              </p>

            </div>

            <div>

              <div className="flex items-center justify-between text-xs mb-1">

                <span className="text-[var(--color-text-secondary)]">

                  Uniqueness ({Math.round(breakdown.weights.uniqueness * 100)}% weight)

                </span>

                <span className="data-num text-[var(--color-text-primary)]">

                  {breakdown.uniqueness_score}%

                </span>

              </div>

              <div className="h-1.5 rounded-full bg-[var(--color-ink)] overflow-hidden">

                <div

                  className="h-full bg-[var(--color-teal)]"

                  style={{ width: `${breakdown.uniqueness_score}%` }}

                />

              </div>

              <p className="text-xs text-[var(--color-text-muted)] mt-1">

                {breakdown.duplicate_rows} of {breakdown.total_rows} rows duplicated

              </p>

            </div>

          </div>

        )}

      </div>




      {/* Status */}

      <div className="flex justify-center gap-2 mt-6">


        <span
          className="
          px-3
          py-1.5
          rounded-full
          bg-[var(--color-success)]/15
          text-[var(--color-success)]
          text-xs
          font-medium
          "
        >

          {status}

        </span>



        <span
          className="
          px-3
          py-1.5
          rounded-full
          bg-[var(--color-accent-dim)]
          text-[var(--color-accent)]
          text-xs
          font-medium
          "
        >

          Grade {grade}

        </span>


      </div>


    </motion.div>

  );
}