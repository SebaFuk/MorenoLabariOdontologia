/* =====================================================================
   ADMIN — Gestor de turnos · Supabase backend
   ===================================================================== */
(function () {
  'use strict';

  const sb = window.MLSupabase;
  if (!sb) {
    document.body.innerHTML = '<div style="padding:40px;text-align:center;font-family:sans-serif"><h2>Error</h2><p>No se pudo conectar a Supabase. Verificá tu conexión y recargá.</p></div>';
    return;
  }

  const SEDES = {
    rosario: { label: 'Rosario', phone: '+5493412562123' },
    vgg:     { label: 'V. G. Gálvez', phone: '+5493413592140' }
  };

  // State
  let turnos = [];
  let calCursor = new Date();
  let selectedDay = null;
  let editingId = null;
  let realtimeChannel = null;

  // ───────── Helpers ─────────
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  function toast(msg, kind = '') {
    const t = $('#adminToast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'admin-toast show ' + kind;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { t.className = 'admin-toast'; }, 2600);
  }
  function fmtDateLong(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function todayIso() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
  function isoFromDate(d) {
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function shortTime(hhmmss) {
    if (!hhmmss) return '--:--';
    return hhmmss.slice(0, 5);
  }
  function isAdminSession(session) {
    const user = session && session.user;
    const meta = (user && user.app_metadata) || {};
    const roles = Array.isArray(meta.roles) ? meta.roles : [];
    return meta.role === 'admin' || roles.includes('admin');
  }
  async function rejectNonAdmin(errorEl) {
    if (realtimeChannel) { sb.removeChannel(realtimeChannel); realtimeChannel = null; }
    await sb.auth.signOut();
    $('#adminShell').style.display = 'none';
    $('#loginWrap').style.display = '';
    if (errorEl) {
      errorEl.style.display = '';
      errorEl.textContent = 'Tu cuenta no tiene permisos de administrador.';
    }
  }

  // ───────── AUTH ─────────
  async function initAuth() {
    const { data } = await sb.auth.getSession();
    if (data && data.session) {
      if (!isAdminSession(data.session)) {
        await rejectNonAdmin($('#loginError'));
        return;
      }
      enterShell();
      return;
    }
    const form = $('#loginForm');
    const error = $('#loginError');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.style.display = 'none';
      const email = $('#loginEmail').value.trim();
      const password = $('#loginPwd').value;
      $('#loginBtn').disabled = true;
      $('#loginBtn').textContent = 'Entrando…';
      const { error: signErr } = await sb.auth.signInWithPassword({ email, password });
      $('#loginBtn').disabled = false;
      $('#loginBtn').textContent = 'Entrar';
      if (signErr) {
        error.style.display = '';
        error.textContent = signErr.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos.'
          : signErr.message;
        $('#loginPwd').value = '';
        return;
      }
      const { data: freshSession } = await sb.auth.getSession();
      if (!isAdminSession(freshSession && freshSession.session)) {
        $('#loginPwd').value = '';
        await rejectNonAdmin(error);
        return;
      }
      enterShell();
    });

    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (realtimeChannel) { sb.removeChannel(realtimeChannel); realtimeChannel = null; }
        $('#adminShell').style.display = 'none';
        $('#loginWrap').style.display = '';
      }
    });
  }

  async function enterShell() {
    $('#loginWrap').style.display = 'none';
    $('#adminShell').style.display = '';
    await loadTurnos();
    renderAll();
    subscribeRealtime();
  }

  // ───────── DATA ─────────
  async function loadTurnos() {
    const { data, error } = await sb
      .from('turnos')
      .select('id,fecha,hora,duracion,nombre,apellido,telefono,sede,servicio,source,status,notas,created_at,updated_at')
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
    if (error) {
      console.error(error);
      toast('Error cargando turnos: ' + error.message, 'error');
      turnos = [];
      return;
    }
    turnos = data || [];
  }

  function subscribeRealtime() {
    if (realtimeChannel) sb.removeChannel(realtimeChannel);
    realtimeChannel = sb
      .channel('turnos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, async (payload) => {
        await loadTurnos();
        renderAll();
        if (payload.eventType === 'INSERT' && payload.new && payload.new.source === 'online') {
          toast('Nuevo turno online: ' + payload.new.nombre + ' ' + payload.new.apellido, 'success');
        }
      })
      .subscribe();
  }

  // ───────── RENDER ─────────
  function renderAll() {
    renderStats();
    renderCalendar();
    renderList();
  }

  function renderStats() {
    const today = todayIso();
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const wsIso = isoFromDate(weekStart), weIso = isoFromDate(weekEnd);

    $('#statToday').textContent   = turnos.filter(t => t.fecha === today && t.status !== 'cancelled').length;
    $('#statWeek').textContent    = turnos.filter(t => t.fecha >= wsIso && t.fecha <= weIso && t.status !== 'cancelled').length;
    $('#statPending').textContent = turnos.filter(t => t.status === 'pending').length;
    $('#statTotal').textContent   = turnos.length;
  }

  function renderCalendar() {
    const grid = $('#calGrid');
    const title = $('#calTitle');
    const year = calCursor.getFullYear();
    const month = calCursor.getMonth();
    title.textContent = calCursor.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    const countByDate = {};
    turnos.forEach(t => {
      if (t.status === 'cancelled') return;
      countByDate[t.fecha] = (countByDate[t.fecha] || 0) + 1;
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();
    const today = todayIso();

    let html = '';
    for (let i = 0; i < startOffset; i++) html += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const count = countByDate[iso] || 0;
      const cls = ['cal-cell'];
      if (iso === today) cls.push('today');
      if (count > 0) cls.push('has-turnos');
      if (iso === selectedDay) cls.push('selected');
      html += `<button type="button" class="${cls.join(' ')}" data-iso="${iso}">
        <span>${d}</span>
        ${count > 0 ? `<span class="cal-cell-count">${count}</span>` : ''}
      </button>`;
    }
    grid.innerHTML = html;
    grid.querySelectorAll('.cal-cell').forEach(cell => {
      if (cell.classList.contains('empty')) return;
      cell.addEventListener('click', () => {
        const iso = cell.dataset.iso;
        selectedDay = (selectedDay === iso) ? null : iso;
        renderCalendar();
        renderList();
      });
    });
  }

  function getFilters() {
    return {
      status: $('#filterStatus').value,
      sede:   $('#filterSede').value,
      source: $('#filterSource').value,
      search: $('#filterSearch').value.trim().toLowerCase()
    };
  }

  function renderList() {
    const wrap = $('#turnoList');
    const empty = $('#turnoEmpty');
    const title = $('#listTitle');
    const sub = $('#listSub');
    const clearBtn = $('#clearDateBtn');
    const f = getFilters();

    let items = turnos.slice();
    if (selectedDay) items = items.filter(t => t.fecha === selectedDay);
    else {
      const today = todayIso();
      items = items.filter(t => t.fecha >= today);
    }
    if (f.status !== 'all') items = items.filter(t => t.status === f.status);
    if (f.sede !== 'all') items = items.filter(t => t.sede === f.sede);
    if (f.source !== 'all') items = items.filter(t => t.source === f.source);
    if (f.search) {
      items = items.filter(t => {
        const hay = ((t.nombre || '') + ' ' + (t.apellido || '') + ' ' + (t.telefono || '')).toLowerCase();
        return hay.includes(f.search) || digits(t.telefono).includes(digits(f.search));
      });
    }
    items.sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
      return (a.hora || '') < (b.hora || '') ? -1 : 1;
    });

    if (selectedDay) {
      title.textContent = fmtDateLong(selectedDay);
      sub.textContent = `${items.length} ${items.length === 1 ? 'turno' : 'turnos'}`;
      clearBtn.style.display = '';
    } else {
      title.textContent = 'Turnos próximos';
      sub.textContent = `${items.length} ${items.length === 1 ? 'turno' : 'turnos'} desde hoy`;
      clearBtn.style.display = 'none';
    }

    if (!items.length) {
      wrap.innerHTML = '';
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    let html = '';
    let currentDate = null;
    items.forEach(t => {
      if (t.fecha !== currentDate) {
        currentDate = t.fecha;
        html += `<div class="turno-day-group">${fmtDateLong(t.fecha)}</div>`;
      }
      html += renderTurnoCard(t);
    });
    wrap.innerHTML = html;

    wrap.querySelectorAll('.turno-card').forEach(card => {
      const id = card.dataset.id;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.turno-action')) return;
        openModal('edit', id);
      });
    });
    wrap.querySelectorAll('.turno-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.closest('.turno-card').dataset.id;
        const action = btn.dataset.action;
        if (action === 'confirm') updateStatus(id, 'confirmed');
        else if (action === 'done') updateStatus(id, 'done');
      });
    });
  }

  function renderTurnoCard(t) {
    const sede = SEDES[t.sede] || SEDES.rosario;
    const time = shortTime(t.hora);
    const phoneHref = 'tel:' + (t.telefono || '').replace(/\s/g, '');
    const waNumber = digits(t.telefono);
    const waText = encodeURIComponent(`Hola ${t.nombre}, te confirmamos tu turno en Odontología Moreno Labari (${sede.label}) el ${fmtDateLong(t.fecha)} a las ${time}.`);
    const waHref = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : '#';

    const statusBadge = `<span class="badge ${t.status}">${({
      pending: 'Pendiente', confirmed: 'Confirmado', done: 'Realizado', cancelled: 'Cancelado'
    })[t.status] || t.status}</span>`;
    const sourceBadge = t.source ? `<span class="badge ${t.source}">${({
      online: 'Online', whatsapp: 'WhatsApp', telefono: 'Teléfono', manual: 'Manual'
    })[t.source] || t.source}</span>` : '';
    const sedeBadge = `<span class="badge ${t.sede}">${sede.label}</span>`;

    return `<div class="turno-card" data-id="${t.id}">
      <div class="turno-time">
        <div class="turno-time-h">${escapeHtml(time)}</div>
        <div class="turno-time-d">${escapeHtml((t.duracion || 30) + ' min')}</div>
      </div>
      <div class="turno-info">
        <div class="turno-name">${escapeHtml(t.nombre)} ${escapeHtml(t.apellido)}</div>
        <div class="turno-meta">
          <span>${escapeHtml(t.servicio || 'Sin tratamiento')}</span>
          <span class="sep">·</span>
          <a href="${phoneHref}">${escapeHtml(t.telefono || '—')}</a>
        </div>
        <div class="turno-badges">${statusBadge}${sourceBadge}${sedeBadge}</div>
      </div>
      <div class="turno-actions">
        ${waNumber ? `<a class="turno-action wa" href="${waHref}" target="_blank" rel="noopener noreferrer" title="WhatsApp" onclick="event.stopPropagation()">💬</a>` : ''}
        <a class="turno-action call" href="${phoneHref}" title="Llamar" onclick="event.stopPropagation()">📞</a>
        ${t.status === 'pending' ? `<button type="button" class="turno-action" data-action="confirm" title="Confirmar">✓</button>` : ''}
        ${t.status !== 'done' && t.status !== 'cancelled' ? `<button type="button" class="turno-action" data-action="done" title="Marcar como realizado">★</button>` : ''}
      </div>
    </div>`;
  }

  async function updateStatus(id, status) {
    const { error } = await sb.from('turnos').update({ status }).eq('id', id);
    if (error) { toast('Error: ' + error.message, 'error'); return; }
    toast(({ confirmed: 'Confirmado', done: 'Marcado realizado', cancelled: 'Cancelado' })[status] || 'Actualizado', 'success');
    // Realtime will refresh, but force immediate update
    const i = turnos.findIndex(x => x.id === id);
    if (i >= 0) { turnos[i].status = status; renderAll(); }
  }

  // ───────── MODAL ─────────
  function openModal(mode, id) {
    editingId = null;
    $('#modalError').style.display = 'none';
    $('#turnoForm').reset();
    $('#t-duracion').value = 30;

    if (mode === 'edit' && id) {
      const t = turnos.find(x => x.id === id);
      if (!t) { toast('Turno no encontrado', 'error'); return; }
      editingId = id;
      $('#modalTitle').textContent = 'Editar turno';
      $('#t-id').value = t.id;
      $('#t-nombre').value = t.nombre || '';
      $('#t-apellido').value = t.apellido || '';
      $('#t-telefono').value = t.telefono || '';
      $('#t-sede').value = t.sede || 'rosario';
      $('#t-fecha').value = t.fecha || '';
      $('#t-hora').value = shortTime(t.hora);
      $('#t-duracion').value = t.duracion || 30;
      $('#t-servicio').value = t.servicio || '';
      $('#t-source').value = t.source || 'manual';
      $('#t-status').value = t.status || 'pending';
      $('#t-notas').value = t.notas || '';
      $('#modalDeleteBtn').style.display = '';
    } else {
      $('#modalTitle').textContent = 'Nuevo turno';
      $('#t-fecha').value = selectedDay || todayIso();
      $('#modalDeleteBtn').style.display = 'none';
    }
    $('#modalOverlay').style.display = '';
    $('#turnoModal').style.display = '';
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#t-nombre').focus(), 50);
  }
  function closeModal() {
    $('#modalOverlay').style.display = 'none';
    $('#turnoModal').style.display = 'none';
    document.body.style.overflow = '';
    editingId = null;
  }

  async function saveFromForm(e) {
    e.preventDefault();
    const err = $('#modalError');
    err.style.display = 'none';

    const data = {
      nombre:   $('#t-nombre').value.trim(),
      apellido: $('#t-apellido').value.trim(),
      telefono: $('#t-telefono').value.trim(),
      sede:     $('#t-sede').value,
      fecha:    $('#t-fecha').value,
      hora:     $('#t-hora').value || null,
      duracion: parseInt($('#t-duracion').value, 10) || 30,
      servicio: $('#t-servicio').value.trim() || null,
      source:   $('#t-source').value,
      status:   $('#t-status').value,
      notas:    $('#t-notas').value.trim() || null
    };
    const errors = [];
    if (!data.nombre)   errors.push('Nombre requerido.');
    if (!data.apellido) errors.push('Apellido requerido.');
    if (!data.telefono) errors.push('Teléfono requerido.');
    if (!data.fecha)    errors.push('Fecha requerida.');
    if (errors.length) { err.style.display = ''; err.textContent = errors.join(' '); return; }

    const btn = $('#modalSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    let resp;
    if (editingId) {
      resp = await sb.from('turnos').update(data).eq('id', editingId).select().single();
    } else {
      resp = await sb.from('turnos').insert(data).select().single();
    }
    btn.disabled = false;
    btn.textContent = 'Guardar';

    if (resp.error) {
      err.style.display = '';
      err.textContent = 'Error: ' + resp.error.message;
      return;
    }
    closeModal();
    await loadTurnos();
    renderAll();
    toast(editingId ? 'Turno actualizado' : 'Turno creado', 'success');
  }

  async function deleteTurno() {
    if (!editingId) return;
    if (!confirm('¿Eliminar este turno definitivamente?')) return;
    const { error } = await sb.from('turnos').delete().eq('id', editingId);
    if (error) { toast('Error: ' + error.message, 'error'); return; }
    closeModal();
    await loadTurnos();
    renderAll();
    toast('Turno eliminado', 'success');
  }

  // ───────── EXPORT CSV ─────────
  function exportCsv() {
    if (!turnos.length) { toast('No hay turnos para exportar', 'error'); return; }
    const cols = ['id','fecha','hora','duracion','nombre','apellido','telefono','sede','servicio','source','status','notas','created_at','updated_at'];
    const escape = v => {
      const s = String(v == null ? '' : v).replace(/"/g, '""');
      return /[",\n;]/.test(s) ? `"${s}"` : s;
    };
    const lines = [cols.join(',')];
    turnos.forEach(t => lines.push(cols.map(c => escape(t[c])).join(',')));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turnos_${todayIso()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exportado', 'success');
  }

  // ───────── BIND ─────────
  function bindShellEvents() {
    $('#calPrev').addEventListener('click', () => {
      calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1);
      renderCalendar();
    });
    $('#calNext').addEventListener('click', () => {
      calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1);
      renderCalendar();
    });
    $('#calToday').addEventListener('click', () => {
      calCursor = new Date();
      selectedDay = todayIso();
      renderCalendar();
      renderList();
    });
    $('#clearDateBtn').addEventListener('click', () => {
      selectedDay = null;
      renderCalendar();
      renderList();
    });
    ['filterStatus','filterSede','filterSource','filterSearch'].forEach(id => {
      $('#' + id).addEventListener('input', renderList);
      $('#' + id).addEventListener('change', renderList);
    });
    $('#newTurnoBtn').addEventListener('click', () => openModal('new'));
    $('#newTurnoBtnEmpty').addEventListener('click', () => openModal('new'));
    $('#modalCloseBtn').addEventListener('click', closeModal);
    $('#modalCancelBtn').addEventListener('click', closeModal);
    $('#modalOverlay').addEventListener('click', closeModal);
    $('#modalDeleteBtn').addEventListener('click', deleteTurno);
    $('#turnoForm').addEventListener('submit', saveFromForm);
    $('#exportCsvBtn').addEventListener('click', exportCsv);
    $('#logoutBtn').addEventListener('click', async () => {
      await sb.auth.signOut();
      location.reload();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $('#turnoModal').style.display !== 'none') closeModal();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    bindShellEvents();
  });
})();
