"use client";

import { useEffect, useState } from "react";

import { Bot, X } from "lucide-react";


export default function OnboardingBot({

  message,

  storageKey

}: {

  message: string;

  // If provided, "seen" state persists per-browser under this key so the
  // greeting only shows once (e.g. first dashboard visit). If omitted,
  // dismissing just hides it for this render — fine for pages like
  // /login where reshowing on the next visit is harmless.
  storageKey?: string;

}) {

  const [visible, setVisible] = useState(false);

  useEffect(() => {

    if (!storageKey) {

      setVisible(true);

      return;

    }

    const seen = typeof window !== "undefined" && localStorage.getItem(storageKey);

    setVisible(!seen);

  }, [storageKey]);

  function dismiss() {

    setVisible(false);

    if (storageKey && typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true");
    }

  }

  if (!visible) return null;

  return (

    <div

      className="
      flex
      items-start
      gap-3
      bg-[var(--color-surface)]
      border
      border-[var(--color-border)]
      rounded-xl
      p-4
      mb-6
      relative
      "

    >

      <div

        className="
        w-9
        h-9
        rounded-full
        bg-[var(--color-accent)]
        flex
        items-center
        justify-center
        flex-shrink-0
        "

      >

        <Bot size={18} className="text-[var(--color-ink)]" />

      </div>

      <p className="text-sm text-[var(--color-text-secondary)] pr-6 whitespace-pre-line leading-relaxed">

        {message}

      </p>

      <button

        onClick={dismiss}

        title="Dismiss"

        className="
        absolute
        top-3
        right-3
        text-[var(--color-text-muted)]
        hover:text-[var(--color-text-primary)]
        transition-colors
        "

      >

        <X size={16} />

      </button>

    </div>

  );

}