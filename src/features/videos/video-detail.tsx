"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Check, Copy, Download, ExternalLink, FileX2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import type { VideoStatus } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";
import { deleteVideo, deleteVideoFile, getDownloadUrl, updateVideo } from "./actions";
import { VideoFields } from "./video-fields";

// Troca contextual de ícone (os dois ficam no DOM e fazem cross-fade).
const ICON_SWAP = "transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none";
const ICON_IN = "scale-100 opacity-100 blur-[0px]";
const ICON_OUT = "scale-[0.25] opacity-0 blur-[4px]";

type DetailVideo = {
  id: string;
  title: string;
  caption: string | null;
  hashtags: string[];
  status: VideoStatus;
  scheduledLocal: string;
  notes: string | null;
  publishedUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileDeletedAt: string | null;
  hasFile: boolean;
  previewUrl: string | null;
  previewError: boolean;
};

type UpdateResult = ActionResult<{ justPublished: boolean }>;

export function VideoDetail({ video, justUploaded }: { video: DetailVideo; justUploaded: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, saving] = useActionState<UpdateResult | null, FormData>(updateVideo.bind(null, video.id), null);
  const [askDelete, setAskDelete] = useState<"published" | "manual" | null>(null);
  const [handled, setHandled] = useState<UpdateResult | null>(null);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};

  // Reage ao resultado de cada salvamento uma única vez.
  if (state && state !== handled) {
    setHandled(state);
    if (state.ok && state.data.justPublished && video.hasFile) setAskDelete("published");
  }
  useEffect(() => {
    if (!state) return;
    if (state.ok && !(state.data.justPublished && video.hasFile)) {
      toast.success(state.data.justPublished ? "Vídeo marcado como publicado" : "Alterações salvas");
    } else if (!state.ok && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, video.hasFile]);

  useEffect(() => {
    if (!justUploaded) return;
    toast.success("Vídeo salvo. Defina a data quando quiser agendar.");
    window.history.replaceState(null, "", window.location.pathname);
  }, [justUploaded]);

  return (
    <div className="grid gap-10 xl:grid-cols-[21rem_minmax(0,1fr)]">
      <aside className="flex w-full max-w-sm flex-col gap-4 xl:max-w-none">
        <Preview video={video} />
        <FileActions video={video} formRef={formRef} onDelete={() => setAskDelete("manual")} />
      </aside>

      <form ref={formRef} action={formAction} className="flex flex-col gap-8">
        {/* Remonta quando o status muda no servidor (ex.: virou "publicado" ao colar o link). */}
        <VideoFields
          key={video.status}
          defaults={{
            title: video.title,
            caption: video.caption,
            hashtags: video.hashtags,
            status: video.status,
            scheduledLocal: video.scheduledLocal,
            notes: video.notes,
          }}
          errors={errors}
        />

        <section aria-labelledby="publicacao" className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <h2 id="publicacao" className="font-display text-card font-bold">Publicação</h2>
          <Field
            label="Link do post publicado"
            htmlFor="published_url"
            error={errors.published_url}
            hint="Ao salvar com o link, o vídeo é marcado como publicado."
          >
            <Input
              id="published_url"
              name="published_url"
              type="url"
              inputMode="url"
              placeholder="https://www.tiktok.com/@conta/video/…"
              defaultValue={video.publishedUrl ?? ""}
              aria-invalid={!!errors.published_url}
            />
          </Field>
          {video.publishedUrl && (
            <a href={video.publishedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-meta font-semibold text-link underline-offset-4 hover:underline">
              Abrir post <ExternalLink className="size-3.5" />
            </a>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</Button>
          <DeleteVideoButton videoId={video.id} className="ml-auto" />
        </div>
      </form>

      <DeleteFileDialog
        videoId={video.id}
        mode={askDelete}
        onClose={() => setAskDelete(null)}
      />
    </div>
  );
}

function Preview({ video }: { video: DetailVideo }) {
  if (video.fileDeletedAt) {
    return (
      <div className="flex aspect-[9/16] max-h-[34rem] flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-surface-2">
          <FileX2 className="size-6 text-muted" strokeWidth={1.75} />
        </span>
        <p className="font-semibold">Arquivo removido do storage</p>
        <p className="text-meta text-muted">Em {video.fileDeletedAt}. Os dados do vídeo continuam salvos.</p>
      </div>
    );
  }
  if (!video.previewUrl) {
    return (
      <div className="flex aspect-[9/16] max-h-[34rem] items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface px-6 text-center text-meta text-muted">
        {video.previewError ? "Não foi possível gerar o preview. Confira as variáveis do R2." : "Vídeo sem arquivo."}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-surface-2 p-2">
      <video src={video.previewUrl} controls playsInline preload="metadata" className="aspect-[9/16] max-h-[34rem] w-full rounded-[4px] bg-[#0f0f14] object-contain" />
    </div>
  );
}

function FileActions({
  video,
  formRef,
  onDelete,
}: {
  video: DetailVideo;
  formRef: React.RefObject<HTMLFormElement | null>;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, startDownload] = useTransition();

  async function copyCaption() {
    const form = formRef.current;
    const caption = (form?.elements.namedItem("caption") as HTMLTextAreaElement | null)?.value.trim() ?? "";
    const tags = (form?.elements.namedItem("hashtags") as HTMLInputElement | null)?.value.trim() ?? "";
    const text = [caption, tags].filter(Boolean).join("\n\n");
    if (!text) {
      toast.info("Legenda e hashtags estão vazias.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("O navegador bloqueou a cópia. Selecione o texto manualmente.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" onClick={copyCaption} aria-live="polite">
        <span data-icon className="relative grid size-4 place-items-center" aria-hidden="true">
          <Copy className={cn(ICON_SWAP, copied ? ICON_OUT : ICON_IN)} />
          <Check className={cn(ICON_SWAP, "absolute", copied ? ICON_IN : ICON_OUT)} />
        </span>
        {copied ? "Copiado" : "Copiar legenda + hashtags"}
      </Button>
      {video.hasFile && (
        <>
          <Button
            variant="secondary"
            disabled={downloading}
            onClick={() =>
              startDownload(async () => {
                const res = await getDownloadUrl(video.id);
                if (res.ok) window.location.assign(res.data.url);
                else toast.error(res.error);
              })
            }
          >
            <Download /> {downloading ? "Preparando…" : "Baixar arquivo"}
          </Button>
          <Button variant="danger-ghost" onClick={onDelete}>
            <Trash2 /> Apagar arquivo
          </Button>
          {video.fileName && (
            <p className="truncate text-center text-meta text-muted" title={video.fileName}>
              {video.fileName}, {formatBytes(video.fileSize)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function DeleteFileDialog({ videoId, mode, onClose }: { videoId: string; mode: "published" | "manual" | null; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const published = mode === "published";

  return (
    <Dialog
      open={mode !== null}
      onClose={onClose}
      title={published ? "Vídeo marcado como publicado. Apagar o arquivo agora?" : "Apagar o arquivo deste vídeo?"}
    >
      <p className="text-meta text-muted">
        {published
          ? "Liberar o espaço mantém você dentro do plano gratuito. Mantenha o arquivo se ainda for repostar em outra plataforma."
          : "O arquivo sai do storage e não pode ser recuperado. Título, legenda, datas e link continuam salvos."}
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          {published ? "Manter (vou repostar)" : "Cancelar"}
        </Button>
        <Button
          variant="danger"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await deleteVideoFile(videoId);
              if (res.ok) {
                toast.success("Arquivo apagado");
                onClose();
              } else {
                toast.error(res.error);
              }
            })
          }
        >
          {pending ? "Apagando…" : published ? "Apagar agora" : "Apagar arquivo"}
        </Button>
      </div>
    </Dialog>
  );
}

function DeleteVideoButton({ videoId, className }: { videoId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button variant="danger-ghost" size="sm" className={className} onClick={() => setOpen(true)}>
        Excluir vídeo
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Excluir este vídeo?">
        <p className="text-meta text-muted">
          Remove o registro e o arquivo. Para manter o histórico e liberar só o espaço, use “Apagar arquivo”.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteVideo(videoId);
                if (res && !res.ok) toast.error(res.error);
              })
            }
          >
            {pending ? "Excluindo…" : "Excluir vídeo"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
