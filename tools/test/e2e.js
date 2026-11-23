/*
 * Prueba de punta a punta del frontend contra el backend simulado (gas-sim).
 * Sirve el frontend en localhost, intercepta la API de Apps Script y toma el código de acceso del correo simulado.
 * Uso: node tools/test/e2e.js   (requiere Playwright)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sim = require('./gas-sim');
const makePng = require('./png');

const API = 'https://script.google.com/macros/s/TEST/exec';
const FRONT = path.join(__dirname, '..', '..', 'frontend');
sim.props.ADMIN_EMAIL = 'admin@ejemplo.com';
sim.vm.runInContext('setup()', sim.ctx);

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(FRONT, p);
  if (!f.startsWith(FRONT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  let body = fs.readFileSync(f);
  if (p === '/config.js') body = Buffer.from(String(body).replace(/API_URL: '[^']*'/, "API_URL: '" + API + "'"));
  const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
  res.end(body);
});

let pass = 0, fail = 0;
const check = (n, c) => { if (c) { pass++; console.log('  ok   ' + n); } else { fail++; console.log('  FALLA ' + n); } };

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://localhost:' + server.address().port + '/';
  const browser = await chromium.launch();
  const errors = [];
  
  async function page(width) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'America/Chihuahua', locale: 'es-MX' });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errors.push(e.message));
    pg.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
    await pg.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await pg.route(API, async r => {
      const out = sim.post(r.request().postData());
      await r.fulfill({ status: 200, contentType: 'application/json', body: out });
    });
    return pg;
  }
  async function signIn(pg, email, recordar = true) {
    await pg.waitForSelector('#l-em');
    await pg.fill('#l-em', email);
    await pg.click('#l-send');
    await pg.waitForSelector('#l-co, #l-st:not(:empty)');
    if (!(await pg.$('#l-co'))) return;
    const code = sim.codeFor(email);
    await pg.fill('#l-co', code || '000000');
    if (!recordar) await pg.uncheck('#l-re');
    await pg.click('#l-go');
  }

  console.log('Administrador en escritorio');
  const pg = await page(1280);
  await pg.goto(base);
  await signIn(pg, 'admin@ejemplo.com');
  await pg.waitForSelector('.nav');
  check('entra y ve las 8 pantallas', (await pg.$$('.nav a')).length === 8);
  await pg.waitForFunction(() => document.querySelector('#k-ab') && !document.querySelector('#k-ab .skel'));
  check('inicio sin incidencias muestra ceros reales, no cifras inventadas', (await pg.$$eval('.kpi .v', e => e.map(x => x.textContent).join(''))) === '0000');
  check('sin referencias a fases ni versión', !/Fase \d|v0\./.test(await pg.textContent('#root')));
  await pg.click('a[href="#configuracion"]');
  await pg.waitForSelector('#uf');
  await pg.fill('#u-co', 'enf.juv@ejemplo.com');
  await pg.fill('#u-no', 'Enfermería Juventud');
  await pg.selectOption('#u-ro', 'enf');
  await pg.check('.u-pl[value="PLT-JUV"]');
  await pg.click('#u-save');
  await pg.waitForFunction(() => document.querySelector('#cfg') && document.querySelector('#cfg').textContent.includes('enf.juv@ejemplo.com'));
  check('da de alta a Enfermería desde Configuración', true);
  await pg.click('#u-save');
  await pg.waitForFunction(() => /correo válido/.test(document.querySelector('#u-err').textContent));
  check('valida el correo vacío', true);
  await pg.fill('#u-co', 'enf.juv@ejemplo.com');
  await pg.check('.u-pl[value="PLT-JUV"]');
  await pg.click('#u-save');
  await pg.waitForFunction(() => /ya está dado de alta/.test(document.querySelector('#u-err').textContent));
  check('avisa si el correo ya existe', true);
  await pg.click('[data-tab="bitacora"]');
  await pg.waitForFunction(() => /usuario\.crear/.test(document.querySelector('#cfg').textContent));
  check('bitácora visible para el admin', true);
  await pg.screenshot({ path: '/tmp/claude-0/e2e_admin.png' });
  await pg.reload();
  await pg.waitForSelector('.nav');
  check('la sesión se recuerda al recargar (escritorio)', true);
  await pg.click('#logout');
  await pg.waitForSelector('#l-em');
  check('cerrar sesión regresa al inicio de sesión', (await pg.textContent('#root')).includes('Cerraste sesión'));

  console.log('Enfermería en tablet (sin recordar el equipo)');
  const tb = await page(800);
  await tb.goto(base);
  await signIn(tb, 'enf.juv@ejemplo.com', false);
  await tb.waitForSelector('.nav');
  const navs = await tb.$$eval('.nav a', a => a.map(x => x.getAttribute('href')));
  check('no ve Configuración', !navs.includes('#configuracion'));
  await tb.goto(base + '#configuracion');
  await tb.waitForSelector('.nav');
  check('si escribe la ruta de Configuración, lo regresa a Inicio', (await tb.textContent('#view')).includes('Hola'));
  await tb.click('a[href="#nueva"]');
  await tb.waitForSelector('#n-pl');
  const opts = await tb.$$eval('#n-pl option', o => o.map(x => x.textContent));
  check('Nueva incidencia solo ofrece Juventud', opts.length === 1 && opts[0] === 'Juventud'); if (!(opts.length === 1)) console.log(opts);
  await tb.click('#w-next');
  await tb.click('[data-cat="CAT-PLA"]');
  await tb.click('[data-tipo="TIP-07"]');
  await tb.click('#w-next');
  check('muestra los campos del tipo Personal incompleto', /personal requerido/i.test(await tb.textContent('#view')));
  await tb.screenshot({ path: '/tmp/claude-0/e2e_tablet.png' });
  const stored = await tb.evaluate(() => [!!sessionStorage.getItem('fh_session'), !!localStorage.getItem('fh_session')]);
  check('tablet guarda la sesión solo mientras el navegador está abierto', stored[0] && !stored[1]);
  sim.advance(6.1 * 3600e3);
  await tb.evaluate(() => FH.call('auth.me').catch(() => {}));
  await tb.waitForSelector('#l-em');
  check('sin recordar, a las 6 h pide entrar de nuevo', /venció|terminó/.test(await tb.textContent('#root')));


  console.log('Enfermería en escritorio: registra, adjunta foto y da seguimiento');
  sim.vm.runInContext("insert_('SYS_Usuarios', { usuario_id: 'USR-SER', correo: 'ser@ejemplo.com', nombre: 'Laura Servicios', rol: 'ser', plantas: '*', activo: 'SI' }, 'prueba')", sim.ctx);
  sim.vm.runInContext("update_('SYS_Usuarios', findBy_('SYS_Usuarios','correo','enf.juv@ejemplo.com').usuario_id, { plantas: 'PLT-JUV,PLT-BAR' }, 'prueba')", sim.ctx);
  const dk = await page(1366);
  await dk.goto(base);
  await signIn(dk, 'enf.juv@ejemplo.com');
  await dk.waitForSelector('.nav');
  await dk.click('a[href="#nueva"]');
  await dk.waitForSelector('#n-pl');
  await dk.selectOption('#n-pl', 'PLT-JUV');
  const today = '2026-11-20';   // viernes ya pasado, con plantilla vigente
  await dk.fill('#n-det', today + 'T07:10');
  await dk.dispatchEvent('#n-det', 'change');
  await dk.waitForFunction(() => document.querySelector('#n-srv') && document.querySelector('#n-srv').value !== '');
  const srvSel = await dk.$eval('#n-srv', s => s.options[s.selectedIndex].textContent);
  const wk = await dk.evaluate(t => new Date(t + 'T12:00').getDay(), today);
  check('propone el desayuno según la hora (07:10)', /Desayuno/.test(srvSel));
  await dk.click('#w-next');
  await dk.click('[data-cat="CAT-PLA"]');
  await dk.click('[data-tipo="TIP-07"]');
  await dk.click('#w-next');
  await dk.waitForSelector('#f-turno_conc_id');
  if (!(await dk.$eval('#f-turno_conc_id', s => s.value))) {
    await dk.selectOption('#f-turno_conc_id', wk === 0 || wk === 6 ? 'TCO-JUV-FD' : 'TCO-JUV-1');
    await dk.dispatchEvent('#f-turno_conc_id', 'change');
  }
  await dk.waitForFunction(() => document.querySelectorAll('#f-puesto_id option').length > 1);
  await dk.selectOption('#f-puesto_id', 'PUE-AUX');
  await dk.dispatchEvent('#f-puesto_id', 'change');
  await dk.click('#w-next');
  await dk.waitForSelector('.invalid');
  check('marca los obligatorios que faltan sin enviar', (await dk.$$('.invalid')).length >= 2);
  await dk.fill('#n-desc', 'Faltaron auxiliares en la línea de desayuno');
  await dk.fill('#f-presentes', '0');
  await dk.check('input[name="f-afecto_servicio"][value="Sí"]', { force: true });
  await dk.waitForFunction(() => document.querySelector('#f-faltantes') && document.querySelector('#f-faltantes').value !== '');
  check('calcula requerido y faltantes en pantalla', Number(await dk.$eval('#f-faltantes', i => i.value)) > 0);
  await dk.setInputFiles('#n-file', { name: 'linea.png', mimeType: 'image/png', buffer: makePng(2400, 1200) });
  await dk.waitForSelector('.files li img');
  const meta = await dk.textContent('.files li');
  check('la foto se convierte a JPG antes de enviarse', /linea\.jpg/.test(meta));
  await dk.screenshot({ path: '/tmp/claude-0/e2e_nueva_paso3.png', fullPage: true });
  await dk.click('#w-next');
  await dk.waitForSelector('.folio-big');
  const folio = (await dk.textContent('.folio-big')).trim();
  check('registra y muestra el folio', /^INC-JUV-\d{4}-0001$/.test(folio));
  const files = Object.values(sim.drive);
  check('la foto llegó en JPG a la carpeta privada', files.length === 1 && files[0].mime === 'image/jpeg' && (files[0].bytes[0] & 0xff) === 0xff);
  await dk.screenshot({ path: '/tmp/claude-0/e2e_folio.png' });
  await dk.click('a.btn.pri[href^="#seguimiento/"]');
  await dk.waitForSelector('.tl');
  await dk.waitForSelector('.thumbs img');
  check('el detalle muestra la foto a través de FoodHub', true);
  check('Enfermería no ve Cerrar ni Reclasificar, sí Cancelar', !(await dk.$('[data-act="cerrar"]')) && !(await dk.$('[data-act="reclasificar"]')) && !!(await dk.$('[data-act="cancelar"]')));
  await dk.click('[data-act="afectacion"]');
  await dk.waitForSelector('#m-pr');
  await dk.fill('#m-pr', '1');
  await dk.fill('#m-tx', 'Llegó una auxiliar');
  await dk.click('#m-ok');
  await dk.waitForFunction(() => !document.querySelector('.modal-bg') && document.querySelectorAll('.detail table tbody tr').length === 2);
  check('actualiza faltantes y la afectación muestra dos periodos', true);
  await dk.screenshot({ path: '/tmp/claude-0/e2e_detalle.png', fullPage: true });

  console.log('Servicios: seguimiento, exportación y cierre');
  const sv = await page(1366);
  await sv.goto(base);
  await signIn(sv, 'ser@ejemplo.com');
  await sv.waitForSelector('.nav');
  await sv.waitForFunction(() => document.querySelector('#k-ab') && document.querySelector('#k-ab').textContent === '1');
  check('Inicio cuenta la incidencia abierta', true);
  await sv.waitForSelector('#recent tr[data-folio]');
  await sv.screenshot({ path: '/tmp/claude-0/e2e_inicio_datos.png', fullPage: true });
  await sv.click('a[href="#seguimiento"]');
  await sv.waitForSelector('#s-tbl tr[data-folio]');
  check('Servicios ve el folio en Seguimiento', (await sv.textContent('#s-tbl')).includes(folio));
  await sv.screenshot({ path: '/tmp/claude-0/e2e_seguimiento.png', fullPage: true });
  const [dl] = await Promise.all([sv.waitForEvent('download'), sv.click('#s-csv')]);
  const csv = fs.readFileSync(await dl.path(), 'utf8');
  check('CSV con BOM, acentos y el folio', csv.charCodeAt(0) === 0xFEFF && csv.includes('Día operativo') && csv.includes(folio));
  await sv.fill('#s-q', 'XXXX');
  await sv.waitForFunction(() => /^0 /.test(document.querySelector('#s-count').textContent));
  check('busca por folio', true);
  await sv.goto(base + '#seguimiento/' + folio);
  await sv.waitForSelector('[data-act="cerrar"]');
  await sv.click('[data-act="cerrar"]');
  await sv.click('#m-ok');
  await sv.waitForFunction(() => /nota de cierre/.test(document.querySelector('#m-err').textContent));
  check('cerrar sin nota no procede', true);
  await sv.fill('#m-tx', 'Plantilla completa');
  await sv.click('#m-ok');
  await sv.waitForFunction(() => !document.querySelector('.modal-bg') && /Cerrada/.test(document.querySelector('.head h1').textContent));
  check('Servicios cierra con nota', true);
  await sv.setViewportSize({ width: 390, height: 844 });
  await sv.reload();
  await sv.waitForSelector('.tl');
  check('detalle sin desplazamiento horizontal en teléfono', !(await sv.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  await sv.screenshot({ path: '/tmp/claude-0/e2e_detalle_movil.png', fullPage: true });

  console.log('Correo no autorizado');
  const x = await page(400);
  await x.goto(base);
  await signIn(x, 'intruso@ejemplo.com');
  await x.waitForSelector('#l-co');
  await x.screenshot({ path: '/tmp/claude-0/e2e_codigo.png' });
  check('correo no dado de alta: no revela si existe y no recibe código', sim.codeFor('intruso@ejemplo.com') === null);
  await x.fill('#l-co', '123456');
  await x.click('#l-go');
  await x.waitForFunction(() => /venció o ya se usó/.test(document.querySelector('#l-st').textContent));
  check('con un código inventado no entra', !(await x.$('.nav')));
  const wide = await x.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  check('sin desplazamiento horizontal en teléfono', !wide);

  check('sin errores de JavaScript', errors.length === 0);
  if (errors.length) console.log(errors);
  await browser.close();
  server.close();
  console.log(`\n${pass} correctas, ${fail} fallidas`);
  process.exit(fail ? 1 : 0);
})();
