"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import DatasetHistory from "@/components/DatasetHistory";
import { useAuth } from "../../lib/auth-context";


export default function HistoryPage() {

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-ink)] text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  return (

    <div className="flex">

      <Sidebar onOpenChat={() => router.push("/?openChat=1")} />

      <main

        className="
        md:ml-64
        min-h-screen
        flex-1
        bg-[var(--color-ink)]
        text-[var(--color-text-primary)]
        p-6
        md:p-8
        "

      >

        <div className="mb-8">

          <h1 className="text-3xl font-semibold tracking-tight">

            Dataset History

          </h1>

          <p className="text-[var(--color-text-secondary)] mt-1.5">

            All your previous uploads — reopen any of them without re-analyzing.

          </p>

        </div>

        <DatasetHistory

          refreshKey="history-page"

          onSelect={(data) => router.push(`/?dataset=${data.dataset_id}`)}

        />

      </main>

    </div>

  );

}