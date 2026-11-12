/**
 * FoodHub — capa de acceso a Google Sheets.
 * Todo acceso a datos pasa por aquí: el frontend nunca escribe directo en las hojas.
 * Las hojas se crean con formato de texto plano; los valores se guardan como texto.
 */

var DB_CACHE_ = {};

function db_() {
  if (!DB_CACHE_.main) DB_CACHE_.main = SpreadsheetApp.openById(requireProp_('DB_ID'));
  return DB_CACHE_.main;
}

function logDb_() {
  if (!DB_CACHE_.log) DB_CACHE_.log = SpreadsheetApp.openById(requireProp_('LOG_ID'));
  return DB_CACHE_.log;
}

function table_(name, book) {
  var key = 't:' + name;
  if (DB_CACHE_[key]) return DB_CACHE_[key];
  var ss = book || (LOG_SCHEMA[name] ? logDb_() : db_());
  var sh = ss.getSheetByName(name);
  if (!sh) throw new AppError('DB', 'No existe la hoja ' + name + '. Ejecuta setup().', 500);
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  var idx = {};
  headers.forEach(function (h, i) { idx[h] = i; });
  DB_CACHE_[key] = { name: name, sheet: sh, headers: headers, idx: idx };
  return DB_CACHE_[key];
}

/** Lee todas las filas como objetos. Cada objeto trae _row (número de fila en la hoja). */
function all_(name) {
  var t = table_(name);
  var n = t.sheet.getLastRow() - 1;
  if (n < 1) return [];
  var values = t.sheet.getRange(2, 1, n, t.headers.length).getValues();
  var out = [];
  for (var r = 0; r < values.length; r++) {
    if (values[r][0] === '' || values[r][0] === null) continue;
    var o = { _row: r + 2 };
    for (var c = 0; c < t.headers.length; c++) o[t.headers[c]] = fromCell_(values[r][c]);
    out.push(o);
  }
  return out;
}

/** Igual que all_ pero con caché corta, para catálogos. */
function cachedAll_(name, seconds) {
  var cache = CacheService.getScriptCache();
  var key = 'tbl:' + name;
  var hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  var rows = all_(name);
  var json = JSON.stringify(rows);
  if (json.length < 90000) cache.put(key, json, seconds || APP.CACHE_CATALOG_SEC);
  return rows;
}

function invalidate_(name) {
  CacheService.getScriptCache().remove('tbl:' + name);
}

function findBy_(name, field, value) {
  var rows = all_(name);
  for (var i = 0; i < rows.length; i++) if (String(rows[i][field]) === String(value)) return rows[i];
  return null;
}

function rowFrom_(t, obj) {
  return t.headers.map(function (h) { return toCell_(obj[h]); });
}

/** Inserta un registro. Debe llamarse dentro de withLock_ cuando la clave dependa de otras filas. */
function insert_(name, obj, actor) {
  var t = table_(name);
  if (t.idx.version !== undefined) {
    var now = nowIso_();
    obj.creado_en = now; obj.creado_por = actor || 'sistema';
    obj.actualizado_en = now; obj.actualizado_por = actor || 'sistema';
    obj.version = 1;
    if (obj.activo === undefined) obj.activo = 'SI';
  }
  t.sheet.appendRow(rowFrom_(t, obj));
  invalidate_(name);
  return obj;
}

/**
 * Actualiza un registro por clave primaria con control de versión optimista.
 * expectedVersion: la versión que el usuario tenía en pantalla; si otro la cambió antes, se rechaza.
 */
function update_(name, id, patch, actor, expectedVersion) {
  var t = table_(name);
  var pk = t.headers[0];
  var cur = findBy_(name, pk, id);
  if (!cur) throw new AppError('NOT_FOUND', 'No se encontró ' + id + '.', 404);
  if (expectedVersion !== undefined && expectedVersion !== null && t.idx.version !== undefined &&
      Number(cur.version) !== Number(expectedVersion)) {
    throw new AppError('CONFLICT', 'Otra persona modificó este registro. Recarga para ver la versión actual.', 409);
  }
  var before = {};
  Object.keys(patch).forEach(function (k) { before[k] = cur[k]; cur[k] = patch[k]; });
  if (t.idx.version !== undefined) {
    cur.version = Number(cur.version || 0) + 1;
    cur.actualizado_en = nowIso_();
    cur.actualizado_por = actor || 'sistema';
  }
  t.sheet.getRange(cur._row, 1, 1, t.headers.length).setValues([rowFrom_(t, cur)]);
  invalidate_(name);
  return { before: before, after: cur };
}

/** Ejecuta fn con el bloqueo del script, para escrituras que no deben cruzarse. */
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(APP.LOCK_WAIT_MS)) throw new AppError('BUSY', 'El sistema está ocupado. Intenta de nuevo en unos segundos.', 503);
  try { return fn(); } finally { lock.releaseLock(); }
}

/** Consecutivo atómico (usar dentro de withLock_). */
function nextCounter_(id) {
  var c = findBy_('SYS_Contadores', 'contador_id', id);
  if (!c) { insert_('SYS_Contadores', { contador_id: id, valor: 1 }); return 1; }
  var v = Number(c.valor) + 1;
  update_('SYS_Contadores', id, { valor: v });
  return v;
}

// ---------- conversión de valores ----------

/** Evita que un texto capturado se interprete como fórmula al escribirse en Sheets. */
function toCell_(v) {
  if (v === undefined || v === null) return '';
  if (v instanceof Date) return isoDate_(v);
  if (typeof v === 'object') v = JSON.stringify(v);
  v = String(v);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function fromCell_(v) {
  if (v instanceof Date) return isoDate_(v);
  return v === null || v === undefined ? '' : String(v);
}

function nowIso_() { return isoDate_(new Date()); }

function isoDate_(d) {
  return Utilities.formatDate(d, APP.TZ, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function uid_(prefix) {
  return prefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16).toUpperCase();
}
