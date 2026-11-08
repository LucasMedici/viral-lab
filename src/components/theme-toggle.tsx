"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "dark", label: "Tema escuro", Icon: Moon },
  { value: "light", label: "Tema claro", Icon: Sun },
  { value: "system", label: "Seguir o sistema", Icon: Monitor },
] as const;

const subscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // O tema só é conhecido no cliente; evita divergência de hidratação.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div role="radiogroup" aria-label="Tema" className={cn("flex items-center gap-1 rounded-full bg-surface-2 p-0.5", className)}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "relative grid size-8 place-items-center rounded-full text-muted transition-colors after:absolute after:-inset-x-0.5 after:-inset-y-1 hover:text-text",
              active && "bg-surface text-text",
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
