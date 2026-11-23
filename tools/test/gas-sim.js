/* Simulación en memoria de los servicios de Google Apps Script para probar el backend en Node. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

let clockOffset = 0;
const RealDate = Date;
class FakeDate extends RealDate {
  constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + clockOffset); }
  static now() { return RealDate.now() + clockOffset; }
}

function makeSheet(name) {
  const s = { name, data: [], frozen: 0 };
  const width = () => Math.max(0, ...s.data.map(r => r.length));
  s.getLastRow = () => s.data.length;
  s.getLastColumn = () => width();
  s.getMaxRows = () => Math.max(1000, s.data.length);
  s.setFrozenRows = n => { s.frozen = n; };
  s.appendRow = row => { s.data.push(row.map(String)); };
  s.getRange = (r, c, nr = 1, nc = 1) => { const rg = {
    getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => (s.data[r - 1 + i] || [])[c - 1 + j] ?? '')),
    setValues: v => {
      v.forEach((row, i) => {
        while (s.data.length < r + i) s.data.push([]);
        row.forEach((val, j) => { s.data[r - 1 + i][c - 1 + j] = String(val); });
      });
      return rg;
    },
    setFontWeight() { return rg; },
    setNumberFormat() { return rg; }
  }; return rg; };
  return s;
}
const books = {};
function makeBook(name) {
  const id = 'ss_' + Object.keys(books).length;
  const b = { id, name, sheets: [makeSheet('Hoja 1')] };
  b.getId = () => id;
  b.getUrl = () => 'https://docs.google.com/spreadsheets/d/' + id;
  b.setSpreadsheetTimeZone = () => {};
  b.getSheetByName = n => b.sheets.find(s => s.name === n) || null;
  b.insertSheet = n => { const s = makeSheet(n); b.sheets.push(s); return s; };
  b.getSheets = () => b.sheets;
  b.deleteSheet = s => { b.sheets = b.sheets.filter(x => x !== s); };
  books[id] = b;
  return b;
}

const props = {};
const cache = {};
const mails = [];   // correos enviados
const mailQuota = { n: 100 };
const ctx = {
  Date: FakeDate, JSON, Math, console: { log() {}, error() {} }, String, Number, Object, Array, RegExp, Error,
  SpreadsheetApp: { create: makeBook, openById: id => books[id] },
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = String(v); } }) },
  CacheService: { getScriptCache: () => ({
    get: k => (cache[k] && cache[k].exp > FakeDate.now() ? cache[k].v : null),
    put: (k, v, ttl) => { cache[k] = { v, exp: FakeDate.now() + ttl * 1000 }; },
    remove: k => { delete cache[k]; },
    removeAll: ks => ks.forEach(k => delete cache[k])
  }) },
  LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
    computeDigest: (alg, s) => [...crypto.createHash(alg).update(s, 'utf8').digest()].map(b => (b > 127 ? b - 256 : b)),
    base64EncodeWebSafe: bytes => Buffer.from(bytes.map(b => b & 0xff)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    formatDate: d => new RealDate(d.getTime() - 6 * 3600e3).toISOString().slice(0, 19) + '-06:00'
  },
  MailApp: {
    getRemainingDailyQuota: () => mailQuota.n,
    sendEmail: o => { mailQuota.n--; mails.push(o); }
  },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ content: s, setMimeType() { return this; } }) }
};
vm.createContext(ctx);
const dir = path.join(__dirname, '..', '..', 'backend');
for (const f of ['Config.gs', 'Schema.gs', 'Db.gs', 'Auth.gs', 'Bitacora.gs', 'Api.gs', 'Setup.gs', 'Seed.gs']) {
  vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
}


/** Último código enviado a un correo (lo que la persona leería en su bandeja). */
const codeFor = email => {
  const m = mails.filter(x => x.to === email.toLowerCase()).pop();
  return m ? /es (\d{6})/.exec(m.subject)[1] : null;
};
function post(body) {
  vm.runInContext('DB_CACHE_ = {main: DB_CACHE_.main, log: DB_CACHE_.log}', ctx);
  return ctx.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } }).content;
}
module.exports = { ctx, vm, books, props, cache, mails, mailQuota, codeFor, post, advance: ms => { clockOffset += ms; } };
