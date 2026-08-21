"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import OnboardingBot from "../../components/OnboardingBot";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-ink)] px-4">
      <div className="w-full max-w-sm">

        <OnboardingBot
          message="Welcome to AI Business Analytics! Please log in below — new here? Tap Register if you don't have an account yet."
        />

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-accent)]/5 border border-white/10 rounded-xl p-8"
        >
          <h1 className="text-2xl font-semibold mb-6">Log in</h1>

          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 rounded-lg bg-[var(--color-ink)] border border-[var(--color-border)] px-3 py-2"
          />

          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 rounded-lg bg-[var(--color-ink)] border border-[var(--color-border)] px-3 py-2"
          />

          {error && (
            <p className="text-[var(--color-danger)] text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-accent)] text-[var(--color-ink)] rounded-xl py-2 font-semibold disabled:opacity-40"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

          <p className="text-sm text-[var(--color-text-secondary)] mt-4">
            No account?{" "}
            <Link href="/register" className="text-[var(--color-accent)]">
              Register
            </Link>
          </p>
        </form>

      </div>
    </div>
  );
}