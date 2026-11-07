import { z } from "zod";
import { PLATFORMS } from "@/lib/constants";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const accountSchema = z.object({
  platform: z.enum(PLATFORMS, { message: "Escolha a plataforma" }),
  username: z
    .string()
    .trim()
    .transform((v) => v.replace(/^@+/, ""))
    .pipe(
      z
        .string()
        .min(1, "Informe o @ da conta")
        .max(100, "Use no máximo 100 caracteres")
        .regex(/^[A-Za-z0-9._-]+$/, "Use só letras, números, ponto, hífen ou sublinhado"),
    ),
  display_name: z.string().trim().min(1, "Informe o nome da conta").max(120, "Use no máximo 120 caracteres"),
  niche: optionalText(80),
  description: optionalText(1000),
});

export type AccountInput = z.infer<typeof accountSchema>;
