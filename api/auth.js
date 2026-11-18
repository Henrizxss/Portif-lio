import {
  clearedSessionCookie,
  createSessionToken,
  hasTrustedOrigin,
  hasValidSession,
  passwordMatches,
  sessionCookie,
} from "./_lib/auth.js";
import { readJsonBody, sendJson } from "./_lib/http.js";

export default async function handler(request, response) {
  try {
    if (request.method === "GET") {
      return sendJson(response, { authenticated: hasValidSession(request) });
    }

    if (!hasTrustedOrigin(request)) {
      return sendJson(response, { error: "Origem não permitida." }, 403);
    }

    if (request.method === "POST") {
      const body = readJsonBody(request);
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return sendJson(response, { error: "Envie uma requisição JSON válida." }, 400);
      }
      if (!passwordMatches(body.password)) {
        return sendJson(response, { error: "Senha incorreta." }, 401);
      }

      const token = createSessionToken();
      return sendJson(
        response,
        { authenticated: true },
        200,
        { "Set-Cookie": sessionCookie(request, token) },
      );
    }

    if (request.method === "DELETE") {
      return sendJson(
        response,
        { authenticated: false },
        200,
        { "Set-Cookie": clearedSessionCookie(request) },
      );
    }

    return sendJson(
      response,
      { error: "Método não permitido." },
      405,
      { Allow: "GET, POST, DELETE" },
    );
  } catch (error) {
    console.error("Falha na API de autenticação:", error);
    return sendJson(response, { error: "Não foi possível processar a autenticação." }, 500);
  }
}
