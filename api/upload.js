import { handleUpload } from "@vercel/blob/client";
import { hasTrustedOrigin, hasValidSession } from "./_lib/auth.js";
import { readJsonBody, sendJson } from "./_lib/http.js";

export default async function handler(request, response) {
  try {
    if (request.method !== "POST") {
      return sendJson(
        response,
        { error: "Método não permitido." },
        405,
        { Allow: "POST" },
      );
    }

    const body = readJsonBody(request);
    if (!body) return sendJson(response, { error: "Envie uma requisição JSON válida." }, 400);
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!hasTrustedOrigin(request) || !hasValidSession(request)) {
          throw new Error("Entre como administrador antes de enviar imagens.");
        }
        if (!pathname.startsWith("projects/")) {
          throw new Error("Caminho de upload inválido.");
        }

        return {
          addRandomSuffix: true,
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          maximumSizeInBytes: 5 * 1024 * 1024,
        };
      },
    });
    return sendJson(response, result, 200);
  } catch (error) {
    console.error("Falha no upload de imagem:", error);
    return sendJson(
      response,
      { error: "Não foi possível enviar a imagem. Verifique a sessão e o arquivo." },
      400,
    );
  }
}
