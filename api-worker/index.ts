import { handleMatchRequest } from "../src/lib/handle-match";

export interface WorkerEnv {
  TYPESAFE_API_KEY?: string;
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  let allow = "https://bogusweb.github.io";
  try {
    if (origin) {
      const host = new URL(origin).hostname;
      if (
        host === "bogusweb.github.io" ||
        host.endsWith(".github.io") ||
        host === "127.0.0.1" ||
        host === "localhost" ||
        host.endsWith(".cursor.com") ||
        host.endsWith(".cursor.sh") ||
        host.endsWith(".cursorusercontent.com")
      ) {
        allow = origin;
      }
    }
  } catch {
    // keep default
  }

  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function withCors(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    if (env.TYPESAFE_API_KEY) {
      process.env.TYPESAFE_API_KEY = env.TYPESAFE_API_KEY;
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";

    if (request.method === "GET" && (path === "/" || path === "/health")) {
      return withCors(
        Response.json({
          ok: true,
          service: "cv-by-jev-api",
          typesafe: Boolean(process.env.TYPESAFE_API_KEY?.trim()),
        }),
        request,
      );
    }

    if (request.method === "POST" && path.endsWith("/api/match")) {
      return withCors(await handleMatchRequest(request), request);
    }

    return withCors(new Response("Not found", { status: 404 }), request);
  },
};

export default worker;
