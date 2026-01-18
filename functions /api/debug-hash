export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  function normalizeRut(rut) {
    return (rut || "")
      .trim()
      .replace(/\./g, "")
      .replace(/\s+/g, "")
      .replace(/–/g, "-")
      .toUpperCase();
  }

  function json(data, status = 200) {
    return new Response(JSON.stringify(data, null, 2), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  function b64ToBytes(b64) {
    const norm = (b64 || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = norm + "===".slice((norm.length + 3) % 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function bytesToB64(bytes) {
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
      { name: "PBKDF2", hash: "SHA-256", salt: b64ToBytes(saltB64), iterations },
      keyMaterial,
      256
    );

    return bytesToB64(new Uint8Array(bits));
  }

  const body = await request.json().catch(() => ({}));
  const rut = normalizeRut(body.rut);
  const password = String(body.password || "");

  const userRaw = await env.HB_AUTH.get(`user:${rut}`);
  if (!userRaw) return json({ ok: false, message: "No existe user en KV" }, 404);

  const user = JSON.parse(userRaw);
  const iterations = user.iterations || 210000;
  const computed = await pbkdf2Hash(password, user.saltB64, iterations);

  return json({
    ok: true,
    rut,
    iterations,
    saltB64: user.saltB64,
    kvHashB64: user.hashB64,
    computedHashB64: computed,
    match: computed === user.hashB64
  });
}
