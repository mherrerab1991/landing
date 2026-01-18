export async function onRequestGet() {
  return new Response("pong-" + Date.now(), {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
