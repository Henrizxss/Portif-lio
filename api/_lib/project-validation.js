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

export function validateProject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "Dados do projeto inválidos.";
  }
  if (typeof value.title !== "string" || value.title.trim().length < 1 || value.title.trim().length > 80) {
    return "O nome deve ter entre 1 e 80 caracteres.";
  }
  if (typeof value.summary !== "string" || value.summary.trim().length < 1 || value.summary.trim().length > 400) {
    return "O resumo deve ter entre 1 e 400 caracteres.";
  }
  if (!Array.isArray(value.stack) || value.stack.some((item) => typeof item !== "string")) {
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
