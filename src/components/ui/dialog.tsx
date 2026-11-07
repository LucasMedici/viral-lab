"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Diálogo modal usando o elemento nativo <dialog> (foco, Esc e backdrop de graça). */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
      className={cn(
        "m-auto w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-lg)] border border-border bg-surface p-0 text-foreground shadow-2xl",
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id="dialog-title" className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
