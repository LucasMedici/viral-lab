"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { PlatformIcon } from "@/components/platform-icon";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import { PLATFORM_LABEL, PLATFORMS, type Platform } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Account } from "@/types/database";
import { deleteAccount, saveAccount } from "./actions";

export function AccountForm({ account }: { account?: Account }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    saveAccount.bind(null, account?.id ?? null),
    null,
  );
  const [platform, setPlatform] = useState<Platform | undefined>(account?.platform);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-meta font-semibold">Plataforma</legend>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map((p) => (
            <label
              key={p}
              className={cn(
                "flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-3.5 font-semibold text-muted transition-colors hover:text-text has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                platform === p && "border-text bg-surface text-text",
              )}
            >
              <input
                type="radio"
                name="platform"
                value={p}
                checked={platform === p}
                onChange={() => setPlatform(p)}
                className="sr-only"
              />
              <PlatformIcon platform={p} className="size-4" decorative />
              {PLATFORM_LABEL[p]}
            </label>
          ))}
        </div>
        {errors.platform && <p className="text-meta text-danger">{errors.platform}</p>}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome de exibição" htmlFor="display_name" error={errors.display_name}>
          <Input
            id="display_name"
            name="display_name"
            defaultValue={account?.display_name}
            placeholder="Receitas em 1 minuto"
            aria-invalid={!!errors.display_name}
            required
          />
        </Field>
        <Field label="Usuário" htmlFor="username" error={errors.username}>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-muted">
              @
            </span>
            <Input
              id="username"
              name="username"
              defaultValue={account?.username}
              placeholder="receitasem1min"
              className="pl-7"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={!!errors.username}
              required
            />
          </div>
        </Field>
      </div>

      <Field label="Nicho" htmlFor="niche" error={errors.niche} hint="Ajuda a separar as contas na lista. Ex.: culinária, finanças, humor.">
        <Input id="niche" name="niche" defaultValue={account?.niche ?? ""} placeholder="Culinária" />
      </Field>

      <Field label="Descrição" htmlFor="description" error={errors.description} hint="Bio, tom de voz, público — o que for útil lembrar ao criar vídeos.">
        <Textarea id="description" name="description" defaultValue={account?.description ?? ""} rows={4} />
      </Field>

      {state && !state.ok && !Object.keys(errors).length && (
        <p role="alert" className="text-meta text-danger">{state.error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Salvando…" : account ? "Salvar alterações" : "Cadastrar conta"}
        </Button>
        <ButtonLink href={account ? `/contas/${account.id}` : "/"} variant="ghost">
          Cancelar
        </ButtonLink>
        {account && <DeleteAccountButton accountId={account.id} className="ml-auto" />}
      </div>
    </form>
  );
}

function DeleteAccountButton({ accountId, className }: { accountId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button variant="danger-ghost" className={className} onClick={() => setOpen(true)}>
        Excluir conta
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Excluir esta conta?">
        <p className="text-meta text-muted">
          Só é possível excluir contas sem vídeos. Essa ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Manter conta</Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await deleteAccount(accountId);
                if (res && !res.ok) {
                  toast.error(res.error);
                  setOpen(false);
                }
              })
            }
          >
            {pending ? "Excluindo…" : "Excluir conta"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
