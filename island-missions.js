/* Connected expedition. All art is local; learning never gates these missions. */
(() => {
  'use strict';
  const clean = raw => {
    const r = raw && typeof raw === 'object' ? raw : {};
    const rescued = r.rescued === true;
    const wood = rescued && Array.isArray(r.wood) ? [...new Set(r.wood.filter(n => [0, 1, 2].includes(n)))] : [];
    const boards = wood.length === 3 && Number.isInteger(r.boards) ? Math.max(0, Math.min(6, r.boards)) : 0;
    const pushes = boards === 6 && Number.isInteger(r.pushes) ? Math.max(0, Math.min(4, r.pushes)) : 0;
    const steps = pushes === 4 && Number.isInteger(r.steps) ? Math.max(0, Math.min(3, r.steps)) : 0;
    return { active: r.active === true, rescued, escort: !rescued && r.escort === true, wood, boards, pushes, steps, complete: steps === 3 && r.complete === true };
  };
  window.IslandMissions = Object.freeze({ clean, create(api) {
    const { T, scene, group, ball, cube, cylinder, segment, disk, label, dinosaur, position, state, say, save, celebrate, reduced } = api;
    state.expedition = clean(state.expedition);
    const s = () => state.expedition;
    const baby = dinosaur('triceratops', '#e3b77d', -17, 6, .32);
    const babySign = label('A LITTLE LOST FRIEND', -17, 3.3, 6, 7);
    const shore = cylinder(scene, '#ead09a', 59, -1, 0, 16, 14, 2, 48); shore.scale.z = .9;
    const grass = cylinder(scene, '#a9c67e', 59, -.05, 0, 14.5, 15.5, .65, 48); grass.scale.z = .87;
    disk('#d9ce9b', 61, .35, 0, 9, 6);
    label('SUNLIT FOSSIL CAVE', 61, 9.5, -3, 10);
    // Open-front, open-roof dollhouse cave: daylight, not darkness.
    const frontWalls = [];
    for (const z of [-6, 6]) for (let x = 55; x < 70; x += 3) { const rock = ball(scene, '#c1b592', x, 2, z, 2.3, 2.2, 1.5); if (z === 6) frontWalls.push({ rock, height: 2.2 }); }
    for (let z = -4; z <= 4; z += 2) { const rock = ball(scene, '#c1b592', 70, 2, z, 1.6, 2.3, 1.8); frontWalls.push({ rock, height: 2.3 }); }
    for (const z of [-5, 5]) ball(scene, '#acaa89', 55, 3, z, 1.7, 3.1, 1.5);
    segment(scene, '#c9bb96', [55, 6, -5], [55, 6, 5], 1.2);
    const boulder = ball(scene, '#a5a78c', 54, 1.9, 0, 1.7, 1.7, 3.9);
    const bridge = group();
    const boards = Array.from({ length: 6 }, (_, i) => cube(bridge, i % 2 ? '#b38a58' : '#c69a63', 36 + i * 1.85, .33, 0, 1.95, .25, 5));
    for (const z of [-2.7, 2.7]) {
      segment(scene, '#947d55', [34, .05, z], [47, .05, z], .16);
      for (const x of [34, 47]) cylinder(scene, '#96784f', x, 1, z, .17, .22, 2);
      segment(scene, '#d4bd8a', [34, 1.8, z], [47, 1.8, z], .06);
    }
    label('TEAMWORK BRIDGE', 32, 4, 0, 7);
    const wood = [[-25, 0, true], [5, -18, false], [24, 8, false]].map(([x, z, high], i) => {
      const g = group(x, high ? 5.8 : .9, z);
      const log = cylinder(g, '#b18550', 0, 0, 0, .35, .35, 2.8); log.rotation.z = Math.PI / 2;
      ball(g, '#f5d89a', 1.42, 0, 0, .04, .26, .26);
      if (high) { cylinder(scene, '#9a8055', x, 2.5, z, .2, .4, 5); segment(scene, '#9a8055', [x, 5, z], [x + 2, 5, z], .2); }
      const sign = label(high ? 'LULU CAN REACH!' : 'BRIDGE TIMBER', x, high ? 8 : 3, z, 6);
      return { x, z, high, model: g, sign, id: i };
    });
    const tiles = [[57, 0], [61, -2], [65, 0]].map(([x, z], i) => {
      const g = disk('#efd181', x, .48, z, 1.6, 1.6);
      const sign = label(i === 1 ? 'HOP HERE ↑' : `FOLLOW ${i + 1}`, x, 2.7, z, 4);
      return { x, z, model: g, sign };
    });
    const skeleton = group(67, .6, 1.5);
    segment(skeleton, '#fff1ca', [-3, 0, 0], [2, 0, 0], .18);
    for (let i = 0; i < 5; i++) for (const side of [-1, 1]) segment(skeleton, '#fff1ca', [-2 + i * .8, 0, 0], [-2.4 + i * .8, .1, side * 1.1], .12);
    ball(skeleton, '#fff1ca', 2.8, .1, 0, .9, .3, .55);
    const timberBasket = group();
    const carried = Array.from({ length: 3 }, (_, i) => {
      const log = cylinder(timberBasket, '#bc8f58', 0, i * .28, 0, .16, .16, 1.7); log.rotation.z = Math.PI / 2; return log;
    });
    let anim = 0, escortSave = 0, initialized = false;
    function stage() { const r = s(); return r.complete ? 'complete' : !r.rescued ? r.escort ? 'escort' : 'rescue' : r.wood.length < 3 ? 'timber' : r.boards < 6 ? 'bridge' : r.pushes < 4 ? 'boulder' : r.steps < 3 ? 'footsteps' : 'fossil'; }
    function objective() {
      const r = s();
      return ({ rescue: '🐣 Find the lost baby', escort: '🐣 Walk the baby to the nursery', timber: `🪵 Bridge timber · ${r.wood.length}/3`, bridge: `🌉 Build the bridge · ${r.boards}/6`, boulder: `🦖 Toto’s strong push · ${r.pushes}/4`, footsteps: `🐾 Cave trail · ${r.steps}/3`, fossil: '🦴 Uncover the cave’s giant fossil', complete: '✦ Expedition complete! Explore freely.' })[stage()];
    }
    function sync() {
      const r = s(); boards.forEach((b, i) => { const appears = i < r.boards; if (!initialized || appears && !b.visible) b.position.y = !initialized || reduced ? .33 : 3; b.visible = appears; });
      wood.forEach(w => { w.model.visible = w.sign.visible = r.rescued && !r.wood.includes(w.id); });
      babySign.visible = !r.rescued && !r.escort;
      skeleton.visible = r.complete;
      tiles.forEach((t, i) => { t.sign.visible = r.pushes === 4 && !r.complete && i === r.steps; t.model.material = api.mat(i < r.steps ? '#a6c87a' : '#efd181'); });
      if (r.rescued) baby.position.set(16, .4, 18);
      if (!initialized || reduced) { boulder.position.z = r.pushes * 1.9; boulder.rotation.x = r.pushes * .7; }
      carried.forEach((log, i) => { log.visible = i < r.wood.length && r.boards < 6; });
      initialized = true;
    }
    function changed(message) { sync(); api.refresh(); save(); if (message) { say(message); celebrate(objective()); } }
    function start() { s().active = true; changed('A little dinosaur needs our help! Tap Pip to find the baby. You can leave the expedition and explore whenever you like.'); }
    function dest(x, z, name, id = 'expedition-step') { return { x, z, name, id }; }
    function dinoHelp(id, task) {
      if (!state.dinosaurs.includes(id) && state.leaves === 0) return api.nextIn('leaves');
      const d = api.dinos.find(d => d.id === id);
      return dest(d.model.position.x, d.model.position.z, `${d.name} · ${task}`, d.id);
    }
    function destination() {
      const r = s();
      switch (stage()) {
        case 'rescue': return dest(baby.position.x, baby.position.z, 'the lost baby');
        case 'escort': return dest(13, 15, 'the nursery');
        case 'timber': {
          const w = wood.find(w => !r.wood.includes(w.id) && !w.high) || wood[0];
          return w.high && api.riding() !== 'longneck' ? dinoHelp('longneck', 'a ride to reach the timber') : dest(w.x, w.z, w.high ? 'the high timber · Lulu can reach' : 'a bridge timber');
        }
        case 'bridge': return dest(32, 0, 'the broken bridge');
        case 'boulder': return api.riding() !== 'triceratops' ? dinoHelp('triceratops', 'a ride to push the boulder') : dest(51, 0, 'the cave boulder');
        case 'footsteps': return dest(tiles[r.steps].x, tiles[r.steps].z, r.steps === 1 ? 'the hopping footprint' : 'the glowing footprint');
        case 'fossil': return dest(67, 1.5, 'the giant fossil dig');
        default: return dest(66, 0, 'your sunlit fossil cave');
      }
    }
    function near() {
      const r = s(), p = position;
      const action = (x, z, radius, task, prompt, icon, word) => Math.hypot(p.x - x, p.z - z) < radius ? { kind: 'expedition', task, prompt, icon, action: word } : null;
      if (!r.rescued && !r.escort) { const n = action(baby.position.x, baby.position.z, 3, 'rescue', 'Invite the lost baby to follow', '🐣', 'HELP'); if (n) return n; }
      if (r.escort) { const n = action(13, 15, 4, 'home', 'Welcome the baby home', '🐣', 'HOME'); if (n) return n; }
      if (r.rescued) for (const w of wood) if (!r.wood.includes(w.id)) { const n = action(w.x, w.z, 3.5, `wood-${w.id}`, w.high ? 'Use Lulu’s long reach' : 'Carry timber to the bridge', '🪵', w.high ? 'REACH' : 'CARRY'); if (n) return n; }
      if (r.rescued && r.boards < 6) { const n = action(32, 0, 4, 'build', r.wood.length < 3 ? 'The bridge needs three timbers' : 'Fit the next bridge plank', '🌉', 'BUILD'); if (n) return n; }
      if (r.boards === 6 && r.pushes < 4) { const n = action(51, 0, 4, 'push', 'Use Toto’s strength to roll the rock', '🦖', 'PUSH'); if (n) return n; }
      if (r.steps === 3 && !r.complete) return action(67, 1.5, 3.5, 'dig', 'Brush the cave’s giant fossil', '🦴', 'DIG');
      return null;
    }
    function interact(o) {
      const r = s(); r.active = true;
      if (o.task === 'rescue') { r.escort = true; changed('Hello, little friend! Walk to the nursery. The baby will follow, and wait whenever you stop. Tap Pip if you need the way.'); }
      else if (o.task === 'home') {
        if (baby.position.distanceTo(new T.Vector3(13, .4, 15)) > 7) { say('Our little friend is catching up. Wait here a moment.'); return; }
        r.escort = false; r.rescued = true; changed('Home together! Now let’s mend the bridge. Two timbers are on the ground, and Lulu can reach the high one. Tap Pip for the next step.');
      } else if (o.task.startsWith('wood-')) {
        const id = Number(o.task.slice(5));
        if (id === 0 && api.riding() !== 'longneck') { say('That timber is high up! Feed Lulu a leaf, ride on her back, and come here to use her long reach.'); return; }
        if (!r.wood.includes(id)) { r.wood.push(id); anim = 1; changed(r.wood.length === 3 ? 'All three timbers! Take them to the bridge and fit the planks.' : 'A timber for our bridge! Tap Pip to find the next one.'); }
      } else if (o.task === 'build') {
        if (r.wood.length < 3) { say('We need three timbers. Tap Pip to find them. Lulu can reach the one in the tree.'); return; }
        r.boards = Math.min(6, r.boards + 1); changed(r.boards === 6 ? 'A bridge we built together! Cross to the cave. Toto can help us roll the big round rock.' : 'A plank fits! Tap Build again to fit the next one.');
      } else if (o.task === 'push') {
        if (api.riding() !== 'triceratops') { say('Toto is strong enough to roll this rock gently. Feed Toto, ride on his back, then come here and tap Push.'); return; }
        r.pushes = Math.min(4, r.pushes + 1); anim = 1; changed(r.pushes === 4 ? 'The way is open! Follow the three golden footprints. Hop on the middle one!' : 'Heave, and roll! Another gentle push, Toto.');
      } else if (o.task === 'dig') api.brush(() => { r.complete = true; changed('A giant fossil! You guided a baby home, built a bridge, and worked with Lulu and Toto. Your sunlit cave is always here to visit.'); });
    }
    function update(dt, time, hop) {
      const r = s(); anim = Math.max(0, anim - dt);
      const visitingCave = position.x > 48;
      frontWalls.forEach(({ rock, height }) => { rock.scale.y = visitingCave ? .55 : height; rock.position.y = visitingCave ? .65 : 2; });
      timberBasket.position.set(position.x, api.riding() ? 4.6 : 2, position.z - .7);
      boards.forEach(b => { if (b.visible && b.position.y > .33) b.position.y = Math.max(.33, b.position.y - dt * 5); });
      boulder.position.z += (r.pushes * 1.9 - boulder.position.z) * Math.min(1, dt * 4);
      boulder.rotation.x += (r.pushes * .7 - boulder.rotation.x) * Math.min(1, dt * 4);
      if (anim && api.riding()) { const d = api.dinos.find(d => d.id === api.riding()); d.model.userData.head.rotation.x = Math.sin(anim * Math.PI * 3) * .22; }
      if (r.escort) {
        const path = route(baby.position, position);
        const next = path.find(p => Math.hypot(p.x - baby.position.x, p.z - baby.position.z) > 2.1) || position;
        const dx = next.x - baby.position.x, dz = next.z - baby.position.z, distance = Math.hypot(dx, dz);
        if (distance > 2) { const step = Math.min(distance - 2, dt * 10); baby.position.x += dx / distance * step; baby.position.z += dz / distance * step; baby.rotation.y = Math.atan2(dx, dz); }
        baby.position.y = .4 + (!reduced && distance > 2 ? Math.abs(Math.sin(time * 10)) * .15 : 0);
        baby.userData.legs.forEach((l, i) => { l.rotation.x = !reduced && distance > 2 ? Math.sin(time * 11 + i * Math.PI) * .4 : 0; });
        escortSave += dt; if (escortSave > 3) { escortSave = 0; save(); }
      }
      if (r.pushes === 4 && r.steps < 3) {
        const tile = tiles[r.steps];
        if (Math.hypot(position.x - tile.x, position.z - tile.z) < 1.9 && (r.steps !== 1 || hop > .5)) { r.steps++; changed(r.steps === 3 ? 'The footprints led to a giant fossil! Brush the sandy patch at the back of the cave.' : r.steps === 1 ? 'Next, hop on the middle footprint!' : 'One more golden footprint!'); }
      }
    }
    const main = p => Math.hypot(p.x / 37.5, p.z / 29) <= 1;
    function walkable(p) {
      if (main(p)) return true;
      if (s().boards !== 6) return false;
      if (p.x >= 34 && p.x <= 48 && Math.abs(p.z) <= 2.4) return true;
      if (Math.hypot((p.x - 59) / 13, p.z / 10.5) > 1) return false;
      if (s().pushes !== 4 && p.x > 52) return false;
      return true;
    }
    function clamp(p) {
      if (walkable(p)) return p;
      // Project to the nearest reachable shore or bridge, never across locked terrain.
      const r = Math.hypot(p.x / 37.5, p.z / 29);
      const candidates = [{ x: p.x / Math.max(1, r) * .999999, z: p.z / Math.max(1, r) * .999999 }];
      if (s().boards === 6) {
        candidates.push({ x: Math.max(34, Math.min(48, p.x)), z: Math.max(-2.4, Math.min(2.4, p.z)) });
        const q = Math.max(1, Math.hypot((p.x - 59) / 13, p.z / 10.5));
        candidates.push({ x: Math.min(s().pushes === 4 ? 71.999 : 52, 59 + (p.x - 59) / q * .999999), z: p.z / q * .999999 });
      }
      const best = candidates.filter(walkable).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
      p.x = best.x; p.z = best.z; return p;
    }
    function route(from, to) {
      const goal = clamp(to.clone()), points = [];
      if (main(from) && !main(goal)) { points.push(new T.Vector3(34, .4, 0)); if (goal.x > 48) points.push(new T.Vector3(49, .4, 0)); }
      else if (!main(from) && main(goal)) { if (from.x > 48) points.push(new T.Vector3(49, .4, 0)); points.push(new T.Vector3(34, .4, 0)); }
      else if (!main(from) && !main(goal)) {
        if (from.x > 48 && goal.x < 48 || from.x < 48 && goal.x > 48) points.push(new T.Vector3(49, .4, 0));
      }
      points.push(goal); return points;
    }
    function reset() { state.expedition = clean({}); baby.position.set(-17, .4, 6); initialized = false; sync(); }
    sync();
    return { start, stage, objective, destination, near, interact, update, walkable, clamp, route, reset, sync,
      progress: () => s().complete ? 100 : !s().rescued ? s().escort ? 8 : 0 : 15 + s().wood.length * 8 + s().boards * 4 + s().pushes * 5 + s().steps * 4,
      snapshot: () => ({ stage: stage(), baby: [baby.position.x, baby.position.z], ...s() }) };
  } });
})();
