// Run: node check.cjs. Synthetic regressions only; phone gates remain manual.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  .match(/<script>([\s\S]*?)<\/script>/)[1];

function game(search = '') {
  const nodes = new Map();
  const timers = [];
  let seed = 12345;
  const math = Object.create(Math);
  math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
  const context = vm.createContext({
    Math: math, URLSearchParams, location: { search, href: 'https://example.test/' },
    performance: { now: () => 1000 }, window: { DeviceOrientationEvent() {} },
    navigator: {}, setTimeout: callback => timers.push(callback), requestAnimationFrame() {},
    localStorage: { getItem: () => null, setItem() {} },
    document: {
      querySelectorAll: () => [...nodes.values()],
      getElementById(id) {
        if (!nodes.has(id)) {
          const classes = new Set();
          const handlers = {};
          nodes.set(id, {
            textContent: '', handlers,
            addEventListener: (event, handler) => { handlers[event] = handler; },
            classList: { add: name => classes.add(name), remove: name => classes.delete(name),
              contains: name => classes.has(name) },
          });
        }
        return nodes.get(id);
      },
    },
  });
  vm.runInContext(source, context);
  return Object.assign(code => vm.runInContext(code, context), { nodes, timers, context });
}

function validBearings(run) {
  assert.equal(run('fairies.length'), 5);
  assert.ok(run('fairies.every(f => Math.abs(f.pitch) <= CONFIG.spawnPitchRange)'));
  assert.ok(run(`fairies.every((f, i) => fairies.slice(i + 1)
    .every(other => bearingDist(f, other) >= CONFIG.minSpawnSeparation))`));
}

for (const file of ['index.html', 'gate4-pinch-spike.html']) {
  const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
}
console.log('PASS: inline JavaScript syntax');

for (const mode of ['dwell', 'tap']) {
  const run = game(`?gate1&m2&catch=${mode}`);
  run('startRound(); currentYaw = 0; currentPitch = 0; onTap()');
  assert.equal(run('gameState'), 'playing');
  assert.equal(run('fairies.length'), 1);
  assert.equal(run('fairies[0].caught'), false);
  assert.equal(run('caughtCount'), 0);
}
console.log('PASS: Gate 1 ignores tap and overrides M2');

for (const mode of ['dwell', 'tap']) {
  const run = game(`?catch=${mode}`);
  for (let round = 0; round < 100; round++) {
    run('startRound()');
    assert.equal(run('gameState'), 'playing');
    assert.equal(run('calibrationSamples.length'), 0);
    validBearings(run);
  }
}
console.log('PASS: M1 starts immediately with five separated random bearings');

const m2 = game('?m2&catch=tap');
m2('startRound(); fairies = [{yaw: 0, pitch: 0, caught: false}]; onTap()');
assert.equal(m2('gameState'), 'calibrating');
assert.equal(m2('fairies[0].caught'), false);
console.log('PASS: M2 requires opt-in; calibration ignores tap');

const narrow = game('?m2');
narrow(`calibrationSamples = [{yaw: -179, pitch: 0, lum: 0}, {yaw: 179, pitch: 0, lum: 1}];
  finishCalibration()`);
const random = game();
random('startRound()');
assert.equal(narrow('JSON.stringify(fairies)'), random('JSON.stringify(fairies)'));
console.log('PASS: wrap-boundary scan falls back to random');

for (const samples of [
  [{ yaw: -70, pitch: 120, lum: 0 }, { yaw: 70, pitch: 0, lum: 255 }],
  [{ yaw: -70, pitch: 0, lum: 0 }, { yaw: 70, pitch: 0, lum: 255 }],
]) {
  const run = game('?m2');
  run(`calibrationSamples = ${JSON.stringify(samples)}; finishCalibration()`);
  validBearings(run);
  if (samples[0].pitch === 0) assert.equal(run('fairies[0].yaw'), -70);
}
console.log('PASS: invalid pitch rejected; dark cluster retained without stacking');

const guidance = game();
for (const yaw of [-180, 0, 180]) {
  for (const pitch of [-60, 0, 60]) {
    for (const playerPitch of [-90, 0, 90]) {
      assert.ok(guidance(`currentYaw = 0; currentPitch = ${playerPitch};
        1 - smoothstep(CONFIG.fadeEndAngle, CONFIG.guidanceStartAngle,
          angularDistTo({yaw: ${yaw}, pitch: ${pitch}}))`) > 0);
    }
  }
}
console.log('PASS: guidance stays nonzero across supported bearing extremes');

// Retry must retain the same no-sensor guard as the first camera grant.
const retry = game();
retry('video = {}; gotOrientationEvent = false; startCamera()');
assert.equal(retry.timers.length, 1);
retry.timers.shift()();
assert.ok(retry.nodes.get('screen-error').classList.contains('active'));
retry.nodes.get('btn-retry').handlers.click();
retry('startCamera(); onOrientation({alpha: 0, beta: 90, gamma: 0})');
retry.timers.shift()();
assert.ok(retry.nodes.get('screen-game').classList.contains('active'));
console.log('PASS: reused camera rejects absent sensors and accepts real orientation data');

const glow = game();
glow(`canvas = {width: 390, height: 844};
  const glowCenters = [];
  ctx = { save() {}, restore() {}, fillRect() {},
    createRadialGradient(x, y) { glowCenters.push([x, y]); return {addColorStop() {}}; } };
  drawEdgeGlow(0, 90, 1); drawEdgeGlow(0, -90, 1);
  drawEdgeGlow(90, 0, 1); drawEdgeGlow(-90, 0, 1); drawEdgeGlow(90, 90, 1);
  drawEdgeGlow(0, 0, 1);`);
assert.equal(glow('JSON.stringify(glowCenters)'), JSON.stringify([
  [195, 0], [195, 844], [390, 422], [0, 422], [390, 227],
]));
console.log('PASS: portrait guidance reaches top, bottom, sides, and diagonal edge');

for (const mode of ['tap', 'dwell']) {
  const run = game(`?catch=${mode}`);
  const instructions = run.nodes.get('catch-instructions').textContent;
  assert.match(instructions, /Turn and tilt/);
  assert.match(instructions, mode === 'tap' ? /tap anywhere/ : /Hold one/);
}
console.log('PASS: onboarding explains aiming and the selected catch mode');

(async () => {
  const fresh = game();
  fresh.context.navigator.mediaDevices = { getUserMedia: async () => ({}) };
  fresh('CONFIG.audioShimmerEnabled = false; resizeCanvas = () => {}; startCamera()');
  fresh.nodes.get('canvas').getContext = () => ({});
  fresh.context.window.addEventListener = () => {};
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fresh.timers.length, 1);
  fresh.timers.shift()();
  assert.ok(fresh.nodes.get('screen-error').classList.contains('active'));
  console.log('PASS: first camera grant also rejects absent sensors');

  for (const result of ['success', 'denied', 'unavailable']) {
    const run = game();
    if (result !== 'unavailable') run.context.navigator.clipboard = {
      writeText: async url => {
        assert.equal(url, 'https://example.test/');
        if (result === 'denied') throw new Error('clipboard denied');
      },
    };
    run('endRound()');
    assert.equal(run.nodes.get('btn-share').textContent, 'Copy link');
    await run.nodes.get('btn-share').handlers.click();
    assert.match(run.nodes.get('share-status').textContent,
      result === 'success' ? /Link copied/ : /Could not copy.*https:\/\/example.test\//);
  }
  const share = game();
  let shared;
  share.context.navigator.share = data => { shared = data; return Promise.resolve(); };
  share('endRound()');
  assert.equal(share.nodes.get('btn-share').textContent, 'Share');
  await share.nodes.get('btn-share').handlers.click();
  assert.equal(shared.url, 'https://example.test/');
  console.log('PASS: share and copy paths report success, denial, and unavailable clipboard');
})().catch(error => { console.error(error); process.exitCode = 1; });
