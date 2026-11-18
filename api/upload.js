import { handleUpload } from "@vercel/blob/client";
import { hasTrustedOrigin, hasValidSession } from "./_lib/auth.js";

export default async function handler(request) {
  try {
    if (request.method !== "POST") {
      return Response.json(
        { error: "Método não permitido." },
        { status: 405, headers: { Allow: "POST" } },
      );
    }

    const body = await request.json();
    const response = await handleUpload({
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
    return Response.json(response, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Falha no upload de imagem:", error);
    return Response.json(
      { error: "Não foi possível enviar a imagem. Verifique a sessão e o arquivo." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
