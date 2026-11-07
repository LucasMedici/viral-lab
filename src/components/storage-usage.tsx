"use client";

import { useState, useTransition } from "react";
import { HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { syncBucketUsage } from "@/features/videos/actions";
import { STORAGE_WARN_RATIO } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";

export function StorageUsage({ bytes, files, limit }: { bytes: number; files: number; limit: number }) {
  const [open, setOpen] = useState(false);
  const [real, setReal] = useState<{ bytes: number; objects: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shown = real?.bytes ?? bytes;
  const ratio = Math.min(shown / limit, 1);
  const warn = ratio >= STORAGE_WARN_RATIO;
  const pct = Math.round(ratio * 100);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-9 items-center gap-2 rounded-full px-3 text-meta text-muted transition-colors hover:bg-surface-2 hover:text-text"
        aria-label={`Armazenamento: ${formatBytes(shown)} de ${formatBytes(limit)} usados`}
      >
        <HardDrive className="size-4" strokeWidth={2} />
        <span className="hidden tabular-nums sm:inline">
          {formatBytes(shown)} <span className="text-muted/70">/ {formatBytes(limit)}</span>
        </span>
        <span className="relative h-1.5 w-12 overflow-hidden rounded-full bg-surface-2 group-hover:bg-border max-sm:hidden">
          <span
            className={cn("absolute inset-y-0 left-0 rounded-full", warn ? "bg-status-agendado" : "bg-accent")}
            style={{ width: `${Math.max(pct, shown > 0 ? 4 : 0)}%` }}
          />
        </span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Armazenamento de vídeos">
        <div className="flex flex-col gap-4 text-meta">
          <div>
            <p className="font-display text-page font-bold tabular-nums">{pct}%</p>
            <p className="mt-2 text-muted">
              {formatBytes(shown)} de {formatBytes(limit)} do plano gratuito do Cloudflare R2
            </p>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-surface-2">
            <span className={cn("absolute inset-y-0 left-0 rounded-full", warn ? "bg-status-agendado" : "bg-accent")} style={{ width: `${pct}%` }} />
          </div>
          {warn && (
            <p className="rounded-[var(--radius-control)] border border-status-agendado/40 bg-status-agendado/10 px-3 py-2 text-text">
              Você está perto do limite gratuito. Apague os arquivos de vídeos já publicados para evitar cobrança.
            </p>
          )}
          <dl className="grid grid-cols-2 gap-3 rounded-[var(--radius-control)] bg-surface-2 p-3">
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
            O valor padrão é calculado pelos tamanhos registrados no banco. “Conferir no bucket” lista os objetos direto no R2.
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
