/* FoodHub — aplicación interna: inicio de sesión, estructura, inicio, nueva incidencia, seguimiento, detalle y configuración. */
(function () {
  'use strict';
  var CFG = window.FOODHUB_CONFIG;
  var S = { me: null, cat: null, wiz: { step: 1, datos: {}, files: [] }, tab: 'usuarios', users: null, log: null, editing: null, plant: '' };
  var I = window.FHIcon;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(t) { var d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.innerHTML = I('circle-check', 18) + '<span>' + esc(t) + '</span>'; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3500); }
  function root(html) { $('#root').innerHTML = html; }
  function pref(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // [id, título, icono, descripción para el estado "en preparación"]
  var NAV = [
    ['inicio', 'Inicio', 'house'],
    ['nueva', 'Nueva incidencia', 'circle-plus'],
    ['seguimiento', 'Seguimiento', 'list-checks', 'Consulta y da seguimiento a las incidencias registradas, con filtros por planta, estado y fechas, y semáforo de vencimiento.'],
    ['auditoria', 'Auditoría mensual', 'clipboard-check', 'Lista de verificación por secciones, con avance, borrador y reporte de hallazgos al finalizar.'],
    ['calendario', 'Calendario', 'calendar-days', 'Programación de la auditoría mensual de cada planta, con recordatorios y estado de cumplimiento.'],
    ['evaluacion', 'Evaluación mensual', 'chart-column', 'Resultados del proveedor por indicador y por planta, calculados a partir de incidencias, auditorías y encuesta.'],
    ['reportes', 'Reportes', 'file-text', 'Exportación a Excel y PDF del reporte mensual y de los hallazgos de auditoría.'],
    ['configuracion', 'Configuración', 'settings']
  ];
  var CAT_ICON = { 'CAT-SER': 'clock', 'CAT-MEN': 'utensils', 'CAT-PLA': 'users', 'CAT-HIG': 'shield-check', 'CAT-INS': 'building-2', 'CAT-OTR': 'circle-alert' };
  function navItem(id) { return NAV.filter(function (n) { return n[0] === id; })[0]; }
  function initials(t) { var p = String(t || '?').replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase(); }

  // ---------------- arranque ----------------
  function start() {
    if (/PEGAR_AQUI/.test(CFG.API_URL)) {
      root('<div class="login"><div class="l-main"><div class="card"><h1>FoodHub</h1><div class="alert">' + I('triangle-alert', 18) + '<span>La aplicación no está configurada. Falta la dirección del servidor en config.js.</span></div></div></div></div>');
      return;
    }
    var s = FH.Session.get();
    if (!s) return showLogin();
    root('<div class="loading">Verificando tu sesión…</div>');
    FH.call('auth.me').then(function (me) { S.me = me; return loadCatalog(); })
      .then(render).catch(function (e) { showLogin(e.code === 'AUTH' ? e.message : 'No se pudo verificar la sesión: ' + e.message); });
  }

  function loadCatalog() { return FH.call('catalog.get').then(function (c) { S.cat = c; if (c.plantas.length === 1) S.plant = c.plantas[0].planta_id; }); }

  window.addEventListener('fh:logout', function (e) { S.me = null; showLogin(e.detail); });
  window.addEventListener('hashchange', function () { if (S.me) render(); });

  // ---------------- inicio de sesión (código por correo) ----------------
  var L = { correo: '' };
  function brandMark(size) { return '<span class="mark">' + I('utensils', size || 20) + '</span>'; }
  function loginShell(inner, msg) {
    root('<div class="login"><aside class="l-side"><div class="brand">' + brandMark() + '<div class="txt"><b>FoodHub</b><small>Evaluación del servicio de comedor</small></div></div>' +
      '<div><h2>Seguimiento del servicio de comedor en las cuatro plantas.</h2><p>Incidencias, auditorías mensuales y evaluación del proveedor en un solo lugar.</p></div>' +
      '<ul class="l-list"><li>' + I('map-pin', 18) + 'Cantera · Barrancas · Juventud · Américas</li><li>' + I('shield-check', 18) + 'Acceso solo para personal autorizado</li></ul></aside>' +
      '<main class="l-main"><div class="card"><div class="brand l-brand-m" style="padding:0">' + brandMark() + '<div class="txt"><b style="color:var(--navy)">FoodHub</b><small style="color:var(--muted)">Evaluación del servicio de comedor</small></div></div>' +
      (msg ? '<div class="alert" role="alert">' + I('circle-alert', 18) + '<span>' + esc(msg) + '</span></div>' : '') + inner +
      '<p class="muted" style="font-size:12.5px">Solo pueden entrar los correos dados de alta por el administrador. El proveedor responde desde el enlace que recibe por correo.</p>' +
      '</div></main></div>');
  }
  function showLogin(msg) {
    loginShell('<div><h1>Iniciar sesión</h1><p class="muted" style="margin-top:6px">Te enviaremos un código de acceso a tu correo.</p></div>' +
      '<form id="l-f1" style="display:flex;flex-direction:column;gap:16px" novalidate>' +
      '<div class="field"><label for="l-em">Correo electrónico</label><div class="ctl">' + I('mail', 18) +
      '<input id="l-em" type="email" autocomplete="email" inputmode="email" placeholder="nombre@teleflex.com" value="' + esc(L.correo) + '" required></div></div>' +
      '<button class="btn pri" id="l-send" type="submit">Enviarme un código ' + I('arrow-right', 18) + '</button>' +
      '<p id="l-st" class="muted" role="status" style="font-size:13px"></p></form>', msg);
    var em = $('#l-em'); em.focus();
    $('#l-f1').onsubmit = function (e) {
      e.preventDefault();
      var c = em.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) { $('#l-st').innerHTML = '<span class="err">Escribe un correo válido.</span>'; return; }
      $('#l-send').disabled = true; $('#l-st').textContent = 'Enviando…';
      FH.call('auth.requestCode', { correo: c })
        .then(function (d) { L.correo = c; showCode(d.mensaje); })
        .catch(function (err) { $('#l-send').disabled = false; $('#l-st').innerHTML = '<span class="err">' + esc(err.message) + '</span>'; });
    };
  }
  function showCode(info, msg) {
    loginShell('<div><h1>Revisa tu correo</h1><p class="muted" style="margin-top:6px">' + esc(info || '') + '</p></div>' +
      '<form id="l-f2" style="display:flex;flex-direction:column;gap:16px" novalidate>' +
      '<div class="summary" style="grid-template-columns:1fr"><div><span>' + I('mail', 14) + 'Correo</span><b>' + esc(L.correo) + '</b></div></div>' +
      '<div class="field"><label for="l-co">Código de 6 dígitos</label><input id="l-co" class="code-in" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*"></div>' +
      '<label class="check"><input id="l-re" type="checkbox" checked><span><b style="font-weight:600;color:var(--navy)">Recordar este equipo 30 días</b><br><span class="muted" style="font-size:13px">Desmárcalo en la tablet compartida: la sesión durará 6 horas y se cerrará al cerrar el navegador.</span></span></label>' +
      '<button class="btn pri" id="l-go" type="submit">Entrar</button>' +
      '<p id="l-st" class="muted" role="status" style="font-size:13px"></p>' +
      '<a href="#" id="l-back" style="font-size:13px;font-weight:500">Usar otro correo o pedir un código nuevo</a></form>', msg);
    var co = $('#l-co'); co.focus();
    co.oninput = function () { co.value = co.value.replace(/\D/g, '').slice(0, 6); };
    $('#l-back').onclick = function (e) { e.preventDefault(); showLogin(); };
    $('#l-f2').onsubmit = function (e) {
      e.preventDefault();
      if (!/^\d{6}$/.test(co.value)) { $('#l-st').innerHTML = '<span class="err">El código tiene 6 números.</span>'; return; }
      var recordar = $('#l-re').checked;
      $('#l-go').disabled = true; $('#l-st').textContent = 'Validando…';
      FH.call('auth.verifyCode', { correo: L.correo, codigo: co.value, recordar: recordar, dispositivo: navigator.userAgent.slice(0, 120) })
        .then(function (d) {
          FH.Session.set({ session: d.session, vence: d.vence, recordar: d.recordar });
          S.me = d.me;
          return loadCatalog();
        })
        .then(function () { if (!location.hash) location.hash = 'inicio'; render(); })
        .catch(function (err) {
          if (S.me) return showLogin(err.message);
          $('#l-go').disabled = false; $('#l-st').innerHTML = '<span class="err">' + esc(err.message) + '</span>'; co.value = ''; co.focus();
        });
    };
  }
  function logout() {
    FH.call('auth.logout').catch(function () {}).then(function () {
      FH.Session.clear(); S.me = null;
      showLogin('Cerraste sesión.');
    });
  }

  // ---------------- estructura: menú lateral + encabezado ----------------
  function render() {
    var allowed = S.me.pantallas;
    var hv = decodeURIComponent((location.hash || '#inicio').slice(1)).split('/');
    var v = hv[0], arg = hv.slice(1).join('/');
    if (allowed.indexOf(v) < 0) { v = 'inicio'; arg = ''; }
    if (v !== 'nueva' && S.wiz.done) S.wiz = newWiz();
    var nav = NAV.filter(function (n) { return allowed.indexOf(n[0]) >= 0; });
    var s = FH.Session.get() || {};
    var who = S.me.nombre || S.me.correo;
    var mini = pref('fh_nav') === 'mini';
    var item = function (n) { return '<a href="#' + n[0] + '" class="' + (v === n[0] ? 'on' : '') + '"' + (v === n[0] ? ' aria-current="page"' : '') + ' title="' + n[1] + '">' + I(n[2], 20) + '<span>' + n[1] + '</span></a>'; };
    var main = nav.filter(function (n) { return n[0] !== 'configuracion'; }), admin = nav.filter(function (n) { return n[0] === 'configuracion'; });
    root('<div class="app' + (mini ? ' mini' : '') + '" id="app"><aside class="side" aria-label="Navegación principal">' +
      '<div class="brand">' + brandMark() + '<div class="txt"><b>FoodHub</b><small>Evaluación de comedor</small></div></div>' +
      '<nav class="nav"><div class="sec-t">Operación</div>' + main.map(item).join('') + (admin.length ? '<div class="sec-t">Administración</div>' + admin.map(item).join('') : '') + '</nav>' +
      '<div class="side-foot"><button class="collapse" id="nav-toggle" type="button" aria-label="' + (mini ? 'Expandir menú' : 'Contraer menú') + '">' + I(mini ? 'panel-left-open' : 'panel-left-close', 20) + '<span>' + (mini ? 'Expandir menú' : 'Contraer menú') + '</span></button>' +
      '<div class="me"><span class="avatar" aria-hidden="true">' + esc(initials(who)) + '</span><div class="who"><b>' + esc(who) + '</b><span>' + esc(S.me.rol_nombre) + '</span></div>' +
      '<a href="#" id="logout" class="iconbtn" title="Cerrar sesión" aria-label="Cerrar sesión">' + I('log-out', 18) + '</a></div></div></aside>' +
      '<div class="scrim" id="scrim"></div>' +
      '<div class="main"><header class="top"><button class="iconbtn menu-btn" id="menu-btn" type="button" aria-label="Abrir menú">' + I('menu', 22) + '</button>' +
      '<div class="title"><span class="crumb">FoodHub</span><b>' + esc(navItem(v)[1]) + '</b></div><div class="tools">' + plantPicker() +
      '<div class="profile"><button type="button" id="prof-btn" aria-haspopup="true" aria-expanded="false"><span class="avatar">' + esc(initials(who)) + '</span><span class="pname"><b>' + esc(who) + '</b><span>' + esc(S.me.rol_nombre) + '</span></span>' + I('chevron-down', 16) + '</button>' +
      '<div class="pop" id="prof-pop" hidden><div class="phead"><span class="avatar">' + esc(initials(who)) + '</span><div><b>' + esc(who) + '</b><span>' + esc(S.me.correo) + '</span></div></div>' +
      '<dl><dt>Rol</dt><dd>' + esc(S.me.rol_nombre) + '</dd><dt>Plantas</dt><dd>' + esc(plantsLabel()) + '</dd><dt>Sesión</dt><dd>' + (s.recordar ? 'Equipo recordado 30 días' : '6 horas') + '</dd></dl>' +
      '<button class="item dan" id="logout2" type="button">' + I('log-out', 18) + 'Cerrar sesión</button></div></div></div></header>' +
      '<main class="content" id="view"></main></div></div>');
    $('#logout').onclick = function (e) { e.preventDefault(); logout(); };
    $('#logout2').onclick = logout;
    $('#nav-toggle').onclick = function () { pref('fh_nav', mini ? 'full' : 'mini'); render(); };
    $('#menu-btn').onclick = function () { $('#app').classList.add('open'); };
    $('#scrim').onclick = function () { $('#app').classList.remove('open'); };
    var pb = $('#prof-btn'), pp = $('#prof-pop');
    pb.onclick = function (e) { e.stopPropagation(); pp.hidden = !pp.hidden; pb.setAttribute('aria-expanded', String(!pp.hidden)); };
    document.onclick = function (e) { if (!pp.hidden && !pp.contains(e.target)) { pp.hidden = true; pb.setAttribute('aria-expanded', 'false'); } };
    document.onkeydown = function (e) { if (e.key === 'Escape') { pp.hidden = true; $('#app') && $('#app').classList.remove('open'); } };
    var ps = $('#plant-sel'); if (ps) ps.onchange = function () { S.plant = ps.value; S.wiz.pl = ps.value || S.wiz.pl; render(); };
    (VIEWS[v] || VIEWS.inicio)(v, arg);
    window.scrollTo(0, 0);
  }
  function plantPicker() {
    var ps = S.cat.plantas;
    if (ps.length <= 1) return ps.length ? '<span class="plant-one">' + I('map-pin', 16) + '<span>' + esc(ps[0].nombre) + '</span></span>' : '';
    return '<label class="plant-sel" title="Planta">' + I('map-pin', 16) + '<span class="sr">Planta</span><select id="plant-sel"><option value="">Todas las plantas</option>' +
      ps.map(function (p) { return '<option value="' + esc(p.planta_id) + '"' + (S.plant === p.planta_id ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') + '</select></label>';
  }
  function plantsLabel() {
    if (S.me.plantas === '*') return 'Todas';
    return S.cat.plantas.map(function (p) { return p.nombre; }).join(', ');
  }
  function view(html) { $('#view').innerHTML = html; }
  function head(t, sub, right) { return '<div class="head"><div><h1>' + t + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (right || '') + '</div>'; }
  function soon(id) {
    var n = navItem(id);
    view(head(n[1]) + '<div class="empty"><span class="e-ic">' + I(n[2], 26) + '</span><h2>Módulo en preparación</h2><p>' + esc(n[3]) + '</p>' +
      '<a class="btn" href="#inicio" style="margin-top:6px">' + I('arrow-left', 18) + 'Volver al inicio</a></div>');
  }

  // ---------------- vistas ----------------
  var VIEWS = {
    inicio: viewInicio,
    nueva: viewNueva,
    seguimiento: viewSeguimiento,
    auditoria: soon, calendario: soon, evaluacion: soon, reportes: soon,
    configuracion: viewConfig
  };

  // ---------------- utilidades de catálogo ----------------
  function can(p) { return S.me.permisos.indexOf('*') >= 0 || S.me.permisos.indexOf(p) >= 0; }
  function byId(list, key, id) { return (S.cat[list] || []).filter(function (x) { return x[key] === id; })[0]; }
  function tipoOf(id) { return byId('tipos', 'tipo_id', id) || { nombre: id, campos_especificos: '' }; }
  function catOf(id) { return byId('categorias', 'categoria_id', id) || { nombre: id }; }
  function srvOf(id) { return byId('servicios', 'servicio_id', id) || {}; }
  function puestoName(id) { var p = byId('puestos', 'puesto_id', id); return p ? p.nombre : id; }
  function turnoLabel(t) { return t ? t.inicio + '–' + t.fin + ' · ' + t.dias : '—'; }
  var ESTADO = { Registrada: ['p-reg', 'Registrada'], Cerrada: ['p-cer', 'Cerrada'], Cancelada: ['p-neu', 'Cancelada'] };
  function pill(estado) { var e = ESTADO[estado] || ['p-neu', estado]; return '<span class="pill ' + e[0] + '">' + esc(e[1]) + '</span>'; }
  function critBadge() { return '<span class="badge crit">' + I('flame', 12) + 'Crítica</span>'; }
  var TZ = 'America/Chihuahua';   // hora de planta, la misma que usa el servidor
  function nowLocal() {
    var p = {};
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return p.year + '-' + p.month + '-' + p.day + 'T' + p.hour + ':' + p.minute;
    } catch (e) { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
  }
  function fmtDate(v, noTime) {
    if (!v) return '—';
    var d = new Date(String(v).length === 16 ? v : v);
    if (isNaN(d)) return v;
    var o = { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ };
    if (!noTime) { o.hour = '2-digit'; o.minute = '2-digit'; }
    return d.toLocaleString('es-MX', o);
  }
  function fmtDay(ymd) { if (!ymd) return '—'; var p = ymd.split('-'); return +p[2] + ' ' + MES[p[1] - 1] + ' ' + p[0]; }
  function mins(h) { var m = /^(\d{1,2}):(\d{2})/.exec(h || ''); return m ? +m[1] * 60 + +m[2] : null; }

  // Mismas reglas que el servidor: días del catálogo y día operativo (madrugada = día anterior).
  var DIAS = { l: 1, lun: 1, m: 2, mar: 2, x: 3, mi: 3, 'mié': 3, mie: 3, j: 4, jue: 4, v: 5, vie: 5, s: 6, 'sáb': 6, sab: 6, d: 0, dom: 0 };
  function parseDias(txt) {
    var out = {}, any = false;
    String(txt || '').toLowerCase().replace(/\(.*?\)/g, '').split(/[,y\/]+/).forEach(function (part) {
      part = part.trim(); if (!part) return;
      var r = part.split(/\s*-\s*/);
      if (r.length === 2 && DIAS[r[0]] !== undefined && DIAS[r[1]] !== undefined) {
        for (var i = 0; i < 7; i++) { var d = (DIAS[r[0]] + i) % 7; out[d] = any = true; if (d === DIAS[r[1]]) break; }
      } else if (DIAS[part] !== undefined) { out[DIAS[part]] = any = true; }
    });
    return any ? out : null;
  }
  function diasOk(txt, dow) { var d = parseDias(txt); return !d || !!d[dow]; }
  function inWindow(t, a, b) { if (a === null || b === null) return false; return a <= b ? t >= a && t <= b : t >= a || t <= b; }
  function dowOf(local, back) { var p = local.slice(0, 10).split('-'); return new Date(+p[0], p[1] - 1, +p[2] - (back || 0)).getDay(); }
  /** Servicio que corresponde a la hora de detección (de inicio a "clasificar hasta"). */
  function suggestService(plantaId, local) {
    if (!local) return null;
    var t = mins(local.slice(11, 16)), best = null;
    S.cat.servicios.forEach(function (s) {
      if (s.planta_id !== plantaId || !inWindow(t, mins(s.inicio), mins(s.clasificar_hasta || s.fin))) return;
      var ok = (t < 360 && diasOk(s.dias_operacion, dowOf(local, 1))) || diasOk(s.dias_operacion, dowOf(local));
      if (ok && (!best || mins(s.inicio) > mins(best.inicio))) best = s;
    });
    return best;
  }
  function suggestTurno(plantaId, local) {
    if (!local) return null;
    var t = mins(local.slice(11, 16));
    return S.cat.turnosConcesionario.filter(function (x) {
      return x.planta_id === plantaId && inWindow(t, mins(x.inicio), mins(x.fin) - 1) && (diasOk(x.dias, dowOf(local)) || (t < 360 && diasOk(x.dias, dowOf(local, 1))));
    })[0] || null;
  }
  function staffFor(plantaId, turnoId) {
    return S.cat.plantilla.filter(function (r) { return r.planta_id === plantaId && r.turno_conc_id === turnoId && Number(r.cantidad) > 0; });
  }

  // ---------------- campos por tipo ----------------
  /** ctx: { pl, srv, det }. Devuelve el HTML de los campos específicos con los valores de d. */
  function fieldsHtml(tipoId, d, ctx, errs) {
    var defs = (S.cat.campos || {})[tipoId] || [];
    var srv = srvOf(ctx.srv);
    errs = errs || {};
    return defs.map(function (f) {
      if (f.si && d[f.si[0]] !== f.si[1]) return '';
      var id = 'f-' + f.k, v = d[f.k] == null ? '' : d[f.k], ctl;
      var req = f.req ? '<span class="req">*</span>' : '';
      if (f.t === 'auto' || f.t === 'calc') {
        ctl = '<input id="' + id + '" readonly tabindex="-1" value="' + esc(calcValue(tipoId, f.k, d, ctx, srv)) + '">';
        return '<div class="field"><label for="' + id + '">' + esc(f.l) + '</label>' + ctl + '<span class="hint">' + (f.t === 'auto' ? 'Del catálogo de horarios.' : 'Se calcula solo.') + '</span></div>';
      }
      if (f.t === 'num') ctl = '<input id="' + id + '" data-k="' + f.k + '" type="number" min="0" step="1" inputmode="numeric" value="' + esc(v) + '">';
      else if (f.t === 'time') ctl = '<input id="' + id + '" data-k="' + f.k + '" type="time" value="' + esc(v) + '">';
      else if (f.t === 'datetime') ctl = '<input id="' + id + '" data-k="' + f.k + '" type="datetime-local" value="' + esc(v) + '" max="' + nowLocal() + '">';
      else if (f.t === 'bool') {
        return '<div class="field' + (errs[f.k] ? ' invalid' : '') + '"><span class="lbl" id="' + id + '-l">' + esc(f.l) + req + '</span><div class="seg" role="radiogroup" aria-labelledby="' + id + '-l">' +
          ['Sí', 'No'].map(function (o) { return '<label><input type="radio" name="' + id + '" data-k="' + f.k + '" value="' + o + '"' + (v === o ? ' checked' : '') + '><span>' + o + '</span></label>'; }).join('') + '</div>' + ferr(errs[f.k]) + '</div>';
      } else if (f.t === 'select' || f.t === 'turno' || f.t === 'puesto') {
        var opts;
        if (f.t === 'select') opts = f.o.map(function (o) { return [o, o]; });
        if (f.t === 'turno') opts = S.cat.turnosConcesionario.filter(function (t) { return t.planta_id === ctx.pl; }).map(function (t) { return [t.turno_conc_id, turnoLabel(t)]; });
        if (f.t === 'puesto') opts = staffFor(ctx.pl, d.turno_conc_id).map(function (r) { return [r.puesto_id, puestoName(r.puesto_id) + ' · plantilla ' + r.cantidad]; });
        ctl = '<select id="' + id + '" data-k="' + f.k + '"><option value="">' + (f.t === 'puesto' && !d.turno_conc_id ? 'Elige primero el turno' : 'Elige una opción') + '</option>' +
          opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
      } else ctl = '<input id="' + id + '" data-k="' + f.k + '" type="text" maxlength="500" value="' + esc(v) + '">';
      var hint = f.h || (f.t === 'turno' ? 'Propuesto según la hora de detección.' : '');
      return '<div class="field' + (errs[f.k] ? ' invalid' : '') + '"><label for="' + id + '">' + esc(f.l) + req + '</label>' + ctl + (errs[f.k] ? ferr(errs[f.k]) : (hint ? '<span class="hint">' + esc(hint) + '</span>' : '')) + '</div>';
    }).join('');
  }
  function ferr(m) { return m ? '<span class="ferr">' + I('circle-alert', 14) + esc(m) + '</span>' : ''; }
  function calcValue(tipoId, k, d, ctx, srv) {
    if (k === 'hora_programada') return srv.inicio || '';
    if (k === 'hora_cierre_programada') return srv.fin || '';
    if (k === 'minutos_retraso') {
      var a = mins(srv.inicio), b = mins(d.hora_real_inicio); if (a === null || b === null) return '';
      var x = ((b - a) % 1440 + 1440) % 1440; return x > 720 ? 'Antes de la hora programada' : x + ' min';
    }
    if (k === 'requerido' || k === 'faltantes') {
      var r = staffFor(ctx.pl, d.turno_conc_id).filter(function (x) { return x.puesto_id === d.puesto_id; })
        .reduce(function (s, x) { return s + Number(x.cantidad); }, 0);
      if (!d.puesto_id) return '';
      if (k === 'requerido') return r;
      return d.presentes === '' || d.presentes == null ? '' : Math.max(r - Number(d.presentes), 0);
    }
    return '';
  }
  /** Lee los campos del contenedor en d. Devuelve true si cambió algo que redibuja el formulario. */
  function readFields(box, d) {
    var structural = false;
    box.querySelectorAll('[data-k]').forEach(function (el) {
      if (el.type === 'radio' && !el.checked) return;
      var k = el.dataset.k, v = el.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value;
      if (d[k] !== v && (k === 'turno_conc_id' || el.type === 'radio')) structural = true;
      d[k] = v;
    });
    return structural;
  }
  /** Revisión en el navegador de los obligatorios (el servidor vuelve a validar todo). */
  function missingFields(tipoId, d) {
    var errs = {};
    ((S.cat.campos || {})[tipoId] || []).forEach(function (f) {
      if (!f.req || f.t === 'auto' || f.t === 'calc' || (f.si && d[f.si[0]] !== f.si[1])) return;
      if (d[f.k] === '' || d[f.k] == null) errs[f.k] = 'Este dato es obligatorio.';
    });
    return errs;
  }
  function bindFields(box, d, ctx, redraw) {
    var upd = function () {
      if (readFields(box, d)) return redraw();
      var srv = srvOf(ctx.srv);
      box.querySelectorAll('input[readonly][id^="f-"]').forEach(function (el) { el.value = calcValue(ctx.tipo, el.id.slice(2), d, ctx, srv); });
    };
    box.addEventListener('input', upd);
    box.addEventListener('change', upd);
  }
  function comLabel(tipoId) {
    var o = (S.cat.comensalesObligatorios || {})[tipoId];
    return o && o !== 'calc' ? o : 'Comensales afectados (estimado)';
  }

  // ---------------- imágenes: reducir a 1600 px JPG en el navegador ----------------
  var MAX_SIDE = 1600, MAX_FILES = 5, MAX_PDF = 5 * 1024 * 1024;
  function readAsBase64(blob) {
    return new Promise(function (ok, bad) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).split(',')[1]); };
      r.onerror = function () { bad(new Error('No se pudo leer el archivo.')); };
      r.readAsDataURL(blob);
    });
  }
  function prepareFile(file) {
    if (file.type === 'application/pdf') {
      if (file.size > MAX_PDF) return Promise.reject(new Error(file.name + ': el PDF pasa de 5 MB.'));
      return readAsBase64(file).then(function (b64) { return { nombre: file.name, tipo: 'application/pdf', data: b64, bytes: file.size }; });
    }
    if (!/^image\/(jpeg|png)$/.test(file.type)) return Promise.reject(new Error(file.name + ': solo fotos JPG o PNG y documentos PDF.'));
    return new Promise(function (ok, bad) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (!b) return bad(new Error(file.name + ': no se pudo procesar la foto.'));
          readAsBase64(b).then(function (b64) {
            ok({ nombre: file.name.replace(/\.(png|jpe?g)$/i, '') + '.jpg', tipo: 'image/jpeg', data: b64, bytes: b.size, preview: URL.createObjectURL(b) });
          }, bad);
        }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); bad(new Error(file.name + ': no se pudo abrir la foto.')); };
      img.src = url;
    });
  }
  function fmtBytes(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function filePickers(idp) {
    var touch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    return '<div class="row">' + (touch ? '<label class="btn">' + I('camera', 18) + 'Tomar foto<input type="file" id="' + idp + '-cam" accept="image/*" capture="environment" class="sr"></label>' : '') +
      '<label class="btn">' + I('paperclip', 18) + 'Elegir archivos<input type="file" id="' + idp + '-file" accept="image/jpeg,image/png,application/pdf" multiple class="sr"></label></div>';
  }
  function bindPickers(idp, onFiles) {
    [idp + '-cam', idp + '-file'].forEach(function (i) {
      var el = document.getElementById(i);
      if (el) el.onchange = function () { var fs = Array.prototype.slice.call(el.files); el.value = ''; onFiles(fs); };
    });
  }

  // ---------------- Inicio ----------------
  function viewInicio() {
    var canNew = S.me.pantallas.indexOf('nueva') >= 0;
    var k = function (id, ic, tone, label, sub) {
      return '<div class="card kpi"><div class="k-top"><span class="l">' + label + '</span><span class="k-ic ' + tone + '">' + I(ic, 18) + '</span></div>' +
        '<span class="v" id="' + id + '"><span class="skel" style="display:inline-block;width:48px;height:28px"></span></span><span class="s">' + sub + '</span></div>';
    };
    view(head('Hola, ' + esc((S.me.nombre || S.me.correo).split(' ')[0]), 'Resumen del servicio de comedor · ' + esc(S.plant ? plantName(S.plant) : 'todas tus plantas'),
      canNew ? '<a class="btn pri" href="#nueva">' + I('circle-plus', 18) + 'Nueva incidencia</a>' : '') +
      '<div class="grid g4">' +
      k('k-ab', 'inbox', 'blue', 'Incidencias abiertas', 'Registradas, sin cerrar') +
      k('k-cr', 'flame', 'bad', 'Críticas abiertas', 'Comensales sin comida o malestar') +
      k('k-me', 'calendar-days', 'warn', 'Registradas este mes', 'Por fecha de detección') +
      k('k-ce', 'circle-check', 'ok', 'Cerradas este mes', 'Con nota de cierre') + '</div>' +
      '<div class="grid g2"><div class="card"><div class="card-h"><div><h2>' + I('trending-up', 18) + 'Incidencias por mes</h2><p>Últimos 6 meses, por fecha de detección</p></div></div><div id="trend"><div class="loading">Cargando…</div></div></div>' +
      '<div class="card"><div class="card-h"><div><h2>' + I('badge-check', 18) + 'Cumplimiento del proveedor</h2><p>Resultado de auditorías e indicadores</p></div></div>' +
      '<div class="empty sm"><span class="e-ic">' + I('clipboard-check', 22) + '</span><b style="color:var(--navy)">Sin auditorías finalizadas</b><p style="font-size:13px">El cumplimiento se calcula con las auditorías mensuales y los indicadores aprobados.</p></div></div></div>' +
      '<div class="card"><div class="card-h"><div><h2>' + I('list', 18) + 'Incidencias recientes</h2><p>Las últimas registradas en tus plantas</p></div>' +
      (S.me.pantallas.indexOf('seguimiento') >= 0 ? '<a class="btn sm" href="#seguimiento">Ver todas' + I('arrow-right', 16) + '</a>' : '') + '</div>' +
      '<div class="tablewrap" id="recent"><div class="loading">Cargando…</div></div></div>');
    FH.call('inc.summary', { planta_id: S.plant || '' }).then(function (d) {
      if (!$('#k-ab')) return;
      $('#k-ab').textContent = d.abiertas; $('#k-cr').textContent = d.criticas_abiertas;
      $('#k-me').textContent = d.registradas_mes; $('#k-ce').textContent = d.cerradas_mes;
      $('#trend').innerHTML = trendChart(d);
      $('#recent').innerHTML = incTable(d.recientes, true);
      bindRows();
    }).catch(function (e) {
      ['#k-ab', '#k-cr', '#k-me', '#k-ce'].forEach(function (s) { if ($(s)) $(s).textContent = '—'; });
      if ($('#trend')) $('#trend').innerHTML = '<p class="err">' + esc(e.message) + '</p>';
      if ($('#recent')) $('#recent').innerHTML = '';
    });
  }
  var MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function trendChart(d) {
    var tot = d.meses.map(function (m) { var o = d.por_mes[m] || {}; return Object.keys(o).reduce(function (s, k) { return s + o[k]; }, 0); });
    var max = Math.max.apply(null, tot);
    if (!max) return '<div class="chart-ph" aria-hidden="true"><i style="height:30%"></i><i style="height:45%"></i><i style="height:38%"></i><i style="height:55%"></i><i style="height:42%"></i><i style="height:50%"></i>' +
      '<div class="ov"><span>La gráfica aparecerá cuando haya incidencias registradas.</span></div></div>';
    return '<div class="bars" role="img" aria-label="Incidencias por mes">' + d.meses.map(function (m, i) {
      var o = d.por_mes[m] || {};
      var tip = MES[+m.slice(5) - 1] + ' ' + m.slice(0, 4) + ': ' + tot[i] + (tot[i] === 1 ? ' incidencia' : ' incidencias') +
        Object.keys(o).map(function (k) { return '\n· ' + catOf(k).nombre + ': ' + o[k]; }).join('');
      return '<div class="bar" title="' + esc(tip) + '" tabindex="0" aria-label="' + esc(tip.replace(/\n/g, ' ')) + '"><span class="bv">' + tot[i] + '</span>' +
        '<i style="height:' + Math.max(tot[i] ? 4 : 0, Math.round(tot[i] / max * 100)) + '%"></i><span class="bl">' + MES[+m.slice(5) - 1] + '</span></div>';
    }).join('') + '</div>';
  }

  /** Tabla de incidencias (Inicio y Seguimiento). */
  function incTable(rows, compact) {
    var h = compact ? ['Folio', 'Planta', 'Tipo', 'Detección', 'Estado'] : ['Folio', 'Planta', 'Detección', 'Servicio', 'Tipo', 'Comensales', 'Reporta', 'Estado'];
    return '<table class="inc"><thead><tr>' + h.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.map(function (r) {
        var t = tipoOf(r.tipo_id), s = srvOf(r.servicio_id);
        var tipo = esc(t.nombre) + (r.critica ? ' ' + critBadge() : '');
        var folio = '<a href="#seguimiento/' + encodeURIComponent(r.folio) + '" class="folio">' + esc(r.folio) + '</a>';
        var cells = compact ? [folio, esc(plantName(r.planta_id)), tipo, esc(fmtDate(r.detectada)), pill(r.estado)]
          : [folio, esc(plantName(r.planta_id)), esc(fmtDate(r.detectada)), esc(s.servicio ? s.servicio + ' ' + s.inicio : '—'), tipo, esc(r.comensales_afectados || '—'), esc(r.reporta || '—'), pill(r.estado)];
        return '<tr data-folio="' + esc(r.folio) + '">' + cells.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + h.length + '" class="empty-row">' + (compact ? 'Aún no hay incidencias registradas.' : 'No hay incidencias con estos filtros.') + '</td></tr>') + '</tbody></table>';
  }
  function bindRows() {
    $$('tr[data-folio]').forEach(function (tr) { tr.onclick = function (e) { if (e.target.closest('a')) return; location.hash = 'seguimiento/' + encodeURIComponent(tr.dataset.folio); }; });
  }

  // ---------------- Nueva incidencia ----------------
  function newWiz() { return { step: 1, datos: {}, files: [] }; }
  function viewNueva() {
    var w = S.wiz, c = S.cat;
    if (w.done) return viewNuevaDone();
    if (!w.datos) { w.datos = {}; w.files = []; }
    if (!w.pl || !c.plantas.some(function (p) { return p.planta_id === w.pl; })) w.pl = S.plant || (c.plantas[0] && c.plantas[0].planta_id);
    if (!w.det) w.det = nowLocal();
    var srvs = c.servicios.filter(function (s) { return s.planta_id === w.pl; });
    var sug = suggestService(w.pl, w.det);
    if (!w.srvManual) w.srv = sug ? sug.servicio_id : '';
    if (w.srv && !srvs.some(function (s) { return s.servicio_id === w.srv; })) w.srv = '';
    var srv = srvOf(w.srv);
    var tipo = c.tipos.filter(function (x) { return x.tipo_id === w.tipo; })[0];
    var cat = c.categorias.filter(function (x) { return x.categoria_id === w.cat; })[0];
    var steps = [['Paso 1', 'Dónde y cuándo'], ['Paso 2', 'Qué pasó'], ['Paso 3', 'Detalle y evidencia']];
    var body = '';
    if (w.step === 1) {
      var srvHint = w.srvManual ? 'Elegido por ti.' : (sug ? 'Propuesto según la hora de detección. Puedes cambiarlo.' : 'La hora no cae en ningún horario de servicio: elige el servicio afectado.');
      body = '<div class="card-h"><div><h2>Dónde y cuándo</h2><p>Comedor donde ocurrió, servicio afectado y momento de la detección.</p></div></div>' +
        '<div class="form"><div class="field"><label for="n-pl">Planta (comedor)<span class="req">*</span></label><div class="ctl">' + I('map-pin', 18) + '<select id="n-pl">' +
        c.plantas.map(function (p) { return '<option value="' + esc(p.planta_id) + '"' + (p.planta_id === w.pl ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') +
        '</select></div><span class="hint">En fin de semana, registra en el comedor donde se dio el servicio.</span></div>' +
        '<div class="field' + (w.e1 && !w.det ? ' invalid' : '') + '"><label for="n-det">Fecha y hora de detección<span class="req">*</span></label><div class="ctl">' + I('clock', 18) + '<input id="n-det" type="datetime-local" value="' + esc(w.det) + '" max="' + nowLocal() + '"></div>' +
        (w.e1 && !w.det ? ferr('Indica cuándo se detectó.') : '<span class="hint">Por omisión, ahora. Puedes ajustarla hacia atrás.</span>') + '</div>' +
        '<div class="field wide' + (w.e1 && !w.srv ? ' invalid' : '') + '"><label for="n-srv">Servicio<span class="req">*</span></label><div class="ctl">' + I('utensils', 18) + '<select id="n-srv"><option value="">Elige el servicio</option>' +
        srvs.map(function (s) { return '<option value="' + esc(s.servicio_id) + '"' + (s.servicio_id === w.srv ? ' selected' : '') + '>' + esc(s.servicio + ' · ' + s.inicio + '–' + s.fin + ' · ' + s.turno_esquema + ' · ' + s.dias_operacion) + '</option>'; }).join('') +
        '</select></div>' + (w.e1 && !w.srv ? ferr('Elige el servicio afectado.') : '<span class="hint">' + srvHint + '</span>') + '</div>' +
        '<div class="field"><label for="n-tu">Turno</label><input id="n-tu" readonly value="' + esc(srv.turno_esquema || '—') + '"><span class="hint">Se toma del servicio.</span></div>' +
        '<div class="field"><label for="n-rep">Reporta</label><input id="n-rep" readonly value="' + esc(S.me.nombre || S.me.correo) + '"></div></div>';
    } else if (w.step === 2) {
      body = '<div class="sub-h"><div><h2>Categoría</h2><p class="muted" style="font-size:13px;margin-top:2px">Elige el área del incumplimiento.</p></div></div><div class="chips" role="radiogroup" aria-label="Categoría">' + c.categorias.map(function (k) {
        var n = c.tipos.filter(function (t) { return t.categoria_id === k.categoria_id; }).length;
        return '<button type="button" role="radio" aria-checked="' + (w.cat === k.categoria_id) + '" class="chip' + (w.cat === k.categoria_id ? ' on' : '') + '" data-cat="' + esc(k.categoria_id) + '"><span class="c-ic">' + I(CAT_ICON[k.categoria_id] || 'circle-alert', 18) + '</span><span class="c-t"><b>' + esc(k.nombre) + '</b><small>' + n + (n === 1 ? ' tipo' : ' tipos') + '</small></span><span class="tick">' + I('check', 12) + '</span></button>';
      }).join('') + '</div>' + (w.cat ? '<div class="sub-h"><div><h2>Tipo de incumplimiento</h2><p class="muted" style="font-size:13px;margin-top:2px">' + esc(cat.nombre) + '</p></div></div><div class="chips" role="radiogroup" aria-label="Tipo de incumplimiento">' +
        c.tipos.filter(function (t) { return t.categoria_id === w.cat; }).map(function (t) {
          return '<button type="button" role="radio" aria-checked="' + (w.tipo === t.tipo_id) + '" class="chip tipo' + (w.tipo === t.tipo_id ? ' on' : '') + '" data-tipo="' + esc(t.tipo_id) + '"><span class="c-t"><b>' + esc(t.nombre) + '</b>' +
            (t.critico === 'Sí' ? '<span>' + critBadge() + '</span>' : '') + '</span><span class="tick">' + I('check', 12) + '</span></button>';
        }).join('') + '</div>' : '') + (w.e2 && !w.tipo ? '<p class="ferr" style="margin-top:12px;color:var(--bad);display:flex;gap:6px;align-items:center">' + I('circle-alert', 14) + 'Elige la categoría y el tipo para continuar.</p>' : '');
    } else {
      if (w.tipo === 'TIP-07' && !w.datos.turno_conc_id) { var tu = suggestTurno(w.pl, w.det); if (tu) w.datos.turno_conc_id = tu.turno_conc_id; }
      var errs = {};
      Object.keys(w.e3 || {}).forEach(function (k) {   // solo los que siguen vacíos
        var empty = k === 'descripcion' ? String(w.desc || '').trim().length < 5 : k === 'comensales' ? (w.com === '' || w.com == null) : (w.datos[k] === '' || w.datos[k] == null);
        if (empty) errs[k] = w.e3[k];
      });
      var calcCom = (S.cat.comensalesObligatorios || {})[w.tipo] === 'calc';
      var comReq = (S.cat.comensalesObligatorios || {})[w.tipo] && !calcCom;
      body = '<div class="card-h"><div><h2>Detalle y evidencia</h2><p>Describe lo que pasó y completa los datos de este tipo.</p></div>' + (tipo.critico === 'Sí' ? critBadge() : '') + '</div>' +
        '<div class="summary"><div><span>' + I('map-pin', 14) + 'Planta</span><b>' + esc(plantName(w.pl)) + '</b></div><div><span>' + I('utensils', 14) + 'Servicio</span><b>' + esc(srv.servicio ? srv.servicio + ' · ' + srv.inicio + '–' + srv.fin : '—') + '</b></div>' +
        '<div><span>' + I('clock', 14) + 'Detección</span><b>' + esc(fmtDate(w.det)) + '</b></div><div><span>' + I(CAT_ICON[w.cat] || 'circle-alert', 14) + 'Tipo</span><b>' + esc(tipo.nombre) + '</b></div></div>' +
        '<div class="sub-h"><h3>Información del incidente</h3></div><div class="form" id="n-fields">' +
        '<div class="field wide' + (errs.descripcion ? ' invalid' : '') + '"><label for="n-desc">Descripción de lo ocurrido<span class="req">*</span></label><textarea id="n-desc" rows="3" maxlength="2000" placeholder="Qué se observó, dónde y a quién afectó.">' + esc(w.desc || '') + '</textarea>' + ferr(errs.descripcion) + '</div>' +
        (calcCom ? '' : '<div class="field' + (errs.comensales ? ' invalid' : '') + '"><label for="n-com">' + esc(comLabel(w.tipo)) + (comReq ? '<span class="req">*</span>' : '') + '</label><input id="n-com" type="number" min="0" step="1" inputmode="numeric" value="' + esc(w.com == null ? '' : w.com) + '">' + ferr(errs.comensales) + '</div>') +
        fieldsHtml(w.tipo, w.datos, { pl: w.pl, srv: w.srv, det: w.det }, errs) + '</div>' +
        '<div class="sub-h"><h3>Evidencia</h3><span class="muted" style="font-size:12.5px">Opcional · hasta ' + MAX_FILES + ' archivos</span></div>' +
        '<div class="drop" id="n-drop">' + I('camera', 24) + '<b style="color:var(--fg-2)">Fotos JPG o PNG, o documentos PDF (hasta 5 MB)</b><span style="font-size:12.5px">Las fotos se reducen antes de enviarse. Puedes arrastrarlas aquí.</span>' + filePickers('n') + '</div>' +
        '<div id="n-files">' + filesList(w.files) + '</div>' +
        '<div id="n-st"></div>';
    }
    var last = w.step === 3;
    view(head('Nueva incidencia', 'Registra un incumplimiento solo cuando ocurre.') +
      '<div class="card"><ol class="stepper">' + steps.map(function (s, i) {
        var st = w.step === i + 1 ? 'on' : (w.step > i + 1 ? 'done' : '');
        return '<li class="' + st + '"' + (st === 'on' ? ' aria-current="step"' : '') + '><span class="dot">' + (st === 'done' ? I('check', 18) : (i + 1)) + '</span><span class="st-t"><span>' + s[0] + '</span><b>' + s[1] + '</b></span></li>';
      }).join('') + '</ol><p class="st-mob">Paso ' + w.step + ' de 3 · <b>' + steps[w.step - 1][1] + '</b></p></div>' +
      '<div class="card">' + body + '<div class="wiz-foot"><button class="btn" id="w-back" type="button"' + (w.step === 1 ? ' disabled' : '') + '>' + I('arrow-left', 18) + 'Atrás</button>' +
      '<span class="prog">Paso ' + w.step + ' de 3</span>' +
      (last ? '<button class="btn pri" id="w-next" type="button">' + I('check', 18) + 'Registrar incidencia</button>'
        : '<button class="btn pri" id="w-next" type="button">Continuar' + I('arrow-right', 18) + '</button>') + '</div></div>');
    var pl = $('#n-pl'); if (pl) pl.onchange = function (e) { w.pl = e.target.value; w.srvManual = false; w.datos = {}; viewNueva(); };
    var sv = $('#n-srv'); if (sv) sv.onchange = function (e) { w.srv = e.target.value; w.srvManual = !!w.srv; viewNueva(); };
    var dt = $('#n-det'); if (dt) dt.onchange = function (e) { w.det = e.target.value; w.datos.turno_conc_id = ''; viewNueva(); };
    $$('[data-cat]').forEach(function (b) { b.onclick = function () { if (w.cat !== b.dataset.cat) w.tipo = null; w.cat = b.dataset.cat; viewNueva(); }; });
    $$('[data-tipo]').forEach(function (b) { b.onclick = function () { if (w.tipo !== b.dataset.tipo) { w.datos = {}; w.e3 = null; } w.tipo = b.dataset.tipo; viewNueva(); }; });
    if (last) {
      var box = $('#n-fields');
      var keep = function () { w.desc = $('#n-desc').value; var cm = $('#n-com'); if (cm) w.com = cm.value; };
      var clearErr = function (e) {
        var fd = e.target.closest && e.target.closest('.field.invalid'); if (!fd) return;
        fd.classList.remove('invalid'); var fe = fd.querySelector('.ferr'); if (fe) fe.remove();
      };
      box.addEventListener('input', keep);
      box.addEventListener('input', clearErr);
      box.addEventListener('change', clearErr);
      bindFields(box, w.datos, { pl: w.pl, srv: w.srv, det: w.det, tipo: w.tipo }, function () { keep(); viewNueva(); });
      bindPickers('n', addFiles);
      var drop = $('#n-drop');
      drop.ondragover = function (e) { e.preventDefault(); drop.classList.add('over'); };
      drop.ondragleave = function () { drop.classList.remove('over'); };
      drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove('over'); addFiles(Array.prototype.slice.call(e.dataTransfer.files)); };
      bindFileList();
    }
    $('#w-back').onclick = function () { w.step--; viewNueva(); };
    $('#w-next').onclick = function () {
      if (w.step === 1) { w.e1 = true; if (!w.det || !w.srv) return viewNueva(); }
      if (w.step === 2) { w.e2 = true; if (!w.tipo) return viewNueva(); }
      if (w.step < 3) { w.step++; viewNueva(); window.scrollTo(0, 0); return; }
      submitIncident();
    };
  }
  function filesList(files) {
    if (!files.length) return '';
    return '<ul class="files">' + files.map(function (f, i) {
      return '<li class="' + (f.estado === 'error' ? 'bad' : '') + '">' + (f.preview ? '<img src="' + f.preview + '" alt="">' : '<span class="fi">' + I('file-text', 22) + '</span>') +
        '<div class="fmeta"><b>' + esc(f.nombre) + '</b><span>' + fmtBytes(f.bytes) + (f.estado === 'ok' ? ' · subida' : f.estado === 'error' ? ' · no se subió' : '') + '</span>' +
        '<label class="check sm"><input type="checkbox" data-int="' + i + '"' + (f.interna ? ' checked' : '') + (f.estado ? ' disabled' : '') + '><span>Interna (no la verá el concesionario)</span></label></div>' +
        (f.estado ? '' : '<button type="button" class="iconbtn" data-rm="' + i + '" aria-label="Quitar ' + esc(f.nombre) + '">' + I('x', 18) + '</button>') + '</li>';
    }).join('') + '</ul>';
  }
  function bindFileList() {
    var w = S.wiz;
    $$('[data-rm]').forEach(function (b) { b.onclick = function () { w.files.splice(+b.dataset.rm, 1); $('#n-files').innerHTML = filesList(w.files); bindFileList(); }; });
    $$('[data-int]').forEach(function (b) { b.onchange = function () { w.files[+b.dataset.int].interna = b.checked; }; });
  }
  function addFiles(list) {
    var w = S.wiz, st = $('#n-st');
    var room = MAX_FILES - w.files.length;
    if (list.length > room) { st.innerHTML = '<p class="err">' + I('circle-alert', 14) + ' Al registrar puedes adjuntar hasta ' + MAX_FILES + ' archivos; después puedes agregar más desde el detalle.</p>'; list = list.slice(0, Math.max(room, 0)); }
    else st.innerHTML = '';
    list.reduce(function (p, f) {
      return p.then(function () { return prepareFile(f); }).then(function (x) { w.files.push(x); }, function (e) { st.innerHTML += '<p class="err">' + esc(e.message) + '</p>'; });
    }, Promise.resolve()).then(function () { if ($('#n-files')) { $('#n-files').innerHTML = filesList(w.files); bindFileList(); } });
  }
  function submitIncident() {
    var w = S.wiz, errs = missingFields(w.tipo, w.datos);
    w.desc = $('#n-desc').value; var cm = $('#n-com'); if (cm) w.com = cm.value;
    if (String(w.desc).trim().length < 5) errs.descripcion = 'Describe brevemente lo que pasó.';
    var o = (S.cat.comensalesObligatorios || {})[w.tipo];
    if (o && o !== 'calc' && (w.com === '' || w.com == null)) errs.comensales = 'Este dato es obligatorio.';
    if (Object.keys(errs).length) { w.e3 = errs; viewNueva(); var f = $('.invalid input, .invalid select, .invalid textarea'); if (f) f.focus(); return; }
    w.e3 = null;
    var btn = $('#w-next'); btn.disabled = true; $('#w-back').disabled = true;
    btn.innerHTML = 'Guardando…';
    w.rid = w.rid || FH.uuid();   // el mismo identificador si se reintenta: no duplica el folio
    var p = w.folio ? Promise.resolve({ folio: w.folio }) : FH.call('inc.create', {
      planta_id: w.pl, servicio_id: w.srv, tipo_id: w.tipo, detectada: w.det, descripcion: w.desc,
      comensales_afectados: w.com === '' || w.com == null ? '' : Number(w.com), datos: w.datos
    }, { write: true, requestId: w.rid });
    p.then(function (r) {
      w.folio = r.folio;
      var pend = w.files.filter(function (f) { return f.estado !== 'ok'; });
      return pend.reduce(function (chain, f, i) {
        return chain.then(function () {
          btn.innerHTML = 'Subiendo archivo ' + (i + 1) + ' de ' + pend.length + '…';
          f.rid = f.rid || FH.uuid();
          return FH.call('inc.evidence.add', { folio: w.folio, nombre: f.nombre, data: f.data, interna: !!f.interna }, { write: true, requestId: f.rid })
            .then(function () { f.estado = 'ok'; }, function (e) { f.estado = 'error'; f.error = e.message; });
        });
      }, Promise.resolve());
    }).then(function () { w.done = true; viewNueva(); window.scrollTo(0, 0); })
      .catch(function (e) {
        if (e.code !== 'NETWORK') w.rid = null;
        btn.disabled = false; $('#w-back').disabled = false; btn.innerHTML = I('check', 18) + 'Registrar incidencia';
        $('#n-st').innerHTML = '<div class="alert" role="alert">' + I('circle-alert', 18) + '<span>' + esc(e.message) + '</span></div>';
      });
  }
  function viewNuevaDone() {
    var w = S.wiz, bad = w.files.filter(function (f) { return f.estado === 'error'; });
    view(head('Nueva incidencia', 'Registra un incumplimiento solo cuando ocurre.') +
      '<div class="card done-card"><span class="e-ic ok">' + I('circle-check', 30) + '</span><h2>Incidencia registrada</h2>' +
      '<p class="muted">Folio</p><p class="folio-big">' + esc(w.folio) + '</p>' +
      '<p class="muted">' + esc(tipoOf(w.tipo).nombre) + ' · ' + esc(plantName(w.pl)) + ' · ' + esc(fmtDate(w.det)) + '</p>' +
      (w.files.length && !bad.length ? '<p class="muted">' + w.files.length + (w.files.length === 1 ? ' archivo adjunto.' : ' archivos adjuntos.') + '</p>' : '') +
      (bad.length ? '<div class="note warn" style="text-align:left">' + I('triangle-alert', 18) + '<div><b>' + bad.length + (bad.length === 1 ? ' archivo no se subió' : ' archivos no se subieron') + '</b>Puedes agregarlos desde el detalle del folio. ' + esc(bad[0].error || '') + '</div></div>' : '') +
      '<div class="note" style="text-align:left">' + I('info', 18) + '<div><b>Aviso al concesionario</b>El concesionario todavía no recibe avisos desde FoodHub. Avísale por los medios de siempre.</div></div>' +
      '<div class="row" style="justify-content:center"><a class="btn pri" href="#seguimiento/' + encodeURIComponent(w.folio) + '">' + I('file-text', 18) + 'Ver detalle</a>' +
      '<button class="btn" id="n-again" type="button">' + I('circle-plus', 18) + 'Registrar otra</button></div></div>');
    $('#n-again').onclick = function () { var pl = w.pl; S.wiz = newWiz(); S.wiz.pl = pl; viewNueva(); };
  }

  // ---------------- Seguimiento ----------------
  function isoDay(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function viewSeguimiento(v, arg) {
    if (arg) return viewDetalle(arg);
    var f = S.seg = S.seg || { estado: '', cat: '', tipo: '', desde: isoDay(new Date(Date.now() - 90 * 864e5)), hasta: '', q: '', crit: false };
    var c = S.cat;
    var opt = function (val, label, cur) { return '<option value="' + esc(val) + '"' + (val === cur ? ' selected' : '') + '>' + esc(label) + '</option>'; };
    view(head('Seguimiento', 'Incidencias registradas en ' + esc(S.plant ? plantName(S.plant) : 'tus plantas'),
      '<div class="row">' + (S.me.pantallas.indexOf('nueva') >= 0 ? '<a class="btn" href="#nueva">' + I('circle-plus', 18) + 'Nueva</a>' : '') +
      '<button class="btn" id="s-csv" type="button">' + I('download', 18) + 'Exportar CSV</button></div>') +
      '<div class="card"><div class="filters">' +
      '<div class="field"><label for="s-q">Folio</label><div class="ctl">' + I('search', 18) + '<input id="s-q" type="search" placeholder="Buscar folio" value="' + esc(f.q) + '"></div></div>' +
      '<div class="field"><label for="s-es">Estado</label><select id="s-es">' + opt('', 'Todos', f.estado) + opt('Registrada', 'Registrada', f.estado) + opt('Cerrada', 'Cerrada', f.estado) + '</select></div>' +
      '<div class="field"><label for="s-ca">Categoría</label><select id="s-ca">' + opt('', 'Todas', f.cat) + c.categorias.map(function (k) { return opt(k.categoria_id, k.nombre, f.cat); }).join('') + '</select></div>' +
      '<div class="field"><label for="s-ti">Tipo</label><select id="s-ti">' + opt('', 'Todos', f.tipo) + c.tipos.filter(function (t) { return !f.cat || t.categoria_id === f.cat; }).map(function (t) { return opt(t.tipo_id, t.nombre, f.tipo); }).join('') + '</select></div>' +
      '<div class="field"><label for="s-de">Desde</label><input id="s-de" type="date" value="' + esc(f.desde) + '"></div>' +
      '<div class="field"><label for="s-ha">Hasta</label><input id="s-ha" type="date" value="' + esc(f.hasta) + '"></div>' +
      '<label class="check" style="align-self:end;padding-bottom:10px"><input id="s-cr" type="checkbox"' + (f.crit ? ' checked' : '') + '><span>Solo críticas</span></label>' +
      '</div></div>' +
      '<div class="card"><div class="card-h"><div><h2 id="s-count">Cargando…</h2></div></div><div class="tablewrap" id="s-tbl"><div class="loading">Cargando…</div></div></div>');
    var load = function () {
      FH.call('inc.list', { planta_id: S.plant || '', estado: f.estado, categoria_id: f.cat, tipo_id: f.tipo, desde: f.desde, hasta: f.hasta, critica: f.crit }).then(function (d) {
        S.segRows = d.rows;
        draw(d);
      }).catch(function (e) { if ($('#s-tbl')) $('#s-tbl').innerHTML = '<p class="err" style="padding:16px">' + esc(e.message) + '</p>'; });
    };
    var draw = function (d) {
      if (!$('#s-tbl')) return;
      var q = f.q.trim().toUpperCase();
      var rows = S.segRows.filter(function (r) { return !q || r.folio.toUpperCase().indexOf(q) >= 0; });
      $('#s-count').textContent = rows.length + (rows.length === 1 ? ' incidencia' : ' incidencias');
      $('#s-tbl').innerHTML = incTable(rows) + (d && d.truncado ? '<p class="muted" style="padding:12px 16px">Se muestran las ' + rows.length + ' más recientes de ' + d.total + '. Acota las fechas para ver el resto.</p>' : '');
      bindRows();
    };
    var on = function (id, key, reload, fn) { $(id).addEventListener(id === '#s-q' ? 'input' : 'change', function (e) { f[key] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; if (fn) fn(); if (reload) load(); else draw(); }); };
    on('#s-q', 'q', false);
    on('#s-es', 'estado', true);
    on('#s-ca', 'cat', false, function () { f.tipo = ''; viewSeguimiento(); });
    on('#s-ti', 'tipo', true);
    on('#s-de', 'desde', true);
    on('#s-ha', 'hasta', true);
    on('#s-cr', 'crit', true);
    $('#s-csv').onclick = exportCsv;
    if (!$('#s-ca').dataset.skip) load();
  }
  function exportCsv() {
    var q = (S.seg.q || '').trim().toUpperCase();
    var rows = (S.segRows || []).filter(function (r) { return !q || r.folio.toUpperCase().indexOf(q) >= 0; });
    var cell = function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    var lines = [['Folio', 'Planta', 'Día operativo', 'Detección', 'Registro', 'Servicio', 'Turno', 'Categoría', 'Tipo', 'Crítica', 'Comensales afectados', 'Reporta', 'Estado', 'Cierre']];
    rows.forEach(function (r) {
      var s = srvOf(r.servicio_id);
      lines.push([r.folio, plantName(r.planta_id), r.dia_operativo, String(r.detectada).slice(0, 16).replace('T', ' '), String(r.registrada).slice(0, 16).replace('T', ' '),
        s.servicio ? s.servicio + ' ' + s.inicio + '-' + s.fin : '', r.turno, catOf(r.categoria_id).nombre, tipoOf(r.tipo_id).nombre, r.critica ? 'Sí' : 'No',
        r.comensales_afectados, r.reporta, r.estado, String(r.cerrada || '').slice(0, 16).replace('T', ' ')]);
    });
    var csv = '﻿' + lines.map(function (l) { return l.map(cell).join(','); }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'FoodHub_incidencias_' + isoDay(new Date()) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  // ---------------- Detalle del folio ----------------
  var ACC = { registro: 'Registró la incidencia', nota: 'Nota', afectacion: 'Actualizó la afectación', reclasificar: 'Reclasificó', cierre: 'Cerró la incidencia',
    cancelacion: 'Canceló el registro', evidencia: 'Agregó evidencia', 'evidencia.retirada': 'Retiró evidencia' };
  var CAMPO = { faltantes: 'Faltantes', comensales_afectados: 'Comensales afectados', tipo_id: 'Tipo', estado: 'Estado' };
  function viewDetalle(folio) {
    view('<div class="loading">Cargando el folio…</div>');
    FH.call('inc.get', { folio: folio }).then(function (d) { S.det = d; drawDetalle(); })
      .catch(function (e) {
        view(head('Folio ' + esc(folio)) + '<div class="empty"><span class="e-ic">' + I('circle-alert', 26) + '</span><h2>No se pudo abrir el folio</h2><p>' + esc(e.message) + '</p>' +
          '<a class="btn" href="#seguimiento">' + I('arrow-left', 18) + 'Volver a Seguimiento</a></div>');
      });
  }
  function drawDetalle() {
    var d = S.det, t = tipoOf(d.tipo_id), s = srvOf(d.servicio_id), defs = (S.cat.campos || {})[d.tipo_id] || [];
    var dl = function (pairs) { return '<dl class="dl">' + pairs.map(function (p) { return '<dt>' + p[0] + '</dt><dd>' + p[1] + '</dd>'; }).join('') + '</dl>'; };
    var datos = defs.filter(function (f) { return d.datos[f.k] !== undefined && d.datos[f.k] !== ''; }).map(function (f) {
      var v = d.datos[f.k];
      if (f.t === 'turno') v = turnoLabel(byId('turnosConcesionario', 'turno_conc_id', v));
      if (f.t === 'puesto') v = puestoName(v);
      if (f.t === 'datetime') v = fmtDate(v);
      if (f.k === 'minutos_retraso') v = v + ' min';
      return [esc(f.l), esc(v)];
    });
    var acts = [
      ['afectacion', 'refresh-cw', 'Actualizar afectación'], ['nota', 'message-square', 'Agregar nota'], ['reclasificar', 'tags', 'Reclasificar'],
      ['cerrar', 'circle-check', 'Cerrar incidencia'], ['cancelar', 'ban', 'Cancelar registro']
    ].filter(function (a) { return d.puede[a[0]]; });
    var evs = d.evidencias;
    view('<a href="#seguimiento" class="back">' + I('arrow-left', 16) + 'Seguimiento</a>' +
      head(esc(d.folio) + ' ' + pill(d.estado) + (d.critica ? ' ' + critBadge() : ''), esc(t.nombre) + ' · ' + esc(plantName(d.planta_id)) + ' · detectada ' + esc(fmtDate(d.detectada))) +
      (d.estado === 'Cerrada' ? '<div class="note ok">' + I('circle-check', 18) + '<div><b>Cerrada ' + esc(fmtDate(d.cerrada)) + ' por ' + esc(d.cerrada_por || '—') + '</b>' + esc(d.nota_cierre) + '</div></div>' : '') +
      (d.estado === 'Cancelada' ? '<div class="note warn">' + I('ban', 18) + '<div><b>Registro cancelado</b>' + esc(d.motivo_cancelacion) + '</div></div>' : '') +
      '<div class="detail"><div class="col">' +
      '<div class="card"><div class="card-h"><div><h2>' + I('file-text', 18) + 'Reporte original</h2><p>' + I('lock', 13) + ' No se edita; los cambios quedan en la línea de tiempo.</p></div></div>' +
      dl([['Planta', esc(plantName(d.planta_id))], ['Servicio', esc(s.servicio ? s.servicio + ' · ' + s.inicio + '–' + s.fin : '—')], ['Turno', esc(d.turno || '—')],
        ['Detección', esc(fmtDate(d.detectada))], ['Día operativo', esc(fmtDay(d.dia_operativo))], ['Registro', esc(fmtDate(d.registrada)) + ' · ' + esc(d.reporta)],
        ['Categoría', esc(catOf(d.categoria_id).nombre)], ['Tipo', esc(t.nombre) + (d.tipo_original ? ' <span class="muted">(antes: ' + esc(tipoOf(d.tipo_original).nombre) + ')</span>' : '')],
        ['Comensales afectados', esc(d.comensales_afectados || '—')]]) +
      '<div class="sub-h"><h3>Descripción</h3></div><p class="pre">' + esc(d.descripcion) + '</p>' +
      (datos.length ? '<div class="sub-h"><h3>Datos del tipo</h3></div>' + dl(datos) : '') + '</div>' +
      (d.eventos.length ? '<div class="card"><div class="card-h"><div><h2>' + I('users', 18) + 'Afectación</h2><p>Cada cambio de faltantes abre un periodo nuevo.</p></div></div><div class="tablewrap"><table class="ev"><thead><tr><th>Desde</th><th>Hasta</th><th>Puesto</th><th>Faltantes</th></tr></thead><tbody>' +
        d.eventos.map(function (e) { return '<tr><td>' + esc(fmtDate(e.inicio)) + '</td><td>' + (e.fin ? esc(fmtDate(e.fin)) : '<span class="pill p-sol">Vigente</span>') + '</td><td>' + esc(puestoName(e.puesto_id)) + '</td><td>' + esc(e.faltantes) + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>' : '') +
      '<div class="card"><div class="card-h"><div><h2>' + I('image', 18) + 'Evidencia</h2><p>' + (evs.length ? evs.length + (evs.length === 1 ? ' archivo' : ' archivos') : 'Sin archivos') + '</p></div>' +
      (d.puede.evidencia ? filePickers('d') : '') + '</div><div id="d-st"></div>' +
      (evs.length ? '<ul class="thumbs">' + evs.map(function (e) {
        return '<li class="' + (e.retirada ? 'off' : '') + '"><div class="th" data-ev="' + esc(e.evidencia_id) + '">' + (e.tipo === 'application/pdf' ? I('file-text', 28) : '<span class="skel"></span>') + '</div>' +
          '<div class="fmeta"><b>' + esc(e.nombre) + '</b><span>' + esc(fmtDate(e.subida)) + ' · ' + esc(e.subida_por) + '</span>' +
          '<span>' + (e.retirada ? '<span class="badge neu">Retirada</span> ' + esc(e.motivo_retiro) : (e.visible_proveedor ? '<span class="badge neu">Visible para el concesionario</span>' : '<span class="badge neu">' + I('eye-off', 12) + 'Interna</span>')) + '</span>' +
          '<span class="row" style="gap:6px">' + (e.tipo === 'application/pdf' ? '<button class="btn sm" data-open="' + esc(e.evidencia_id) + '" type="button">' + I('download', 14) + 'Descargar</button>' : '') +
          (!e.retirada && d.estado !== 'Cancelada' && (e.propia || can('incidencia.cerrar')) ? '<button class="btn sm ghost" data-retire="' + esc(e.evidencia_id) + '" type="button">Retirar</button>' : '') + '</span></div></li>';
      }).join('') + '</ul>' : '<p class="muted" style="font-size:13px">' + (d.puede.evidencia ? 'Agrega fotos JPG o PNG, o documentos PDF.' : '') + '</p>') + '</div>' +
      '</div><div class="col">' +
      (acts.length ? '<div class="card"><div class="card-h"><div><h2>Acciones</h2></div></div><div class="acts">' + acts.map(function (a) {
        return '<button class="btn' + (a[0] === 'cancelar' ? ' ghost dan' : a[0] === 'cerrar' ? ' pri' : '') + '" data-act="' + a[0] + '" type="button">' + I(a[1], 18) + a[2] + '</button>';
      }).join('') + '</div></div>' : '') +
      (d.estado === 'Registrada' ? '<div class="note">' + I('info', 18) + '<div><b>Aviso al concesionario</b>El concesionario todavía no recibe avisos desde FoodHub. Avísale por los medios de siempre.</div></div>' : '') +
      '<div class="card"><div class="card-h"><div><h2>' + I('history', 18) + 'Línea de tiempo</h2></div></div><ol class="tl">' + d.historial.slice().reverse().map(function (h) {
        var what = ACC[h.accion] || h.accion, extra = '';
        if (h.accion === 'nota') extra = '<p class="pre">' + esc(h.despues) + '</p>';
        else if (h.accion === 'reclasificar' && h.campo === 'tipo_id') extra = '<p>' + esc(tipoOf(h.antes).nombre) + ' → <b>' + esc(tipoOf(h.despues).nombre) + '</b></p>';
        else if (h.accion === 'reclasificar') return '';
        else if (h.accion === 'evidencia' || h.accion === 'evidencia.retirada') extra = '<p>' + esc(h.campo) + (h.despues ? ' · ' + esc(h.despues) : '') + '</p>';
        else if (h.campo && h.accion !== 'cierre' && h.accion !== 'cancelacion') extra = '<p>' + esc(CAMPO[h.campo] || h.campo) + ': ' + esc(h.antes || '—') + ' → <b>' + esc(h.despues) + '</b></p>';
        return '<li><span class="tl-dot"></span><div><b>' + esc(what) + '</b><span class="muted"> · ' + esc(h.actor) + ' · ' + esc(fmtDate(h.fecha)) + '</span>' + extra + '</div></li>';
      }).join('') + '</ol></div></div></div>');
    $$('[data-act]').forEach(function (b) { b.onclick = function () { actionModal(b.dataset.act); }; });
    $$('[data-retire]').forEach(function (b) { b.onclick = function () { retireModal(b.dataset.retire); }; });
    $$('[data-open]').forEach(function (b) { b.onclick = function () { openEvidence(b.dataset.open, true); }; });
    if (d.puede.evidencia) bindPickers('d', uploadMore);
    loadThumbs();
  }
  var THUMBS = {};
  function b64Blob(b64, type) { var bin = atob(b64), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: type }); }
  function loadThumbs() {
    $$('.th[data-ev]').forEach(function (el) {
      var id = el.dataset.ev, e = S.det.evidencias.filter(function (x) { return x.evidencia_id === id; })[0];
      if (!e || e.tipo === 'application/pdf') return;
      var show = function (url) { el.innerHTML = '<button type="button" class="thb" aria-label="Ver ' + esc(e.nombre) + '"><img src="' + url + '" alt="' + esc(e.nombre) + '"></button>'; el.querySelector('button').onclick = function () { photoModal(url, e.nombre); }; };
      if (THUMBS[id]) return show(THUMBS[id]);
      FH.call('inc.evidence.get', { evidencia_id: id }).then(function (r) { THUMBS[id] = URL.createObjectURL(b64Blob(r.data, r.tipo)); show(THUMBS[id]); })
        .catch(function () { el.innerHTML = I('circle-alert', 22); el.title = 'No se pudo cargar'; });
    });
  }
  function openEvidence(id) {
    FH.call('inc.evidence.get', { evidencia_id: id }).then(function (r) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(b64Blob(r.data, r.tipo)); a.download = r.nombre;
      document.body.appendChild(a); a.click(); a.remove();
    }).catch(function (e) { toast(e.message); });
  }
  function photoModal(url, name) {
    var bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal photo" role="dialog" aria-label="' + esc(name) + '"><div class="row" style="justify-content:space-between"><b>' + esc(name) + '</b><button class="iconbtn" type="button" aria-label="Cerrar">' + I('x', 20) + '</button></div><img src="' + url + '" alt="' + esc(name) + '"></div>';
    document.body.appendChild(bg);
    var close = function () { bg.remove(); document.removeEventListener('keydown', esc_); };
    var esc_ = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc_);
    bg.onclick = function (e) { if (e.target === bg || e.target.closest('.iconbtn')) close(); };
  }
  function uploadMore(list) {
    var st = $('#d-st');
    st.innerHTML = '<p class="muted">Preparando…</p>';
    var n = 0, errs = [];
    list.reduce(function (p, f) {
      return p.then(function () { return prepareFile(f); }).then(function (x) {
        st.innerHTML = '<p class="muted">Subiendo ' + esc(x.nombre) + '…</p>';
        return FH.call('inc.evidence.add', { folio: S.det.folio, nombre: x.nombre, data: x.data, interna: false }, { write: true }).then(function () { n++; });
      }).catch(function (e) { errs.push(e.message); });
    }, Promise.resolve()).then(function () {
      if (n) toast(n === 1 ? 'Archivo agregado' : n + ' archivos agregados');
      viewDetalle(S.det.folio);
      if (errs.length) setTimeout(function () { if ($('#d-st')) $('#d-st').innerHTML = errs.map(function (m) { return '<p class="err">' + esc(m) + '</p>'; }).join(''); }, 600);
    });
  }

  /** Ventana para una acción. build() devuelve el HTML; collect() el payload o un mensaje de error. */
  function modal(title, html, okLabel, danger, onOk, onMount) {
    var bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = '<form class="modal" role="dialog" aria-modal="true" aria-labelledby="m-t" novalidate><h2 id="m-t">' + title + '</h2><div id="m-body" style="display:flex;flex-direction:column;gap:14px">' + html + '</div>' +
      '<p class="err" id="m-err" role="alert" style="margin:0"></p><div class="row" style="justify-content:flex-end"><button class="btn" type="button" id="m-x">Volver</button>' +
      '<button class="btn ' + (danger ? 'dan' : 'pri') + '" type="submit" id="m-ok">' + okLabel + '</button></div></form>';
    document.body.appendChild(bg);
    var close = function () { bg.remove(); document.removeEventListener('keydown', k); };
    var k = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', k);
    bg.querySelector('#m-x').onclick = close;
    var rid = FH.uuid();
    bg.querySelector('form').onsubmit = function (e) {
      e.preventDefault();
      var ok = bg.querySelector('#m-ok'); ok.disabled = true;
      bg.querySelector('#m-err').textContent = '';
      Promise.resolve().then(function () { return onOk(rid); }).then(function (msg) { close(); if (msg) toast(msg); if (msg !== null) viewDetalle(S.det.folio); }, function (err) {
        if (err.code !== 'NETWORK') rid = FH.uuid();
        ok.disabled = false;
        bg.querySelector('#m-err').innerHTML = esc(err.message) + (err.code === 'CONFLICT' ? ' <a href="#" id="m-reload">Recargar</a>' : '');
        var rl = bg.querySelector('#m-reload'); if (rl) rl.onclick = function (ev) { ev.preventDefault(); close(); viewDetalle(S.det.folio); };
      });
    };
    if (onMount) onMount(bg);
    var first = bg.querySelector('input:not([readonly]),select,textarea'); if (first) first.focus();
  }
  function textArea(id, label, ph, req) { return '<div class="field"><label for="' + id + '">' + label + (req ? '<span class="req">*</span>' : '') + '</label><textarea id="' + id + '" rows="3" maxlength="2000" placeholder="' + esc(ph || '') + '"></textarea></div>'; }
  function need(v, msg) { if (!String(v || '').trim()) throw { code: 'VALIDATION', message: msg }; return v; }
  function actionModal(acc) {
    var d = S.det, send = function (rid, extra) {
      return FH.call('inc.action', Object.assign({ folio: d.folio, accion: acc, version: d.version }, extra), { write: true, requestId: rid });
    };
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    if (acc === 'nota') return modal('Agregar nota', textArea('m-tx', 'Nota', 'Lo que observaste o se acordó.', true), 'Guardar nota', false,
      function (rid) { return send(rid, { texto: need(val('m-tx'), 'Escribe la nota.') }).then(function () { return 'Nota agregada'; }); });
    if (acc === 'cerrar') return modal('Cerrar incidencia', '<p class="muted">Cierra la incidencia cuando el problema quedó resuelto. La nota queda en la línea de tiempo.</p>' + textArea('m-tx', 'Nota de cierre', 'Cómo se resolvió.', true), 'Cerrar incidencia', false,
      function (rid) { return send(rid, { texto: need(val('m-tx'), 'Escribe la nota de cierre.') }).then(function () { return 'Incidencia cerrada'; }); });
    if (acc === 'cancelar') return modal('Cancelar registro', '<div class="note warn">' + I('triangle-alert', 18) + '<div><b>Solo para registros hechos por error</b>El folio desaparecerá de Seguimiento y de los indicadores. Por dentro queda constancia de quién lo canceló, cuándo y por qué.</div></div>' +
      textArea('m-tx', 'Motivo', 'Por ejemplo: se registró dos veces.', true), 'Cancelar registro', true,
      function (rid) { return send(rid, { texto: need(val('m-tx'), 'Escribe el motivo de la cancelación.') }).then(function () { location.hash = 'seguimiento'; toast('Registro cancelado'); return null; }); });
    if (acc === 'afectacion') {
      var t7 = d.tipo_id === 'TIP-07';
      var html = t7
        ? '<div class="summary" style="grid-template-columns:1fr 1fr"><div><span>Puesto</span><b>' + esc(puestoName(d.datos.puesto_id)) + '</b></div><div><span>Requerido · faltan ahora</span><b>' + esc(d.datos.requerido) + ' · ' + esc(d.datos.faltantes) + '</b></div></div>' +
          '<div class="form" style="grid-template-columns:1fr 1fr"><div class="field"><label for="m-pr">Personal presente<span class="req">*</span></label><input id="m-pr" type="number" min="0" max="' + esc(d.datos.requerido) + '" step="1" inputmode="numeric" value="' + esc(d.datos.presentes) + '"><span class="hint">Faltantes: <b id="m-fa">' + esc(d.datos.faltantes) + '</b></span></div>' +
          '<div class="field"><label for="m-de">Desde</label><input id="m-de" type="datetime-local" value="' + nowLocal() + '" max="' + nowLocal() + '"><span class="hint">Cuándo cambió.</span></div></div>'
        : '<div class="field"><label for="m-co">' + esc(comLabel(d.tipo_id)) + '</label><input id="m-co" type="number" min="0" step="1" inputmode="numeric" value="' + esc(d.comensales_afectados) + '"></div>';
      return modal('Actualizar afectación', '<p class="muted">Si el problema sigue, actualiza este mismo folio en lugar de registrar otro.</p>' + html + textArea('m-tx', 'Comentario', 'Opcional.'), 'Guardar cambio', false,
        function (rid) {
          var x = { texto: val('m-tx') };
          if (t7) { x.presentes = need(val('m-pr'), 'Indica el personal presente.') === '' ? '' : Number(val('m-pr')); x.desde = val('m-de'); } else x.comensales_afectados = val('m-co') === '' ? '' : Number(val('m-co'));
          return send(rid, x).then(function () { return 'Afectación actualizada'; });
        }, function (bg) { var pr = bg.querySelector('#m-pr'); if (pr) pr.oninput = function () { bg.querySelector('#m-fa').textContent = pr.value === '' ? '—' : Math.max(Number(d.datos.requerido) - Number(pr.value), 0); }; });
    }
    if (acc === 'reclasificar') {
      var r = { cat: '', tipo: '', datos: {} };
      var body = function () {
        return '<p class="muted">Tipo actual: <b>' + esc(tipoOf(d.tipo_id).nombre) + '</b>. El historial guarda el tipo anterior y la incidencia cuenta solo en el nuevo.</p>' +
          '<div class="form" style="grid-template-columns:1fr 1fr"><div class="field"><label for="m-ca">Categoría</label><select id="m-ca"><option value="">Elige</option>' + S.cat.categorias.map(function (k) { return '<option value="' + k.categoria_id + '"' + (k.categoria_id === r.cat ? ' selected' : '') + '>' + esc(k.nombre) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label for="m-ti">Nuevo tipo<span class="req">*</span></label><select id="m-ti"><option value="">Elige</option>' + S.cat.tipos.filter(function (t) { return t.categoria_id === r.cat && t.tipo_id !== d.tipo_id; }).map(function (t) { return '<option value="' + t.tipo_id + '"' + (t.tipo_id === r.tipo ? ' selected' : '') + '>' + esc(t.nombre) + '</option>'; }).join('') + '</select></div></div>' +
          (r.tipo ? '<div class="form" id="m-fields" style="grid-template-columns:1fr 1fr">' + ((S.cat.comensalesObligatorios || {})[r.tipo] === 'calc' ? '' : '<div class="field"><label for="m-co">' + esc(comLabel(r.tipo)) + '</label><input id="m-co" type="number" min="0" step="1" value="' + esc(d.comensales_afectados) + '"></div>') +
            fieldsHtml(r.tipo, r.datos, { pl: d.planta_id, srv: d.servicio_id, det: String(d.detectada).slice(0, 16) }) + '</div>' : '') +
          textArea('m-tx', 'Motivo', 'Por qué corresponde a otro tipo.', true);
      };
      var mount = function (bg) {
        var b = bg.querySelector('#m-body');
        var redraw = function () { var tx = b.querySelector('#m-tx').value; b.innerHTML = body(); b.querySelector('#m-tx').value = tx; mount(bg); };
        b.querySelector('#m-ca').onchange = function (e) { r.cat = e.target.value; r.tipo = ''; r.datos = {}; redraw(); };
        b.querySelector('#m-ti').onchange = function (e) { r.tipo = e.target.value; r.datos = {}; redraw(); };
        var fb = b.querySelector('#m-fields'); if (fb) bindFields(fb, r.datos, { pl: d.planta_id, srv: d.servicio_id, tipo: r.tipo }, redraw);
      };
      return modal('Reclasificar ' + esc(d.folio), '', 'Reclasificar', false,
        function (rid) {
          if (!r.tipo) throw { code: 'VALIDATION', message: 'Elige el nuevo tipo.' };
          var miss = missingFields(r.tipo, r.datos); if (Object.keys(miss).length) throw { code: 'VALIDATION', message: 'Completa los datos obligatorios del nuevo tipo.' };
          var co = val('m-co');
          return send(rid, { tipo_id: r.tipo, datos: r.datos, comensales_afectados: co === '' ? undefined : Number(co), texto: need(val('m-tx'), 'Explica por qué se reclasifica.') }).then(function () { return 'Incidencia reclasificada'; });
        }, function (bg) { var b = bg.querySelector('#m-body'); b.innerHTML = body(); mount(bg); });
    }
  }
  function retireModal(id) {
    var e = S.det.evidencias.filter(function (x) { return x.evidencia_id === id; })[0];
    modal('Retirar archivo', '<p class="muted">El archivo <b>' + esc(e.nombre) + '</b> dejará de mostrarse como evidencia, pero no se borra: queda en el historial con el motivo.</p>' + textArea('m-tx', 'Motivo', 'Por ejemplo: foto equivocada.', true), 'Retirar', true,
      function (rid) {
        var m = document.getElementById('m-tx').value;
        return FH.call('inc.evidence.retire', { evidencia_id: id, motivo: need(m, 'Escribe el motivo.') }, { write: true, requestId: rid }).then(function () { return 'Archivo retirado'; });
      });
  }

  // Configuración
  function viewConfig() {
    var isAdm = S.me.permisos.indexOf('*') >= 0;
    var tabs = [['usuarios', 'Usuarios', isAdm], ['plantas', 'Plantas y servicios', true], ['plantilla', 'Plantilla', true], ['bitacora', 'Bitácora', isAdm]].filter(function (t) { return t[2]; });
    if (!tabs.some(function (t) { return t[0] === S.tab; })) S.tab = tabs[0][0];
    view(head('Configuración', 'Usuarios, plantas, plantilla del proveedor y bitácora') +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button class="' + (S.tab === t[0] ? 'on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') +
      '</div><div class="card" id="cfg" style="display:flex;flex-direction:column;gap:12px"><div class="loading">Cargando…</div></div>');
    $$('[data-tab]').forEach(function (b) { b.onclick = function () { S.tab = b.dataset.tab; viewConfig(); }; });
    ({ usuarios: cfgUsers, plantas: cfgPlants, plantilla: cfgStaff, bitacora: cfgLog })[S.tab]();
  }
  function tbl(h, rows) {
    return '<div class="tablewrap"><table style="min-width:520px"><thead><tr>' + h.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + h.length + '" class="empty-row">Sin registros</td></tr>') + '</tbody></table></div>';
  }
  function plantName(id) { var p = S.cat.plantas.filter(function (x) { return x.planta_id === id; })[0]; return p ? p.nombre : id; }

  function cfgUsers() {
    FH.call('admin.users.list').then(function (users) {
      S.users = users;
      var e = S.editing || {};
      var allPlants = S.cat.plantas;
      var sel = String(e.plantas || '').split(',');
      $('#cfg').innerHTML =
        '<h2>' + (e.usuario_id ? 'Editar usuario' : 'Dar de alta un usuario') + '</h2><form id="uf" class="form" novalidate>' +
        '<div class="field"><label for="u-co">Correo</label><input id="u-co" type="text" autocomplete="off" value="' + esc(e.correo || '') + '" required></div>' +
        '<div class="field"><label for="u-no">Nombre</label><input id="u-no" type="text" value="' + esc(e.nombre || '') + '"></div>' +
        '<div class="field"><label for="u-ro">Rol</label><select id="u-ro">' + [['enf', 'Enfermería'], ['ser', 'Servicios'], ['adm', 'Administrador']].map(function (r) {
          return '<option value="' + r[0] + '"' + (e.rol === r[0] ? ' selected' : '') + '>' + r[1] + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><span class="lbl">Plantas</span><div class="row">' + allPlants.map(function (p) {
          return '<label class="row" style="gap:6px"><input type="checkbox" class="u-pl" value="' + esc(p.planta_id) + '"' + (e.plantas === '*' || sel.indexOf(p.planta_id) >= 0 ? ' checked' : '') + '>' + esc(p.nombre) + '</label>'; }).join('') +
        '</div><small class="muted">El administrador ve todas.</small></div>' +
        (e.usuario_id ? '<div class="field"><label for="u-ac">Estado</label><select id="u-ac"><option value="SI"' + (e.activo !== 'NO' ? ' selected' : '') + '>Activo</option><option value="NO"' + (e.activo === 'NO' ? ' selected' : '') + '>Inactivo (cierra sus sesiones)</option></select></div>' : '') +
        '<div class="field wide"><p id="u-err" class="err" role="alert" style="margin:0"></p><div class="row"><button class="btn pri" type="submit" id="u-save">' + (e.usuario_id ? 'Guardar cambios' : 'Dar de alta') + '</button>' +
        (e.usuario_id ? '<button class="btn" type="button" id="u-cancel">Cancelar</button>' : '') + '</div></div></form>' +
        tbl(['Correo', 'Nombre', 'Rol', 'Plantas', 'Estado', ''], users.map(function (u) {
          return [esc(u.correo), esc(u.nombre), { adm: 'Administrador', enf: 'Enfermería', ser: 'Servicios' }[u.rol] || esc(u.rol),
            u.plantas === '*' ? 'Todas' : esc(String(u.plantas).split(',').map(plantName).join(', ')),
            u.activo === 'SI' ? '<span class="pill p-cer">Activo</span>' : '<span class="pill p-neu">Inactivo</span>',
            '<button class="btn sm" data-edit="' + esc(u.usuario_id) + '">Editar</button>'];
        }));
      $('#uf').onsubmit = saveUser;
      var cancel = $('#u-cancel'); if (cancel) cancel.onclick = function () { S.editing = null; cfgUsers(); };
      $$('[data-edit]').forEach(function (b) { b.onclick = function () { S.editing = S.users.filter(function (u) { return u.usuario_id === b.dataset.edit; })[0]; cfgUsers(); }; });
    }).catch(cfgError);
  }
  var pendingSave = null;
  function saveUser(ev) {
    ev.preventDefault();
    var e = S.editing || {};
    var btn = $('#u-save'); btn.disabled = true;
    pendingSave = pendingSave || FH.uuid(); // el mismo requestId si se reintenta tras un error de red
    FH.call('admin.users.save', {
      usuario_id: e.usuario_id, version: e.version, correo: $('#u-co').value, nombre: $('#u-no').value, rol: $('#u-ro').value,
      plantas: $$('.u-pl').filter(function (x) { return x.checked; }).map(function (x) { return x.value; }).join(','),
      activo: $('#u-ac') ? $('#u-ac').value : 'SI'
    }, { write: true, requestId: pendingSave }).then(function () {
      pendingSave = null; toast(e.usuario_id ? 'Usuario actualizado' : 'Usuario dado de alta'); S.editing = null; cfgUsers();
    }).catch(function (err) {
      if (err.code !== 'NETWORK') pendingSave = null;
      $('#u-err').textContent = err.message; btn.disabled = false;
    });
  }
  function cfgPlants() {
    $('#cfg').innerHTML = S.cat.plantas.map(function (p) {
      var srv = S.cat.servicios.filter(function (s) { return s.planta_id === p.planta_id; });
      return '<h3>' + esc(p.nombre) + ' <span class="muted">(' + srv.length + ' servicios)</span></h3>' +
        tbl(['Servicio', 'Turno / esquema', 'Horario', 'Clasificar hasta', 'Días'], srv.map(function (s) {
          return [esc(s.servicio), esc(s.turno_esquema), esc(s.inicio + '–' + s.fin), esc(s.clasificar_hasta), esc(s.dias_operacion)]; }));
    }).join('');
  }
  function cfgStaff() {
    var pu = {}; S.cat.puestos.forEach(function (p) { pu[p.puesto_id] = p.nombre; });
    $('#cfg').innerHTML = tbl(['Planta', 'Turno', 'Horario', 'Días', 'Puesto', 'Cantidad', 'Origen'], S.cat.plantilla.map(function (r) {
      var t = S.cat.turnosConcesionario.filter(function (x) { return x.turno_conc_id === r.turno_conc_id; })[0] || {};
      return [esc(plantName(r.planta_id)), esc(r.turno_conc_id), esc(t.inicio + '–' + t.fin), esc(t.dias), esc(pu[r.puesto_id] || r.puesto_id), esc(r.cantidad),
        /PROPUESTO/.test(r.origen) ? '<span class="pill p-sol">Validar con Oralia</span>' : '<span class="muted">Plantilla real</span>'];
    }));
  }
  function cfgLog() {
    FH.call('admin.log.list', { limit: 100 }).then(function (rows) {
      $('#cfg').innerHTML = tbl(['Fecha', 'Quién', 'Acción', 'Registro'], rows.map(function (r) {
        return [esc(String(r.fecha).replace('T', ' ').slice(0, 16)), esc(r.actor), esc(r.accion), esc(r.entidad_id)]; }));
    }).catch(cfgError);
  }
  function cfgError(e) { $('#cfg').innerHTML = '<p class="err">' + esc(e.message) + '</p>'; }

  start();
})();
