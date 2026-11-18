export function readJsonBody(request) {
  const body = request.body;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body && typeof body === "object" && !Buffer.isBuffer(body) ? body : null;
}

export function sendJson(response, body, status = 200, headers = {}) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  for (const [name, value] of Object.entries(headers)) {
    response.setHeader(name, value);
  }
  response.end(JSON.stringify(body));
}
