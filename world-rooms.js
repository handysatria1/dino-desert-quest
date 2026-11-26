/* Extra things to do inside every wonder room: five hidden gems, a spoken quiz stand,
   and a souvenir stall that gives a keepsake once the room is fully explored. */
(() => {
  'use strict';
  const KEY = 'little-explorer-rooms-v1';
  const QUIZ = {
    wall: [['Which country is the Great Wall in?', 'China', 'Peru', 'Italy'], ['What is the Great Wall made of?', 'Stone and bricks', 'Ice', 'Paper'], ['Is the Great Wall straight or bendy?', 'Bendy, over the hills', 'Perfectly straight', 'A round circle']],
    giza: [['Which country are the pyramids in?', 'Egypt', 'France', 'Brazil'], ['What shape are the sides of a pyramid?', 'Triangles', 'Circles', 'Stars'], ['What were mummies wrapped in?', 'Cloth bandages', 'Paper', 'Leaves'], ['Which animal walks across the desert?', 'A camel', 'A penguin', 'A polar bear']],
    petra: [['Which country is Petra in?', 'Jordan', 'Mexico', 'Australia'], ['What colour is the rock at Petra?', 'Pink sandstone', 'Blue ice', 'Green grass'], ['Is Petra in a wet place or a dry place?', 'A dry place', 'A snowy place', 'Under the sea']],
    eiffel: [['Which country is the Eiffel Tower in?', 'France', 'India', 'Peru'], ['What is the Eiffel Tower made of?', 'Iron', 'Chocolate', 'Wool'], ['How many levels can visitors stand on?', 'Three', 'Ten', 'One']],
    taj: [['Which country is the Taj Mahal in?', 'India', 'Egypt', 'Brazil'], ['When both sides match, it is called…', 'Symmetry', 'A shadow', 'A puddle'], ['What is the big round roof called?', 'A dome', 'A tent', 'A slide']],
    colosseum: [['Which country is the Colosseum in?', 'Italy', 'China', 'Malaysia'], ['What is an arch?', 'A curved opening', 'A square box', 'A ladder'], ['What is the top stone of an arch called?', 'The keystone', 'The doorknob', 'The pebble']],
    opera: [['Which country is the Sydney Opera House in?', 'Australia', 'Jordan', 'France'], ['What do its roofs look like?', 'Sails or shells', 'Hats', 'Boxes'], ['Which animal lives in Australia?', 'A kangaroo', 'A llama', 'A camel']],
    chichen: [['Which country is Chichén Itzá in?', 'Mexico', 'Italy', 'Indonesia'], ['The pyramid has many…', 'Stairs', 'Wheels', 'Windows'], ['Who built Chichén Itzá?', 'The Maya people', 'The Romans', 'Robots']],
    borobudur: [['Which country is Borobudur in?', 'Indonesia', 'Peru', 'Egypt'], ['Which island is Borobudur on?', 'Java', 'Iceland', 'Hawaii'], ['What shape are the stupas?', 'Like bells', 'Like cubes', 'Like stars']],
    machu: [['Which country is Machu Picchu in?', 'Peru', 'China', 'Australia'], ['Which animal lives in the Andes mountains?', 'A llama', 'A penguin', 'A kangaroo'], ['What are flat steps on a hillside called?', 'Terraces', 'Tunnels', 'Bridges']],
    petronas: [['Which country are the Petronas Towers in?', 'Malaysia', 'Mexico', 'Italy'], ['How many towers are there?', 'Two', 'Three', 'One'], ['What joins the two towers?', 'A sky bridge', 'A rope', 'A rainbow']],
    rio: [['Which country is Corcovado in?', 'Brazil', 'Jordan', 'France'], ['What is Corcovado?', 'A mountain', 'A lake', 'A desert'], ['What do trees give to birds?', 'Places to live', 'Ice cream', 'Shoes']]
  };
  const SOUVENIRS = { wall: ['🧱', 'mini brick'], giza: ['🐪', 'toy camel'], petra: ['🏺', 'sandstone pot'], eiffel: ['🗼', 'tiny tower'], taj: ['🌸', 'flower tile'], colosseum: ['🏛️', 'arch model'], opera: ['🦘', 'toy kangaroo'], chichen: ['🔺', 'pyramid step'], borobudur: ['🔔', 'stone bell'], machu: ['🦙', 'toy llama'], petronas: ['🏙️', 'twin towers model'], rio: ['🦜', 'parrot feather'] };
  const GEM_SPOTS = [[-10, -1.5], [10, -1.5], [-4.5, 5.6], [4.5, 5.6], [0, -1]];
  const GEM_COLOURS = ['#e05b47', '#4f8fc4', '#5ea36a', '#c8a3dc', '#f0c43c'];

  let saved = {};
  try { const raw = JSON.parse(localStorage.getItem(KEY) || '{}'); if (raw && typeof raw === 'object') saved = raw; } catch { saved = {}; }
  const ids = Object.keys(SOUVENIRS), clean = a => Array.isArray(a) ? [...new Set(a.filter(id => ids.includes(id)))] : [];
  const s = { quizzes: clean(saved.quizzes), souvenirs: clean(saved.souvenirs) };
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* optional */ } }
  const emit = (type, amount = 1) => window.dispatchEvent(new CustomEvent('little-explorer:event', { detail: { type, amount } }));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let api = null, quiz = null;

  function label(T, text, colour) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#fffdf3'; x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill(); x.lineWidth = 8; x.strokeStyle = colour; x.stroke();
    x.font = '64px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 64, 70);
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; const sp = new T.Sprite(new T.SpriteMaterial({ map: tex })); sp.scale.set(1.6, 1.6, 1); return sp;
  }

  function decorate(b, place, room) {
    const { T, box, ball, cylinder, group } = b, root = group(0, 0, 0, room.scene);
    room.placeId = place.id; room.gemsFound = 0;
    // Gems first, so Pip guides to them before the quiz and stall.
    GEM_SPOTS.forEach(([x, z], i) => {
      const g = group(x, 0, z, root), gem = new T.Mesh(new T.OctahedronGeometry(.42, 0), new T.MeshStandardMaterial({ color: GEM_COLOURS[i], roughness: .15, metalness: .3, emissive: GEM_COLOURS[i], emissiveIntensity: .35 }));
      gem.position.y = 1.1; gem.scale.y = 1.4; g.add(gem); const glow = ball(g, '#fff6c9', 0, .08, 0, .7, .04, .7);
      room.hotspots.push({ x, z, icon: '💎', text: 'A sparkly gem', fact: '', kind: 'gem', model: g, gem, glow, seen: false, changed: false });
    });
    const kiosk = group(-9.6, 0, 2.6, root); box(kiosk, '#7cb6c3', 0, .7, 0, 1.6, 1.4, 1); box(kiosk, '#fffdf3', 0, 1.75, .1, 1.5, 1, .12).rotation.x = -.3;
    const q = label(T, '❓', '#7cb6c3'); q.position.set(0, 3, 0); kiosk.add(q); room.blocks.push({ x: -9.6, z: 2.6, w: 1, d: .7 });
    room.hotspots.push({ x: -8, z: 3.6, icon: '❓', text: 'Wonder quiz', fact: '', kind: 'quiz', model: kiosk, seen: s.quizzes.includes(place.id), changed: false });
    const stall = group(9.6, 0, 2.6, root); box(stall, '#d8bd8b', 0, .55, 0, 1.8, 1.1, 1.1);
    for (let i = 0; i < 4; i++) box(stall, i % 2 ? '#fffdf3' : '#e58d7a', -.68 + i * .45, 2.3, 0, .45, .12, 1.5);
    for (const x of [-.85, .85]) cylinder(stall, '#a07a4c', x, 1.2, -.45, .06, .06, 2.3, 6);
    for (let i = 0; i < 3; i++) ball(stall, ['#f0c43c', '#8fc7e8', '#e8848e'][i], -.5 + i * .5, 1.25, .1, .18);
    const gift = label(T, SOUVENIRS[place.id][0], '#e58d7a'); gift.position.set(0, 3.2, 0); stall.add(gift); room.blocks.push({ x: 9.6, z: 2.6, w: 1.1, d: .8 });
    room.hotspots.push({ x: 8, z: 3.6, icon: '🎁', text: 'Souvenir stall', fact: '', kind: 'souvenir', model: stall, seen: s.souvenirs.includes(place.id), changed: false });
    room.scene.updateMatrixWorld(true);
  }

  function complete(room) { return room.hotspots.every(h => h.kind === 'souvenir' || h.seen); }
  function remaining(room) {
    const facts = room.hotspots.filter(h => !h.kind && !h.seen).length, gems = room.hotspots.filter(h => h.kind === 'gem' && !h.seen).length, q = room.hotspots.find(h => h.kind === 'quiz' && !h.seen);
    return [facts && `${facts} thing${facts > 1 ? 's' : ''} to look at`, gems && `${gems} gem${gems > 1 ? 's' : ''} to find`, q && 'the quiz'].filter(Boolean);
  }
  function nudgeSouvenir(room) {
    if (complete(room) && !s.souvenirs.includes(room.placeId)) api.say(`You explored everything in this room! Visit the souvenir stall for a present.`);
  }

  function collectGem(h, room) {
    if (h.seen) return true; h.seen = true; h.model.visible = false; room.gemsFound++;
    window.BrainGames?.addStars(1); emit('gem');
    const n = room.hotspots.filter(x => x.kind === 'gem' && x.seen).length;
    api.toast(`💎 ${n} of 5 gems`);
    api.say(n === 5 ? 'Five gems! One, two, three, four, five. You found them all!' : `A sparkly gem! That makes ${n}. ${5 - n} more to find.`);
    if (n === 5) setTimeout(() => nudgeSouvenir(room), 2500);
    api.updateHUD(); return true;
  }

  function openQuiz(h, room) {
    const qs = shuffle((QUIZ[room.placeId] || []).map(([q, ...opts]) => ({ q, answer: opts[0], options: shuffle([...opts]) })));
    quiz = { h, room, qs, i: 0, tries: 0 }; api.setMode('quiz'); renderQuiz();
  }
  function renderQuiz() {
    const { qs, i } = quiz, q = qs[i];
    api.overlay.innerHTML = `<section class="card brain-card" role="dialog" aria-modal="true" aria-labelledby="room-quiz-title"><button class="close" data-room="close" aria-label="Back to the room">×</button><small>WONDER QUIZ · QUESTION ${i + 1} OF ${qs.length}</small><h2 id="room-quiz-title">${q.q}</h2><div class="brain-options">${q.options.map((o, k) => `<button class="brain-choice room-choice" data-room="answer" data-index="${k}"><small>${o}</small></button>`).join('')}</div><p id="brain-feedback" class="brain-feedback" role="status">Tap an answer.</p><div class="buttons"><button data-room="hear">🔊 Hear it again</button></div></section>`;
    api.focusCard(); api.speak(`${q.q} ${q.options.join('? ')}?`);
  }
  function answer(k) {
    if (!quiz || quiz.busy) return; const q = quiz.qs[quiz.i], pick = q.options[k], btn = api.overlay.querySelector(`[data-index="${k}"]`), fb = document.getElementById('brain-feedback');
    if (pick === q.answer) {
      quiz.busy = true; btn?.classList.add('right'); if (fb) fb.textContent = `Yes! ${q.answer}!`; api.speak(`Yes! ${q.answer}!`); window.BrainGames?.addStars(1);
      setTimeout(() => {
        if (!quiz) return; quiz.busy = false; quiz.i++;
        if (quiz.i < quiz.qs.length) return renderQuiz();
        const { h, room, qs: asked } = quiz; quiz = null; h.seen = true;
        if (!s.quizzes.includes(room.placeId)) { s.quizzes.push(room.placeId); persist(); }
        emit('quiz'); api.setMode('play'); api.updateHUD();
        api.say(complete(room) && !s.souvenirs.includes(room.placeId) ? `Quiz complete! ${asked.length} right answers. Now visit the souvenir stall for a present!` : `Quiz complete! ${asked.length} right answers. ${remaining(room).length ? 'Still to do: ' + remaining(room).join(', ') + '.' : ''}`);
      }, 1700);
    } else { btn?.classList.add('wrong'); if (fb) fb.textContent = 'Almost! Try another one.'; api.speak('Almost! Try another one.'); setTimeout(() => btn?.classList.remove('wrong'), 900); }
  }

  function souvenir(h, room) {
    const [icon, name] = SOUVENIRS[room.placeId];
    if (s.souvenirs.includes(room.placeId)) { h.seen = true; api.say(`You already have the ${name} from here! You have ${s.souvenirs.length} souvenirs on your shelf.`); return true; }
    if (!complete(room)) { api.say(`Welcome to the souvenir stall! Explore the whole room to earn a present. Still to do: ${remaining(room).join(', ')}.`); return true; }
    s.souvenirs.push(room.placeId); persist(); h.seen = true; window.BrainGames?.addStars(3); emit('souvenir');
    api.toast(`${icon} New souvenir: ${name}!`);
    api.say(`Here is your souvenir: a ${name}! It goes on your souvenir shelf. You have ${s.souvenirs.length} of ${ids.length}.${s.souvenirs.length === ids.length ? ' You collected a souvenir from every wonder! Amazing world traveller!' : ''}`);
    api.updateHUD(); return true;
  }

  function inspect(h) {
    const room = api.interior?.(); if (!room || !h.kind) return false;
    if (h.kind === 'gem') return collectGem(h, room);
    if (h.kind === 'quiz') { openQuiz(h, room); return true; }
    if (h.kind === 'souvenir') return souvenir(h, room);
    return false;
  }
  function update(room, pos, dt, t) {
    if (!room?.hotspots) return;
    room.hotspots.forEach(h => {
      if (h.kind !== 'gem' || h.seen) return;
      h.gem.rotation.y = t * 1.5; h.gem.position.y = 1.1 + Math.sin(t * 2.5 + h.x) * .15;
      if (Math.hypot(pos.x - h.x, pos.z - h.z) < 1.3) collectGem(h, room);
    });
  }
  function shelf() {
    api.setMode('adventures');
    const all = (window.WonderPlaces?.places || []).map(p => { const [icon, name] = SOUVENIRS[p.id] || ['?', '']; const got = s.souvenirs.includes(p.id); return `<div class="adv-item ${got ? 'on' : ''}"><span aria-hidden="true">${got ? icon : '❔'}</span><strong>${got ? name : p.name}</strong><small>${got ? p.name : 'Explore its room'}</small></div>`; }).join('');
    api.overlay.innerHTML = `<section class="card adv-card" role="dialog" aria-modal="true" aria-labelledby="shelf-title"><button class="close" data-adv="close" aria-label="Back to playing">×</button><small>FROM YOUR TRAVELS</small><h2 id="shelf-title">Souvenir shelf</h2><p>Walk inside a wonder, look at everything, find five gems and answer the quiz. Then visit the souvenir stall!</p><div class="adv-items">${all}</div><div class="buttons"><button data-adv="board">← Adventure board</button><button class="primary" data-adv="close">▶ Play</button></div></section>`;
    api.focusCard(); api.speak(`Your souvenir shelf. You have ${s.souvenirs.length} of ${ids.length} souvenirs.`);
  }

  document.getElementById('overlay')?.addEventListener('click', e => {
    const b = e.target.closest('[data-room]'); if (!b || !api) return;
    const a = b.dataset.room;
    if (a === 'answer') answer(Number(b.dataset.index));
    else if (a === 'hear' && quiz) { const q = quiz.qs[quiz.i]; api.speak(`${q.q} ${q.options.join('? ')}?`); }
    else if (a === 'close') { quiz = null; api.setMode('play'); api.updateHUD(); }
  });

  window.WonderRooms = Object.freeze({
    init(world) { api = world; },
    decorate, inspect, update, shelf,
    tiles() { return [['souvenirs', '🎁', 'Souvenir shelf', `${s.souvenirs.length} of ${ids.length} collected`]]; },
    guide(a) { if (a !== 'souvenirs') return false; shelf(); return true; },
    reset() { s.quizzes = []; s.souvenirs = []; persist(); }
  });
})();
