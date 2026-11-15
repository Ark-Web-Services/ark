import { defineMiddleware } from "astro:middleware";

const ADMIN_ROBOTS_DIRECTIVE =
  "noindex, nofollow, noarchive, nosnippet, noimageindex";

function constantTimeEquals(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index++) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;
  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/") ||
    pathname === "/_admin" || pathname.startsWith("/_admin/") ||
    pathname === "/api/admin" || pathname.startsWith("/api/admin/");

  if (!isAdminRoute || context.isPrerendered) return next();

  const runtimeEnv = (context.locals as { runtime?: { env?: Record<string, unknown> } })
    .runtime?.env;
  const configuredToken = runtimeEnv?.ADMIN_API_TOKEN ?? process.env.ADMIN_API_TOKEN;
  const token = typeof configuredToken === "string" ? configuredToken : "";
  const authorization = context.request.headers.get("authorization") ?? "";
  const suppliedToken = /^Bearer\s+(.+)$/i.exec(authorization)?.[1] ?? "";
  const isApiRequest = pathname.startsWith("/api/admin") || pathname.startsWith("/admin/api/") || pathname.startsWith("/_admin/api/") ||
    context.request.headers.get("accept")?.includes("application/json") === true;
  const htmlEnabledValue = runtimeEnv?.ENABLE_ADMIN_DASHBOARD ?? process.env.ENABLE_ADMIN_DASHBOARD;
  const htmlEnabled = /^(1|true|yes)$/i.test(String(htmlEnabledValue ?? ""));

  let response: Response;
  if (!isApiRequest && !htmlEnabled) {
    response = new Response("Not Found", { status: 404 });
  } else if (!token || !suppliedToken || !constantTimeEquals(suppliedToken, token)) {
    response = new Response(isApiRequest ? "Unauthorized" : "Forbidden", {
      status: isApiRequest ? 401 : 403,
      headers: isApiRequest ? { "WWW-Authenticate": "Bearer realm=\"admin\"" } : undefined,
    });
  } else {
    response = await next();
  }

  response.headers.set("X-Robots-Tag", ADMIN_ROBOTS_DIRECTIVE);
  response.headers.set("Cache-Control", "no-store");
  return response;
});
