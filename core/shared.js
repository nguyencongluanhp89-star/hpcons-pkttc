// Shared DOM, ID and date helpers. Classic script globals are kept for compatibility.
// ---------- HELPERS ----------
function uuid(){ return (crypto.randomUUID ? crypto.randomUUID() : "id-"+Date.now()+"-"+Math.random().toString(16).slice(2)); }
function $(id){ return document.getElementById(id); }
function el(tag, cls, html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
function todayISO(){ const d=new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); }
function fmtVN(iso){ if(!iso) return ""; const p=iso.split("-"); return p[2]+"/"+p[1]+"/"+p[0]; }
function esc(s){ return (s==null?"":String(s)).replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
