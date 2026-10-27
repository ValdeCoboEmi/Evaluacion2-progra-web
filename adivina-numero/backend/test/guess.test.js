const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../src/app');
const { createGuessService } = require('../src/services/guessService');

// ---------- Servicio (con número controlado) ----------
test('servicio: compara contra el número oculto', () => {
  const service = createGuessService(() => 0.49); // 1 + floor(0.49 * 100) = 50
  assert.equal(service.check(10), 'mayor');
  assert.equal(service.check(90), 'menor');
  assert.equal(service.check(50), 'correcto');
});

test('servicio: el número siempre está entre 1 y 100', () => {
  assert.equal(createGuessService(() => 0).check(1), 'correcto');
  assert.equal(createGuessService(() => 0.999999).check(100), 'correcto');
});

// ---------- API (servidor real en un puerto libre) ----------
let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

const post = (path, body) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

test('GET /health responde', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'success');
});

test('POST /guess rechaza datos inválidos', async () => {
  for (const number of [0, 101, 3.5, 'abc', '', null, undefined, true]) {
    const res = await post('/guess', { number });
    assert.equal(res.status, 400, `debería rechazar ${JSON.stringify(number)}`);
    assert.equal((await res.json()).status, 'error');
  }
});

test('POST /guess acepta texto numérico', async () => {
  const res = await post('/guess', { number: '50' });
  assert.equal(res.status, 200);
});

test('se puede adivinar el número por búsqueda binaria', async () => {
  let low = 1;
  let high = 100;
  let result;
  let attempts = 0;

  while (result !== 'correcto') {
    const mid = Math.floor((low + high) / 2);
    const res = await post('/guess', { number: mid });
    ({ result } = await res.json());
    if (result === 'mayor') low = mid + 1;
    if (result === 'menor') high = mid - 1;
    attempts += 1;
    assert.ok(attempts <= 7, 'la búsqueda binaria debe resolverlo en ≤ 7 intentos');
  }
});

test('POST /reset responde y deja la partida utilizable', async () => {
  const res = await post('/reset');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'success');

  const guess = await post('/guess', { number: 50 });
  assert.ok(['mayor', 'menor', 'correcto'].includes((await guess.json()).result));
});

test('ruta inexistente devuelve 404 en JSON', async () => {
  const res = await fetch(`${base}/nada`);
  assert.equal(res.status, 404);
  assert.equal((await res.json()).status, 'error');
});
