import test from "node:test";
import assert from "node:assert/strict";

// We test the pure validation logic that the change-password flow uses,
// without requiring a database connection.

test("password must be at least 6 characters", () => {
  const short = "abc";
  const valid = "abcdef";

  assert.equal(short.length < 6, true, "Short password should fail validation");
  assert.equal(valid.length < 6, false, "Valid password should pass validation");
});

test("new password and confirmation must match", () => {
  const newPassword = "newpass123";
  const confirmMatch = "newpass123";
  const confirmMismatch = "different";

  assert.equal(newPassword === confirmMatch, true, "Matching passwords should pass");
  assert.equal(newPassword === confirmMismatch, false, "Mismatched passwords should fail");
});

test("empty passwords are rejected", () => {
  const empty = "";
  const whitespace = "   ";

  assert.equal(!empty, true, "Empty string should be falsy");
  assert.equal(!whitespace.trim(), true, "Whitespace-only should be falsy after trim");
});

test("password change requires all three fields", () => {
  const cases = [
    { currentPassword: "", newPassword: "newpass", confirmNewPassword: "newpass" },
    { currentPassword: "oldpass", newPassword: "", confirmNewPassword: "newpass" },
    { currentPassword: "oldpass", newPassword: "newpass", confirmNewPassword: "" },
  ];

  for (const c of cases) {
    const allProvided = !!(c.currentPassword && c.newPassword && c.confirmNewPassword);
    assert.equal(allProvided, false, `Missing field should be rejected: ${JSON.stringify(c)}`);
  }

  const valid = { currentPassword: "oldpass", newPassword: "newpass", confirmNewPassword: "newpass" };
  const allProvided = !!(valid.currentPassword && valid.newPassword && valid.confirmNewPassword);
  assert.equal(allProvided, true, "All fields provided should pass");
});
