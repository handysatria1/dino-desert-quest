/* Pip’s adventures: farm rescue, number race, garden, treasure chests, wardrobe, daily missions and fireworks.
   Built on top of the 3D world through a small API that world.js passes in. No timers that end play, no lives, no penalties. */
(() => {
  'use strict';
  const KEY = 'little-explorer-adventures-v1';
  const FARM = { x: 0, z: 70 }, RACE = { x: 120, z: -17 }, GARDEN = { x: -120, z: -17 };
  const ANIMALS = [
    { id: 'chick', baby: 'chick', mum: 'hen', sound: 'cheep cheep', colour: '#f2d65c', mumColour: '#f3eee0', kind: 'bird' },
    { id: 'duckling', baby: 'duckling', mum: 'duck', sound: 'quack quack', colour: '#f5e27a', mumColour: '#f7f3e6', kind: 'bird' },
    { id: 'lamb', baby: 'lamb', mum: 'sheep', sound: 'baa', colour: '#f6f2e8', mumColour: '#ece5d2', kind: 'fluffy' },
    { id: 'kid', baby: 'kid', mum: 'goat', sound: 'meh-eh-eh', colour: '#c9a77c', mumColour: '#b18c62', kind: 'four' },
    { id: 'bunny', baby: 'bunny', mum: 'rabbit', sound: 'sniff sniff', colour: '#efe8dd', mumColour: '#d9cdbd', kind: 'bunny' },
    { id: 'kitten', baby: 'kitten', mum: 'cat', sound: 'meow', colour: '#e8a35e', mumColour: '#d68a45', kind: 'four' },
    { id: 'puppy', baby: 'puppy', mum: 'dog', sound: 'woof woof', colour: '#b58457', mumColour: '#9a6c42', kind: 'four' },
    { id: 'calf', baby: 'calf', mum: 'cow', sound: 'moo', colour: '#f4efe4', mumColour: '#f1ebdf', kind: 'cow' },
    { id: 'foal', baby: 'foal', mum: 'horse', sound: 'neigh', colour: '#a8774d', mumColour: '#8d6038', kind: 'four' },
    { id: 'cygnet', baby: 'cygnet', mum: 'swan', sound: 'honk', colour: '#cfcfc6', mumColour: '#fbfbf6', kind: 'bird' }
  ];
  const CROPS = [
    { id: 'carrot', one: 'carrot', many: 'carrots', colour: '#ee8a3c', leaf: '#6fa35a', fruitY: .25 },
    { id: 'tomato', one: 'tomato', many: 'tomatoes', colour: '#e05b47', leaf: '#5f9b4f', fruitY: 1.3 },
    { id: 'strawberry', one: 'strawberry', many: 'strawberries', colour: '#e2475f', leaf: '#5f9b4f', fruitY: .5 },
    { id: 'pumpkin', one: 'pumpkin', many: 'pumpkins', colour: '#ea9a3a', leaf: '#6fa35a', fruitY: .5, big: true },
    { id: 'corn', one: 'corn cob', many: 'corn cobs', colour: '#f1cf4f', leaf: '#7cae5d', fruitY: 1.6 },
    { id: 'blueberry', one: 'blueberry', many: 'blueberries', colour: '#5873c7', leaf: '#5f9b4f', fruitY: 1.1 }
  ];
  const CHESTS = [
    { shape: 'circle', item: 'party', label: 'party hat' },
    { shape: 'triangle', item: 'crown', label: 'golden crown' },
    { shape: 'square', item: 'red', label: 'red buggy paint' },
    { shape: 'star', item: 'wizard', label: 'wizard hat' },
    { shape: 'heart', item: 'flower', label: 'flower crown' },
    { shape: 'hexagon', item: 'blue', label: 'blue buggy paint' }
  ];
  const HATS = [
    { id: 'explorer', label: 'Explorer hat', icon: '🤠', how: 'Always yours' },
    { id: 'cap', label: 'Red cap', icon: '🧢', how: 'Collect 15 stars', stars: 15 },
    { id: 'party', label: 'Party hat', icon: '🥳', how: 'Circle treasure chest' },
    { id: 'crown', label: 'Golden crown', icon: '👑', how: 'Triangle treasure chest' },
    { id: 'wizard', label: 'Wizard hat', icon: '🧙', how: 'Star treasure chest' },
    { id: 'flower', label: 'Flower crown', icon: '🌼', how: 'Heart treasure chest' },
    { id: 'astronaut', label: 'Space helmet', icon: '🚀', how: 'Win 2 adventure trophies', trophies: 2 }
  ];
  const PAINTS = [
    { id: 'yellow', label: 'Sunny yellow', colour: '#e9b456', how: 'Always yours' },
    { id: 'red', label: 'Rocket red', colour: '#d9574a', how: 'Square treasure chest' },
    { id: 'blue', label: 'Ocean blue', colour: '#4f8fc4', how: 'Hexagon treasure chest' },
    { id: 'green', label: 'Jungle green', colour: '#5ea36a', how: 'Collect 30 stars', stars: 30 },
    { id: 'purple', label: 'Magic purple', colour: '#9a6cc4', how: 'Collect 50 stars', stars: 50 },
    { id: 'gold', label: 'Champion gold', colour: '#e8c13a', how: 'Win 3 adventure trophies', trophies: 3 }
  ];
  const MISSIONS = {
    rescue: { icon: '🐣', text: n => `Rescue ${n} lost baby animal${n > 1 ? 's' : ''}`, n: 2 },
    race: { icon: '🏁', text: () => 'Finish a number race', n: 1 },
    harvest: { icon: '🥕', text: n => `Pick ${n} things in the garden`, n: 6 },
    letter: { icon: '🎈', text: n => `Find ${n} letter balloons`, n: 3 },
    puzzle: { icon: '🧠', text: n => `Solve ${n} brain puzzles`, n: 5 },
    chest: { icon: '🧰', text: () => 'Open a treasure chest', n: 1 },
    wonder: { icon: '🌍', text: n => `Help at a wonder ${n} times`, n: 3 },
    fruit: { icon: '💧', text: n => `Water plants ${n} times`, n: 4 }
  };

  let saved = {};
  try { const raw = JSON.parse(localStorage.getItem(KEY) || '{}'); if (raw && typeof raw === 'object') saved = raw; } catch { saved = {}; }
  const list = (a, ok) => Array.isArray(a) ? [...new Set(a.filter(ok))] : [];
  const int = (n, max) => Number.isInteger(n) ? Math.max(0, Math.min(max, n)) : 0;
  const s = {
    rescued: list(saved.rescued, id => ANIMALS.some(a => a.id === id)),
    opened: list(saved.opened, sh => CHESTS.some(c => c.shape === sh)),
    hat: HATS.some(h => h.id === saved.hat) ? saved.hat : 'explorer',
    paint: PAINTS.some(p => p.id === saved.paint) ? saved.paint : 'yellow',
    raceWins: int(saved.raceWins, 9999), best: {}, harvested: int(saved.harvested, 99999), trophies: int(saved.trophies, 9999),
    rescueRounds: int(saved.rescueRounds, 999),
    day: typeof saved.day === 'string' ? saved.day : '', missions: Array.isArray(saved.missions) ? saved.missions : []
  };
  [1, 2, 3].forEach(l => { const b = saved.best?.[l]; if (Number.isFinite(b) && b > 0 && b < 3600) s.best[l] = Math.round(b); });
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* optional */ } }

  const stars = () => { try { return JSON.parse(localStorage.getItem('little-explorer-brain-games-v1') || '{}').stars | 0; } catch { return 0; } };
  const addStars = n => window.BrainGames?.addStars(n);
  const hatUnlocked = h => h.id === 'explorer' || (h.stars && stars() >= h.stars) || (h.trophies && s.trophies >= h.trophies) || CHESTS.some(c => c.item === h.id && s.opened.includes(c.shape));
  const paintUnlocked = p => p.id === 'yellow' || (p.stars && stars() >= p.stars) || (p.trophies && s.trophies >= p.trophies) || CHESTS.some(c => c.item === p.id && s.opened.includes(c.shape));

  // Three missions a day, chosen the same way all day, so a grown-up and child see the same list.
  function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function rollMissions() {
    const day = today(); if (s.day === day && s.missions.length === 3 && s.missions.every(m => MISSIONS[m.type])) return;
    let seed = [...day].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
    const types = Object.keys(MISSIONS).filter(t => !(t === 'chest' && s.opened.length >= CHESTS.length));
    const chosen = [];
    while (chosen.length < 3) { const t = types[Math.floor(rnd() * types.length)]; if (!chosen.includes(t)) chosen.push(t); }
    s.day = day; s.missions = chosen.map(type => ({ type, need: MISSIONS[type].n, have: 0 })); s.allDone = false; persist();
  }

  let api = null, T = null, ready = false;
  const lost = [], followers = [], mothers = new Map(), pens = new Map();
  const rings = [], patches = [], chests = [], fireworks = [];
  const race = { active: false, next: 0, level: 1, time: 0, warned: -1 };
  let water = 0, lastWarn = 0, rescueSpots = [];

  function flat(parent, colour, x, z, radius, y = .06) { return api.cylinder(parent, colour, x, y, z, radius, radius, .12, 24); }
  function labelSprite(draw, size = 2.2) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const ctx = c.getContext('2d');
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true })); sprite.scale.set(size, size, 1);
    const redraw = arg => { ctx.clearRect(0, 0, 128, 128); draw(ctx, arg); tex.needsUpdate = true; };
    return { sprite, redraw };
  }
  function bubble(ctx, text, fill = '#fffdf3', stroke = '#355c45', font = 74) {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(64, 64, 58, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = stroke; ctx.stroke();
    ctx.fillStyle = '#244f43'; ctx.font = `bold ${font}px Trebuchet MS, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 64, 70);
  }
  function shapePath(ctx, shape) {
    ctx.beginPath();
    if (shape === 'circle') ctx.arc(64, 64, 40, 0, Math.PI * 2);
    else if (shape === 'square') ctx.rect(26, 26, 76, 76);
    else if (shape === 'triangle') { ctx.moveTo(64, 20); ctx.lineTo(108, 102); ctx.lineTo(20, 102); }
    else if (shape === 'star') for (let i = 0; i < 10; i++) { const r = i % 2 ? 19 : 44, a = -Math.PI / 2 + i * Math.PI / 5; ctx[i ? 'lineTo' : 'moveTo'](64 + Math.cos(a) * r, 66 + Math.sin(a) * r); }
    else if (shape === 'heart') { ctx.moveTo(64, 104); ctx.bezierCurveTo(10, 70, 18, 22, 64, 44); ctx.bezierCurveTo(110, 22, 118, 70, 64, 104); }
    else for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](64 + Math.cos(a) * 42, 64 + Math.sin(a) * 42); }
    ctx.closePath();
  }
  function cone(parent, colour, x, y, z, r, h) { return api.mesh(parent, new T.ConeGeometry(r, h, 12), colour, x, y, z); }

  // A small animal built from soft shapes. Babies are scaled down; mums are full size.
  function animal(a, mum) {
    const g = api.group(0, 0, 0), c = mum ? a.mumColour : a.colour, body = api.group(0, 0, 0, g), dark = '#3c3a33';
    if (a.kind === 'bird') {
      api.ball(body, c, 0, .7, 0, .55, .5, .7); api.ball(body, c, 0, 1.25, .45, .35);
      cone(body, '#ee9b3c', 0, 1.22, .85, .12, .3).rotation.x = Math.PI / 2;
      for (const sd of [-1, 1]) { api.ball(body, dark, sd * .16, 1.33, .72, .05); api.ball(body, c, sd * .5, .75, 0, .15, .32, .45); api.segment(body, '#ee9b3c', [sd * .18, .35, 0], [sd * .18, 0, .05], .05); }
      if (a.id === 'cygnet' && mum) { api.segment(body, c, [0, .9, .4], [0, 1.6, .6], .16); api.ball(body, c, 0, 1.7, .75, .26); }
    } else {
      const wide = a.kind === 'fluffy' ? .72 : a.kind === 'cow' ? .7 : .55;
      api.ball(body, c, 0, 1, 0, wide, wide * .85, wide * 1.45);
      const head = api.group(0, 1.45, wide * 1.25, body); api.ball(head, c, 0, 0, 0, .42, .4, .44);
      for (const sd of [-1, 1]) {
        api.ball(head, dark, sd * .17, .08, .36, .055);
        if (a.kind === 'bunny') api.ball(head, c, sd * .14, .62, -.05, .1, .42, .08); else api.ball(head, a.id === 'calf' || a.id === 'kid' ? c : '#7d5a3c', sd * .36, .2, -.05, .14, .1, .2);
        for (const z of [-.6, .6]) api.segment(body, a.kind === 'cow' ? dark : c, [sd * .3, .7, z * wide * 1.1], [sd * .3, 0, z * wide * 1.1], .11);
      }
      api.ball(head, a.kind === 'cow' ? '#efb9b0' : dark, 0, -.05, .42, .12, .09, .06);
      if (a.kind === 'cow') { api.ball(body, dark, .3, 1.25, -.2, .3, .25, .35); api.ball(body, dark, -.35, .95, .4, .25, .22, .3); for (const sd of [-1, 1]) cone(head, '#efe6cf', sd * .22, .4, 0, .06, .25); }
      if (a.kind === 'fluffy') for (let i = 0; i < 6; i++) api.ball(body, c, Math.cos(i) * .45, 1.3, Math.sin(i * 1.7) * .5, .32);
      if (a.id === 'foal' || a.id === 'kid') api.segment(body, dark, [0, 1.6, .7 * wide], [0, 1.2, -.3], .06);
      api.ball(body, c, 0, 1.15, -wide * 1.4, .12);
    }
    g.scale.setScalar(mum ? 1.15 : a.kind === 'bird' ? 1 : .85);
    return { model: g, body };
  }

  // Hats sit on the explorer's head; only the chosen one is visible.
  const hatModels = {};
  function buildHats() {
    const body = api.player.children[0];
    hatModels.explorer = body.children.filter(m => m.material === api.mat('#f2d79c') || m.material === api.mat('#edc87e'));
    const mk = fn => { const g = api.group(0, 0, 0, body); fn(g); g.visible = false; return [g]; };
    hatModels.cap = mk(g => { api.ball(g, '#d9574a', 0, 2.38, 0, .52, .32, .52); api.box(g, '#c24a3e', 0, 2.32, .45, .7, .06, .4); });
    hatModels.party = mk(g => { cone(g, '#8fc7e8', 0, 2.85, 0, .38, .9); api.ball(g, '#f3c158', 0, 3.33, 0, .14); for (let i = 0; i < 3; i++) api.ball(g, ['#e8848e', '#f3e07a', '#9fd39b'][i], Math.sin(i * 2) * .22, 2.6 + i * .2, .3 - i * .05, .07); });
    hatModels.crown = mk(g => { api.cylinder(g, '#f0c43c', 0, 2.5, 0, .45, .45, .3, 10); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; cone(g, '#f0c43c', Math.cos(a) * .4, 2.78, Math.sin(a) * .4, .1, .3); api.ball(g, ['#e05b47', '#4f8fc4', '#5ea36a'][i % 3], Math.cos(a) * .46, 2.5, Math.sin(a) * .46, .06); } });
    hatModels.wizard = mk(g => { api.cylinder(g, '#4b4f9e', 0, 2.42, 0, .8, .8, .06, 16); cone(g, '#5a5fbc', 0, 3.05, 0, .42, 1.25); api.ball(g, '#f3e07a', .18, 2.9, .3, .09); api.ball(g, '#f3e07a', -.15, 3.2, .22, .06); });
    hatModels.flower = mk(g => { for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; api.ball(g, ['#f3e07a', '#f0a8bf', '#ffffff'][i % 3], Math.cos(a) * .47, 2.38, Math.sin(a) * .47, .13); api.ball(g, '#7cae5d', Math.cos(a + .35) * .47, 2.34, Math.sin(a + .35) * .47, .08); } });
    hatModels.astronaut = mk(g => { const glass = api.ball(g, '#cfe7f2', 0, 2.05, 0, .72); glass.material = new T.MeshStandardMaterial({ color: '#cfe7f2', transparent: true, opacity: .38, roughness: .1 }); api.cylinder(g, '#e8ecef', 0, 1.45, 0, .62, .62, .18, 14); });
  }
  let buggyParts = [];
  function applyLook() {
    Object.entries(hatModels).forEach(([id, parts]) => parts.forEach(p => { p.visible = id === s.hat; }));
    const p = PAINTS.find(p => p.id === s.paint) || PAINTS[0]; buggyParts.forEach(m => { m.material = api.mat(p.colour); });
  }

  function build() {
    const scene = api.scene;
    // Farm: a round pen with a sign; mums wait inside for their babies.
    const farm = api.group(FARM.x, 0, FARM.z); flat(farm, '#cfe2a4', 0, 0, 11);
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; if (Math.abs(a - Math.PI / 2) < .25) continue; api.box(farm, '#b98c5a', Math.cos(a) * 11, .7, Math.sin(a) * 11, .25, 1.4, .25); api.box(farm, '#d4a874', Math.cos(a + .11) * 11, 1.05, Math.sin(a + .11) * 11, .15, .15, 2.4).rotation.y = -a - .11; }
    const barn = api.group(0, 0, -16, farm); api.box(barn, '#c75a46', 0, 2.5, 0, 7, 5, 5); cone(barn, '#8b3d33', 0, 6.2, 0, 5.4, 2.6).rotation.y = Math.PI / 4; api.box(barn, '#f4ecd2', 0, 1.6, 2.55, 2.4, 3.2, .1);
    api.sign('FARM · BRING THE BABIES HOME', FARM.x, 12, FARM.z - 16, 13); api.merge(farm);
    ANIMALS.forEach((a, i) => {
      const px = -8 + (i % 5) * 4, pz = i < 5 ? -.5 : 4.5;
      const m = animal(a, true); m.model.position.set(FARM.x + px, 0, FARM.z + pz); scene.add(m.model); mothers.set(a.id, m);
      pens.set(a.id, { x: FARM.x + px + 1.5, z: FARM.z + pz + 1.2 });
    });
    // Lost babies are scattered across the park, away from the farm.
    rescueSpots = ANIMALS.map((a, i) => { const ang = i * 2.39996 + 1.3, r = 45 + (i * 53 % 105); return api.safePoint(Math.cos(ang) * r, Math.sin(ang) * r); });
    ANIMALS.forEach((a, i) => {
      const m = animal(a, false); scene.add(m.model);
      const q = labelSprite(ctx => bubble(ctx, '?', '#fff3c1', '#e0b44b', 80), 1.2); q.redraw(); q.sprite.position.set(0, 3.2, 0); m.model.add(q.sprite);
      lost.push({ a, ...m, mark: q.sprite, state: 'lost', x: rescueSpots[i].x, z: rescueSpots[i].z, phase: i });
    });

    // Number race: ten standing rings around a meadow loop.
    const track = api.group(RACE.x, 0, RACE.z); flat(track, '#d8e7b5', 0, 0, 34, .04);
    api.sign('NUMBER RACE · DRIVE THROUGH IN ORDER', RACE.x, 13, RACE.z, 15); api.merge(track);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2, x = RACE.x + Math.cos(a) * 22, z = RACE.z + Math.sin(a) * 28, spot = api.safePoint(x, z);
      const g = api.group(spot.x, 0, spot.z), colour = ['#e58d7a', '#7cb6c3', '#9fcf86', '#c8a3dc', '#f0a8bf'][i % 5];
      const ring = api.mesh(g, new T.TorusGeometry(3, .32, 8, 32), colour, 0, 3.4, 0);
      const tx = -Math.sin(a) * 22, tz = Math.cos(a) * 28; g.rotation.y = Math.atan2(tx, tz);
      for (const sd of [-1, 1]) api.segment(g, '#f4ecd2', [sd * 3, 0, 0], [sd * 3, 3.4, 0], .14);
      const label = labelSprite((ctx, n) => bubble(ctx, String(n), '#fffdf3', colour, String(n).length > 1 ? 62 : 78), 2.3); label.sprite.position.set(0, 7.5, 0); g.add(label.sprite);
      rings.push({ group: g, ring, label, x: spot.x, z: spot.z, colour });
    }
    labelRings();

    // Garden: six soil beds and a water pump.
    const garden = api.group(GARDEN.x, 0, GARDEN.z); flat(garden, '#d3c194', 0, 0, 16, .04);
    api.sign('GARDEN · PLANT, WATER, PICK', GARDEN.x, 11, GARDEN.z - 15, 12);
    const pump = api.group(GARDEN.x + 11, 0, GARDEN.z + 6); api.cylinder(pump, '#9aa3a8', 0, 1.2, 0, .35, .45, 2.4, 10); api.box(pump, '#7d878c', 0, 2.3, .5, .25, .25, 1.1); api.cylinder(pump, '#7cb6c3', 0, .3, .9, .7, .7, .5, 14);
    const drop = labelSprite(ctx => bubble(ctx, '💧', '#e3f3f7', '#7cb6c3', 62), 1.6); drop.redraw(); drop.sprite.position.set(0, 3.8, 0); pump.add(drop.sprite);
    patches.pump = { x: GARDEN.x + 11, z: GARDEN.z + 6 }; api.merge(garden);
    CROPS.forEach((crop, i) => {
      const x = GARDEN.x - 6 + (i % 3) * 6, z = GARDEN.z - 3 + Math.floor(i / 3) * 7;
      const g = api.group(x, 0, z); api.box(g, '#7a5a3c', 0, .18, 0, 3.4, .36, 3.4);
      const plant = api.group(0, .36, 0, g), stem = api.cylinder(plant, crop.leaf, 0, .6, 0, .09, .12, 1.2, 6);
      const leaves = [api.ball(plant, crop.leaf, .3, .5, 0, .35, .12, .22), api.ball(plant, crop.leaf, -.3, .8, 0, .35, .12, .22), api.ball(plant, crop.leaf, 0, 1.15, .25, .3, .12, .22)];
      const fruits = Array.from({ length: 6 }, (_, k) => api.ball(plant, crop.colour, Math.cos(k * 1.05) * .75, crop.fruitY + (k % 2) * .25, Math.sin(k * 1.05) * .75, crop.big ? .42 : .2));
      const seed = api.ball(g, '#5b4129', 0, .42, 0, .18, .1, .18);
      const tag = labelSprite((ctx, t) => bubble(ctx, t, '#fffdf3', '#c7a15f', 62), 1.4); tag.sprite.position.set(0, 3.2, 0); g.add(tag.sprite);
      patches.push({ crop, x, z, plant, stem, leaves, fruits, seed, tag, stage: 0, grow: 0, count: 0, inside: false });
    });
    patches.forEach(setPatch);

    // Treasure chests near the edge of the park, each marked with a shape.
    CHESTS.forEach((c, i) => {
      const ang = i / CHESTS.length * Math.PI * 2 + .45, spot = api.safePoint(Math.cos(ang) * 145, Math.sin(ang) * 145);
      const g = api.group(spot.x, 0, spot.z); g.rotation.y = -ang + Math.PI / 2;
      api.box(g, '#9a6a3d', 0, .7, 0, 2.4, 1.3, 1.6); api.box(g, '#e8c13a', 0, .7, .82, .4, 1.32, .06);
      const lid = api.group(0, 1.35, -.8, g); api.box(lid, '#ad7a49', 0, .2, .8, 2.45, .4, 1.65); api.box(lid, '#e8c13a', 0, .2, 1.64, .4, .42, .06);
      const glow = api.ball(g, '#fff0ae', 0, 1.6, 0, .6); glow.visible = false;
      const mark = labelSprite(ctx => { ctx.fillStyle = '#fffdf3'; ctx.beginPath(); ctx.arc(64, 64, 60, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#c7a15f'; ctx.stroke(); shapePath(ctx, c.shape); ctx.fillStyle = '#e58d7a'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#355c45'; ctx.stroke(); }, 2.4);
      mark.redraw(); mark.sprite.position.set(0, 4.2, 0); g.add(mark.sprite);
      chests.push({ ...c, group: g, lid, glow, mark: mark.sprite, x: spot.x, z: spot.z });
    });
    syncChests();

    // Fireworks: a reusable pool of glowing sparks.
    for (let i = 0; i < 90; i++) { const m = api.ball(scene, ['#f3c158', '#e8848e', '#8fc7e8', '#9fd39b', '#c8a3dc', '#ffffff'][i % 6], 0, 0, 0, .35); m.castShadow = false; m.material = new T.MeshBasicMaterial({ color: m.material.color }); m.visible = false; fireworks.push({ m, life: 0, v: new T.Vector3() }); }

    const buggyMat = api.mat('#e9b456'); buggyParts = api.buggy.children.filter(m => m.material === buggyMat);
    buildHats(); applyLook(); syncLost();
  }

  function labelRings() { const seq = raceSequence(race.level); rings.forEach((r, i) => { r.label.redraw(seq[i]); }); highlightRings(); }
  function raceSequence(level) { return Array.from({ length: 10 }, (_, i) => level === 1 ? i + 1 : level === 2 ? (i + 1) * 2 : 10 - i); }
  function raceLevel() { return s.raceWins % 3 + 1; }
  function highlightRings() { rings.forEach((r, i) => { const on = race.active ? i === race.next : i === 0; r.ring.scale.setScalar(on ? 1.15 : 1); r.ring.material = api.mat(on ? '#f7d33c' : r.colour); }); }
  function syncLost() {
    lost.forEach(l => {
      const home = s.rescued.includes(l.a.id);
      if (home) { const p = pens.get(l.a.id); l.state = 'home'; l.model.position.set(p.x, 0, p.z); l.mark.visible = false; }
      else if (l.state !== 'following') { l.state = 'lost'; l.model.position.set(l.x, 0, l.z); l.mark.visible = true; }
    });
  }
  function syncChests() { chests.forEach(c => { const open = s.opened.includes(c.shape); c.lid.rotation.x = open ? -1.9 : 0; c.mark.visible = !open; }); }
  function setPatch(p) {
    const st = p.stage;
    p.seed.visible = st === 1; p.plant.visible = st >= 2;
    const size = st >= 4 ? 1.25 : st >= 2 ? .55 : .3; p.plant.scale.setScalar(size);
    p.fruits.forEach((f, i) => { f.visible = st === 5 && i < p.count; });
    const tag = st === 0 ? '🌱' : st === 1 || st === 3 ? '💧' : st === 5 ? '🧺' : '☀️';
    p.tag.redraw(tag);
  }

  // Events from the rest of the game count towards today's missions.
  function event(type, amount = 1) {
    if (!ready) return; rollMissions();
    let changed = false;
    s.missions.forEach(m => {
      if (m.type !== type || m.have >= m.need) return;
      m.have = Math.min(m.need, m.have + amount); changed = true;
      if (m.have >= m.need) { addStars(2); api.toast(`✅ Mission done: ${MISSIONS[m.type].text(m.need)} · +2 ⭐`); }
    });
    if (changed && !s.allDone && s.missions.every(m => m.have >= m.need)) {
      s.allDone = true; s.trophies++; addStars(5); persist(); celebrate(8);
      setTimeout(() => api.say(`You finished all three of today’s missions! Here is a trophy and a fireworks show! You have ${s.trophies} trophies.`), 2600);
    } else if (changed) persist();
  }
  window.addEventListener('little-explorer:event', e => event(e.detail?.type, e.detail?.amount || 1));

  function launch(x, z, i) {
    const cx = x + Math.cos(i * 2.1) * 14, cz = z + Math.sin(i * 2.1) * 14, cy = 22 + i % 3 * 5, colour = i % 6;
    const sparks = fireworks.filter(f => f.life <= 0).slice(0, 15);
    sparks.forEach((f, k) => { const a = k / sparks.length * Math.PI * 2, b = (k % 3 - 1) * .7; f.m.position.set(cx, cy, cz); f.v.set(Math.cos(a) * 9, Math.sin(b) * 6 + 2, Math.sin(a) * 9); f.life = 1.8; f.m.visible = true; f.m.material.color.set(['#f3c158', '#e8848e', '#8fc7e8', '#9fd39b', '#c8a3dc', '#ffffff'][(colour + k) % 6]); });
  }
  let show = [];
  function celebrate(bursts = 5) { if (api.reduced) return; const p = api.position; for (let i = 0; i < bursts; i++) show.push({ at: i * .45, x: p.x, z: p.z, i }); }

  // Pip’s guidance: the world asks for this when there is no wonder activity nearby.
  function goal() {
    if (!ready) return null;
    if (followers.length) return { icon: '🐣', text: `Take ${followers.length} ${followers.length > 1 ? 'babies' : 'baby'} to the farm`, x: FARM.x, z: FARM.z };
    if (race.active) { const r = rings[race.next]; return { icon: '🏁', text: `Number race: find ${raceSequence(race.level)[race.next]}`, x: r.x, z: r.z }; }
    if (water > 0) { const p = patches.find(p => p.stage === 1 || p.stage === 3); if (p) return { icon: '💧', text: `Water the ${p.crop.one} (${water} left)`, x: p.x, z: p.z }; }
    return null;
  }

  function near(x, z, r) { return Math.hypot(api.position.x - x, api.position.z - z) < r; }
  function update(dt) {
    if (!ready) return;
    const t = api.time(), riding = api.riding(), P = api.position;
    // Lost babies bob and call out; walking close makes them follow in a line.
    lost.forEach((l, i) => {
      if (l.state === 'lost') {
        l.model.position.y = api.reduced ? 0 : Math.abs(Math.sin(t * 3 + l.phase)) * .25; l.model.rotation.y = t * .6 + l.phase;
        if (near(l.x, l.z, riding ? 4 : 3)) {
          l.state = 'following'; l.mark.visible = false; followers.push(l); api.burst(l.x, 1, l.z);
          const left = lost.filter(o => o.state === 'lost').length;
          api.say(`A lost ${l.a.baby}! It says ${l.a.sound}. A baby ${l.a.mum} is called a ${l.a.baby}. ${followers.length > 1 ? `Now ${followers.length} babies are following you!` : 'It will follow you.'} Take it home to the farm.${left ? '' : ''}`);
          api.updateHUD(); event('found');
        }
      } else if (l.state === 'following') {
        const k = followers.indexOf(l), lead = k === 0 ? P : followers[k - 1].model.position;
        const dx = lead.x - l.model.position.x, dz = lead.z - l.model.position.z, d = Math.hypot(dx, dz), gap = k === 0 ? 2.6 : 1.8;
        if (d > 40) { l.model.position.set(lead.x - 1, 0, lead.z - 1); }
        else if (d > gap) { const step = Math.min(d - gap, dt * (riding ? 22 : 12)); l.model.position.x += dx / d * step; l.model.position.z += dz / d * step; l.model.rotation.y = Math.atan2(dx, dz); }
        l.model.position.y = api.reduced || d <= gap ? 0 : Math.abs(Math.sin(t * 11 + k)) * .2;
      } else if (l.state === 'home') { l.model.position.y = api.reduced ? 0 : Math.max(0, Math.sin(t * 2 + l.phase)) * .12; }
    });
    if (followers.length && near(FARM.x, FARM.z, 12)) {
      const n = followers.length, names = followers.map(l => l.a);
      followers.splice(0).forEach(l => { l.state = 'home'; s.rescued.push(l.a.id); const p = pens.get(l.a.id); l.model.position.set(p.x, 0, p.z); api.burst(p.x, 1, p.z); });
      addStars(n); persist(); event('rescue', n);
      const counting = Array.from({ length: n }, (_, i) => i + 1).join(', ');
      const pairs = names.slice(0, 3).map(a => `the ${a.baby} is with its mummy ${a.mum}`).join(', and ');
      const all = s.rescued.length === ANIMALS.length;
      api.toast(`🐣 ${s.rescued.length} of ${ANIMALS.length} babies home · +${n} ⭐`);
      api.say(`Let’s count them in: ${counting}! ${n} ${n > 1 ? 'babies are' : 'baby is'} home. Look, ${pairs}. ${all ? 'Every baby is home! Hooray! You can play the rescue again from the adventure board.' : `${ANIMALS.length - s.rescued.length} babies are still lost.`}`);
      if (all) { s.rescueRounds++; persist(); celebrate(6); }
      api.updateHUD();
    }

    // Number race.
    rings.forEach((r, i) => { r.ring.rotation.z = api.reduced ? 0 : Math.sin(t * 1.5 + i) * .05; });
    if (race.active && !near(RACE.x, RACE.z, 55)) { race.active = false; race.warned = -1; highlightRings(); api.updateHUD(); }
    if (race.active) race.time += dt;
    rings.forEach((r, i) => {
      if (!near(r.x, r.z, 3.4)) { if (race.warned === i) race.warned = -1; return; }
      const seq = raceSequence(race.level);
      if (!race.active && i === 0) {
        race.active = true; race.next = 1; race.time = 0; race.warned = -1; highlightRings(); api.burst(r.x, 3, r.z);
        api.say(race.level === 1 ? 'Ready, steady, go! You went through number 1. Now find number 2!' : race.level === 2 ? 'Counting in twos! You went through 2. Now find 4!' : 'Counting back from 10, like a rocket! Now find 9!');
        api.updateHUD(); return;
      }
      if (!race.active) return;
      if (i === race.next) {
        api.burst(r.x, 3, r.z); race.next++;
        if (race.next >= rings.length) {
          const secs = Math.round(race.time), lv = race.level, best = s.best[lv], record = !best || secs < best;
          if (record) s.best[lv] = secs; race.active = false; s.raceWins++; race.level = raceLevel(); addStars(3); persist(); labelRings(); event('race'); celebrate(4);
          api.toast(`🏁 Race finished in ${secs} seconds · +3 ⭐`);
          api.say(`${lv === 3 ? 'Blast off!' : 'You did it!'} ${seq.join(', ')}! You finished in ${secs} seconds.${record ? ' That is your best time!' : ` Your best is ${best} seconds.`} The next race is ${race.level === 1 ? 'counting to 10' : race.level === 2 ? 'counting in twos' : 'counting back from 10'}. Drive through number ${raceSequence(race.level)[0]} to start.`);
        } else { highlightRings(); api.say(String(seq[i]) + '! ' + (race.next % 3 === 0 ? `Now find ${seq[race.next]}.` : '')); }
        api.updateHUD();
      } else if (race.warned !== i && i !== race.next - 1) { race.warned = i; api.say(`That is ${seq[i]}. We need ${seq[race.next]}. Look for the yellow ring!`); }
    });

    // Garden: the pump fills the can; beds react when you step on them.
    if (near(patches.pump.x, patches.pump.z, 3) && water < 3) { water = 3; api.say('Your watering can is full! Three splashes of water. Plants need water and sunshine to grow.'); api.updateHUD(); }
    patches.forEach(p => {
      if (p.stage === 2 || p.stage === 4) { p.grow += dt; const k = Math.min(1, p.grow / 6); p.plant.scale.setScalar(p.stage === 2 ? .3 + k * .25 : .55 + k * .7); if (p.grow >= 6) { p.stage++; p.grow = 0; if (p.stage === 5) p.count = 2 + Math.floor(Math.random() * 5); setPatch(p); } }
      const inside = near(p.x, p.z, 2.3); if (!inside) { p.inside = false; return; } if (p.inside) return; p.inside = true;
      if (p.stage === 0) { p.stage = 1; setPatch(p); api.say(`You planted a ${p.crop.one} seed! Now it needs water. ${water ? 'Splash it!' : 'Fill your can at the blue pump.'}`); if (water) waterPatch(p); }
      else if (p.stage === 1 || p.stage === 3) { if (water) waterPatch(p); else if (t - lastWarn > 4) { lastWarn = t; api.say(`The ${p.crop.one} is thirsty! Fill your watering can at the blue pump.`); } }
      else if (p.stage === 2 || p.stage === 4) { if (t - lastWarn > 4) { lastWarn = t; api.say(`The ${p.crop.one} is growing in the sunshine. Watch it get bigger!`); } }
      else if (p.stage === 5) {
        const n = p.count; p.stage = 0; p.count = 0; setPatch(p); s.harvested += n; addStars(1); persist(); event('harvest', n); api.burst(p.x, 1, p.z);
        api.say(`You picked ${n} ${n > 1 ? p.crop.many : p.crop.one}! ${Array.from({ length: n }, (_, i) => i + 1).join(', ')}. You have picked ${s.harvested} things altogether.`);
      }
    });

    // Treasure chests.
    chests.forEach(c => {
      if (s.opened.includes(c.shape) || !near(c.x, c.z, riding ? 4 : 3)) return;
      s.opened.push(c.shape); syncChests(); persist(); addStars(2); event('chest'); api.burst(c.x, 2, c.z); celebrate(2);
      api.toast(`🧰 You found the ${c.label}!`);
      api.say(`You opened the ${c.shape} treasure chest! Inside is a ${c.label}! Open the wardrobe on the adventure board to try it.${s.opened.length === CHESTS.length ? ' You found all six chests!' : ` ${CHESTS.length - s.opened.length} chests are still hidden.`}`);
    });

    // Fireworks.
    show.forEach(f => { f.at -= dt; if (f.at <= 0) launch(f.x, f.z, f.i); }); show = show.filter(f => f.at > 0);
    fireworks.forEach(f => { if (f.life <= 0) return; f.life -= dt; f.v.y -= 6 * dt; f.v.multiplyScalar(Math.exp(-dt * 1.2)); f.m.position.addScaledVector(f.v, dt); f.m.visible = f.life > 0; f.m.scale.setScalar(Math.max(.2, f.life / 1.8)); });
  }
  function waterPatch(p) {
    water--; event('fruit'); p.stage++; p.grow = 0; setPatch(p); api.burst(p.x, .8, p.z);
    api.say(`${p.stage === 2 ? `Splash! The ${p.crop.one} seed is drinking. Watch it sprout!` : `Splash! The ${p.crop.one} plant is growing big.`} ${water ? `${water} splash${water > 1 ? 'es' : ''} left.` : 'Your can is empty.'}`);
    api.updateHUD();
  }

  // ---------- Menus ----------
  const overlay = () => api.overlay;
  function card(kicker, title, body, footer = '') {
    overlay().innerHTML = `<section class="card adv-card" role="dialog" aria-modal="true" aria-labelledby="adv-title"><button class="close" data-adv="close" aria-label="Back to playing">×</button><small>${kicker}</small><h2 id="adv-title">${title}</h2>${body}${footer}</section>`;
    api.focusCard();
  }
  function board() {
    rollMissions(); api.setMode('adventures');
    const missions = s.missions.map(m => { const def = MISSIONS[m.type], pct = Math.round(m.have / m.need * 100); return `<div class="adv-mission ${m.have >= m.need ? 'done' : ''}"><span aria-hidden="true">${m.have >= m.need ? '✅' : def.icon}</span><div><strong>${def.text(m.need)}</strong><i><b style="width:${pct}%"></b></i></div><small>${m.have}/${m.need}</small></div>`; }).join('');
    const tiles = [
      ['farm', '🐣', 'Animal rescue', `${s.rescued.length} of ${ANIMALS.length} babies home`],
      ['race', '🏁', 'Number race', `${race.level === 1 ? 'Count to 10' : race.level === 2 ? 'Count in twos' : 'Count back from 10'}${s.best[race.level] ? ` · best ${s.best[race.level]}s` : ''}`],
      ['garden', '🥕', 'Garden', `${s.harvested} picked`],
      ['chest', '🧰', 'Treasure chests', `${s.opened.length} of ${CHESTS.length} found`],
      ['lost', '🔎', 'Find a lost baby', `${lost.filter(l => l.state === 'lost').length} still lost`],
      ['wardrobe', '👑', 'Wardrobe', 'Hats and buggy paint'],
      ...(s.trophies ? [['fireworks', '🎆', 'Fireworks show', `${s.trophies} trophies`]] : [])
    ];
    card('PIP’S ADVENTURE BOARD', 'What shall we do?', `<h3 class="brain-group">Today’s missions · 🏆 ${s.trophies}</h3><div class="adv-missions">${missions}</div><p class="brain-next">${s.allDone ? 'All done today! Come back tomorrow for new missions.' : 'Finish all three for a trophy and fireworks!'}</p><h3 class="brain-group">Adventures</h3><div class="brain-menu">${tiles.map(([id, icon, title, sub]) => `<button class="brain-game" data-adv="${id}"><span aria-hidden="true">${icon}</span><strong>${title}</strong><small>${sub}</small></button>`).join('')}</div>`, '<div class="buttons"><button class="primary" data-adv="close">▶ Back to exploring</button></div>');
    api.speak(`Pip’s adventure board! Today’s missions: ${s.missions.map(m => MISSIONS[m.type].text(m.need)).join('. ')}. Or pick an adventure.`);
  }
  function wardrobe() {
    api.setMode('adventures');
    const hat = h => { const ok = hatUnlocked(h); return `<button class="adv-item ${s.hat === h.id ? 'on' : ''}" data-adv="hat" data-id="${h.id}" ${ok ? '' : 'disabled'}><span aria-hidden="true">${ok ? h.icon : '🔒'}</span><strong>${h.label}</strong><small>${ok ? (s.hat === h.id ? 'Wearing' : 'Tap to wear') : h.how}</small></button>`; };
    const paint = p => { const ok = paintUnlocked(p); return `<button class="adv-item ${s.paint === p.id ? 'on' : ''}" data-adv="paint" data-id="${p.id}" ${ok ? '' : 'disabled'}><span class="adv-swatch" style="background:${ok ? p.colour : '#ddd5bd'}" aria-hidden="true">${ok ? '' : '🔒'}</span><strong>${p.label}</strong><small>${ok ? (s.paint === p.id ? 'On your buggy' : 'Tap to paint') : p.how}</small></button>`; };
    card('DRESS UP', 'Wardrobe', `<p>You have ${stars()} ⭐ and ${s.trophies} 🏆. Treasure chests, stars and trophies unlock more.</p><h3 class="brain-group">Hats</h3><div class="adv-items">${HATS.map(hat).join('')}</div><h3 class="brain-group">Buggy paint</h3><div class="adv-items">${PAINTS.map(paint).join('')}</div>`, '<div class="buttons"><button data-adv="board">← Adventure board</button><button class="primary" data-adv="close">▶ Play</button></div>');
    api.speak('The wardrobe! Pick a hat and a colour for your buggy.');
  }
  function guide(where) {
    const P = api.position;
    if (where === 'farm') api.go({ x: FARM.x, z: FARM.z + 13, text: 'Let’s go to the farm. Find lost babies and bring them home' });
    else if (where === 'race') { const r = rings[0]; api.go({ x: r.x, z: r.z, text: `Let’s go to the number race. Drive through number ${raceSequence(race.level)[0]} to start` }); }
    else if (where === 'garden') api.go({ x: GARDEN.x, z: GARDEN.z + 10, text: 'Let’s go to the garden. Step on a brown bed to plant a seed' });
    else if (where === 'chest') {
      const c = chests.filter(c => !s.opened.includes(c.shape)).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
      if (!c) { api.setMode('play'); api.say('You found all six treasure chests! Well done, treasure hunter!'); return; }
      api.go({ x: c.x, z: c.z, text: `Let’s find the treasure chest with a ${c.shape} on it` });
    } else if (where === 'lost') {
      const l = lost.filter(l => l.state === 'lost').sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
      if (l) api.go({ x: l.x, z: l.z, text: `I can hear a little ${l.a.sound}! Let’s find the lost ${l.a.baby}` });
      else if (s.rescued.length === ANIMALS.length) {
        s.rescued = []; persist(); syncLost(); lost.forEach(l => { l.state = 'lost'; l.mark.visible = true; l.model.position.set(l.x, 0, l.z); });
        api.setMode('play'); api.say('The babies have wandered off to play again! Let’s find them all. Tap Find a lost baby on the adventure board for help.'); api.updateHUD();
      } else { api.setMode('play'); api.say('All the lost babies are following you! Take them to the farm.'); }
    }
  }
  document.getElementById('overlay')?.addEventListener('click', e => {
    const b = e.target.closest('[data-adv]'); if (!b || !api) return; const a = b.dataset.adv;
    if (a === 'close') { api.setMode('play'); api.updateHUD(); }
    else if (a === 'board') board();
    else if (a === 'wardrobe') wardrobe();
    else if (a === 'hat') { s.hat = b.dataset.id; persist(); applyLook(); wardrobe(); api.speak(`${HATS.find(h => h.id === s.hat).label}! Looking great.`); }
    else if (a === 'paint') { s.paint = b.dataset.id; persist(); applyLook(); wardrobe(); api.speak(`${PAINTS.find(p => p.id === s.paint).label} buggy! Vroom!`); }
    else if (a === 'fireworks') { api.setMode('play'); celebrate(10); api.say('A fireworks show for a champion explorer! Look up in the sky!'); }
    else guide(a);
  });

  window.Adventures = Object.freeze({
    init(world) { api = world; T = world.T; build(); race.level = raceLevel(); labelRings(); rollMissions(); ready = true; },
    update, goal, board, event,
    reset() { s.rescued = []; s.opened = []; s.harvested = 0; s.raceWins = 0; s.best = {}; s.hat = 'explorer'; s.paint = 'yellow'; followers.length = 0; lost.forEach(l => { l.state = 'lost'; }); persist(); syncLost(); syncChests(); applyLook(); race.active = false; race.level = 1; labelRings(); }
  });
})();
