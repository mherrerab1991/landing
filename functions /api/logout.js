// /functions/api/logout.js

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function setCookie(name, value, opts = {}) {
  const parts = [`${name}=${value}`];
  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  return parts.join("; ");
}

function readCookie(request, name) {
  const c = request.headers.get("Cookie") || "";
  const m = c.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? m[1] : null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const token = readCookie(request, "hb_session");
  if (token) {
    await env.HB_AUTH.delete(`sess:${token}`);
  }

  const cookie = setCookie("hb_session", "", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 0,
  });

  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}
