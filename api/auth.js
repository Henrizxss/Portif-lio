import {
  clearedSessionCookie,
  createSessionToken,
  hasTrustedOrigin,
  hasValidSession,
  passwordMatches,
  sessionCookie,
} from "./_lib/auth.js";

function json(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export default async function handler(request) {
  try {
    if (request.method === "GET") {
      return json({ authenticated: hasValidSession(request) });
    }

    if (!hasTrustedOrigin(request)) return json({ error: "Origem não permitida." }, 403);

    if (request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Envie uma requisição JSON válida." }, 400);
      }

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return json({ error: "Envie uma requisição JSON válida." }, 400);
      }
      if (!passwordMatches(body.password)) {
        return json({ error: "Senha incorreta." }, 401);
      }

      const token = createSessionToken();
      return json(
        { authenticated: true },
        200,
        { "Set-Cookie": sessionCookie(request, token) },
      );
    }

    if (request.method === "DELETE") {
      return json(
        { authenticated: false },
        200,
        { "Set-Cookie": clearedSessionCookie(request) },
      );
    }

    return json({ error: "Método não permitido." }, 405, { Allow: "GET, POST, DELETE" });
  } catch (error) {
    console.error("Falha na API de autenticação:", error);
    return json({ error: "Não foi possível processar a autenticação." }, 500);
  }
}
