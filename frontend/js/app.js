/* FoodHub — aplicación interna (Fase 4: inicio de sesión, permisos, catálogos y usuarios). */
(function () {
  'use strict';
  var CFG = window.FOODHUB_CONFIG;
  var S = { me: null, cat: null, wiz: { step: 1 }, tab: 'usuarios', users: null, log: null, editing: null };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(t) { var d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3500); }
  function root(html) { $('#root').innerHTML = html; }

  var NAV = [['inicio', 'Inicio'], ['nueva', 'Nueva incidencia'], ['seguimiento', 'Seguimiento'], ['auditoria', 'Auditoría mensual'],
    ['calendario', 'Calendario'], ['evaluacion', 'Evaluación mensual'], ['reportes', 'Reportes'], ['configuracion', 'Configuración']];
  var PHASE = { seguimiento: 'Fase 5', auditoria: 'Fase 7', calendario: 'Fase 7', evaluacion: 'Fase 8', reportes: 'Fase 8' };

  // ---------------- arranque ----------------
  function start() {
    if (/PEGAR_AQUI/.test(CFG.API_URL)) {
      root('<div class="login"><div class="card"><b style="font-size:20px">FoodHub</b><p class="err">Falta configurar API_URL en config.js.</p><p class="muted">Sigue la guía de instalación.</p></div></div>');
      return;
    }
    var s = FH.Session.get();
    if (!s) return showLogin();
    root('<div class="loading">Verificando tu sesión…</div>');
    FH.call('auth.me').then(function (me) { S.me = me; return loadCatalog(); })
      .then(render).catch(function (e) { showLogin(e.code === 'AUTH' ? e.message : 'No se pudo verificar la sesión: ' + e.message); });
  }

  function loadCatalog() { return FH.call('catalog.get').then(function (c) { S.cat = c; }); }

  window.addEventListener('fh:logout', function (e) { S.me = null; showLogin(e.detail); });
  window.addEventListener('hashchange', function () { if (S.me) render(); });

  // ---------------- inicio de sesión (código por correo, como TalentHub) ----------------
  var L = { correo: '' };
  function loginShell(inner, msg) {
    root('<div class="login"><div class="card">' +
      '<div><b style="font-size:20px">FoodHub</b><p class="muted" style="margin:4px 0 0">Evaluación y seguimiento del concesionario de comedor</p></div>' +
      (msg ? '<p class="err" role="alert" style="margin:0">' + esc(msg) + '</p>' : '') + inner +
      '<p class="muted" style="margin:0;font-size:12.5px">Solo pueden entrar los correos dados de alta por el administrador. El concesionario no usa esta pantalla: responde desde el enlace que recibe por correo.</p>' +
      '</div></div>');
  }
  function showLogin(msg) {
    loginShell('<form id="l-f1" style="display:flex;flex-direction:column;gap:10px" novalidate>' +
      '<label class="lbl" for="l-em">Tu correo</label>' +
      '<input id="l-em" type="email" autocomplete="email" inputmode="email" placeholder="nombre@teleflex.com" value="' + esc(L.correo) + '" required>' +
      '<button class="btn pri" id="l-send" type="submit">Enviarme un código</button>' +
      '<p id="l-st" class="muted" style="margin:0"></p></form>', msg);
    var em = $('#l-em'); em.focus();
    $('#l-f1').onsubmit = function (e) {
      e.preventDefault();
      var c = em.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) { $('#l-st').textContent = 'Escribe un correo válido.'; return; }
      $('#l-send').disabled = true; $('#l-st').textContent = 'Enviando…';
      FH.call('auth.requestCode', { correo: c })
        .then(function (d) { L.correo = c; showCode(d.mensaje); })
        .catch(function (err) { $('#l-send').disabled = false; $('#l-st').textContent = err.message; });
    };
  }
  function showCode(info, msg) {
    loginShell('<form id="l-f2" style="display:flex;flex-direction:column;gap:10px" novalidate>' +
      '<p style="margin:0">' + esc(info || '') + '</p>' +
      '<p class="muted" style="margin:0">Correo: <b>' + esc(L.correo) + '</b></p>' +
      '<label class="lbl" for="l-co">Código de 6 dígitos</label>' +
      '<input id="l-co" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" style="font-size:22px;letter-spacing:6px;text-align:center">' +
      '<label class="row" style="flex-wrap:nowrap;align-items:flex-start"><input id="l-re" type="checkbox" checked style="margin-top:3px"><span><b>Recordar este equipo 30 días</b><br><span class="muted">Desmárcalo en la tablet compartida: así la sesión dura 6 horas y se borra al cerrar el navegador.</span></span></label>' +
      '<button class="btn pri" id="l-go" type="submit">Entrar</button>' +
      '<p id="l-st" class="muted" style="margin:0"></p>' +
      '<a href="#" id="l-back" style="font-size:13px">Usar otro correo o pedir un código nuevo</a></form>', msg);
    var co = $('#l-co'); co.focus();
    co.oninput = function () { co.value = co.value.replace(/\D/g, '').slice(0, 6); };
    $('#l-back').onclick = function (e) { e.preventDefault(); showLogin(); };
    $('#l-f2').onsubmit = function (e) {
      e.preventDefault();
      if (!/^\d{6}$/.test(co.value)) { $('#l-st').textContent = 'El código tiene 6 números.'; return; }
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
          $('#l-go').disabled = false; $('#l-st').textContent = err.message; co.value = ''; co.focus();
        });
    };
  }
  function logout() {
    FH.call('auth.logout').catch(function () {}).then(function () {
      FH.Session.clear(); S.me = null;
      showLogin('Cerraste sesión.');
    });
  }

  // ---------------- estructura ----------------
  function render() {
    var allowed = S.me.pantallas;
    var v = (location.hash || '#inicio').slice(1);
    if (allowed.indexOf(v) < 0) v = 'inicio';
    var nav = NAV.filter(function (n) { return allowed.indexOf(n[0]) >= 0; });
    var s = FH.Session.get() || {};
    root('<div class="app"><aside class="side"><div class="brand"><b>FoodHub</b><span>Evaluación del comedor</span></div><nav class="nav">' +
      nav.map(function (n, i) { return '<a href="#' + n[0] + '" class="' + (v === n[0] ? 'on' : '') + '"><span class="n">' + (i + 1) + '</span>' + n[1] + '</a>'; }).join('') +
      '</nav><div class="foot">' + esc(S.me.nombre || S.me.correo) + '<br>' + esc(S.me.rol_nombre) + ' · ' + (s.recordar ? 'equipo recordado 30 días' : 'sesión de 6 horas') +
      '<br><a href="#" id="logout" style="color:inherit">Cerrar sesión</a></div></aside>' +
      '<div class="main"><div class="top"><div class="demo"><span class="muted">' + esc(plantsLabel()) + '</span></div><div class="demo"><span class="tag">v0.4 · Fase 4</span></div></div>' +
      '<div class="content" id="view"></div></div></div>');
    $('#logout').onclick = function (e) { e.preventDefault(); logout(); };
    (VIEWS[v] || VIEWS.inicio)();
    window.scrollTo(0, 0);
  }
  function plantsLabel() {
    if (S.me.plantas === '*') return 'Todas las plantas';
    return S.cat.plantas.map(function (p) { return p.nombre; }).join(', ');
  }
  function view(html) { $('#view').innerHTML = html; }
  function head(t, sub, right) { return '<div class="head"><div><h1>' + t + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (right || '') + '</div>'; }
  function soon(t, phase, what) { view(head(t) + '<div class="empty"><b>Se construye en la ' + phase + '.</b><span class="muted">' + what + '</span><a class="btn" href="#inicio">Volver al inicio</a></div>'); }

  // ---------------- vistas ----------------
  var VIEWS = {
    inicio: function () {
      var c = S.cat;
      view(head('Inicio', 'Hola, ' + esc(S.me.nombre || S.me.correo)) +
        '<div class="note">La conexión con el servidor funciona. Los indicadores del tablero se calculan a partir de la Fase 8, cuando haya incidencias y auditorías registradas.</div>' +
        '<div class="grid g4">' + kpi(c.plantas.length, 'Plantas autorizadas') + kpi(c.servicios.length, 'Servicios en catálogo') +
        kpi(c.tipos.length, 'Tipos de incidencia') + kpi(c.auditoriaPuntos.length, 'Puntos de auditoría (borrador)') + '</div>' +
        '<div class="card"><h2>Tu acceso</h2><dl class="dl" style="margin-top:10px"><dt>Correo</dt><dd>' + esc(S.me.correo) + '</dd><dt>Rol</dt><dd>' + esc(S.me.rol_nombre) +
        '</dd><dt>Plantas</dt><dd>' + esc(plantsLabel()) + '</dd><dt>Pantallas</dt><dd>' + esc(S.me.pantallas.join(', ')) + '</dd></dl></div>');
    },
    nueva: viewNueva,
    seguimiento: function () { soon('Seguimiento de incidencias', PHASE.seguimiento, 'Lista de incidencias con filtros, estados y vencimientos.'); },
    auditoria: function () { soon('Auditoría mensual', PHASE.auditoria, 'Lista de verificación por secciones, borrador y finalización.'); },
    calendario: function () { soon('Calendario', PHASE.calendario, 'Programación de la auditoría mensual por planta y avisos.'); },
    evaluacion: function () { soon('Evaluación mensual', PHASE.evaluacion, 'Indicadores calculados automáticamente.'); },
    reportes: function () { soon('Reportes', PHASE.reportes, 'Exportación a Excel/CSV y reportes PDF.'); },
    configuracion: viewConfig
  };
  function kpi(v, l) { return '<div class="card kpi"><span class="l">' + l + '</span><span class="v">' + v + '</span></div>'; }

  // Nueva incidencia: navegación con catálogos reales; el registro se habilita en la Fase 5.
  function viewNueva() {
    var w = S.wiz, c = S.cat;
    if (!w.pl) w.pl = c.plantas[0] && c.plantas[0].planta_id;
    var steps = ['Dónde y cuándo', 'Qué pasó', 'Detalle y evidencia'];
    var body = '';
    if (w.step === 1) {
      var srv = c.servicios.filter(function (s) { return s.planta_id === w.pl; });
      body = '<div class="form"><div class="field"><label for="n-pl">Planta (comedor)</label><select id="n-pl">' +
        c.plantas.map(function (p) { return '<option value="' + esc(p.planta_id) + '"' + (p.planta_id === w.pl ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') +
        '</select></div><div class="field"><label for="n-srv">Servicio</label><select id="n-srv">' +
        srv.map(function (s) { return '<option value="' + esc(s.servicio_id) + '">' + esc(s.servicio + ' · ' + s.turno_esquema + ' · ' + s.inicio + '–' + s.fin + ' · ' + s.dias_operacion) + '</option>'; }).join('') +
        '</select></div><div class="field"><label for="n-det">Fecha y hora de detección</label><input id="n-det" type="datetime-local"></div></div>';
    } else if (w.step === 2) {
      body = '<div class="lbl" style="margin-bottom:8px">Categoría</div><div class="chips">' + c.categorias.map(function (k) {
        return '<button class="chip' + (w.cat === k.categoria_id ? ' on' : '') + '" data-cat="' + esc(k.categoria_id) + '"><b>' + esc(k.nombre) + '</b></button>';
      }).join('') + '</div>' + (w.cat ? '<div class="lbl" style="margin:16px 0 8px">Tipo de incumplimiento</div><div class="chips">' +
        c.tipos.filter(function (t) { return t.categoria_id === w.cat; }).map(function (t) {
          return '<button class="chip' + (w.tipo === t.tipo_id ? ' on' : '') + '" data-tipo="' + esc(t.tipo_id) + '"><b>' + esc(t.nombre) + '</b><small>' + esc(t.tipo_id) + (t.critico === 'Sí' ? ' · crítico' : '') + '</small></button>';
        }).join('') + '</div>' : '');
    } else {
      var t = c.tipos.filter(function (x) { return x.tipo_id === w.tipo; })[0] || {};
      body = '<h3>' + esc(t.nombre) + '</h3><p class="muted">Campos de este tipo (catálogo): ' + esc(t.campos_especificos) + '</p>' +
        '<div class="note warn">El registro de incidencias, el folio y la notificación al concesionario se activan en la Fase 5.</div>';
    }
    view(head('Nueva incidencia', 'Solo cuando ocurre') + '<div class="steps">' + steps.map(function (s, i) {
      return '<span class="step' + (w.step === i + 1 ? ' on' : '') + '"><b>' + (i + 1) + '</b>' + s + '</span>'; }).join('') + '</div>' +
      '<div class="card">' + body + '</div><div class="row" style="justify-content:space-between"><button class="btn" id="w-back"' + (w.step === 1 ? ' disabled' : '') +
      '>Atrás</button><button class="btn pri" id="w-next"' + ((w.step === 2 && !w.tipo) || w.step === 3 ? ' disabled' : '') + '>' + (w.step === 3 ? 'Registrar (Fase 5)' : 'Continuar') + '</button></div>');
    var pl = $('#n-pl'); if (pl) pl.onchange = function (e) { w.pl = e.target.value; viewNueva(); };
    $$('[data-cat]').forEach(function (b) { b.onclick = function () { w.cat = b.dataset.cat; w.tipo = null; viewNueva(); }; });
    $$('[data-tipo]').forEach(function (b) { b.onclick = function () { w.tipo = b.dataset.tipo; viewNueva(); }; });
    $('#w-back').onclick = function () { w.step--; viewNueva(); };
    $('#w-next').onclick = function () { if (w.step < 3) { w.step++; viewNueva(); } };
  }

  // Configuración
  function viewConfig() {
    var isAdm = S.me.permisos.indexOf('*') >= 0;
    var tabs = [['usuarios', 'Usuarios', isAdm], ['plantas', 'Plantas y servicios', true], ['plantilla', 'Plantilla', true], ['bitacora', 'Bitácora', isAdm]].filter(function (t) { return t[2]; });
    if (!tabs.some(function (t) { return t[0] === S.tab; })) S.tab = tabs[0][0];
    view(head('Configuración', isAdm ? 'Acceso de administrador' : 'Consulta según permisos de Servicios') +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button class="' + (S.tab === t[0] ? 'on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') +
      '</div><div class="card" id="cfg" style="display:flex;flex-direction:column;gap:12px"><div class="loading">Cargando…</div></div>');
    $$('[data-tab]').forEach(function (b) { b.onclick = function () { S.tab = b.dataset.tab; viewConfig(); }; });
    ({ usuarios: cfgUsers, plantas: cfgPlants, plantilla: cfgStaff, bitacora: cfgLog })[S.tab]();
  }
  function tbl(h, rows) {
    return '<div class="tablewrap"><table style="min-width:520px"><thead><tr>' + h.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + h.length + '" class="muted">Sin registros</td></tr>') + '</tbody></table></div>';
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
        '<div class="field"><label for="u-co">Correo de Google</label><input id="u-co" type="text" autocomplete="off" value="' + esc(e.correo || '') + '" required></div>' +
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
            '<button class="btn" data-edit="' + esc(u.usuario_id) + '">Editar</button>'];
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
