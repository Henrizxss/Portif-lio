import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "portfolio_admin";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function getHeader(request, name) {
  const headers = request.headers;
  const value = typeof headers?.get === "function"
    ? headers.get(name)
    : headers?.[name.toLowerCase()] ?? headers?.[name];
  return Array.isArray(value) ? value[0] : value || "";
}

export function getRequestUrl(request) {
  const host = getHeader(request, "x-forwarded-host") || getHeader(request, "host") || "localhost";
  const protocol = (getHeader(request, "x-forwarded-proto") || "https").split(",")[0].trim();
  return new URL(request.url || "/", `${protocol}://${host}`);
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET deve ter pelo menos 32 caracteres.");
  }
  return secret;
}

function equalBuffers(left, right) {
  return left.length === right.length && timingSafeEqual(left, right);
}

function getCookie(request, name) {
  const cookies = getHeader(request, "cookie");
  const entry = cookies.split(";").map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : "";
}

export function createSessionToken(now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const payload = `${expiresAt}.${randomBytes(16).toString("base64url")}`;
  const signature = createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function hasValidSession(request, now = Date.now()) {
  const token = getCookie(request, COOKIE_NAME);
  const [expiresAt, nonce, signature, ...extra] = token.split(".");
  if (!expiresAt || !nonce || !signature || extra.length) return false;
  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) <= Math.floor(now / 1000)) return false;

  const payload = `${expiresAt}.${nonce}`;
  const expected = createHmac("sha256", getSessionSecret()).update(payload).digest();
  let provided;
  try {
    provided = Buffer.from(signature, "base64url");
  } catch {
    return false;
  }
  return equalBuffers(expected, provided);
}

export function passwordMatches(password) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword || expectedPassword.length < 16) {
    throw new Error("ADMIN_PASSWORD deve ter pelo menos 16 caracteres.");
  }
  if (typeof password !== "string") return false;
  const expected = createHash("sha256").update(expectedPassword).digest();
  const received = createHash("sha256").update(password).digest();
  return equalBuffers(expected, received);
}

export function sessionCookie(request, token) {
  const secure = getRequestUrl(request).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function clearedSessionCookie(request) {
  const secure = getRequestUrl(request).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function hasTrustedOrigin(request) {
  const origin = getHeader(request, "origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === getRequestUrl(request).origin;
  } catch {
    return false;
  }
}
