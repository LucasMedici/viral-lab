import { siInstagram, siTiktok, siYoutube } from "simple-icons";
import { PLATFORM_LABEL, type Platform } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PATHS: Record<Platform, string> = {
  tiktok: siTiktok.path,
  youtube: siYoutube.path,
  instagram: siInstagram.path,
};

const COLORS: Record<Platform, string> = {
  tiktok: "text-platform-tiktok",
  youtube: "text-platform-youtube",
  instagram: "text-platform-instagram",
};

export function PlatformIcon({
  platform,
  className,
  colored = true,
}: {
  platform: Platform;
  className?: string;
  colored?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={PLATFORM_LABEL[platform]}
      className={cn("shrink-0 fill-current", !className?.includes("size-") && "size-5", colored && COLORS[platform], className)}
    >
      <path d={PATHS[platform]} />
    </svg>
  );
}
