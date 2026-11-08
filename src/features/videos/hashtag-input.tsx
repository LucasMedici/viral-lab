"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { parseHashtags } from "@/lib/utils";

/** Campo de hashtags em chips. Aceita digitar/colar "#a #b, c". Envia como texto no campo `name`. */
export function HashtagInput({ name, id, defaultValue = [] }: { name: string; id: string; defaultValue?: string[] }) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");

  function commit(text: string) {
    const next = parseHashtags([...tags, text]);
    setTags(next);
    setDraft("");
  }

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 py-1.5 transition-colors hover:border-muted/40 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
      <input type="hidden" name={name} value={[...tags, ...parseHashtags(draft)].map((t) => `#${t}`).join(" ")} />
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
    </div>
  );
}
