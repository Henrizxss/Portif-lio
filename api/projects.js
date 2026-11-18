import { getRequestUrl, hasTrustedOrigin, hasValidSession } from "./_lib/auth.js";
import { query } from "./_lib/db.js";
import { readJsonBody, sendJson } from "./_lib/http.js";
import { validateProject } from "./_lib/project-validation.js";

function getProjectId(request) {
  const id = getRequestUrl(request).searchParams.get("id");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || "")
    ? id
    : null;
}

export default async function handler(request, response) {
  try {
    if (request.method === "GET") {
      const { rows } = await query(
        `select * from public.projects
         order by featured desc, display_order asc, created_at desc`,
      );
      return sendJson(response, rows);
    }

    if (!["POST", "PATCH", "DELETE"].includes(request.method)) {
      return sendJson(response, { error: "Método não permitido." }, 405);
    }
    if (!hasTrustedOrigin(request)) {
      return sendJson(response, { error: "Origem não permitida." }, 403);
    }
    if (!hasValidSession(request)) {
      return sendJson(response, { error: "Sessão expirada. Entre novamente." }, 401);
    }

    if (request.method === "DELETE") {
      const id = getProjectId(request);
      if (!id) return sendJson(response, { error: "Identificador do projeto inválido." }, 400);
      const { rows } = await query(
        "delete from public.projects where id = $1 returning id",
        [id],
      );
      return sendJson(
        response,
        rows.length ? { deleted: true } : { error: "Projeto não encontrado." },
        rows.length ? 200 : 404,
      );
    }

    const project = readJsonBody(request);
    const validationError = validateProject(project);
    if (validationError) return sendJson(response, { error: validationError }, 400);

    const values = [
      project.title.trim(),
      project.summary.trim(),
      project.stack.map((item) => item.trim()).filter(Boolean),
      project.image_urls,
      project.image_urls[0] || null,
      project.github_url || null,
      project.demo_url || null,
      project.featured,
    ];

    if (request.method === "POST") {
      const { rows } = await query(
        `insert into public.projects
          (title, summary, stack, image_urls, image_url, github_url, demo_url, featured)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning *`,
        values,
      );
      return sendJson(response, rows[0], 201);
    }

    const id = getProjectId(request);
    if (!id) return sendJson(response, { error: "Identificador do projeto inválido." }, 400);
    const { rows } = await query(
      `update public.projects
       set title = $1, summary = $2, stack = $3, image_urls = $4, image_url = $5,
           github_url = $6, demo_url = $7, featured = $8, updated_at = now()
       where id = $9
       returning *`,
      [...values, id],
    );
    return sendJson(
      response,
      rows.length ? rows[0] : { error: "Projeto não encontrado." },
      rows.length ? 200 : 404,
    );
  } catch (error) {
    console.error("Falha na API de projetos:", error);
    return sendJson(response, { error: "Não foi possível processar os projetos." }, 500);
  }
}
