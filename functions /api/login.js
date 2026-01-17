// /functions/api/login.js

function normalizeRut(rut) {
  return (rut || "")
    .trim()
    .replace(/\./g, "")
    .replace(/\s+/g, "")
    .replace(/–/g, "-")
    .toUpperCase();
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function b64ToBuf(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function pbkdf2Hash(password, saltB64, iterations = 210000) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: b64ToBuf(saltB64),
      iterations,
    },
    keyMaterial,
    256
  );

  return bufToB64(bits);
}

function makeSessionToken() {
  // Token aleatorio (no JWT). Se valida consultando KV.
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  let s = "";
  for (const b of arr) s += b.toString(16).padStart(2, "0");
  return s;
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

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: "Body inválido." }, 400);
  }

  const rut = normalizeRut(body.rut);
  const password = String(body.password || "");

  if (!rut || !password) return json({ message: "Completa RUT y clave." }, 400);

  // 1) Obtener usuario desde KV
  const userKey = `user:${rut}`;
  const userRaw = await env.HB_AUTH.get(userKey);
  if (!userRaw) return json({ message: "Credenciales inválidas." }, 401);

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return json({ message: "Usuario mal configurado." }, 500);
  }

  // user esperado:
  // { rut, name, role, saltB64, hashB64, iterations }
  const iterations = user.iterations || 210000;

  const computed = await pbkdf2Hash(password, user.saltB64, iterations);

  if (computed !== user.hashB64) {
    return json({ message: "Credenciales inválidas." }, 401);
  }

  // 2) Crear sesión
  const token = makeSessionToken();
  const sessKey = `sess:${token}`;

  // Guarda sesión 14 días
  const ttlSeconds = 14 * 24 * 60 * 60;

  await env.HB_AUTH.put(
    sessKey,
    JSON.stringify({ rut: user.rut, role: user.role || "family", ts: Date.now() }),
    { expirationTtl: ttlSeconds }
  );

  // 3) Cookie segura
  const cookie = setCookie("hb_session", token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: ttlSeconds,
  });

  return json(
    { ok: true, redirectTo: "/app/" },
    200,
    { "Set-Cookie": cookie }
  );
}
