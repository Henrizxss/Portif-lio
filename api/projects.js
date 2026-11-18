import { hasTrustedOrigin, hasValidSession } from "./_lib/auth.js";
import { query } from "./_lib/db.js";

function json(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function isHttpUrl(value) {
  if (value === null || value === "") return true;
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validateProject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "Dados do projeto inválidos.";
  }
  if (typeof value.title !== "string" || value.title.trim().length < 1 || value.title.trim().length > 80) {
    return "O nome deve ter entre 1 e 80 caracteres.";
  }
  if (typeof value.summary !== "string" || value.summary.trim().length < 1 || value.summary.trim().length > 400) {
    return "O resumo deve ter entre 1 e 400 caracteres.";
  }
  if (!Array.isArray(value.stack) || value.stack.some(
    (item) => typeof item !== "string" || item.trim().length > 40,
  )) {
    return "A lista de tecnologias é inválida.";
  }
  if (!Array.isArray(value.image_urls) || value.image_urls.length > 30
    || value.image_urls.some((url) => !isHttpUrl(url) || !url)) {
    return "A lista de imagens é inválida.";
  }
  if (!isHttpUrl(value.github_url) || !isHttpUrl(value.demo_url)) {
    return "Os links devem usar HTTP ou HTTPS.";
  }
  if (typeof value.featured !== "boolean") return "O destaque do projeto é inválido.";
  return null;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function getProjectId(request) {
  const id = new URL(request.url).searchParams.get("id");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || "")
    ? id
    : null;
}

export default async function handler(request) {
  try {
    if (request.method === "GET") {
      const { rows } = await query(
        `select * from public.projects
         order by featured desc, display_order asc, created_at desc`,
      );
      return json(rows);
    }

    if (!["POST", "PATCH", "DELETE"].includes(request.method)) {
      return json({ error: "Método não permitido." }, 405);
    }
    if (!hasTrustedOrigin(request)) return json({ error: "Origem não permitida." }, 403);
    if (!hasValidSession(request)) return json({ error: "Sessão expirada. Entre novamente." }, 401);

    if (request.method === "DELETE") {
      const id = getProjectId(request);
      if (!id) return json({ error: "Identificador do projeto inválido." }, 400);
      const { rows } = await query(
        "delete from public.projects where id = $1 returning id",
        [id],
      );
      return rows.length ? json({ deleted: true }) : json({ error: "Projeto não encontrado." }, 404);
    }

    const project = await readJson(request);
    const validationError = validateProject(project);
    if (validationError) return json({ error: validationError }, 400);

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
      return json(rows[0], 201);
    }

    const id = getProjectId(request);
    if (!id) return json({ error: "Identificador do projeto inválido." }, 400);
    const { rows } = await query(
      `update public.projects
       set title = $1, summary = $2, stack = $3, image_urls = $4, image_url = $5,
           github_url = $6, demo_url = $7, featured = $8, updated_at = now()
       where id = $9
       returning *`,
      [...values, id],
    );
    return rows.length ? json(rows[0]) : json({ error: "Projeto não encontrado." }, 404);
  } catch (error) {
    console.error("Falha na API de projetos:", error);
    return json({ error: "Não foi possível processar os projetos." }, 500);
  }
}
