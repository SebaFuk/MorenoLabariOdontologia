const WHATSAPP_NUMBER="5493412562123";const SEDES={rosario:{label:"Rosario",address:"Blvd. Oroño 168bis, Rosario, Santa Fe",phone:"+5493412562123",phone_display:"341 256-2123",photo:"img/consultorio.webp",photoAlt:"Sede Rosario — Blvd. Oroño 168bis",tagLabel:"Sede Rosario"},vgg:{label:"Villa Gobernador Gálvez",address:"Alberdi 2313, Villa Gobernador Gálvez, Santa Fe",phone:"+5493413592140",phone_display:"341 359-2140",photo:"img/vgg-exterior.webp",photoAlt:"Sede Villa G. Gálvez — Alberdi 2313",tagLabel:"Sede V. G. Gálvez"},};let currentSede="rosario";function isMobileDevice(){return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);}
function showToast(msg){let t=document.getElementById("miniToast");if(!t){t=document.createElement("div");t.id="miniToast";t.style.position="fixed";t.style.left="50%";t.style.bottom="24px";t.style.transform="translateX(-50%)";t.style.padding="10px 14px";t.style.borderRadius="999px";t.style.background="rgba(16,26,46,.92)";t.style.border="1px solid rgba(255,255,255,.12)";t.style.color="#eaf0ff";t.style.zIndex="9999";t.style.boxShadow="0 18px 45px rgba(0,0,0,.35)";t.style.fontWeight="700";t.style.fontSize="14px";t.style.opacity="0";t.style.transition="opacity .18s ease";document.body.appendChild(t);}
t.textContent=msg;t.style.opacity="1";clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>(t.style.opacity="0"),1400);}
async function copyText(text){try{await navigator.clipboard.writeText(text);return true;}catch(e){return false;}}
function buildMessage(sedeKey){const sede=SEDES[sedeKey]||SEDES.rosario;return encodeURIComponent(`Hola! Quiero pedir un turno en Odontología Moreno Labari. Sede: ${sede.label}. ¿Me pasan disponibilidad?`);}
function buildCallLink(sedeKey){const sede=SEDES[sedeKey]||SEDES.rosario;return`tel:${sede.phone}`;}
function applyCallLinks(){const els=document.querySelectorAll("[data-call]");const isMobile=isMobileDevice();els.forEach((el)=>{el.onclick=null;const getSedeKey=()=>el.getAttribute("data-sede-call")||currentSede;const getSede=()=>SEDES[getSedeKey()]||SEDES.rosario;if(isMobile){const sede=getSede();el.setAttribute("href",`tel:${sede.phone}`);el.setAttribute("title",`Llamar (${sede.phone_display})`);el.textContent="Llamar";return;}
el.setAttribute("href","#");el.setAttribute("title","Copiar número");el.textContent="Copiar número";el.onclick=async(e)=>{e.preventDefault();const sede=getSede();const ok=await copyText(sede.phone_display);showToast(ok?`Número copiado: ${sede.phone_display}`:`Copiá manual: ${sede.phone_display}`);};});}
function buildWaLink(sedeKey){const sede=SEDES[sedeKey]||SEDES.rosario;const number=sede.phone.replace('+','');const msg=buildMessage(sedeKey);return`https://wa.me/${number}?text=${msg}`;}
function applyWhatsAppLinks(){const els=document.querySelectorAll("[data-wa]");els.forEach((el)=>{const sedeKey=el.getAttribute("data-sede-wa")||currentSede;el.setAttribute("href",buildWaLink(sedeKey));});}
function setActiveTabs(containerId,sedeKey){const container=document.getElementById(containerId);if(!container)return;const tabs=Array.from(container.querySelectorAll(".tab"));tabs.forEach((btn)=>{const isActive=btn.getAttribute("data-sede")===sedeKey;btn.classList.toggle("active",isActive);btn.setAttribute("aria-selected",isActive?"true":"false");});}
function togglePanels(selector,sedeKey){const panels=document.querySelectorAll(selector);panels.forEach((p)=>{const isActive=p.getAttribute("data-sede")===sedeKey;p.classList.toggle("active",isActive);p.style.display=isActive?"":"none";});}
function setSede(sedeKey){if(!SEDES[sedeKey])sedeKey="rosario";currentSede=sedeKey;const select=document.getElementById("sedeSelect");if(select)select.value=sedeKey;setActiveTabs("sedeTabs",sedeKey);setActiveTabs("contactTabs",sedeKey);togglePanels(".sedePanel",sedeKey);togglePanels(".contactAddr",sedeKey);togglePanels(".mapFrame",sedeKey);togglePanels("[data-sede-link]",sedeKey);const quick=document.getElementById("quickAddress");if(quick)quick.textContent=SEDES[sedeKey].address;applyWhatsAppLinks();applyCallLinks();if(window._syncDrawerSede)window._syncDrawerSede(sedeKey);}
function wireTabs(containerId){const container=document.getElementById(containerId);if(!container)return;container.addEventListener("click",(e)=>{const btn=e.target.closest(".tab");if(!btn)return;const sedeKey=btn.getAttribute("data-sede");if(sedeKey)setSede(sedeKey);});}
document.addEventListener("DOMContentLoaded",()=>{const select=document.getElementById("sedeSelect");if(select){select.addEventListener("change",(e)=>setSede(e.target.value));}
wireTabs("sedeTabs");wireTabs("contactTabs");setSede("rosario");const y=document.getElementById("year");if(y)y.textContent=new Date().getFullYear();});document.addEventListener('DOMContentLoaded',()=>{const revealEls=document.querySelectorAll('.reveal, .reveal-left, .reveal-right');const observer=new IntersectionObserver((entries)=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:0.12,rootMargin:'0px 0px -40px 0px'});revealEls.forEach(el=>observer.observe(el));const topbar=document.querySelector('.topbar');window.addEventListener('scroll',()=>{topbar.classList.toggle('scrolled',window.scrollY>20);},{passive:true});});document.addEventListener('DOMContentLoaded',()=>{const hamburger=document.getElementById('hamburgerBtn');const drawer=document.getElementById('mobileDrawer');const overlay=document.getElementById('drawerOverlay');const drawerLinks=document.querySelectorAll('.drawerLink');function openDrawer(){drawer.classList.add('open');overlay.classList.add('open');hamburger.classList.add('open');hamburger.setAttribute('aria-expanded','true');drawer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
function closeDrawer(){drawer.classList.remove('open');overlay.classList.remove('open');hamburger.classList.remove('open');hamburger.setAttribute('aria-expanded','false');drawer.setAttribute('aria-hidden','true');document.body.style.overflow='';}
if(hamburger)hamburger.addEventListener('click',()=>{drawer.classList.contains('open')?closeDrawer():openDrawer();});if(overlay)overlay.addEventListener('click',closeDrawer);drawerLinks.forEach(link=>link.addEventListener('click',closeDrawer));const drawerSedeBtns=document.querySelectorAll('.drawerSedeBtn');drawerSedeBtns.forEach(btn=>{btn.addEventListener('click',()=>{const sedeKey=btn.getAttribute('data-sede');setSede(sedeKey);drawerSedeBtns.forEach(b=>b.classList.toggle('active',b===btn));});});window._syncDrawerSede=(sedeKey)=>{drawerSedeBtns.forEach(b=>b.classList.toggle('active',b.getAttribute('data-sede')===sedeKey));};});document.addEventListener('DOMContentLoaded',()=>{const closeBtn=document.getElementById('drawerCloseBtn');const waFloat=document.getElementById('waFloat');const drawer=document.getElementById('mobileDrawer');if(closeBtn){closeBtn.addEventListener('click',()=>{const overlay=document.getElementById('drawerOverlay');const hamburger=document.getElementById('hamburgerBtn');drawer.classList.remove('open');overlay&&overlay.classList.remove('open');hamburger&&hamburger.classList.remove('open');hamburger&&hamburger.setAttribute('aria-expanded','false');drawer.setAttribute('aria-hidden','true');document.body.style.overflow='';waFloat&&waFloat.classList.remove('drawerOpen');});}
const observer=new MutationObserver(()=>{if(drawer.classList.contains('open')){waFloat&&waFloat.classList.add('drawerOpen');}else{waFloat&&waFloat.classList.remove('drawerOpen');}});if(drawer)observer.observe(drawer,{attributes:true,attributeFilter:['class']});});document.addEventListener('DOMContentLoaded',()=>{const input=document.getElementById('obrasInput');const chips=document.querySelectorAll('#chipList .chip');const noResult=document.getElementById('obrasNoResult');if(!input)return;input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');let visible=0;chips.forEach(chip=>{const text=(chip.dataset.obra||chip.textContent).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const match=!q||text.includes(q);chip.classList.toggle('hidden',!match);if(match)visible++;});noResult.style.display=(q&&visible===0)?'block':'none';if(noResult.style.display==='block')applyWhatsAppLinks();});});document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-ba]').forEach(slider=>{const afterWrap=slider.querySelector('.ba-after-wrap');const handle=slider.querySelector('.ba-handle');let dragging=false;function setPos(pct){pct=Math.max(5,Math.min(95,pct));afterWrap.style.clipPath=`inset(0 0 0 ${pct}%)`;handle.style.left=pct+'%';}
function getPercent(e){const rect=slider.getBoundingClientRect();const clientX=e.touches?e.touches[0].clientX:e.clientX;return((clientX-rect.left)/rect.width)*100;}
slider.addEventListener('mousedown',e=>{dragging=true;setPos(getPercent(e));e.preventDefault();});slider.addEventListener('touchstart',e=>{dragging=true;setPos(getPercent(e));},{passive:true});window.addEventListener('mousemove',e=>{if(dragging)setPos(getPercent(e));});window.addEventListener('touchmove',e=>{if(dragging)setPos(getPercent(e));},{passive:true});window.addEventListener('mouseup',()=>{dragging=false;});window.addEventListener('touchend',()=>{dragging=false;});setPos(50);});});function applyServiceLinks(){document.querySelectorAll('[data-service]').forEach(el=>{const service=el.getAttribute('data-service');const sede=SEDES[currentSede]||SEDES.rosario;const number=sede.phone.replace('+','');const msg=encodeURIComponent(`Hola! Quiero consultar sobre ${service} en Odontología Moreno Labari. Sede: ${sede.label}. ¿Me dan más información?`);el.setAttribute('href',`https://wa.me/${number}?text=${msg}`);});}
document.addEventListener('DOMContentLoaded',()=>{const sections=document.querySelectorAll('section[id]');const navLinks=document.querySelectorAll('.menu a[href^="#"]');if(!sections.length||!navLinks.length)return;const observer=new IntersectionObserver((entries)=>{entries.forEach(entry=>{if(entry.isIntersecting){const id=entry.target.getAttribute('id');navLinks.forEach(link=>{link.classList.toggle('active',link.getAttribute('href')==='#'+id);});}});},{threshold:0.3,rootMargin:'-80px 0px -40% 0px'});sections.forEach(s=>observer.observe(s));});document.addEventListener('DOMContentLoaded',()=>{const btn=document.getElementById('backToTop');if(!btn)return;window.addEventListener('scroll',()=>{btn.classList.toggle('visible',window.scrollY>400);},{passive:true});btn.addEventListener('click',()=>{window.scrollTo({top:0,behavior:'smooth'});});});document.addEventListener('DOMContentLoaded',()=>{const hint=document.getElementById('sliderHint');if(!hint)return;const isTouch=('ontouchstart'in window)||(navigator.maxTouchPoints>0);hint.textContent=isTouch?'Deslizá para comparar':'Arrastrá el divisor';});const _origSetSede=setSede;setSede=function(sedeKey){_origSetSede(sedeKey);applyServiceLinks();};document.addEventListener('DOMContentLoaded',()=>{applyServiceLinks();});(function(){const origSetSede2=setSede;setSede=function(sedeKey){origSetSede2(sedeKey);if(sedeKey==='vgg'){const iframe=document.querySelector('.mapFrame[data-sede="vgg"]');if(iframe&&iframe.dataset.src&&!iframe.getAttribute("src")){iframe.src=iframe.dataset.src;}}const sede=SEDES[sedeKey]||SEDES.rosario;const heroPhoto=document.getElementById('heroPhoto');const heroFrame=document.getElementById('heroFrame');const heroTag=document.getElementById('heroSedeTag');if(heroPhoto&&sede.photo){if(heroFrame)heroFrame.classList.add('is-switching');setTimeout(()=>{heroPhoto.src=sede.photo;heroPhoto.alt=sede.photoAlt||sede.label;if(heroFrame)heroFrame.classList.remove('is-switching');},220);}if(heroTag&&sede.tagLabel)heroTag.textContent=sede.tagLabel;};})();function buildIsoFromDayMonth(day,month){
  if(!day||!month) return null;
  const now=new Date();
  let year=now.getFullYear();
  const candidate=new Date(year,month-1,day);
  if(candidate < new Date(now.getFullYear(),now.getMonth(),now.getDate())) year+=1;
  return year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
}
async function saveOnlineTurnoSupabase(d){
  if(!window.MLSupabase) return {ok:false,err:'Supabase no inicializado.'};
  const payload={nombre:d.nombre,apellido:d.apellido,telefono:d.telefono,sede:d.sede,fecha:d.fecha||null,hora:d.hora||null,duracion:30,servicio:d.servicio||null,notas:d.notas||null,source:'online',status:'pending'};
  if(!payload.fecha){const today=new Date();payload.fecha=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');}
  const {error}=await window.MLSupabase.from('turnos').insert(payload);
  if(error) return {ok:false,err:error.message};
  return {ok:true};
}
document.addEventListener('DOMContentLoaded',()=>{
  const form=document.getElementById('onlineBookingForm');
  if(!form) return;
  const err=document.getElementById('onlineBookingError');
  const success=document.getElementById('onlineBookingSuccess');
  const waLink=document.getElementById('onlineBookingWaLink');
  const resetBtn=document.getElementById('onlineBookingReset');
  const submitBtn=document.getElementById('onlineBookingSubmit');
  const COOLDOWN_MS=10*60*1000;
  form.addEventListener('submit',async (e)=>{
    e.preventDefault();
    err.style.display='none';
    const trap=document.getElementById('ob-website');
    if(trap&&trap.value.trim()) return;
    try{
      const last=parseInt(localStorage.getItem('ml_turno_last_submit')||'0',10);
      if(last&&Date.now()-last<COOLDOWN_MS){
        err.style.display='';
        err.textContent='Ya recibimos una solicitud hace unos minutos. Si necesitÃ¡s sumar datos, escribinos por WhatsApp.';
        return;
      }
    }catch(e){}
    const diaSel=document.getElementById('ob-dia');
    const mesSel=document.getElementById('ob-mes');
    const data={
      nombre:document.getElementById('ob-nombre').value.trim(),
      apellido:document.getElementById('ob-apellido').value.trim(),
      telefono:document.getElementById('ob-telefono').value.trim(),
      sede:document.getElementById('ob-sede').value,
      fecha:buildIsoFromDayMonth(parseInt(diaSel&&diaSel.value,10),parseInt(mesSel&&mesSel.value,10)),
      hora:document.getElementById('ob-hora').value,
      servicio:document.getElementById('ob-servicio').value,
      notas:document.getElementById('ob-notas').value.trim()
    };
    const errors=[];
    if(!data.nombre)   errors.push('Nombre requerido.');
    if(!data.apellido) errors.push('Apellido requerido.');
    if(!data.telefono||data.telefono.replace(/\D/g,'').length<6) errors.push('Teléfono inválido.');
    if(errors.length){err.style.display='';err.textContent=errors.join(' ');return;}
    submitBtn.disabled=true;submitBtn.textContent='Enviando…';
    const res=await saveOnlineTurnoSupabase(data);
    submitBtn.disabled=false;submitBtn.textContent='Solicitar turno online';
    if(!res.ok){err.style.display='';err.textContent='No pudimos registrar tu turno: '+res.err+'. Igual podés contactarnos por WhatsApp.';}
    if(res.ok){try{localStorage.setItem('ml_turno_last_submit',String(Date.now()));}catch(e){}}
    const sede=SEDES[data.sede]||SEDES.rosario;
    const number=sede.phone.replace('+','');
    const lines=[`Hola! Quiero pedir un turno en Odontología Moreno Labari.`,`Sede: ${sede.label}`,`Nombre: ${data.nombre} ${data.apellido}`,`Teléfono: ${data.telefono}`];
    if(data.servicio) lines.push(`Tratamiento: ${data.servicio}`);
    if(data.fecha)    lines.push(`Fecha preferida: ${data.fecha}`);
    if(data.hora)     lines.push(`Horario: ${data.hora}`);
    if(data.notas)    lines.push(`Notas: ${data.notas}`);
    const msg=encodeURIComponent(lines.join('\n'));
    waLink.href=`https://wa.me/${number}?text=${msg}`;
    form.style.display='none';
    success.style.display='';
    try{localStorage.setItem('ml_turno_sent_v1',JSON.stringify({sede:data.sede,nombre:data.nombre,at:Date.now()}));}catch(e){}
    setTimeout(()=>{try{window.open(waLink.href,'_blank','noopener');}catch(e){}},250);
    setTimeout(()=>{if(window.MLGRPopup) window.MLGRPopup.show({sede:data.sede,force:true});},6000);
  });
  if(resetBtn){resetBtn.addEventListener('click',()=>{form.reset();form.style.display='';success.style.display='none';});}
  const sedeSel=document.getElementById('ob-sede');
  const top=document.getElementById('sedeSelect');
  if(sedeSel&&top){sedeSel.value=top.value||'rosario';top.addEventListener('change',()=>{sedeSel.value=top.value;});}
  const diaSel=document.getElementById('ob-dia');
  if(diaSel&&diaSel.options.length<=1){for(let i=1;i<=31;i++){const o=document.createElement('option');o.value=i;o.textContent=i;diaSel.appendChild(o);}}
});

/* ───────── Google Reviews popup ───────── */
(function(){
  const GR_SENT='ml_turno_sent_v1';
  const GR_DISMISSED='ml_gr_dismissed_v1';
  const GR_SHOWN='ml_gr_shown_v1';
  let bound=false;
  function bind(){
    if(bound) return;
    const popup=document.getElementById('grPopup');
    const overlay=document.getElementById('grOverlay');
    if(!popup) return;
    const closeBtn=document.getElementById('grClose');
    const laterBtn=document.getElementById('grLater');
    const reviewLinks=popup.querySelectorAll('.gr-btn');
    closeBtn&&closeBtn.addEventListener('click',()=>hide(true));
    laterBtn&&laterBtn.addEventListener('click',()=>hide(false));
    overlay&&overlay.addEventListener('click',()=>hide(false));
    reviewLinks.forEach(a=>a.addEventListener('click',()=>{setTimeout(()=>hide(true),200);}));
    bound=true;
  }
  function hide(persist){
    const popup=document.getElementById('grPopup');
    const overlay=document.getElementById('grOverlay');
    if(popup) popup.hidden=true;
    if(overlay) overlay.hidden=true;
    if(persist){try{localStorage.setItem(GR_DISMISSED,'1');}catch(e){}}
  }
  function show(opts){
    bind();
    const popup=document.getElementById('grPopup');
    const overlay=document.getElementById('grOverlay');
    if(!popup) return;
    try{
      if(!opts||!opts.force){
        if(localStorage.getItem(GR_DISMISSED)) return;
        const shown=parseInt(localStorage.getItem(GR_SHOWN)||'0',10);
        if(shown>=3){localStorage.setItem(GR_DISMISSED,'1');return;}
        localStorage.setItem(GR_SHOWN,String(shown+1));
      }
      const sede=(opts&&opts.sede)||'rosario';
      const rosaBtn=document.getElementById('grReviewRosario');
      const vggBtn=document.getElementById('grReviewVgg');
      if(rosaBtn&&vggBtn){
        if(sede==='vgg'){
          rosaBtn.classList.remove('primary');rosaBtn.classList.add('ghost');
          vggBtn.classList.remove('ghost');vggBtn.classList.add('primary');
        }else{
          vggBtn.classList.remove('primary');vggBtn.classList.add('ghost');
          rosaBtn.classList.remove('ghost');rosaBtn.classList.add('primary');
        }
      }
      if(overlay) overlay.hidden=false;
      popup.hidden=false;
    }catch(e){}
  }
  window.MLGRPopup={show,hide};
  document.addEventListener('DOMContentLoaded',()=>{
    bind();
    // On reload: if flag exists and not dismissed → show
    try{
      const sent=localStorage.getItem(GR_SENT);
      if(!sent) return;
      const info=JSON.parse(sent);
      setTimeout(()=>show({sede:info.sede||'rosario'}),2500);
    }catch(e){}
  });
})();
