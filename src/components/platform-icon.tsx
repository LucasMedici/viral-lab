import { siInstagram, siTiktok, siYoutube } from "simple-icons";
import { PLATFORM_LABEL, type Platform } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PATHS: Record<Platform, string> = {
  tiktok: siTiktok.path,
  youtube: siYoutube.path,
  instagram: siInstagram.path,
};

/**
 * Ícone da plataforma, sempre na cor do texto (docs/BRAND.md: sem cores fora da paleta).
 * Use `decorative` quando o nome da plataforma já estiver escrito ao lado,
 * para o leitor de tela não repetir ("TikTok TikTok").
 */
export function PlatformIcon({
  platform,
  className,
  decorative = false,
}: {
  platform: Platform;
  className?: string;
  decorative?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": PLATFORM_LABEL[platform] })}
      className={cn("shrink-0 fill-current", !className?.includes("size-") && "size-5", className)}
    >
      <path d={PATHS[platform]} />
    </svg>
  );
}
