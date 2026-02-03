// WhatsApp
// Cambiá este número por el real (formato internacional, sin +, sin espacios).
// Ejemplo Rosario: 54 9 341 ...
const WHATSAPP_NUMBER = "5493413667500";

const SEDES = {
  rosario: {
    label: "Rosario",
    address: "Blvd. Oroño 174bis, Rosario, Santa Fe",
    phone: "+5493413667500",
    phone_display: "341 366-7500",
  },
  vgg: {
    label: "Villa Gobernador Gálvez",
    address: "Alberdi 2313, Villa Gobernador Gálvez, Santa Fe",
    phone: "+5493413667500",
    phone_display: "341 366-7500",
  },
};

let currentSede = "rosario";


function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function showToast(msg) {
  let t = document.getElementById("miniToast");
  if (!t) {
    t = document.createElement("div");
    t.id = "miniToast";
    t.style.position = "fixed";
    t.style.left = "50%";
    t.style.bottom = "24px";
    t.style.transform = "translateX(-50%)";
    t.style.padding = "10px 14px";
    t.style.borderRadius = "999px";
    t.style.background = "rgba(16,26,46,.92)";
    t.style.border = "1px solid rgba(255,255,255,.12)";
    t.style.color = "#eaf0ff";
    t.style.zIndex = "9999";
    t.style.boxShadow = "0 18px 45px rgba(0,0,0,.35)";
    t.style.fontWeight = "700";
    t.style.fontSize = "14px";
    t.style.opacity = "0";
    t.style.transition = "opacity .18s ease";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => (t.style.opacity = "0"), 1400);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}

function buildMessage(sedeKey) {
  const sede = SEDES[sedeKey] || SEDES.rosario;
  return encodeURIComponent(
    `Hola! Quiero pedir un turno en Moreno Labari Odontología. Sede: ${sede.label}. ¿Me pasan disponibilidad?`
  );
}


function buildCallLink(sedeKey) {
  const sede = SEDES[sedeKey] || SEDES.rosario;
  return `tel:${sede.phone}`;
}

function applyCallLinks() {
  const els = document.querySelectorAll("[data-call]");
  const isMobile = isMobileDevice();

  els.forEach((el) => {
    // Avoid stacking handlers when sede changes
    el.onclick = null;

    const getSedeKey = () => el.getAttribute("data-sede-call") || currentSede;
    const getSede = () => SEDES[getSedeKey()] || SEDES.rosario;

    if (isMobile) {
      const sede = getSede();
      el.setAttribute("href", `tel:${sede.phone}`);
      el.setAttribute("title", `Llamar (${sede.phone_display})`);
      el.textContent = "Llamar";
      return;
    }

    // Desktop: many PCs don't handle tel: links -> copy number instead
    el.setAttribute("href", "#");
    el.setAttribute("title", "Copiar número");
    el.textContent = "Copiar número";

    el.onclick = async (e) => {
      e.preventDefault();
      const sede = getSede();
      const ok = await copyText(sede.phone_display);
      showToast(ok ? `Número copiado: ${sede.phone_display}` : `Copiá manual: ${sede.phone_display}`);
    };
  });
}


function buildWaLink(sedeKey) {
  const msg = buildMessage(sedeKey);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

function applyWhatsAppLinks() {
  const els = document.querySelectorAll("[data-wa]");
  els.forEach((el) => {
    const sedeKey = el.getAttribute("data-sede-wa") || currentSede;
    el.setAttribute("href", buildWaLink(sedeKey));
  });
}

function setActiveTabs(containerId, sedeKey) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const tabs = Array.from(container.querySelectorAll(".tab"));
  tabs.forEach((btn) => {
    const isActive = btn.getAttribute("data-sede") === sedeKey;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function togglePanels(selector, sedeKey) {
  const panels = document.querySelectorAll(selector);
  panels.forEach((p) => {
    const isActive = p.getAttribute("data-sede") === sedeKey;
    p.classList.toggle("active", isActive);
    p.style.display = isActive ? "" : "none";
  });
}

function setSede(sedeKey) {
  if (!SEDES[sedeKey]) sedeKey = "rosario";
  currentSede = sedeKey;

  // Sync top select
  const select = document.getElementById("sedeSelect");
  if (select) select.value = sedeKey;

  // Sync tabs
  setActiveTabs("sedeTabs", sedeKey);
  setActiveTabs("contactTabs", sedeKey);

  // Show/hide panels
  togglePanels(".sedePanel", sedeKey);
  togglePanels(".contactAddr", sedeKey);
  togglePanels(".mapFrame", sedeKey);
  togglePanels("[data-sede-link]", sedeKey);


  // Update hero quick address
  const quick = document.getElementById("quickAddress");
  if (quick) quick.textContent = SEDES[sedeKey].address;

  // Update all WhatsApp links
  applyWhatsAppLinks();
  // Update all Call links
  applyCallLinks();
}

function wireTabs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    const sedeKey = btn.getAttribute("data-sede");
    if (sedeKey) setSede(sedeKey);
  });
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  // Top select
  const select = document.getElementById("sedeSelect");
  if (select) {
    select.addEventListener("change", (e) => setSede(e.target.value));
  }

  wireTabs("sedeTabs");
  wireTabs("contactTabs");

  setSede("rosario");

  // Año en footer
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
});
