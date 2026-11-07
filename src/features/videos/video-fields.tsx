"use client";

import { useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { FieldErrors } from "@/lib/action-result";
import { STATUS_LABEL, VIDEO_STATUSES, type VideoStatus } from "@/lib/constants";
import { APP_TZ } from "@/lib/dates";
import { HashtagInput } from "./hashtag-input";

/** Campos editáveis comuns ao upload e ao detalhe do vídeo. */
export function VideoFields({
  defaults,
  errors = {},
}: {
  defaults?: {
    title?: string;
    caption?: string | null;
    hashtags?: string[];
    status?: VideoStatus;
    scheduledLocal?: string;
    notes?: string | null;
  };
  errors?: FieldErrors;
}) {
  const [status, setStatus] = useState<VideoStatus>(defaults?.status ?? "gerado");
  const [scheduled, setScheduled] = useState(defaults?.scheduledLocal ?? "");
  const suggestScheduled = !!scheduled && (status === "gerado" || status === "aprovado");

  return (
    <div className="flex flex-col gap-5">
      <Field label="Título" htmlFor="title" error={errors.title} hint="Só para você identificar o vídeo no app.">
        <Input id="title" name="title" defaultValue={defaults?.title} required aria-invalid={!!errors.title} />
      </Field>

      <Field label="Legenda" htmlFor="caption" error={errors.caption}>
        <Textarea id="caption" name="caption" defaultValue={defaults?.caption ?? ""} rows={5} />
      </Field>

      <Field label="Hashtags" htmlFor="hashtags-input" error={errors.hashtags} hint="Enter, espaço ou vírgula separam as hashtags.">
        <HashtagInput id="hashtags-input" name="hashtags" defaultValue={defaults?.hashtags} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Data e hora"
          htmlFor="scheduled_at"
          error={errors.scheduled_at}
          hint={APP_TZ === "America/Sao_Paulo" ? "Horário de Brasília" : APP_TZ}
        >
          <Input
            id="scheduled_at"
            name="scheduled_at"
            type="datetime-local"
            value={scheduled}
            onChange={(e) => setScheduled(e.target.value)}
          />
        </Field>
        <Field label="Status" htmlFor="status" error={errors.status}>
          <Select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as VideoStatus)}>
            {VIDEO_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </Select>
        </Field>
      </div>
      {suggestScheduled && (
        <p className="-mt-2 flex flex-wrap items-center gap-2 text-meta text-muted">
          O vídeo tem data marcada.
          <button type="button" onClick={() => setStatus("agendado")} className="font-semibold text-link underline-offset-4 hover:underline">
            Marcar como agendado
          </button>
        </p>
      )}

      <Field label="Notas" htmlFor="notes" error={errors.notes}>
        <Textarea id="notes" name="notes" defaultValue={defaults?.notes ?? ""} rows={3} placeholder="Ideias de repost, música usada, ajustes pendentes…" />
      </Field>
    </div>
  );
}
