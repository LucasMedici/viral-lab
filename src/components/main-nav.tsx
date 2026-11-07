"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Contas", Icon: LayoutGrid, match: (p: string) => p !== "/videos/novo" },
  { href: "/videos/novo", label: "Enviar vídeo", Icon: Upload, match: (p: string) => p === "/videos/novo" },
];

/** Navegação principal em pílulas; o item ativo fica preenchido. */
export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex items-center gap-1">
      {ITEMS.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-meta font-semibold transition-colors",
              active ? "bg-surface-2 text-text" : "text-muted hover:text-text",
            )}
          >
            <Icon className="size-4" strokeWidth={2} />
            <span className="max-sm:sr-only">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
