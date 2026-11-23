/**
 * FoodHub — instalación y migración de la base de datos.
 *
 * Ejecutar setup() una vez desde el editor de Apps Script con la cuenta de FoodHub.
 * Es seguro volver a ejecutarlo: crea solo lo que falte y nunca borra datos.
 */

function setup() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('PEPPER')) props.setProperty('PEPPER', randomToken_() + randomToken_());

  var main = props.getProperty('DB_ID') ? SpreadsheetApp.openById(props.getProperty('DB_ID')) : SpreadsheetApp.create('FoodHub – Base de datos');
  var log = props.getProperty('LOG_ID') ? SpreadsheetApp.openById(props.getProperty('LOG_ID')) : SpreadsheetApp.create('FoodHub – Bitácora');
  props.setProperty('DB_ID', main.getId());
  props.setProperty('LOG_ID', log.getId());
  main.setSpreadsheetTimeZone(APP.TZ);
  log.setSpreadsheetTimeZone(APP.TZ);
  DB_CACHE_ = { main: main, log: log };

  var report = [];
  Object.keys(SEED).forEach(function (name) {
    ensureSheet_(main, name, SEED[name].headers.concat(STD), report);
    seedIfEmpty_(main, name, SEED[name], report);
  });
  Object.keys(SCHEMA).forEach(function (name) {
    ensureSheet_(main, name, NO_STD[name] ? SCHEMA[name] : SCHEMA[name].concat(STD), report);
  });
  Object.keys(LOG_SCHEMA).forEach(function (name) { ensureSheet_(log, name, LOG_SCHEMA[name], report); });

  [main, log].forEach(function (ss) {
    var def = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
    if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  });

  var admin = (props.getProperty('ADMIN_EMAIL') || '').trim().toLowerCase();
  if (admin && !findBy_('SYS_Usuarios', 'correo', admin)) {
    insert_('SYS_Usuarios', { usuario_id: uid_('USR'), correo: admin, nombre: 'Administrador', rol: 'adm', plantas: '*', activo: 'SI' }, 'setup');
    report.push('Administrador creado: ' + admin);
  }
  if (!admin) report.push('AVISO: no hay ADMIN_EMAIL; agrega la propiedad y vuelve a ejecutar setup().');

  CacheService.getScriptCache().removeAll(Object.keys(SEED).concat(Object.keys(SCHEMA)).map(function (n) { return 'tbl:' + n; }));
  report.unshift('Base de datos: ' + main.getUrl(), 'Bitácora: ' + log.getUrl());
  console.log(report.join('\n'));
  return report;
}

function ensureSheet_(ss, name, headers, report) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), headers.length).setNumberFormat('@');
    report.push('Hoja creada: ' + name);
    return sh;
  }
  var cur = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(String);
  var missing = headers.filter(function (h) { return cur.indexOf(h) < 0; });
  if (missing.length) {
    var start = cur.filter(String).length + 1;
    sh.getRange(1, start, 1, missing.length).setValues([missing]).setFontWeight('bold');
    sh.getRange(1, start, sh.getMaxRows(), missing.length).setNumberFormat('@');
    report.push('Columnas agregadas en ' + name + ': ' + missing.join(', '));
  }
  return sh;
}

function seedIfEmpty_(ss, name, seed, report) {
  var sh = ss.getSheetByName(name);
  if (sh.getLastRow() > 1 || !seed.rows.length) return;
  var now = nowIso_();
  var rows = seed.rows.map(function (r) {
    return r.map(function (v) { return toCell_(v); }).concat([now, 'setup', now, 'setup', '1', 'SI']);
  });
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  report.push('Catálogo cargado: ' + name + ' (' + rows.length + ' registros)');
}
