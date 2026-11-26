/* Rides: a horse with a jumping course, a sailing boat with a lighthouse and dolphins,
   seashells on the beach, and a Grand Prix against three friendly animal drivers. */
(() => {
  'use strict';
  const KEY = 'little-explorer-rides-v1';
  const STABLE = { x: -24, z: 64 }, HURDLES = [36, 46, 56, 66, 76].map(z => ({ x: -40, z })), MOOR = { x: 4, z: 250 }, DOCK_END = { x: 0, z: 250 };
  const START_A = Math.PI * 1.1, LIGHT = { x: 72, z: 302 }, POD = { x: 34, z: 276 }, TRACK = { x: 138, z: -17, rx: 22, rz: 22 }, LAPS = 3;
  const RIVALS = [{ name: 'Fox', colour: '#e0703f', face: '#e88b4f', base: 14.6, fair: .97, pass: 1.04 }, { name: 'Panda', colour: '#4f8fc4', face: '#f4f1ea', base: 13.9, fair: .93, pass: 1 }, { name: 'Bunny', colour: '#9a6cc4', face: '#f1e6dc', base: 13.2, fair: .9, pass: .98 }];
  const SHELL_COLOURS = ['#f5d2c4', '#f3e6cf', '#e9b7a8', '#f7efe2', '#e6c49a', '#f0c9d6', '#e8dcc0', '#f2b9a0'];

  let saved = {};
  try { const raw = JSON.parse(localStorage.getItem(KEY) || '{}'); if (raw && typeof raw === 'object') saved = raw; } catch { saved = {}; }
  const int = (n, max) => Number.isInteger(n) ? Math.max(0, Math.min(max, n)) : 0;
  const s = { gold: int(saved.gold, 9999), silver: int(saved.silver, 9999), bronze: int(saved.bronze, 9999), shells: Array.isArray(saved.shells) ? saved.shells.filter(i => Number.isInteger(i) && i >= 0 && i < 8) : [], shellTotal: int(saved.shellTotal, 99999), voyages: int(saved.voyages, 9999), rounds: int(saved.rounds, 9999) };
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* optional */ } }
  const emit = (type, amount = 1) => window.dispatchEvent(new CustomEvent('little-explorer:event', { detail: { type, amount } }));
  const stars = n => window.BrainGames?.addStars(n);
  const ordinal = n => ['1st', '2nd', '3rd', '4th'][n - 1];

  let api = null, T = null, ready = false, lastNag = -10;
  const horse = { model: null, legs: [], x: STABLE.x, z: STABLE.z + 4, heading: Math.PI, cleared: 0, prevZ: 0, prevX: 0 };
  const boat = { model: null, x: MOOR.x, z: MOOR.z, heading: 0, visited: false, sail: null };
  const dolphins = [], shells = [], karts = [];
  let light = null, beam = null, dolphinsSeen = false;
  const gp = { state: 'idle', count: 0, progress: 0, prevA: 0, lap: 1, place: 4, finishedRivals: 0 };

  // Sea wave height, matching the sea shader.
  function wave(x, z, t) { const px = x, py = -z; return .28 * Math.sin(px * .07 + t * 1.1) + .22 * Math.sin(py * .09 + t * .9) + .12 * Math.sin((px + py) * .16 + t * 1.7); }
  const seaT = () => api.reduced ? 0 : api.time();
  function ellipse(a, lane = 0) {
    const x = TRACK.x + Math.cos(a) * TRACK.rx, z = TRACK.z + Math.sin(a) * TRACK.rz;
    const tx = -Math.sin(a) * TRACK.rx, tz = Math.cos(a) * TRACK.rz, l = Math.hypot(tx, tz);
    return { x: x + (tz / l) * lane, z: z - (tx / l) * lane, heading: Math.atan2(tx, tz) };
  }
  const trackAngle = (x, z) => Math.atan2((z - TRACK.z) / TRACK.rz, (x - TRACK.x) / TRACK.rx);
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const near = (x, z, r) => Math.hypot(api.position.x - x, api.position.z - z) < r;

  function buildHorse() {
    const g = api.group(horse.x, 0, horse.z), c = '#9a6236', dark = '#3d2a1c', body = api.group(0, 0, 0, g);
    api.ball(body, c, 0, 2.05, 0, .72, .78, 1.55); api.ball(body, c, 0, 2.15, .95, .66, .74, .6); api.ball(body, c, 0, 2.1, -1, .7, .74, .62);
    api.segment(body, c, [0, 2.45, 1.2], [0, 3.35, 1.85], .36);
    const head = api.group(0, 3.45, 2.1, body); head.rotation.x = .55; api.ball(head, c, 0, 0, .15, .3, .33, .62); api.ball(head, '#b98157', 0, -.1, .72, .24, .22, .2);
    for (const sd of [-1, 1]) { api.ball(head, '#1f1a15', sd * .25, .12, .3, .06); api.mesh(head, new T.ConeGeometry(.09, .35, 6), c, sd * .14, .38, -.12); api.ball(head, '#2b211a', sd * .1, -.17, .9, .04); }
    for (let i = 0; i < 6; i++) api.ball(body, dark, 0, 2.75 + i * .14, 1.25 + i * .12, .12, .16, .16);
    const tail = api.group(0, 2.3, -1.6, body); tail.rotation.x = -.6; api.ball(tail, dark, 0, -.6, 0, .17, .75, .17);
    api.box(body, '#c2483b', 0, 2.82, .1, 1.25, .14, 1.2); api.box(body, '#e8c13a', 0, 2.9, .1, 1.3, .05, .2);
    for (const [x, z] of [[-.42, .95], [.42, .95], [-.42, -1], [.42, -1]]) {
      const leg = api.group(x, 1.75, z, body); api.segment(leg, c, [0, 0, 0], [0, -.9, 0], .17); api.segment(leg, c, [0, -.9, 0], [0, -1.6, .05], .12); api.ball(leg, '#2b211a', 0, -1.65, .08, .15, .1, .18);
      horse.legs.push(leg);
    }
    g.scale.setScalar(.95); horse.model = g; horse.body = body; horse.tail = tail;
    // Stable and fences.
    const st = api.group(STABLE.x, 0, STABLE.z - 8); api.box(st, '#b98c5a', 0, 2, 0, 9, 4, 4.5); api.box(st, '#8b3d33', 0, 4.3, 0, 10, .5, 5.5); api.box(st, '#6b4a2d', 0, 1.6, 2.3, 3, 3.2, .1);
    api.sign('HORSE STABLE · JUMP THE FENCES', STABLE.x, 8.5, STABLE.z - 10, 13);
    HURDLES.forEach((h, i) => {
      const f = api.group(h.x, 0, h.z, st.parent); for (const sd of [-1, 1]) api.box(f, '#f4ecd2', sd * 2.8, .8, 0, .25, 1.6, .25);
      api.box(f, i % 2 ? '#d9574a' : '#4f8fc4', 0, 1.1, 0, 5.4, .16, .16); api.box(f, '#f4ecd2', 0, .65, 0, 5.4, .14, .14);
      for (let k = 0; k < 3; k++) api.box(f, i % 2 ? '#f4ecd2' : '#e8c13a', -1.8 + k * 1.8, 1.1, 0, .6, .18, .18);
    });
    api.merge(st);
    HURDLES.forEach((h, i) => { const m = api.ball(api.scene, '#fff3ae', h.x - 3.6, 2.6, h.z, .35); m.material = new T.MeshBasicMaterial({ color: '#f3c158' }); h.flag = m; h.n = i + 1; });
  }

  function buildBoat() {
    const g = api.group(boat.x, -2.5, boat.z);
    api.box(g, '#f6f3ea', 0, .45, 0, 2.6, .9, 5); api.box(g, '#4f8fc4', 0, .15, 0, 2.65, .3, 5.05);
    const bow = api.mesh(g, new T.ConeGeometry(1.3, 2, 4), '#f6f3ea', 0, .45, 3.4); bow.rotation.x = Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.scale.set(1, 1, .45);
    api.box(g, '#b88b5a', 0, .92, 0, 2.2, .08, 4.4);
    api.segment(g, '#8b6a45', [0, .9, .6], [0, 7.2, .6], .1); api.segment(g, '#8b6a45', [0, 2, .6], [0, 2, -2], .07);
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute([0, 2.1, .5, 0, 7, .5, 0, 2.1, -1.9], 3)); sg.computeVertexNormals();
    boat.sail = new T.Mesh(sg, new T.MeshStandardMaterial({ color: '#fffaf0', side: T.DoubleSide, roughness: .8 })); const sailPivot = api.group(0, 0, .6, g); sg.translate(0, 0, -.6); sailPivot.add(boat.sail); sailPivot.rotation.y = .75;
    api.box(g, '#e58d7a', 0, 7.3, .3, .05, .4, .7);
    boat.model = g;
    // Lighthouse island.
    const isl = api.group(LIGHT.x, 0, LIGHT.z); api.ball(isl, '#ecd9a6', 0, -3.6, 0, 15, 3.6, 15); api.ball(isl, '#7aa862', 0, -1.6, -2, 9, 2, 8);
    for (let i = 0; i < 7; i++) api.ball(isl, '#a7a294', Math.cos(i) * 11, -2.3, Math.sin(i * 1.3) * 11, 1.4 + i % 3 * .5, 1, 1.4);
    for (let i = 0; i < 6; i++) api.cylinder(isl, i % 2 ? '#d9574a' : '#f6f3ea', 0, -.2 + i * 2, -2, 1.6 - i * .12, 1.7 - i * .12, 2, 16);
    api.cylinder(isl, '#355c45', 0, 11.9, -2, 1.3, 1.3, .3, 16); api.cylinder(isl, '#d9574a', 0, 13.6, -2, .4, 1.2, 1, 16);
    api.merge(isl);
    light = api.ball(api.scene, '#fff3ae', LIGHT.x, 12.7, LIGHT.z - 2, .8); light.material = new T.MeshBasicMaterial({ color: '#ffe37a' });
    beam = new T.Mesh(new T.ConeGeometry(4, 30, 16, 1, true), new T.MeshBasicMaterial({ color: '#fff3c1', transparent: true, opacity: .16, depthWrite: false, side: T.DoubleSide }));
    beam.geometry.translate(0, -15, 0); beam.geometry.rotateZ(Math.PI / 2); beam.position.set(LIGHT.x, 12.7, LIGHT.z - 2); api.scene.add(beam);
    api.sign('LIGHTHOUSE', LIGHT.x, 18, LIGHT.z - 2, 9);
    // Dolphins.
    for (let i = 0; i < 3; i++) {
      const d = api.group(POD.x, -3, POD.z), b = api.group(0, 0, 0, d);
      api.ball(b, '#6f8fa6', 0, 0, 0, .55, .55, 1.6); api.ball(b, '#dfe8ec', 0, -.22, .1, .42, .3, 1.3); api.ball(b, '#6f8fa6', 0, .05, 1.55, .22, .2, .5);
      const fin = api.mesh(b, new T.ConeGeometry(.3, .8, 4), '#5f7f96', 0, .6, -.1); fin.rotation.x = -.5;
      const tail = api.ball(b, '#5f7f96', 0, 0, -1.65, .75, .08, .3);
      for (const sd of [-1, 1]) api.ball(b, '#1f2a33', sd * .3, .15, 1.15, .06);
      dolphins.push({ group: d, body: b, tail, phase: i * 2.1 });
    }
  }

  function buildShells() {
    const B = window.Scenery?.BEACH || { x: 0, z: 205, ax: 50, az: 27 };
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + .3, e = .35 + (i % 3) * .14, x = B.x + Math.cos(a) * B.ax * e, z = B.z + Math.abs(Math.sin(a)) * B.az * e * .9 + (i % 2) * 3;
      const g = api.group(x, 0, z), c = SHELL_COLOURS[i];
      if (i % 3 === 2) { const cone = api.mesh(g, new T.ConeGeometry(.35, 1, 8), c, 0, .3, 0); cone.rotation.z = Math.PI / 2; api.ball(g, '#f0c9d6', -.45, .3, 0, .22); }
      else { api.ball(g, c, 0, .18, 0, .5, .2, .45); for (let k = -2; k <= 2; k++) api.box(g, '#d9a98c', k * .17, .33, 0, .05, .06, .8).rotation.y = k * .25; }
      const glow = api.ball(g, '#fff6c9', 0, 1.2, 0, .14); glow.material = new T.MeshBasicMaterial({ color: '#fff3ae' });
      shells.push({ i, group: g, glow, x, z });
    }
    syncShells();
  }
  function syncShells() { shells.forEach(sh => { sh.group.visible = !s.shells.includes(sh.i); }); }

  function buildTrack() {
    const g = api.group(0, 0, 0), N = 140, W = 4.2, pos = [];
    for (let i = 0; i < N; i++) {
      const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2;
      const pts = [ellipse(a0, -W), ellipse(a0, W), ellipse(a1, -W), ellipse(a1, W)];
      const y = .09; pos.push(pts[0].x, y, pts[0].z, pts[2].x, y, pts[2].z, pts[1].x, y, pts[1].z, pts[1].x, y, pts[1].z, pts[2].x, y, pts[2].z, pts[3].x, y, pts[3].z);
      if (i % 2 === 0) for (const lane of [-W - .35, W + .35]) { const p = ellipse((a0 + a1) / 2, lane); api.box(g, i % 4 ? '#f6f3ea' : '#d9574a', p.x, .14, p.z, .6, .2, 1.1).rotation.y = p.heading; }
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.computeVertexNormals();
    const asphalt = new T.Mesh(geo, api.mat('#8f8d88')); asphalt.receiveShadow = true; asphalt.material.side = T.DoubleSide; g.add(asphalt);
    // Chequered start line under ring 1.
    const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d');
    for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#222' : '#fff'; x.fillRect(i * 8, j * 8, 8, 8); }
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
    const line = new T.Mesh(new T.PlaneGeometry(W * 2, 2), new T.MeshStandardMaterial({ map: tex, roughness: .9 })); line.rotation.x = -Math.PI / 2; const st = ellipse(START_A); line.position.set(st.x, .13, st.z); line.rotation.z = Math.PI / 2 - st.heading; line.rotation.order = 'XYZ'; api.scene.add(line);
    api.sign('GRAND PRIX · 3 LAPS', st.x, 11, st.z, 10);
    api.merge(g);
    RIVALS.forEach((r, i) => {
      const k = api.group(0, 0, 0); api.box(k, r.colour, 0, .55, 0, 1.6, .55, 2.6); api.box(k, '#3c3a33', 0, .95, -.3, 1.1, .35, 1);
      for (const [x, z] of [[-.85, .8], [.85, .8], [-.85, -.85], [.85, -.85]]) { const w = api.cylinder(k, '#2f2f2f', x, .38, z, .38, .38, .3, 10); w.rotation.z = Math.PI / 2; }
      api.ball(k, r.face, 0, 1.55, -.3, .42); api.ball(k, r.colour, 0, 1.75, -.35, .45, .3, .45);
      if (r.name === 'Fox') for (const sd of [-1, 1]) api.mesh(k, new T.ConeGeometry(.14, .35, 4), '#e88b4f', sd * .25, 2.05, -.3);
      if (r.name === 'Panda') for (const sd of [-1, 1]) { api.ball(k, '#222', sd * .3, 1.95, -.3, .13); api.ball(k, '#222', sd * .15, 1.6, .05, .09); }
      if (r.name === 'Bunny') for (const sd of [-1, 1]) api.ball(k, '#f1e6dc', sd * .14, 2.25, -.35, .09, .38, .07);
      api.box(k, '#f6f3ea', 0, .84, 1.32, 1.2, .3, .05);
      karts.push({ ...r, model: k, progress: 0, lane: [-2.2, 2.2, 0][i], start: START_A - .09 * (i + 1), speed: 0 });
    });
    parkKarts();
  }
  function parkKarts() { karts.forEach(k => { k.progress = k.start; const p = ellipse(k.progress, k.lane); k.model.position.set(p.x, 0, p.z); k.model.rotation.y = p.heading; }); }

  // ---------- Riding ----------
  function nearRide(pos, ride) {
    if (!ready) return null;
    if (ride === 'horse') return { id: 'horse', icon: '👣', verb: 'GET OFF', text: 'Get off the horse' };
    if (ride === 'boat') return Math.hypot(pos.x - DOCK_END.x, pos.z - DOCK_END.z) < 9 ? { id: 'boat', icon: '⚓', verb: 'GET OFF', text: 'Step onto the dock' } : null;
    if (ride) return null;
    if (Math.hypot(pos.x - horse.x, pos.z - horse.z) < 4) return { id: 'horse', icon: '🐴', verb: 'RIDE', text: 'Ride the horse' };
    if (Math.hypot(pos.x - boat.x, pos.z - boat.z) < 6.5) return { id: 'boat', icon: '⛵', verb: 'SAIL', text: 'Sail the boat' };
    return null;
  }
  function mount(id) {
    if (id === 'horse') { horse.cleared = 0; horse.prevZ = horse.z; horse.prevX = horse.x; api.say('Up you go! Push the circle to ride. Tap HOP to jump. Can you jump over all five fences at the stable?'); return { x: horse.x, z: horse.z, heading: horse.heading }; }
    boat.visited = false; dolphinsSeen = false;
    api.say('All aboard! Push the circle to sail. Can you sail to the lighthouse? Follow the golden dots. Come back to the dock to get off.');
    return { x: boat.x, z: boat.z, heading: boat.heading };
  }
  function dismount(id) {
    if (id === 'horse') { api.say('Good horse! It will wait for you right here.'); return null; }
    boat.x = MOOR.x; boat.z = MOOR.z; boat.heading = 0; api.say(boat.visited ? 'Welcome back, sailor! What a voyage.' : 'Back on the dock. The boat will wait for you.');
    return { x: DOCK_END.x, z: DOCK_END.z - 2 };
  }
  function sailable(x, z) {
    if (Math.hypot(x - LIGHT.x, z - LIGHT.z) < 15) return false;
    if (Math.abs(x) < 2.8 && z < 253) return false;
    const r = Math.hypot(x, z); if (r < 205 || r > 380) return false;
    const sandH = window.Scenery ? (() => { const B = window.Scenery.BEACH, e = Math.hypot((x - B.x) / B.ax, (z - B.z) / B.az); return e < .55 ? .04 : .04 - 3.6 * (e - .55) / .45; })() : -5;
    return sandH < -2.75;
  }
  function follow(ride, pos, heading, speed, moving, hop, dt) {
    if (!ready) return;
    const t = api.time();
    if (ride === 'horse') {
      // Fences: count a jump when the horse crosses a fence line in the air.
      HURDLES.forEach(h => {
        const crossed = (horse.prevZ - h.z) * (pos.z - h.z) <= 0 && horse.prevZ !== pos.z && Math.abs(pos.x - h.x) < 3.4;
        if (!crossed) return;
        if (hop > .3) {
          if (h.n === horse.cleared + 1) {
            horse.cleared++; api.burst(h.x, 2, h.z);
            if (horse.cleared === HURDLES.length) { horse.cleared = 0; stars(3); s.rounds++; persist(); api.toast('🐴 Five fences jumped! +3 ⭐'); api.say('Five fences! 1, 2, 3, 4, 5! You and your horse are champions! Jump them again any time.'); }
            else api.say(`Jump ${horse.cleared}! Now jump fence ${horse.cleared + 1}.`);
            emit('jump'); api.updateHUD();
          } else api.say(`Hooray, a jump! Now try fence ${horse.cleared + 1}.`);
        } else if (t - lastNag > 3) { lastNag = t; api.say('Tap HOP just before the fence to jump!'); }
      });
      horse.prevZ = pos.z; horse.prevX = pos.x;
      horse.x = pos.x; horse.z = pos.z; horse.heading = heading;
    }
    if (ride === 'boat') { boat.x = pos.x; boat.z = pos.z; boat.heading = heading; }
    const gy = window.Scenery?.height(horse.x, horse.z) ?? 0, gallop = ride === 'horse' && moving && !api.reduced;
    horse.model.position.set(horse.x, gy + .25 + (ride === 'horse' ? hop : 0), horse.z); horse.model.rotation.y = horse.heading;
    horse.legs.forEach((leg, i) => { leg.rotation.x = gallop ? Math.sin(t * 13 + [0, .6, 3.1, 3.7][i]) * .7 : 0; });
    horse.body.position.y = gallop ? Math.abs(Math.sin(t * 13)) * .15 : 0; horse.body.rotation.x = gallop ? Math.sin(t * 13) * .05 : 0;
    horse.tail.rotation.x = -.6 + (gallop ? Math.sin(t * 9) * .25 : Math.sin(t * 2) * .08);
    if (ride !== 'horse' && Math.hypot(horse.x - pos.x, horse.z - pos.z) > 110) { horse.x = STABLE.x; horse.z = STABLE.z + 4; horse.heading = Math.PI; }
    void dt; void speed;
  }
  function boatY() { return -2.5 + wave(boat.x, boat.z, seaT()) + .2; }

  // ---------- Grand Prix ----------
  function startGP() {
    gp.state = 'countdown'; gp.rate = .5; gp.count = 3.2; gp.progress = 0; gp.prevA = trackAngle(api.position.x, api.position.z); gp.lap = 1; gp.place = 4; gp.finishedRivals = 0; gp.said = 4;
    parkKarts(); karts.forEach(k => { k.done = false; });
    api.say('Grand Prix! Three laps against Fox, Panda and Bunny. Get ready…');
  }
  function placeNow() { return 1 + karts.filter(k => k.done || k.progress - k.start > gp.progress).length; }
  function updateGP(dt) {
    const P = api.position, ride = api.ride();
    if (gp.state === 'idle') {
      const st = ellipse(START_A - .05);
      if (near(st.x, st.z, ride === 'buggy' ? 5 : 8)) {
        if (ride === 'buggy') startGP();
        else if (!ride && api.time() - lastNag > 6) { lastNag = api.time(); api.bringBuggy(P.x + 2.5, P.z + 1); api.say('This is the Grand Prix! Pip brought your buggy. Tap RIDE, then drive forward over the line to start the race.'); }
      }
      return;
    }
    if (!near(TRACK.x, TRACK.z, 75)) { gp.state = 'idle'; parkKarts(); api.say('The race is over for now. Come back to the start line to race again!'); api.updateHUD(); return; }
    if (gp.state === 'countdown') {
      gp.count -= dt; const n = Math.ceil(gp.count);
      if (n < gp.said && n >= 0) { gp.said = n; api.speak(n > 0 ? String(n) : 'Go!'); api.toast(n > 0 ? `${n}…` : '🏁 GO!'); }
      gp.prevA = trackAngle(P.x, P.z);
      if (gp.count <= 0) { gp.state = 'racing'; api.say('Go, go, go! Drive around the track. Follow the golden dots!'); api.updateHUD(); }
      return;
    }
    // Player progress around the oval, counted only when driving forwards.
    const a = trackAngle(P.x, P.z), d = wrap(a - gp.prevA); gp.prevA = a;
    const r = Math.hypot((P.x - TRACK.x) / TRACK.rx, (P.z - TRACK.z) / TRACK.rz);
    const moved = gp.state === 'racing' && r > .55 && r < 1.5 ? Math.max(-.2, Math.min(.2, d)) : 0; gp.progress += moved;
    gp.rate += ((Math.max(0, moved) / Math.max(dt, .001)) - gp.rate) * Math.min(1, dt * 1.5);
    karts.forEach(k => {
      if (k.done) { k.speed = 0; return; }
      const lead = (k.progress - k.start) - gp.progress, a1 = k.progress, ds = Math.hypot(Math.sin(a1) * TRACK.rx, Math.cos(a1) * TRACK.rz);
      let rate = k.base * (lead < -1.5 ? 1.15 : 1) / ds;
      // Friendly racing: a rival in front drives a little slower than the player is driving.
      if (gp.state === 'racing' && lead > 0) rate = Math.min(rate, Math.max(gp.rate, .25) * k.fair);
      else if (gp.state === 'racing' && lead > -.6) rate = Math.min(rate, Math.max(gp.rate, .3) * k.pass);
      k.speed = rate * ds; k.progress += rate * dt;
      if (k.progress - k.start >= LAPS * Math.PI * 2) { k.done = true; gp.finishedRivals++; }
      const p = ellipse(k.progress, k.lane); k.model.position.set(p.x, api.reduced ? 0 : Math.abs(Math.sin(api.time() * 20 + k.lane)) * .04, p.z); k.model.rotation.y = p.heading;
    });
    if (gp.state !== 'racing') { if (karts.every(k => k.done)) { gp.state = 'idle'; parkKarts(); } return; }
    const lap = Math.min(LAPS, 1 + Math.floor(gp.progress / (Math.PI * 2)));
    if (lap > gp.lap) { gp.lap = lap; const pl = placeNow(); api.say(`Lap ${lap}${lap === LAPS ? ', the last lap' : ''}! You are in ${ordinal(pl)} place.${pl > 1 ? ' You can catch them!' : ' Keep going!'}`); }
    gp.place = placeNow();
    if (gp.progress >= LAPS * Math.PI * 2) {
      const pl = gp.place; gp.state = 'finished';
      const cup = ['gold', 'silver', 'bronze', 'bronze'][pl - 1]; s[cup]++; persist(); stars([5, 3, 2, 2][pl - 1]); emit('gp');
      window.Adventures?.celebrate(pl === 1 ? 8 : 4);
      api.toast(`🏆 ${ordinal(pl)} place · ${cup} cup!`);
      api.say(pl === 1 ? 'You won the Grand Prix! First place! Here is your gold cup! Fox, Panda and Bunny say well done!' : `You finished in ${ordinal(pl)} place! A ${cup} cup for you! Great racing. Drive to the start line to race again.`);
      api.updateHUD();
    }
  }

  // ---------- Sea, shells, dolphins ----------
  function updateSea(dt) {
    const t = api.time(), sea = seaT(), ride = api.ride();
    boat.model.position.set(boat.x, -2.5 + wave(boat.x, boat.z, sea), boat.z); boat.model.rotation.y = boat.heading;
    boat.model.rotation.z = api.reduced ? 0 : Math.sin(t * 1.3) * .05; boat.model.rotation.x = api.reduced ? 0 : Math.sin(t * 1.1 + 1) * .04;
    if (ride !== 'boat' && Math.hypot(boat.x - MOOR.x, boat.z - MOOR.z) > 2) { boat.x = MOOR.x; boat.z = MOOR.z; boat.heading = 0; }
    if (beam) { beam.rotation.y = api.reduced ? .6 : t * .8; light.material.color.setHSL(.13, 1, .62 + (api.reduced ? 0 : Math.sin(t * 3) * .1)); }
    dolphins.forEach((d, i) => {
      const a = (api.reduced ? 0 : t * .35) + d.phase, cx = POD.x + Math.cos(a) * 16, cz = POD.z + Math.sin(a) * 10;
      const jumpPhase = ((api.reduced ? 0 : t * .9) + i * .33) % 1, arc = jumpPhase < .4 ? Math.sin(jumpPhase / .4 * Math.PI) : 0;
      d.group.position.set(cx, -2.9 + arc * 3.2, cz); d.group.rotation.y = -a; d.body.rotation.x = jumpPhase < .4 ? Math.cos(jumpPhase / .4 * Math.PI) * -.8 : 0;
      d.group.visible = arc > 0 || jumpPhase > .95;
    });
    if (ride === 'boat') {
      if (!dolphinsSeen && near(POD.x, POD.z, 30)) { dolphinsSeen = true; api.say('Look! Dolphins jumping! Dolphins are mammals. They breathe air through a blowhole on top of their head.'); emit('dolphin'); }
      if (!boat.visited && near(LIGHT.x, LIGHT.z, 27)) {
        boat.visited = true; s.voyages++; persist(); stars(3); emit('sea'); window.Adventures?.celebrate(3);
        api.toast('⛵ You reached the lighthouse! +3 ⭐');
        api.say('You sailed to the lighthouse! At night its bright light turns round and round, so ships can see the rocks and find their way home. Now sail back to the dock!');
        api.updateHUD();
      }
    }
    shells.forEach(sh => {
      if (s.shells.includes(sh.i)) return;
      sh.glow.position.y = 1.2 + (api.reduced ? 0 : Math.sin(t * 3 + sh.i) * .2);
      if (!near(sh.x, sh.z, ride ? 3.5 : 2.4)) return;
      s.shells.push(sh.i); s.shellTotal++; persist(); syncShells(); stars(1); emit('shell'); api.burst(sh.x, .8, sh.z);
      const n = s.shells.length;
      api.say(n === shells.length ? 'You found all eight shells! A shell is a home made by a sea animal. Brilliant beachcombing! They will wash up again tomorrow.' : `A shell! That makes ${n}. ${shells.length - n} more shells are hiding on the beach.`);
    });
  }

  function update(dt) { if (!ready) return; updateGP(dt); updateSea(dt); }
  function goal() {
    if (!ready) return null;
    const P = api.position, ride = api.ride();
    if (gp.state === 'countdown') { const p = ellipse(START_A + .3); return { icon: '🏁', text: 'Get ready…', x: p.x, z: p.z }; }
    if (gp.state === 'racing') { const p = ellipse(trackAngle(P.x, P.z) + .45); return { icon: '🏎️', text: `Lap ${gp.lap} of ${LAPS} · ${ordinal(gp.place)} place`, x: p.x, z: p.z }; }
    if (ride === 'horse' && Math.hypot(P.x - STABLE.x, P.z - STABLE.z) < 70) { const h = HURDLES[horse.cleared], before = P.z < h.z && Math.abs(P.x - h.x) < 6; return { icon: '🐴', text: `Jump fence ${horse.cleared + 1} · tap HOP`, x: h.x, z: before ? h.z + 5 : h.z - 7 }; }
    if (ride === 'boat') return boat.visited ? { icon: '⚓', text: 'Sail back to the dock', x: MOOR.x - 1, z: MOOR.z + 3 } : { icon: '⛵', text: 'Sail to the lighthouse', x: LIGHT.x - 8, z: LIGHT.z - 17 };
    return null;
  }
  function busy() { return gp.state !== 'idle'; }
  function tiles() {
    return [
      ['gp', '🏎️', 'Grand Prix', s.gold + s.silver + s.bronze ? `🥇${s.gold} 🥈${s.silver} 🥉${s.bronze}` : 'Race Fox, Panda and Bunny'],
      ['horse', '🐴', 'Horse riding', 'Gallop and jump fences'],
      ['sea', '⛵', 'Sail the sea', s.voyages ? `${s.voyages} trips to the lighthouse` : 'Sail to the lighthouse'],
      ['shells', '🐚', 'Beach shells', `${s.shells.length} of 8 found`]
    ];
  }
  function guide(where) {
    if (where === 'gp') { const p = ellipse(START_A - .06); api.go({ x: p.x, z: p.z, text: 'Let’s go to the Grand Prix. Get in your buggy and drive to the start line' }); return true; }
    if (where === 'horse') { api.go({ x: horse.x + 2.5, z: horse.z, text: 'Let’s find your horse. Tap RIDE when you are next to it' }); return true; }
    if (where === 'sea') { api.go({ x: 0, z: 246, text: 'Let’s go to the beach. Walk to the end of the dock and tap SAIL' }); return true; }
    if (where === 'shells') {
      const left = shells.filter(sh => !s.shells.includes(sh.i));
      if (!left.length) { s.shells = []; persist(); syncShells(); api.setMode('play'); api.say('New shells washed up on the beach! Let’s find them.'); return true; }
      const P = api.position, sh = left.sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
      api.go({ x: sh.x, z: sh.z, text: 'Let’s find a seashell on the beach' }); return true;
    }
    return false;
  }

  window.Rides = Object.freeze({
    init(world) { api = world; T = world.T; try { buildHorse(); buildBoat(); buildShells(); buildTrack(); ready = true; } catch (e) { console.warn('Rides unavailable', e); } },
    near: nearRide, mount, dismount, sailable, follow, boatY, update, goal, busy, tiles, guide,
    reset() { s.gold = s.silver = s.bronze = s.voyages = s.rounds = 0; s.shells = []; persist(); if (ready) syncShells(); }
  });
})();
