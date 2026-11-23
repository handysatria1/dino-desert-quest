(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const source = 'https://archive.org/download/MuzammilHasballahJuzAmma/Muzammil%20Hasballah%20-%20Juz%20Amma.mp3';
  const holds = new Set();
  const dialog = $('#recitation-dialog');
  let audio = null, wanted = false, volume = .35, loop = true, generation = 0;
  let failed = false, playing = false;
  const status = message => { $('#recitation-status').textContent = message; };
  function update() {
    $('#recitation-toggle').textContent = wanted ? 'Ⅱ Pause recitation' : '▶ Start recitation';
    $('#recitation-toggle').setAttribute('aria-pressed', String(wanted));
    $('#hud-recitation').classList.toggle('recitation-active', wanted);
    $('#hud-recitation').setAttribute('aria-label', wanted ? 'Qur’an recitation enabled. Open audio controls.' : 'Open background Qur’an recitation controls');
  }
  function makeAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.preload = 'none'; audio.volume = volume; audio.loop = loop;
    audio.src = source;
    audio.addEventListener('playing', () => { playing = true; failed = false; if (wanted && !holds.size) status('Playing · Juz Amma · Muzammil Hasballah'); });
    audio.addEventListener('waiting', () => { if (wanted && !holds.size) status('Buffering the recording… You can keep playing the game.'); });
    audio.addEventListener('error', () => {
      if (!wanted) return;
      wanted = false; failed = true; playing = false;
      status('The recording could not load. Check your internet and tap Start to try again. The game still works.'); update();
    });
    audio.addEventListener('ended', () => { if (!loop) { wanted = false; playing = false; status('Recitation finished. Tap Start to listen again.'); update(); } });
    return audio;
  }
  async function sync() {
    const token = ++generation;
    if (!wanted || holds.size) {
      audio?.pause(); playing = false;
      if (wanted) status(holds.has('speech') ? 'Paused for spoken guidance. Recitation will continue afterwards.' : 'Paused while the game or learning space needs quiet. Resume the adventure to continue.');
      else if (!failed) status('Recitation paused. Tap Start whenever you’re ready.');
      update(); return;
    }
    const track = makeAudio();
    track.volume = volume; track.loop = loop;
    if (track.error) { track.src = source; track.load(); }
    if (track.ended) track.currentTime = 0;
    status('Loading recorded Juz Amma…'); update();
    try {
      await track.play();
      if (token !== generation) return;
      if (!wanted || holds.size) track.pause();
    } catch (error) {
      if (token !== generation || error.name === 'AbortError') return;
      wanted = false; playing = false; failed = true;
      status(error.name === 'NotAllowedError' ? 'Your browser needs another tap. Tap Start recitation to continue.' : 'The recording is unavailable. Check your internet, then tap Start to try again.'); update();
    }
  }
  function start() { wanted = true; failed = false; void sync(); }
  function stop() {
    wanted = false; failed = false; void sync();
    if (audio) { try { audio.currentTime = 0; } catch { /* No metadata yet. */ } }
    status('Recitation stopped. The next play starts from the beginning.');
  }
  function hold(reason, shouldHold) {
    const had = holds.has(reason);
    if (shouldHold) holds.add(reason); else holds.delete(reason);
    if (had !== !!shouldHold && wanted) void sync();
  }
  function open() {
    window.dispatchEvent(new Event('recitation-panel-open'));
    dialog.showModal(); update();
  }
  $('#open-recitation').addEventListener('click', open);
  $('#hud-recitation').addEventListener('click', open);
  $('#close-recitation').addEventListener('click', () => dialog.close());
  $('#recitation-toggle').addEventListener('click', () => { if (wanted) { wanted = false; failed = false; void sync(); } else start(); });
  $('#recitation-stop').addEventListener('click', stop);
  $('#recitation-volume').addEventListener('input', e => {
    volume = Number(e.target.value); if (audio) audio.volume = volume;
    $('#volume-value').textContent = `${Math.round(volume * 100)}%`;
  });
  $('#recitation-loop').addEventListener('change', e => { loop = e.target.checked; if (audio) audio.loop = loop; });
  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
  window.addEventListener('pagehide', stop);
  // Only English guidance uses speech synthesis. Recitation always uses this recording.
  window.Recitation = Object.freeze({ start, stop, hold, open });
  update();
})();
