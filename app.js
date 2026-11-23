(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const main = $('#main');
  if (new URLSearchParams(location.search).has('camp')) document.documentElement.classList.add('camp-embedded');
  const icon = (name, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const escape = (text) => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const key = 'little-explorer-v1';
  let saved = {};
  let storageAvailable = true;
  try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { storageAvailable = false; }
  const state = {
    voice: saved.voice !== false,
    discoveries: Array.isArray(saved.discoveries) ? saved.discoveries.filter(x => ['dig', 'egypt'].includes(x)) : [],
    route: 'map', dig: new Set(), clues: new Set(), clue: 0,
    surah: 1, verse: 0, repeat: false, step: 0, phrase: 0, done: false
  };
  let toastTimer;
  let audio = null;
  let audioToken = 0;
  function save() {
    try { localStorage.setItem(key, JSON.stringify({ voice: state.voice, discoveries: state.discoveries })); }
    catch { storageAvailable = false; }
  }
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
  }
  function audioStatus(message = '') { const el = $('#audio-status'); if (el) el.textContent = message; }
  function stopAudio(message = '') {
    audioToken++;
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); audio = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    audioStatus(message);
    const play = $('#play-ayah');
    if (play) { play.disabled = false; play.innerHTML = `${icon('sound')} Listen to ayah`; }
  }
  function speak(text) {
    stopAudio();
    if (!state.voice) return toast('Voice is off. Turn it on at the top to listen.');
    if (!('speechSynthesis' in window)) return toast('Read-aloud is unavailable here. Ask your grown-up to read with you.');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB'; utterance.rate = 0.82; utterance.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en-GB')) || voices.find(v => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    utterance.onerror = event => { if (!['canceled', 'interrupted'].includes(event.error)) toast('The voice could not start. Read this together with your grown-up.'); };
    window.speechSynthesis.speak(utterance);
  }
  function award(place) {
    if (!state.discoveries.includes(place)) {
      state.discoveries.push(place); save();
      toast('A new place for your discovery book!');
    }
  }
  const svg = (content, viewBox = '0 0 400 250', cls = '', label = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" class="${cls}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${content}</svg>`;
  const clouds = `<g fill="#fffbed" opacity=".85"><path d="M24 53c-10 0-10-15 1-16 2-18 25-20 30-4 16-5 25 20 8 20Z"/><path d="M270 40c-10 0-9-13 0-14 3-16 23-15 26-2 15-3 19 16 5 16Z"/></g>`;
  const fern = `<g stroke="#557b4b" stroke-width="4" fill="#729556" stroke-linecap="round"><path d="M0 0c2-20 0-42-10-65" fill="none"/><path d="M-6-42c-25-1-31-13-27-18 13-3 25 7 27 18M-8-49c14-19 22-18 26-14 2 10-10 17-26 14M-2-20c-23 0-32-12-28-18 13-2 25 5 28 18M-2-30c15-16 27-15 29-8-2 11-13 12-29 8" stroke="none"/></g>`;
  const dinosaur = `<g><path d="M81 168c-16 6-31 1-49-14 9 20 20 36 51 36l5 28h17l2-27h33l6 27h17l-3-38c11-13 14-39 12-64l-1-35c1-11 18-14 23-8l6-9c-9-17-43-13-47 10l-4 63c-22-19-56-15-68 31Z" fill="#739268"/><path d="M164 94c-2 37 0 61-14 75l3 40h7l-2-30c11-17 14-38 12-64l-1-24Z" fill="#9eb385"/><path d="m111 136 8-12 10 10 9-6 7 12" fill="#557e51"/><circle cx="184" cy="70" r="2.3" fill="#304934"/><path d="M187 78c3 2 6 1 8-1" stroke="#45643f" stroke-width="1.5" fill="none"/><g fill="#cad4a6"><ellipse cx="96" cy="160" rx="4" ry="6"/><ellipse cx="123" cy="153" rx="5" ry="7"/><ellipse cx="136" cy="167" rx="3" ry="4"/></g></g>`;
  const pyramids = `<path d="M175 206 277 61l99 145Z" fill="#dbac65"/><path d="m277 61 24 145h75Z" fill="#c89552"/><path d="M77 215 169 91l89 124Z" fill="#edc987"/><path d="m169 91 17 124h72Z" fill="#dcb16f"/><g stroke="#bc914f" stroke-width="1" opacity=".4"><path d="M224 137h78M211 157h94M198 177h111M125 151h52M110 173h70M94 195h89"/></g>`;
  function scene(kind, hero = false) {
    if (hero) return svg(`<circle cx="342" cy="67" r="37" fill="#f3db92"/>${clouds}<path d="M0 206C94 105 170 177 226 133s125-39 204 55v92H0Z" fill="#ceddb9"/><g transform="translate(138 43) scale(.67)">${pyramids}</g><path d="M-20 250c88-74 135-78 227-19s174-24 239-7v76H-20Z" fill="#b8ce9e"/><path d="M167 279c-8-22 15-39 76-46s16-36-4-43" stroke="#f1e1b0" stroke-width="19" stroke-linecap="round" fill="none"/><g transform="translate(14 60) scale(1.05)">${dinosaur}</g><ellipse cx="140" cy="289" rx="89" ry="10" fill="#9bb77e" opacity=".4"/><g transform="translate(370 269) scale(.85)">${fern}</g><g transform="translate(41 279) scale(.65)">${fern}</g><g fill="#f5e9b2"><path d="m226 72 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/><path d="m325 167 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g><g fill="#94ac76"><ellipse cx="305" cy="265" rx="15" ry="6"/><ellipse cx="280" cy="274" rx="9" ry="4"/></g>`, '0 0 430 310', 'hero-scene', 'An imaginary museum adventure with a friendly dinosaur, fossil hills, and an ancient Egypt area');
    if (kind === 'dig') return svg(`<rect width="400" height="250" fill="#e4ebd8"/>${clouds}<circle cx="310" cy="58" r="23" fill="#f0deb1"/><path d="M0 173C75 114 121 166 197 134s144-15 203 40v76H0Z" fill="#c9d7b7"/><path d="M0 220c85-23 157-16 235 1s117 8 165-4v33H0Z" fill="#d7bf91"/><g transform="translate(67 7) scale(1.05)">${dinosaur}</g><g transform="translate(42 240) scale(.75)">${fern}</g><g transform="translate(349 226) scale(.7)">${fern}</g><g fill="#f5edd6" transform="translate(250 200) rotate(-20)"><rect width="65" height="13" rx="6"/><circle cx="1" cy="3" r="9"/><circle cx="1" cy="12" r="9"/><circle cx="65" cy="3" r="9"/><circle cx="65" cy="12" r="9"/></g>`);
    if (kind === 'egypt') return svg(`<rect width="400" height="250" fill="#fae9c7"/><circle cx="307" cy="55" r="29" fill="#f2ce7c"/>${clouds}${pyramids}<path d="M0 232c92-54 166-15 234-9s108-26 166-12v39H0Z" fill="#e7c38b"/><path d="M48 226c6-40 5-64 1-82" stroke="#8c794c" stroke-width="9" fill="none"/><g fill="#8a9b58"><path d="M48 150c-34-26-50-13-46-2 16-9 32 2 46 2M48 150c11-41 33-40 39-27-18-5-29 11-39 27M48 150c-7-37-30-44-36-33 18 3 26 19 36 33M48 150c28-20 50-13 48 2-19-10-31-3-48-2"/></g><g fill="#c39c64"><ellipse cx="287" cy="232" rx="16" ry="5"/><ellipse cx="316" cy="224" rx="10" ry="4"/></g>`);
    return svg(`<rect width="400" height="250" fill="#e7e8ef"/><circle cx="296" cy="55" r="25" fill="#f4dda5"/><circle cx="308" cy="45" r="24" fill="#e7e8ef"/><g fill="#c3c7d5"><path d="M0 218c60-35 113-9 171-28s136-29 229 2v58H0Z"/></g><g fill="#97a9a0"><path d="M103 201v-63h47v63Zm-14-63c0-32 75-32 75 0Z"/><path d="M229 202V112h18v90Zm-4-90 13-24 14 24Z"/><path d="M155 204v-50h70v50Z"/><path d="M148 155c0-48 84-48 84 0Z"/></g><g fill="#f4e7b8"><path d="M174 204v-29c0-17 32-17 32 0v29Z"/><path d="M113 158h11v18h-11Zm20 0h11v18h-11Z"/></g><path d="m104 227 66-13 93 19-66 13Z" fill="#688b76"/><path d="m124 226 47-7 69 15-44 7Z" fill="none" stroke="#b4c6a3" stroke-width="2"/><g fill="#fff9dd"><path d="m76 59 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/><circle cx="170" cy="52" r="2"/><circle cx="341" cy="113" r="2"/><path d="m245 40 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g>`);
  }
  const back = () => `<a class="back-link" href="#map">${icon('arrow')} Back to the map</a>`;
  const listen = (label = 'Read these instructions aloud') => `<button class="listen-button" data-action="listen" aria-label="${label}">${icon('sound')}</button>`;
  function mapView() {
    return `<section class="greeting"><div><span class="eyebrow">ASSALAMU ALAIKUM, LITTLE EXPLORER</span><h1>A big world. Little discoveries.</h1><p>Dig, discover, and grow in faith. One little step at a time.</p></div><span class="small-pill">${icon('leaf')} MADE FOR LITTLE HEARTS</span></section>
    <section class="hero"><div class="hero-copy"><span class="hero-tag">✦ NEW · A REAL PLAYABLE ADVENTURE</span><h2>Run. Jump.<br><span>Make a dino smile.</span></h2><p>Help Pip’s dinosaur friend, build a fossil display, and sail down the Nile in Dino & Desert Quest.</p><button class="button" data-action="start">Play the adventure ${icon('arrow')}</button></div>${scene('dig', true)}<span class="scene-label">Dino & Desert Quest · Now playable</span></section>
    <section aria-labelledby="destinations"><div class="section-heading"><div><h2 id="destinations">Where shall we go?</h2><p>Pick a little adventure. There’s no wrong way to begin.</p></div><span class="step-number">3 PLACES TO DISCOVER</span></div><div class="destination-grid">
    ${destination('dig', 'NATURE & WONDER', 'Dinosaur dig', 'Brush away the sand.<br>What will you discover?', 'Let’s dig', 'HANDS-ON DISCOVERY', 'bone')}
    ${destination('egypt', 'HISTORY & CURIOSITY', 'Egypt explorers', 'Follow the river.<br>Peek into the ancient past.', 'Explore Egypt', 'A LITTLE HISTORY', 'pyramid')}
    ${destination('prayer', 'FAITH & LITTLE STEPS', 'My prayer trail', 'From the opening dua<br>to a peaceful salam.', 'Learn together', 'GROWN-UP GUIDED', 'moon')}
    </div></section><div class="gentle-strip"><span class="strip-icon">${icon('book')}</span><div><strong>A little ayah. A lovely beginning.</strong><p>Listen to Al-Fatihah and the last three surahs in the Qur’an garden.</p></div><a href="#quran">Visit the garden →</a><a class="sr-only" href="#quran">Open Qur’an garden</a></div>`;
  }
  function destination(route, category, title, description, cta, pill, glyph) {
    return `<article class="destination"><div class="destination-art">${scene(route === 'prayer' ? 'prayer' : route)}<span class="art-pill">${icon(glyph)} ${pill}</span></div><div class="destination-copy"><span class="eyebrow">${category}</span><h3><a href="#${route}">${title}</a></h3><p>${description}</p><a class="card-link" href="#${route}">${cta}${icon('arrow')}</a></div></article>`;
  }
  const tiles = ['stone', 'bone', 'leaf', 'bone', 'stone', 'bone', 'leaf', 'bone', 'stone'];
  const finds = ['A dinosaur tooth', 'A leg-bone piece', 'A rib-bone piece', 'A tail-bone piece'];
  function digView() {
    const count = [...state.dig].filter(i => tiles[i] === 'bone').length;
    return `${back()}<section class="activity-header"><span class="eyebrow">NATURE & WONDER · A PRETEND FOSSIL DIG</span><h1>What’s under the sand?</h1><p class="subheading">Tap a sandy square to brush it gently. Look for four fossil pieces.</p></section><div class="activity-layout"><section class="panel"><div class="instruction-line"><h2>Brush, brush, discover.</h2>${listen()}</div><div class="dig-grid" aria-label="Nine sandy squares">${tiles.map((type, i) => `<button class="dig-tile ${state.dig.has(i) ? 'revealed' : ''}" data-action="dig" data-value="${i}" aria-label="${state.dig.has(i) ? type === 'bone' ? finds[tiles.slice(0, i + 1).filter(t => t === 'bone').length - 1] + ', discovered' : type + ', discovered' : 'Brush sandy square ' + (i + 1)}" aria-pressed="${state.dig.has(i)}">${state.dig.has(i) ? type === 'stone' ? '◒' : icon(type) : ''}</button>`).join('')}</div><p class="activity-tip" id="dig-feedback" role="status">${state.lastDig || 'No hurry. Every little discovery is worth a look.'}</p>${count === 4 ? `<div class="completion"><h3>You found all four fossil pieces!</h3><p>Fossils help us learn about living things from long ago. Ask your grown-up: what might this dinosaur have looked like?</p><a class="button small" href="#journal">See my discovery book ${icon('arrow')}</a></div>` : ''}</section><aside class="panel"><span class="eyebrow">YOUR FIELD NOTES</span><h2>A little paleontologist.</h2><p class="activity-tip">A paleontologist studies fossils. You can be curious, gentle, and patient too.</p><div class="discovery-list">${finds.map((name, i) => { const tileIndex = [1, 3, 5, 7][i]; return `<div class="discovery-item ${state.dig.has(tileIndex) ? 'found' : ''}">${icon(state.dig.has(tileIndex) ? 'bone' : 'compass')}${state.dig.has(tileIndex) ? name : 'A fossil waiting to be found'}</div>`; }).join('')}</div><div class="field-note"><span class="eyebrow">A MOMENT OF WONDER</span><h3>So much to discover.</h3><p>We believe Allah created all things. Learning about nature can help us appreciate His creation.</p></div><p class="helper-note">These are playful fossil-piece icons, not a scientifically accurate skeleton reconstruction.</p><button class="button outline small" data-action="dig-reset">Brush a fresh patch</button></aside></div>`;
  }
  const clues = [
    { title: 'The mighty Nile', label: 'The river', text: 'The Nile is a long river in Egypt. Ancient Egyptian families used its water to grow food and travelled on it in boats.', wonder: 'People, plants, and animals need water. How can we use water carefully today?' },
    { title: 'Pyramids of stone', label: 'The pyramids', text: 'People built Egypt’s famous pyramids thousands of years ago. Some were tombs for rulers. Archaeologists study them to learn about the past.', wonder: 'Pyramids are historical buildings, not mosques. Learning about history is different from worship.' },
    { title: 'A paper made from plants', label: 'The papyrus', text: 'Ancient Egyptians made a writing material called papyrus from a plant that grew near the river. They wrote and drew on it.', wonder: 'What would you draw in your discovery book? Ask your grown-up to draw a fossil with you.' }
  ];
  function egyptView() {
    const clue = clues[state.clue];
    return `${back()}<section class="activity-header"><span class="eyebrow">HISTORY & CURIOSITY · AN ANCIENT EGYPT TRAIL</span><h1>A little trip back in time.</h1><p class="subheading">Find out about three things in ancient Egypt. Tap a clue and listen together.</p></section><div class="activity-layout"><section class="panel"><div class="egypt-scene">${scene('egypt')}</div><div class="clue-buttons">${clues.map((c, i) => `<button class="clue-button" data-action="clue" data-value="${i}" aria-pressed="${state.clues.has(i)}">${state.clues.has(i) ? icon('check') : icon(i === 1 ? 'pyramid' : 'leaf')}${c.label}</button>`).join('')}</div><div class="fact-card"><div class="instruction-line"><h3>${clue.title}</h3>${listen('Read this history clue aloud')}</div><p>${clue.text}</p></div>${state.clues.size === 3 ? `<div class="completion"><h3>Three little discoveries!</h3><p>You visited all three clues. Your Egypt explorer sticker is in your book.</p><a class="button small" href="#journal">Open discovery book ${icon('arrow')}</a></div>` : '<p class="activity-tip">Choose each of the three clues. There’s no quiz and no hurry.</p>'}</section><aside class="panel"><span class="eyebrow">WONDER TOGETHER</span><h2>Let’s have a little chat.</h2><div class="field-note"><p>${clue.wonder}</p></div><div class="field-note"><span class="eyebrow">A NOTE ABOUT TIME</span><h3>Different chapters.</h3><p>Non-bird dinosaurs lived millions of years before ancient Egypt. These are different rooms in our imaginary museum, not the same time in history.</p></div><p class="activity-tip">The game’s pictures are playful illustrations, not a real archaeological site.</p></aside></div>`;
  }
  const surahNames = { 1: 'Al-Fatihah', 112: 'Al-Ikhlas', 113: 'Al-Falaq', 114: 'An-Nas' };
  const quranVerse = (number, index) => window.QURAN[number].verses[index];
  function verseContent(number, index) {
    const verse = quranVerse(number, index);
    // quran-simple includes the unnumbered basmalah at the start of surahs 112–114.
    const basmalah = number !== 1 && index === 0;
    const arabic = basmalah ? verse.arabic.replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s*/, '') : verse.arabic;
    return `${basmalah ? '<p class="bismillah" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>' : ''}<p class="arabic" lang="ar" dir="rtl">${escape(arabic)}</p><p class="latin">${escape(verse.latin)}</p><div class="meaning"><span class="eyebrow">ENGLISH MEANING · SAHEEH INTERNATIONAL</span><p>${escape(verse.english)}</p></div>`;
  }
  function player() {
    return `<div class="audio-controls"><button class="button" data-action="play" id="play-ayah">${icon('sound')} Listen to ayah</button><button class="button outline" data-action="stop">Stop</button><label class="repeat-label"><input type="checkbox" id="repeat-ayah" ${state.repeat ? 'checked' : ''}> Repeat ayah</label></div><p id="audio-status" class="audio-status" role="status">Recorded recitation · Al-Husary · Internet needed</p>`;
  }
  function quranView() {
    const surah = window.QURAN[state.surah];
    return `${back()}<section class="activity-header"><span class="eyebrow">THE QUR’AN GARDEN · LISTEN, PAUSE, TRY TOGETHER</span><h1>A little ayah at a time.</h1><p class="subheading">Listen quietly. Then pause and practise with your grown-up. Repeating is lovely.</p></section><div class="learning-tabs" aria-label="Choose a surah">${[1, 112, 113, 114].map(n => `<button data-action="surah" data-value="${n}" aria-pressed="${state.surah === n}">${surahNames[n]}</button>`).join('')}</div><div class="quran-layout"><section class="panel verse-panel" aria-label="${surahNames[state.surah]} reading card"><span class="verse-label">${surahNames[state.surah].toUpperCase()} · AYAH ${state.verse + 1} OF ${surah.verses.length}</span>${verseContent(state.surah, state.verse)}${player()}<div class="verse-dots" aria-label="Choose an ayah">${surah.verses.map((v, i) => `<button data-action="verse" data-value="${i}" aria-label="Ayah ${i + 1}" aria-current="${state.verse === i}">${i + 1}</button>`).join('')}</div><div class="verse-navigation"><button class="button outline" data-action="verse-prev" ${state.verse === 0 ? 'disabled' : ''}>← Back</button><span>${state.verse + 1} / ${surah.verses.length} ayahs</span><button class="button" data-action="verse-next" ${state.verse === surah.verses.length - 1 ? 'disabled' : ''}>Next ayah →</button></div></section><aside class="panel learning-aside"><div class="aside-art">${scene('prayer')}</div><span class="eyebrow">SMALL IS BEAUTIFUL</span><h3>No rush to finish.</h3><p>One ayah is a lovely place to begin. Listen as many times as you like, then take a little break.</p><div class="field-note"><strong>For your grown-up</strong><p>Transliteration is only a helper. Learn the Arabic sounds and tajwid with a trusted teacher.</p></div><button class="button outline small" data-action="listen" style="margin-top:18px">${icon('sound')} Read the instructions</button></aside></div><p class="reference-caption">Arabic and English text bundled from AlQuran Cloud. Basmalah is shown separately before the first ayah of the last three surahs. <button class="text-button" data-action="parents">Grown-up notes</button></p>`;
  }
  const steps = [
    { title: 'Begin with takbir', text: 'takbir', pose: 'Standing', group: 'GETTING READY', tip: 'With your grown-up, make wudu first, wear clean clothes, and face the qiblah. Make your intention in your heart. Raise your hands and begin.' },
    { title: 'The opening dua', text: 'iftitah', pose: 'Standing', group: 'FIRST RAK‘AH', tip: 'Stand calmly. Learn this opening dua one little phrase at a time. It is called dua iftitah.' },
    { title: 'Ask for protection', text: 'refuge', pose: 'Standing', tip: 'Before reading the Qur’an, quietly ask Allah for protection.' },
    { title: 'Al-Fatihah', surah: 1, pose: 'Standing', tip: 'Read Al-Fatihah slowly, one ayah at a time. Say “Amin” after finishing it; Amin is not an ayah of Al-Fatihah.' },
    { title: 'A short surah', surah: 112, pose: 'Standing', tip: 'Now read a short surah. Here we practise Al-Ikhlas. Another surah may also be chosen.' },
    { title: 'Bow in ruku‘', text: 'ruku', pose: 'Bowing', transition: true, tip: 'Bow with your grown-up showing you how. Be still and say this dua calmly.' },
    { title: 'Stand up calmly', text: 'rise', pose: 'Standing again', tip: 'Say the first phrase as you rise, then the second while standing upright. Pause calmly.' },
    { title: 'The first sujud', text: 'ruku', pose: 'Prostrating', transition: true, tip: 'Go down into sujud with your grown-up’s help. Be still and say this dua.' },
    { title: 'Sit between sujud', text: 'sit', pose: 'Sitting', transition: true, tip: 'Sit up calmly between the two prostrations, and ask Allah for good things.' },
    { title: 'The second sujud', text: 'ruku', pose: 'Prostrating', transition: true, tip: 'Make sujud a second time. Be still and say the same dua.' },
    { title: 'Stand for rak‘ah two', text: 'takbir', pose: 'Standing', group: 'SECOND RAK‘AH', tip: 'With your grown-up, rise for the second rak‘ah. Say Allahu akbar as you rise. This time, do not repeat the opening dua.' },
    { title: 'Al-Fatihah again', surah: 1, pose: 'Standing', tip: 'Read Al-Fatihah again. Take it slowly. Say “Amin” afterwards; it is not part of the surah.' },
    { title: 'Another short surah', surah: 114, pose: 'Standing', tip: 'Here we practise An-Nas. You can read another short surah instead, with your grown-up.' },
    { title: 'Bow in ruku‘', text: 'ruku', pose: 'Bowing', transition: true, tip: 'Bow calmly again. Say this dua with your grown-up.' },
    { title: 'Stand up calmly', text: 'rise', pose: 'Standing again', tip: 'Say the first phrase as you rise, then the second while standing upright. Pause calmly.' },
    { title: 'The first sujud', text: 'ruku', pose: 'Prostrating', transition: true, tip: 'Make the first sujud of this rak‘ah. Pause calmly and say the dua.' },
    { title: 'Sit between sujud', text: 'sit', pose: 'Sitting', transition: true, tip: 'Sit calmly and say the dua with your grown-up.' },
    { title: 'The second sujud', text: 'ruku', pose: 'Prostrating', transition: true, tip: 'Make the second sujud. Be still and say the dua again.' },
    { title: 'The final tashahhud', text: 'tashahhud', pose: 'Final sitting', group: 'A PEACEFUL FINISH', transition: true, tip: 'Sit for the final tashahhud. Let your grown-up show you how to sit and point your finger. Learn one phrase at a time.' },
    { title: 'Salawat for the Prophet', text: 'salawat', pose: 'Final sitting', tip: 'Remain seated. Ask Allah to bless Prophet Muhammad and his family.' },
    { title: 'A dua for protection', text: 'protection', pose: 'Final sitting', tip: 'Still sitting, ask Allah for His protection before finishing the prayer.' },
    { title: 'Finish with salam', text: 'salam', pose: 'Sitting · right, then left', tip: 'Turn your head to the right and say the salam. Then turn to the left and say the same salam again. Let your grown-up show you.' }
  ];
  const phraseCount = step => step.surah ? window.QURAN[step.surah].verses.length : window.PRAYER_TEXT[step.text].length;
  function prayerView() {
    if (state.done) return `${back()}<section class="panel journey-done"><span class="eyebrow">LITTLE STEPS, TOGETHER</span><div class="together-art" aria-hidden="true">✦ ☾ ✧</div><h2>A peaceful little practice.</h2><p>You explored the two-rak‘ah prayer sequence with your grown-up. You don’t need to remember it all today. Come back to one small phrase whenever you like.</p><div class="audio-controls"><button class="button" data-action="prayer-restart">Practise again ${icon('moon')}</button><a class="button outline" href="#map">Back to exploring</a></div><p class="helper-note">This is a learning activity, not a completed real prayer or a check of memorisation.</p></section>`;
    const step = steps[state.step];
    const count = phraseCount(step);
    const text = step.surah ? null : window.PRAYER_TEXT[step.text][state.phrase];
    return `${back()}<section class="activity-header"><span class="eyebrow">MY PRAYER TRAIL · MUHAMMADIYAH WORDING · GROWN-UP GUIDED</span><h1>Let’s learn to pray, together.</h1><p class="subheading">A two-rak‘ah practice trail. Choose any stop, or follow the little steps. Take breaks anytime.</p></section><div class="practice-layout"><nav class="panel trail-list" aria-label="Prayer sequence">${steps.map((s, i) => `${s.group ? `<span class="trail-group">${s.group}</span>` : ''}<button class="${i === state.step ? 'current' : ''}" data-action="step" data-value="${i}" aria-current="${i === state.step ? 'step' : 'false'}" aria-label="Step ${i + 1}: ${s.title}"><span class="trail-num">${i + 1}</span><span>${s.title}</span></button>`).join('')}</nav><section class="panel practice-panel"><div class="instruction-line"><span class="pose-badge">${icon('moon')} ${step.pose}</span>${listen()}</div><span class="eyebrow">STOP ${state.step + 1} OF ${steps.length}${step.surah ? ' · ' + surahNames[step.surah].toUpperCase() : ''}</span><h2>${step.title}</h2><p class="practice-tip">${step.tip}</p>${step.transition ? '<div class="transition-note">As you move, say <strong>Allahu akbar</strong>.<span class="mini-arabic" lang="ar" dir="rtl">اللَّهُ أَكْبَرُ</span> Then pause calmly.</div>' : ''}<p class="chunk-progress">${step.surah ? 'AYAH' : 'PHRASE'} ${state.phrase + 1} OF ${count}</p>${step.surah ? verseContent(step.surah, state.phrase) : `<p class="arabic" lang="ar" dir="rtl">${escape(text[0])}</p><p class="latin">${escape(text[1])}</p><div class="meaning"><span class="eyebrow">A LITTLE MEANING · GENTLE SUMMARY</span><p>${escape(text[2])}</p></div>`}${step.text === 'protection' ? '<details class="grownup-details"><summary>For your grown-up: full meaning of this dua</summary><p>“O Allah, I seek refuge in You from the punishment of Hell, from the punishment of the grave, from the trials of life and death, and from the evil trial of the Masih ad-Dajjal.” (Meaning of Muslim 588a.) The child-facing meanings above are gentle summaries, not literal translations.</p></details>' : ''}${step.surah ? player() : '<p class="helper-note">Your grown-up reads the Arabic; you can listen and try together.<br>Recorded dua audio is not included in this prototype.</p>'}<div class="phrase-actions"><button class="button outline small" data-action="phrase-prev" ${state.phrase === 0 ? 'disabled' : ''}>← Previous ${step.surah ? 'ayah' : 'phrase'}</button><button class="button secondary small" data-action="phrase-next" ${state.phrase === count - 1 ? 'disabled' : ''}>Next ${step.surah ? 'ayah' : 'phrase'} →</button></div><div class="verse-navigation"><button class="button outline small" data-action="step-prev" ${state.step === 0 ? 'disabled' : ''}>← Previous stop</button><span>${state.step + 1} / ${steps.length} stops</span><button class="button small" data-action="step-next">${state.step === steps.length - 1 ? 'Finish practice' : 'Next stop'} →</button></div><p class="helper-note">This is a practice guide, not a real-prayer mode. A grown-up should demonstrate movements. <button class="text-button" data-action="parents">Teaching notes</button></p></section></div>`;
  }
  function journalView() {
    return `${back()}<section class="activity-header"><span class="eyebrow">MY DISCOVERY BOOK</span><h1>Little places. Lovely memories.</h1><p class="subheading">A keepsake of places you’ve explored. These stickers celebrate curiosity, not prayer performance.</p></section><div class="journal-grid">${[['dig', 'bone', 'Fossil finder', 'You discovered four pretend fossils. What could they tell us about a dinosaur?', 'Brush away sand to discover four fossil pieces.'], ['egypt', 'pyramid', 'Egypt explorer', 'You explored the Nile, the pyramids, and papyrus. Which was your favourite?', 'Visit the three history clues to make a little discovery.']].map(([route, glyph, title, found, waiting]) => { const visited = state.discoveries.includes(route); return `<article class="journal-sticker ${visited ? '' : 'unvisited'}"><div class="sticker-circle">${icon(glyph)}</div><span class="eyebrow">${visited ? 'A PLACE YOU EXPLORED' : 'AN ADVENTURE AWAITS'}</span><h2>${title}</h2><p>${visited ? found : waiting}</p><a class="button ${visited ? 'outline' : ''}" href="#${route}">${visited ? 'Explore again' : 'Let’s explore'} ${icon('arrow')}</a></article>`; }).join('')}</div><div class="gentle-strip"><span class="strip-icon">${icon('moon')}</span><div><strong>Learning is not a race.</strong><p>Your prayer and Qur’an practice are private moments with your grown-up, without scores or stickers.</p></div></div>`;
  }
  function render(focusMain = false) {
    const active = document.activeElement;
    const focusAction = main.contains(active) ? active.dataset.action : null;
    const focusValue = focusAction ? active.dataset.value : null;
    stopAudio();
    main.innerHTML = ({ map: mapView, dig: digView, egypt: egyptView, quran: quranView, prayer: prayerView, journal: journalView }[state.route] || mapView)();
    document.querySelectorAll('[data-nav]').forEach(a => {
      const current = a.dataset.nav === state.route || (a.dataset.nav === 'map' && ['dig', 'egypt'].includes(state.route));
      a.classList.toggle('active', current);
      if (current) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = `${({ map: 'Adventure map', dig: 'Dinosaur dig', egypt: 'Egypt explorers', quran: 'Qur’an garden', prayer: 'My prayer trail', journal: 'Discovery book' })[state.route]} · Little Explorer`;
    if (focusMain) { main.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }
    else if (focusAction) {
      const target = [...main.querySelectorAll('[data-action]')].find(el => el.dataset.action === focusAction && el.dataset.value === focusValue);
      if (target && !target.disabled) target.focus({ preventScroll: true });
    }
    const currentStep = $('.trail-list .current');
    if (currentStep && state.route === 'prayer' && focusAction === 'step') currentStep.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  function readInstructions() {
    if (state.route === 'dig') return speak('Tap a sandy square to brush away the sand. Look for four fossil pieces. There is no hurry.');
    if (state.route === 'egypt') return speak(`${clues[state.clue].title}. ${clues[state.clue].text} ${clues[state.clue].wonder}`);
    if (state.route === 'quran') return speak('Choose a surah. Listen to one ayah with your grown-up. Press stop, then practise together. Use the next ayah button when you are ready.');
    if (state.route === 'prayer' && !state.done) return speak(`${steps[state.step].title}. ${steps[state.step].tip}`);
  }
  async function playAyah() {
    stopAudio();
    if (!state.voice) return toast('Voice is off. Turn it on to hear the recitation.');
    const number = state.route === 'prayer' ? steps[state.step].surah : state.surah;
    const index = state.route === 'prayer' ? state.phrase : state.verse;
    if (!number) return;
    const token = audioToken;
    const url = `https://everyayah.com/data/Husary_128kbps/${String(number).padStart(3, '0')}${String(index + 1).padStart(3, '0')}.mp3`;
    const track = new Audio(url);
    audio = track; track.loop = state.repeat;
    const play = $('#play-ayah');
    if (play) { play.disabled = true; play.innerHTML = `${icon('sound')} Listening…`; }
    audioStatus('Loading recorded recitation…');
    const fail = () => {
      if (token !== audioToken) return;
      stopAudio('Recitation could not load. Check your internet, or read with your grown-up.');
    };
    track.addEventListener('error', fail);
    track.addEventListener('playing', () => { if (token === audioToken) audioStatus(`Al-Husary · ${surahNames[number]}, ayah ${index + 1}${state.repeat ? ' · Repeating until you press Stop' : ''}`); });
    track.addEventListener('waiting', () => { if (token === audioToken) audioStatus('Waiting for the recording to load. You can press Stop anytime.'); });
    track.addEventListener('ended', () => { if (token === audioToken) stopAudio('Now pause and try with your grown-up. Listen again whenever you like.'); });
    try { await track.play(); } catch { fail(); }
  }
  function openParents() {
    stopAudio();
    if (!storageAvailable) $('#storage-note').textContent = 'Browser storage is unavailable. Your discoveries last only for this session. No personal details or recordings are collected.';
    $('#parent-dialog').showModal();
  }
  function changeRoute() {
    const route = location.hash.slice(1) || 'map';
    state.route = ['map', 'dig', 'egypt', 'prayer', 'quran', 'journal'].includes(route) ? route : 'map';
    render(true);
  }
  main.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    const value = Number(button.dataset.value);
    if (action === 'parents') return openParents();
    if (action === 'listen') return readInstructions();
    if (action === 'start') {
      location.href = 'play.html';
      return;
    }
    if (action === 'play') return void playAyah();
    if (action === 'stop') return stopAudio('Paused. Take your time and practise together.');
    if (action === 'dig') {
      if (state.dig.has(value)) return toast('You already brushed this square. Try another sandy square.');
      state.dig.add(value);
      state.lastDig = tiles[value] === 'bone' ? 'A fossil piece! What a lovely discovery.' : tiles[value] === 'leaf' ? 'A little leaf. Nature has lots of things to notice.' : 'A smooth stone. Keep looking gently.';
      if ([...state.dig].filter(i => tiles[i] === 'bone').length === 4) award('dig');
      render(); if (state.voice) speak(state.lastDig); return;
    }
    if (action === 'dig-reset') { state.dig.clear(); state.lastDig = ''; render(); return; }
    if (action === 'clue') {
      state.clue = value; state.clues.add(value);
      if (state.clues.size === 3) award('egypt');
      render(); if (state.voice) speak(`${clues[value].title}. ${clues[value].text}`); return;
    }
    if (action === 'surah') { state.surah = value; state.verse = 0; }
    else if (action === 'verse') state.verse = value;
    else if (action === 'verse-prev') state.verse = Math.max(0, state.verse - 1);
    else if (action === 'verse-next') state.verse = Math.min(window.QURAN[state.surah].verses.length - 1, state.verse + 1);
    else if (action === 'step') { state.step = value; state.phrase = 0; }
    else if (action === 'step-prev') { state.step = Math.max(0, state.step - 1); state.phrase = 0; }
    else if (action === 'step-next') {
      if (state.step === steps.length - 1) state.done = true;
      else { state.step++; state.phrase = 0; }
    }
    else if (action === 'phrase-prev') state.phrase = Math.max(0, state.phrase - 1);
    else if (action === 'phrase-next') state.phrase = Math.min(phraseCount(steps[state.step]) - 1, state.phrase + 1);
    else if (action === 'prayer-restart') { state.step = 0; state.phrase = 0; state.done = false; }
    else return;
    render();
  });
  main.addEventListener('change', event => {
    if (event.target.id === 'repeat-ayah') {
      state.repeat = event.target.checked;
      if (audio) { audio.loop = state.repeat; audioStatus(state.repeat ? 'Repeating this ayah. Press Stop whenever you like.' : 'Repeat off. This ayah will play once.'); }
    }
  });
  function updateSound() {
    $('#sound-toggle').setAttribute('aria-pressed', String(state.voice));
    $('#sound-toggle span').textContent = state.voice ? 'Voice on' : 'Voice off';
  }
  $('#sound-toggle').addEventListener('click', () => {
    state.voice = !state.voice; save(); updateSound(); stopAudio();
    toast(state.voice ? 'Voice on. Tap a speaker button to listen.' : 'Voice off. You can keep exploring quietly.');
  });
  $('#parents').addEventListener('click', openParents);
  $('#close-parents').addEventListener('click', () => $('#parent-dialog').close());
  $('#source-list').innerHTML = window.LEARNING_SOURCES.map(([title, url]) => `<li><a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(title)} ↗<span class="sr-only"> (opens in a new tab)</span></a></li>`).join('');
  $('#reset-progress').addEventListener('click', () => {
    if (!window.confirm('Reset the two exploration stickers on this browser?')) return;
    state.discoveries = []; state.dig.clear(); state.clues.clear(); state.lastDig = ''; save(); render();
    $('#reset-status').textContent = 'Discovery book reset. The adventures are ready to explore again.';
  });
  // Keep parent controls reachable when the desktop sidebar is collapsed.
  $('.topbar-title').innerHTML = '<button class="text-button" id="top-parents">Your world of wonder <span aria-hidden="true">↗</span><span class="sr-only"> · Open grown-up corner</span></button>';
  $('#top-parents').addEventListener('click', openParents);
  window.addEventListener('hashchange', changeRoute);
  window.addEventListener('pagehide', () => stopAudio());
  window.addEventListener('message', event => {
    if (window.parent !== window && event.source === window.parent && event.data === 'little-explorer:stop-audio') stopAudio();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAudio(); });
  updateSound(); changeRoute();
})();
