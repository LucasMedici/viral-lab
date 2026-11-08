import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { isAllowedUser } from "./owner";

afterEach(() => {
  delete process.env.OWNER_EMAIL;
});

test("recusa ausência de usuário e usuários anônimos", () => {
  assert.equal(isAllowedUser(null), false);
  assert.equal(isAllowedUser(undefined), false);
  assert.equal(isAllowedUser({ email: undefined, is_anonymous: true }), false);
});

test("sem OWNER_EMAIL, aceita qualquer usuário não anônimo", () => {
  assert.equal(isAllowedUser({ email: "dono@exemplo.com", is_anonymous: false }), true);
});

test("com OWNER_EMAIL, aceita só o dono (sem diferenciar maiúsculas)", () => {
  process.env.OWNER_EMAIL = "Dono@Exemplo.com ";
  assert.equal(isAllowedUser({ email: "dono@exemplo.com", is_anonymous: false }), true);
  assert.equal(isAllowedUser({ email: "outra@exemplo.com", is_anonymous: false }), false);
  assert.equal(isAllowedUser({ email: undefined, is_anonymous: false }), false);
});
