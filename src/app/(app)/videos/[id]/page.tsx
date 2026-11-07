import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlatformIcon } from "@/components/platform-icon";
import { StatusBadge } from "@/components/status-badge";
import { getVideo } from "@/features/videos/queries";
import { VideoDetail } from "@/features/videos/video-detail";
import { PLATFORM_FORMAT } from "@/lib/constants";
import { formatTz, toDateTimeLocal } from "@/lib/dates";
import { storage } from "@/lib/storage";

export async function generateMetadata({ params }: PageProps<"/videos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideo(id);
  return { title: video?.title ?? "Vídeo" };
}

export default async function VideoPage({ params, searchParams }: PageProps<"/videos/[id]">) {
  const { id } = await params;
  const { enviado } = await searchParams;
  const video = await getVideo(id);
  if (!video || !video.account) notFound();

  const hasFile = !!video.file_key && !video.file_deleted_at;
  let previewUrl: string | null = null;
  let previewError = false;
  if (hasFile) {
    try {
      previewUrl = await storage.createPreviewUrl(video.file_key!);
    } catch {
      previewError = true;
    }
  }

  const account = video.account;
  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href={`/contas/${account.id}`} className="inline-flex items-center gap-1.5 text-meta text-muted hover:text-text">
          <PlatformIcon platform={account.platform} className="size-3.5" />
          {account.display_name}
        </Link>
        <h1 className="mt-2 font-display text-page font-bold">{video.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted">
          <StatusBadge status={video.status} />
          <span>
            {PLATFORM_FORMAT[account.platform]} de @{account.username}
          </span>
          {video.scheduled_at && <span>{formatTz(video.scheduled_at, "EEEE, d 'de' MMMM 'às' HH:mm")}</span>}
        </div>
      </header>

      <VideoDetail
        video={{
          id: video.id,
          title: video.title,
          caption: video.caption,
          hashtags: video.hashtags,
          status: video.status,
          scheduledLocal: toDateTimeLocal(video.scheduled_at),
          notes: video.notes,
          publishedUrl: video.published_url,
          fileName: video.file_name,
          fileSize: video.file_size_bytes,
          fileDeletedAt: video.file_deleted_at ? formatTz(video.file_deleted_at, "dd/MM/yyyy 'às' HH:mm") : null,
          hasFile,
          previewUrl,
          previewError,
        }}
        justUploaded={enviado === "1"}
      />
    </div>
  );
}
