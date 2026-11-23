(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const canvas = $('#island'), game = $('#game'), overlay = $('#overlay');
  const T = window.THREE;
  let renderer;
  try {
    if (!T) throw new Error('3D engine unavailable');
    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch {
    $('#fallback').hidden = false;
    $('#storage-note').textContent = 'Existing browser discoveries have not been changed.';
    $('#notes-button').onclick = () => $('#notes').showModal();
    $('#close-notes').onclick = () => $('#notes').close();
    window.Recitation?.hold('unavailable', true);
    return;
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene(); scene.background = new T.Color('#a4d7d1');
  scene.fog = new T.Fog('#a4d7d1', 85, 180);
  const camera = new T.OrthographicCamera(-25, 25, 17, -17, .1, 240);
  const sun = new T.DirectionalLight('#fff0cf', 3.1); sun.position.set(-25, 50, 24);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 50, bottom: -50, near: .5, far: 130 });
  sun.shadow.normalBias = .09; sun.shadow.bias = -.0002;
  scene.add(sun, new T.HemisphereLight('#e1f5ed', '#638a5c', 2.1));
  const matCache = new Map();
  const mat = color => {
    if (!matCache.has(color)) matCache.set(color, new T.MeshStandardMaterial({ color, roughness: .88, flatShading: true }));
    return matCache.get(color);
  };
  const sphere = new T.IcosahedronGeometry(1, 1), box = new T.BoxGeometry(1, 1, 1);
  function mesh(geometry, color, x, y, z, sx = 1, sy = sx, sz = sx, parent = scene) {
    const m = new T.Mesh(geometry, mat(color)); m.position.set(x, y, z); m.scale.set(sx, sy, sz);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  const ball = (parent, color, x, y, z, sx, sy = sx, sz = sx) => mesh(sphere, color, x, y, z, sx, sy, sz, parent);
  const cube = (parent, color, x, y, z, sx, sy, sz) => mesh(box, color, x, y, z, sx, sy, sz, parent);
  function cylinder(parent, color, x, y, z, top, bottom, height, sides = 8) {
    return mesh(new T.CylinderGeometry(top, bottom, height, sides), color, x, y, z, 1, 1, 1, parent);
  }
  function segment(parent, color, a, b, radius) {
    const start = new T.Vector3(...a), end = new T.Vector3(...b), delta = end.clone().sub(start);
    const m = cylinder(parent, color, 0, 0, 0, radius * .7, radius, delta.length());
    m.position.copy(start.add(end).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()); return m;
  }
  function group(x = 0, y = 0, z = 0, parent = scene) { const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g; }
  function label(text, x, y, z, width = 7, background = '#fff8df', color = '#42654c') {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const ctx = c.getContext('2d'); ctx.fillStyle = background; ctx.beginPath(); ctx.roundRect(3, 3, 506, 122, 32); ctx.fill();
    ctx.fillStyle = color; ctx.font = 'bold 36px Trebuchet MS, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 256, 67, 466);
    const texture = new T.CanvasTexture(c); texture.colorSpace = T.SRGBColorSpace;
    const s = new T.Sprite(new T.SpriteMaterial({ map: texture, depthTest: true })); s.position.set(x, y, z); s.scale.set(width, width / 4, 1); scene.add(s); return s;
  }
  function disk(color, x, y, z, rx, rz, parent = scene) {
    const m = mesh(new T.CylinderGeometry(1, 1, .09, 48), color, x, y, z, rx, 1, rz, parent); m.castShadow = false; return m;
  }
  // A deterministic island, so discoveries never move between visits.
  let seed = 12891;
  function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  const ocean = mesh(new T.PlaneGeometry(1500, 1500), '#80c4bf', 0, -1.25, 0); ocean.rotation.x = -Math.PI / 2; ocean.castShadow = false;
  const sand = cylinder(scene, '#ebd29b', 0, -1, 0, 43.8, 40, 2, 64); sand.scale.z = .83;
  const island = cylinder(scene, '#a8c77b', 0, -.05, 0, 40.7, 42.4, .65, 64); island.scale.z = .81;
  const grassPatches = [[-19, -9, 16, 13, '#9cbf78'], [18, -9, 16, 13, '#a9c776'], [0, 19, 24, 10, '#b3cb83']];
  grassPatches.forEach(([x, z, rx, rz, color]) => disk(color, x, .3, z, rx, rz));
  function path(points, width = 1.1) {
    const curve = new T.CatmullRomCurve3(points.map(([x, z]) => new T.Vector3(x, .36, z)));
    const tube = mesh(new T.TubeGeometry(curve, 55, width, 5, false), '#d8d39c', 0, 0, 0); tube.scale.y = .035; tube.position.y = .37; tube.castShadow = false;
  }
  path([[-15, 15], [-5, 12], [0, 15], [13, 14], [22, 3], [22, -12]]);
  path([[0, 15], [-6, 3], [-20, -5], [-18, -16], [-3, -20], [15, -15], [24, -8]]);
  path([[-6, 3], [6, -2], [11, -10]], .8);
  const ripples = [];
  for (let i = 0; i < 15; i++) {
    const a = i / 15 * Math.PI * 2;
    const ring = mesh(new T.TorusGeometry(1, .045, 3, 18, 1.4), '#d2e7c4', Math.cos(a) * 46, -1.1, Math.sin(a) * 38, 2.5, 2.5, 2.5);
    ring.rotation.x = -Math.PI / 2; ring.rotation.z = a; ring.castShadow = false; ripples.push(ring);
  }
  function tree(x, z, scale = 1, palm = false) {
    const g = group(x, .35, z); g.scale.setScalar(scale);
    cylinder(g, '#a38353', 0, 1.7, 0, .2, .35, 3.4);
    if (palm) {
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const frond = ball(g, i % 2 ? '#679d68' : '#88b274', Math.cos(a) * 1.1, 3.5, Math.sin(a) * 1.1, 1.8, .22, .65); frond.rotation.y = -a; frond.rotation.z = .14; }
      ball(g, '#98774c', .2, 3.2, .2, .35);
    } else {
      ball(g, '#6a9d69', 0, 3.6, 0, 1.9, 2.2, 1.6);
      ball(g, '#86b275', -.9, 3.4, .5, 1.3, 1.4, 1.35);
      ball(g, '#a0c780', -.25, 4.9, -.05, 1.3, 1.1, 1.1);
    }
    return g;
  }
  for (let i = 0; i < 37; i++) {
    const a = i / 37 * Math.PI * 2, radius = .77 + rand() * .13;
    tree(Math.cos(a) * 39 * radius, Math.sin(a) * 31 * radius, .7 + rand() * .55, i % 3 === 0);
  }
  [[-25, 5], [-13, -2], [15, 3], [6, -20], [28, -3], [-7, 21]].forEach(([x, z], i) => tree(x, z, .8 + i % 2 * .25, true));
  for (let i = 0; i < 72; i++) {
    const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * .91;
    const x = Math.cos(a) * 40 * r, z = Math.sin(a) * 32 * r;
    if (i < 16) ball(scene, i % 2 ? '#b2ba96' : '#a0b097', x, .6, z, .5 + rand() * .7, .5, .7);
    else { const g = group(x, .4, z); for (let j = 0; j < 3; j++) { const blade = ball(g, i % 3 ? '#79a263' : '#e4d795', (j - 1) * .14, .2, 0, .1, .4 + rand() * .2, .1); blade.rotation.z = (j - 1) * -.4; } }
  }
  // Decorative mountain silhouettes sit beyond the walking area.
  for (let i = 0; i < 3; i++) { const peak = cylinder(scene, i % 2 ? '#81a38b' : '#91ad91', -12 + i * 9, 2, -29, 0, 6 - i, 8 + i * 2, 6); peak.scale.z = .85; }
  // Camp pond and stepping-stone garden (decorative, no drowning or penalties).
  disk('#e8d59f', -25, .36, -11, 7, 5); disk('#80bdb0', -25, .43, -11, 5.9, 4);
  for (let i = 0; i < 5; i++) disk('#c2c5a0', -29 + i * 1.8, .57, -10 + Math.sin(i) * .7, .8, .6);
  const dinos = [
    { id: 'longneck', name: 'Lulu the longneck', short: 'Longneck', x: -23, z: -1, color: '#79a792', type: 'longneck', fact: 'Long necks helped some dinosaurs reach leaves high in the trees.' },
    { id: 'triceratops', name: 'Toto the Triceratops', short: 'Triceratops', x: 20, z: -12, color: '#d9a367', type: 'triceratops', fact: 'Triceratops had three horns and a big frill behind its head.' },
    { id: 'stegosaurus', name: 'Stella the Stegosaurus', short: 'Stegosaurus', x: -3, z: -20, color: '#8fa872', type: 'stegosaurus', fact: 'Stegosaurus had bony plates along its back.' }
  ];
  const eggs = [
    { id: 'fern', name: 'Fern egg', x: -29, z: 10, color: '#d3e7a2' },
    { id: 'sun', name: 'Sunshine egg', x: 28, z: 1, color: '#f9d88e' },
    { id: 'sky', name: 'Sky egg', x: 10, z: -23, color: '#bbdcd9' }
  ];
  const digs = [
    { id: 'tail', name: 'Tail fossil', x: -12, z: -8 },
    { id: 'footprint', name: 'Footprint fossil', x: 8, z: -9 },
    { id: 'ribs', name: 'Rib fossil', x: 29, z: -10 }
  ];
  const places = [
    { id: 'museum', name: 'Little museum', icon: '🦴', x: -12, z: 15, hint: 'Give your fossils a home' },
    { id: 'nursery', name: 'Egg nursery', icon: '🥚', x: 13, z: 15, hint: 'Hatch your discoveries' },
    { id: 'camp', name: 'Quiet camp', icon: '☾', x: -20, z: -18, hint: 'Prayer and Qur’an together' },
    { id: 'dinosaurs', name: 'Dino friends', icon: '🦕', x: -23, z: -1, hint: 'Three friends to meet' },
    { id: 'eggs', name: 'Hidden eggs', icon: '🥚', x: -29, z: 10, hint: 'Look among the trees' },
    { id: 'dig', name: 'Fossil digs', icon: '⛏', x: -12, z: -8, hint: 'Rub away the sand' },
    { id: 'leaves', name: 'Leaf garden', icon: '🌿', x: -5, z: 10, hint: 'Gather dinosaur snacks' },
    { id: 'course', name: 'Hop trail', icon: '◎', x: 5, z: 6, hint: 'Walk, ride and jump' },
    { id: 'ball', name: 'Beach ball', icon: '⚽', x: 8, z: -1, hint: 'Push it. Chase it!' }
  ];
  const key = 'little-explorer-island-v1';
  let storageOK = true, stored = {};
  try { stored = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { storageOK = false; }
  const allowed = (value, list) => [...new Set(Array.isArray(value) ? value.filter(x => list.includes(x)) : [])];
  const state = {
    dinosaurs: allowed(stored.dinosaurs, dinos.map(d => d.id)), eggs: allowed(stored.eggs, eggs.map(d => d.id)),
    fossils: allowed(stored.fossils, digs.map(d => d.id)), voice: stored.voice !== false,
    displayed: [], hatched: [], leaves: Number.isInteger(stored.leaves) ? Math.max(0, Math.min(9, stored.leaves)) : 0,
    companion: null, trailComplete: stored.trailComplete === true
  };
  state.displayed = allowed(stored.displayed, state.fossils); state.hatched = allowed(stored.hatched, state.eggs);
  state.companion = state.hatched.includes(stored.companion) ? stored.companion : null;
  let mode = 'title', time = 0, last = 0, speechToken = 0, target = null, riding = null, celebrationTimer;
  let started = false, moving = false, hopHeight = 0, hopVelocity = 0, saveTime = 0, autoSaveDirty = false;
  let nearest = null, guideTarget = null, journalTab = 'dinosaurs', currentMessage = 'Salaam, explorer!', joyPointer = null;
  let hatch = null, course = null, ballCooldown = 0;
  const keys = new Set(), joy = new T.Vector2(), position = new T.Vector3(0, .4, 16);
  if (Number.isFinite(stored.x) && Number.isFinite(stored.z)) { position.x = Math.max(-36, Math.min(36, stored.x)); position.z = Math.max(-28, Math.min(28, stored.z)); }
  function bound() { const r = Math.hypot(position.x / 37.5, position.z / 29); if (r > 1) { position.x /= r; position.z /= r; return true; } return false; }
  bound();
  function save() {
    try { localStorage.setItem(key, JSON.stringify({ ...state, x: position.x, z: position.z })); } catch { storageOK = false; }
    autoSaveDirty = false;
  }
  function stopVoice() { speechToken++; window.Recitation?.hold('speech', false); if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  function speak(text) {
    stopVoice(); if (!state.voice || !('speechSynthesis' in window) || document.hidden) return;
    const token = speechToken, u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB'; u.rate = .87; u.pitch = 1.1;
    const voices = speechSynthesis.getVoices(); u.voice = voices.find(v => v.lang.startsWith('en-GB')) || voices.find(v => v.lang.startsWith('en')) || null;
    u.onend = u.onerror = () => { if (speechToken === token) window.Recitation?.hold('speech', false); };
    window.Recitation?.hold('speech', true);
    try { speechSynthesis.speak(u); } catch { window.Recitation?.hold('speech', false); }
  }
  function say(text, aloud = true) { currentMessage = text; $('#message').textContent = text; if (aloud) speak(text); }
  function clearInput() { keys.clear(); joy.set(0, 0); joyPointer = null; $('#stick').style.transform = ''; }
  function stopWalk() { target = null; guideTarget = null; $('#navigation').hidden = true; }
  function stopLesson() { overlay.querySelector('iframe')?.contentWindow?.postMessage('little-explorer:stop-audio', '*'); }
  function setMode(next) {
    window.Recitation?.hold('game', !['play', 'title'].includes(next));
    stopVoice(); stopLesson(); clearInput(); stopWalk(); mode = next;
    game.classList.toggle('busy', next !== 'play');
    $('#hud').hidden = !started; $('#pip').hidden = next !== 'play'; $('#controls').hidden = next !== 'play';
    overlay.classList.toggle('shaded', !['play', 'title'].includes(next));
    if (next === 'play') { overlay.innerHTML = ''; canvas.focus({ preventScroll: true }); }
    $('#celebrate').hidden = true;
  }
  function focusCard() { const h = overlay.querySelector('h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
  function celebrate(text) {
    $('#celebrate').textContent = text; $('#celebrate').hidden = false;
    clearTimeout(celebrationTimer); celebrationTimer = setTimeout(() => { $('#celebrate').hidden = true; }, 3300);
    if (!reduced) for (let i = 0; i < 26; i++) {
      const star = mesh(new T.OctahedronGeometry(.14), ['#fbd07c', '#e7f0b8', '#e7a17a'][i % 3], position.x, 1.8, position.z);
      stars.push({ mesh: star, vx: (Math.random() - .5) * 6, vz: (Math.random() - .5) * 6, vy: 4 + Math.random() * 3, life: 1.5 });
    }
  }
  const stars = [];
  function dinosaur(type, color, x, z, scale = 1) {
    const root = group(x, .4, z), g = group(0, 0, 0, root); root.scale.setScalar(scale);
    const legs = [];
    for (const a of [-.7, .7]) for (const b of [-.7, .7]) { const leg = group(a, .9, b, g); ball(leg, color, 0, -.45, 0, .32, .65, .32); ball(leg, '#ebdbb0', 0, -.85, .12, .32, .12, .32); legs.push(leg); }
    ball(g, color, 0, 1.3, 0, 1.15, .9, 1.65);
    ball(g, '#d7dca3', 0, 1, .55, .84, .5, 1.05);
    segment(g, color, [0, 1.3, -1.1], [0, 1.1, -3.6], .55);
    let head;
    if (type === 'longneck') {
      segment(g, color, [0, 1.6, .8], [0, 4.5, 1.6], .56);
      head = group(0, 4.65, 1.8, g); ball(head, color, 0, 0, 0, .65, .54, .9);
      ball(head, '#c7d99d', 0, -.22, .4, .53, .21, .53);
      for (let i = 0; i < 4; i++) ball(g, '#b7ce9c', .7, 1.75, -.8 + i * .5, .23, .22, .3);
    } else {
      head = group(0, 1.8, 1.65, g); ball(head, color, 0, 0, .2, .76, .65, .95);
      if (type === 'triceratops') {
        ball(head, '#e9bb80', 0, .35, -.45, 1.2, 1.05, .23);
        for (const xh of [-.48, .48]) segment(head, '#fff0c6', [xh, .35, .2], [xh * 1.1, 1.1, 1.2], .17);
        segment(head, '#fff0c6', [0, .15, .9], [0, .66, 1.4], .17);
      } else {
        for (let i = 0; i < 6; i++) { const plate = mesh(new T.ConeGeometry(.55, 1.4, 4), '#e9b182', i % 2 ? .25 : -.25, 2.38 - Math.abs(i - 2) * .12, -1.25 + i * .47, 1, 1, .36, g); plate.rotation.y = Math.PI / 4; }
      }
      ball(head, '#e9d5a4', 0, -.3, .6, .57, .2, .56);
    }
    for (const side of [-1, 1]) {
      ball(head, '#fff9e5', side * .54, .17, .43, .18, .21, .15);
      ball(head, '#294b40', side * .64, .17, .46, .075, .13, .09);
      ball(head, '#edbe94', side * .61, -.16, .46, .17, .09, .12);
    }
    ball(head, '#54765a', -.22, .02, .85, .055); ball(head, '#54765a', .22, .02, .85, .055);
    root.userData = { body: g, legs, head }; return root;
  }
  dinos.forEach((d, i) => {
    d.model = dinosaur(d.type, d.color, d.x, d.z, 1.12); d.model.rotation.y = [-.4, -1.1, .5][i];
    d.label = label(d.short, d.x, d.type === 'longneck' ? 6.5 : 4.9, d.z, 6.2);
    const ring = mesh(new T.TorusGeometry(2.4, .065, 4, 40), '#fff0ae', d.x, .49, d.z); ring.rotation.x = -Math.PI / 2; ring.castShadow = false; d.ring = ring;
    d.home = new T.Vector3(d.x, .4, d.z); d.roam = null; d.wait = i * 1.1; d.eating = 0;
  });
  // Small explorer, hat, backpack, and an expressive little dinosaur companion.
  const player = group();
  const body = group(0, 0, 0, player), legs = [];
  for (const side of [-1, 1]) {
    const leg = group(side * .23, .66, 0, body); cube(leg, '#626e51', 0, -.22, 0, .28, .55, .3); ball(leg, '#8b613e', 0, -.48, .12, .22, .14, .33); legs.push(leg);
  }
  ball(body, '#edb45c', 0, 1.05, 0, .6, .65, .4);
  cube(body, '#78965a', 0, 1.18, -.4, .65, .7, .27); cube(body, '#9caf76', 0, 1.04, -.57, .43, .28, .14);
  for (const side of [-1, 1]) { ball(body, '#efb259', side * .55, 1.04, 0, .19, .45, .2); ball(body, '#edbd90', side * .59, .72, .02, .18); }
  ball(body, '#edbd90', 0, 1.99, .03, .49, .53, .46);
  for (const side of [-1, 1]) { ball(body, '#4a4f39', side * .18, 2.04, .44, .055, .08, .035); ball(body, '#df9d7e', side * .32, 1.86, .35, .1, .05, .07); }
  cylinder(body, '#e9cf99', 0, 2.39, 0, .8, .8, .14, 12); cylinder(body, '#f3dba8', 0, 2.6, 0, .44, .53, .4, 10); cylinder(body, '#73905d', 0, 2.44, 0, .54, .55, .12, 10);
  const pip = dinosaur('longneck', '#82b3aa', 1, 15, .25);
  eggs.forEach((e, i) => {
    e.model = group(e.x, .7, e.z); ball(e.model, e.color, 0, .75, 0, .7, .98, .7);
    for (let j = 0; j < 5; j++) { const a = j / 5 * Math.PI * 2; ball(e.model, ['#87b578', '#d8a566', '#80afbb'][i], Math.sin(a) * .56, .6 + (j % 2) * .6, Math.cos(a) * .56, .14, .2, .14); }
    disk('#b9b186', e.x, .42, e.z, 1.5, 1.3);
    const ring = mesh(new T.TorusGeometry(1.22, .05, 4, 28), '#fff5bc', e.x, .53, e.z); ring.rotation.x = -Math.PI / 2; ring.castShadow = false; e.ring = ring;
  });
  digs.forEach(d => {
    d.brushed = 0; d.model = group(d.x, .4, d.z);
    d.mound = ball(d.model, '#d6b585', 0, .25, 0, 1.9, .7, 1.65);
    segment(d.model, '#ffedc5', [-.6, .65, 0], [.6, .65, .2], .2);
    for (const x of [-.7, .7]) ball(d.model, '#ffedc5', x, .65, x / 4, .28);
    cylinder(d.model, '#9f8559', 1.9, .85, -.8, .07, .07, 1.8);
    cube(d.model, '#f6d487', 2.35, 1.6, -.8, .9, .5, .05);
  });
  // Museum: three plinths which fill with real 3D displays.
  const museum = group(-12, .4, 15), displays = [];
  disk('#d7d19d', -12, .4, 15, 7, 4.7);
  for (const x of [-5.5, 5.5]) for (const z of [-2.6, 2.6]) cylinder(museum, '#b89863', x, 2.1, z, .13, .17, 4.2);
  const roof = cylinder(museum, '#749c6a', 0, 4.8, 0, 0, 7.7, 2, 4); roof.rotation.y = Math.PI / 4; roof.scale.z = .65;
  label('LITTLE FOSSIL MUSEUM', -12, 6.7, 15, 9);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 3.3; cylinder(museum, '#e7d8ae', x, .6, 0, 1, 1.1, 1.2);
    const display = group(x, 1.3, 0, museum); displays.push(display);
    if (i === 0) for (let j = 0; j < 6; j++) { ball(display, '#fff0ca', 0, .3 + j * .15, -.8 + j * .34, .22 + j * .03, .2, .23); }
    else if (i === 1) { ball(display, '#c8b98f', 0, .15, 0, .85, .14, .8); for (const side of [-1, 0, 1]) ball(display, '#8f9474', side * .32, .28, .24, .14, .04, .35); }
    else { segment(display, '#fff0ca', [0, .3, -.8], [0, .3, .8], .13); for (let j = 0; j < 4; j++) { const rib = mesh(new T.TorusGeometry(.6, .09, 6, 12, Math.PI), '#fff0ca', 0, .3, -.6 + j * .4, 1, 1, 1, display); rib.rotation.y = Math.PI / 2; } }
  }
  // A clearly labelled pretend Egypt model, separate from the island's wildlife.
  const pyramid = cylinder(scene, '#dec18a', -16, 1.7, 21, 0, 2.5, 2.7, 4); pyramid.rotation.y = Math.PI / 4;
  label('MUSEUM MODEL', -16, 3.9, 21, 4.4);
  const nursery = group(13, .4, 15), babies = [];
  disk('#d4d6a1', 13, .38, 15, 6, 4.6);
  for (const z of [-3, 3]) { for (const x of [-5, -2.5, 0, 2.5, 5]) cube(nursery, '#e8d5a4', x, .8, z, .18, 1.6, .18); cube(nursery, '#ebdcaf', 0, .65, z, 10.2, .16, .15); cube(nursery, '#ebdcaf', 0, 1.15, z, 10.2, .16, .15); }
  label('EGG NURSERY', 13, 3.9, 15, 7);
  const nurseryEggs = [];
  eggs.forEach((e, i) => {
    const x = 10 + i * 3;
    disk('#b4a47a', x, .5, 15, 1.2, 1);
    const ne = group(x, .65, 15); ball(ne, e.color, 0, .7, 0, .62, .85, .62); nurseryEggs.push(ne);
    const baby = dinosaur(dinos[i].type, dinos[i].color, x, 15, .28); baby.rotation.y = .2; babies.push(baby);
    const cracks = group(0, 0, 0, ne);
    for (let j = 0; j < 3; j++) { const a = j / 3 * Math.PI * 2; segment(cracks, '#aa9473', [Math.sin(a) * .62, .8, Math.cos(a) * .62], [Math.sin(a + .2) * .59, 1.08, Math.cos(a + .2) * .59], .025); }
    cracks.visible = false; ne.userData.cracks = cracks;
  });
  // Renewable snacks create a gather -> feed -> ride loop, not a free menu action.
  const leafGardens = [[-5, 10], [18, 1], [-15, 0], [3, -14], [25, -14]].map(([x, z], i) => {
    const model = group(x, .45, z); ball(model, '#6c9b59', 0, .5, 0, 1.15, .7, 1);
    const snack = group(0, 1.55, 0, model);
    for (let j = -1; j <= 1; j++) { const leaf = ball(snack, '#c9e49a', j * .36, Math.abs(j) * -.1, 0, .3, .65, .14); leaf.rotation.z = -j * .6; }
    return { id: `leaves-${i}`, name: 'the leaf garden', x, z, model, snack, readyAt: 0 };
  });
  label('FRESH DINO SNACKS', -5, 3.6, 10, 6);
  const coursePoints = [[5, 6, false], [1, -2, true], [-6, -10, false], [1, -15, true], [12, -8, false], [13, 5, true]];
  const hoops = coursePoints.map(([x, z, jump], i) => {
    const g = group(x, .4, z);
    const ring = mesh(new T.TorusGeometry(1.65, .16, 6, 32), '#ffcf70', 0, jump ? 3 : 1.6, 0, 1, 1, 1, g);
    ring.rotation.y = -.6;
    for (const side of [-1, 1]) cylinder(g, '#e3cb97', side * 1.65, .8, 0, .1, .15, 1.6);
    const sign = label(jump ? 'HOP!  ↑' : 'THIS WAY  ◎', x, jump ? 5.7 : 4.3, z, 4.5);
    g.visible = sign.visible = false; return { x, z, jump, model: g, ring, sign };
  });
  const beachBall = ball(scene, '#efbd73', 8, 1.2, -1, .85);
  const ballStripe = mesh(new T.TorusGeometry(.8, .11, 6, 24), '#f8f1c4', 0, 0, 0, 1, 1, 1, beachBall);
  ballStripe.rotation.x = .7;
  const ballVelocity = new T.Vector3();
  const butterflies = [];
  for (let i = 0; i < 7; i++) {
    const g = group(), wings = []; g.visible = !reduced;
    for (const side of [-1, 1]) { const w = ball(g, ['#efbc79', '#e7a694', '#fff0b3'][i % 3], side * .2, 0, 0, .25, .045, .34); wings.push(w); }
    butterflies.push({ model: g, wings, x: i % 2 ? -17 : 9, z: i % 3 ? 7 : -10, phase: i * 1.7 });
  }
  const camp = group(-20, .45, -18);
  disk('#c4ce9a', -20, .37, -18, 5.4, 4);
  const tent = cylinder(camp, '#e4bd7e', -2, 1.8, 0, 0, 2.8, 3.5, 4); tent.rotation.y = Math.PI / 4; tent.scale.z = 1.1;
  cube(camp, '#8b9776', -2, .9, 1.6, 1.4, 1.6, .05);
  const rug = cube(camp, '#759a91', 2, .06, 1, 3, .07, 2.3); rug.rotation.y = .15;
  cube(camp, '#d8d9af', 2, .11, 1, 2.6, .025, 1.9); cube(camp, '#759a91', 2, .13, 1, 2.35, .025, 1.65);
  segment(camp, '#ad9268', [.5, .1, -.8], [1.5, 1.1, -1.8], .12); segment(camp, '#ad9268', [2.4, .1, -.8], [1.5, 1.1, -1.8], .12);
  const bookLeft = cube(camp, '#fff0c9', 1.05, 1.12, -1.65, .85, .09, .95); bookLeft.rotation.z = -.18;
  const bookRight = cube(camp, '#fff0c9', 1.9, 1.12, -1.65, .85, .09, .95); bookRight.rotation.z = .18;
  label('QUIET CAMP', -20, 5.4, -18, 7);
  const trailDots = [];
  for (let i = 0; i < 11; i++) { const dot = disk('#fff2b2', 0, .55, 0, .16, .16); dot.visible = false; trailDots.push(dot); }
  const destinationRing = mesh(new T.TorusGeometry(1.5, .1, 4, 36), '#fff1ad', 0, .6, 0); destinationRing.rotation.x = -Math.PI / 2; destinationRing.visible = false; destinationRing.castShadow = false;
  const raycaster = new T.Raycaster(), pointer = new T.Vector2(), groundPlane = new T.Plane(new T.Vector3(0, 1, 0), -.4);
  function updateMission() {
    const total = state.dinosaurs.length + state.eggs.length + state.fossils.length + state.displayed.length + state.hatched.length;
    $('#trail-fill').style.width = `${course ? course.index / hoops.length * 100 : total / 15 * 100}%`;
    $('#mission').textContent = course ? `Hoop ${course.index + 1} of 6 · ${hoops[course.index].jump ? 'Hop through the high hoop!' : 'Through the glowing hoop!'}` : total === 15 ? 'Take a baby on the hop trail!' : state.fossils.length > state.displayed.length ? 'A fossil for your little museum!' : state.eggs.length > state.hatched.length ? 'An egg for the cosy nursery!' : state.dinosaurs.length === 0 ? 'Gather leaves. Make a dino friend.' : 'Hidden eggs. Old fossils. New friends.';
  }
  function refreshPlayTools() {
    $('#leaf-count').textContent = state.leaves;
    $('#buddy-button').hidden = !state.hatched.length;
    $('#buddy-button').textContent = state.companion ? '🐣 Back to nest' : '🐣 Walk together';
    $('#buddy-button').setAttribute('aria-pressed', String(!!state.companion));
    $('#course-button').textContent = course ? '◎ Stop trail' : '◎ Hop trail';
    $('#course-button').setAttribute('aria-pressed', String(!!course));
    updateMission();
  }
  function startCourse() {
    if (!isPlaying()) return;
    cancelHatch(); stopWalk();
    if (course) { course = null; hoops.forEach(h => { h.model.visible = h.sign.visible = false; }); say('The trail can wait. Let’s keep exploring!'); }
    else { course = { index: 0 }; say('A hopping adventure! Find the glowing hoop. Some hoops are high: hop inside them! Ride a dinosaur or go on foot. No timer, and you can try again.'); }
    refreshPlayTools();
  }
  function cancelHatch() {
    if (!hatch) return;
    const egg = nurseryEggs[hatch.index]; egg.rotation.set(0, 0, 0); egg.position.y = .65; egg.scale.setScalar(1); egg.userData.cracks.visible = false;
    hatch = null; syncWorld();
  }
  function hatchTap() {
    if (!hatch || hatch.phase === 'opening') return;
    hatch.taps++; hatch.shake = .6;
    nurseryEggs[hatch.index].userData.cracks.visible = true;
    if (hatch.taps >= 4) {
      hatch.phase = 'opening'; hatch.elapsed = 0;
      if (!reduced) for (let i = 0; i < 9; i++) {
        const shell = ball(scene, eggs[hatch.index].color, 10 + hatch.index * 3, 1.6, 15, .15, .12, .23);
        stars.push({ mesh: shell, vx: (rand() - .5) * 4, vz: (rand() - .5) * 4, vy: 3 + rand() * 2, life: 1.7 });
      }
      say('Crack, crack… who is inside?');
    }
    else say(['A tiny wiggle! Tap again.', 'A little crack! Keep tapping gently.', 'Someone wants to say hello! One more tap.'][hatch.taps - 1]);
  }
  function beginHatch(egg) {
    cancelHatch(); hatch = { id: egg, index: eggs.findIndex(e => e.id === egg), taps: 0, phase: 'tapping', elapsed: 0, shake: 0 };
    say('There is a baby inside your egg! Tap the gold egg button four times and watch it hatch.');
  }
  function toggleBuddy() {
    if (!isPlaying() || !state.hatched.length) return;
    state.companion = state.companion ? null : state.hatched[0];
    refreshPlayTools(); save(); say(state.companion ? 'Your little dinosaur is coming with you! Take a walk, hop through the hoops, or play with the beach ball.' : 'Your little dinosaur will wander back to its cosy nest.');
  }
  function updateLiving(dt) {
    dinos.forEach((d, i) => {
      const p = d.model.position, ridingThis = riding === d.id;
      const nearby = started && Math.hypot(p.x - position.x, p.z - position.z) < 6.5;
      let walking = ridingThis && moving;
      if (!ridingThis && !nearby && guideTarget?.id !== d.id) {
        d.wait -= dt;
        if (d.wait <= 0) {
          if (!d.roam) { const a = rand() * Math.PI * 2, r = 2 + rand() * 4; d.roam = d.home.clone().add(new T.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); const radius = Math.hypot(d.roam.x / 34, d.roam.z / 26); if (radius > 1) { d.roam.x /= radius; d.roam.z /= radius; } }
          const dx = d.roam.x - p.x, dz = d.roam.z - p.z, distance = Math.hypot(dx, dz);
          if (distance < .2) { d.roam = null; d.wait = 1.5 + rand() * 2.5; }
          else { p.x += dx / distance * dt * 1.5; p.z += dz / distance * dt * 1.5; d.model.rotation.y = Math.atan2(dx, dz); walking = true; }
        }
      } else if (!ridingThis && nearby) d.model.rotation.y = Math.atan2(position.x - p.x, position.z - p.z);
      d.model.userData.legs.forEach((leg, j) => { leg.rotation.x = walking && !reduced ? Math.sin(time * 8 + (j % 3 === 0 ? 0 : Math.PI)) * .4 : 0; });
      const head = d.model.userData.head;
      head.rotation.x = d.eating > time ? Math.sin(time * 8) * .23 : !reduced ? Math.sin(time + i) * .04 : 0;
      d.label.position.set(p.x, (d.type === 'longneck' ? 6.5 : 4.9) + (ridingThis ? hopHeight : 0), p.z);
      d.ring.position.set(p.x, .49, p.z);
    });
    babies.forEach((b, i) => {
      if (!state.hatched.includes(eggs[i].id)) return;
      const follows = state.companion === eggs[i].id;
      const targetX = follows ? pip.position.x - 1.4 : 10 + i * 3 + Math.sin(time * .6 + i) * .7;
      const targetZ = follows ? pip.position.z + 1.3 : 15 + Math.cos(time * .6 + i) * .65;
      const dx = targetX - b.position.x, dz = targetZ - b.position.z, dist = Math.hypot(dx, dz);
      if (dist > .3) { const step = Math.min(dist, dt * (follows ? 11 : 2)); b.position.x += dx / dist * step; b.position.z += dz / dist * step; b.rotation.y = Math.atan2(dx, dz); }
      b.position.y = .42 + (!reduced && dist > .3 ? Math.abs(Math.sin(time * 11)) * .12 : 0);
      b.userData.legs.forEach((leg, j) => { leg.rotation.x = dist > .3 && !reduced ? Math.sin(time * 11 + j * Math.PI) * .4 : 0; });
    });
    leafGardens.forEach(g => {
      g.snack.visible = time >= g.readyAt;
      if (!reduced) { g.snack.rotation.y = time; g.snack.position.y = 1.55 + Math.sin(time * 2) * .12; }
      if (started && time >= g.readyAt && state.leaves < 9 && Math.hypot(position.x - g.x, position.z - g.z) < 2) {
        g.readyAt = time + 12; state.leaves++; refreshPlayTools(); save(); say(`A fresh leaf! ${state.leaves === 1 ? 'Take it to a dinosaur and share a snack.' : 'A snack for your dinosaur friends.'}`);
      }
    });
    if (hatch) {
      const h = hatch, egg = nurseryEggs[h.index]; h.shake = Math.max(0, h.shake - dt);
      egg.rotation.z = reduced ? 0 : Math.sin(time * 23) * h.shake * .35;
      if (h.phase === 'opening') {
        h.elapsed += dt; const f = Math.min(1, h.elapsed / 1.8);
        egg.scale.setScalar(Math.max(.02, 1 - f)); egg.position.y = .65 + Math.sin(f * Math.PI) * 1.7;
        babies[h.index].visible = true; babies[h.index].scale.setScalar(.28 * Math.max(.02, f));
        babies[h.index].position.set(10 + h.index * 3, .4 + Math.sin(f * Math.PI) * 1.5, 15);
        if (f === 1) {
          state.hatched.push(h.id); state.companion = h.id; hatch = null;
          egg.rotation.set(0, 0, 0); egg.position.y = .65; egg.scale.setScalar(1); egg.userData.cracks.visible = false;
          syncWorld(); celebrate('🐣 Hello, little dinosaur!'); say('Hello, little dinosaur! Your baby wants to explore with you. Walk away and watch it follow!');
        }
      }
    }
    hoops.forEach((h, i) => {
      h.model.visible = h.sign.visible = !!course && i === course.index;
      if (h.model.visible && !reduced) h.ring.rotation.y = -.6 + Math.sin(time) * .2;
    });
    if (course) {
      const h = hoops[course.index];
      if (Math.hypot(position.x - h.x, position.z - h.z) < 1.9 && (!h.jump || hopHeight > .65)) {
        course.index++;
        if (course.index === hoops.length) { course = null; state.trailComplete = true; save(); celebrate('◎ A whole hopping adventure!'); say('Through every hoop! That was a lovely adventure. Try the trail again on a dinosaur, or bring a baby along!'); }
        else { celebrate('◎ Through the hoop!'); say(hoops[course.index].jump ? 'Now find the high hoop. Hop when you are inside it!' : 'Lovely! Look for the next glowing hoop.'); }
        refreshPlayTools();
      }
    }
    ballCooldown = Math.max(0, ballCooldown - dt);
    const delta = new T.Vector3().subVectors(beachBall.position, position); delta.y = 0;
    if (moving && delta.length() < (riding ? 3 : 1.8) && ballCooldown === 0) { if (delta.length() < .1) delta.set(Math.sin(player.rotation.y), 0, Math.cos(player.rotation.y)); ballVelocity.copy(delta.normalize()).multiplyScalar(riding ? 16 : 10); ballCooldown = .4; }
    beachBall.position.addScaledVector(ballVelocity, dt); ballVelocity.multiplyScalar(Math.exp(-1.15 * dt));
    const radius = Math.hypot(beachBall.position.x / 35, beachBall.position.z / 27);
    if (radius > 1) { beachBall.position.x /= radius; beachBall.position.z /= radius; ballVelocity.multiplyScalar(-.75); }
    beachBall.position.y = 1.2 + (!reduced ? Math.abs(Math.sin(time * 6)) * Math.min(.7, ballVelocity.length() / 12) : 0);
    beachBall.rotation.x += ballVelocity.z * dt; beachBall.rotation.z -= ballVelocity.x * dt;
    if (!reduced) {
      ripples.forEach((r, i) => { r.position.y = -1.1 + Math.sin(time * 1.5 + i) * .08; });
      butterflies.forEach((b, i) => { const a = time * .3 + b.phase; b.model.position.set(b.x + Math.cos(a) * (3 + i), 2.5 + Math.sin(time * 1.5 + i) * .6, b.z + Math.sin(a) * 4); b.model.rotation.y = -a; b.wings.forEach((w, j) => { w.rotation.z = Math.sin(time * 15 + i) * (j ? 1 : -1); }); });
    }
  }
  function syncWorld() {
    eggs.forEach((e, i) => { const found = state.eggs.includes(e.id); e.model.visible = e.ring.visible = !found; nurseryEggs[i].visible = found && !state.hatched.includes(e.id); babies[i].visible = state.hatched.includes(e.id); });
    digs.forEach(d => { d.model.visible = !state.fossils.includes(d.id); });
    dinos.forEach(d => { d.ring.visible = !state.dinosaurs.includes(d.id); });
    displays.forEach((g, i) => { g.visible = state.displayed.includes(digs[i].id); });
    $('#dino-count').textContent = `${state.dinosaurs.length}/3`; $('#egg-count').textContent = `${state.eggs.length}/3`; $('#fossil-count').textContent = `${state.fossils.length}/3`;
    refreshPlayTools();
    $('#voice-button').textContent = `English voice: ${state.voice ? 'on' : 'off'}`; $('#voice-button').setAttribute('aria-pressed', String(state.voice));
    save();
  }
  function closeMarkup(action = 'resume') { return `<button class="close" data-action="${action}" aria-label="Back to exploring">×</button>`; }
  function title() {
    setMode('title');
    overlay.innerHTML = `<section class="title-screen"><div class="title-copy"><span class="eyebrow">A TINY ISLAND. A DINOSAUR-SIZED ADVENTURE.</span><h1>Pip’s<br>Dinosaur<em>Island.</em></h1><p>Hidden eggs. Friendly giants.<br>A little museum made by you.</p><div class="button-row"><button class="primary" data-action="start">${stored.eggs || stored.fossils || stored.dinosaurs ? 'Let’s explore again!' : 'Let’s explore!'} ▶</button><button class="quiet-button" data-action="audio">☷ Qur’an audio</button></div><div class="fine">EXPLORE · COLLECT · HATCH · DISCOVER</div></div><div class="title-sticker"><span>🦕</span>No enemies. No hurry.<br>Pip is coming with you.</div></section>`;
  }
  function start() { started = true; setMode('play'); say('Salaam, explorer! I’m Pip. Let’s play! Gather floating leaves for our roaming dinosaurs, brush away real sand, and hop through the golden hoops.'); }
  function resume() { setMode('play'); }
  function pause() {
    if (!started) return;
    save(); setMode('pause'); overlay.innerHTML = `<section class="card pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title"><span class="big-icon">☁</span><span class="eyebrow">PIP WILL WAIT RIGHT HERE</span><h2 id="pause-title">A little breather.</h2><p>Your discoveries are safe. There’s no timer to beat.</p><div class="button-row"><button class="primary green" data-action="resume">Keep exploring ▶</button><button data-action="map">Island map ▦</button><button data-action="journal">My discoveries ▤</button></div></section>`; focusCard();
  }
  function nextIn(type) {
    if (type === 'dinosaurs') { const d = dinos.find(d => !state.dinosaurs.includes(d.id)) || dinos[0]; return { ...d, x: d.model.position.x, z: d.model.position.z }; }
    if (type === 'eggs') return eggs.find(e => !state.eggs.includes(e.id)) || places[1];
    if (type === 'dig') return digs.find(d => !state.fossils.includes(d.id)) || places[0];
    if (type === 'leaves') return [...leafGardens].sort((a, b) => (a.readyAt > time) - (b.readyAt > time) || Math.hypot(a.x - position.x, a.z - position.z) - Math.hypot(b.x - position.x, b.z - position.z))[0];
    if (type === 'ball') return { ...places.find(p => p.id === 'ball'), x: beachBall.position.x, z: beachBall.position.z };
    return places.find(p => p.id === type);
  }
  function goTo(destination) {
    if (!destination) return;
    cancelHatch(); setMode('play');
    if (destination.id === 'course' && !course) startCourse();
    target = new T.Vector3(destination.x, .4, destination.z); guideTarget = destination;
    $('#navigation').hidden = false; $('#navigation-label').textContent = `Pip’s trail · ${destination.name}`;
    destinationRing.position.set(destination.x, .6, destination.z); destinationRing.visible = true;
    say(`Let’s go to ${destination.name}. Follow the little golden dots! You can steer any time.`);
  }
  function help() {
    if (hatch) { say('Tap the gold egg button to help your baby hatch! You can walk away any time and come back later.'); return; }
    if (course) { const h = hoops[course.index]; goTo({ id: 'hoop', name: h.jump ? 'the hopping hoop' : 'the next hoop', x: h.x, z: h.z }); return; }
    let options = [];
    if (state.fossils.length > state.displayed.length) options.push(places[0]);
    if (state.eggs.length > state.hatched.length) options.push(places[1]);
    if (!options.length && state.leaves === 0 && state.dinosaurs.length < 3) options.push(nextIn('leaves'));
    if (!options.length) options = [...eggs.filter(e => !state.eggs.includes(e.id)), ...digs.filter(d => !state.fossils.includes(d.id)), ...dinos.filter(d => !state.dinosaurs.includes(d.id)).map(d => ({ ...d, x: d.model.position.x, z: d.model.position.z }))];
    if (!options.length) { if (!course) startCourse(); return; }
    options.sort((a, b) => Math.hypot(a.x - position.x, a.z - position.z) - Math.hypot(b.x - position.x, b.z - position.z)); goTo(options[0]);
  }
  function showMap() {
    setMode('map');
    const svgPos = o => [150 + o.x * 3, 123 + o.z * 2.8];
    const [px, py] = svgPos(position);
    overlay.innerHTML = `<section class="card" role="dialog" aria-modal="true" aria-labelledby="map-title">${closeMarkup()}<span class="eyebrow">FOLLOW YOUR CURIOSITY</span><h2 id="map-title">Your pocket island.</h2><p>Pick a picture. Pip will lead the way.</p><div class="map-layout"><div class="island-map"><svg viewBox="0 0 300 247" role="img" aria-label="Island map with your location, dinosaurs, museum, nursery and camp"><ellipse cx="150" cy="124" rx="139" ry="109" fill="#e9d39d"/><ellipse cx="150" cy="121" rx="129" ry="101" fill="#accb83"/><path d="M115 166Q128 141 130 125T80 81M115 166Q159 167 192 166T220 98M80 81Q100 45 147 65T220 98" fill="none" stroke="#ddd7a1" stroke-width="7" stroke-linecap="round"/>${[...dinos.map(d => ({ ...d, x: d.model.position.x, z: d.model.position.z, icon: '🦕' })), ...eggs.filter(e => !state.eggs.includes(e.id)).map(e => ({ ...e, icon: '🥚' })), ...digs.filter(d => !state.fossils.includes(d.id)).map(d => ({ ...d, icon: '🦴' })), ...places.slice(0, 3)].map(p => { const [x, y] = svgPos(p); return `<text x="${x}" y="${y}" font-size="18" text-anchor="middle" dominant-baseline="middle">${p.icon}</text>`; }).join('')}<circle cx="${px}" cy="${py}" r="6" fill="#f6ae48" stroke="#fff8d7" stroke-width="3"/></svg></div><div class="map-destinations">${places.map(p => `<button class="destination" data-action="visit" data-place="${p.id}" aria-label="Follow Pip to ${p.name}"><span>${p.icon}</span><div><strong>${p.name}</strong><small>${p.hint}</small></div></button>`).join('')}</div></div><p class="map-key">● The gold dot is you. Every place is always open.</p><div class="button-row map-settings"><button data-action="audio">☷ Qur’an audio</button><button data-action="notes">Grown-up notes</button></div></section>`; focusCard();
  }
  function journal(tab = journalTab) {
    journalTab = tab; setMode('journal');
    const list = tab === 'dinosaurs' ? dinos : tab === 'eggs' ? eggs : digs;
    const collected = tab === 'dinosaurs' ? state.dinosaurs : tab === 'eggs' ? state.eggs : state.fossils;
    const icons = tab === 'dinosaurs' ? ['🦕', '🦖', '🦕'] : tab === 'eggs' ? ['🥚', '🥚', '🥚'] : ['🦴', '🐾', '🦴'];
    overlay.innerHTML = `<section class="card" role="dialog" aria-modal="true" aria-labelledby="journal-title">${closeMarkup()}<span class="eyebrow">LITTLE THINGS. BIG DISCOVERIES.</span><h2 id="journal-title">My discovery book.</h2><div class="journal-tabs" role="group" aria-label="Discovery pages">${[['dinosaurs', '🦕 Friends'], ['eggs', '🥚 Eggs'], ['fossils', '🦴 Fossils']].map(([id, name]) => `<button class="${tab === id ? 'active' : ''}" data-action="tab" data-tab="${id}" aria-pressed="${tab === id}">${name}</button>`).join('')}</div><div class="journal-grid">${list.map((item, i) => `<button class="find-card ${collected.includes(item.id) ? 'found' : ''}" data-action="find" data-type="${tab}" data-index="${i}" aria-label="${collected.includes(item.id) ? 'Visit' : 'Find'} ${item.name}"><span aria-hidden="true">${icons[i]}</span><strong>${collected.includes(item.id) ? item.name : '?'}</strong><small>${collected.includes(item.id) ? tab === 'eggs' ? state.hatched.includes(item.id) ? 'Hatched in your nursery!' : 'Ready for the nursery' : tab === 'fossils' ? state.displayed.includes(item.id) ? 'At home in your museum' : 'Ready for your museum' : 'Your dinosaur friend' : 'Tap to follow Pip’s trail'}</small></button>`).join('')}</div><div class="progress-line">Museum: <b id="display-count">${state.displayed.length}/3</b> displays &nbsp; · &nbsp; Nursery: <b id="hatch-count">${state.hatched.length}/3</b> babies</div><p>Discoveries stay on this browser. No scores. Every find is yours to enjoy.</p><button class="primary green" data-action="resume">More exploring →</button></section>`; focusCard();
  }
  function showCamp() {
    setMode('camp'); overlay.innerHTML = `<section class="card" role="dialog" aria-modal="true" aria-labelledby="camp-title">${closeMarkup()}<span class="eyebrow">ALWAYS OPEN. ALWAYS YOUR CHOICE.</span><h2 id="camp-title">A little quiet, together.</h2><p>Bring your grown-up. No tests, scores, or rewards here.</p><div class="camp-choices"><button class="camp-choice" data-action="prayer"><span>☾</span>My prayer trail</button><button class="camp-choice" data-action="quran"><span>☷</span>Qur’an garden</button></div><button data-action="resume">Back to the island →</button></section>`; focusCard(); speak('Welcome to our quiet camp. Choose prayer or Qur’an time with your grown-up, or keep exploring.');
  }
  function learn(topic) {
    setMode('learning'); overlay.innerHTML = `<section class="card learning-card" role="dialog" aria-modal="true" aria-label="${topic === 'prayer' ? 'Prayer learning' : 'Qur’an learning'}"><div class="learning-header"><div><strong>${topic === 'prayer' ? 'A little prayer, together.' : 'A little ayah, together.'}</strong><small>GROWN-UP GUIDED · NO SCORES OR REWARDS</small></div><button data-action="camp">← Back to camp</button></div><iframe src="index.html?camp=1#${topic}" title="${topic === 'prayer' ? 'Muhammadiyah prayer learning' : 'Al-Fatihah and the last three surahs'}"></iframe></section>`;
    overlay.querySelector('button').focus({ preventScroll: true });
  }
  function getNearby() {
    if (hatch) return { kind: 'hatching', icon: '🥚', action: hatch.phase === 'opening' ? 'HELLO!' : 'TAP EGG', prompt: hatch.phase === 'opening' ? 'A baby is hatching!' : `Gently tap the egg · ${hatch.taps}/4` };
    const objects = [];
    eggs.forEach(e => { if (!state.eggs.includes(e.id)) objects.push({ ...e, kind: 'egg', radius: 2.6, prompt: 'A hidden egg! Pick it up', icon: '🥚', action: 'COLLECT' }); });
    digs.forEach((d, i) => { if (!state.fossils.includes(d.id)) objects.push({ ...d, index: i, kind: 'dig', radius: 3.3, prompt: 'Brush the sand to uncover a fossil', icon: '⛏', action: 'DIG' }); });
    dinos.forEach((d, i) => { if (riding !== d.id) objects.push({ ...d, index: i, x: d.model.position.x, z: d.model.position.z, kind: 'dino', radius: 4.3, prompt: state.dinosaurs.includes(d.id) ? `Ride with ${d.name.split(' ')[0]}` : `Share a leaf with ${d.name.split(' ')[0]}`, icon: state.dinosaurs.includes(d.id) ? '🦕' : '🌿', action: state.dinosaurs.includes(d.id) ? 'RIDE' : 'FEED' }); });
    places.slice(0, 3).forEach(p => objects.push({ ...p, kind: p.id, radius: p.id === 'camp' ? 5 : 5.8, prompt: p.id === 'museum' ? 'Put your fossils on display' : p.id === 'nursery' ? 'Visit your egg nursery' : 'Prayer and Qur’an with a grown-up', icon: p.icon, action: p.id === 'museum' ? 'DISPLAY' : p.id === 'nursery' ? 'HATCH' : 'QUIET TIME' }));
    const found = objects.filter(o => Math.hypot(o.x - position.x, o.z - position.z) < o.radius).sort((a, b) => Math.hypot(a.x - position.x, a.z - position.z) - Math.hypot(b.x - position.x, b.z - position.z))[0];
    return found || (riding ? { kind: 'dismount', icon: '↓', action: 'HOP OFF', prompt: 'Hop off your dinosaur friend' } : null);
  }
  function interact() {
    if (!isPlaying()) return;
    stopWalk(); const o = getNearby();
    if (!o) { help(); return; }
    if (o.kind === 'egg') {
      state.eggs.push(o.id); syncWorld(); celebrate('🥚 A hidden egg!'); say('You found a hidden egg! Take it to the cosy nursery. We can hatch a pretend baby dinosaur together.');
    } else if (o.kind === 'dig') {
      const dig = digs[o.index]; setMode('brush');
      window.IslandActivities.brush({ host: overlay, dig, onExit: resume, onSpeak: speak, onCollect: () => {
        if (mode !== 'brush' || state.fossils.includes(dig.id)) return;
        state.fossils.push(dig.id); resume(); syncWorld(); celebrate('🦴 You uncovered a fossil!'); say(`A ${dig.name.toLowerCase()}! You brushed the sand away yourself. Your little museum has a place for this discovery.`);
      } }); focusCard();
    } else if (o.kind === 'dino') {
      if (!state.dinosaurs.includes(o.id)) {
        if (state.leaves === 0) { goTo(nextIn('leaves')); say('Let’s gather a snack first! Walk into the floating leaves, then come back to your dinosaur friend.'); return; }
        state.leaves--; dinos[o.index].eating = time + 3;
        state.dinosaurs.push(o.id); syncWorld(); celebrate(`🌿 ${o.name.split(' ')[0]} is your friend!`); say(`You shared some leaves with ${o.name}. ${o.fact} Tap the helping hand again for a ride!`);
      } else { riding = o.id; say('Dinosaur taxi! Walk as usual, or tap Hop for a big bouncy step. The helping hand lets you hop off.'); }
    } else if (o.kind === 'museum') {
      const fossil = state.fossils.find(id => !state.displayed.includes(id));
      if (!fossil) say(state.displayed.length === 3 ? 'Look at your wonderful museum! All three fossils have a home, thanks to your exploring.' : 'This is your very own fossil museum. Find a sandy dig, rub the sand away, then bring the fossil here!');
      else { state.displayed.push(fossil); syncWorld(); celebrate(state.displayed.length === 3 ? '✦ Your museum is full!' : '🦴 A new museum display!'); say(state.displayed.length === 3 ? 'You filled your little museum! Three discoveries, found by you. You can visit them whenever you like.' : 'A lovely new display! If you have another fossil, tap again to put it in the museum.'); }
    } else if (o.kind === 'nursery') {
      const egg = state.eggs.find(id => !state.hatched.includes(id));
      if (!egg) { if (state.hatched.length) toggleBuddy(); else say('A cosy place for our pretend eggs. Find a spotted egg on the island, then bring it here to hatch!'); }
      else beginHatch(egg);
    } else if (o.kind === 'hatching') { hatchTap();
    } else if (o.kind === 'camp') showCamp();
    else if (o.kind === 'dismount') { const d = dinos.find(d => d.id === riding); d.home.copy(d.model.position); d.roam = null; d.wait = 2; riding = null; say('Back on little explorer feet! Thank you for the ride, dinosaur friend.'); }
    nearest = getNearby(); updatePrompt();
  }
  function isPlaying() { return mode === 'play' && !document.hidden && !$('#notes').open && !$('#recitation-dialog').open; }
  function updatePrompt() {
    $('#nearby').hidden = !nearest || mode !== 'play';
    $('#nearby').textContent = nearest?.prompt || '';
    $('#action-icon').textContent = nearest?.icon || '✋'; $('#action-label').textContent = nearest?.action || 'EXPLORE';
    $('#action-button').setAttribute('aria-label', nearest?.prompt || 'Pip, show me a discovery');
    $('#action-button').classList.toggle('ready', !!nearest);
  }
  const camFocus = new T.Vector3(0, 0, 0), camOffset = new T.Vector3(20, 28, 29), desired = new T.Vector3();
  function resize() {
    const w = game.clientWidth, h = game.clientHeight; renderer.setSize(w, h, false);
    const span = mode === 'title' ? (w / h < .8 ? 62 : 69) : hatch ? 22 : (w / h < .8 ? 32 : 35), aspect = w / h;
    camera.left = -span * aspect / 2; camera.right = span * aspect / 2; camera.top = span / 2; camera.bottom = -span / 2; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(game);
  let previousMode, previousHatch;
  function frame(now) {
    requestAnimationFrame(frame); const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    if (document.hidden) return;
    if (mode !== previousMode || !!hatch !== previousHatch) { previousMode = mode; previousHatch = !!hatch; resize(); }
    const active = isPlaying();
    moving = false;
    if (active) {
      time += dt; saveTime += dt;
      const horizontal = (keys.has('ArrowRight') || keys.has('d') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') ? 1 : 0) + joy.x;
      const vertical = (keys.has('ArrowDown') || keys.has('s') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('w') ? 1 : 0) + joy.y;
      const direction = new T.Vector3();
      if (Math.hypot(horizontal, vertical) > .12) {
        cancelHatch();
        stopWalk(); direction.set(horizontal * .823 + vertical * .568, 0, -horizontal * .568 + vertical * .823);
        if (direction.length() > 1) direction.normalize();
      } else if (target) {
        direction.copy(target).sub(position); direction.y = 0;
        if (direction.length() < 1.6) { const arrived = guideTarget; stopWalk(); destinationRing.visible = false; if (arrived) say(`Here we are! ${arrived.name}. Tap the helping hand to explore.`); direction.set(0, 0, 0); }
        else direction.normalize();
      }
      moving = direction.lengthSq() > .01;
      if (moving) {
        position.addScaledVector(direction, dt * (riding ? 10 : target ? 10 : 7.5));
        if (bound() && target) { stopWalk(); destinationRing.visible = false; say('The sea is the edge of our island. Let’s explore the grass instead.'); }
        player.rotation.y = Math.atan2(direction.x, direction.z); autoSaveDirty = true;
      }
      hopVelocity -= 19 * dt; hopHeight = Math.max(0, hopHeight + hopVelocity * dt); if (!hopHeight) hopVelocity = 0;
      if (riding) {
        const d = dinos.find(d => d.id === riding); d.model.position.set(position.x, .4 + hopHeight, position.z); d.model.rotation.y = player.rotation.y;
        d.label.position.set(position.x, d.type === 'longneck' ? 6.5 : 4.9, position.z);
      }
      player.position.copy(position); player.position.y += hopHeight + (riding ? 2.65 : 0);
      legs.forEach((leg, i) => { leg.rotation.x = moving && !riding && !reduced ? Math.sin(time * 13 + i * Math.PI) * .65 : 0; });
      const behind = new T.Vector3(-Math.sin(player.rotation.y) * 2, 0, -Math.cos(player.rotation.y) * 2);
      desired.copy(position).add(behind); pip.position.lerp(desired, Math.min(1, dt * 4)); pip.position.y = .42 + (moving && !reduced ? Math.abs(Math.sin(time * 10)) * .15 : 0); pip.rotation.y = player.rotation.y;
      eggs.forEach((e, i) => { if (!reduced) { e.model.position.y = .7 + Math.sin(time * 2 + i) * .12; e.model.rotation.y = time * .25; } });
      updateLiving(dt);
      nearest = getNearby(); updatePrompt();
      if (autoSaveDirty && saveTime > 2) { save(); saveTime = 0; }
    }
    if (mode === 'title') {
      time += dt; updateLiving(dt);
      desired.set(-1, 0, -2); camFocus.lerp(desired, .07);
    } else { desired.copy(hatch ? nurseryEggs[hatch.index].position : position); if (hatch) desired.z = 15; desired.y = 0; camFocus.lerp(desired, reduced ? 1 : Math.min(1, dt * 5)); }
    camera.position.copy(camFocus).add(camOffset); camera.lookAt(camFocus);
    // Open the museum like a dollhouse when the explorer visits, revealing the displays.
    roof.visible = mode === 'title' || Math.hypot(position.x + 12, position.z - 15) > 9;
    const trailTarget = target || (course ? hoops[course.index] : null);
    const showTrail = active && !!trailTarget;
    destinationRing.visible = showTrail;
    if (showTrail) destinationRing.position.set(trailTarget.x, .6, trailTarget.z);
    trailDots.forEach((dot, i) => { dot.visible = showTrail; if (showTrail) { const f = (i + 1) / 12; dot.position.set(position.x + (trailTarget.x - position.x) * f, .56, position.z + (trailTarget.z - position.z) * f); } });
    for (let i = stars.length - 1; i >= 0; i--) {
      const p = stars[i]; if (active) { p.life -= dt; p.vy -= 9 * dt; p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt; p.mesh.rotation.y += dt * 4; }
      if (p.life <= 0) { scene.remove(p.mesh); p.mesh.geometry.dispose(); stars.splice(i, 1); }
    }
    canvas.dataset.x = position.x.toFixed(2); canvas.dataset.z = position.z.toFixed(2); canvas.dataset.riding = riding || '';
    canvas.dataset.dinosaurs = JSON.stringify(dinos.map(d => [Number(d.model.position.x.toFixed(2)), Number(d.model.position.z.toFixed(2))]));
    canvas.dataset.ball = JSON.stringify([Number(beachBall.position.x.toFixed(2)), Number(beachBall.position.z.toFixed(2))]);
    canvas.dataset.baby = state.companion ? JSON.stringify([Number(babies[eggs.findIndex(e => e.id === state.companion)].position.x.toFixed(2)), Number(babies[eggs.findIndex(e => e.id === state.companion)].position.z.toFixed(2))]) : '';
    game.dataset.activity = hatch ? `hatch-${hatch.phase}` : mode;
    renderer.render(scene, camera);
  }
  function hop() { if (isPlaying() && hopHeight === 0) hopVelocity = riding ? 8 : 6; }
  $('#action-button').addEventListener('click', interact); $('#hop-button').addEventListener('click', hop);
  $('#help-button').addEventListener('click', help); $('#repeat-button').addEventListener('click', () => speak(currentMessage));
  $('#map-button').addEventListener('click', showMap); $('#journal-button').addEventListener('click', () => journal()); $('#pause-button').addEventListener('click', pause);
  $('#cancel-walk').addEventListener('click', () => { stopWalk(); destinationRing.visible = false; });
  $('#course-button').addEventListener('click', startCourse); $('#buddy-button').addEventListener('click', toggleBuddy);
  const joystick = $('#joystick');
  function moveJoy(e) {
    const rect = joystick.getBoundingClientRect(), range = rect.width * .32;
    joy.set((e.clientX - rect.left - rect.width / 2) / range, (e.clientY - rect.top - rect.height / 2) / range);
    if (joy.length() > 1) joy.normalize(); $('#stick').style.transform = `translate(${joy.x * range}px,${joy.y * range}px)`;
  }
  joystick.addEventListener('pointerdown', e => { if (!isPlaying()) return; e.preventDefault(); joyPointer = e.pointerId; joystick.setPointerCapture(e.pointerId); moveJoy(e); });
  joystick.addEventListener('pointermove', e => { if (e.pointerId === joyPointer) { e.preventDefault(); moveJoy(e); } });
  const endJoy = e => { if (e.pointerId === joyPointer) { joyPointer = null; joy.set(0, 0); $('#stick').style.transform = ''; } };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => joystick.addEventListener(name, endJoy));
  canvas.addEventListener('pointerdown', e => {
    if (!isPlaying()) return; e.preventDefault(); canvas.focus({ preventScroll: true });
    const r = canvas.getBoundingClientRect(); pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera); const hit = new T.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, hit)) {
      cancelHatch();
      const radius = Math.hypot(hit.x / 37.5, hit.z / 29); if (radius > 1) { hit.x /= radius; hit.z /= radius; }
      target = hit; guideTarget = null; $('#navigation').hidden = true;
    }
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('#notes').open || $('#recitation-dialog').open) return;
      if (mode === 'play') pause(); else if (mode !== 'title') resume(); return;
    }
    if (!isPlaying() || e.target.closest('input,select,textarea,iframe')) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if ([' ', 'Enter'].includes(k) && e.target.closest('button,a')) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd', ' ', 'e', 'Enter'].includes(k)) e.preventDefault();
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].includes(k)) keys.add(k);
    if (k === ' ' && !e.repeat) hop(); if (['e', 'Enter'].includes(k) && !e.repeat) interact();
  });
  window.addEventListener('keyup', e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
  window.addEventListener('blur', () => { clearInput(); if (mode === 'play' && !$('#notes').open && !$('#recitation-dialog').open) pause(); });
  document.addEventListener('visibilitychange', () => { clearInput(); stopLesson(); if (document.hidden) { save(); stopVoice(); if (mode === 'play') pause(); } });
  window.addEventListener('pagehide', () => { save(); clearInput(); stopVoice(); stopLesson(); });
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); save(); window.Recitation?.hold('context', true); stopVoice(); stopLesson(); clearInput(); $('#fallback').hidden = false; });
  renderer.domElement.addEventListener('webglcontextrestored', () => { $('#fallback').hidden = true; window.Recitation?.hold('context', false); pause(); });
  window.addEventListener('recitation-panel-open', () => { clearInput(); stopVoice(); stopWalk(); });
  function openNotes() { window.Recitation?.hold('notes', true); clearInput(); stopVoice(); stopLesson(); stopWalk(); $('#storage-note').textContent = storageOK ? '' : 'Storage is unavailable. Discoveries will last only for this visit.'; $('#notes').showModal(); }
  $('#notes-button').addEventListener('click', openNotes);
  $('#close-notes').addEventListener('click', () => $('#notes').close());
  $('#notes').addEventListener('close', () => window.Recitation?.hold('notes', false));
  $('#voice-button').addEventListener('click', () => { state.voice = !state.voice; stopVoice(); syncWorld(); });
  $('#reset-button').addEventListener('click', () => {
    if (!confirm('Reset this island’s discoveries? The illustrated game and learning guides will not change.')) return;
    cancelHatch(); course = null; state.dinosaurs = []; state.eggs = []; state.fossils = []; state.hatched = []; state.displayed = []; state.leaves = 0; state.companion = null; state.trailComplete = false; position.set(0, .4, 16); riding = null;
    hoops.forEach(h => { h.model.visible = h.sign.visible = false; }); leafGardens.forEach(g => { g.readyAt = 0; });
    babies.forEach((b, i) => { b.position.set(10 + i * 3, .4, 15); b.scale.setScalar(.28); });
    beachBall.position.set(8, 1.2, -1); ballVelocity.set(0, 0, 0);
    digs.forEach(d => { d.brushed = 0; d.mound.scale.y = .7; });
    digs.forEach(d => { d.cells = new Set(); });
    dinos.forEach(d => { d.model.position.set(d.x, .4, d.z); d.home.set(d.x, .4, d.z); d.roam = null; d.wait = 2; d.label.position.set(d.x, d.type === 'longneck' ? 6.5 : 4.9, d.z); });
    syncWorld(); $('#notes').close(); if (started) { resume(); say('A fresh island adventure! Let’s see what we can discover.'); }
  });
  $('#fullscreen-button').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await game.requestFullscreen(); } catch { $('#storage-note').textContent = 'Full screen is not available in this browser. You can keep playing in the window.'; } });
  overlay.addEventListener('click', e => {
    const b = e.target.closest('[data-action]'); if (!b) return;
    const a = b.dataset.action;
    if (a === 'start') start(); else if (a === 'resume') resume(); else if (a === 'audio') window.Recitation?.open();
    else if (a === 'map') showMap(); else if (a === 'journal') journal(); else if (a === 'notes') openNotes();
    else if (a === 'tab') journal(b.dataset.tab);
    else if (a === 'visit') goTo(nextIn(b.dataset.place));
    else if (a === 'find') {
      const i = Number(b.dataset.index), type = b.dataset.type;
      const item = type === 'dinosaurs' ? dinos[i] : type === 'eggs' ? eggs[i] : digs[i];
      if (type === 'eggs' && state.eggs.includes(item.id)) goTo(places[1]);
      else if (type === 'fossils' && state.fossils.includes(item.id)) goTo(places[0]);
      else goTo(type === 'dinosaurs' ? { ...item, x: item.model.position.x, z: item.model.position.z } : item);
    } else if (a === 'camp') showCamp(); else if (['prayer', 'quran'].includes(a)) learn(a);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !overlay.children.length || mode === 'title' || $('#notes').open || $('#recitation-dialog').open) return;
    const items = [...overlay.querySelectorAll('button:not(:disabled),a[href],iframe')].filter(el => el.offsetParent !== null), first = items[0], last = items[items.length - 1];
    if (!first) return;
    if (e.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  syncWorld(); title(); resize(); requestAnimationFrame(frame);
})();
