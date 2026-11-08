"use client";

import { useState, useTransition } from "react";
import { HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { syncBucketUsage } from "@/features/videos/actions";
import { STORAGE_WARN_RATIO } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";

/**
 * Uso do armazenamento em relação ao teto do app (`hardLimit`, que bloqueia novos
 * envios) e ao plano gratuito do R2 (`limit`).
 */
export function StorageUsage({
  bytes,
  files,
  limit,
  hardLimit,
}: {
  bytes: number;
  files: number;
  limit: number;
  hardLimit: number;
}) {
  const [open, setOpen] = useState(false);
  const [real, setReal] = useState<{ bytes: number; objects: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shown = Math.max(real?.bytes ?? 0, bytes);
  const ratio = Math.min(shown / hardLimit, 1);
  const full = shown >= hardLimit;
  const warn = !full && ratio >= STORAGE_WARN_RATIO;
  const pct = Math.round(ratio * 100);
  const barColor = full ? "bg-danger" : warn ? "bg-status-agendado" : "bg-accent";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full flex-col gap-2 rounded-[var(--radius-control)] px-3 py-2.5 text-left text-meta text-muted transition-colors hover:bg-surface-2 hover:text-text"
        aria-label={`Armazenamento: ${formatBytes(shown)} de ${formatBytes(hardLimit)} usados${full ? ", envios bloqueados" : ""}`}
      >
        <span className="flex items-center gap-2">
          <HardDrive className="size-4" strokeWidth={2} />
          <span className="font-semibold text-text">Armazenamento</span>
          <span className={cn("ml-auto tabular-nums", full && "font-semibold text-danger")}>{pct}%</span>
        </span>
        <span className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-2 group-hover:bg-border">
          <span
            className={cn("absolute inset-y-0 left-0 rounded-full", barColor)}
            style={{ width: `${Math.max(pct, shown > 0 ? 3 : 0)}%` }}
          />
        </span>
        <span className={cn("tabular-nums", full && "text-danger")}>
          {full ? "Limite atingido, envios bloqueados" : `${formatBytes(shown)} de ${formatBytes(hardLimit)}`}
        </span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Armazenamento de vídeos">
        <div className="flex flex-col gap-4 text-meta">
          <div>
            <p className="font-display text-page font-bold tabular-nums">{pct}%</p>
            <p className="mt-2 text-muted">
              {formatBytes(shown)} de {formatBytes(hardLimit)}, o limite do app
            </p>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-surface-2">
            <span className={cn("absolute inset-y-0 left-0 rounded-full", barColor)} style={{ width: `${pct}%` }} />
          </div>
          {full ? (
            <p className="rounded-[var(--radius-control)] border border-danger/40 bg-danger/10 px-3 py-2 text-text">
              Limite atingido: novos envios estão bloqueados. Apague os arquivos de vídeos já publicados para liberar espaço.
            </p>
          ) : warn ? (
            <p className="rounded-[var(--radius-control)] border border-status-agendado/40 bg-status-agendado/10 px-3 py-2 text-text">
              Você está perto do limite. Apague os arquivos de vídeos já publicados para continuar enviando.
            </p>
          ) : null}
          <dl className="grid grid-cols-2 gap-3 rounded-[var(--radius-control)] bg-surface-2 p-3">
            <div>
              <dt className="text-meta text-muted">Limite do app</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{formatBytes(hardLimit)}</dd>
            </div>
            <div>
              <dt className="text-meta text-muted">Grátis no Cloudflare R2</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{formatBytes(limit)}</dd>
            </div>
            <div>
              <dt className="text-meta text-muted">Arquivos no app</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{files}</dd>
            </div>
            <div>
              <dt className="text-meta text-muted">No bucket (conferido)</dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {real ? `${formatBytes(real.bytes)} em ${real.objects} ${real.objects === 1 ? "arquivo" : "arquivos"}` : "—"}
              </dd>
            </div>
          </dl>
          <p className="text-meta text-muted">
            O app recusa envios que passariam do limite, para nunca sair do plano gratuito. O uso vem dos tamanhos registrados no banco; “Conferir no bucket” lista os arquivos direto no R2.
          </p>
          {error && <p className="text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Fechar</Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const res = await syncBucketUsage();
                  if (res.ok) setReal(res.data);
                  else setError(res.error);
                })
              }
            >
              {pending ? "Conferindo…" : "Conferir no bucket"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
