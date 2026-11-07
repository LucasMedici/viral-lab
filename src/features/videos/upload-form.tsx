"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Film, RotateCcw, UploadCloud } from "lucide-react";
import { PlatformIcon } from "@/components/platform-icon";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import type { AccountOption } from "@/features/accounts/queries";
import type { FieldErrors } from "@/lib/action-result";
import { MAX_UPLOAD_BYTES, PLATFORM_LABEL } from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";
import { createVideo, discardUpload, requestUploadUrl } from "./actions";
import { VideoFields } from "./video-fields";

type Upload =
  | { phase: "idle" }
  | { phase: "uploading"; progress: number }
  | { phase: "done"; key: string }
  | { phase: "error"; message: string };

function putWithProgress(url: string, file: File, headers: Record<string, string>, onProgress: (p: number) => void, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`O storage respondeu ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Falha de rede ou CORS do bucket não configurado"));
    signal.addEventListener("abort", () => xhr.abort());
    xhr.send(file);
  });
}

export function UploadForm({ accounts, defaultAccountId }: { accounts: AccountOption[]; defaultAccountId?: string }) {
  const [accountId, setAccountId] = useState(defaultAccountId ?? (accounts.length === 1 ? accounts[0].id : ""));
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [upload, setUpload] = useState<Upload>({ phase: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [dragging, setDragging] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  // Avisa antes de sair com upload em andamento ou não salvo.
  useEffect(() => {
    if (upload.phase !== "uploading" && upload.phase !== "done") return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [upload.phase]);

  async function startUpload(f: File) {
    if (!accountId) {
      setErrors({ account: "Escolha a conta antes do arquivo" });
      return;
    }
    if (!f.type.startsWith("video/")) {
      setUpload({ phase: "error", message: "Esse arquivo não é um vídeo." });
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      setUpload({ phase: "error", message: `O arquivo tem ${formatBytes(f.size)}; o limite é ${formatBytes(MAX_UPLOAD_BYTES)}.` });
      return;
    }
    setErrors({});
    setFile(f);
    // Sugere o título a partir do nome do arquivo, sem apagar o que já foi digitado.
    const title = document.getElementById("title") as HTMLInputElement | null;
    if (title && !title.value) title.value = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    setPreviewUrl(URL.createObjectURL(f));
    setUpload({ phase: "uploading", progress: 0 });

    const res = await requestUploadUrl({ accountId, fileName: f.name, contentType: f.type, size: f.size });
    if (!res.ok) {
      setUpload({ phase: "error", message: res.error });
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await putWithProgress(res.data.url, f, res.data.headers, (p) => setUpload({ phase: "uploading", progress: p }), controller.signal);
      setUpload({ phase: "done", key: res.data.key });
    } catch (e) {
      if (controller.signal.aborted) return;
      setUpload({ phase: "error", message: e instanceof Error ? e.message : "Falha no envio" });
    }
  }

  function resetFile() {
    abortRef.current?.abort();
    if (upload.phase === "done") void discardUpload(upload.key);
    setFile(null);
    setPreviewUrl(null);
    setUpload({ phase: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (upload.phase !== "done" || !file) {
      setFormError(upload.phase === "uploading" ? "Aguarde o envio do arquivo terminar." : "Escolha o arquivo de vídeo.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    setFormError(null);
    startSaving(async () => {
      const res = await createVideo(
        { key: upload.key, name: file.name, size: file.size, type: file.type, accountId },
        null,
        formData,
      );
      if (res && !res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
      }
    });
  }

  const locked = upload.phase === "uploading" || upload.phase === "done";
  const selected = accounts.find((a) => a.id === accountId);

  return (
    <form onSubmit={onSubmit} className="grid gap-10 xl:grid-cols-[19rem_minmax(0,1fr)]">
      <div className="flex w-full max-w-sm flex-col gap-5 xl:max-w-none">
        <Field label="Conta" htmlFor="account" error={errors.account}>
          <Select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={locked} required>
            <option value="" disabled>Escolha a conta</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.display_name} (@{a.username}, {PLATFORM_LABEL[a.platform]})
              </option>
            ))}
          </Select>
        </Field>

        {!file ? (
          <label
            htmlFor="file"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) void startUpload(f);
            }}
            className={cn(
              "flex aspect-[9/16] max-h-[30rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-border bg-surface px-6 text-center transition-colors hover:border-muted/60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
              dragging && "border-text bg-surface-2",
              !accountId && "opacity-60",
            )}
          >
            <span className="grid size-14 place-items-center rounded-full bg-surface-2">
              <UploadCloud className="size-6" strokeWidth={1.75} />
            </span>
            <span className="font-semibold">Arraste o vídeo ou clique para escolher</span>
            <span className="text-meta text-muted">
              {selected ? `Vai para @${selected.username}` : "Escolha a conta primeiro"}. Até {formatBytes(MAX_UPLOAD_BYTES)}.
            </span>
            <input
              ref={inputRef}
              id="file"
              type="file"
              accept="video/*"
              className="sr-only"
              disabled={!accountId}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void startUpload(f);
              }}
            />
          </label>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-surface-2 p-2">
              {previewUrl && <video src={previewUrl} controls playsInline className="aspect-[9/16] max-h-[30rem] w-full rounded-[8px] bg-[#0f0f14] object-contain" />}
            </div>
            <div className="flex items-start gap-2 text-meta">
              <Film className="mt-0.5 size-4 shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{file.name}</p>
                <p className="text-meta text-muted">{formatBytes(file.size)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={resetFile} disabled={saving}>
                <RotateCcw /> Trocar
              </Button>
            </div>
            <UploadStatus upload={upload} onRetry={() => file && void startUpload(file)} />
          </div>
        )}
        {upload.phase === "error" && !file && <p className="text-meta text-danger">{upload.message}</p>}
        {selected && (
          <p className="flex items-center gap-1.5 text-meta text-muted">
            <PlatformIcon platform={selected.platform} className="size-3.5" /> {selected.display_name}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <VideoFields errors={errors} />
        {formError && <p role="alert" className="text-meta text-danger">{formError}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={saving || upload.phase === "uploading"}>
            {saving ? "Salvando…" : upload.phase === "uploading" ? "Enviando arquivo…" : "Salvar vídeo"}
          </Button>
          <p className="text-meta text-muted">O arquivo vai direto para o storage; você pode preencher os campos enquanto ele sobe.</p>
        </div>
      </div>
    </form>
  );
}

function UploadStatus({ upload, onRetry }: { upload: Upload; onRetry: () => void }) {
  if (upload.phase === "uploading") {
    const pct = Math.round(upload.progress * 100);
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-meta tabular-nums text-muted">Enviando {pct}%</p>
      </div>
    );
  }
  if (upload.phase === "done") {
    return (
      <p role="status" className="inline-flex items-center gap-1.5 text-meta font-semibold">
        <Check className="size-4" strokeWidth={2} /> Arquivo enviado. Falta só salvar.
      </p>
    );
  }
  if (upload.phase === "error") {
    return (
      <p role="alert" className="text-meta text-danger">
        {upload.message}.{" "}
        <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-4">Tentar de novo</button>
      </p>
    );
  }
  return null;
}
