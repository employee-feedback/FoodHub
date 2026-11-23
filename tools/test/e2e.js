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
  if (p === '/config.js') body = Buffer.from(String(body).replace('PEGAR_AQUI_URL_EXEC', API));
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
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
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
  check('inicio muestra 41 servicios del catálogo', (await pg.textContent('#view')).includes('41'));
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
