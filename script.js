// WhatsApp
// Cambiá este número por el real (formato internacional, sin +, sin espacios).
// Ejemplo Rosario: 54 9 341 ...
const WHATSAPP_NUMBER = "5493412562123";

const SEDES = {
  rosario: {
    label: "Rosario",
    address: "Blvd. Oroño 168bis, Rosario, Santa Fe",
    phone: "+5493412562123",
    phone_display: "341 256-2123",
  },
  vgg: {
    label: "Villa Gobernador Gálvez",
    address: "Alberdi 2313, Villa Gobernador Gálvez, Santa Fe",
    phone: "+5493413592140",
    phone_display: "341 359-2140",
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
  const sede = SEDES[sedeKey] || SEDES.rosario;
  const number = sede.phone.replace('+', '');
  const msg = buildMessage(sedeKey);
  return `https://wa.me/${number}?text=${msg}`;
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
  // Sync drawer sede buttons
  if (window._syncDrawerSede) window._syncDrawerSede(sedeKey);
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

/* ── Scroll Reveal ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));

  /* Topbar scroll shadow */
  const topbar = document.querySelector('.topbar');
  window.addEventListener('scroll', () => {
    topbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
});

/* ── Mobile Drawer ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const hamburger   = document.getElementById('hamburgerBtn');
  const drawer      = document.getElementById('mobileDrawer');
  const overlay     = document.getElementById('drawerOverlay');
  const drawerLinks = document.querySelectorAll('.drawerLink');

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });

  if (overlay) overlay.addEventListener('click', closeDrawer);

  // Cerrar al tocar un link del menú
  drawerLinks.forEach(link => link.addEventListener('click', closeDrawer));

  // Sede buttons dentro del drawer
  const drawerSedeBtns = document.querySelectorAll('.drawerSedeBtn');
  drawerSedeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sedeKey = btn.getAttribute('data-sede');
      setSede(sedeKey);
      // Sync visual active state
      drawerSedeBtns.forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  // Sync drawer sede buttons when sede changes from elsewhere
  const origSetSede = setSede;
  window._syncDrawerSede = (sedeKey) => {
    drawerSedeBtns.forEach(b =>
      b.classList.toggle('active', b.getAttribute('data-sede') === sedeKey)
    );
  };
});

/* ── Drawer close button + hide WA float ─────────── */
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('drawerCloseBtn');
  const waFloat  = document.getElementById('waFloat');
  const drawer   = document.getElementById('mobileDrawer');

  // Close button inside drawer
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      // reuse closeDrawer from the other listener
      const overlay   = document.getElementById('drawerOverlay');
      const hamburger = document.getElementById('hamburgerBtn');
      drawer.classList.remove('open');
      overlay && overlay.classList.remove('open');
      hamburger && hamburger.classList.remove('open');
      hamburger && hamburger.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      waFloat && waFloat.classList.remove('drawerOpen');
    });
  }

  // Watch drawer open/close to toggle WA float
  const observer = new MutationObserver(() => {
    if (drawer.classList.contains('open')) {
      waFloat && waFloat.classList.add('drawerOpen');
    } else {
      waFloat && waFloat.classList.remove('drawerOpen');
    }
  });
  if (drawer) observer.observe(drawer, { attributes: true, attributeFilter: ['class'] });
});
