// /functions/_middleware.js

function readCookie(request, name) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? m[1] : null;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Deja pasar API, home, login y assets
  const publicPaths = new Set([
    "/",
    "/index.html",
    "/login.html",
    "/styles.css",
  ]);

  if (url.pathname.startsWith("/api/")) return next();
  if (publicPaths.has(url.pathname)) return next();
  if (url.pathname.startsWith("/favicon")) return next();

  // Protegemos todo lo que esté bajo /app/
  if (url.pathname.startsWith("/app/")) {
    const token = readCookie(request, "hb_session");
    if (!token) return Response.redirect(`${url.origin}/login.html`, 302);

    const sess = await env.HB_AUTH.get(`sess:${token}`);
    if (!sess) return Response.redirect(`${url.origin}/login.html`, 302);

    return next();
  }

  // Todo lo demás lo dejamos pasar por ahora
  return next();
}
