import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { storageLimitError } from "@/lib/storage/limit";
import { defaultStatus, duplicateKey, normalizeHashtags, resolveAccount, scheduledISO, videoItemSchema } from "./input";
import { toDisplayPath, toLocalPath, videoMimeFor } from "./paths";

describe("toLocalPath", () => {
  it("converte caminhos do Windows para o WSL", () => {
    assert.equal(toLocalPath("C:\\Users\\Lukz\\Videos\\01.mp4"), "/mnt/c/Users/Lukz/Videos/01.mp4");
    assert.equal(toLocalPath("d:/lote/a b.mov"), "/mnt/d/lote/a b.mov");
    assert.equal(toLocalPath('"C:\\Users\\Lukz\\Videos\\x.mp4"'), "/mnt/c/Users/Lukz/Videos/x.mp4");
  });
  it("converte o compartilhamento \\\\wsl.localhost", () => {
    assert.equal(toLocalPath("\\\\wsl.localhost\\Ubuntu\\home\\lucas\\v.mp4"), "/home/lucas/v.mp4");
    assert.equal(toLocalPath("\\\\wsl$\\Ubuntu\\home\\lucas\\v.mp4"), "/home/lucas/v.mp4");
  });
  it("mantém caminhos POSIX e normaliza", () => {
    assert.equal(toLocalPath("/home/lucas/videos/../v.mp4"), "/home/lucas/v.mp4");
  });
  it("recusa caminhos relativos", () => {
    assert.throws(() => toLocalPath("videos/01.mp4"), /caminho completo/);
    assert.throws(() => toLocalPath("   "), /Informe/);
  });
  it("mostra no formato do Windows quando está em /mnt", () => {
    assert.equal(toDisplayPath("/mnt/c/Users/Lukz/v.mp4"), "C:\\Users\\Lukz\\v.mp4");
    assert.equal(toDisplayPath("/home/lucas/v.mp4"), "/home/lucas/v.mp4");
  });
});

describe("videoMimeFor", () => {
  it("aceita só extensões de vídeo", () => {
    assert.equal(videoMimeFor("/a/B.MP4"), "video/mp4");
    assert.equal(videoMimeFor("/a/b.mov"), "video/quicktime");
    assert.equal(videoMimeFor("/a/b.txt"), null);
    assert.equal(videoMimeFor("/a/.env"), null);
  });
});

describe("scheduledISO", () => {
  it("interpreta no horário de Brasília (UTC-3)", () => {
    assert.equal(scheduledISO("2026-11-10T19:00"), "2026-11-10T22:00:00.000Z");
  });
  it("recusa datas impossíveis", () => {
    assert.throws(() => scheduledISO("2026-02-31T10:00"), /Data inválida/);
    assert.throws(() => scheduledISO("2026-13-01T10:00"), /Data inválida/);
  });
});

describe("videoItemSchema", () => {
  it("valida formato da data e limites", () => {
    assert.equal(videoItemSchema.safeParse({ conta: "@a", titulo: "x", agendado_para: "10/11/2026 19:00" }).success, false);
    assert.equal(videoItemSchema.safeParse({ conta: "@a", titulo: "" }).success, false);
    assert.equal(videoItemSchema.safeParse({ conta: "@a", titulo: "ok", status: "publicado" }).success, false);
    assert.equal(videoItemSchema.safeParse({ conta: "@a", titulo: "ok", agendado_para: "2026-11-10T19:00" }).success, true);
  });
});

describe("normalizeHashtags / defaultStatus", () => {
  it("tira # e repetidas", () => {
    assert.deepEqual(normalizeHashtags(["#receita", "receita", " ##fit ", ""]), ["receita", "fit"]);
    assert.deepEqual(normalizeHashtags(undefined), []);
  });
  it("agendado com data, aprovado sem", () => {
    assert.equal(defaultStatus(true), "agendado");
    assert.equal(defaultStatus(false), "aprovado");
  });
});

describe("resolveAccount", () => {
  const accounts = [
    { id: "11111111-1111-4111-8111-111111111111", platform: "tiktok", username: "receitas" },
    { id: "22222222-2222-4222-8222-222222222222", platform: "instagram", username: "receitas" },
    { id: "33333333-3333-4333-8333-333333333333", platform: "youtube", username: "FitBR" },
  ];
  it("acha por id e por @ sem diferenciar maiúsculas", () => {
    assert.equal(resolveAccount("33333333-3333-4333-8333-333333333333", accounts).username, "FitBR");
    assert.equal(resolveAccount("@fitbr", accounts).platform, "youtube");
    assert.equal(resolveAccount("fitbr", accounts).platform, "youtube");
  });
  it("desambigua com plataforma", () => {
    assert.throws(() => resolveAccount("@receitas", accounts), /mais de uma plataforma/);
    assert.equal(resolveAccount("instagram:@receitas", accounts).id, accounts[1].id);
    assert.equal(resolveAccount("tiktok/receitas", accounts).id, accounts[0].id);
  });
  it("explica quando não encontra", () => {
    assert.throws(() => resolveAccount("@nada", accounts), /Contas disponíveis/);
    assert.throws(() => resolveAccount("orkut:@fitbr", accounts), /Plataforma desconhecida/);
  });
});

describe("duplicateKey", () => {
  it("ignora maiúsculas, espaços e formato do horário", () => {
    assert.equal(
      duplicateKey("a", " Receita de Bolo ", "2026-11-10T22:00:00.000Z"),
      duplicateKey("a", "receita de bolo", "2026-11-10T22:00:00+00:00"),
    );
    assert.notEqual(duplicateKey("a", "x", null), duplicateKey("a", "x", "2026-11-10T22:00:00Z"));
  });
});

describe("storageLimitError", () => {
  it("aceita até o teto e recusa acima", () => {
    assert.equal(storageLimitError(5, 5, 10), null);
    assert.match(storageLimitError(6, 5, 10) ?? "", /Limite de armazenamento/);
  });
});
