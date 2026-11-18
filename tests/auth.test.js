import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, hasValidSession, passwordMatches } from "../api/_lib/auth.js";
import authHandler from "../api/auth.js";
import projectsHandler from "../api/projects.js";

const originalSecret = process.env.SESSION_SECRET;
const originalPassword = process.env.ADMIN_PASSWORD;
process.env.SESSION_SECRET = "test-session-secret-with-at-least-32-characters";
process.env.ADMIN_PASSWORD = "test-password-with-at-least-16-chars";

test("valid session tokens expire and reject tampering", () => {
  const now = 1_800_000_000_000;
  const token = createSessionToken(now);
  const request = (value) => new Request("https://example.test/api/auth", {
    headers: { cookie: `portfolio_admin=${value}` },
  });

  assert.equal(hasValidSession(request(token), now), true);
  assert.equal(hasValidSession(request(token), now + 8 * 24 * 60 * 60 * 1000), false);
  assert.equal(hasValidSession(request(`${token}x`), now), false);
  assert.equal(hasValidSession(new Request("https://example.test/api/auth"), now), false);
});

test("admin password comparison accepts only the configured password", () => {
  assert.equal(passwordMatches("test-password-with-at-least-16-chars"), true);
  assert.equal(passwordMatches("incorrect-password"), false);
  assert.equal(passwordMatches(undefined), false);
});

test("auth endpoint issues and clears an origin-bound session", async () => {
  const login = await authHandler(new Request("https://example.test/api/auth", {
    method: "POST",
    headers: {
      origin: "https://example.test",
      "content-type": "application/json",
    },
    body: JSON.stringify({ password: "test-password-with-at-least-16-chars" }),
  }));
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];

  const session = await authHandler(new Request("https://example.test/api/auth", {
    headers: { cookie },
  }));
  assert.deepEqual(await session.json(), { authenticated: true });

  const logout = await authHandler(new Request("https://example.test/api/auth", {
    method: "DELETE",
    headers: { origin: "https://example.test" },
  }));
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);

  const denied = await authHandler(new Request("https://example.test/api/auth", {
    method: "POST",
    headers: {
      origin: "https://attacker.test",
      "content-type": "application/json",
    },
    body: JSON.stringify({ password: "test-password-with-at-least-16-chars" }),
  }));
  assert.equal(denied.status, 403);
});

test("project mutations reject requests without an admin session", async () => {
  const response = await projectsHandler(new Request("https://example.test/api/projects", {
    method: "POST",
    headers: {
      origin: "https://example.test",
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  }));
  assert.equal(response.status, 401);
});

test.after(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = originalSecret;
  if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = originalPassword;
});
