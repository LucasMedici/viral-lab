import { cn } from "@/lib/utils";

/** Tecla de atalho (ex.: Ctrl, K, ↵). */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-grid h-5 min-w-5 place-items-center rounded-[5px] border border-border bg-surface px-1 font-sans text-[0.6875rem] font-semibold leading-none text-muted",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
