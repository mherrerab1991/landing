import { loadJSON, setYear, fmtDate, safeText } from "./common.js";

function tile(title, subtitle, href){
  return `
    <article class="tile">
      <h3>${safeText(title)}</h3>
      <p>${safeText(subtitle)}</p>
      ${href ? `<p style="margin-top:10px"><a class="btn primary" href="${href}">Ver ficha</a></p>` : ""}
    </article>
  `;
}

async function main(){
  setYear();
  const people = await loadJSON("/data/people.json");

  const events = [];
  for(const p of people){
    if(p.birth?.date){
      events.push({ date: p.birth.date, label: `Nacimiento · ${p.fullName}`, href: `/app/person.html?id=${encodeURIComponent(p.id)}` });
    }
    if(p.death?.date){
      events.push({ date: p.death.date, label: `Fallecimiento · ${p.fullName}`, href: `/app/person.html?id=${encodeURIComponent(p.id)}` });
    }
  }

  events.sort((a,b) => (a.date || "").localeCompare(b.date || ""));

  const el = document.getElementById("timeline");
  el.innerHTML = events.length
    ? events.map(e => tile(e.label, fmtDate(e.date), e.href)).join("")
    : tile("Sin eventos", "Agrega fechas de nacimiento/fallecimiento en /data/people.json");
}

main().catch(err => {
  console.error(err);
  const el = document.getElementById("timeline");
  if(el) el.innerHTML = `<article class="tile"><h3>Error</h3><p>No se pudo cargar la data.</p></article>`;
});
