import { siInstagram, siTiktok, siYoutube } from "simple-icons";
import { PLATFORM_LABEL, type Platform } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PATHS: Record<Platform, string> = {
  tiktok: siTiktok.path,
  youtube: siYoutube.path,
  instagram: siInstagram.path,
};

/** Ícone da plataforma, sempre na cor do texto (docs/BRAND.md: sem cores fora da paleta). */
export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={PLATFORM_LABEL[platform]}
      className={cn("shrink-0 fill-current", !className?.includes("size-") && "size-5", className)}
    >
      <path d={PATHS[platform]} />
    </svg>
  );
}
