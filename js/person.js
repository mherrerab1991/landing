import { loadJSON, setYear, fmtDate, safeText } from "./common.js";

function getId(){
  const u = new URL(location.href);
  return u.searchParams.get("id") || "";
}

function row(k,v){
  return `<div class="k">${k}</div><div class="v">${v || "—"}</div>`;
}

function mediaTile(title, items){
  if(!items?.length) return "";
  const links = items.map(x => `<a class="btn ghost" href="${x}" target="_blank" rel="noopener noreferrer">${x.split("/").pop()}</a>`).join(" ");
  return `<article class="tile"><h3>${title}</h3><p style="margin-top:10px; display:flex; flex-wrap:wrap; gap:10px">${links}</p></article>`;
}

async function main(){
  setYear();

  const id = getId();
  const people = await loadJSON("/data/people.json");
  const p = people.find(x => x.id === id);

  const kv = document.getElementById("kv");
  const media = document.getElementById("media");
  const title = document.getElementById("title");

  if(!p){
    title.textContent = "Ficha no encontrada";
    kv.innerHTML = row("ID", safeText(id)) + row("Estado", "No existe en /data/people.json");
    return;
  }

  title.textContent = p.fullName || "Ficha";

  kv.innerHTML = [
    row("Nombre completo", safeText(p.fullName)),
    row("Nacimiento", p.birth?.date ? `${fmtDate(p.birth.date)}${p.birth.place ? " · " + p.birth.place : ""}` : ""),
    row("Fallecimiento", p.death?.date ? `${fmtDate(p.death.date)}${p.death.place ? " · " + p.death.place : ""}` : ""),
    row("Notas", safeText(p.notes))
  ].join("");

  const photos = p.media?.photos || [];
  const docs = p.media?.documents || [];

  media.innerHTML =
    mediaTile("Fotos", photos) +
    mediaTile("Documentos", docs) ||
    `<article class="tile"><h3>Archivos</h3><p>No hay fotos o documentos asociados aún.</p></article>`;
}

main().catch(err => {
  console.error(err);
  const kv = document.getElementById("kv");
  if(kv) kv.innerHTML = `<div class="k">Error</div><div class="v">No se pudo cargar la data.</div>`;
});
