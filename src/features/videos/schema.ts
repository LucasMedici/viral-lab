import { z } from "zod";
import { MAX_UPLOAD_BYTES, VIDEO_STATUSES } from "@/lib/constants";
import { parseHashtags } from "@/lib/utils";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const videoFieldsSchema = z.object({
  title: z.string().trim().min(1, "Dê um título ao vídeo").max(200, "Use no máximo 200 caracteres"),
  caption: optionalText(5000),
  hashtags: z
    .string()
    .optional()
    .transform((v) => parseHashtags(v))
    .pipe(z.array(z.string().max(100)).max(60, "Use no máximo 60 hashtags")),
  status: z.enum(VIDEO_STATUSES, { message: "Escolha um status" }),
  scheduled_at: z.string().optional(), // datetime-local, convertido no servidor
  notes: optionalText(5000),
});

export const videoUpdateSchema = videoFieldsSchema.extend({
  published_url: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.url({ message: "Cole o link completo do post (https://…)", protocol: /^https?$/ }).nullable()),
});

export const uploadRequestSchema = z.object({
  accountId: z.uuid("Escolha a conta"),
  fileName: z.string().min(1).max(255),
  contentType: z.string().regex(/^video\//, "Envie um arquivo de vídeo"),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_BYTES, `O arquivo passa de ${MAX_UPLOAD_BYTES / 1024 ** 3} GB`),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;
