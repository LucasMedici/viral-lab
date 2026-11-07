import { cn } from "@/lib/utils";

/**
 * Logo provisória do ViralLab.
 * Para trocar pela logo definitiva, substitua o conteúdo deste componente
 * (ex.: por <Image src="/logo.svg" … />) e os arquivos em /public.
 */
export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-7" />
      {showWordmark && (
        <span className="font-display text-[1.3rem] font-bold leading-none tracking-[-0.04em] text-foreground">
          ViralLab
        </span>
      )}
    </span>
  );
}

/** Marca: um quadro vertical 9:16 (vídeo curto) com uma "cultura" crescendo no canto. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="16" className="fill-primary" />
      <rect x="21" y="12" width="22" height="40" rx="6" fill="none" className="stroke-primary-foreground" strokeWidth="4" />
      <circle cx="43" cy="44" r="8" className="fill-accent stroke-primary" strokeWidth="3" />
    </svg>
  );
}
