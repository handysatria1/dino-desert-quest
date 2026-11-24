(() => {
  'use strict';
  const $ = s => document.querySelector(s), T = window.THREE, catalog = window.WonderPlaces;
  const canvas = $('#view'), root = $('#world'), overlay = $('#overlay');
  let renderer;
  try { if (!T || !catalog) throw Error('Missing local engine'); renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' }); }
  catch { $('#fallback').hidden = false; window.Recitation?.hold('unavailable', true); return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25)); renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene(); scene.background = new T.Color('#b9ddd6'); scene.fog = new T.Fog('#b9ddd6', 140, 340);
  const camera = new T.OrthographicCamera(-30, 30, 22, -22, .1, 500);
  const driverCamera = new T.PerspectiveCamera(78, 1, .08, 500);
  const followCamera = new T.PerspectiveCamera(63, 1, .12, 600);
  const orbit = { yaw: 0, pitch: .30, lastLook: -100, driverYaw: 0, driverPitch: 0 };
  let exploreView = 'follow', lookPointer = null, lookStart = null, lookLast = null, dragged = false;
  const trunks = [];
  let interior = null, entranceIntent = false, driverView = true, outsidePosition = null;
  const interiorCache = new Map();
  const sun = new T.DirectionalLight('#fff0d5', 2.6); sun.position.set(-40, 85, 45); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 180 }); sun.shadow.normalBias = .12; sun.shadow.bias = -.0004;
  scene.add(sun, sun.target, new T.HemisphereLight('#eaf4df', '#78946a', 2.1));
  const materials = new Map(), geometry = { box: new T.BoxGeometry(1, 1, 1), ball: new T.IcosahedronGeometry(1, 1) };
  function mat(color) { if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({ color, roughness: .9, flatShading: true })); return materials.get(color); }
  function mesh(parent, geo, color, x, y, z, sx = 1, sy = sx, sz = sx) { const m = new T.Mesh(geo, mat(color)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
  function group(x = 0, y = 0, z = 0, parent = scene) { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g; }
  const box = (p, c, x, y, z, sx, sy, sz) => mesh(p, geometry.box, c, x, y, z, sx, sy, sz);
  const ball = (p, c, x, y, z, sx, sy = sx, sz = sx) => mesh(p, geometry.ball, c, x, y, z, sx, sy, sz);
  function cylinder(p, color, x, y, z, top, bottom, height, sides = 10) { return mesh(p, new T.CylinderGeometry(top, bottom, height, sides), color, x, y, z); }
  function segment(p, color, a, b, radius = .12) { const start = new T.Vector3(...a), end = new T.Vector3(...b), d = end.clone().sub(start); const m = cylinder(p, color, 0, 0, 0, radius, radius, d.length(), 6); m.position.copy(start.add(end).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m; }
  function disk(p, color, x, z, radius, y = p === scenery ? .035 : .32, rz = radius) { const d = cylinder(p, color, x, y, z, radius, radius, .08, 40); d.scale.z = rz / radius; d.castShadow = false; return d; }
  function arch(p, color, x, y, z, width, height) {
    const thickness = .55, opening = width - thickness;
    for (const side of [-1, 1]) box(p, color, x + side * opening / 2, y + (height - width / 2) / 2, z, thickness, height - width / 2, 1);
    const top = new T.Mesh(new T.TorusGeometry(opening / 2, .35, 4, 9, Math.PI), mat(color)); top.position.set(x, y + height - width / 2, z); top.castShadow = top.receiveShadow = true; p.add(top);
  }
  function sign(text, x, y, z, width = 8, color = '#355c45') {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff8df'; ctx.beginPath(); ctx.roundRect(2, 2, 508, 124, 27); ctx.fill(); ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 36px Trebuchet MS, sans-serif'; ctx.fillText(text, 256, 65, 475);
    const texture = new T.CanvasTexture(c); texture.colorSpace = T.SRGBColorSpace; const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture })); sprite.position.set(x, y, z); sprite.scale.set(width, width / 4, 1); scene.add(sprite); return sprite;
  }
  function tree(p, x, z, scale = 1) { const g = group(x, 0, z, p); g.scale.setScalar(scale); cylinder(g, '#9c8258', 0, 1.5, 0, .18, .3, 3); ball(g, '#6f9d6a', 0, 3.3, 0, 1.8, 2, 1.6); ball(g, '#9dbb78', -.7, 3.8, .2, 1.3, 1.3, 1.2); if (p === scenery) trunks.push({ x, z, radius: .65 * scale }); return g; }
  // Merge immutable scenery by material: a large park, without hundreds of draw calls.
  function mergeScenery(parent) {
    parent.updateMatrixWorld(true); const batches = new Map();
    parent.traverse(m => { if (!m.isMesh) return; const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld); const key = m.material;
      if (!batches.has(key)) batches.set(key, { positions: [], normals: [], count: 0 }); const b = batches.get(key); b.positions.push(g.attributes.position.array); b.normals.push(g.attributes.normal.array); b.count += g.attributes.position.array.length; g.dispose(); });
    for (const [material, b] of batches) {
      const positions = new Float32Array(b.count), normals = new Float32Array(b.count); let offset = 0;
      b.positions.forEach((arr, i) => { positions.set(arr, offset); normals.set(b.normals[i], offset); offset += arr.length; });
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(positions, 3)); g.setAttribute('normal', new T.BufferAttribute(normals, 3)); g.computeBoundingSphere(); const m = new T.Mesh(g, material);
      const groundColors = ['#b4ce91', '#e6d3a5', '#d9d6af', '#e4d8af', '#92bbad', '#d9bd80', ...catalog.places.map(p => p.ground)];
      m.castShadow = !groundColors.some(color => mat(color) === material); m.receiveShadow = true; scene.add(m);
    }
    scene.remove(parent);
  }
  const scenery = group();
  const ground = cylinder(scenery, '#b4ce91', 0, -.9, 0, 202, 200, 1.8, 96);
  cylinder(scenery, '#e6d3a5', 0, -1.7, 0, 206, 203, 1.4, 96);
  const sea = mesh(scene, new T.PlaneGeometry(1800, 1800), '#84bcb7', 0, -2.5, 0); sea.rotation.x = -Math.PI / 2; sea.castShadow = false;
  disk(scenery, '#d9d6af', 0, 0, 24);
  const places = catalog.places;
  const oldCenters = places.map(p => ({ id: p.id, x: p.x, z: p.z }));
  places.forEach(p => { p.x *= 1.4; p.z *= 1.4; });
  function road(points, width = 2.4) { const curve = new T.CatmullRomCurve3(points.map(([x, z]) => new T.Vector3(x, 0, z))); const m = mesh(scenery, new T.TubeGeometry(curve, 48, width, 5, false), '#e4d8af', 0, 0, 0); m.scale.y = .02; m.position.y = .2; }
  places.forEach(p => {
    disk(scenery, p.ground, p.x, p.z, 29);
    road([[0, 15], [p.x * .5, p.z * .5 + 18], [p.x, p.z + 22]], 2.3);
    const landmark = catalog.build({ group: (x, y, z, parent = scenery) => group(x, y, z, parent), box, ball, cylinder, segment, arch }, p);
    landmark.scale.set(p.id === 'wall' || p.id === 'petra' ? 1 : 1.15, 1.45, 1.1);
    sign(p.name.toUpperCase(), p.x, p.id === 'machu' ? 32 : 22, p.z - 4, 13);
    // A bright doorway on the safe front edge leads to a walkable cutaway room.
    arch(scenery, '#f3d182', p.x, .25, p.z + 7, 3.6, 4.8);
    disk(scenery, '#efcf83', p.x, p.z + 8, 2.3, .28);
    sign('INSIDE →', p.x, 5.8, p.z + 7, 5.5);
    for (const side of [-1, 1]) { tree(scenery, p.x + side * 24, p.z + 4, 1.2); tree(scenery, p.x + side * 20, p.z + 23, .9); }
  });
  // A loop road joins the districts, as well as the central garden paths.
  const loop = places.map(p => [p.x * 1.2, p.z * 1.2 + 6]); road([...loop, loop[0], loop[1]], 2.6);
  for (let i = 0; i < 84; i++) { const a = i * 2.39996, r = 170 + i % 4 * 6; tree(scenery, Math.cos(a) * r, Math.sin(a) * r, 1.2 + i % 3 * .3); }
  // Distant islands and clouds give the ground-level camera a real horizon.
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4, r = 250 + i % 3 * 30;
    ball(scenery, '#8eae95', Math.cos(a) * r, -2, Math.sin(a) * r, 25 + i % 3 * 9, 10 + i % 4 * 6, 22);
    const cloud = group(Math.cos(a) * (r - 20), 49 + i % 4 * 8, Math.sin(a) * (r - 20), scenery);
    for (let j = 0; j < 3; j++) { const puff = ball(cloud, '#edf0de', j * 5, j % 2 * 2, 0, 6, 2.5, 4); puff.castShadow = false; }
  }
  const camp = group(10, 0, -1, scenery);
  cylinder(camp, '#e4b975', 0, 2, 0, 0, 4, 4, 4); box(camp, '#698d79', 0, 1.2, 2.7, 1.9, 2.5, .15); box(camp, '#a8c3a0', 5, .12, 2, 4, .12, 3);
  sign('QUIET CAMP', 10, 6, -1, 8); sign('DINOSAUR ISLAND', -12, 4.5, 0, 10);
  disk(scenery, '#92bbad', -12, 0, 4, .3); disk(scenery, '#d9bd80', 10, -1, 5.5, .3);
  mergeScenery(scenery);

  const key = 'little-explorer-wonder-world-v1'; let stored = {}, storageOK = true;
  try { const raw = JSON.parse(localStorage.getItem(key) || '{}'); if (raw && typeof raw === 'object') stored = raw; } catch { storageOK = false; }
  const ids = places.map(p => p.id), allowed = a => [...new Set(Array.isArray(a) ? a.filter(id => ids.includes(id)) : [])];
  const state = { progress: {}, rounds: {}, completed: allowed(stored.completed), visited: allowed(stored.visited), voice: stored.voice !== false };
  places.forEach(p => { const n = stored.progress?.[p.id], r = stored.rounds?.[p.id]; state.progress[p.id] = Number.isInteger(n) ? Math.max(0, Math.min(p.total, n)) : 0; state.rounds[p.id] = Number.isInteger(r) ? Math.max(0, Math.min(999, r)) : 0; if (state.progress[p.id] === p.total && !state.completed.includes(p.id)) state.completed.push(p.id); });
  const position = new T.Vector3(0, 0, 21), carPosition = new T.Vector3(4, 0, 20);
  const blockers = places.map(p => ({ x: p.x, z: p.z - 6, w: p.id === 'wall' ? 22 : 17, d: 12 }));
  // Lightweight collision proxies avoid ray-testing the whole landscape every frame.
  const cameraBoxes = [...blockers.map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d, height: 25 })), ...trunks.map(t => ({ x: t.x, z: t.z, w: t.radius, d: t.radius, height: 4.5 }))].map(b => {
    const proxy = new T.Mesh(geometry.box); proxy.position.set(b.x, b.height / 2, b.z); proxy.scale.set(b.w * 2, b.height, b.d * 2); proxy.updateMatrixWorld(true); return proxy;
  });
  function walkable(x, z) {
    if (interior) return Math.abs(x) < 10.8 && z > -8.6 && z < 9 && !interior.blocks.some(b => Math.abs(x - b.x) < b.w && Math.abs(z - b.z) < b.d);
    return Math.hypot(x, z) < 195 && !blockers.some(b => Math.abs(x - b.x) < b.w && Math.abs(z - b.z) < b.d) && !trunks.some(t => Math.hypot(x - t.x, z - t.z) < t.radius);
  }
  function safePoint(x, z) {
    if (interior) {
      x = Math.max(-10.5, Math.min(10.5, Number.isFinite(x) ? x : 0)); z = Math.max(-8.3, Math.min(8.7, Number.isFinite(z) ? z : 6));
      if (walkable(x, z)) return new T.Vector3(x, 0, z);
      for (let r = .5; r < 25; r += .5) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (walkable(px, pz)) return new T.Vector3(px, 0, pz); }
      return new T.Vector3(0, 0, 6);
    }
    x = Math.max(-194, Math.min(194, Number.isFinite(x) ? x : 0)); z = Math.max(-194, Math.min(194, Number.isFinite(z) ? z : 21));
    if (walkable(x, z)) return new T.Vector3(x, 0, z);
    for (let r = 2; r < 240; r += 2) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (walkable(px, pz)) return new T.Vector3(px, 0, pz); }
    return new T.Vector3(0, 0, 21);
  }
  if (Number.isFinite(stored.x) && Number.isFinite(stored.z)) {
    let x = stored.x, z = stored.z;
    if (stored.layout !== 2) {
      const old = oldCenters.find(p => Math.hypot(x - p.x, z - p.z) < 40);
      if (old) { x += old.x * .4; z += old.z * .4; }
      else if (Math.hypot(x, z) > 30) { x *= 1.4; z *= 1.4; }
    }
    position.copy(safePoint(x, z)); carPosition.copy(safePoint(position.x + 4, position.z));
  }
  function save() { const p = interior ? outsidePosition : position; try { localStorage.setItem(key, JSON.stringify({ ...state, layout: 2, x: p.x, z: p.z })); } catch { storageOK = false; } }
  let mode = 'title', started = false, riding = false, time = 0, last = 0, speed = 0, hop = 0, hopSpeed = 0, heading = Math.PI, nearest = null, currentPlace = null, message = '', speechToken = 0, target = null, route = [], saveTime = 0, toastTimer = null, moving = false;
  const keys = new Set(), joy = new T.Vector2(); let joyPointer = null;
  function clearInput() { keys.clear(); joy.set(0, 0); joyPointer = null; lookPointer = null; lookStart = lookLast = null; dragged = false; $('#stick').style.transform = ''; }
  function stopWalk() { target = null; route = []; $('#route').hidden = true; }
  function stopVoice() { speechToken++; window.Recitation?.hold('world-speech', false); if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  function speak(text) {
    stopVoice(); if (!state.voice || !('speechSynthesis' in window) || document.hidden) return;
    const token = speechToken, u = new SpeechSynthesisUtterance(text); u.lang = 'en-GB'; u.rate = .86; u.pitch = 1.08;
    const voices = speechSynthesis.getVoices(); u.voice = voices.find(v => v.lang.startsWith('en-GB')) || voices.find(v => v.lang.startsWith('en')) || null;
    u.onend = u.onerror = () => { if (token === speechToken) window.Recitation?.hold('world-speech', false); };
    window.Recitation?.hold('world-speech', true); try { speechSynthesis.speak(u); } catch { window.Recitation?.hold('world-speech', false); }
  }
  function say(text) { message = text; $('#message').textContent = text; speak(text); }
  function active() { return mode === 'play' && !document.hidden && !$('#recitation-dialog').open; }
  function setMode(next) {
    stopVoice(); clearInput(); stopWalk(); overlay.querySelector('iframe')?.contentWindow?.postMessage('little-explorer:stop-audio', '*'); mode = next;
    window.Recitation?.hold('world-menu', !['play', 'title'].includes(next));
    ['#topbar', '#controls', '#guide', '#task', '#view-tools'].forEach(id => { $(id).hidden = next !== 'play'; });
    overlay.classList.toggle('shaded', next !== 'play'); overlay.innerHTML = '';
    if (next === 'play') canvas.focus({ preventScroll: true });
  }
  function focusCard() { const title = overlay.querySelector('h2,h1'); if (title) { title.tabIndex = -1; title.focus({ preventScroll: true }); } }
  function closeButton(action = 'resume') { return `<button class="close" data-act="${action}" aria-label="Back to playing">×</button>`; }
  function toast(text) { $('#toast').textContent = text; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3000); }

  function explorer() {
    const p = group(), body = group(0, 0, 0, p), legs = [], arms = [];
    for (const side of [-1, 1]) {
      const leg = group(side * .23, .6, 0, body); box(leg, '#59725e', 0, -.25, 0, .28, .6, .3); ball(leg, '#9b7955', 0, -.5, .12, .22, .15, .32); legs.push(leg);
      const arm = group(side * .54, 1.35, 0, body); ball(arm, '#eab85a', 0, -.12, 0, .21, .29, .21); ball(arm, '#e6b37a', 0, -.43, 0, .16, .25, .17); arms.push(arm);
    }
    ball(body, '#eab85a', 0, 1.05, 0, .6, .65, .4); box(body, '#87a973', 0, 1.1, -.4, .65, .7, .3); ball(body, '#e8bb8b', 0, 2, .02, .5, .52, .47);
    for (const side of [-1, 1]) ball(body, '#355145', side * .18, 2.04, .45, .06, .09, .04);
    cylinder(body, '#f2d79c', 0, 2.4, 0, .8, .8, .14, 12); cylinder(body, '#edc87e', 0, 2.62, 0, .46, .55, .4, 10);
    return { model: p, legs, arms };
  }
  const player = explorer(), buggy = group(carPosition.x, 0, carPosition.z), wheels = [];
  box(buggy, '#e9b456', 0, .8, 0, 2.6, .8, 3.7); box(buggy, '#f4cf83', 0, 1.2, 1.3, 2.5, .45, 1.1); box(buggy, '#779a84', 0, 1.3, -.7, 2, .45, 1.6);
  for (const x of [-1.45, 1.45]) for (const z of [-1.15, 1.15]) { const wheel = cylinder(buggy, '#48665b', x, .55, z, .58, .58, .36, 10); wheel.rotation.z = Math.PI / 2; const cap = ball(buggy, '#e4d4aa', x * 1.03, .55, z, .12, .3, .3); wheels.push(wheel); }
  for (const x of [-1, 1]) { segment(buggy, '#f3e2b4', [x, 1.4, -1.3], [x, 3.2, -1.3]); segment(buggy, '#f3e2b4', [x, 1.4, 1], [x, 3.2, 1]); ball(buggy, '#fff3bb', x, 1.15, 1.9, .24, .2, .08); }
  box(buggy, '#83b6a5', 0, 3.25, -.2, 3, .25, 3.3);
  const wheel = mesh(buggy, new T.TorusGeometry(.35, .06, 5, 12), '#48665b', 0, 1.7, .5); wheel.rotation.x = .7;
  // Real in-world cockpit, seen from the driver's eye rather than a flat overlay.
  wheel.position.set(0, 2.12, .9); wheel.rotation.x = -.25;
  segment(buggy, '#48665b', [0, 1.5, 1.2], [0, 2.12, .9], .07);
  box(buggy, '#d7bc84', 0, 1.72, 1.25, 2.2, .32, .55);
  box(buggy, '#48665b', .62, 1.94, 1.13, .48, .22, .12);
  for (const x of [-.18, 0, .18]) segment(buggy, '#e4d4aa', [0, 2.12, .88], [x || .26, x ? 1.87 : 2.12, .88], .025);
  const speedDots = Array.from({ length: 4 }, (_, i) => ball(buggy, '#a5d2a3', .46 + i * .1, 1.98, 1.05, .035));
  const pip = group(-1.7, 0, 22.2); ball(pip, '#7eafa0', 0, .55, 0, .55, .55, .8); segment(pip, '#7eafa0', [0, .6, .4], [0, 1.5, .7], .22); ball(pip, '#99c2ab', 0, 1.55, .8, .35, .3, .5);
  pip.scale.setScalar(.85);
  for (const side of [-1, 1]) { ball(pip, '#355145', side * .26, 1.62, 1, .055); ball(pip, '#e5d3a2', side * .27, .18, .3, .15, .18, .16); }
  segment(pip, '#7eafa0', [0, .55, -.5], [0, .5, -1.3], .2);
  const carried = group(), carriedStone = ball(carried, '#c2ba98', 0, 0, 0, .5, .4, .45); carried.visible = false;
  const beachBall = ball(scene, '#e8a76f', -4, 1, 15, .85), ballVelocity = new T.Vector3();
  const band = mesh(beachBall, new T.TorusGeometry(.8, .1, 5, 20), '#fff0b4', 0, 0, 0); band.rotation.x = .8;
  const activityModels = new Map(), birds = [];
  function at(p, x, z) { return { x: p.x + x, z: p.z + z }; }
  const colors = ['#d9826b', '#edc75f', '#7cb6c3'];
  places.forEach(p => {
    const m = { group: group(p.x, 0, p.z), pieces: [], markers: [], effects: 0 }; activityModels.set(p.id, m);
    if (p.id === 'wall') {
      for (let i = 0; i < 3; i++) { m.pieces.push(ball(m.group, '#b5b493', -10 + i * 1.1, .7, 14, .7, .65, .65)); const stone = box(m.group, '#c7b78f', 7 + i * 2, .9, 12, 1.9, 1.8, 1.5); m.markers.push(stone); }
      sign('MODEL WALL', p.x + 9, 4, p.z + 12, 7);
    } else if (p.id === 'petra') {
      [[-10, 15], [0, 24], [10, 15]].forEach(([x, z], i) => { const g = group(x, 0, z, m.group); arch(g, colors[i], 0, 0, 0, 4.4, 5.4); disk(g, colors[i], 0, 0, 2); m.markers.push(g); });
    } else if (p.id === 'taj') {
      for (let i = 0; i < 6; i++) { const x = i % 2 ? 7 : -7, z = 13 + Math.floor(i / 2) * 6; disk(m.group, '#a4a77d', x, z, 2.2); const flowers = group(x, 0, z, m.group); for (let j = 0; j < 5; j++) { const a = j * 2.4; segment(flowers, '#6c995c', [Math.cos(a), 0, Math.sin(a)], [Math.cos(a), 1.1, Math.sin(a)], .07); ball(flowers, colors[Math.floor(i / 2)], Math.cos(a), 1.1, Math.sin(a), .4, .22, .4); } m.pieces.push(flowers); }
    } else if (p.id === 'colosseum') {
      box(m.group, '#d8bd8b', 0, .65, 16, 8, 1.3, 4); sign('BUILD AN ARCH', p.x, 4.7, p.z + 16, 8);
      const toy = group(0, 1.3, 16, m.group); m.pieces.push(box(toy, '#d1a56a', -1.6, 1.3, 0, .9, 2.6, 1)); m.pieces.push(box(toy, '#d1a56a', 1.6, 1.3, 0, .9, 2.6, 1));
      const top = mesh(toy, new T.TorusGeometry(1.6, .45, 4, 12, Math.PI), '#e2bb7e', 0, 2.6, 0); m.pieces.push(top);
    } else if (p.id === 'chichen') {
      [[-10, 15], [-5, 21], [0, 25], [5, 21], [10, 15]].forEach(([x, z], i) => { m.markers.push(disk(m.group, '#dcc791', x, z, 2)); const number = sign(`${i + 1}${i === 1 || i === 3 ? '  HOP ↑' : ''}`, p.x + x, 2.6, p.z + z, 3.5); m.pieces.push(number); });
    } else if (p.id === 'machu') {
      const llama = group(-11, 0, 14, m.group); ball(llama, '#f0e0b6', 0, .9, 0, .65, .65, 1.05); segment(llama, '#e5d1a4', [0, 1, .65], [0, 2.3, .9], .25); ball(llama, '#f4e7c9', 0, 2.3, 1.05, .4, .35, .5);
      for (const side of [-1, 1]) { ball(llama, '#f0e0b6', side * .2, 2.9, .9, .09, .45, .12); ball(llama, '#45634e', side * .3, 2.4, 1.25, .06); }
      const legs = []; for (const x of [-.4, .4]) for (const z of [-.65, .65]) { const leg = box(llama, '#b5a080', x, .35, z, .2, .7, .22); legs.push(leg); }
      m.llama = llama; m.legs = legs; disk(m.group, '#acd18a', 12, 17, 4); for (const z of [13, 21]) for (const x of [8, 16]) cylinder(m.group, '#b49564', x, .8, z, .12, .15, 1.6); segment(m.group, '#c9af7b', [8, 1.2, 21], [16, 1.2, 21]);
    } else if (p.id === 'rio') {
      [[-10, 14], [0, 24], [10, 14]].forEach(([x, z]) => { disk(m.group, '#b8a279', x, z, 2); m.pieces.push(tree(m.group, x, z)); });
      for (let i = 0; i < 6; i++) { const bird = group(p.x, 5, p.z + 12), wings = []; for (const side of [-1, 1]) { const wing = ball(bird, i % 2 ? '#efd28b' : '#82b9bc', side * .3, 0, 0, .38, .07, .2); wings.push(wing); } birds.push({ model: bird, wings, phase: i * 1.7 }); }
    }
  });
  const goalRing = mesh(scene, new T.TorusGeometry(2.1, .13, 5, 36), '#fff3ae', 0, .2, 0); goalRing.rotation.x = -Math.PI / 2;
  const arrow = mesh(scene, new T.ConeGeometry(.65, 1.2, 3), '#f3c158', 0, 4.5, 0); arrow.rotation.z = Math.PI;
  const trail = Array.from({ length: 15 }, () => disk(scene, '#fff3c1', 0, 0, .15, .45));
  const sparkles = Array.from({ length: 18 }, (_, i) => { const model = ball(scene, i % 2 ? '#fff0ae' : '#a2d7c6', 0, 0, 0, .12); model.visible = false; return { model, life: 0, vx: 0, vy: 0, vz: 0 }; });

  function doorway(p) { return { x: p.x, z: p.z + 8.5, icon: '🚪', verb: 'ENTER', text: `Go inside ${p.name}`, kind: 'enter' }; }
  function interiorGoal() {
    const h = interior.hotspots.find(h => !h.seen) || interior.hotspots[interior.next % interior.hotspots.length];
    return { ...h, verb: 'LOOK', kind: 'inspect' };
  }
  function playGoal() { return interior ? interiorGoal() : currentPlace ? entranceIntent ? doorway(currentPlace) : goal(currentPlace) : null; }
  function refreshView() {
    $('#inside').hidden = !currentPlace;
    $('#inside b').textContent = interior ? 'OUT' : 'IN';
    $('#inside').setAttribute('aria-label', interior ? 'Go back outside' : `Find the entrance to ${currentPlace?.name || 'the building'}`);
    $('#camera-mode').hidden = false;
    $('#camera-mode').setAttribute('aria-pressed', String(riding ? driverView : exploreView === 'follow'));
    $('#camera-mode').setAttribute('aria-label', riding ? driverView ? 'Switch to outside camera' : 'Switch to driver seat camera' : exploreView === 'follow' ? 'Switch to overhead camera' : 'Switch to third person camera');
    $('#camera-mode span').textContent = riding ? driverView ? '🚙' : '👀' : exploreView === 'follow' ? '🗺️' : '🧒';
    $('#camera-mode b').textContent = riding ? driverView ? 'OUTSIDE' : 'DRIVER' : exploreView === 'follow' ? 'ABOVE' : 'FOLLOW';
    $('#hop').hidden = riding;
    root.classList.toggle('driving', riding && driverView);
    root.classList.toggle('immersive', riding && driverView || exploreView === 'follow');
    $('#joystick .arrows').innerHTML = riding && driverView ? '↑<br>↶　↷<br>↓' : '↑<br>←　→<br>↓';
    $('#joystick').setAttribute('aria-label', riding && driverView ? 'Slide up to drive, left or right to steer, down to reverse' : 'Slide to walk or drive');
  }
  function leaveInterior(aloud = true) {
    if (!interior) return;
    [player.model, pip, goalRing, arrow, ...trail].forEach(m => scene.add(m));
    interior = null; entranceIntent = false; position.copy(outsidePosition); outsidePosition = null;
    clearInput(); stopWalk(); speed = hop = hopSpeed = 0; heading = 0; resetCamera(); camFocus.copy(position); pip.position.set(position.x + 1.7, .3, position.z - 1.2); resize(); updateHUD(); syncModels(); save();
    if (aloud) say(`Back outside ${currentPlace.name}! Your buggy and your adventure are waiting.`);
  }
  function enterInterior() {
    if (!currentPlace || interior || !window.WonderInteriors) return;
    const p = currentPlace;
    if (!interiorCache.has(p.id)) interiorCache.set(p.id, { ...window.WonderInteriors.build({ T, box, ball, cylinder, segment, arch, group }, p), next: 0 });
    if (riding) carPosition.copy(position);
    riding = false; entranceIntent = false; outsidePosition = new T.Vector3(p.x, 0, p.z + 12.5);
    interior = interiorCache.get(p.id); position.set(0, 0, 5.5); heading = Math.PI; speed = hop = hopSpeed = 0;
    clearInput(); stopWalk(); [player.model, pip, goalRing, arrow, ...trail].forEach(m => interior.scene.add(m));
    player.model.position.copy(position); pip.position.set(-1.7, .3, 6.7); resetCamera(); camFocus.set(0, 0, 0); resize(); updateHUD(); syncModels(); save();
    say(`${interior.welcome} Swipe the world to look around. Walk back through the doorway or tap Out to leave. Pip can show you each discovery.`);
  }
  function inspect(h) {
    h.seen = true; h.changed = !h.changed; h.animate?.(h.changed); interior.next = (interior.hotspots.indexOf(h) + 1) % interior.hotspots.length;
    say(h.fact); toast(`${h.icon} ${h.text}`); updateHUD();
  }
  function insideButton() {
    if (!active()) return;
    if (interior) { leaveInterior(); return; }
    if (!currentPlace) return;
    const d = doorway(currentPlace);
    if (Math.hypot(position.x - d.x, position.z - d.z) < 3.8) enterInterior();
    else { entranceIntent = true; go({ ...d, text: 'Let’s find the bright doorway. Tap Enter when we arrive' }); updateHUD(); }
  }

  function step(p) { return state.progress[p.id]; }
  function gateOrder(p) { return state.rounds[p.id] % 2 ? [2, 1, 0] : [0, 1, 2]; }
  function goal(p) {
    const n = step(p), done = n === p.total; let point, icon = p.icon, verb = p.verb, text = p.activity;
    if (done) { point = at(p, 0, 21); icon = '↻'; verb = 'AGAIN'; text = 'Play this adventure again'; }
    else if (p.id === 'wall') { point = at(p, n % 2 ? 9 : -9, 14); icon = n % 2 ? '🧱' : '🪨'; verb = n % 2 ? 'BUILD' : 'LIFT'; text = n % 2 ? `Build with stone ${Math.floor(n / 2) + 1}` : `Find stone ${Math.floor(n / 2) + 1}`; }
    else if (p.id === 'petra') { const i = gateOrder(p)[n]; point = at(p, ...[[-10, 15], [0, 24], [10, 15]][i]); icon = ['🔴', '🟡', '🔵'][i]; text = `Through the ${['red', 'yellow', 'blue'][i]} arch`; }
    else if (p.id === 'taj') { point = at(p, n % 2 ? 7 : -7, 13 + Math.floor(n / 2) * 6); icon = '💧'; text = n % 2 ? 'Water its matching partner' : 'Water a little flower bed'; }
    else if (p.id === 'colosseum') { point = at(p, 0, 19); icon = '🧩'; text = 'Fit the shapes in our toy arch'; }
    else if (p.id === 'chichen') { point = at(p, ...[[-10, 15], [-5, 21], [0, 25], [5, 21], [10, 15]][n]); icon = n === 1 || n === 3 ? '↑' : '👣'; text = `${n === 1 || n === 3 ? 'Hop on' : 'Walk to'} stone ${n + 1}`; }
    else if (p.id === 'machu') { const m = activityModels.get(p.id); point = n === 0 ? { x: p.x + m.llama.position.x, z: p.z + m.llama.position.z } : at(p, ...[[-5, 23], [4, 27], [12, 17]][n - 1]); icon = '🦙'; text = n === 0 ? 'Invite the little llama' : n === 3 ? 'Welcome the llama home' : 'Walk with the little llama'; verb = n === 3 ? 'HOME' : 'HELP'; }
    else { point = at(p, ...[[-10, 14], [0, 24], [10, 14]][Math.floor(n / 2)]); icon = n % 2 ? '💧' : '🌱'; verb = n % 2 ? 'WATER' : 'PLANT'; text = n % 2 ? 'Water your new tree' : 'Plant a tree for the birds'; }
    return { ...point, icon, verb, text, done, place: p };
  }
  function syncModels() {
    places.forEach(p => {
      const m = activityModels.get(p.id), n = step(p);
      if (p.id === 'wall') { m.pieces.forEach((piece, i) => { piece.visible = i >= Math.ceil(n / 2); }); m.markers.forEach((piece, i) => { piece.visible = i < Math.floor(n / 2); }); }
      if (p.id === 'taj') m.pieces.forEach((flowers, i) => flowers.scale.setScalar(i < n ? 1 : .15));
      if (p.id === 'colosseum') m.pieces.forEach((piece, i) => { piece.visible = i < n; });
      if (p.id === 'rio') m.pieces.forEach((tree, i) => { tree.visible = n > i * 2; tree.scale.setScalar(n > i * 2 + 1 ? 1 : .23); });
      if (p.id === 'machu' && (n === 0 || n === 4)) m.llama.position.set(n === 0 ? -11 : 12, 0, n === 0 ? 14 : 17);
    });
    carried.visible = currentPlace?.id === 'wall' && step(currentPlace) % 2 === 1;
  }
  function advance(p, explanation) {
    const old = step(p); if (old >= p.total) return;
    const origin = goal(p);
    if (!reduced) sparkles.forEach((s, i) => { const a = i * 2.4; s.model.visible = true; s.model.position.set(origin.x, 1, origin.z); s.life = 1.2; s.vx = Math.cos(a) * 2; s.vz = Math.sin(a) * 2; s.vy = 2.5 + i % 3; });
    state.progress[p.id]++; const n = step(p); activityModels.get(p.id).effects = 1.3;
    if (n === p.total) {
      if (!state.completed.includes(p.id)) state.completed.push(p.id);
      toast(`${p.icon} ${p.name} · lovely exploring!`);
      say(`${p.fact} ${state.completed.length === 7 ? 'You explored all seven places! Every adventure can be played again. Choose anywhere on your globe.' : 'A new picture in your travel book! Tap the globe for another place, or keep exploring.'}`);
    } else if (explanation) say(explanation);
    syncModels(); updateHUD(); save();
  }
  function visitMessage(p) {
    if (!state.visited.includes(p.id)) { state.visited.push(p.id); save(); say(`Welcome to ${p.name}, in ${p.country}! ${p.fact} ${goal(p).text}. Tap Pip if you want help.`); }
  }
  function updateHUD() {
    refreshView();
    $('#place-title small').textContent = interior ? 'PRETEND LEARNING ROOM' : 'LITTLE EXPLORER';
    $('#place-title strong').textContent = interior ? interior.name : currentPlace ? currentPlace.name : 'Wonder World';
    const g = playGoal() || { icon: '🚙', text: 'Drive, explore, or tap the globe!' };
    $('#task-icon').textContent = g.icon; $('#task-title').textContent = g.text;
    $('#task-dots').innerHTML = interior ? interior.hotspots.map(h => `<i class="${h.seen ? 'done' : ''}"></i>`).join('') : currentPlace ? Array.from({ length: currentPlace.total }, (_, i) => `<i class="${i < step(currentPlace) ? 'done' : ''}"></i>`).join('') : '';
    $('#task-dots').setAttribute('aria-label', interior ? `${interior.hotspots.filter(h => h.seen).length} of ${interior.hotspots.length} things explored` : currentPlace ? `${step(currentPlace)} of ${currentPlace.total} steps` : 'All destinations are open');
  }

  // The same obstacle rules apply to driving, walking, tap routes and saved positions.
  function clearLine(a, b) { const d = Math.hypot(a.x - b.x, a.z - b.z), steps = Math.max(1, Math.ceil(d / 1.2)); for (let i = 1; i <= steps; i++) if (!walkable(a.x + (b.x - a.x) * i / steps, a.z + (b.z - a.z) * i / steps)) return false; return true; }
  function findRoute(from, destination) {
    const end = safePoint(destination.x, destination.z); if (clearLine(from, end)) return [end];
    const size = interior ? .75 : 3, limit = interior ? 16 : 66, nodeKey = (x, z) => `${x},${z}`;
    const sx = Math.round(from.x / size), sz = Math.round(from.z / size), ex = Math.round(end.x / size), ez = Math.round(end.z / size);
    const open = [{ x: sx, z: sz, g: 0, h: Math.hypot(ex - sx, ez - sz), parent: null }], best = new Map([[nodeKey(sx, sz), 0]]); let found = null, visited = 0;
    while (open.length && visited++ < 9000) {
      let lowest = 0; for (let i = 1; i < open.length; i++) if (open[i].g + open[i].h < open[lowest].g + open[lowest].h) lowest = i;
      const node = open.splice(lowest, 1)[0];
      if (Math.hypot(node.x - ex, node.z - ez) <= 1.5 && clearLine({ x: node.x * size, z: node.z * size }, end)) { found = node; break; }
      for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) {
        if (!dx && !dz) continue; const x = node.x + dx, z = node.z + dz; if (Math.abs(x) > limit || Math.abs(z) > limit || !walkable(x * size, z * size)) continue;
        if (!clearLine({ x: node.x * size, z: node.z * size }, { x: x * size, z: z * size })) continue;
        const cost = node.g + Math.hypot(dx, dz), k = nodeKey(x, z); if (best.has(k) && best.get(k) <= cost) continue;
        best.set(k, cost); open.push({ x, z, g: cost, h: Math.hypot(ex - x, ez - z), parent: node });
      }
    }
    if (!found) return [];
    const points = [end]; for (let n = found; n; n = n.parent) points.unshift(new T.Vector3(n.x * size, 0, n.z * size));
    const smooth = []; let origin = from, index = 0;
    while (index < points.length) { let far = index; for (let i = points.length - 1; i >= index; i--) if (clearLine(origin, points[i])) { far = i; break; } smooth.push(points[far]); origin = points[far]; index = far + 1; }
    return smooth;
  }
  function go(destination, aloud = true) {
    if (mode !== 'play') setMode('play'); stopWalk(); route = findRoute(position, destination); target = route.shift() || null; $('#route').hidden = !target;
    if (aloud) say(destination.text ? `${destination.text}. Follow the golden dots. You can steer any time!` : 'Follow the golden dots!');
  }
  function help() {
    if (!active()) return;
    if (interior || currentPlace) go(playGoal());
    else { const p = places.find(p => !state.completed.includes(p.id)) || places[0]; go({ x: p.x, z: p.z + 23, text: `Let’s explore ${p.name}` }); }
  }
  function fastTravel(id) {
    const p = places.find(p => p.id === id); if (!p) return;
    leaveInterior(false); entranceIntent = false;
    position.copy(safePoint(p.x, p.z + 23)); carPosition.copy(safePoint(p.x + 4, p.z + 23)); riding = false; speed = hop = hopSpeed = 0; currentPlace = p;
    heading = Math.PI; resetCamera(); pip.position.set(position.x - 1.7, .3, position.z + 1.2);
    const m = activityModels.get('machu'); if (id === 'machu' && step(p) > 0 && step(p) < p.total) m.llama.position.set(position.x - p.x - 2, 0, position.z - p.z + 1);
    setMode('play'); updateHUD(); syncModels(); camFocus.copy(position); resize(); save();
    if (!state.visited.includes(p.id)) visitMessage(p); else say(`${p.name}, ${p.country}! ${goal(p).text}. Tap Pip and I’ll show you where.`);
  }
  function travelMenu() {
    setMode('travel');
    overlay.innerHTML = `<section class="card" role="dialog" aria-modal="true" aria-labelledby="travel-title">${closeButton()}<small>EVERY PLACE IS OPEN</small><h2 id="travel-title">Where shall we go?</h2><p>Tap a picture. Hear its name. Go exploring!</p><div class="travel-grid">${places.map(p => `<button class="travel-card ${currentPlace?.id === p.id ? 'active' : ''}" data-act="visit" data-place="${p.id}" aria-label="Explore ${p.name}, ${p.country}">${catalog.picture(p.id)}<strong>${p.name}</strong><small>${p.country}</small>${state.completed.includes(p.id) ? '<span class="stamp" aria-label="Explored">✓</span>' : ''}</button>`).join('')}<button class="travel-card" data-act="home" aria-label="Go to the home garden and buggy">${catalog.picture('home')}<strong>Home garden</strong><small>Buggy · ball · quiet camp</small></button></div><div class="passport" aria-label="${state.completed.length} of seven places explored">${places.map(p => `<i class="${state.completed.includes(p.id) ? 'done' : ''}" title="${p.name}">${state.completed.includes(p.id) ? '✓' : '·'}</i>`).join('')}</div><div class="buttons"><button data-act="island">🦕 Dinosaur island</button><button data-act="camp">☾ Quiet camp</button></div><p class="fine">An imaginary explorer park with miniature landmarks, not a real-world map. All activities use pretend gardens, paths and building models.</p></section>`;
    focusCard(); speak('Where shall we go? Tap a big picture to visit a wonder. Every place is open.');
  }
  function home() { leaveInterior(false); entranceIntent = false; position.set(0, 0, 21); carPosition.set(4, 0, 20); riding = false; speed = 0; heading = Math.PI; resetCamera(); currentPlace = null; setMode('play'); camFocus.copy(position); resize(); updateHUD(); save(); say('Home again! Your little buggy is waiting. Swipe the world to look around, or choose another picture on the globe.'); }
  function pause() {
    if (!started) return; save(); setMode('pause');
    overlay.innerHTML = `<section class="card" role="dialog" aria-modal="true" aria-labelledby="pause-title">${closeButton()}<small>PIP WILL WAIT</small><h2 id="pause-title">A little breather.</h2><p>Your adventures are saved. No hurry.</p><div class="buttons"><button class="primary" data-act="resume">▶ Play</button><button data-act="travel">🌍 Go somewhere</button></div><div class="grownup-grid"><button data-act="audio">☷ Qur’an audio</button><button data-act="camp">☾ Quiet camp</button><button data-act="notes">Grown-up guide</button><button data-act="island">🦕 Dinosaur island</button></div></section>`; focusCard();
  }
  function notes() {
    setMode('notes');
    overlay.innerHTML = `<section class="card" role="dialog" aria-modal="true" aria-labelledby="notes-title">${closeButton('pause')}<small>FOR YOUR GROWN-UP</small><h2 id="notes-title">Freedom to explore. Space to learn.</h2><p>A gentle open-world explorer park for ages 5–6. The child’s screen has a picture globe, movement joystick, hop, one changing action button, and Pip’s spoken help. No independent reading is required; device English speech availability varies.</p><p>Walk or drive the electric pretend buggy between seven miniature wonder districts, or use picture travel. Arrow keys/WASD move, Space hops, E interacts, Escape pauses. Tap the ground to walk; tap Pip to follow a safe route to the next activity. There are no enemies, crime, weapons, traffic collisions, timers, lost lives, purchases, ads, accounts, music or microphone access.</p><div class="site-facts"><strong>The New Seven Wonders</strong><p>Great Wall, Petra, Taj Mahal, Colosseum, Chichén Itzá, Machu Picchu, and the Christ the Redeemer site on Corcovado. To respect the family’s request not to depict prophets, Brazil is represented by the mountain, forest and viewpoint, without the statue or any religious figure.</p><p>These are stylised, reduced-scale, imaginary park replicas, not historical reconstructions or geographical neighbours. Children garden and build on pretend activity grounds, never on the actual protected monuments. All seven destinations are open immediately; stamps celebrate exploration, not tests.</p></div><p>Quiet camp is always open, retaining the existing parent-guided Muhammadiyah prayer sequence and four surahs. Religious learning gives no game rewards and unlocks nothing. Review religious material with a qualified teacher. No depictions of Allah or prophets.</p><p>Optional Juz Amma uses the existing community-attributed Muzammil Hasballah stream; it is not independently authenticated as an official release. Internet is needed for audio. Playback pauses for narration, menus, learning and hidden tabs. Nothing streams before an explicit Start tap.</p><p>Saved on this browser: site activity steps, completed postcards, replay variations, voice setting and explorer position. No name, age or birthday is stored. Original dinosaur discoveries remain in their separate save. ${storageOK ? '' : '<strong>Storage is unavailable: this visit remains playable but cannot be saved.</strong>'}</p><div class="buttons"><button data-act="voice" aria-pressed="${state.voice}">🔊 English voice: ${state.voice ? 'on' : 'off'}</button><button data-act="fullscreen">Full screen</button><button data-act="reset">Reset wonder activities</button></div><p class="fine">Local procedural art · Three.js 0.160.1 · <a href="vendor/THREE-LICENSE.txt">MIT licence</a> · <a href="play.html">Original illustrated adventure</a>.</p></section>`; focusCard();
    overlay.querySelector('.site-facts').insertAdjacentHTML('beforeend', '<p><strong>New: immersive 3D exploration.</strong> The default is a perspective camera following behind the explorer. Swipe an empty part of the world to turn and look up or down; use the movement circle with your other thumb. Walking follows camera directions. A short tap on the floor still walks there. The camera picture switches between close exploration and the original overhead accessibility view. On a keyboard, V changes camera and C looks ahead. There is no camera shake or head bob. Camera collision pulls the view in before walls; ceiling and near walls lift away in overhead mode.</p><p>The park has nearly twice the previous ground area, with districts 40% further apart, taller landmarks, a mountain-island horizon and more trees. A simple path still joins every destination, and picture travel remains instant. Existing activity progress is preserved; older positions are safely migrated into the expanded layout. Android Chrome is supported through the browser; this release is not a native APK.</p><p><strong>Walk through the doorway.</strong> On foot, walk into a bright doorway to enter and back through the room doorway to exit. The doorway picture and Enter/Out buttons remain available as accessible alternatives. Each destination has a bright enclosed learning room with three inspectable models. These are fictional rooms inspired by architecture and materials, not authenticated monument interiors. Chichén Itzá uses a pretend visitor discovery room; Corcovado uses an imaginary forest lodge, without a statue or religious figure. Indoor discoveries give no rewards and do not change outdoor activity progress. Indoor position is never saved: reloading safely returns outside.</p><p>The buggy opens in a true perspective driver-seat view with a 3D steering wheel and dashboard. Up drives, left/right steers, down reverses; sideways-only input gently rolls forward while turning. The camera picture switches to a third-person chase view. Swipe to glance around inside the car; the view gently returns forward while moving. No driving hops. Tap footprints to get out.</p>');
  }
  function campMenu() {
    setMode('camp'); overlay.innerHTML = `<section class="card" role="dialog" aria-modal="true" aria-labelledby="camp-title">${closeButton()}<small>ALWAYS OPEN · ALWAYS OPTIONAL</small><h2 id="camp-title">A little quiet, together.</h2><p>Choose with your grown-up. No points, rewards or tests.</p><div class="buttons"><button data-act="prayer">☾ Prayer together</button><button data-act="quran">☷ Qur’an garden</button></div><div class="buttons"><button class="primary" data-act="resume">Back to exploring →</button></div></section>`; focusCard(); speak('Welcome to quiet camp. Choose prayer or Qur’an with your grown-up, or keep exploring.');
  }
  function learn(topic) {
    setMode('learning'); overlay.innerHTML = `<section class="card learning-card" role="dialog" aria-modal="true" aria-label="Parent-guided ${topic} learning"><div class="buttons"><button data-act="camp">← Quiet camp</button><button data-act="resume">Back to play</button></div><iframe title="${topic === 'prayer' ? 'Muhammadiyah prayer learning' : 'Al-Fatihah and the last three surahs'}" src="index.html?camp=1#${topic}"></iframe></section>`; overlay.querySelector('button').focus();
  }
  function shapeActivity() {
    const p = places.find(p => p.id === 'colosseum'); setMode('shapes'); let selected = null, pointer = null, dragging = false;
    function render() {
      const n = step(p);
      overlay.innerHTML = `<section class="card" role="dialog" aria-modal="true" aria-labelledby="shape-title">${closeButton()}<small>BUILD A PRETEND ARCH</small><h2 id="shape-title">Let’s fit the shapes.</h2><p class="shape-help">${n < 2 ? 'A tall block holds up the arch.' : 'The curved top joins the two sides.'} Drag a shape to the glowing space. Or tap a shape, then tap the space.</p><div class="shape-board" id="shape-board"><svg viewBox="0 0 600 300" role="img" aria-label="Two tall supports and a curved arch top"><path d="M115 280H485" stroke="#ba9e76" stroke-width="12"/><rect x="175" y="130" width="65" height="145" rx="5" fill="${n > 0 ? '#c99558' : '#d4c8a8'}"/><rect x="360" y="130" width="65" height="145" rx="5" fill="${n > 1 ? '#c99558' : '#d4c8a8'}"/><path d="M175 135A125 125 0 0 1 425 135L360 135A60 60 0 0 0 240 135Z" fill="#d4c8a8"/><rect x="${n === 0 ? 166 : n === 1 ? 351 : 155}" y="${n < 2 ? 120 : 0}" width="${n < 2 ? 83 : 290}" height="${n < 2 ? 163 : 145}" rx="15" fill="#fff5b555" stroke="#eebf4d" stroke-width="7" stroke-dasharray="10 5"/></svg><button id="fit-slot" style="position:absolute;${n === 0 ? 'left:27%;top:40%;width:15%;height:55%' : n === 1 ? 'left:58%;top:40%;width:15%;height:55%' : 'left:26%;top:0;width:48%;height:48%'};background:transparent;border:0;padding:0" aria-label="Fit the selected shape here"></button></div><div class="shape-options"><button data-shape="support" aria-label="Choose tall block">▮</button><button data-shape="triangle" aria-label="Choose triangle">▲</button><button data-shape="arch" aria-label="Choose curved arch">∩</button></div><p id="shape-feedback" class="shape-help" role="status">${n < 2 ? 'Find the tall block.' : 'Find the curved top.'}</p></section>`;
      overlay.querySelectorAll('[data-shape]').forEach(button => {
        button.onclick = () => choose(button.dataset.shape);
        button.onpointerdown = e => { pointer = e.pointerId; dragging = false; selected = button.dataset.shape; button.setPointerCapture(pointer); choose(selected); };
        button.onpointermove = e => { if (e.pointerId !== pointer) return; dragging = true; button.style.transform = 'scale(1.1)'; };
        button.onpointerup = e => { if (e.pointerId !== pointer) return; pointer = null; button.style.transform = ''; const r = $('#fit-slot').getBoundingClientRect(); if (dragging && e.clientX >= r.left - 25 && e.clientX <= r.right + 25 && e.clientY >= r.top - 25 && e.clientY <= r.bottom + 25) fit(); };
        button.onpointercancel = button.onlostpointercapture = () => { pointer = null; button.style.transform = ''; };
      });
      $('#fit-slot').onclick = fit;
    }
    function choose(shape) { selected = shape; overlay.querySelectorAll('[data-shape]').forEach(b => b.classList.toggle('selected', b.dataset.shape === selected)); }
    function fit() {
      if (mode !== 'shapes') return; const expected = step(p) < 2 ? 'support' : 'arch';
      if (selected !== expected) { $('#shape-feedback').textContent = expected === 'support' ? 'Try the tall block. No hurry!' : 'Try the curved top. No hurry!'; speak($('#shape-feedback').textContent); return; }
      advance(p); selected = null; if (step(p) === p.total) { setMode('play'); say('Two supports and a curved top! You built an arch. Now look at all the arches on our Colosseum model!'); } else { render(); speak(step(p) === 1 ? 'One support! Now a matching support on the other side.' : 'Two supports! Now find the curved top.'); }
    }
    render(); focusCard(); speak('Let’s build an arch. Find a tall block. Drag it to the glowing space, or tap the block and then the space.');
  }
  function nearby() {
    if (interior) {
      if (Math.hypot(position.x - interior.exit.x, position.z - interior.exit.z) < 1.65) return { ...interior.exit, kind: 'exit' };
      const h = interior.hotspots.find(h => Math.hypot(position.x - h.x, position.z - h.z) < 2.5);
      return h ? { ...h, source: h, kind: 'inspect', verb: 'LOOK' } : null;
    }
    if (currentPlace) { const d = doorway(currentPlace); if (Math.hypot(position.x - d.x, position.z - d.z) < 3.8) return d; }
    if (currentPlace) { const g = goal(currentPlace), d = Math.hypot(position.x - g.x, position.z - g.z); if (d < 3.5 && !(currentPlace.id === 'petra' || currentPlace.id === 'chichen' || currentPlace.id === 'machu' && [1, 2].includes(step(currentPlace))) || g.done && d < 4) return { kind: 'activity', ...g }; }
    if (Math.hypot(position.x - 10, position.z + 1) < 5) return { kind: 'camp', icon: '☾', verb: 'QUIET', text: 'Quiet camp with your grown-up' };
    if (Math.hypot(position.x + 12, position.z) < 5) return { kind: 'island', icon: '🦕', verb: 'DINOS', text: 'Visit dinosaur island' };
    if (riding) return { kind: 'car', icon: '👣', verb: 'WALK', text: 'Hop out of the buggy' };
    if (Math.hypot(position.x - carPosition.x, position.z - carPosition.z) < 5) return { kind: 'car', icon: '🚙', verb: 'RIDE', text: 'Ride in your little buggy' };
    return null;
  }
  function interact() {
    if (!active()) return; stopWalk(); const o = nearby(); if (!o) { help(); return; }
    if (o.kind === 'enter') { enterInterior(); return; }
    if (o.kind === 'exit') { leaveInterior(); return; }
    if (o.kind === 'inspect') { inspect(o.source); return; }
    if (o.kind === 'car') { riding = !riding; speed = 0; if (!riding) { carPosition.copy(position); position.copy(safePoint(position.x + 2.8, position.z)); } else { position.copy(carPosition); driverView = true; } updateHUD(); say(riding ? 'You are in the driver’s seat! Push up to drive, left or right to steer, and down to reverse. Tap the camera to see outside. Tap the footprints to get out.' : 'Back on explorer feet! Your buggy will wait right here.'); }
    else if (o.kind === 'camp') campMenu();
    else if (o.kind === 'island') islandPrompt();
    else {
      const p = o.place, n = step(p);
      if (o.done) { state.progress[p.id] = 0; state.rounds[p.id] = Math.min(999, state.rounds[p.id] + 1); syncModels(); updateHUD(); save(); say(`Let’s play again! ${p.id === 'petra' && state.rounds[p.id] % 2 ? 'This time: blue, yellow, then red.' : goal(p).text}`); return; }
      if (p.id === 'wall') advance(p, n % 2 ? `Stone ${Math.floor(n / 2) + 1} fits! Let’s carry another.` : 'Lift! Now take your stone to our little model wall.');
      else if (p.id === 'taj') advance(p, n % 2 ? 'A matching pair! Can you find the next little garden?' : 'Lovely! Now find the matching bed on the other side.');
      else if (p.id === 'colosseum') shapeActivity();
      else if (p.id === 'machu') {
        if (n === 3) { const l = activityModels.get(p.id).llama; if (Math.hypot(l.position.x - 12, l.position.z - 17) > 7) { say('Our little llama is catching up. Wait here a moment.'); return; } }
        advance(p, 'Hello, little llama! Walk with me to the golden circle. The llama will follow.');
      } else if (p.id === 'rio') advance(p, n % 2 ? 'A tree for the birds! Let’s grow another.' : 'A tiny seed! Tap Water and watch it grow.');
    }
    nearest = nearby(); updateAction();
  }
  function islandPrompt() { setMode('island'); overlay.innerHTML = `<section class="card" role="dialog" aria-modal="true" aria-labelledby="island-title">${closeButton()}<h2 id="island-title">Dinosaur island?</h2><p>Your dinosaur friends, baby rescue and fossil cave are still there. Your wonder adventures are saved.</p><div class="buttons"><button class="primary" data-act="leave-island">🦕 Go to dinosaurs</button><button data-act="resume">Keep exploring here</button></div></section>`; focusCard(); speak('Shall we visit your dinosaur friends? Your wonder adventures will be waiting here.'); }
  function updateAction() { $('#do-icon').textContent = nearest?.icon || '🧭'; $('#do-label').textContent = nearest?.verb || 'SHOW ME'; $('#do').setAttribute('aria-label', nearest?.text || 'Pip, show me the next adventure'); $('#do').classList.toggle('ready', !!nearest); }

  function updateActivities(dt) {
    sparkles.forEach(s => { if (s.life <= 0) return; s.life -= dt; s.vy -= 8 * dt; s.model.position.x += s.vx * dt; s.model.position.z += s.vz * dt; s.model.position.y += s.vy * dt; s.model.visible = s.life > 0; });
    places.forEach(p => {
      const m = activityModels.get(p.id); m.effects = Math.max(0, m.effects - dt);
      if (p.id === 'machu') {
        const n = step(p), l = m.llama;
        if (n > 0 && n < p.total && currentPlace?.id === p.id) {
          const dx = position.x - p.x - l.position.x, dz = position.z - p.z - l.position.z, d = Math.hypot(dx, dz);
          if (d > 2.4) { const step = Math.min(d - 2.4, dt * (riding ? 19 : 11)); l.position.x += dx / d * step; l.position.z += dz / d * step; l.rotation.y = Math.atan2(dx, dz); }
          l.position.y = !reduced && d > 2.4 ? Math.abs(Math.sin(time * 10)) * .1 : 0;
          m.legs.forEach((leg, i) => { leg.rotation.x = !reduced && d > 2.4 ? Math.sin(time * 10 + i * Math.PI) * .25 : 0; });
        }
      }
    });
    if (currentPlace) {
      const p = currentPlace, n = step(p), g = goal(p), d = Math.hypot(position.x - g.x, position.z - g.z);
      if (n < p.total && d < 2.2) {
        if (p.id === 'petra') advance(p, `Through the ${['red', 'yellow', 'blue'][gateOrder(p)[n]]} arch! ${n < 2 ? `Now find the ${['red', 'yellow', 'blue'][gateOrder(p)[n + 1]]} arch.` : ''}`);
        if (p.id === 'chichen' && (!(n === 1 || n === 3) || hop > .3)) advance(p, `${n + 1}! ${n === 0 || n === 2 ? 'Hop on the next stone!' : 'Find the next golden stone.'}`);
        if (p.id === 'machu' && [1, 2].includes(n)) {
          const l = activityModels.get(p.id).llama; if (Math.hypot(l.position.x + p.x - position.x, l.position.z + p.z - position.z) < 6) advance(p, n === 1 ? 'Your llama is following! Now to the next circle.' : 'Nearly home! Walk to the little meadow and tap Home.');
        }
      }
    }
    const rio = places.find(p => p.id === 'rio'), grown = Math.floor(step(rio) / 2);
    birds.forEach((b, i) => { b.model.visible = i < grown * 2; if (!b.model.visible) return; const a = (reduced ? 0 : time * .5) + b.phase; b.model.position.set(rio.x + Math.cos(a) * 11, 4.6 + (reduced ? 0 : Math.sin(time + i) * .8), rio.z + 18 + Math.sin(a) * 6); b.model.rotation.y = -a; b.wings.forEach((w, j) => { w.rotation.z = !reduced ? Math.sin(time * 11 + i) * (j ? 1 : -1) : .2; }); });
  }
  const camFocus = position.clone(), camOffset = new T.Vector3(23, 32, 34), raycaster = new T.Raycaster(), pointer = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
  const followFocus = position.clone().add(new T.Vector3(0, 1.9, 0)), cameraRay = new T.Raycaster();
  let cameraSnap = true, cameraClearance = 10;
  function resetCamera() { orbit.yaw = heading + Math.PI; orbit.pitch = interior ? .24 : .30; orbit.lastLook = time - 100; orbit.driverYaw = orbit.driverPitch = 0; cameraSnap = true; followFocus.copy(position).y = 1.9; }
  function chosenCamera() { return riding && driverView ? driverCamera : exploreView === 'follow' ? followCamera : camera; }
  function toggleCamera() {
    if (!active()) return; clearInput(); stopWalk(); speed = 0;
    if (riding) { driverView = !driverView; exploreView = 'follow'; }
    else exploreView = exploreView === 'follow' ? 'overview' : 'follow';
    resetCamera(); updateHUD();
    say(riding && driverView ? 'Driver’s seat! Up to go, left or right to steer, down to reverse.' : exploreView === 'follow' ? 'Explorer view! Swipe the world to look around. Slide the circle to walk where you are looking.' : 'Bird’s-eye view! Tap the camera to get close again.');
  }
  function resize() { const w = root.clientWidth, h = root.clientHeight, span = interior ? w / h < .8 ? 43 : 35 : currentPlace ? w / h < .8 ? 54 : 52 : w / h < .8 ? 37 : 43; renderer.setSize(w, h, false); camera.left = -span * w / h / 2; camera.right = span * w / h / 2; camera.top = span / 2; camera.bottom = -span / 2; camera.updateProjectionMatrix(); driverCamera.aspect = followCamera.aspect = w / h; driverCamera.fov = w / h < .8 ? 88 : 78; followCamera.fov = w / h < .8 ? 76 : 68; driverCamera.updateProjectionMatrix(); followCamera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(root);
  function frame(now) {
    requestAnimationFrame(frame); const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; if (document.hidden) return;
    moving = false;
    if (active()) {
      time += dt; saveTime += dt;
      const h = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0) + joy.x;
      const v = (keys.has('ArrowDown') || keys.has('s') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('w') ? 1 : 0) + joy.y;
      const direction = new T.Vector3();
      const previous = position.clone();
      const cockpit = riding && driverView;
      const manualDrive = cockpit && Math.hypot(h, v) > .12;
      if (Math.hypot(h, v) > .12) {
        stopWalk();
        if (cockpit) {
          const throttle = Math.abs(v) > .12 ? -v * (v > 0 ? .55 : 1) : .4;
          heading -= h * dt * 1.55 * (throttle < 0 ? -1 : 1);
          direction.set(Math.sin(heading) * throttle, 0, Math.cos(heading) * throttle);
        } else {
          if (exploreView === 'follow') direction.set(h * Math.cos(orbit.yaw) + v * Math.sin(orbit.yaw), 0, -h * Math.sin(orbit.yaw) + v * Math.cos(orbit.yaw));
          else direction.set(h * .828 + v * .56, 0, -h * .56 + v * .828);
          if (direction.length() > 1) direction.normalize();
        }
      }
      else if (target) { direction.copy(target).sub(position); if (direction.length() < (route.length ? .65 : 1.2)) { if (route.length) target = route.shift(); else stopWalk(); direction.set(0, 0, 0); } else direction.normalize(); }
      moving = direction.lengthSq() > .01;
      speed += ((moving ? riding ? 17 : target ? 10 : 8 : 0) - speed) * Math.min(1, dt * (riding ? 4 : 12));
      if (moving) {
        const dx = direction.x * dt * speed, dz = direction.z * dt * speed;
        if (walkable(position.x + dx, position.z + dz)) { position.x += dx; position.z += dz; }
        else if (walkable(position.x + dx, position.z)) position.x += dx;
        else if (walkable(position.x, position.z + dz)) position.z += dz;
        else { speed = 0; if (target) { stopWalk(); say('Let’s go around the little model. Tap Pip for a clear path.'); } }
        if (!manualDrive) {
          const angle = Math.atan2(direction.x, direction.z);
          heading = cockpit ? heading + Math.atan2(Math.sin(angle - heading), Math.cos(angle - heading)) * Math.min(1, dt * 5) : angle;
        }
      }
      if (interior && previous.z <= 8.05 && position.z > 8.05 && Math.abs(position.x) < 1.5) leaveInterior();
      else if (!interior && !riding && currentPlace && previous.z >= currentPlace.z + 7.65 && position.z < currentPlace.z + 7.65 && Math.abs(position.x - currentPlace.x) < 1.5) enterInterior();
      hopSpeed -= 19 * dt; hop = Math.max(0, hop + hopSpeed * dt); if (!hop) hopSpeed = 0;
      player.model.position.set(position.x, .25 + hop + (riding ? 1.1 : 0), position.z); player.model.rotation.y = heading; player.model.scale.setScalar(riding ? .68 : 1);
      player.legs.forEach((leg, i) => { leg.rotation.x = moving && !riding && !reduced ? Math.sin(time * 12 + i * Math.PI) * .55 : 0; });
      player.arms.forEach((arm, i) => { arm.rotation.x = moving && !riding && !reduced ? -Math.sin(time * 12 + i * Math.PI) * .4 : 0; });
      if (riding) { carPosition.copy(position); buggy.rotation.y = heading; }
      buggy.position.set(carPosition.x, .25 + (riding ? hop : 0), carPosition.z); wheels.forEach(w => { if (moving && riding) w.rotation.x += dt * speed * 1.5; });
      const behind = new T.Vector3(position.x - Math.sin(heading) * 1.2 + Math.cos(heading) * 1.7, 0, position.z - Math.cos(heading) * 1.2 - Math.sin(heading) * 1.7); pip.position.lerp(behind, Math.min(1, dt * 5)); pip.position.y = .3 + (!reduced && moving ? Math.abs(Math.sin(time * 9)) * .15 : 0); pip.rotation.y = heading;
      carried.position.set(position.x, riding ? 3.8 : 2.5, position.z - .8);
      const found = interior ? currentPlace : places.find(p => Math.hypot(position.x - p.x, position.z - p.z) < 34) || null;
      if (found?.id !== currentPlace?.id) { currentPlace = found; entranceIntent = false; resize(); updateHUD(); syncModels(); if (found) visitMessage(found); }
      if (!interior) updateActivities(dt);
      nearest = nearby(); updateAction();
      const dx = beachBall.position.x - position.x, dz = beachBall.position.z - position.z, d = Math.hypot(dx, dz);
      if (!interior && moving && d < (riding ? 2.7 : 1.7)) ballVelocity.set(dx / Math.max(.1, d), 0, dz / Math.max(.1, d)).multiplyScalar(riding ? 16 : 10);
      const next = beachBall.position.clone().addScaledVector(ballVelocity, dt); if (!interior && walkable(next.x, next.z)) beachBall.position.copy(next); else ballVelocity.multiplyScalar(-.5);
      ballVelocity.multiplyScalar(Math.exp(-dt)); beachBall.rotation.x += ballVelocity.z * dt; beachBall.rotation.z -= ballVelocity.x * dt;
      if (saveTime > 2) { save(); saveTime = 0; }
    }
    const g = mode === 'play' ? playGoal() : null;
    goalRing.visible = arrow.visible = !!g;
    if (g) { goalRing.position.set(g.x, .47, g.z); arrow.position.set(g.x, 4.4 + (!reduced ? Math.sin(time * 3) * .35 : 0), g.z); }
    const guide = target || g; trail.forEach((dot, i) => { dot.visible = active() && !!guide; if (guide) { const f = (i + 1) / 16; dot.position.set(position.x + (guide.x - position.x) * f, .45, position.z + (guide.z - position.z) * f); } });
    const focus = position.clone();
    if (interior) { focus.set(position.x * .18, .5, position.z * .15); }
    else if (currentPlace) { focus.x = position.x * .8 + currentPlace.x * .2; focus.z -= 8; focus.y = 2; }
    camFocus.lerp(focus, reduced ? 1 : Math.min(1, dt * 5)); camera.position.copy(camFocus).add(camOffset); camera.lookAt(camFocus);
    const cockpit = riding && driverView;
    if (interior) interior.enclosure.visible = exploreView === 'follow';
    sun.position.set(position.x - 40, 85, position.z + 45); sun.target.position.set(position.x, 0, position.z);
    if ((target || riding) && moving && time - orbit.lastLook > 2 && lookPointer === null) {
      const behind = heading + Math.PI; orbit.yaw += Math.atan2(Math.sin(behind - orbit.yaw), Math.cos(behind - orbit.yaw)) * Math.min(1, dt * 1.8);
    }
    const aim = new T.Vector3(position.x, riding ? 2.2 : 1.9, position.z);
    followFocus.lerp(aim, reduced || cameraSnap ? 1 : Math.min(1, dt * 12));
    const distance = interior ? 6.8 : riding ? 12 : 10.5;
    const offset = new T.Vector3(Math.sin(orbit.yaw) * Math.cos(orbit.pitch), Math.sin(orbit.pitch), Math.cos(orbit.yaw) * Math.cos(orbit.pitch));
    cameraRay.set(followFocus, offset); cameraRay.near = .2; cameraRay.far = distance;
    const cameraHits = !cockpit && exploreView === 'follow' ? cameraRay.intersectObjects(interior ? interior.occluders : cameraBoxes, true) : [];
    const clearance = cameraHits.length ? Math.max(1.05, Math.min(distance, cameraHits[0].distance - .4)) : distance;
    cameraClearance = clearance < cameraClearance || cameraSnap ? clearance : cameraClearance + (clearance - cameraClearance) * Math.min(1, dt * 5);
    followCamera.position.copy(followFocus).addScaledVector(offset, cameraClearance); followCamera.lookAt(followFocus); cameraSnap = false;
    player.model.visible = !cockpit; pip.visible = !cockpit;
    carried.visible = !interior && !cockpit && currentPlace?.id === 'wall' && step(currentPlace) % 2 === 1;
    if (cockpit) {
      // Fixed eye height, no camera shake or head bob. Steering changes the view with the car.
      driverCamera.position.set(position.x - Math.sin(heading) * .65, 2.88 + hop, position.z - Math.cos(heading) * .65);
      if (moving && lookPointer === null) { orbit.driverYaw *= Math.exp(-dt * 2); orbit.driverPitch *= Math.exp(-dt * 2); }
      driverCamera.lookAt(driverCamera.position.x + Math.sin(heading + orbit.driverYaw) * 15, 2.45 + hop + orbit.driverPitch * 12, driverCamera.position.z + Math.cos(heading + orbit.driverYaw) * 15);
      speedDots.forEach((dot, i) => { dot.visible = speed > i * 4; });
    }
    canvas.dataset.x = position.x.toFixed(2); canvas.dataset.z = position.z.toFixed(2); canvas.dataset.riding = String(riding); canvas.dataset.place = currentPlace?.id || 'home'; canvas.dataset.goal = g ? JSON.stringify({ x: g.x, z: g.z, text: g.text }) : ''; canvas.dataset.progress = JSON.stringify(state.progress); canvas.dataset.speed = speed.toFixed(2); canvas.dataset.mode = mode;
    canvas.dataset.interior = interior ? currentPlace.id : '';
    canvas.dataset.camera = cockpit ? 'driver' : exploreView === 'follow' ? 'follow' : 'outside';
    canvas.dataset.orbit = JSON.stringify({ yaw: orbit.yaw, pitch: orbit.pitch, distance: cameraClearance, driverYaw: orbit.driverYaw, driverPitch: orbit.driverPitch });
    canvas.dataset.look = String(lookPointer !== null);
    canvas.dataset.projection = chosenCamera().isPerspectiveCamera ? 'perspective' : 'orthographic';
    canvas.dataset.heading = heading.toFixed(3);
    renderer.render(interior ? interior.scene : scene, chosenCamera());
  }
  function doHop() { if (active() && !hop && !riding) hopSpeed = 6; }
  function start() { started = true; setMode('play'); updateHUD(); say('Salaam, little explorer! Slide the circle to walk. Swipe the world to look around. Tap the globe to explore, or the gold car button for a ride. Pip will help you!'); }
  $('#travel').onclick = travelMenu; $('#pause').onclick = pause; $('#help').onclick = help; $('#repeat').onclick = () => speak(message); $('#do').onclick = interact; $('#hop').onclick = doHop; $('#cancel-route').onclick = stopWalk;
  $('#inside').onclick = insideButton;
  $('#camera-mode').onclick = toggleCamera;
  $('#cancel-route').onclick = () => { stopWalk(); entranceIntent = false; updateHUD(); };
  const joystick = $('#joystick');
  function moveJoy(e) { const r = joystick.getBoundingClientRect(), radius = r.width * .32; joy.set((e.clientX - r.left - r.width / 2) / radius, (e.clientY - r.top - r.height / 2) / radius); if (joy.length() > 1) joy.normalize(); $('#stick').style.transform = `translate(${joy.x * radius}px,${joy.y * radius}px)`; }
  joystick.onpointerdown = e => { if (!active() || joyPointer !== null) return; e.preventDefault(); joyPointer = e.pointerId; joystick.setPointerCapture(joyPointer); moveJoy(e); };
  joystick.onpointermove = e => { if (e.pointerId === joyPointer) { e.preventDefault(); moveJoy(e); } };
  const release = e => { if (e.pointerId === joyPointer) { joyPointer = null; joy.set(0, 0); $('#stick').style.transform = ''; } };
  joystick.onpointerup = joystick.onpointercancel = joystick.onlostpointercapture = release;
  canvas.onpointerdown = e => {
    if (!active() || lookPointer !== null) return; e.preventDefault(); canvas.focus({ preventScroll: true }); lookPointer = e.pointerId;
    lookStart = lookLast = { x: e.clientX, y: e.clientY }; dragged = false; canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointermove = e => {
    if (!active() || e.pointerId !== lookPointer || !lookLast) return;
    if (!dragged && Math.hypot(e.clientX - lookStart.x, e.clientY - lookStart.y) < 8) return;
    dragged = true;
    const dx = e.clientX - lookLast.x, dy = e.clientY - lookLast.y; orbit.lastLook = time;
    if (riding && driverView) { orbit.driverYaw = T.MathUtils.clamp(orbit.driverYaw - dx * .006, -1.2, 1.2); orbit.driverPitch = T.MathUtils.clamp(orbit.driverPitch - dy * .004, -.25, .35); }
    else if (exploreView === 'follow') { orbit.yaw -= dx * .007; orbit.pitch = T.MathUtils.clamp(orbit.pitch + dy * .005, -.08, .85); }
    lookLast = { x: e.clientX, y: e.clientY };
  };
  canvas.onpointerup = e => {
    if (e.pointerId !== lookPointer) return;
    const tap = !dragged && active(); lookPointer = null; lookStart = lookLast = null;
    if (!tap) return;
    const r = canvas.getBoundingClientRect(); pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); raycaster.setFromCamera(pointer, chosenCamera());
    const hit = new T.Vector3(); if (raycaster.ray.intersectPlane(plane, hit)) go(hit, false);
  };
  canvas.onpointercancel = canvas.onlostpointercapture = e => { if (e.pointerId === lookPointer) { lookPointer = null; lookStart = lookLast = null; dragged = false; } };
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if ($('#recitation-dialog').open) return; if (active()) pause(); else if (started && mode !== 'title') setMode('play'); return; }
    if (!active() || e.target.closest('input,select,textarea,iframe')) return; const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if ([' ', 'Enter'].includes(k) && e.target.closest('button,a')) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd', ' ', 'e'].includes(k)) e.preventDefault();
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].includes(k)) keys.add(k);
    if (k === ' ' && !e.repeat) doHop(); if (k === 'e' && !e.repeat) interact();
    if (k === 'v' && !e.repeat) toggleCamera(); if (k === 'c' && !e.repeat) { resetCamera(); say('Looking ahead again!'); }
  });
  window.addEventListener('keyup', e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
  window.addEventListener('blur', () => { clearInput(); if (active()) pause(); });
  document.addEventListener('visibilitychange', () => { clearInput(); if (document.hidden) { save(); stopVoice(); if (mode === 'play') pause(); } });
  window.addEventListener('pagehide', () => { save(); stopVoice(); clearInput(); overlay.querySelector('iframe')?.contentWindow?.postMessage('little-explorer:stop-audio', '*'); });
  window.addEventListener('recitation-panel-open', () => { clearInput(); stopWalk(); stopVoice(); });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); save(); stopVoice(); clearInput(); window.Recitation?.hold('world-context', true); $('#fallback').hidden = false; });
  canvas.addEventListener('webglcontextrestored', () => { $('#fallback').hidden = true; window.Recitation?.hold('world-context', false); pause(); });
  overlay.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
    if (a === 'start') start(); else if (a === 'resume') setMode('play'); else if (a === 'travel') travelMenu(); else if (a === 'visit') fastTravel(b.dataset.place);
    else if (a === 'home') home(); else if (a === 'pause') pause(); else if (a === 'notes') notes(); else if (a === 'camp') campMenu(); else if (a === 'island') islandPrompt();
    else if (a === 'leave-island') { save(); window.Recitation?.stop(); location.href = 'island.html'; }
    else if (a === 'audio') window.Recitation?.open(); else if (['prayer', 'quran'].includes(a)) learn(a);
    else if (a === 'voice') { state.voice = !state.voice; save(); notes(); }
    else if (a === 'fullscreen') { if (document.fullscreenElement) document.exitFullscreen?.(); else root.requestFullscreen?.().catch(() => {}); }
    else if (a === 'reset') {
      if (!confirm('Reset only wonder-world activities? Dinosaur discoveries and learning guides will stay unchanged.')) return;
      places.forEach(p => { state.progress[p.id] = state.rounds[p.id] = 0; }); state.completed = []; state.visited = []; syncModels(); save(); notes();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || mode === 'play' || $('#recitation-dialog').open) return;
    const items = [...overlay.querySelectorAll('button:not(:disabled),a[href],iframe')], first = items[0], last = items[items.length - 1]; if (!first) return;
    if (e.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  syncModels(); resize(); resetCamera(); setMode('title');
  overlay.innerHTML = `<section class="card title-card"><span class="title-icon" aria-hidden="true">🌍</span><small>STEP INTO YOUR OWN 3D ADVENTURE</small><h1>Pip’s<br>Wonder World.</h1><p>Look around. Walk inside.<br>Drive to seven amazing places.</p><div class="buttons"><button id="start" data-act="start">▶ PLAY</button></div><p class="fine">No enemies. No hurry. Pip will show you how.</p></section>`;
  requestAnimationFrame(frame);
})();
