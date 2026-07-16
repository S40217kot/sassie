import "server-only";

export function getClient(request) {
  return request.cookies.get("sassie_client")?.value ?? crypto.randomUUID();
}

export function jsonForClient(data, request, clientId, init = {}) {
  const response = Response.json(data, init);
  if (!request.cookies.get("sassie_client")) {
    response.headers.append("Set-Cookie", `sassie_client=${clientId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
  }
  return response;
}
