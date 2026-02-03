import { loadJSON, setYear, safeText } from "./common.js";

function personCard(p){
  const birth = p.birth?.date ? `Nac.: ${p.birth.date}` : "Nacimiento: —";
  const place = p.birth?.place ? `· ${p.birth.place}` : "";
  return `
    <article class="tile">
      <h3>${safeText(p.fullName)}</h3>
      <p>${birth} ${place}</p>
      <p style="margin-top:10px">
        <a class="btn primary" href="/app/person.html?id=${encodeURIComponent(p.id)}">Ver ficha</a>
      </p>
    </article>
  `;
}

async function main(){
  setYear();
  const people = await loadJSON("/data/people.json");

  const list = document.getElementById("list");
  const search = document.getElementById("search");

  function render(filter=""){
    const f = filter.trim().toLowerCase();
    const rows = people
      .filter(p => !f || (p.fullName || "").toLowerCase().includes(f))
      .map(personCard)
      .join("");
    list.innerHTML = rows || `<div class="tile"><h3>Sin resultados</h3><p>Prueba con otro nombre.</p></div>`;
  }

  render("");
  search.addEventListener("input", e => render(e.target.value));
}

main().catch(err => {
  console.error(err);
  const list = document.getElementById("list");
  if(list) list.innerHTML = `<div class="tile"><h3>Error</h3><p>No se pudo cargar la data.</p></div>`;
});
