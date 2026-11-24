/* Pip’s brain games: optional, gentle practice. No timers, lives, penalties or accounts. */
(() => {
  'use strict';
  const key = 'little-explorer-brain-games-v1';
  const GAMES = [
    { id: 'count', icon: '⭐', title: 'Count the stars', rounds: 5 },
    { id: 'pattern', icon: '🔴', title: 'What comes next?', rounds: 5 },
    { id: 'memory', icon: '🧠', title: 'Pip’s colour memory', rounds: 3 },
    { id: 'sounds', icon: '🔤', title: 'Starting sounds', rounds: 5 },
    { id: 'add', icon: '➕', title: 'Add the pictures', rounds: 5 }
  ];
  const COLOURS = [['red', '🔴', '#d9826b'], ['yellow', '🟡', '#edc75f'], ['green', '🟢', '#8cc17e'], ['blue', '🔵', '#7cb6c3']];
  const PATTERN_ICONS = ['🔴', '🔵', '🟢', '🟡', '⭐', '🌙'];
  const WORDS = [
    { word: 'apple', icon: '🍎' }, { word: 'ball', icon: '⚽' }, { word: 'cat', icon: '🐱' }, { word: 'dog', icon: '🐶' },
    { word: 'fish', icon: '🐟' }, { word: 'sun', icon: '🌞' }, { word: 'bee', icon: '🐝' }, { word: 'car', icon: '🚗' },
    { word: 'frog', icon: '🐸' }, { word: 'house', icon: '🏠' }, { word: 'moon', icon: '🌙' }, { word: 'banana', icon: '🍌' },
    { word: 'tree', icon: '🌳' }, { word: 'hat', icon: '🎩' }
  ];

  let saved = {};
  try { const raw = JSON.parse(localStorage.getItem(key) || '{}'); if (raw && typeof raw === 'object') saved = raw; } catch { saved = {}; }
  const clamp = (n, max) => Number.isInteger(n) ? Math.max(0, Math.min(max, n)) : 0;
  const state = { stars: clamp(saved.stars, 99999), played: {} };
  GAMES.forEach(g => { state.played[g.id] = clamp(saved.played?.[g.id], 9999); });
  function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* storage is optional */ } }

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  // Difficulty rises with each solved puzzle in that game: levels 1 to 3.
  const level = id => Math.min(3, 1 + Math.floor(state.played[id] / 5));

  let ctx = null, game = null, session = 0, busy = false;

  function frame({ kicker, title, body, footer = '' }) {
    ctx.overlay.innerHTML = `<section class="card brain-card" role="dialog" aria-modal="true" aria-labelledby="brain-title"><button class="close" data-brain="menu" aria-label="Back to brain games">×</button><small>${kicker}</small><h2 id="brain-title">${title}</h2>${body}${footer}</section>`;
    const h = ctx.overlay.querySelector('h2'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }
  function setFeedback(text) { const el = document.getElementById('brain-feedback'); if (el) el.textContent = text; }
  function say(text) { ctx.speak(text); }

  // Each builder returns one round: a prompt, a visual, and choices with a single correct answer.
  function makeRound(id, lv) {
    if (id === 'count') {
      const [lo, hi] = [[1, 4], [3, 6], [5, 9]][lv - 1], n = lo + Math.floor(Math.random() * (hi - lo + 1));
      const others = shuffle([n - 2, n - 1, n + 1, n + 2].filter(v => v >= 1 && v <= 10)).slice(0, 2);
      return {
        kind: 'choice', prompt: 'How many stars?', say: 'How many stars? Touch each one as you count.',
        visual: `<div class="brain-stars" aria-hidden="true">${'⭐'.repeat(n)}</div>`,
        options: shuffle([{ label: String(n), ok: true }, ...others.map(v => ({ label: String(v), ok: false }))]),
        yes: `Yes! ${n} stars. Well counted!`, no: 'Almost! Count them one at a time, then try again.'
      };
    }
    if (id === 'pattern') {
      const unitLen = lv === 1 ? 2 : 3, unit = shuffle([...PATTERN_ICONS]).slice(0, unitLen);
      const seq = Array.from({ length: 7 }, (_, i) => unit[i % unitLen]), answer = seq[6];
      const wrong = shuffle(PATTERN_ICONS.filter(x => x !== answer)).slice(0, 2);
      return {
        kind: 'choice', prompt: 'What comes next?', say: 'What comes next in the pattern? Look for the part that repeats.',
        visual: `<div class="brain-row" aria-hidden="true">${seq.slice(0, 6).map(x => `<span>${x}</span>`).join('')}<span class="brain-blank">❓</span></div>`,
        options: shuffle([{ label: answer, ok: true }, ...wrong.map(x => ({ label: x, ok: false }))]),
        yes: 'Yes! The pattern keeps going.', no: 'Almost! Look for the part that repeats, then try again.'
      };
    }
    if (id === 'sounds') {
      const target = pick(WORDS), letter = target.word[0], count = Math.min(4, lv + 1);
      const distractors = shuffle(WORDS.filter(w => w.word[0] !== letter)).slice(0, count - 1);
      return {
        kind: 'choice', prompt: `Which picture starts with ${letter.toUpperCase()}?`, say: `Which picture starts with the letter ${letter}? Listen for its sound at the start.`,
        visual: `<div class="brain-letter" aria-hidden="true">${letter.toUpperCase()}${letter}</div>`,
        options: shuffle([target, ...distractors].map(w => ({ label: `<span class="big" aria-hidden="true">${w.icon}</span><small>${w.word}</small>`, ok: w.word === target.word }))),
        yes: `Yes! ${target.word} starts with ${letter}.`, no: `Almost! Say the sound ${letter} and listen for it at the start.`
      };
    }
    if (id === 'add') {
      const max = [5, 8, 10][lv - 1], sum = 2 + Math.floor(Math.random() * (max - 1));
      const a = 1 + Math.floor(Math.random() * (sum - 1)), b = sum - a, icon = pick(['🍎', '🍪', '⭐', '🐟']);
      const wrong = shuffle([sum - 1, sum + 1, sum + 2].filter(v => v >= 1)).slice(0, 2);
      return {
        kind: 'choice', prompt: 'How many in all?', say: 'Count the first group, then the second group. How many are there altogether?',
        visual: `<div class="brain-row" aria-hidden="true"><span>${icon.repeat(a)}</span><b>+</b><span>${icon.repeat(b)}</span><b>= ?</b></div>`,
        options: shuffle([{ label: String(sum), ok: true }, ...wrong.map(v => ({ label: String(v), ok: false }))]),
        yes: `Yes! ${a} and ${b} make ${sum}.`, no: 'Almost! Count all the pictures together, then try again.'
      };
    }
    // Memory: Pip lights up a colour sequence, and the child copies it.
    return { kind: 'memory', seq: Array.from({ length: lv + 1 }, () => Math.floor(Math.random() * COLOURS.length)), entered: [] };
  }

  function menu() {
    session++; game = null; busy = false;
    frame({
      kicker: 'GENTLE PRACTICE · NO TIMERS · NO WRONG ANSWERS', title: 'Pip’s brain games',
      body: `<p>You have ${state.stars} ⭐ stars. Every try helps your brain grow.</p><div class="brain-menu">${GAMES.map(g => `<button class="brain-game" data-brain="play" data-game="${g.id}"><span aria-hidden="true">${g.icon}</span><strong>${g.title}</strong><small>Level ${level(g.id)} · ${state.played[g.id]} solved</small></button>`).join('')}</div>`,
      footer: '<div class="buttons"><button class="primary" data-brain="exit">← Back to exploring</button></div>'
    });
    say('Pip’s brain games! Pick a game. Every try is a good try.');
  }

  function play(id) {
    const def = GAMES.find(g => g.id === id); if (!def) return;
    session++; busy = false; game = { def, round: 0, correct: 0 }; next();
  }

  function next() {
    if (!game) return;
    if (game.round >= game.def.rounds) return finish();
    game.data = makeRound(game.def.id, level(game.def.id));
    if (game.data.kind === 'memory') return renderMemory();
    const d = game.data;
    const options = d.options.map((o, i) => `<button class="brain-choice" data-brain="answer" data-index="${i}">${o.label}</button>`).join('');
    frame({
      kicker: `${game.def.title.toUpperCase()} · ROUND ${game.round + 1} OF ${game.def.rounds}`, title: d.prompt,
      body: `${d.visual}<div class="brain-options">${options}</div><p id="brain-feedback" class="brain-feedback" role="status">Tap the right answer.</p>`,
      footer: '<div class="buttons"><button data-brain="menu">← Brain games</button></div>'
    });
    say(d.say);
  }

  function gain(id) { state.stars++; state.played[id]++; save(); }

  function answer(index) {
    if (busy || !game || !game.data || game.data.kind !== 'choice') return;
    const d = game.data, option = d.options[index]; if (!option) return;
    const button = document.querySelector(`.brain-choice[data-index="${index}"]`), s = session;
    if (option.ok) {
      busy = true; game.correct++; game.round++; gain(game.def.id);
      button?.classList.add('right'); setFeedback(d.yes); say(d.yes);
      setTimeout(() => { if (s === session) { busy = false; next(); } }, 1600);
    } else {
      button?.classList.add('wrong'); setFeedback(d.no); say(d.no);
      setTimeout(() => { if (s === session) button?.classList.remove('wrong'); }, 900);
    }
  }

  function disableTiles(on) { document.querySelectorAll('#brain-tiles .brain-tile').forEach(t => { t.disabled = on; }); }

  function renderMemory() {
    const tiles = COLOURS.map(([name, icon, colour], i) => `<button class="brain-tile" data-brain="tile" data-index="${i}" style="--tile:${colour}" aria-label="${name}"><span aria-hidden="true">${icon}</span></button>`).join('');
    frame({
      kicker: `${game.def.title.toUpperCase()} · ROUND ${game.round + 1} OF ${game.def.rounds}`, title: 'Watch Pip, then copy!',
      body: `<div class="brain-tiles" id="brain-tiles">${tiles}</div><p id="brain-feedback" class="brain-feedback" role="status">Watch carefully…</p>`,
      footer: '<div class="buttons"><button data-brain="menu">← Brain games</button></div>'
    });
    busy = true; disableTiles(true);
    say('Watch carefully. Pip will light up the colours, one at a time. Then copy them in the same order.');
    const s = session; setTimeout(() => { if (s === session) showSequence(0); }, 1400);
  }

  function showSequence(i) {
    const s = session, d = game?.data, tiles = document.querySelectorAll('#brain-tiles .brain-tile');
    if (s !== session || !d || !tiles.length) return;
    if (i >= d.seq.length) { busy = false; disableTiles(false); setFeedback('Your turn! Tap the colours in the same order.'); say('Your turn! Tap the colours in the same order.'); return; }
    const tile = tiles[d.seq[i]]; tile.classList.add('lit');
    setTimeout(() => { tile.classList.remove('lit'); setTimeout(() => showSequence(i + 1), 350); }, 700);
  }

  function tapTile(index) {
    if (busy || !game || !game.data || game.data.kind !== 'memory') return;
    const d = game.data, s = session, tiles = document.querySelectorAll('#brain-tiles .brain-tile'), expected = d.seq[d.entered.length];
    tiles[index]?.classList.add('lit'); setTimeout(() => tiles[index]?.classList.remove('lit'), 250);
    if (index !== expected) {
      busy = true; d.entered = []; disableTiles(true);
      setFeedback('Let’s watch Pip again!'); say('Let’s watch Pip again. Watch carefully.');
      setTimeout(() => { if (s === session) showSequence(0); }, 1200);
      return;
    }
    d.entered.push(index);
    if (d.entered.length === d.seq.length) {
      busy = true; game.correct++; game.round++; gain(game.def.id); disableTiles(true);
      setFeedback('Yes! You copied Pip perfectly!'); say('Yes! You copied Pip perfectly!');
      setTimeout(() => { if (s === session) { busy = false; next(); } }, 1600);
    } else setFeedback('Good! Keep going.');
  }

  function finish() {
    const id = game.def.id, earned = game.correct, title = game.def.title;
    game = null; busy = false;
    frame({
      kicker: 'YOU DID IT', title: 'Brilliant brain!',
      body: `<p>You solved ${earned} in ${title}. You now have ${state.stars} ⭐ stars.</p><div class="brain-stars" aria-hidden="true">${'⭐'.repeat(Math.min(5, earned))}</div>`,
      footer: `<div class="buttons"><button class="primary" data-brain="play" data-game="${id}">Play again</button><button data-brain="menu">Other brain games</button><button data-brain="exit">← Back to exploring</button></div>`
    });
    say(`Brilliant! You solved ${earned} in ${title}. Play again, choose another game, or go back exploring.`);
  }

  function exit() { session++; game = null; busy = false; ctx.exit(); }

  const overlay = document.getElementById('overlay');
  overlay?.addEventListener('click', e => {
    const b = e.target.closest('[data-brain]'); if (!b || !ctx) return;
    const a = b.dataset.brain;
    if (a === 'menu') menu();
    else if (a === 'play') play(b.dataset.game);
    else if (a === 'exit') exit();
    else if (a === 'answer') answer(Number(b.dataset.index));
    else if (a === 'tile') tapTile(Number(b.dataset.index));
  });

  // The world passes in its own overlay, speech and mode switches.
  window.BrainGames = Object.freeze({
    open(context) { ctx = context; ctx.start(); menu(); }
  });
})();
