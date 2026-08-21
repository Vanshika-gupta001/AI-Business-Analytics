"use client";

import { AlertTriangle } from "lucide-react";


export default function ConfirmModal({

  open,

  title,

  message,

  confirmLabel = "Delete",

  onConfirm,

  onCancel

}: {

  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;

}) {

  if (!open) return null;

  return (

    <div

      onClick={onCancel}

      className="
      fixed
      inset-0
      bg-black/60
      backdrop-blur-sm
      z-[100]
      flex
      items-center
      justify-center
      p-4
      "

    >

      <div

        onClick={(e) => e.stopPropagation()}

        className="
        bg-[var(--color-surface)]
        border
        border-[var(--color-border)]
        rounded-xl
        p-6
        max-w-sm
        w-full
        "

      >

        <div className="flex items-start gap-3 mb-4">

          <div className="p-2.5 rounded-lg bg-[var(--color-danger)]/15 flex-shrink-0">

            <AlertTriangle size={20} className="text-[var(--color-danger)]" />

          </div>

          <div>

            <h3 className="font-semibold text-[var(--color-text-primary)]">{title}</h3>

            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{message}</p>

          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button

            onClick={onCancel}

            className="
            px-4
            py-2
            rounded-lg
            text-sm
            text-[var(--color-text-secondary)]
            hover:text-[var(--color-text-primary)]
            hover:bg-[var(--color-surface-raised)]
            transition-colors
            "

          >

            Cancel

          </button>

          <button

            onClick={onConfirm}

            className="
            px-4
            py-2
            rounded-lg
            text-sm
            font-medium
            bg-[var(--color-danger)]
            text-white
            hover:opacity-90
            transition-opacity
            "

          >

            {confirmLabel}

          </button>

        </div>

      </div>

    </div>

  );

}