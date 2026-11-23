/* FoodHub — cliente de la API y manejo de la sesión en el navegador. */
(function () {
  'use strict';
  var CFG = window.FOODHUB_CONFIG;
  var KEY = 'fh_session';

  // "Recordar este equipo": localStorage (30 días). Sin recordar: sessionStorage (se borra al cerrar el navegador).
  function store(recordar) { return recordar ? window.localStorage : window.sessionStorage; }
  function safe(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }

  var Session = {
    get: function () {
      var raw = safe(function () { return sessionStorage.getItem(KEY) || localStorage.getItem(KEY); }, null);
      return raw ? safe(function () { return JSON.parse(raw); }, null) : null;
    },
    set: function (s) {
      this.clear();
      safe(function () { store(s.recordar).setItem(KEY, JSON.stringify(s)); });
    },
    clear: function () {
      safe(function () { sessionStorage.removeItem(KEY); });
      safe(function () { localStorage.removeItem(KEY); });
    }
  };

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16));
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }

  /**
   * Llama una acción del backend. Content-Type text/plain evita la verificación previa (OPTIONS),
   * que Apps Script no admite. El token va en el cuerpo, nunca en la URL.
   */
  function call(action, payload, opts) {
    opts = opts || {};
    var s = Session.get();
    var body = { action: action, payload: payload || {}, session: s && s.session };
    if (opts.write) body.requestId = opts.requestId || uuid();
    return fetch(CFG.API_URL, {
      method: 'POST', redirect: 'follow', credentials: 'omit',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw { code: 'NETWORK', message: 'El servidor no respondió (' + r.status + '). Revisa tu conexión e intenta de nuevo.' };
      return r.json();
    }, function () {
      throw { code: 'NETWORK', message: 'Sin conexión con el servidor. Revisa tu red e intenta de nuevo.' };
    }).then(function (res) {
      if (res.ok) return res.data;
      if (res.error && res.error.code === 'AUTH') { Session.clear(); window.dispatchEvent(new CustomEvent('fh:logout', { detail: res.error.message })); }
      throw res.error || { code: 'INTERNAL', message: 'Respuesta inesperada del servidor.' };
    });
  }

  window.FH = { call: call, Session: Session, uuid: uuid };
})();
