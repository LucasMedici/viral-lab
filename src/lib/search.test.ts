import assert from "node:assert/strict";
import { test } from "node:test";
import { matchScore, normalize, rankByQuery } from "./search";

test("normaliza acentos, caixa e espaços", () => {
  assert.equal(normalize("  Pão  de QUEIJO "), "pao de queijo");
  assert.equal(normalize("Calendário"), "calendario");
});

test("ignora acentos e exige todas as palavras", () => {
  assert.ok(matchScore("calendario", "Calendário") > 0);
  assert.ok(matchScore("receitas tiktok", "Receitas em 1 minuto", ["tiktok", "@receitas"]) > 0);
  assert.equal(matchScore("receitas youtube", "Receitas em 1 minuto", ["tiktok"]), 0);
});

test("busca vazia combina com tudo", () => {
  assert.equal(matchScore("", "Qualquer coisa"), 1);
});

test("ordena: começa com > palavra começa com > contém > só palavra-chave", () => {
  const items = [
    { label: "Tema escuro", keywords: ["enviar"] },
    { label: "Reenviar arquivo" },
    { label: "Vídeo para enviar" },
    { label: "Enviar vídeo" },
  ];
  assert.deepEqual(
    rankByQuery(items, "enviar", (i) => i).map((i) => i.label),
    ["Enviar vídeo", "Vídeo para enviar", "Reenviar arquivo", "Tema escuro"],
  );
});
