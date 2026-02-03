export function qs(sel, el=document){ return el.querySelector(sel); }
export function qsa(sel, el=document){ return Array.from(el.querySelectorAll(sel)); }

export async function loadJSON(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error(`No se pudo cargar ${path}`);
  return res.json();
}

export function setYear(){
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

export function fmtDate(iso){
  if(!iso) return "";
  // iso: YYYY-MM-DD
  const [y,m,d] = iso.split("-").map(Number);
  if(!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m-1, d));
  return dt.toLocaleDateString("es-CL", { year:"numeric", month:"long", day:"2-digit" });
}

export function safeText(v){
  return (v ?? "").toString();
}
