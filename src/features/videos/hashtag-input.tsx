"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { ICON_IN, ICON_OUT, ICON_SWAP } from "@/components/ui/icon-swap";
import { cn, formatHashtags, parseHashtags } from "@/lib/utils";

/** Campo de hashtags em chips. Aceita digitar/colar "#a #b, c". Envia como texto no campo `name`. */
export function HashtagInput({ name, id, defaultValue = [] }: { name: string; id: string; defaultValue?: string[] }) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const allTags = parseHashtags([...tags, draft]);

  /** Copia todas as hashtags de uma vez, no formato "#a #b #c", pronto para colar no post. */
  async function copyAll() {
    if (!allTags.length) return;
    try {
      await navigator.clipboard.writeText(formatHashtags(allTags));
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("O navegador bloqueou a cópia. Tente de novo.");
    }
  }

  function commit(text: string) {
    const next = parseHashtags([...tags, text]);
    setTags(next);
    setDraft("");
  }

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 py-1.5 transition-colors hover:border-muted/40 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
      <input type="hidden" name={name} value={formatHashtags(allTags)} />
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface py-0.5 pl-2.5 pr-1 text-meta font-semibold text-text">
          #{t}
          <button
            type="button"
            onClick={() => setTags(tags.filter((x) => x !== t))}
            className="relative grid size-4 place-items-center rounded-full text-muted transition-colors after:absolute after:-inset-1.5 hover:bg-surface-2 hover:text-text"
            aria-label={`Remover #${t}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (/[\s,;]$/.test(v)) commit(v);
          else setDraft(v);
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (/[\s,;#]/.test(text.trim())) {
            e.preventDefault();
            commit(draft + text);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (draft.trim()) commit(draft);
          } else if (e.key === "Backspace" && !draft && tags.length) {
            setTags(tags.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={tags.length ? "" : "#receita #airfryer"}
        className="min-w-24 flex-1 bg-transparent px-1 text-body outline-none placeholder:text-muted/70"
        autoCapitalize="none"
        spellCheck={false}
      />
      {allTags.length > 0 && (
        <button
          type="button"
          onClick={copyAll}
          aria-live="polite"
          title={`Copiar as ${allTags.length} hashtags`}
          className="ml-auto inline-flex h-7 shrink-0 items-center gap-1.5 self-start rounded-[6px] px-2 text-meta font-semibold text-muted transition-colors hover:bg-surface hover:text-text active:scale-[0.96]"
        >
          <span className="relative grid size-3.5 place-items-center" aria-hidden="true">
            <Copy className={cn("size-3.5", ICON_SWAP, copied ? ICON_OUT : ICON_IN)} />
            <Check className={cn("absolute size-3.5", ICON_SWAP, copied ? ICON_IN : ICON_OUT)} />
          </span>
          {copied ? "Copiadas" : `Copiar todas (${allTags.length})`}
        </button>
      )}
    </div>
  );
}
