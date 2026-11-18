import assert from "node:assert/strict";
import test from "node:test";
import { createSessionToken, hasValidSession, passwordMatches } from "../api/_lib/auth.js";
import authHandler from "../api/auth.js";
import projectsHandler from "../api/projects.js";
import { validateProject } from "../api/_lib/project-validation.js";

const originalSecret = process.env.SESSION_SECRET;
const originalPassword = process.env.ADMIN_PASSWORD;
process.env.SESSION_SECRET = "test-session-secret-with-at-least-32-characters";
process.env.ADMIN_PASSWORD = "test-password-with-at-least-16-chars";

function makeRequest(method, url, headers = {}, body) {
  return {
    method,
    url,
    headers: { host: "example.test", ...headers },
    body,
  };
}

function makeResponse() {
  return {
    headers: {},
    statusCode: 0,
    body: "",
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body;
    },
  };
}

async function callHandler(handler, method, url, headers = {}, body) {
  const request = makeRequest(method, url, headers, body);
  const response = makeResponse();
  await handler(request, response);
  return response;
}

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
  const login = await callHandler(authHandler, "POST", "/api/auth", {
    origin: "https://example.test",
  }, { password: "test-password-with-at-least-16-chars" });
  assert.equal(login.statusCode, 200);
  const cookie = login.headers["Set-Cookie"].split(";")[0];

  const session = await callHandler(authHandler, "GET", "/api/auth", { cookie });
  assert.deepEqual(JSON.parse(session.body), { authenticated: true });

  const logout = await callHandler(authHandler, "DELETE", "/api/auth", {
    origin: "https://example.test",
  });
  assert.match(logout.headers["Set-Cookie"], /Max-Age=0/);

  const denied = await callHandler(authHandler, "POST", "/api/auth", {
    origin: "https://attacker.test",
  }, { password: "test-password-with-at-least-16-chars" });
  assert.equal(denied.statusCode, 403);
});

test("project mutations reject requests without an admin session", async () => {
  const response = await callHandler(projectsHandler, "POST", "/api/projects", {
    origin: "https://example.test",
  }, {});
  assert.equal(response.statusCode, 401);
});

test("project validation accepts technology names longer than 40 characters", () => {
  const validationError = validateProject({
    title: "Projeto",
    summary: "Resumo",
    stack: ["Uma tecnologia com um nome maior do que quarenta caracteres"],
    image_urls: [],
    github_url: null,
    demo_url: null,
    featured: false,
  });
  assert.equal(validationError, null);
});

test.after(() => {
  if (originalSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = originalSecret;
  if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = originalPassword;
});
