// validate-contact.test.js : 検証純関数のユニットテスト
// 依存ゼロで実行可能: `npm test`（node --test）。Jestでも import 形式は同じ。
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateContact, LIMITS } from "../js/validate-contact.js";

test("名前とメールが正しければ valid", () => {
  const r = validateContact({ name: "テスト店舗", email: "a@example.com", message: "こんにちは" });
  assert.equal(r.valid, true);
  assert.deepEqual(r.errors, {});
});

test("名前が空なら name エラー", () => {
  const r = validateContact({ name: "", email: "a@example.com" });
  assert.equal(r.valid, false);
  assert.ok(r.errors.name);
});

test("メールが空なら email エラー", () => {
  const r = validateContact({ name: "店舗", email: "" });
  assert.equal(r.valid, false);
  assert.ok(r.errors.email);
});

test("メール形式が不正なら email エラー", () => {
  for (const bad of ["foo", "foo@bar", "foo bar@x.com", "@x.com"]) {
    const r = validateContact({ name: "店舗", email: bad });
    assert.equal(r.valid, false, `should reject: ${bad}`);
    assert.ok(r.errors.email);
  }
});

test("メッセージは任意（空でも valid）", () => {
  const r = validateContact({ name: "店舗", email: "a@example.com", message: "" });
  assert.equal(r.valid, true);
});

test("上限超過は長すぎるエラー", () => {
  const r = validateContact({
    name: "あ".repeat(LIMITS.name + 1),
    email: "a@example.com",
    message: "x".repeat(LIMITS.message + 1),
  });
  assert.equal(r.valid, false);
  assert.ok(r.errors.name);
  assert.ok(r.errors.message);
});

test("前後の空白はトリムして判定", () => {
  const r = validateContact({ name: "   ", email: "   " });
  assert.equal(r.valid, false);
  assert.ok(r.errors.name);
  assert.ok(r.errors.email);
});
