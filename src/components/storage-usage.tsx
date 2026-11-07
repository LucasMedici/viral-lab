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
        className="group flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-xs text-muted-foreground hover:bg-surface-muted hover:text-foreground"
        aria-label={`Armazenamento: ${formatBytes(shown)} de ${formatBytes(limit)} usados`}
      >
        <HardDrive className="size-3.5" />
        <span className="hidden tabular-nums sm:inline">
          {formatBytes(shown)} <span className="text-muted-foreground/70">/ {formatBytes(limit)}</span>
        </span>
        <span className="relative h-1.5 w-12 overflow-hidden rounded-full bg-surface-muted group-hover:bg-border">
          <span
            className={cn("absolute inset-y-0 left-0 rounded-full", warn ? "bg-warning" : "bg-primary")}
            style={{ width: `${Math.max(pct, shown > 0 ? 4 : 0)}%` }}
          />
        </span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Armazenamento de vídeos">
        <div className="flex flex-col gap-4 text-sm">
          <div>
            <p className="font-display text-3xl font-bold tracking-tight tabular-nums">{pct}%</p>
            <p className="text-muted-foreground">
              {formatBytes(shown)} de {formatBytes(limit)} do plano gratuito do Cloudflare R2
            </p>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-surface-muted">
            <span className={cn("absolute inset-y-0 left-0 rounded-full", warn ? "bg-warning" : "bg-primary")} style={{ width: `${pct}%` }} />
          </div>
          {warn && (
            <p className="rounded-[var(--radius-md)] bg-warning/12 px-3 py-2 text-foreground">
              Você está perto do limite gratuito. Apague os arquivos de vídeos já publicados para evitar cobrança.
            </p>
          )}
          <dl className="grid grid-cols-2 gap-3 rounded-[var(--radius-md)] border border-border p-3">
            <div>
              <dt className="text-xs text-muted-foreground">Arquivos no app</dt>
              <dd className="font-medium tabular-nums">{files}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">No bucket (conferido)</dt>
              <dd className="font-medium tabular-nums">
                {real ? `${formatBytes(real.bytes)} em ${real.objects} ${real.objects === 1 ? "arquivo" : "arquivos"}` : "—"}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
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
