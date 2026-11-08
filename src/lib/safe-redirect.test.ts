import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNextPath } from "./safe-redirect";

test("mantém caminhos internos", () => {
  assert.equal(safeNextPath("/"), "/");
  assert.equal(safeNextPath("/contas/123"), "/contas/123");
  assert.equal(safeNextPath("/videos/novo?conta=1#topo"), "/videos/novo?conta=1#topo");
});

test("bloqueia destinos externos (open redirect)", () => {
  for (const evil of [
    "//evil.example",
    "/\\evil.example",
    "/\\/evil.example",
    "/\t/evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "evil.example",
    "",
  ]) {
    assert.equal(safeNextPath(evil), "/", `deveria bloquear: ${JSON.stringify(evil)}`);
  }
});

test("valores que não são texto caem no padrão", () => {
  assert.equal(safeNextPath(null), "/");
  assert.equal(safeNextPath(undefined), "/");
  assert.equal(safeNextPath(42), "/");
});
