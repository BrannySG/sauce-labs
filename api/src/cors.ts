// CORS handling for the Sauce API.
//
// Games live on many different origins (the Labs site, various *.github.io
// pages, and localhost during development). We reflect the request's Origin
// header back only when it is on the allowlist, which lets credentials-free
// fetches from those origins succeed while blocking everyone else.

export interface CorsEnv {
  ALLOWED_ORIGINS?: string;
}

/** Returns true if the given origin is allowed to call the API. */
export function isOriginAllowed(origin: string, env: CorsEnv): boolean {
  if (!origin) return false;

  // Explicit first-party allowlist from config (comma-separated).
  const configured = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (configured.includes(origin)) return true;

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  // Any GitHub Pages site (where most Sauce games are hosted).
  if (url.protocol === "https:" && url.hostname.endsWith(".github.io")) {
    return true;
  }

  // Local development on any port.
  if (
    (url.protocol === "http:" || url.protocol === "https:") &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  ) {
    return true;
  }

  return false;
}

/** Builds the CORS response headers for an allowed origin (or none). */
export function corsHeaders(origin: string, env: CorsEnv): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && isOriginAllowed(origin, env)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

/** Handles the preflight OPTIONS request. */
export function handlePreflight(request: Request, env: CorsEnv): Response {
  const origin = request.headers.get("Origin") ?? "";
  return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
}
