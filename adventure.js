(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const canvas = $('#world'), ctx = canvas.getContext('2d');
  if (!ctx) { $('#overlay').innerHTML = '<div class="full-error">This browser cannot draw the game. <a href="index.html">Try the original activities.</a></div>'; return; }
  const overlay = $('#overlay'), shell = $('#game');
  const H = 720, GROUND = 525;
  let W = 1280, dpr = 1, scale = 1, time = 0, last = 0, camera = 0;
  let mode = 'title', world = 'valley', voice = true, outfit = 'gold', stamps = [], finishedWorld = false;
  let saveAvailable = true, speechTimer = 0, message = '', pendingJump = false, pausedBeforeNotes = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const keys = new Set(), touch = new Set(), pointers = new Map();
  const particles = [], player = { x: 120, y: GROUND - 64, w: 34, h: 64, vx: 0, vy: 0, grounded: true, face: 1, coyote: 0, target: null, safeX: 120 };
  let companion = { x: 55, y: GROUND }, data, selectedPiece = null, puzzleType = '', slots = {}, pieceOrder = [], drag = null, clickSuppressedUntil = 0;
  try {
    const stored = JSON.parse(localStorage.getItem('little-explorer-adventure-v2') || '{}');
    voice = stored.voice !== false;
    outfit = ['gold', 'blue', 'red'].includes(stored.outfit) ? stored.outfit : 'gold';
    stamps = Array.isArray(stored.stamps) ? stored.stamps.filter(s => ['valley', 'egypt'].includes(s)) : [];
  } catch { saveAvailable = false; }
  function save() {
    try { localStorage.setItem('little-explorer-adventure-v2', JSON.stringify({ voice, outfit, stamps })); }
    catch { saveAvailable = false; }
  }
  function clearInput() { keys.clear(); touch.clear(); pointers.clear(); pendingJump = false; player.target = null; document.querySelectorAll('.pressed').forEach(b => b.classList.remove('pressed')); }
  let speechGeneration = 0;
  function stopVoice() {
    speechGeneration++;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    window.Recitation?.hold('speech', false);
  }
  function stopAllAudio() {
    stopVoice();
    overlay.querySelector('iframe')?.contentWindow?.postMessage('little-explorer:stop-audio', '*');
  }
  function read(text) {
    stopVoice();
    if (!voice || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const speechToken = speechGeneration;
    window.Recitation?.hold('speech', true);
    utterance.lang = 'en-GB'; utterance.rate = .87; utterance.pitch = 1.12;
    const available = speechSynthesis.getVoices();
    const preferred = available.find(v => v.lang.startsWith('en-GB')) || available.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;
    utterance.onend = utterance.onerror = () => {
      if (speechToken === speechGeneration) window.Recitation?.hold('speech', false);
    }; // The same instructions always remain visible.
    speechSynthesis.speak(utterance);
  }
  function say(text, duration = 7, speak = true) {
    message = text; speechTimer = duration;
    $('#speech-text').textContent = text;
    $('#speech').hidden = false;
    if (speak) read(text);
  }
  function resize() {
    const box = shell.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2); scale = box.height / H; W = box.width / scale;
    canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr);
    canvas.style.width = '100%'; canvas.style.height = '100%';
    camera = Math.max(0, Math.min(camera, (data?.width || 3000) - W));
  }
  new ResizeObserver(resize).observe(shell);
  function resetWorld(name) {
    world = name; finishedWorld = false; clearInput(); particles.length = 0;
    data = { width: name === 'camp' ? 1900 : name === 'egypt' ? 2850 : 2500, amber: 0, leaves: 0, fed: false, riding: false, fossil: 0, museum: false, bridge: false, boarded: false, onBoat: false, arrived: false, papyrus: 0, brushed: [0, 0, 0], items: [], platforms: [] };
    if (name === 'valley') {
      data.items = [{ x: 265, y: GROUND - 33, type: 'leaf' }, { x: 440, y: GROUND - 33, type: 'leaf' }];
      data.platforms = [{ x: 720, y: 445, w: 160 }, { x: 1030, y: 422, w: 170 }, { x: 1330, y: 440, w: 145 }, { x: 1940, y: 440, w: 165 }];
      [345, 765, 825, 1065, 1130, 1370, 1425, 1670, 1970, 2035, 2210].forEach((x, i) => data.items.push({ x, y: [765, 825, 1065, 1130, 1370, 1425, 1970, 2035].includes(x) ? 389 - (i % 2) * 9 : GROUND - 38, type: 'amber' }));
    } else if (name === 'egypt') {
      data.platforms = [{ x: 450, y: 447, w: 140 }, { x: 720, y: 435, w: 150 }, { x: 1520, y: 442, w: 140 }];
      [280, 490, 550, 760, 820, 1010, 1550, 1620, 2450, 2510].forEach((x, i) => data.items.push({ x, y: [490, 550, 760, 820, 1550, 1620].includes(x) ? 385 : GROUND - 37, type: 'amber' }));
      [1880, 2080, 2260].forEach(x => data.items.push({ x, y: GROUND - 16, type: 'papyrus' }));
    }
    Object.assign(player, { x: 130, y: GROUND - 64, vx: 0, vy: 0, grounded: true, face: 1, coyote: .12, target: null, safeX: 130 });
    companion = { x: 60, y: GROUND }; camera = 0; speechTimer = 0;
    updateHUD();
  }
  function setMode(next) {
    window.Recitation?.hold('game', !['play', 'title', 'map'].includes(next));
    mode = next; clearInput(); stopAllAudio();
    shell.classList.toggle('busy', next !== 'play');
    const showingGame = next !== 'title';
    $('#hud').hidden = !showingGame; $('#controls').hidden = next !== 'play';
    if (next !== 'play') { $('#speech').hidden = true; $('#world-prompt').hidden = true; }
    overlay.classList.toggle('shaded', !['play', 'title'].includes(next));
    if (next === 'play') { overlay.innerHTML = ''; canvas.focus({ preventScroll: true }); }
  }
  function start(name = 'valley', activity = false) {
    if (!activity && name === world && mode === 'map' && !finishedWorld) { resume(); return; }
    resetWorld(name); setMode('play');
    if (activity) return openPuzzle(name === 'valley' ? 'fossil' : 'bridge', true);
    say(name === 'valley' ? 'Salaam, explorer! I’m Pip. Let’s find two leaves for my hungry friend. Use the arrows to walk!' : name === 'egypt' ? 'Welcome to our Egypt adventure! Run to the little bridge. We can help repair it together.' : 'Welcome to our quiet camp. No missions here. Come explore, or choose a little prayer or Qur’an time.');
  }
  function showTitle() {
    resetWorld('valley'); setMode('title');
    overlay.innerHTML = `<section class="title-screen"><div class="title-copy"><span class="title-tag">✦ A BRAND-NEW LITTLE ADVENTURE</span><h1>Dino &<br>Desert <span>Quest!</span></h1><p>A hungry dinosaur. Lost fossils. A river to cross.<br>Big adventures start with little footsteps.</p><div class="title-actions"><button class="big-button" data-do="start">Let’s play! <span>▶</span></button><button class="text-link" data-do="map">Choose an adventure</button></div><button class="title-recitation" data-do="recitation">☷ Listen along: Juz Amma · Muzammil Hasballah</button><div class="title-footnote"><span>RUN & JUMP</span><span>HELP & DISCOVER</span><span>LEARN TOGETHER</span></div></div><div class="title-badge"><span>🦕</span>Pip is waiting for you!</div></section>`;
  }
  const closeButton = '<button class="close-modal" data-do="resume" aria-label="Back to the adventure">×</button>';
  function showMap() {
    setMode('map');
    overlay.innerHTML = `<section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="map-title">${closeButton}<span class="kicker">YOUR POCKET ADVENTURE MAP</span><h2 id="map-title">Where to, explorer?</h2><p>Every place is open. Pick a new adventure, or return to a favourite.</p><div class="map-worlds">${[['valley', '🦕', 'Dinosaur valley', 'Help a dino. Build a fossil display.'], ['egypt', '⛵', 'Nile adventure', 'Fix the bridge. Sail down the river.'], ['camp', '☾', 'Quiet camp', 'Prayer, Qur’an, and a little rest.']].map(([id, emoji, title, subtitle]) => `<button class="world-card" data-do="world" data-world="${id}">${stamps.includes(id) ? '<span class="stamp">✦ EXPLORED</span>' : ''}<span class="world-emoji" aria-hidden="true">${emoji}</span><strong>${title}</strong><small>${subtitle}</small></button>`).join('')}</div><div class="outfit-row">My explorer’s jacket ${['gold', 'blue', 'red'].map(c => `<button class="swatch outfit-${c} ${outfit === c ? 'selected' : ''}" data-do="outfit" data-color="${c}" aria-label="${c} jacket" aria-pressed="${outfit === c}"></button>`).join('')}</div><div class="map-bottom"><button class="text-link" data-do="activities">Activity list · no movement needed</button><button class="text-link" data-do="title">Back to title</button></div></section>`;
    focusOverlay();
  }
  function focusOverlay() { overlay.querySelector('h2')?.setAttribute('tabindex', '-1'); (overlay.querySelector('h2') || overlay.querySelector('button'))?.focus({ preventScroll: true }); }
  function pause() {
    setMode('pause');
    overlay.innerHTML = `<section class="modal-card pause-card" role="dialog" aria-modal="true" aria-labelledby="pause-title"><span class="complete-icon" aria-hidden="true">☁</span><span class="kicker">A LITTLE BREATHER</span><h2 id="pause-title">Adventure can wait.</h2><p>No timer. No rush. Pip will be right here.</p><button class="big-button green" data-do="resume">Keep exploring ▶</button><button class="big-button cream" data-do="map">Adventure map ▦</button><button class="text-link" data-do="notes">Grown-up notes</button></section>`;
    focusOverlay();
  }
  function resume() { setMode('play'); updateHUD(); }
  function activities() {
    setMode('activities');
    overlay.innerHTML = `<section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="activities-title"><button class="close-modal" data-do="map" aria-label="Back to adventure map">×</button><span class="kicker">A DIFFERENT WAY TO EXPLORE</span><h2 id="activities-title">Pick a little activity.</h2><p>No running or jumping needed. All puzzles work with buttons, touch, or a keyboard.</p><div class="activity-options"><button data-do="activity-fossil">🦴 Put the fossil display together</button><p>Match the three fossil pieces to their outlines.</p><button data-do="activity-bridge">⛵ Repair the Egyptian bridge</button><p>Match the three shapes and help the boats pass.</p><button data-do="learn-prayer">☾ Prayer with my grown-up</button><button data-do="learn-quran">☷ Listen in the Qur’an garden</button></div><button class="text-link" data-do="map">← Back to adventure map</button></section>`;
    focusOverlay();
  }
  function updateHUD() {
    if (!data) return;
    const quest = world === 'valley' ? !data.fed ? data.leaves < 2 ? 'Find 2 leaves for the big dinosaur' : 'Bring the leaves to the big dinosaur' : data.fossil < 3 ? 'Brush the 3 sandy fossil mounds' : !data.museum ? 'Build your fossil display at the table' : 'Your museum is ready! Find the flag →' : world === 'egypt' ? !data.bridge ? 'Help repair the little bridge' : !data.arrived ? 'Find the boat and sail down the Nile' : 'Find the explorer flag on the far bank →' : 'A little rest. A little learning. Your choice.';
    $('#world-label').textContent = ({ valley: 'CHAPTER 01 · DINOSAUR VALLEY', egypt: 'CHAPTER 02 · THE NILE ADVENTURE', camp: 'ALWAYS OPEN · THE QUIET CAMP' })[world];
    $('#quest-label').textContent = quest;
    const progress = world === 'valley' ? [data.fed, data.fossil >= 1, data.fossil >= 2, data.fossil >= 3, data.museum] : world === 'egypt' ? [data.bridge, data.boarded, data.arrived] : [];
    $('#quest-progress').innerHTML = progress.map(done => `<span class="quest-dot ${done ? 'done' : ''}"></span>`).join('') + `<em>${world === 'camp' ? 'No scores. No tests. Just time together.' : world === 'valley' ? `${data.fossil}/3 fossils · ${data.leaves}/2 leaves` : `${data.papyrus}/3 papyrus rolls spotted`}</em>`;
    $('#amber-counter b').textContent = data.amber;
    $('#amber-counter').hidden = world === 'camp';
    $('#voice-button').setAttribute('aria-pressed', String(voice));
    $('#voice-button').setAttribute('aria-label', `Turn English voice ${voice ? 'off' : 'on'}`);
    $('#voice-button').textContent = voice ? '◖))' : '◖×';
  }
  function nearObject() {
    const x = player.x + player.w / 2;
    if (data.onBoat) return null;
    if (world === 'valley') {
      if (Math.abs(x - 605) < 135 && !data.fed) return { type: 'feed', label: data.leaves >= 2 ? 'Give the dinosaur two leaves' : 'Meet the hungry dinosaur' };
      for (let i = 0; i < 3; i++) if (Math.abs(x - [875, 1210, 1510][i]) < 90 && data.brushed[i] < 3) return { type: 'brush', index: i, label: `Brush this fossil · ${data.brushed[i]}/3` };
      if (Math.abs(x - 1820) < 115) return { type: 'museum', label: data.museum ? 'Look at your fossil display' : 'Build the fossil display' };
      if (Math.abs(x - 2320) < 100) return { type: 'finish', label: 'Finish the valley adventure' };
      if (Math.abs(x - 605) < 145 && data.fed && !data.riding) return { type: 'ride', label: 'Hop on the friendly dinosaur!' };
      if (data.riding) return { type: 'dismount', label: 'Hop off the dinosaur' };
    } else if (world === 'egypt') {
      if (Math.abs(x - 1090) < 100 && !data.bridge) return { type: 'bridge', label: 'Repair the little bridge' };
      if (Math.abs(x - 1670) < 100 && !data.arrived) return { type: 'boat', label: 'Hop aboard the little boat' };
      if (Math.abs(x - 2670) < 100) return { type: 'finish', label: 'Finish the Nile adventure' };
    } else {
      if (Math.abs(x - 600) < 115) return { type: 'learn-quran', label: 'Visit the Qur’an garden' };
      if (Math.abs(x - 1090) < 125) return { type: 'learn-prayer', label: 'Learn a little prayer together' };
      if (Math.abs(x - 1570) < 100) return { type: 'map', label: 'Choose another adventure' };
    }
    return null;
  }
  function interact() {
    if (mode !== 'play') return;
    const object = nearObject();
    if (!object) return say(data.onBoat ? 'We’re sailing gently. Look at the papyrus rolls along the river!' : world === 'camp' ? 'Walk to the book or prayer mat, then tap the helping hand.' : 'Keep exploring! Follow the path, and look for little signs and sparkles.', 5);
    if (object.type === 'feed') {
      if (data.leaves < 2) return say('My big friend is hungry. Can you find two leaves? Walk into the floating green leaves!', 7);
      data.fed = true; burst(605, GROUND - 130, '#a8cf68', 25); say('You helped my friend! Being kind to animals is a beautiful thing. Tap the helping hand again for a dinosaur ride!', 8); updateHUD();
    } else if (object.type === 'ride') {
      data.riding = true; burst(player.x, GROUND - 30, '#d8e5a0', 15);
      say('Dinosaur taxi! Hold the arrows to ride, and tap Jump for a big dinosaur hop. We can still explore along the way!', 8);
    } else if (object.type === 'dismount') {
      data.riding = false; say('Back on little explorer feet! Our dinosaur friend is happy to help.', 5);
    } else if (object.type === 'brush') {
      const i = object.index; data.brushed[i]++;
      burst([875, 1210, 1510][i], GROUND - 15, '#e5c992', 13);
      if (data.brushed[i] === 3) { data.fossil++; say(data.fossil === 3 ? 'All three fossils! Let’s put them together at the little museum table.' : `A fossil piece! You found ${data.fossil} of three. What a discovery!`, 6); burst([875, 1210, 1510][i], GROUND - 50, '#fff3bc', 22); }
      else say(['A gentle brush…', 'A little more sand is coming away…'][data.brushed[i] - 1], 3, false);
      updateHUD();
    } else if (object.type === 'museum') {
      if (data.museum) say('A whole little fossil display, made by you! Fossils help us learn about creatures from long ago.', 7);
      else if (data.fossil < 3) say(`Our display needs three fossil pieces. You have ${data.fossil}. Look for the sandy mounds along the path.`, 6);
      else openPuzzle('fossil');
    } else if (object.type === 'bridge') openPuzzle('bridge');
    else if (object.type === 'boat') {
      if (!data.bridge) return say('Let’s repair the bridge first. The little bridge workshop is back along the path.', 6);
      data.boarded = true; data.onBoat = true; player.x = 1760; player.y = GROUND - 68; player.vy = 0; player.target = null;
      say('All aboard! The boat will carry us safely. See the papyrus? Ancient Egyptians made writing material from a plant.', 9); updateHUD();
    } else if (object.type === 'finish') finish();
    else if (object.type === 'learn-prayer') learn('prayer');
    else if (object.type === 'learn-quran') learn('quran');
    else if (object.type === 'map') showMap();
  }
  function finish() {
    if (world === 'valley' && (!data.fed || !data.museum)) return say(!data.fed ? 'Our big dinosaur friend still needs two leaves. Let’s help her before we go.' : 'Our fossils need a home! Let’s visit the museum table before we go.', 7);
    if (world === 'egypt' && !data.arrived) return say('A river journey is waiting! Take the little boat to the far bank.', 6);
    finishedWorld = true;
    if (!stamps.includes(world)) { stamps.push(world); save(); }
    setMode('complete');
    overlay.innerHTML = `<section class="modal-card complete-card" role="dialog" aria-modal="true" aria-labelledby="complete-title"><span class="complete-icon" aria-hidden="true">${world === 'valley' ? '🦕' : '⛵'}</span><span class="kicker">A NEW STAMP FOR YOUR ADVENTURE MAP</span><h2 id="complete-title">${world === 'valley' ? 'A dino-sized discovery!' : 'You crossed the mighty Nile!'}</h2><p>${world === 'valley' ? 'A happy dinosaur and a fossil display, all thanks to your helping hands. Alhamdulillah for a world full of wonders.' : 'You repaired a bridge and explored the river. Thank you for being a helpful, curious explorer!'}</p><div class="stat-ribbon"><span><strong>◆ ${data.amber}</strong> amber found</span><span><strong>✦</strong> ${world === 'valley' ? 'Valley explorer' : 'Nile explorer'}</span></div><div class="map-bottom"><button class="big-button" data-do="world" data-world="${world === 'valley' ? 'egypt' : 'camp'}">${world === 'valley' ? 'Nile adventure →' : 'Visit quiet camp →'}</button><button class="text-link" data-do="map">Adventure map</button></div></section>`;
    confetti(); focusOverlay(); read(world === 'valley' ? 'A dino-sized discovery! You helped our dinosaur friend and made a fossil display. Ready for a river adventure?' : 'You crossed the mighty Nile! A lovely little adventure. Our quiet camp is always open.');
  }
  const puzzleShapes = {
    tail: '<path d="M12 47C31 45 54 34 88 14L77 32 61 43 39 51 16 55Z"/><path d="m35 41 3 12m12-19 5 13m9-22 7 12" fill="none"/>',
    ribs: '<path d="M12 20h76" fill="none" stroke-width="7"/><path d="M25 21v18c0 23 15 23 15 0V22m16 0v17c0 23 15 23 15 0V22M15 14v12m70-12v12" fill="none" stroke-width="6"/>',
    head: '<path d="M18 48V24Q18 10 34 12h38q14 0 14 14v16H55L39 53Z"/><circle cx="36" cy="26" r="7" fill="#fff4d7" stroke="none"/><path d="m57 41 5 8 7-8 5 8 7-8" fill="none" stroke="#fff4d7" stroke-width="3"/>',
    triangle: '<path d="m50 8 38 53H12Z"/>',
    square: '<rect x="22" y="8" width="56" height="53" rx="4"/>',
    circle: '<circle cx="50" cy="35" r="28"/>'
  };
  const shapeSvg = type => `<svg viewBox="0 0 100 70" aria-hidden="true">${puzzleShapes[type]}</svg>`;
  let activityPuzzle = false;
  function openPuzzle(type, standalone = false) {
    puzzleType = type; selectedPiece = null; slots = {}; activityPuzzle = standalone;
    pieceOrder = (type === 'fossil' ? ['head', 'tail', 'ribs'] : ['circle', 'triangle', 'square']).sort(() => Math.random() - .5);
    setMode('puzzle'); renderPuzzle(); focusOverlay();
    read(type === 'fossil' ? 'Let’s build the fossil display! Pick a piece, then tap the outline that looks the same.' : 'Our bridge needs three shapes. Pick a shape, then tap its matching space.');
  }
  function renderPuzzle() {
    const order = puzzleType === 'fossil' ? ['tail', 'ribs', 'head'] : ['triangle', 'square', 'circle'];
    const labels = { tail: 'Tail', ribs: 'Ribs', head: 'Head', triangle: 'Triangle', square: 'Square', circle: 'Circle' };
    const done = Object.keys(slots).length === 3;
    overlay.innerHTML = `<section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="puzzle-title"><button class="close-modal" data-do="${activityPuzzle ? 'activities' : 'resume'}" aria-label="Leave puzzle">×</button><span class="kicker">${puzzleType === 'fossil' ? 'THE LITTLE FOSSIL WORKSHOP' : 'THE LITTLE BRIDGE WORKSHOP'}</span><h2 id="puzzle-title">${puzzleType === 'fossil' ? 'A puzzle from the past.' : 'Let’s fix the bridge!'}</h2><p>Pick a piece, then tap its matching outline. You can drag it too.</p><div class="puzzle-board">${order.map(type => `<button class="puzzle-slot ${slots[type] ? 'filled' : ''}" data-do="slot" data-shape="${type}" aria-label="${labels[type]} space${slots[type] ? ', complete' : ''}" aria-disabled="${!!slots[type]}">${shapeSvg(type)}<span>${slots[type] ? '✓ ' : ''}${labels[type]}</span></button>`).join('')}</div><div class="puzzle-tray">${pieceOrder.map(type => `<button class="puzzle-piece ${selectedPiece === type ? 'selected' : ''}" data-do="piece" data-shape="${type}" aria-label="Choose ${labels[type]} piece" aria-pressed="${selectedPiece === type}" ${slots[type] ? 'disabled' : ''}>${shapeSvg(type)}${labels[type]}</button>`).join('')}</div><div class="puzzle-message" id="puzzle-message" role="status">${done ? 'A perfect fit. You made it!' : selectedPiece ? `${labels[selectedPiece]} selected. Now find its matching outline.` : 'Which piece would you like to try first?'}</div><div class="map-bottom">${done ? '<button class="big-button green" data-do="puzzle-done">Look what I made! →</button>' : '<button class="text-link" data-do="puzzle-hint">Pip, give me a hint</button>'}</div><p style="font-size:10px;margin:12px auto 0">${puzzleType === 'fossil' ? 'A playful fossil display, not an exact dinosaur reconstruction.' : 'A shape game in an imaginary ancient Egypt adventure.'}</p></section>`;
  }
  function placePiece(shape) {
    if (slots[shape]) return;
    if (!selectedPiece) { $('#puzzle-message').textContent = 'Pick a piece from the tray first.'; return; }
    if (shape !== selectedPiece) { $('#puzzle-message').textContent = 'Not quite the same shape. You can try another space!'; read('Try the outline that looks the same. No hurry!'); return; }
    slots[shape] = true; selectedPiece = null; renderPuzzle();
    const remaining = overlay.querySelector('.puzzle-piece:not(:disabled)');
    (remaining || overlay.querySelector('[data-do="puzzle-done"]'))?.focus({ preventScroll: true });
    if (Object.keys(slots).length === 3) { confetti(); read(puzzleType === 'fossil' ? 'You put the fossils together! What a lovely discovery.' : 'The bridge is fixed! We can cross safely now.'); }
  }
  function puzzleDone() {
    if (puzzleType === 'fossil') { data.museum = true; if (activityPuzzle) { data.fossil = 3; data.brushed = [3, 3, 3]; } }
    else data.bridge = true;
    if (activityPuzzle) { setMode('activity-done'); overlay.innerHTML = `<section class="modal-card complete-card" role="dialog" aria-modal="true" aria-labelledby="activity-done-title"><span class="complete-icon" aria-hidden="true">${puzzleType === 'fossil' ? '🦴' : '⛵'}</span><h2 id="activity-done-title">You made it!</h2><p>${puzzleType === 'fossil' ? 'Three fossil pieces, one lovely display.' : 'Three matching shapes and a lovely little bridge.'} Want to try a different activity?</p><div class="map-bottom"><button class="big-button green" data-do="activities">More activities</button><button class="text-link" data-do="resume">Explore this world</button></div></section>`; focusOverlay(); return; }
    resume(); updateHUD();
    burst(puzzleType === 'fossil' ? 1820 : 1290, GROUND - 70, '#ffdc79', 45);
    say(puzzleType === 'fossil' ? 'Our little museum is ready! Find the explorer flag at the end of the path.' : 'You fixed it! Cross the bridge, then find our little boat by the riverbank.', 7);
  }
  function learn(topic) {
    setMode('learning');
    overlay.innerHTML = `<section class="modal-card learning-card" role="dialog" aria-modal="true" aria-label="${topic === 'prayer' ? 'Prayer learning' : 'Qur’an garden'}"><div class="learning-top"><div><strong>${topic === 'prayer' ? 'A little prayer, together.' : 'A little ayah, together.'}</strong><small>GROWN-UP GUIDED · NO SCORES OR REWARDS</small></div><button data-do="close-learning">← Back to camp</button></div><iframe src="index.html?camp=1#${topic}" title="${topic === 'prayer' ? 'Muhammadiyah prayer practice with your grown-up' : 'Al-Fatihah and the last three surahs'}"></iframe></section>`;
    overlay.querySelector('button').focus({ preventScroll: true });
  }
  function confetti() {
    if (reduced) return;
    const colors = ['#f9c757', '#fff3bd', '#a6ca7b', '#ed9769', '#82bdb7'];
    const layer = $('#celebration-particles');
    for (let i = 0; i < 45; i++) { const p = document.createElement('span'); p.className = 'confetti'; p.style.left = `${Math.random() * 100}%`; p.style.background = colors[i % colors.length]; p.style.animationDelay = `${Math.random() * .7}s`; p.style.transform = `rotate(${Math.random() * 200}deg)`; layer.append(p); p.addEventListener('animationend', () => p.remove(), { once: true }); }
  }
  function burst(x, y, color, count = 12) {
    if (reduced) return;
    for (let i = 0; i < count; i++) particles.push({ x, y, vx: (Math.random() - .5) * 240, vy: -Math.random() * 220 - 30, life: .6 + Math.random() * .5, color, r: 2 + Math.random() * 4 });
  }
  function inWater(x) { return world === 'egypt' && ((!data.bridge && x > 1195 && x < 1455) || (x > 1740 && x < 2380)); }
  function update(dt) {
    if (mode !== 'play' || $('#notes').open || $('#recitation-dialog').open || document.hidden) return;
    time += dt;
    if (speechTimer > 0) { speechTimer -= dt; if (speechTimer <= 0) $('#speech').hidden = true; }
    if (data.onBoat) {
      player.x += 180 * dt; player.y = GROUND - 62 + Math.sin(time * 2) * 3; player.vy = 0;
      companion.x += (player.x - 58 - companion.x) * Math.min(1, dt * 7); companion.y = GROUND + 2;
      if (player.x >= 2400) { data.onBoat = false; data.arrived = true; player.y = GROUND - player.h; player.safeX = 2400; say('A safe landing! You spotted papyrus along the river. The explorer flag is just ahead.', 7); updateHUD(); }
    } else {
      let direction = (keys.has('ArrowRight') || keys.has('d') || touch.has('right') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('a') || touch.has('left') ? 1 : 0);
      if (direction) player.target = null;
      else if (player.target !== null) { direction = Math.sign(player.target - player.x); if (Math.abs(player.target - player.x) < 8) { direction = 0; player.target = null; } }
      player.vx = direction * (data.riding ? 320 : 255);
      if (direction) player.face = direction;
      if (player.grounded) player.coyote = .13; else player.coyote -= dt;
      if (pendingJump && player.coyote > 0) { player.vy = data.riding ? -690 : -605; player.grounded = false; player.coyote = 0; burst(player.x + 17, player.y + player.h, '#eee2b2', 8); }
      pendingJump = false;
      const oldBottom = player.y + player.h;
      player.x = Math.max(35, Math.min(data.width - 60, player.x + player.vx * dt));
      player.vy += 1530 * dt; player.y += player.vy * dt; player.grounded = false;
      let landing = GROUND;
      for (const platform of data.platforms) {
        if (player.x + player.w > platform.x + 3 && player.x < platform.x + platform.w - 3 && oldBottom <= platform.y + 6 && player.y + player.h >= platform.y && player.vy >= 0) landing = Math.min(landing, platform.y);
      }
      if (player.y + player.h >= landing && player.vy >= 0) { player.y = landing - player.h; player.vy = 0; player.grounded = true; }
      const mid = player.x + player.w / 2;
      if (player.grounded && player.y + player.h >= GROUND && inWater(mid)) {
        burst(mid, GROUND + 15, '#bee7dd', 22); player.x = player.safeX; player.target = null;
        say(mid < 1500 ? 'A little splash! Back on the safe bank. Let’s repair the bridge at the workshop.' : 'A little splash! Let’s take the boat. Look for the sail by the riverbank.', 6);
      } else if (player.grounded && player.y + player.h === GROUND && !inWater(mid) && (world !== 'egypt' || mid < 1700 || mid > 2400)) player.safeX = player.x;
      const follow = player.x - player.face * 58;
      companion.x += (follow - companion.x) * Math.min(1, dt * 4);
      companion.y += (player.y + player.h - companion.y) * Math.min(1, dt * 7);
    }
    for (const item of data.items) {
      if (item.got) continue;
      if (Math.abs(player.x + 17 - item.x) < 42 && Math.abs(player.y + 28 - item.y) < 63) {
        item.got = true; burst(item.x, item.y, item.type === 'amber' ? '#ffd875' : '#c3df8e', 12);
        if (item.type === 'amber') data.amber++;
        else if (item.type === 'leaf') { data.leaves++; say(data.leaves === 2 ? 'Two leaves! Our big dinosaur friend is just ahead. Tap the helping hand when you’re close.' : 'One lovely leaf! Look for one more for our dinosaur friend.', 6); }
        else { data.papyrus++; if (data.papyrus === 3) say('Three papyrus rolls! The river helped people travel and share things long ago.', 6); }
        updateHUD();
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; if (p.life <= 0) particles.splice(i, 1); }
    const targetCam = Math.max(0, Math.min(data.width - W, player.x - W * .35));
    camera += (targetCam - camera) * Math.min(1, dt * (reduced ? 25 : 6));
    const nearby = nearObject();
    $('#interact').classList.toggle('nearby', !!nearby);
    $('#interact').setAttribute('aria-label', nearby ? nearby.label : 'Explore nearby object');
    $('#world-prompt').hidden = !nearby;
    if (nearby) $('#world-prompt').textContent = `✋ ${nearby.label}`;
  }

  // All artwork below is drawn locally. No image services, sprites, or external engine.
  function rr(x, y, w, h, r, fill, stroke = null, line = 2) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); } }
  function ellipse(x, y, rx, ry, fill, rotation = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rotation, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
  function line(points, color, width = 3) { ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
  function text(str, x, y, size = 15, color = '#fff8dc', align = 'center') { ctx.font = `900 ${size}px Nunito, system-ui, sans-serif`; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(str, x, y); }
  function poly(points, fill) { ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
  function diamond(x, y, size, color = '#ffcd63') { poly([[x, y - size], [x + size * .7, y], [x, y + size], [x - size * .7, y]], color); poly([[x, y - size], [x, y + size], [x - size * .7, y]], '#ffe4a0'); }
  function cloud(x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ellipse(0, 0, 50, 15, '#fffbe9cf'); ellipse(-20, -10, 22, 20, '#fffbe9cf'); ellipse(10, -20, 30, 26, '#fffbe9cf'); ellipse(36, -3, 23, 15, '#fffbe9cf'); ctx.restore(); }
  function hill(x, y, w, h, color) { ctx.beginPath(); ctx.moveTo(x - w, H); ctx.lineTo(x - w, y); ctx.quadraticCurveTo(x, y - h, x + w, y); ctx.lineTo(x + w, H); ctx.fillStyle = color; ctx.fill(); }
  function tree(x, y, s = 1, palm = false) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (palm) {
      ctx.beginPath(); ctx.moveTo(-9, 5); ctx.quadraticCurveTo(14, -75, 0, -133); ctx.lineTo(12, -135); ctx.quadraticCurveTo(30, -65, 7, 5); ctx.fillStyle = '#a7854f'; ctx.fill();
      for (let i = -2; i <= 2; i++) { ctx.save(); ctx.translate(7, -133); ctx.rotate(i * .57); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-65, -65, -90, -9); ctx.quadraticCurveTo(-47, -35, 0, 0); ctx.fillStyle = i % 2 ? '#5f9259' : '#75a15d'; ctx.fill(); ctx.restore(); }
      ellipse(1, -126, 8, 10, '#947244'); ellipse(15, -128, 7, 9, '#aa834a');
    } else {
      rr(-11, -94, 22, 100, 8, '#8d7751'); line([[-2, -51], [-33, -92]], '#8d7751', 11);
      ellipse(0, -131, 64, 69, '#78a76a'); ellipse(-43, -113, 42, 43, '#81b171'); ellipse(40, -119, 43, 50, '#6d9b63'); ellipse(-20, -158, 39, 31, '#91ba78');
      ellipse(-30, -165, 12, 5, '#b5d68d', -.5); ellipse(22, -139, 14, 5, '#9dc581', -.7);
    }
    ctx.restore();
  }
  function fern(x, y, s = 1, color = '#447d52') { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); line([[0, 0], [-3, -35], [0, -67]], color, 3); for (let i = 0; i < 4; i++) { const yy = -12 - i * 13; ellipse(-11, yy - 6, 15 - i * 2, 5, color, .5); ellipse(9, yy - 10, 15 - i * 2, 5, color, -.6); } ctx.restore(); }
  function drawDino(x, y, s = 1, color = '#73a47a', walk = 0, happy = false, face = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
    ellipse(0, 3, 71, 9, '#305a3c20');
    ctx.beginPath(); ctx.moveTo(-30, -61); ctx.quadraticCurveTo(-79, -42, -115, -83); ctx.quadraticCurveTo(-89, -17, -24, -30); ctx.fillStyle = color; ctx.fill();
    const swing = Math.sin(walk) * 7;
    rr(-33 + swing, -44, 21, 44, 9, '#5e906c'); rr(22 - swing, -43, 19, 43, 8, '#5e906c');
    ellipse(-3, -58, 57, 37, color, -.08);
    ctx.beginPath(); ctx.moveTo(22, -55); ctx.bezierCurveTo(43, -77, 25, -127, 53, -140); ctx.bezierCurveTo(74, -148, 85, -134, 76, -120); ctx.bezierCurveTo(62, -110, 74, -65, 43, -40); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    ctx.beginPath(); ctx.moveTo(44, -55); ctx.bezierCurveTo(59, -84, 45, -115, 60, -124); ctx.lineTo(69, -123); ctx.bezierCurveTo(59, -101, 74, -67, 48, -44); ctx.fillStyle = '#b1ce98'; ctx.fill();
    ellipse(69, -135, 25, 17, color); ellipse(83, -130, 15, 11, color);
    rr(-39 - swing, -35, 22, 35, 9, color); rr(18 + swing, -34, 21, 34, 9, color);
    for (const bx of [-34 - swing, 23 + swing]) { rr(bx, -5, 5, 5, 2, '#dce4ad'); rr(bx + 8, -5, 5, 5, 2, '#dce4ad'); }
    for (let i = 0; i < 3; i++) ellipse(-26 + i * 20, -70 + i % 2 * 9, 6, 8, '#b4cf94', -.5);
    const blink = Math.sin(time * .7 + x) > .997;
    if (happy) line([[64, -139], [69, -143], [74, -139]], '#294f40', 2.7);
    else if (blink) line([[66, -140], [73, -140]], '#294f40', 2.7);
    else { ellipse(70, -140, 4.5, 5.5, '#fff9e6'); ellipse(72, -139, 2.5, 3.8, '#294f40'); ellipse(73, -141, 1, 1.3, '#fff9e6'); }
    ellipse(88, -134, 1.3, 1.3, '#47745a');
    ctx.beginPath(); ctx.arc(82, -130, 5, .2, Math.PI * .9); ctx.strokeStyle = '#3d6a51'; ctx.lineWidth = 2; ctx.stroke();
    ellipse(69, -129, 4, 2, '#c5ae87');
    ctx.restore();
  }
  function drawExplorer(x, y, moving = false, facing = 1) {
    ctx.save(); ctx.translate(x + 17, y + 64); ctx.scale(facing, 1);
    const swing = moving ? Math.sin(time * 13) * 9 : Math.sin(time * 2) * .8;
    const jacket = { gold: '#edb154', blue: '#66a5bc', red: '#d38770' }[outfit];
    ellipse(0, 2, 25, 6, '#2e503832');
    rr(-20, -48, 15, 29, 6, '#6a8a59', '#536e48', 1.5); rr(-21, -44, 9, 14, 3, '#89a36c');
    line([[-8, -24], [-9 + swing * .6, -7]], '#685c45', 8); line([[7, -24], [8 - swing * .6, -7]], '#7a6c4c', 8);
    rr(-16 + swing * .6, -9, 17, 9, 4, '#754c32'); rr(2 - swing * .6, -9, 17, 9, 4, '#754c32');
    rr(-15, -47, 30, 29, 9, jacket); line([[0, -42], [0, -24]], '#bf843b', 1.7); ellipse(5, -33, 1.4, 1.4, '#fff0bf');
    line([[-13, -40], [-20 - swing * .6, -26]], jacket, 9); ellipse(-20 - swing * .6, -23, 4.5, 5, '#dfaa7b');
    line([[12, -40], [19 + swing * .5, -26]], jacket, 9); ellipse(19 + swing * .5, -23, 4.5, 5, '#edbf91');
    rr(-4, -56, 10, 12, 3, '#dfaa7b'); ellipse(0, -65, 18, 19, '#edbc8c'); ellipse(14, -62, 5, 7, '#e7ae7d');
    ctx.beginPath(); ctx.arc(0, -69, 17, Math.PI, 2 * Math.PI); ctx.fillStyle = '#614d35'; ctx.fill();
    ellipse(7, -65, 2, 2.7, '#453e2f'); ellipse(13, -58, 4, 2, '#dd9874');
    ctx.beginPath(); ctx.arc(8, -57, 4, .05, 1.6); ctx.strokeStyle = '#a46a48'; ctx.lineWidth = 1.5; ctx.stroke();
    rr(-18, -87, 36, 17, 8, '#f4d39b'); rr(-19, -74, 38, 7, 2, '#8f9b65'); ellipse(0, -71, 28, 5, '#e8c48b'); ellipse(21, -71, 9, 3, '#f8dfaa');
    ctx.restore();
  }
  function sign(x, y, label, arrow = true) { rr(x - 5, y - 60, 10, 65, 4, '#947850'); rr(x - 47, y - 82, 95, 37, 7, '#e8cb8d', '#c9a969', 2); text(label, x, y - 59, 12, '#6b623d'); if (arrow) { line([[x - 16, y - 68], [x + 17, y - 68]], '#6b623d', 2); } }
  function sparkle(x, y, color = '#fff3b4', size = 8) { poly([[x, y - size], [x + size * .25, y - size * .25], [x + size, y], [x + size * .25, y + size * .25], [x, y + size], [x - size * .25, y + size * .25], [x - size, y], [x - size * .25, y - size * .25]], color); }
  function leaf(x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.rotate(-.45); ctx.scale(s, s); ellipse(0, 0, 12, 20, '#a8ce6d'); ellipse(3, -3, 7, 15, '#bddd83'); line([[0, 15], [0, -13]], '#6f9d52', 2); ctx.restore(); }
  function background() {
    const camp = world === 'camp', egypt = world === 'egypt';
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, camp ? '#435c83' : egypt ? '#a8d7d6' : '#b4dccd'); grad.addColorStop(.65, camp ? '#b3a5ac' : egypt ? '#f9e5b4' : '#e9eac0'); grad.addColorStop(1, camp ? '#657c70' : '#c5d79c');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    const sunX = W * .77 - camera * .025;
    ellipse(sunX, 123, camp ? 32 : 48, camp ? 32 : 48, camp ? '#fff0c1' : '#ffedb0');
    if (camp) { ellipse(sunX + 14, 111, 29, 29, '#526486'); for (let i = 0; i < 27; i++) { const x = (i * 137.3) % W, y = 30 + (i * 79.2) % 220; ellipse(x, y, i % 3 ? 1.3 : 2, i % 3 ? 1.3 : 2, '#fff1c2'); } }
    else for (let i = -1; i < 5; i++) cloud(((i * 330 + 120 - camera * .1 + (reduced ? 0 : time * 2)) % (W + 400)) - 100, 75 + ((i + 2) % 3) * 47, .65 + (i % 2) * .3);
    if (egypt) {
      for (let i = -1; i < 4; i++) { const x = i * 690 + 280 - camera * .18; poly([[x - 150, 370], [x, 160], [x + 150, 370]], '#e6c180'); poly([[x, 160], [x + 35, 370], [x + 150, 370]], '#ceaa6e'); for (let j = 0; j < 5; j++) line([[x - 30 - j * 20, 210 + j * 32], [x + 8 + j * 6, 210 + j * 32]], '#d6b377', 1); }
      hill(W * .4 - camera * .1, 415, W, 73, '#ead5a0'); hill(W * .8 - camera * .13, 455, W * .7, 88, '#e3c58e');
    } else {
      for (let i = -1; i < 5; i++) hill(i * 520 + 150 - camera * .12, 365 + i % 2 * 30, 410, 180, camp ? '#718b88' : '#a7c89d');
      for (let i = -1; i < 5; i++) hill(i * 430 + 200 - camera * .22, 440 + i % 2 * 25, 330, 150, camp ? '#597b77' : '#87b48b');
      for (let i = -1; i < 8; i++) { const x = i * 290 + 70 - camera * .34; tree(x, 510, .8 + (i % 2) * .3); }
    }
    ctx.fillStyle = camp ? '#738b76' : egypt ? '#d1d6a2' : '#a2c087'; ctx.fillRect(0, 486, W, 80);
  }
  function groundSegment(x, end) {
    if (end < camera - 50 || x > camera + W + 50) return;
    const camp = world === 'camp', egypt = world === 'egypt';
    rr(x, GROUND, end - x, 260, 10, camp ? '#7c9278' : egypt ? '#d9ba81' : '#9cb674');
    ctx.fillStyle = camp ? '#99aa84' : egypt ? '#eed09b' : '#b5cd83'; ctx.fillRect(x, GROUND, end - x, 18);
    line([[x, GROUND + 20], [end, GROUND + 20]], camp ? '#617e68' : egypt ? '#cba76c' : '#8da66a', 3);
    ctx.beginPath(); ctx.moveTo(x, GROUND + 65); ctx.bezierCurveTo(x + (end - x) * .3, GROUND + 35, x + (end - x) * .6, GROUND + 100, end, GROUND + 66); ctx.lineTo(end, GROUND + 125); ctx.bezierCurveTo(x + (end - x) * .6, GROUND + 147, x + (end - x) * .3, GROUND + 90, x, GROUND + 123); ctx.closePath(); ctx.fillStyle = camp ? '#9da787' : egypt ? '#ecd19a' : '#c8cf95'; ctx.fill();
    for (let i = Math.floor(Math.max(x, camera) / 57); i * 57 < Math.min(end, camera + W); i++) {
      const sx = i * 57 + 9; ellipse(sx, GROUND + 154 + Math.sin(i * 7) * 44, 5 + i % 5, 2.5, egypt ? '#b7956460' : '#658f5b45');
      if (i % 3 === 0) { line([[sx, GROUND + 7], [sx - 4, GROUND - 1]], egypt ? '#a6ac65' : '#6c9957', 2); line([[sx, GROUND + 7], [sx + 4, GROUND - 3]], egypt ? '#a6ac65' : '#6c9957', 2); }
    }
  }
  function water(x, end) {
    rr(x, GROUND + 13, end - x, 260, 0, '#77c3be');
    ctx.fillStyle = '#a4d8cb'; ctx.fillRect(x, GROUND + 12, end - x, 15);
    for (let i = 0; i < 18; i++) { const xx = x + 20 + ((i * 71 + (reduced ? 0 : time * 15)) % Math.max(1, end - x - 40)); const yy = GROUND + 37 + (i % 4) * 38; line([[xx, yy], [xx + 25, yy]], '#b8e3d180', 3); }
    for (let i = 0; i < 4; i++) { const xx = x + 30 + ((i * 131 + time * 9) % Math.max(1, end - x - 60)); const yy = GROUND + 75 + i % 2 * 33; ellipse(xx, yy, 8, 3, '#559c9c66'); poly([[xx - 7, yy], [xx - 13, yy - 5], [xx - 13, yy + 5]], '#559c9c66'); }
  }
  function bridge() {
    water(1190, 1460);
    for (const x of [1180, 1470]) { rr(x - 5, GROUND - 42, 10, 72, 4, '#9d7d51'); ellipse(x, GROUND - 43, 8, 4, '#d3b477'); }
    if (data.bridge) { for (let i = 0; i < 14; i++) rr(1180 + i * 21, GROUND - 2, 20, 12, 2, '#c6a16a', '#a48656', 1); line([[1180, GROUND - 34], [1250, GROUND - 23], [1390, GROUND - 23], [1470, GROUND - 34]], '#e5c78a', 5); }
    else { for (let i = 0; i < 3; i++) rr(1170 + i * 21, GROUND + i * 4, 20, 12, 2, '#b79a65'); line([[1180, GROUND - 34], [1220, GROUND - 20]], '#d9b876', 4); line([[1430, GROUND - 20], [1470, GROUND - 34]], '#d9b876', 4); }
  }
  function flag(x, label = 'EXPLORER') { rr(x - 4, GROUND - 160, 8, 166, 3, '#92734c'); ellipse(x, GROUND - 160, 7, 7, '#ebce87'); ctx.beginPath(); ctx.moveTo(x, GROUND - 153); ctx.quadraticCurveTo(x + 44, GROUND - 169 + Math.sin(time * 2) * 3, x + 88, GROUND - 145); ctx.lineTo(x + 72, GROUND - 123); ctx.lineTo(x + 88, GROUND - 102); ctx.quadraticCurveTo(x + 43, GROUND - 121, x, GROUND - 104); ctx.fillStyle = '#e4a853'; ctx.fill(); text('✦', x + 37, GROUND - 126, 22, '#fff4cc'); sign(x + 11, GROUND + 12, label, false); }
  function mound(x, index) {
    const amount = data.brushed[index];
    ellipse(x, GROUND + 3, 54, 9, '#789a5a33');
    if (amount < 3) {
      ctx.beginPath(); ctx.moveTo(x - 47, GROUND); ctx.quadraticCurveTo(x - 30, GROUND - 57 + amount * 10, x + 5, GROUND - 43 + amount * 8); ctx.quadraticCurveTo(x + 40, GROUND - 30, x + 47, GROUND); ctx.fillStyle = '#d5b17b'; ctx.fill();
      for (let i = 0; i < 5; i++) ellipse(x - 24 + i * 11, GROUND - 8 - (i % 2) * 8, 2, 1.5, '#b79462');
      if (amount) { line([[x - 15, GROUND - 10], [x + 12, GROUND - 20]], '#fff0c3', 7); ellipse(x - 15, GROUND - 10, 6, 6, '#fff0c3'); ellipse(x + 12, GROUND - 20, 6, 6, '#fff0c3'); }
      sparkle(x + 13, GROUND - 63 + Math.sin(time * 3 + index) * 5, '#fff0b2', 8);
      rr(x + 44, GROUND - 57, 4, 60, 1, '#947b51'); poly([[x + 48, GROUND - 56], [x + 76, GROUND - 48], [x + 48, GROUND - 40]], '#f5d78f');
    } else { ellipse(x, GROUND - 2, 36, 8, '#8eab70'); text('✓', x, GROUND - 9, 23, '#ffedb3'); }
  }
  function museum(x) {
    rr(x - 95, GROUND - 69, 190, 14, 5, '#be965c'); rr(x - 79, GROUND - 55, 12, 57, 3, '#967b51'); rr(x + 67, GROUND - 55, 12, 57, 3, '#967b51'); rr(x - 91, GROUND - 133, 182, 62, 7, '#e4d9b5', '#b9b58d', 2);
    if (data.museum) {
      line([[x - 65, GROUND - 94], [x - 25, GROUND - 108], [x + 28, GROUND - 108], [x + 50, GROUND - 123]], '#8b8262', 5);
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x - 20 + i * 14, GROUND - 99, 6, 13, -.2, 0, Math.PI * 1.7); ctx.strokeStyle = '#8b8262'; ctx.lineWidth = 3; ctx.stroke(); }
      rr(x + 43, GROUND - 134, 25, 17, 5, '#8b8262'); ellipse(x + 51, GROUND - 129, 3, 3, '#e4d9b5');
      line([[x - 20, GROUND - 96], [x - 24, GROUND - 81]], '#8b8262', 4); line([[x + 24, GROUND - 96], [x + 30, GROUND - 81]], '#8b8262', 4);
    } else text('?', x, GROUND - 90, 33, '#aaa581');
    rr(x - 85, GROUND - 208, 170, 37, 7, '#6f945b'); text('LITTLE FOSSIL MUSEUM', x, GROUND - 184, 11, '#fff6d6');
    line([[x - 90, GROUND - 171], [x - 90, GROUND - 66]], '#9e8454', 5); line([[x + 90, GROUND - 171], [x + 90, GROUND - 66]], '#9e8454', 5);
    for (let i = 0; i < 7; i++) poly([[x - 80 + i * 25, GROUND - 163], [x - 70 + i * 25, GROUND - 147], [x - 60 + i * 25, GROUND - 163]], ['#e4b166', '#a6c17b', '#e4ca88'][i % 3]);
  }
  function boat(x, y, active = false) {
    ctx.save(); ctx.translate(x, y + Math.sin(time * 2) * 2);
    ctx.beginPath(); ctx.moveTo(-65, 0); ctx.quadraticCurveTo(-45, 39, 44, 29); ctx.lineTo(72, -3); ctx.quadraticCurveTo(7, 12, -65, 0); ctx.fillStyle = '#b37e49'; ctx.fill();
    line([[-52, 6], [55, 6]], '#efd19a', 5); line([[8, -1], [8, -107]], '#ad8551', 5);
    poly([[13, -101], [14, -20], [71, -16]], '#fff0c7'); poly([[3, -98], [-39, -25], [3, -21]], '#e8c387');
    line([[13, -101], [71, -16]], '#d6b980', 1.5);
    if (!active) { rr(-75, 15, 22, 11, 3, '#a28654'); line([[-73, 16], [-80, -3]], '#b19461', 3); }
    ctx.restore();
  }
  function campStation(x, type) {
    if (type === 'prayer') {
      poly([[x - 90, GROUND + 30], [x - 50, GROUND - 20], [x + 65, GROUND - 16], [x + 100, GROUND + 35]], '#708e83');
      line([[x - 68, GROUND + 21], [x - 42, GROUND - 8], [x + 53, GROUND - 5], [x + 74, GROUND + 23], [x - 68, GROUND + 21]], '#d5d7af', 2);
      ctx.beginPath(); ctx.moveTo(x - 18, GROUND + 15); ctx.lineTo(x - 18, GROUND); ctx.quadraticCurveTo(x, GROUND - 24, x + 18, GROUND); ctx.lineTo(x + 18, GROUND + 15); ctx.strokeStyle = '#c5d0a5'; ctx.lineWidth = 2; ctx.stroke();
      sign(x + 85, GROUND, 'PRAYER', false);
    } else {
      tree(x - 45, GROUND, 1.25);
      line([[x - 31, GROUND - 30], [x + 3, GROUND - 58], [x + 38, GROUND - 30]], '#9b805d', 8);
      poly([[x - 41, GROUND - 57], [x - 4, GROUND - 49], [x + 35, GROUND - 60], [x + 27, GROUND - 83], [x - 5, GROUND - 74], [x - 35, GROUND - 81]], '#fff0c3');
      line([[x - 4, GROUND - 73], [x - 4, GROUND - 50]], '#c6b98f', 2); sign(x + 80, GROUND, 'QUR’AN', false);
    }
    rr(x - 80, GROUND - 205, 160, 34, 12, '#f8e9bd'); text(type === 'prayer' ? 'LEARN TOGETHER' : 'LISTEN & PRACTISE', x, GROUND - 183, 11, '#587359');
  }
  function foregroundObjects() {
    if (world === 'valley') {
      tree(55, GROUND + 2, 1.1); fern(210, GROUND + 8, .8); fern(690, GROUND + 8, .8);
      if (!data.riding) drawDino(605, GROUND - (data.fed && !reduced ? Math.abs(Math.sin(time * 3)) * 9 : 0), 1.55, '#73a47b', data.fed ? time * 5 : 0, data.fed);
      if (!data.fed) { rr(528, GROUND - 272, 145, 36, 15, '#fff3ce'); text(data.leaves >= 2 ? 'Two leaves? For me?' : 'A little snack?', 600, GROUND - 248, 12, '#72815c'); }
      [875, 1210, 1510].forEach(mound); museum(1820); flag(2320, 'NEXT STOP');
      tree(2150, GROUND, 1.25); fern(1650, GROUND + 8, 1.1); fern(2260, GROUND + 10, .65); sign(122, GROUND, 'DINO VALLEY', false);
    } else if (world === 'egypt') {
      tree(80, GROUND, 1.1, true); tree(660, GROUND, 1.05, true); tree(1530, GROUND, .85, true); tree(2550, GROUND, 1.2, true);
      sign(170, GROUND, 'THE NILE', false); sign(1070, GROUND, data.bridge ? 'NICE WORK!' : 'SHAPE SHOP', false);
      if (!data.bridge) { rr(1035, GROUND - 130, 70, 43, 7, '#ecd19a'); text('△ □ ○', 1070, GROUND - 103, 20, '#a28654'); sparkle(1070, GROUND - 157, '#fff2bd'); }
      bridge();
      for (const x of [1680, 1709, 1738]) rr(x, GROUND - 3, 30, 13, 2, '#b89a65');
      for (const x of [1690, 1745]) rr(x, GROUND - 15, 8, 39, 3, '#987d4f');
      if (!data.boarded || !data.arrived) boat(data.onBoat ? player.x + 5 : 1770, GROUND + 2, data.onBoat);
      sign(1660, GROUND - 5, 'BOAT RIDE', false); flag(2670, 'WELL DONE');
      for (const x of [1170, 1480, 1700, 2390]) { fern(x, GROUND + 15, .6, '#8d9d5c'); }
    } else {
      poly([[115, GROUND], [225, GROUND - 155], [343, GROUND]], '#d6b37e'); poly([[225, GROUND - 155], [246, GROUND], [343, GROUND]], '#bc9368'); poly([[185, GROUND], [226, GROUND - 105], [270, GROUND]], '#766d61');
      rr(210, GROUND - 48, 28, 45, 10, '#e9cc91');
      campStation(600, 'quran'); campStation(1090, 'prayer'); sign(1570, GROUND, 'ADVENTURES', false); tree(1410, GROUND, 1.2); tree(1770, GROUND, 1.15);
      for (const x of [380, 800, 1310]) { line([[x, GROUND], [x, GROUND - 90]], '#856f52', 5); rr(x - 12, GROUND - 105, 24, 30, 5, '#b19860'); rr(x - 8, GROUND - 101, 16, 23, 3, '#f9dc9d'); ellipse(x, GROUND - 90, 26, 30, '#ffe3a112'); }
    }
  }
  function draw() {
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.clearRect(0, 0, W, H); background();
    if (mode === 'title') {
      groundSegment(0, W + 20);
      const smallScreen = W < 700;
      const dx = smallScreen ? W * .73 : W * .78;
      const dy = smallScreen ? 655 : 575;
      if (!smallScreen) tree(W * .93, GROUND + 15, 1.6);
      drawDino(dx, dy, smallScreen ? 1.23 : 2.5, '#67996d', 0, true, -1);
      drawExplorer(dx - (smallScreen ? 120 : 220), dy - 64, false, 1);
      fern(smallScreen ? 45 : W * .54, dy + 22, smallScreen ? 1 : 1.4);
      sparkle(dx + 27, dy - 170, '#fff4c4', 10); sparkle(dx - 125, dy - 260, '#fff4c4', 6);
      return;
    }
    ctx.save(); ctx.translate(-camera, 0);
    if (world === 'egypt') { groundSegment(0, 1190); groundSegment(1460, 1745); groundSegment(2380, data.width); water(1745, 2380); }
    else groundSegment(0, data.width);
    for (const platform of data.platforms) {
      rr(platform.x + 9, platform.y + 8, platform.w - 18, 28, 10, world === 'egypt' ? '#bc9f70' : '#8f9d68');
      rr(platform.x, platform.y, platform.w, 16, 8, world === 'egypt' ? '#edd49c' : '#b6cd83');
      for (let i = 0; i < 4; i++) ellipse(platform.x + 20 + i * 33, platform.y + 22, 5, 2, world === 'egypt' ? '#e3c28b' : '#abbc7a');
    }
    foregroundObjects();
    for (const item of data.items) if (!item.got && item.x > camera - 50 && item.x < camera + W + 50) {
      const yy = item.y + (reduced ? 0 : Math.sin(time * 3 + item.x) * 5);
      if (item.type === 'leaf') { ellipse(item.x, yy, 23, 23, '#fff5bf3a'); leaf(item.x, yy, 1.1); }
      else if (item.type === 'amber') { ellipse(item.x, yy, 19, 19, '#fff2bc30'); diamond(item.x, yy, 12); }
      else { ctx.save(); ctx.translate(item.x, yy); ctx.rotate(-.2); rr(-15, -11, 30, 22, 3, '#fff0c6', '#d4b37b', 2); rr(-20, -14, 9, 28, 4, '#efcf96'); rr(11, -14, 9, 28, 4, '#efcf96'); line([[-5, -4], [5, -4]], '#c5a675', 1.5); line([[-5, 2], [4, 2]], '#c5a675', 1.5); ctx.restore(); }
    }
    drawDino(companion.x, companion.y, .38, '#7ba6a0', Math.abs(player.vx) > 0 ? time * 12 : 0, false, player.face);
    if (data.riding) drawDino(player.x + 17, player.y + 64, .95, '#73a47b', Math.abs(player.vx) > 0 ? time * 10 : 0, true, player.face);
    drawExplorer(player.x, player.y - (data.riding ? 80 : 0), Math.abs(player.vx) > 0 && player.grounded && !data.onBoat && !data.riding, player.face);
    if (data.onBoat) { // Front rim keeps feet tucked inside the boat.
      ctx.beginPath(); ctx.moveTo(player.x - 60, GROUND + 5); ctx.quadraticCurveTo(player.x, GROUND + 47, player.x + 77, GROUND + 1); ctx.lineTo(player.x + 55, GROUND + 28); ctx.lineTo(player.x - 40, GROUND + 28); ctx.closePath(); ctx.fillStyle = '#b37e49'; ctx.fill();
    }
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life * 2); ellipse(p.x, p.y, p.r, p.r, p.color); } ctx.globalAlpha = 1;
    ctx.restore();
    // Foreground sprigs lend depth without covering the path or controls.
    for (let i = -1; i < 6; i++) { const x = i * 370 - camera * 1.18; if (x > -80 && x < W + 80) fern(x, H + 23, 1.6, world === 'egypt' ? '#9caa6c' : world === 'camp' ? '#456d64' : '#639259'); }
  }
  function frame(now) {
    const dt = Math.min(.034, (now - (last || now)) / 1000); last = now;
    if (!document.hidden && !$('#notes').open) { if (mode === 'title' && !reduced) time += dt; update(dt); draw(); }
    requestAnimationFrame(frame);
  }

  function bindHold(id, direction) {
    const button = $(id);
    button.addEventListener('pointerdown', e => { if (mode !== 'play') return; e.preventDefault(); button.setPointerCapture(e.pointerId); pointers.set(e.pointerId, direction); touch.add(direction); button.classList.add('pressed'); player.target = null; });
    const release = e => { const dir = pointers.get(e.pointerId); pointers.delete(e.pointerId); if (![...pointers.values()].includes(dir)) touch.delete(dir); button.classList.remove('pressed'); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
    button.addEventListener('click', e => { if (e.detail === 0 && mode === 'play') { player.target = player.x + (direction === 'right' ? 1 : -1) * 120; } });
  }
  bindHold('#move-left', 'left'); bindHold('#move-right', 'right');
  $('#jump').addEventListener('pointerdown', e => { if (mode === 'play') { e.preventDefault(); pendingJump = true; } });
  $('#jump').addEventListener('click', e => { if (e.detail === 0 && mode === 'play') pendingJump = true; });
  $('#interact').addEventListener('click', interact);
  canvas.addEventListener('pointerdown', e => {
    if (mode !== 'play') return;
    e.preventDefault(); canvas.focus({ preventScroll: true });
    const rect = canvas.getBoundingClientRect(), x = (e.clientX - rect.left) / scale + camera;
    if (Math.abs(x - player.x) < 70) pendingJump = true;
    else player.target = Math.max(35, Math.min(data.width - 60, x));
  });
  window.addEventListener('keydown', e => {
    const input = e.target.closest('button, a, input, select, textarea, iframe, summary');
    if (e.key === 'Escape') {
      if ($('#notes').open || $('#recitation-dialog').open) return;
      if (mode === 'play') { e.preventDefault(); pause(); }
      else if (['pause', 'map', 'puzzle', 'activities', 'activity-done'].includes(mode)) { e.preventDefault(); resume(); }
      else if (mode === 'learning') { e.preventDefault(); start('camp'); }
      return;
    }
    if (mode !== 'play' || $('#notes').open || $('#recitation-dialog').open || input) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'w', 'a', 'd', 'e', 'Enter'].includes(key)) e.preventDefault();
    if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(key)) keys.add(key);
    if ([' ', 'ArrowUp', 'w'].includes(key) && !e.repeat) pendingJump = true;
    if (['e', 'Enter'].includes(key) && !e.repeat) interact();
  });
  window.addEventListener('keyup', e => { keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); });
  window.addEventListener('blur', () => { clearInput(); if (mode === 'play' && !$('#notes').open) pause(); });
  document.addEventListener('visibilitychange', () => { clearInput(); stopAllAudio(); if (document.hidden && mode === 'play') pause(); });
  window.addEventListener('pagehide', () => { clearInput(); stopAllAudio(); });
  $('#map-button').addEventListener('click', showMap); $('#pause-button').addEventListener('click', pause);
  $('#voice-button').addEventListener('click', () => { voice = !voice; save(); stopVoice(); updateHUD(); if (voice) read(message || 'English guidance is on.'); });
  $('#repeat-instruction').addEventListener('click', () => { if (voice) read(message); else say('Voice is off. You can turn it on with the sound button at the top.', 5, false); });
  function notes() { pausedBeforeNotes = mode === 'play'; window.Recitation?.hold('notes', true); clearInput(); stopAllAudio(); if (pausedBeforeNotes) pause(); $('#save-note').textContent = saveAvailable ? '' : 'Browser storage is unavailable; settings last for this visit only.'; $('#notes').showModal(); }
  $('#grownups').addEventListener('click', notes); $('#close-notes').addEventListener('click', () => $('#notes').close());
  $('#notes').addEventListener('close', () => { if (pausedBeforeNotes) { pausedBeforeNotes = false; resume(); } window.Recitation?.hold('notes', false); });
  window.addEventListener('recitation-panel-open', () => { clearInput(); stopVoice(); });
  $('#reset-game').addEventListener('click', () => { if (!confirm('Reset the valley and Nile adventure stamps on this browser?')) return; stamps = []; save(); $('#reset-message').textContent = 'Adventure stamps reset. Every place is still open.'; });
  $('#fullscreen-button').addEventListener('click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await shell.requestFullscreen(); } catch { say('Full screen is not available here. You can keep playing in this window.', 5, false); } });
  overlay.addEventListener('click', e => {
    const button = e.target.closest('[data-do]'); if (!button || button.disabled || performance.now() < clickSuppressedUntil) return;
    const action = button.dataset.do;
    if (action === 'start') start('valley');
    else if (action === 'recitation') window.Recitation?.open();
    else if (action === 'world') start(button.dataset.world);
    else if (action === 'map') showMap();
    else if (action === 'title') showTitle();
    else if (action === 'resume') resume();
    else if (action === 'notes') notes();
    else if (action === 'outfit') { outfit = button.dataset.color; save(); const color = outfit; showMap(); overlay.querySelector(`[data-color="${color}"]`).focus(); }
    else if (action === 'piece') { selectedPiece = button.dataset.shape; renderPuzzle(); overlay.querySelector(`.puzzle-piece[data-shape="${selectedPiece}"]`)?.focus({ preventScroll: true }); }
    else if (action === 'slot') placePiece(button.dataset.shape);
    else if (action === 'puzzle-hint') { if (!selectedPiece) { const next = pieceOrder.find(type => !slots[type]); selectedPiece = next; renderPuzzle(); } const target = overlay.querySelector(`.puzzle-slot[data-shape="${selectedPiece}"]`); target?.classList.add('drag-over'); $('#puzzle-message').textContent = 'Try the highlighted outline. It looks just like your piece!'; read('Look for the highlighted space. You can do it!'); }
    else if (action === 'puzzle-done') puzzleDone();
    else if (action === 'activities') activities();
    else if (action === 'activity-fossil') start('valley', true);
    else if (action === 'activity-bridge') start('egypt', true);
    else if (action === 'learn-prayer') learn('prayer');
    else if (action === 'learn-quran') learn('quran');
    else if (action === 'close-learning') { if (world === 'camp') resume(); else start('camp'); }
  });
  // Pointer capture gives native-feeling drag-and-drop on both tablets and computers.
  overlay.addEventListener('pointerdown', e => {
    const piece = e.target.closest('.puzzle-piece:not(:disabled)');
    if (!piece) return;
    drag = { id: e.pointerId, shape: piece.dataset.shape, x: e.clientX, y: e.clientY, moved: false, ghost: null, source: piece };
    piece.setPointerCapture(e.pointerId);
  });
  overlay.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) { drag.moved = true; drag.ghost = document.createElement('div'); drag.ghost.className = 'piece-ghost'; drag.ghost.innerHTML = shapeSvg(drag.shape); shell.append(drag.ghost); }
    if (!drag.moved) return;
    e.preventDefault(); drag.ghost.style.left = `${e.clientX}px`; drag.ghost.style.top = `${e.clientY}px`;
    overlay.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    document.elementFromPoint(e.clientX, e.clientY)?.closest('.puzzle-slot')?.classList.add('drag-over');
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const current = drag; drag = null; current.ghost?.remove(); overlay.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    if (!current.moved || e.type === 'pointercancel') return;
    clickSuppressedUntil = performance.now() + 350;
    const slot = document.elementFromPoint(e.clientX, e.clientY)?.closest('.puzzle-slot');
    if (slot) { selectedPiece = current.shape; placePiece(slot.dataset.shape); }
  }
  overlay.addEventListener('pointerup', endDrag); overlay.addEventListener('pointercancel', endDrag);
  // Modal keyboard focus stays in the current card, but never intercepts embedded learning.
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !overlay.children.length || mode === 'title' || $('#notes').open || $('#recitation-dialog').open) return;
    const elements = [...overlay.querySelectorAll('button:not(:disabled),a[href],iframe')].filter(el => el.offsetParent !== null);
    if (!elements.length) return;
    const first = elements[0], end = elements[elements.length - 1];
    if (e.shiftKey && (document.activeElement === first || !elements.includes(document.activeElement))) { e.preventDefault(); end.focus(); }
    else if (!e.shiftKey && (document.activeElement === end || !elements.includes(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  showTitle(); resize(); requestAnimationFrame(frame);
})();
