"use client";

import { motion } from "framer-motion";
import {
  Target,
  FileSearch,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  Briefcase
} from "lucide-react";


type RecommendationCard = {
  problem: string;
  evidence: string;
  cause: string;
  recommendation: string;
  impact: string;
};

export default function BusinessRecommendationsCard({

  data

}: {

  data: any;

}) {

  const cards: RecommendationCard[] = data?.business_recommendations || [];

  if (cards.length === 0) return null;

  const rows = [
    { key: "problem" as const, label: "Problem", icon: Target, color: "text-[var(--color-danger)]" },
    { key: "evidence" as const, label: "Evidence", icon: FileSearch, color: "text-[var(--color-text-secondary)]" },
    { key: "cause" as const, label: "Likely Cause", icon: HelpCircle, color: "text-[var(--color-teal)]" },
    { key: "recommendation" as const, label: "Recommendation", icon: Lightbulb, color: "text-[var(--color-accent)]" },
    { key: "impact" as const, label: "Expected Impact", icon: TrendingUp, color: "text-[var(--color-success)]" }
  ];

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

        <div className="p-3 rounded-lg bg-[var(--color-accent-dim)]">

          <Briefcase className="text-[var(--color-accent)]" size={22} />

        </div>

        <div>

          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">

            Business Recommendations

          </h2>

          <p className="text-sm text-[var(--color-text-secondary)]">

            What this data means for the business, and what to do about it

          </p>

        </div>

      </div>

      <div className="space-y-4">

        {cards.map((card, index) => (

          <div

            key={index}

            className="
            bg-[var(--color-ink)]
            border border-[var(--color-border)]
            rounded-lg
            p-4
            "

          >

            <div className="space-y-2.5">

              {rows.map((row) => (

                <div key={row.key} className="flex items-start gap-2.5">

                  <row.icon size={15} className={`${row.color} mt-0.5 flex-shrink-0`} />

                  <div className="min-w-0">

                    <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">

                      {row.label}

                    </span>

                    <p className="text-sm text-[var(--color-text-secondary)]">

                      {card[row.key]}

                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>

        ))}

      </div>

    </motion.div>

  );

}