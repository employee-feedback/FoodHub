/* FoodHub — aplicación interna: inicio de sesión, estructura, inicio, nueva incidencia y configuración. */
(function () {
  'use strict';
  var CFG = window.FOODHUB_CONFIG;
  var S = { me: null, cat: null, wiz: { step: 1 }, tab: 'usuarios', users: null, log: null, editing: null, plant: '' };
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
    var v = (location.hash || '#inicio').slice(1);
    if (allowed.indexOf(v) < 0) v = 'inicio';
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
    (VIEWS[v] || VIEWS.inicio)(v);
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
    seguimiento: soon, auditoria: soon, calendario: soon, evaluacion: soon, reportes: soon,
    configuracion: viewConfig
  };

  // Inicio: tablero preparado. No muestra cifras hasta que existan datos reales.
  function viewInicio() {
    var k = function (ic, tone, label, sub) {
      return '<div class="card kpi"><div class="k-top"><span class="l">' + label + '</span><span class="k-ic ' + tone + '">' + I(ic, 18) + '</span></div>' +
        '<span class="v none" aria-label="Sin datos">—</span><span class="s">' + sub + '</span></div>';
    };
    var canNew = S.me.pantallas.indexOf('nueva') >= 0;
    view(head('Hola, ' + esc((S.me.nombre || S.me.correo).split(' ')[0]), 'Resumen del servicio de comedor · ' + esc(S.plant ? plantName(S.plant) : 'todas tus plantas'),
      canNew ? '<a class="btn pri" href="#nueva">' + I('circle-plus', 18) + 'Nueva incidencia</a>' : '') +
      '<div class="grid g4">' +
      k('inbox', 'blue', 'Incidencias abiertas', 'Sin registros todavía') +
      k('clock', 'warn', 'Pendientes de respuesta', 'Sin registros todavía') +
      k('clock-alert', 'bad', 'Vencidas', 'Sin registros todavía') +
      k('circle-check', 'ok', 'Resueltas este mes', 'Sin registros todavía') + '</div>' +
      '<div class="grid g2"><div class="card"><div class="card-h"><div><h2>' + I('trending-up', 18) + 'Tendencia de incidencias</h2><p>Últimos 6 meses por categoría</p></div></div>' +
      '<div class="chart-ph" aria-hidden="true"><i style="height:30%"></i><i style="height:45%"></i><i style="height:38%"></i><i style="height:55%"></i><i style="height:42%"></i><i style="height:50%"></i>' +
      '<div class="ov"><span>La gráfica aparecerá cuando haya incidencias registradas.</span></div></div></div>' +
      '<div class="card"><div class="card-h"><div><h2>' + I('badge-check', 18) + 'Cumplimiento del proveedor</h2><p>Resultado de auditorías e indicadores</p></div></div>' +
      '<div class="empty sm"><span class="e-ic">' + I('clipboard-check', 22) + '</span><b style="color:var(--navy)">Sin auditorías finalizadas</b><p style="font-size:13px">El cumplimiento se calcula con las auditorías mensuales y los indicadores aprobados.</p></div></div></div>' +
      '<div class="card"><div class="card-h"><div><h2>' + I('list', 18) + 'Incidencias recientes</h2><p>Las últimas registradas en tus plantas</p></div></div>' +
      '<div class="tablewrap"><table><thead><tr><th>Folio</th><th>Planta</th><th>Tipo</th><th>Registro</th><th>Estado</th></tr></thead><tbody><tr><td colspan="5" class="empty-row">Aún no hay incidencias registradas.</td></tr></tbody></table></div></div>');
  }

  // Nueva incidencia: asistente de 3 pasos con catálogos reales. El guardado aún no está disponible.
  function nowLocal() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
  function fmtDate(v) { if (!v) return '—'; var d = new Date(v); return isNaN(d) ? v : d.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  function viewNueva() {
    var w = S.wiz, c = S.cat;
    if (!w.pl || !c.plantas.some(function (p) { return p.planta_id === w.pl; })) w.pl = S.plant || (c.plantas[0] && c.plantas[0].planta_id);
    if (!w.det) w.det = nowLocal();
    var srvs = c.servicios.filter(function (s) { return s.planta_id === w.pl; });
    if (!srvs.some(function (s) { return s.servicio_id === w.srv; })) w.srv = srvs[0] && srvs[0].servicio_id;
    var srv = srvs.filter(function (s) { return s.servicio_id === w.srv; })[0] || {};
    var tipo = c.tipos.filter(function (x) { return x.tipo_id === w.tipo; })[0];
    var cat = c.categorias.filter(function (x) { return x.categoria_id === w.cat; })[0];
    var steps = [['Paso 1', 'Dónde y cuándo'], ['Paso 2', 'Qué pasó'], ['Paso 3', 'Detalle y evidencia']];
    var body = '';
    if (w.step === 1) {
      body = '<div class="card-h"><div><h2>Dónde y cuándo</h2><p>Comedor donde ocurrió, servicio afectado y momento de la detección.</p></div></div>' +
        '<div class="form"><div class="field"><label for="n-pl">Planta (comedor)<span class="req">*</span></label><div class="ctl">' + I('map-pin', 18) + '<select id="n-pl">' +
        c.plantas.map(function (p) { return '<option value="' + esc(p.planta_id) + '"' + (p.planta_id === w.pl ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') +
        '</select></div><span class="hint">En fin de semana, registra en el comedor donde se dio el servicio.</span></div>' +
        '<div class="field' + (w.e1 && !w.det ? ' invalid' : '') + '"><label for="n-det">Fecha y hora de detección<span class="req">*</span></label><div class="ctl">' + I('clock', 18) + '<input id="n-det" type="datetime-local" value="' + esc(w.det) + '" max="' + nowLocal() + '"></div>' +
        (w.e1 && !w.det ? '<span class="ferr">' + I('circle-alert', 14) + 'Indica cuándo se detectó.</span>' : '<span class="hint">Por omisión, ahora. Puedes ajustarla.</span>') + '</div>' +
        '<div class="field wide' + (w.e1 && !w.srv ? ' invalid' : '') + '"><label for="n-srv">Servicio<span class="req">*</span></label><div class="ctl">' + I('utensils', 18) + '<select id="n-srv">' +
        srvs.map(function (s) { return '<option value="' + esc(s.servicio_id) + '"' + (s.servicio_id === w.srv ? ' selected' : '') + '>' + esc(s.servicio + ' · ' + s.inicio + '–' + s.fin + ' · ' + s.dias_operacion) + '</option>'; }).join('') +
        '</select></div></div>' +
        '<div class="field"><label for="n-tu">Turno</label><input id="n-tu" readonly value="' + esc(srv.turno_esquema || '—') + '"><span class="hint">Se toma del servicio.</span></div>' +
        '<div class="field"><label for="n-rep">Reporta</label><input id="n-rep" readonly value="' + esc(S.me.nombre || S.me.correo) + '"></div></div>';
    } else if (w.step === 2) {
      body = '<div class="sub-h"><div><h2>Categoría</h2><p class="muted" style="font-size:13px;margin-top:2px">Elige el área del incumplimiento.</p></div></div><div class="chips" role="radiogroup" aria-label="Categoría">' + c.categorias.map(function (k) {
        var n = c.tipos.filter(function (t) { return t.categoria_id === k.categoria_id; }).length;
        return '<button type="button" role="radio" aria-checked="' + (w.cat === k.categoria_id) + '" class="chip' + (w.cat === k.categoria_id ? ' on' : '') + '" data-cat="' + esc(k.categoria_id) + '"><span class="c-ic">' + I(CAT_ICON[k.categoria_id] || 'circle-alert', 18) + '</span><span class="c-t"><b>' + esc(k.nombre) + '</b><small>' + n + (n === 1 ? ' tipo' : ' tipos') + '</small></span><span class="tick">' + I('check', 12) + '</span></button>';
      }).join('') + '</div>' + (w.cat ? '<div class="sub-h"><div><h2>Tipo de incumplimiento</h2><p class="muted" style="font-size:13px;margin-top:2px">' + esc(cat.nombre) + '</p></div></div><div class="chips" role="radiogroup" aria-label="Tipo de incumplimiento">' +
        c.tipos.filter(function (t) { return t.categoria_id === w.cat; }).map(function (t) {
          return '<button type="button" role="radio" aria-checked="' + (w.tipo === t.tipo_id) + '" class="chip tipo' + (w.tipo === t.tipo_id ? ' on' : '') + '" data-tipo="' + esc(t.tipo_id) + '"><span class="c-t"><b>' + esc(t.nombre) + '</b>' +
            (t.critico === 'Sí' ? '<span><span class="badge crit">' + I('flame', 12) + 'Crítica</span></span>' : '') + '</span><span class="tick">' + I('check', 12) + '</span></button>';
        }).join('') + '</div>' : '') + (w.e2 && !w.tipo ? '<p class="ferr" style="margin-top:12px;color:var(--bad);display:flex;gap:6px;align-items:center">' + I('circle-alert', 14) + 'Elige la categoría y el tipo para continuar.</p>' : '');
    } else {
      var campos = String(tipo.campos_especificos || '').split(';').map(function (x) { return x.trim(); }).filter(Boolean);
      body = '<div class="card-h"><div><h2>Detalle y evidencia</h2><p>Revisa los datos y la información que se solicitará para este tipo.</p></div>' + (tipo.critico === 'Sí' ? '<span class="badge crit">' + I('flame', 12) + 'Crítica</span>' : '') + '</div>' +
        '<div class="summary"><div><span>' + I('map-pin', 14) + 'Planta</span><b>' + esc(plantName(w.pl)) + '</b></div><div><span>' + I('utensils', 14) + 'Servicio</span><b>' + esc(srv.servicio ? srv.servicio + ' · ' + srv.inicio + '–' + srv.fin : '—') + '</b></div>' +
        '<div><span>' + I('clock', 14) + 'Detección</span><b>' + esc(fmtDate(w.det)) + '</b></div><div><span>' + I(CAT_ICON[w.cat] || 'circle-alert', 14) + 'Tipo</span><b>' + esc(tipo.nombre) + '</b></div></div>' +
        '<div class="sub-h"><h3>Información del incidente</h3></div><ul class="fields-list">' +
        ['Descripción de lo ocurrido', 'Comensales afectados (estimado)'].concat(campos).map(function (f) { return '<li>' + I('check', 16) + '<span>' + esc(f.charAt(0).toUpperCase() + f.slice(1)) + '</span></li>'; }).join('') + '</ul>' +
        '<div class="sub-h"><h3>Evidencia</h3><span class="muted" style="font-size:12.5px">Opcional</span></div><div class="drop">' + I('camera', 24) + '<b style="color:var(--fg-2)">Fotos desde la cámara o archivos</b><span style="font-size:12.5px">JPG o PNG</span></div>' +
        '<div class="note" style="margin-top:20px">' + I('info', 18) + '<div><b>Registro en preparación</b>El guardado de incidencias se habilitará en la próxima actualización. Por ahora puedes revisar el flujo y los datos que se pedirán.</div></div>';
    }
    view(head('Nueva incidencia', 'Registra un incumplimiento solo cuando ocurre.') +
      '<div class="card"><ol class="stepper">' + steps.map(function (s, i) {
        var st = w.step === i + 1 ? 'on' : (w.step > i + 1 ? 'done' : '');
        return '<li class="' + st + '"' + (st === 'on' ? ' aria-current="step"' : '') + '><span class="dot">' + (st === 'done' ? I('check', 18) : (i + 1)) + '</span><span class="st-t"><span>' + s[0] + '</span><b>' + s[1] + '</b></span></li>';
      }).join('') + '</ol><p class="st-mob">Paso ' + w.step + ' de 3 · <b>' + steps[w.step - 1][1] + '</b></p></div>' +
      '<div class="card">' + body + '<div class="wiz-foot"><button class="btn" id="w-back" type="button"' + (w.step === 1 ? ' disabled' : '') + '>' + I('arrow-left', 18) + 'Atrás</button>' +
      '<span class="prog">Paso ' + w.step + ' de 3</span>' +
      (w.step < 3 ? '<button class="btn pri" id="w-next" type="button">Continuar' + I('arrow-right', 18) + '</button>'
        : '<button class="btn pri" id="w-next" type="button" disabled title="Disponible en la próxima actualización">' + I('check', 18) + 'Registrar incidencia</button>') + '</div></div>');
    var pl = $('#n-pl'); if (pl) pl.onchange = function (e) { w.pl = e.target.value; viewNueva(); };
    var sv = $('#n-srv'); if (sv) sv.onchange = function (e) { w.srv = e.target.value; viewNueva(); };
    var dt = $('#n-det'); if (dt) dt.onchange = function (e) { w.det = e.target.value; };
    $$('[data-cat]').forEach(function (b) { b.onclick = function () { if (w.cat !== b.dataset.cat) w.tipo = null; w.cat = b.dataset.cat; viewNueva(); }; });
    $$('[data-tipo]').forEach(function (b) { b.onclick = function () { w.tipo = b.dataset.tipo; viewNueva(); }; });
    $('#w-back').onclick = function () { w.step--; viewNueva(); };
    $('#w-next').onclick = function () {
      if (w.step === 1) { w.e1 = true; if (!w.det || !w.srv) return viewNueva(); }
      if (w.step === 2) { w.e2 = true; if (!w.tipo) return viewNueva(); }
      if (w.step < 3) { w.step++; viewNueva(); window.scrollTo(0, 0); }
    };
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
