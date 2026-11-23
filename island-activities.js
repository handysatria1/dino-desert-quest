/* Pointer-driven play activities. No audio, network, storage, or game state here. */
(() => {
  'use strict';
  window.IslandActivities = Object.freeze({
    brush({ host, dig, onCollect, onExit, onSpeak }) {
      host.innerHTML = `<section class="card brush-card" role="dialog" aria-modal="true" aria-labelledby="brush-title"><button class="close" data-brush="exit" aria-label="Leave the dig">×</button><span class="eyebrow">LITTLE HANDS. REAL DISCOVERIES.</span><h2 id="brush-title">What’s under the sand?</h2><p>Rub your finger over the sand. Watch the fossil appear!</p><canvas id="brush-sand" width="700" height="350" aria-label="Sand-covered fossil. Drag to brush away sand, or use the Brush a patch button below."></canvas><div class="brush-progress" role="progressbar" aria-label="Sand brushed away" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><div class="button-row"><button data-brush="patch">🖌 Brush a patch</button><button class="primary green" data-brush="collect" disabled>Lift my fossil! 🦴</button></div><p class="fine" id="brush-message" role="status">No rush. Try big, gentle brushing strokes.</p></section>`;
      const canvas = host.querySelector('canvas'), ctx = canvas.getContext('2d');
      const sand = document.createElement('canvas'); sand.width = 700; sand.height = 350;
      const sc = sand.getContext('2d');
      const cols = 20, rows = 10, cells = dig.cells || new Set(); dig.cells = cells;
      let pointer = null, previous = null, finished = false, hinted = false;
      function drawBone() {
        ctx.fillStyle = '#b39c77'; ctx.fillRect(0, 0, 700, 350);
        ctx.strokeStyle = '#fae9be'; ctx.fillStyle = '#fae9be'; ctx.lineWidth = 22; ctx.lineCap = 'round';
        ctx.save(); ctx.translate(350, 175);
        if (dig.id === 'ribs') {
          ctx.beginPath(); ctx.moveTo(-160, -75); ctx.lineTo(160, -75); ctx.stroke();
          for (let i = 0; i < 5; i++) { const x = -130 + i * 65; ctx.beginPath(); ctx.moveTo(x, -75); ctx.bezierCurveTo(x - 55, 115, x + 55, 115, x + 22, -75); ctx.stroke(); }
        } else if (dig.id === 'footprint') {
          for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(i * 70, -45 + Math.abs(i) * 28, 29, 76, i * .4, 0, Math.PI * 2); ctx.fill(); }
          ctx.beginPath(); ctx.ellipse(0, 55, 66, 45, 0, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.moveTo(-200, 70); ctx.bezierCurveTo(-70, 85, 80, 10, 200, -75); ctx.stroke();
          for (let i = 0; i < 8; i++) { const x = -180 + i * 48, y = 60 - i * i * 2.5; ctx.save(); ctx.translate(x, y); ctx.rotate(-i * .07); ctx.fillRect(-12, -26 + i, 24, 53 - i * 2); ctx.restore(); }
        }
        ctx.restore();
      }
      function cover() {
        sc.globalCompositeOperation = 'source-over'; sc.fillStyle = '#e4c18a'; sc.fillRect(0, 0, 700, 350);
        for (let i = 0; i < 550; i++) { sc.fillStyle = i % 2 ? '#cca572' : '#f1d5a1'; sc.beginPath(); sc.arc((i * 71.3) % 700, (i * 39.7) % 350, 1 + i % 3, 0, Math.PI * 2); sc.fill(); }
        sc.globalCompositeOperation = 'destination-out';
        for (const n of cells) { sc.beginPath(); sc.arc((n % cols + .5) * 35, (Math.floor(n / cols) + .5) * 35, 35, 0, Math.PI * 2); sc.fill(); }
      }
      function paint() {
        drawBone(); ctx.drawImage(sand, 0, 0);
        const amount = Math.min(100, Math.round(cells.size / (cols * rows * .64) * 100));
        const progress = host.querySelector('.brush-progress'); progress.setAttribute('aria-valuenow', String(amount)); progress.querySelector('i').style.width = `${amount}%`;
        host.querySelector('[data-brush="collect"]').disabled = amount < 100;
        if (amount === 100 && !hinted) { hinted = true; host.querySelector('#brush-message').textContent = 'There it is! Tap Lift my fossil to take your discovery.'; onSpeak('You uncovered a fossil! Tap Lift my fossil to put it in your basket.'); }
      }
      function brushAt(x, y) {
        sc.globalCompositeOperation = 'destination-out'; sc.beginPath(); sc.arc(x, y, 45, 0, Math.PI * 2); sc.fill();
        for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) if (Math.hypot((col + .5) * 35 - x, (row + .5) * 35 - y) < 48) cells.add(row * cols + col);
      }
      function point(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 700, y: (e.clientY - r.top) / r.height * 350 }; }
      canvas.onpointerdown = e => { if (pointer !== null) return; e.preventDefault(); pointer = e.pointerId; canvas.setPointerCapture(pointer); previous = point(e); brushAt(previous.x, previous.y); paint(); };
      canvas.onpointermove = e => {
        if (e.pointerId !== pointer) return; e.preventDefault(); const p = point(e), distance = Math.hypot(p.x - previous.x, p.y - previous.y), steps = Math.max(1, Math.ceil(distance / 16));
        for (let i = 1; i <= steps; i++) brushAt(previous.x + (p.x - previous.x) * i / steps, previous.y + (p.y - previous.y) * i / steps);
        previous = p; paint();
      };
      const release = e => { if (e.pointerId === pointer) { pointer = null; previous = null; } };
      canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = release;
      host.querySelector('[data-brush="exit"]').onclick = onExit;
      host.querySelector('[data-brush="patch"]').onclick = () => { for (let i = 0; i < 6; i++) { const n = Array.from({ length: cols * rows }, (_, j) => j).find(j => !cells.has(j)); if (n !== undefined) brushAt((n % cols + .5) * 35, (Math.floor(n / cols) + .5) * 35); } paint(); };
      host.querySelector('[data-brush="collect"]').onclick = () => { if (finished || cells.size < cols * rows * .64) return; finished = true; onCollect(); };
      cover(); paint(); onSpeak('A real little dig! Rub your finger over the sand to uncover the fossil. You can also use the brush button.');
    }
  });
})();
