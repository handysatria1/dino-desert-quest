/* Pip’s brain games: optional, gentle practice. No timers, lives, penalties or accounts. */
(() => {
  'use strict';
  const key = 'little-explorer-brain-games-v1';
  const GAMES = [
    { id: 'count', icon: '⭐', title: 'Count the stars', group: 'Numbers', rounds: 5 },
    { id: 'add', icon: '➕', title: 'Add the pictures', group: 'Numbers', rounds: 5 },
    { id: 'bigger', icon: '⚖️', title: 'More or less?', group: 'Numbers', rounds: 5 },
    { id: 'sounds', icon: '🔤', title: 'Starting sounds', group: 'Letters', rounds: 5 },
    { id: 'spell', icon: '✏️', title: 'Build a word', group: 'Letters', rounds: 4 },
    { id: 'pattern', icon: '🔴', title: 'What comes next?', group: 'Thinking', rounds: 5 },
    { id: 'memory', icon: '🧠', title: 'Pip’s colour memory', group: 'Thinking', rounds: 3 },
    { id: 'odd', icon: '🔍', title: 'Odd one out', group: 'Thinking', rounds: 5 },
    { id: 'shapes', icon: '🔷', title: 'Shape detective', group: 'Shapes', rounds: 5 },
    { id: 'world', icon: '🌍', title: 'Wonder quiz', group: 'World', rounds: 5 }
  ];
  const COLOURS = [['red', '🔴', '#d9826b'], ['yellow', '🟡', '#edc75f'], ['green', '🟢', '#8cc17e'], ['blue', '🔵', '#7cb6c3']];
  const PATTERN_ICONS = ['🔴', '🔵', '🟢', '🟡', '⭐', '🌙'];
  const WORDS = [
    { word: 'apple', icon: '🍎' }, { word: 'ball', icon: '⚽' }, { word: 'cat', icon: '🐱' }, { word: 'dog', icon: '🐶' },
    { word: 'fish', icon: '🐟' }, { word: 'sun', icon: '🌞' }, { word: 'bee', icon: '🐝' }, { word: 'car', icon: '🚗' },
    { word: 'frog', icon: '🐸' }, { word: 'house', icon: '🏠' }, { word: 'moon', icon: '🌙' }, { word: 'banana', icon: '🍌' },
    { word: 'tree', icon: '🌳' }, { word: 'hat', icon: '🎩' }
  ];
  // Short words with regular spelling, then four-letter words.
  const SPELL = [
    [{ word: 'cat', icon: '🐱' }, { word: 'dog', icon: '🐶' }, { word: 'sun', icon: '🌞' }, { word: 'hat', icon: '🎩' }, { word: 'bus', icon: '🚌' }, { word: 'pig', icon: '🐷' }, { word: 'fox', icon: '🦊' }, { word: 'cup', icon: '🥤' }, { word: 'bed', icon: '🛏️' }, { word: 'egg', icon: '🥚' }],
    [{ word: 'fish', icon: '🐟' }, { word: 'frog', icon: '🐸' }, { word: 'star', icon: '⭐' }, { word: 'duck', icon: '🦆' }, { word: 'cake', icon: '🎂' }, { word: 'tree', icon: '🌳' }, { word: 'moon', icon: '🌙' }, { word: 'ship', icon: '🚢' }, { word: 'bear', icon: '🐻' }, { word: 'kite', icon: '🪁' }]
  ];
  const ODD = {
    animals: [['🐶', 'dog'], ['🐱', 'cat'], ['🐰', 'rabbit'], ['🐸', 'frog'], ['🐘', 'elephant'], ['🦁', 'lion']],
    fruit: [['🍎', 'apple'], ['🍌', 'banana'], ['🍇', 'grapes'], ['🍓', 'strawberry'], ['🍊', 'orange'], ['🍉', 'watermelon']],
    vehicles: [['🚗', 'car'], ['🚌', 'bus'], ['🚲', 'bicycle'], ['🚂', 'train'], ['✈️', 'aeroplane'], ['🚀', 'rocket']],
    clothes: [['👕', 'T-shirt'], ['👖', 'trousers'], ['🧦', 'socks'], ['🧢', 'cap'], ['👟', 'shoe'], ['🧤', 'gloves']]
  };
  const GROUP_NAME = { animals: 'animals', fruit: 'fruit', vehicles: 'things that go', clothes: 'clothes' };
  const SHAPES = {
    circle: { sides: 0, svg: '<circle cx="50" cy="50" r="38"/>' },
    square: { sides: 4, svg: '<rect x="14" y="14" width="72" height="72" rx="4"/>' },
    triangle: { sides: 3, svg: '<path d="M50 10L90 86H10Z"/>' },
    rectangle: { sides: 4, svg: '<rect x="6" y="28" width="88" height="46" rx="4"/>' },
    star: { sides: 0, svg: '<path d="M50 6L62 38H96L69 58L79 92L50 72L21 92L31 58L4 38H38Z"/>' },
    heart: { sides: 0, svg: '<path d="M50 88C10 60 6 36 22 22C34 12 46 18 50 30C54 18 66 12 78 22C94 36 90 60 50 88Z"/>' },
    pentagon: { sides: 5, svg: '<path d="M50 8L92 39L76 90H24L8 39Z"/>' },
    hexagon: { sides: 6, svg: '<path d="M28 10H72L94 50L72 90H28L6 50Z"/>' }
  };
  const SHAPE_COLOURS = ['#d9826b', '#7cb6c3', '#8cc17e', '#edc75f', '#b79bd6', '#e59fb4'];
  const STICKERS = ['🦕', '🦒', '🐢', '🦁', '🐧', '🦉', '🐬', '🦋', '🐘', '🦜', '🐙', '🦊', '🐨', '🦓', '🐳', '🦩', '🚀', '🚂', '🌈', '🏆'];
  const STARS_PER_STICKER = 10;

  let saved = {};
  try { const raw = JSON.parse(localStorage.getItem(key) || '{}'); if (raw && typeof raw === 'object') saved = raw; } catch { saved = {}; }
  const clamp = (n, max) => Number.isInteger(n) ? Math.max(0, Math.min(max, n)) : 0;
  const state = { stars: clamp(saved.stars, 99999), played: {} };
  GAMES.forEach(g => { state.played[g.id] = clamp(saved.played?.[g.id], 9999); });
  function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* storage is optional */ } }

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  // Difficulty rises with each solved puzzle in that game: levels 1 to 3.
  const level = id => Math.min(3, 1 + Math.floor(state.played[id] / 5));
  const stickerCount = () => Math.min(STICKERS.length, Math.floor(state.stars / STARS_PER_STICKER));
  const shapeSvg = (name, colour) => `<svg viewBox="0 0 100 100" class="brain-shape" aria-hidden="true"><g fill="${colour}" stroke="#355c45" stroke-width="3">${SHAPES[name].svg}</g></svg>`;

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
      const [lo, hi] = [[1, 4], [3, 6], [5, 9]][lv - 1], n = rand(lo, hi);
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
      if (lv === 3) unit[2] = unit[1]; // ABB patterns are trickier than ABC.
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
      const max = [5, 8, 10][lv - 1], sum = rand(2, max);
      const a = rand(1, sum - 1), b = sum - a, icon = pick(['🍎', '🍪', '⭐', '🐟']);
      const wrong = shuffle([sum - 1, sum + 1, sum + 2].filter(v => v >= 1)).slice(0, 2);
      return {
        kind: 'choice', prompt: 'How many in all?', say: 'Count the first group, then the second group. How many are there altogether?',
        visual: `<div class="brain-row" aria-hidden="true"><span>${icon.repeat(a)}</span><b>+</b><span>${icon.repeat(b)}</span><b>= ?</b></div>`,
        options: shuffle([{ label: String(sum), ok: true }, ...wrong.map(v => ({ label: String(v), ok: false }))]),
        yes: `Yes! ${a} and ${b} make ${sum}.`, no: 'Almost! Count all the pictures together, then try again.'
      };
    }
    if (id === 'bigger') {
      const max = [5, 10, 20][lv - 1], less = lv === 3 && Math.random() < .5, count = lv === 3 ? 3 : 2;
      const nums = shuffle(Array.from({ length: max }, (_, i) => i + 1)).slice(0, count);
      const answer = less ? Math.min(...nums) : Math.max(...nums), word = less ? 'less' : 'more';
      const dots = n => lv === 1 ? `<span class="dots" aria-hidden="true">${'●'.repeat(n)}</span>` : '';
      return {
        kind: 'choice', prompt: `Which number is ${word}?`, say: `Which number is ${word}? ${lv === 1 ? 'The dots can help you.' : 'Think about counting.'}`,
        visual: '',
        options: nums.map(n => ({ label: `<span class="big">${n}</span>${dots(n)}`, ok: n === answer })),
        yes: `Yes! ${answer} is ${word}.`, no: `Almost! Count up from one. Which number do you say ${less ? 'first' : 'last'}?`
      };
    }
    if (id === 'odd') {
      const groups = shuffle(Object.keys(ODD)), main = groups[0], other = groups[1], n = lv + 2;
      const same = shuffle([...ODD[main]]).slice(0, n), odd = pick(ODD[other]);
      return {
        kind: 'choice', prompt: 'Which one does not belong?', say: 'Look at all the pictures. Which one does not belong with the others?',
        visual: '',
        options: shuffle([...same.map(([icon, name]) => ({ label: `<span class="big" aria-hidden="true">${icon}</span><small>${name}</small>`, ok: false })), { label: `<span class="big" aria-hidden="true">${odd[0]}</span><small>${odd[1]}</small>`, ok: true }]),
        yes: `Yes! The ${odd[1]} does not belong. The others are all ${GROUP_NAME[main]}.`, no: `Almost! Look again. What are most of the pictures?`
      };
    }
    if (id === 'shapes') {
      const pool = lv === 1 ? ['circle', 'square', 'triangle', 'star'] : lv === 2 ? ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart'] : ['triangle', 'square', 'pentagon', 'hexagon'];
      const target = pick(pool), choices = shuffle([target, ...shuffle(pool.filter(s => s !== target)).slice(0, lv === 1 ? 2 : 3)]);
      const colours = shuffle([...SHAPE_COLOURS]), sides = SHAPES[target].sides;
      const sidesQ = lv === 3;
      return {
        kind: 'choice', prompt: sidesQ ? `Which shape has ${sides} sides?` : `Find the ${target}!`,
        say: sidesQ ? `Which shape has ${sides} sides? Count the straight edges.` : `Can you find the ${target}?`,
        visual: '',
        options: choices.map((s, i) => ({ label: shapeSvg(s, colours[i]) + (lv > 1 ? `<small>${sidesQ ? '' : s}</small>` : ''), ok: s === target })),
        yes: sidesQ ? `Yes! A ${target} has ${sides} sides.` : `Yes! That is a ${target}.`, no: sidesQ ? 'Almost! Touch each straight side and count.' : `Almost! Look for the ${target} again.`
      };
    }
    if (id === 'world') {
      const places = window.WonderPlaces?.places || [];
      if (places.length >= 3) {
        const target = pick(places), others = shuffle(places.filter(p => p.id !== target.id)).slice(0, lv === 1 ? 1 : 2);
        const all = shuffle([target, ...others]);
        if (lv < 3) return {
          kind: 'choice', prompt: `Which one is ${target.name}?`, say: `Which picture is ${target.name}?`, visual: '',
          options: all.map(p => ({ label: `<span class="brain-pic">${window.WonderPlaces.picture(p.id)}</span>${lv === 1 ? `<small>${p.name}</small>` : ''}`, ok: p.id === target.id })),
          yes: `Yes! ${target.fact}`, no: 'Almost! Have a look at each picture again.'
        };
        return {
          kind: 'choice', prompt: `Which country is ${target.name} in?`, say: `Which country is ${target.name} in?`,
          visual: `<div class="brain-pic big-pic" aria-hidden="true">${window.WonderPlaces.picture(target.id)}</div>`,
          options: all.map(p => ({ label: p.country, ok: p.id === target.id })),
          yes: `Yes! ${target.fact}`, no: 'Almost! Try another country.'
        };
      }
    }
    if (id === 'spell') {
      const item = pick(SPELL[lv === 1 ? 0 : 1]), extra = lv === 3 ? shuffle('bmrstnlp'.split('').filter(c => !item.word.includes(c))).slice(0, 2) : [];
      return { kind: 'spell', item, letters: shuffle([...item.word.split(''), ...extra]).map(c => ({ c, used: false })), filled: 0 };
    }
    // Memory: Pip lights up a colour sequence, and the child copies it.
    return { kind: 'memory', seq: Array.from({ length: lv + 1 }, () => Math.floor(Math.random() * COLOURS.length)), entered: [] };
  }

  function menu() {
    session++; game = null; busy = false;
    const have = stickerCount(), toNext = STARS_PER_STICKER - state.stars % STARS_PER_STICKER;
    const book = `<div class="brain-book" aria-label="Sticker book: ${have} of ${STICKERS.length} stickers">${STICKERS.map((s, i) => `<span class="${i < have ? 'got' : ''}">${i < have ? s : '?'}</span>`).join('')}</div><p class="brain-next">${have >= STICKERS.length ? 'Your sticker book is full! Amazing!' : `${toNext} more ⭐ for your next sticker!`}</p>`;
    const groups = [...new Set(GAMES.map(g => g.group))];
    frame({
      kicker: 'GENTLE PRACTICE · NO TIMERS · NO WRONG ANSWERS', title: 'Pip’s brain games',
      body: `<p>You have ${state.stars} ⭐ stars.</p>${book}${groups.map(gr => `<h3 class="brain-group">${gr}</h3><div class="brain-menu">${GAMES.filter(g => g.group === gr).map(g => `<button class="brain-game" data-brain="play" data-game="${g.id}"><span aria-hidden="true">${g.icon}</span><strong>${g.title}</strong><small>Level ${level(g.id)} · ${state.played[g.id]} solved</small></button>`).join('')}</div>`).join('')}`,
      footer: '<div class="buttons"><button class="primary" data-brain="exit">← Back to exploring</button></div>'
    });
    say(`Pip’s brain games! You have ${state.stars} stars. Pick a game. Every try is a good try.`);
  }

  function play(id) {
    const def = GAMES.find(g => g.id === id); if (!def) return;
    session++; busy = false; game = { def, round: 0, correct: 0, stickers: [] }; next();
  }

  function kicker() { return `${game.def.title.toUpperCase()} · LEVEL ${level(game.def.id)} · ROUND ${game.round + 1} OF ${game.def.rounds}`; }

  function next() {
    if (!game) return;
    if (game.round >= game.def.rounds) return finish();
    game.data = makeRound(game.def.id, level(game.def.id));
    if (game.data.kind === 'memory') return renderMemory();
    if (game.data.kind === 'spell') { renderSpell(); say(`Let’s spell ${game.data.item.word}. Tap the letters in order.`); return; }
    const d = game.data;
    const options = d.options.map((o, i) => `<button class="brain-choice" data-brain="answer" data-index="${i}">${o.label}</button>`).join('');
    frame({
      kicker: kicker(), title: d.prompt,
      body: `${d.visual}<div class="brain-options">${options}</div><p id="brain-feedback" class="brain-feedback" role="status">Tap the right answer.</p>`,
      footer: '<div class="buttons"><button data-brain="menu">← Brain games</button></div>'
    });
    say(d.say);
  }

  // Returns a new sticker when this star completes a page of ten.
  function gain(id) {
    const before = stickerCount(); state.stars++; state.played[id]++; save();
    const after = stickerCount(); if (after > before) { const s = STICKERS[after - 1]; game?.stickers.push(s); return s; }
    return null;
  }
  function praise(text, sticker) { const t = sticker ? `${text} You earned a new sticker!` : text; setFeedback(sticker ? `${text} New sticker: ${sticker}` : text); say(t); }

  function answer(index) {
    if (busy || !game || !game.data || game.data.kind !== 'choice') return;
    const d = game.data, option = d.options[index]; if (!option) return;
    const button = document.querySelector(`.brain-choice[data-index="${index}"]`), s = session;
    if (option.ok) {
      busy = true; game.correct++; game.round++; const sticker = gain(game.def.id);
      button?.classList.add('right'); praise(d.yes, sticker);
      setTimeout(() => { if (s === session) { busy = false; next(); } }, d.yes.length > 60 ? 4200 : sticker ? 2600 : 1700);
    } else {
      button?.classList.add('wrong'); setFeedback(d.no); say(d.no);
      setTimeout(() => { if (s === session) button?.classList.remove('wrong'); }, 900);
    }
  }

  function renderSpell() {
    const d = game.data, w = d.item.word;
    frame({
      kicker: kicker(), title: 'Build the word!',
      body: `<div class="brain-letter" aria-hidden="true">${d.item.icon}</div><div class="brain-slots" aria-label="${d.filled} of ${w.length} letters">${w.split('').map((c, i) => `<span class="${i < d.filled ? 'filled' : ''}">${i < d.filled ? c : ''}</span>`).join('')}</div><div class="brain-options">${d.letters.map((l, i) => `<button class="brain-choice brain-key" data-brain="letter" data-index="${i}" ${l.used ? 'disabled' : ''} aria-label="letter ${l.c}">${l.c}</button>`).join('')}</div><p id="brain-feedback" class="brain-feedback" role="status">${d.filled ? 'Keep going!' : `Tap the first letter of ${w}.`}</p><div class="buttons"><button data-brain="hear">🔊 Hear the word</button></div>`,
      footer: '<div class="buttons"><button data-brain="menu">← Brain games</button></div>'
    });
  }
  function tapLetter(index) {
    if (busy || !game || game.data?.kind !== 'spell') return;
    const d = game.data, l = d.letters[index], w = d.item.word, s = session; if (!l || l.used) return;
    if (l.c !== w[d.filled]) {
      const b = document.querySelector(`.brain-key[data-index="${index}"]`); b?.classList.add('wrong');
      setTimeout(() => { if (s === session) b?.classList.remove('wrong'); }, 900);
      const msg = `Almost! ${w.split('').join(', ')}. What comes next?`; setFeedback(msg); say(msg); return;
    }
    l.used = true; d.filled++;
    if (d.filled < w.length) { renderSpell(); say(l.c); return; }
    busy = true; game.correct++; game.round++; const sticker = gain(game.def.id); renderSpell();
    praise(`Yes! ${w.split('').join(', ')}. ${w}!`, sticker);
    setTimeout(() => { if (s === session) { busy = false; next(); } }, sticker ? 3000 : 2400);
  }

  function disableTiles(on) { document.querySelectorAll('#brain-tiles .brain-tile').forEach(t => { t.disabled = on; }); }

  function renderMemory() {
    const tiles = COLOURS.map(([name, icon, colour], i) => `<button class="brain-tile" data-brain="tile" data-index="${i}" style="--tile:${colour}" aria-label="${name}"><span aria-hidden="true">${icon}</span></button>`).join('');
    frame({
      kicker: kicker(), title: 'Watch Pip, then copy!',
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
      busy = true; game.correct++; game.round++; const sticker = gain(game.def.id); disableTiles(true);
      praise('Yes! You copied Pip perfectly!', sticker);
      setTimeout(() => { if (s === session) { busy = false; next(); } }, sticker ? 2600 : 1700);
    } else setFeedback('Good! Keep going.');
  }

  function finish() {
    const id = game.def.id, earned = game.correct, title = game.def.title, stickers = game.stickers, lv = level(id);
    game = null; busy = false;
    frame({
      kicker: 'YOU DID IT', title: 'Brilliant brain!',
      body: `<p>You solved ${earned} in ${title}. You now have ${state.stars} ⭐ stars.</p><div class="brain-stars" aria-hidden="true">${'⭐'.repeat(Math.min(5, earned))}</div>${stickers.length ? `<p class="brain-next">New sticker${stickers.length > 1 ? 's' : ''}: <span class="brain-sticker">${stickers.join(' ')}</span></p>` : ''}<p>Next time: level ${lv}.</p>`,
      footer: `<div class="buttons"><button class="primary" data-brain="play" data-game="${id}">Play again</button><button data-brain="menu">Other brain games</button><button data-brain="exit">← Back to exploring</button></div>`
    });
    say(`Brilliant! You solved ${earned} in ${title}.${stickers.length ? ' Look at your new sticker!' : ''} Play again, choose another game, or go back exploring.`);
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
    else if (a === 'letter') tapLetter(Number(b.dataset.index));
    else if (a === 'hear' && game?.data?.kind === 'spell') say(`${game.data.item.word}. ${game.data.item.word.split('').join(', ')}.`);
  });

  // The world passes in its own overlay, speech and mode switches.
  window.BrainGames = Object.freeze({
    open(context) { ctx = context; ctx.start(); menu(); },
    addStars(n) { state.stars += Math.max(0, n | 0); save(); }
  });
})();
