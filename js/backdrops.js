'use strict';
// ================= BACKDROPS: painted scenes over the court, the church, the envoys' tent, the fair and the bower =================
// A dialog that was a page of text opens on a picture of the place: the hall at court, the basilica, the pavilion
// at a parley, the market square, the garden where a suit is pressed. The picture is a canvas painted once, with a
// few living things (candle flames, banners, smoke, bunting, doves) drawn over it while the dialog is open.
const BDW = 800, BDH = 200;
let BD = null;
function addBackdrop(kind, opts = {}) {
  const card = $('#mcard'); if (!card || !card.firstElementChild) return;
  if (BD) { BD.dead = true; BD = null; }
  const box = document.createElement('div'); box.className = 'scenehead'; box.dataset.kind = kind;
  const cv = document.createElement('canvas'); box.appendChild(cv);
  const cap = document.createElement('div'); cap.className = 'scenecap'; cap.innerHTML = opts.caption || ''; if (opts.caption) box.appendChild(cap);
  card.insertBefore(box, card.firstElementChild);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = BDW * dpr; cv.height = BDH * dpr; const x = cv.getContext('2d'); x.scale(dpr, dpr);
  const S = BD = { kind, x, cv, dpr, t: 0, last: 0, dead: false, opts, hour: pick(['dawn', 'day', 'day', 'dusk']), season: SEASON_K(), seed: Math.random() * 1000 };
  S.ground = makeLayer(BDW, BDH, dpr, g => BACKDROP[kind].paint(g, S));
  const tick = ts => { if (BD !== S || S.dead || !cv.isConnected || !modalOpen()) { if (BD === S) BD = null; S.ground.width = 0; return; } const dt = Math.min(.05, S.last ? (ts - S.last) / 1000 : .016); S.last = ts; S.t += dt; x.drawImage(S.ground, 0, 0, BDW, BDH); BACKDROP[kind].live(x, S, dt); requestAnimationFrame(tick); };
  if (SET.motion) requestAnimationFrame(tick); else { x.drawImage(S.ground, 0, 0, BDW, BDH); BACKDROP[kind].live(x, S, 0); }
}
// ---------- brushes shared by the rooms ----------
function bdWindowLight(x, wx, wy, ww, wh, warm) {
  const g = x.createLinearGradient(wx, wy, wx - 60, wy + wh + 120); g.addColorStop(0, warm ? 'rgba(255,230,170,.35)' : 'rgba(220,235,255,.28)'); g.addColorStop(1, 'rgba(255,230,170,0)');
  x.fillStyle = g; x.beginPath(); x.moveTo(wx, wy); x.lineTo(wx + ww, wy); x.lineTo(wx + ww - 50, wy + wh + 140); x.lineTo(wx - 110, wy + wh + 140); x.closePath(); x.fill();
}
function bdArchWindow(x, wx, wy, ww, wh, glass) {
  x.fillStyle = '#2a2420'; x.beginPath(); x.moveTo(wx, wy + wh); x.lineTo(wx, wy + ww / 2); x.arc(wx + ww / 2, wy + ww / 2, ww / 2, 3.14, 0); x.lineTo(wx + ww, wy + wh); x.closePath(); x.fill();
  if (glass) { const cols = ['#8e1f1b', '#2e4a86', '#e2b33c', '#3f6b35']; for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) { x.fillStyle = cols[(r + c * 2) % 4]; x.globalAlpha = .85; x.fillRect(wx + 3 + c * (ww - 6) / 3, wy + ww / 2 + r * (wh - ww / 2) / 6, (ww - 6) / 3 - 1, (wh - ww / 2) / 6 - 1); } x.globalAlpha = 1; x.fillStyle = '#e2b33c'; x.beginPath(); x.arc(wx + ww / 2, wy + ww / 2, ww / 4, 0, 7); x.fill(); }
  else { const g = x.createLinearGradient(wx, wy, wx, wy + wh); g.addColorStop(0, '#dbe6e4'); g.addColorStop(1, '#9fc1dd'); x.fillStyle = g; x.beginPath(); x.moveTo(wx + 3, wy + wh); x.lineTo(wx + 3, wy + ww / 2); x.arc(wx + ww / 2, wy + ww / 2, ww / 2 - 3, 3.14, 0); x.lineTo(wx + ww - 3, wy + wh); x.closePath(); x.fill(); x.strokeStyle = '#2a2420'; x.lineWidth = 2; x.beginPath(); x.moveTo(wx + ww / 2, wy + 3); x.lineTo(wx + ww / 2, wy + wh); x.stroke(); }
}
function bdColumn(x, cx, top, bottom, w) {
  const g = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0); g.addColorStop(0, '#6e6558'); g.addColorStop(.35, '#b5ab95'); g.addColorStop(1, '#5c5444');
  x.fillStyle = g; x.fillRect(cx - w / 2, top, w, bottom - top);
  x.fillStyle = '#8b816c'; x.fillRect(cx - w / 2 - 4, top, w + 8, 8); x.fillRect(cx - w / 2 - 3, bottom - 8, w + 6, 8);
}
function bdCandle(x, cx, cy, h, t, seed) {
  x.fillStyle = '#f3e8cc'; x.fillRect(cx - 2.5, cy - h, 5, h);
  const fl = 1 + Math.sin(t * 13 + seed) * .15, lean = Math.sin(t * 9 + seed * 2) * 1.2;
  const g = x.createRadialGradient(cx, cy - h - 6, 1, cx, cy - h - 6, 26); g.addColorStop(0, 'rgba(255,220,140,.5)'); g.addColorStop(1, 'rgba(255,200,100,0)'); x.fillStyle = g; x.fillRect(cx - 26, cy - h - 32, 52, 52);
  x.fillStyle = '#ffb347'; x.beginPath(); x.moveTo(cx - 3, cy - h); x.quadraticCurveTo(cx - 3 + lean, cy - h - 8 * fl, cx + lean, cy - h - 12 * fl); x.quadraticCurveTo(cx + 3 + lean, cy - h - 8 * fl, cx + 3, cy - h); x.fill();
  x.fillStyle = '#fff3c4'; x.beginPath(); x.moveTo(cx - 1.4, cy - h); x.quadraticCurveTo(cx - 1.4 + lean * .6, cy - h - 5 * fl, cx + lean * .6, cy - h - 7 * fl); x.quadraticCurveTo(cx + 1.4 + lean * .6, cy - h - 5 * fl, cx + 1.4, cy - h); x.fill();
}
function bdHangingBanner(x, fid, bx, by, w, h, t) {
  const spr = armsSprite(fid);
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(bx + 4, by + 4, w, h);
  x.fillStyle = FAC(fid).color; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + w, by); x.lineTo(bx + w, by + h - 10); x.lineTo(bx + w / 2, by + h + Math.sin(t * 2 + bx) * 2); x.lineTo(bx, by + h - 10); x.closePath(); x.fill();
  x.strokeStyle = '#e2b33c'; x.lineWidth = 2; x.stroke();
  if (spr) x.drawImage(spr, bx + w / 2 - 14, by + 10, 28, 34);
  x.fillStyle = '#5a3e24'; x.fillRect(bx - 4, by - 4, w + 8, 4);
}
function bdPerson(x, px, py, k, col, c2, type, flip, variant, frame) { figureAt(x, px, py, k, 0, col, c2, type, frame || 0, flip, variant || 0); }
// ---------- the rooms ----------
const BACKDROP = {
  // the great hall: columns, tall windows, your banners, a dais with the chair of state, a hearth
  court: {
    paint(x, S) {
      const g = x.createLinearGradient(0, 0, 0, BDH); g.addColorStop(0, '#3a2c22'); g.addColorStop(.55, '#5e4a38'); g.addColorStop(1, '#2b1f17'); x.fillStyle = g; x.fillRect(0, 0, BDW, BDH);
      x.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 40; i++) x.fillRect((i * 97) % BDW, (i * 41) % 130, 30, 12);
      // floor
      const f = x.createLinearGradient(0, 130, 0, BDH); f.addColorStop(0, '#6e5a44'); f.addColorStop(1, '#3a2c22'); x.fillStyle = f; x.fillRect(0, 130, BDW, BDH - 130);
      x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1; for (let i = -6; i < 14; i++) { x.beginPath(); x.moveTo(400 + (i - 4) * 30, 130); x.lineTo(400 + (i - 4) * 110, BDH); x.stroke(); } for (let yy = 140; yy < BDH; yy += 14) { x.beginPath(); x.moveTo(0, yy); x.lineTo(BDW, yy); x.stroke(); }
      // the red carpet to the dais
      x.fillStyle = '#7a1e1a'; x.beginPath(); x.moveTo(360, 130); x.lineTo(440, 130); x.lineTo(520, BDH); x.lineTo(280, BDH); x.fill(); x.strokeStyle = '#e2b33c'; x.lineWidth = 1.5; x.stroke();
      for (const wx of [60, 190, 610, 740]) { bdArchWindow(x, wx - 16, 22, 32, 90, false); }
      for (const wx of [60, 190]) bdWindowLight(x, wx - 16, 22, 32, 90, S.hour !== 'day');
      for (const cx of [125, 275, 525, 675]) bdColumn(x, cx, 0, 136, 22);
      // the dais and the chair
      x.fillStyle = '#5a4634'; x.fillRect(330, 112, 140, 22); x.fillStyle = '#7a6350'; x.fillRect(330, 112, 140, 4);
      x.fillStyle = '#3a2817'; x.fillRect(378, 62, 44, 56); x.fillRect(372, 100, 56, 16); x.fillStyle = '#8e1f1b'; x.fillRect(384, 70, 32, 40); x.fillStyle = '#e2b33c'; x.fillRect(378, 58, 44, 5); x.beginPath(); x.arc(400, 56, 6, 0, 7); x.fill();
      // the hearth
      x.fillStyle = '#2a2420'; x.fillRect(700, 60, 70, 76); x.fillStyle = '#6e6558'; x.fillRect(694, 54, 82, 8); x.fillRect(694, 54, 8, 82); x.fillRect(768, 54, 8, 82);
      x.font = '600 11px Cinzel, serif'; x.fillStyle = 'rgba(226,179,60,.35)'; x.textAlign = 'center';
    },
    live(x, S, dt) {
      const me_ = me(), t = S.t;
      for (const bx of [150, 240, 520, 610]) bdHangingBanner(x, me_, bx, 10, 40, 60, t);
      for (const [cx, h] of [[345, 30], [455, 30], [300, 22], [500, 22]]) bdCandle(x, cx, 112, h, t, cx);
      paintFlame(x, 735, 134, 34, 40, t, 7); paintFlame(x, 722, 136, 18, 24, t, 3);
      // the household: a steward, a clerk and two men-at-arms by the columns
      const F = FAC(me_), c2 = F.arms && F.arms.c || '#f3e8cc';
      bdPerson(x, 150, 190, 1.05, F.color, c2, 'foot', false, 1, 0); bdPerson(x, 650, 190, 1.05, F.color, c2, 'foot', true, 2, 0);
      bdPerson(x, 440, 150, .8, '#6b5a3a', '#f3e8cc', 'militia', true, 4, 0);
      // the hour's light falls across the floor
      if (S.hour === 'dusk') { x.fillStyle = 'rgba(240,150,80,.08)'; x.fillRect(0, 0, BDW, BDH); }
    },
  },
  // the basilica: the apse in gold, the altar and its candles, incense rising
  church: {
    paint(x, S) {
      const g = x.createLinearGradient(0, 0, 0, BDH); g.addColorStop(0, '#2a2018'); g.addColorStop(.5, '#4a3a2a'); g.addColorStop(1, '#2b1f17'); x.fillStyle = g; x.fillRect(0, 0, BDW, BDH);
      // the apse: a half-dome of gold mosaic
      const ap = x.createRadialGradient(400, 120, 10, 400, 120, 230); ap.addColorStop(0, '#f0cf6a'); ap.addColorStop(.6, '#b8892c'); ap.addColorStop(1, '#5a4515'); x.fillStyle = ap; x.beginPath(); x.arc(400, 130, 220, 3.14, 0); x.fill();
      x.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 400; i++) { const a = Math.random() * 3.14 + 3.14, r = 40 + Math.random() * 175; x.fillRect(400 + Math.cos(a) * r, 130 + Math.sin(a) * r, 3, 3); }
      // a figure in the mosaic: a haloed saint, arms raised
      x.fillStyle = '#f3e8cc'; x.beginPath(); x.arc(400, 48, 18, 0, 7); x.fill(); x.fillStyle = '#2e4a86'; x.beginPath(); x.moveTo(380, 130); x.lineTo(386, 70); x.lineTo(414, 70); x.lineTo(420, 130); x.fill(); x.fillStyle = '#e5c29a'; x.beginPath(); x.arc(400, 52, 9, 0, 7); x.fill(); x.strokeStyle = '#2e4a86'; x.lineWidth = 6; x.beginPath(); x.moveTo(388, 78); x.lineTo(368, 60); x.moveTo(412, 78); x.lineTo(432, 60); x.stroke();
      // columns either side, the floor, the altar
      for (const cx of [120, 230, 570, 680]) bdColumn(x, cx, 0, 150, 24);
      const f = x.createLinearGradient(0, 140, 0, BDH); f.addColorStop(0, '#9a8f7a'); f.addColorStop(1, '#5a5244'); x.fillStyle = f; x.fillRect(0, 140, BDW, BDH - 140);
      x.fillStyle = 'rgba(0,0,0,.2)'; for (let i = 0; i < 20; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) x.fillRect(i * 40, 140 + j * 12, 40, 12);
      x.fillStyle = '#e8dcc0'; x.fillRect(340, 118, 120, 30); x.fillStyle = '#8e1f1b'; x.fillRect(340, 118, 120, 6); x.fillStyle = '#e2b33c'; x.fillRect(392, 96, 16, 24); x.fillRect(386, 102, 28, 5);
      for (const wx of [40, 740]) bdArchWindow(x, wx, 20, 28, 100, true);
      bdWindowLight(x, 40, 20, 28, 100, true);
    },
    live(x, S, dt) {
      const t = S.t;
      for (const cx of [352, 372, 428, 448]) bdCandle(x, cx, 118, 18, t, cx);
      S.inc = S.inc || []; if (Math.random() < .12) S.inc.push({ x: 400 + (Math.random() - .5) * 20, y: 118, r: 3, a: .22, vx: (Math.random() - .5) * 6, vy: -14, t: 0 });
      S.inc = S.inc.filter(s => s.t < 2.6); for (const s of S.inc) { s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += 5 * dt; x.fillStyle = `rgba(220,210,200,${Math.max(0, s.a * (1 - s.t / 2.6))})`; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fill(); }
      // two clerics at the altar steps
      bdPerson(x, 300, 192, 1, '#f3e8cc', '#8e1f1b', 'militia', false, 3, 0); bdPerson(x, 500, 192, 1, '#8e1f1b', '#e2b33c', 'militia', true, 5, 0);
      const sh = Math.sin(t * .5) * .02; x.fillStyle = `rgba(255,220,150,${.06 + sh})`; x.fillRect(0, 0, BDW, BDH);
    },
  },
  // the parley: striped pavilions on a meadow at first light, two standards facing, a table between
  envoys: {
    paint(x, S) {
      const sk = PAL.sky[S.hour]; const g = x.createLinearGradient(0, 0, 0, 110); g.addColorStop(0, sk[0]); g.addColorStop(.7, sk[1]); g.addColorStop(1, sk[2]); x.fillStyle = g; x.fillRect(0, 0, BDW, 112);
      x.fillStyle = PAL.far[S.season][0]; x.beginPath(); x.moveTo(0, 112); for (let i = 0; i <= 16; i++) x.lineTo(i * 50, 100 - Math.abs(Math.sin(i * 1.3 + S.seed)) * 22); x.lineTo(BDW, 112); x.fill();
      x.fillStyle = PAL.tree[S.season][0]; for (let i = 0; i < 60; i++) { x.beginPath(); x.arc(i * 14, 108, 5 + (i % 3) * 2, 0, 7); x.fill(); }
      const gp = PAL.ground[S.season]; const gr = x.createLinearGradient(0, 105, 0, BDH); gr.addColorStop(0, gp[0]); gr.addColorStop(1, gp[1]); x.fillStyle = gr; x.fillRect(0, 105, BDW, BDH - 105);
      x.fillStyle = 'rgba(255,250,200,.12)'; for (let i = 0; i < 14; i++) { x.beginPath(); x.ellipse((i * 131) % BDW, 120 + (i * 37) % 70, 40, 6, 0, 0, 7); x.fill(); }
      // two pavilions
      const tent = (tx, col) => { x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(tx + 10, 168, 70, 10, 0, 0, 7); x.fill(); x.fillStyle = '#e8dcc0'; x.beginPath(); x.moveTo(tx - 60, 165); x.lineTo(tx - 50, 100); x.lineTo(tx, 56); x.lineTo(tx + 50, 100); x.lineTo(tx + 60, 165); x.fill(); x.fillStyle = col; for (let i = -2; i <= 2; i += 2) { x.beginPath(); x.moveTo(tx + i * 14 - 6 - (i * 5), 165); x.lineTo(tx + i * 7 - 3, 100); x.lineTo(tx + i * 7 + 3, 100); x.lineTo(tx + i * 14 + 6 - (i * 5), 165); x.fill(); } x.fillStyle = '#5a3e24'; x.fillRect(tx - 1.5, 40, 3, 20); x.fillStyle = '#2a1d12'; x.beginPath(); x.moveTo(tx - 12, 165); x.lineTo(tx, 120); x.lineTo(tx + 12, 165); x.fill(); };
      tent(140, FAC(me()).color); tent(660, S.opts.fid ? FAC(S.opts.fid).color : '#6b5a3a');
      // the table with a charter and a flagon
      x.fillStyle = '#5a3e24'; x.fillRect(350, 150, 100, 8); x.fillRect(360, 158, 6, 24); x.fillRect(434, 158, 6, 24); x.fillStyle = '#f3e8cc'; x.fillRect(372, 144, 30, 8); x.fillStyle = '#8e1f1b'; x.beginPath(); x.arc(398, 148, 3, 0, 7); x.fill(); x.fillStyle = '#9a9a9a'; x.fillRect(420, 138, 8, 14);
    },
    live(x, S, dt) {
      const t = S.t;
      drawBanner(x, me(), 250, 70, 100, false, t, 1.1); if (S.opts.fid) drawBanner(x, S.opts.fid, 550, 70, 100, true, t + 1, 1.1);
      const F = FAC(me()), c2 = F.arms && F.arms.c || '#f3e8cc'; const o = S.opts.fid ? FAC(S.opts.fid) : null;
      bdPerson(x, 300, 188, 1.05, F.color, c2, 'foot', false, 1, 0); bdPerson(x, 330, 180, .95, F.color, c2, 'cav', false, 2, Math.floor(t * 3) % 4 ? 0 : 0);
      if (o) { bdPerson(x, 500, 188, 1.05, o.color, o.arms && o.arms.c || '#f3e8cc', 'foot', true, 3, 0); bdPerson(x, 470, 180, .95, o.color, o.arms && o.arms.c || '#f3e8cc', 'cav', true, 4, 0); }
      else bdPerson(x, 500, 188, 1.05, '#6b5a3a', '#f3e8cc', 'militia', true, 3, 0);
      // birds over the hills
      S.birds = S.birds || [{ x: -40, y: 40 }, { x: 300, y: 28 }]; for (const b of S.birds) { b.x += 14 * dt; if (b.x > BDW + 40) b.x = -60; x.strokeStyle = 'rgba(40,30,20,.5)'; x.lineWidth = 1; for (let i = 0; i < 4; i++) { const bx = b.x + i * 9, by = b.y + i * 2, fl = Math.sin(t * 7 + i) * 2; x.beginPath(); x.moveTo(bx - 3, by - fl); x.lineTo(bx, by); x.lineTo(bx + 3, by - fl); x.stroke(); } }
    },
  },
  // the fair: a market square, awnings, carts, a crowd, bunting across the street
  fair: {
    paint(x, S) {
      const sk = PAL.sky.day; const g = x.createLinearGradient(0, 0, 0, 90); g.addColorStop(0, sk[0]); g.addColorStop(1, sk[2]); x.fillStyle = g; x.fillRect(0, 0, BDW, 90);
      // the houses of the square
      const house = (hx, w, h, col, half) => { x.fillStyle = col; x.fillRect(hx, 90 - h, w, h + 40); x.fillStyle = '#6e3a2a'; x.beginPath(); x.moveTo(hx - 4, 90 - h); x.lineTo(hx + w / 2, 90 - h - w * .45); x.lineTo(hx + w + 4, 90 - h); x.fill(); if (half) { x.strokeStyle = '#5a3e24'; x.lineWidth = 2; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(hx + i * w / 4, 90 - h); x.lineTo(hx + i * w / 4, 130); x.stroke(); } x.beginPath(); x.moveTo(hx, 110); x.lineTo(hx + w, 110); x.stroke(); } x.fillStyle = '#2a2420'; for (let i = 0; i < Math.floor(w / 22); i++) x.fillRect(hx + 8 + i * 22, 100 - h + 10, 8, 12); };
      house(0, 90, 50, '#d9c5a0', true); house(96, 70, 40, '#c9b48a', false); house(172, 110, 60, '#e3d4b4', true); house(520, 90, 46, '#d6c39f', true); house(616, 80, 56, '#c9b48a', false); house(702, 100, 44, '#e3d4b4', true);
      // the church tower over the roofs
      x.fillStyle = '#9a9184'; x.fillRect(380, 10, 44, 120); x.fillStyle = '#5c5444'; x.beginPath(); x.moveTo(374, 12); x.lineTo(402, -30); x.lineTo(430, 12); x.fill(); x.fillStyle = '#2a2420'; x.fillRect(396, 40, 12, 20);
      // cobbles
      const f = x.createLinearGradient(0, 128, 0, BDH); f.addColorStop(0, '#a89a7a'); f.addColorStop(1, '#7d7257'); x.fillStyle = f; x.fillRect(0, 128, BDW, BDH - 128);
      x.fillStyle = 'rgba(0,0,0,.1)'; for (let i = 0; i < 160; i++) { x.beginPath(); x.ellipse((i * 53) % BDW, 134 + (i * 29) % 66, 7, 3, 0, 0, 7); x.fill(); }
      // stalls with striped awnings
      const stall = (sx, c1) => { x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(sx - 2, 166, 94, 8); x.fillStyle = '#6b4a2b'; x.fillRect(sx, 136, 90, 30); x.fillStyle = '#5a3e24'; x.fillRect(sx + 2, 120, 4, 46); x.fillRect(sx + 84, 120, 4, 46); x.fillStyle = c1; x.beginPath(); x.moveTo(sx - 6, 122); x.lineTo(sx + 96, 122); x.lineTo(sx + 92, 108); x.lineTo(sx - 2, 108); x.fill(); x.fillStyle = '#f3e8cc'; for (let i = 0; i < 5; i += 2) x.fillRect(sx + 4 + i * 18, 109, 16, 13); x.fillStyle = c1; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(sx - 6 + i * 17 + 8, 122, 6, 0, 3.14); x.fill(); } };
      stall(40, '#8e1f1b'); stall(230, '#2e4a86'); stall(480, '#3f6b35'); stall(670, '#b8892c');
      // goods on the boards
      const goods = ['#c9a85a', '#8e1f1b', '#e0c272', '#6b4a2b', '#9fd57f', '#b06a3a']; for (let i = 0; i < 24; i++) { x.fillStyle = goods[i % 6]; x.beginPath(); x.arc(50 + (i * 31) % 720, 134 + (i % 3) * 3, 4 + (i % 3), 0, 7); x.fill(); }
      // a cart
      x.fillStyle = '#7a5433'; x.fillRect(560, 150, 60, 20); x.fillStyle = '#3a2817'; x.beginPath(); x.arc(575, 174, 10, 0, 7); x.arc(608, 174, 10, 0, 7); x.fill(); x.fillStyle = '#c9a85a'; x.beginPath(); x.arc(590, 150, 18, 3.14, 0); x.fill();
    },
    live(x, S, dt) {
      const t = S.t;
      // bunting across the square
      x.lineWidth = 1.2; x.strokeStyle = '#3a2817'; x.beginPath(); x.moveTo(0, 60); x.quadraticCurveTo(400, 100, BDW, 60); x.stroke();
      const cols = ['#8e1f1b', '#2e4a86', '#e2b33c', '#3f6b35', '#f3e8cc']; for (let i = 0; i < 30; i++) { const f = i / 29, bx = f * BDW, by = 60 + 4 * (1 - (2 * f - 1) ** 2) * 10 * .5 + (1 - (2 * f - 1) ** 2) * 20 - 2; const sw = Math.sin(t * 4 + i) * 2; x.fillStyle = cols[i % 5]; x.beginPath(); x.moveTo(bx - 5, by); x.lineTo(bx + 5, by); x.lineTo(bx + sw, by + 11); x.fill(); }
      // the crowd, each with somewhere to be
      S.folk = S.folk || Array.from({ length: 11 }, (_, i) => ({ x: Math.random() * BDW, y: 170 + Math.random() * 22, v: (Math.random() < .5 ? -1 : 1) * (6 + Math.random() * 10), c: cols[i % 5], ty: ['militia', 'bow', 'militia', 'foot'][i % 4], k: i }));
      for (const p of S.folk) { p.x += p.v * dt; if (p.x < -20) { p.x = BDW + 20; } if (p.x > BDW + 20) p.x = -20; bdPerson(x, p.x, p.y + 10, .85, p.c, '#f3e8cc', p.ty, p.v < 0, p.k, Math.floor(t * 6 + p.k) % 2); }
      bdPerson(x, 95, 180, 1, '#6b5a3a', '#f3e8cc', 'militia', false, 7, 0); bdPerson(x, 285, 180, 1, '#8e1f1b', '#f3e8cc', 'militia', true, 8, 0); bdPerson(x, 535, 180, 1, '#3f6b35', '#f3e8cc', 'militia', false, 9, 0); bdPerson(x, 725, 180, 1, '#b8892c', '#f3e8cc', 'militia', true, 10, 0);
    },
  },
  // the eve of battle: two hosts camped across a darkening field, fires lit, standards planted
  eve: {
    paint(x, S) {
      const sk = PAL.sky.dusk; const g = x.createLinearGradient(0, 0, 0, 110); g.addColorStop(0, sk[0]); g.addColorStop(.65, sk[1]); g.addColorStop(1, sk[2]); x.fillStyle = g; x.fillRect(0, 0, BDW, 112);
      const gl = x.createRadialGradient(560, 104, 0, 560, 104, 160); gl.addColorStop(0, 'rgba(255,200,120,.6)'); gl.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = gl; x.fillRect(0, 0, BDW, 112); x.fillStyle = '#ffd9a0'; x.beginPath(); x.arc(560, 104, 16, 3.14, 0); x.fill();
      x.fillStyle = '#4a3f56'; x.beginPath(); x.moveTo(0, 112); for (let i = 0; i <= 16; i++) x.lineTo(i * 50, 104 - Math.abs(Math.sin(i * 1.1 + S.seed)) * 18); x.lineTo(BDW, 112); x.fill();
      const gp = PAL.ground[S.season]; const gr = x.createLinearGradient(0, 100, 0, BDH); gr.addColorStop(0, mix(gp[1], '#2a1d2e', .45)); gr.addColorStop(1, mix(gp[2], '#1a1218', .5)); x.fillStyle = gr; x.fillRect(0, 100, BDW, BDH - 100);
      const tent = (tx, ty, k, col) => { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(tx + 4 * k, ty + 2, 30 * k, 6 * k, 0, 0, 7); x.fill(); x.fillStyle = mix('#e8dcc0', '#2a1d2e', .35); x.beginPath(); x.moveTo(tx - 28 * k, ty); x.lineTo(tx, ty - 40 * k); x.lineTo(tx + 28 * k, ty); x.fill(); x.fillStyle = mix(col, '#2a1d2e', .3); x.beginPath(); x.moveTo(tx - 6 * k, ty); x.lineTo(tx, ty - 40 * k); x.lineTo(tx + 6 * k, ty); x.fill(); x.fillStyle = '#120c10'; x.beginPath(); x.moveTo(tx - 7 * k, ty); x.lineTo(tx, ty - 16 * k); x.lineTo(tx + 7 * k, ty); x.fill(); };
      const mine = FAC(me()).color, theirs = S.opts.fid ? FAC(S.opts.fid).color : '#6b5a3a';
      for (const [tx, ty, k] of [[60, 128, .7], [130, 150, .9], [40, 175, 1.1], [200, 132, .75]]) tent(tx, ty, k, mine);
      for (const [tx, ty, k] of [[740, 128, .7], [670, 150, .9], [760, 175, 1.1], [600, 132, .75]]) tent(tx, ty, k, theirs);
      // the field between, with a stream catching the last light
      x.strokeStyle = 'rgba(240,180,120,.35)'; x.lineWidth = 5; x.beginPath(); x.moveTo(300, 112); x.bezierCurveTo(380, 150, 420, 160, 500, 200); x.stroke();
      x.fillStyle = 'rgba(0,0,0,.2)'; for (let i = 0; i < 16; i++) { x.beginPath(); x.ellipse((i * 131) % BDW, 120 + (i * 37) % 70, 30, 5, 0, 0, 7); x.fill(); }
    },
    live(x, S, dt) {
      const t = S.t;
      for (const [fx, fy, k] of [[100, 170, 1], [170, 190, .8], [640, 190, .8], [700, 170, 1]]) { const gl = x.createRadialGradient(fx, fy - 6, 2, fx, fy - 6, 60 * k); gl.addColorStop(0, 'rgba(255,170,80,.35)'); gl.addColorStop(1, 'rgba(255,170,80,0)'); x.fillStyle = gl; x.fillRect(fx - 60, fy - 66, 120, 120); paintFlame(x, fx, fy, 14 * k, 20 * k, t, fx); x.fillStyle = '#3a2817'; x.fillRect(fx - 9 * k, fy - 2, 18 * k, 3); }
      S.emb = S.emb || []; if (Math.random() < .3) S.emb.push({ x: pick([100, 170, 640, 700]) + (Math.random() - .5) * 10, y: 168, vy: -30 - Math.random() * 30, vx: (Math.random() - .5) * 12, t: 0 }); S.emb = S.emb.filter(e => e.t < 1.6); for (const e of S.emb) { e.t += dt; e.x += e.vx * dt; e.y += e.vy * dt; x.fillStyle = `rgba(255,${160 + Math.round(60 * (1 - e.t))},60,${Math.max(0, 1 - e.t / 1.6)})`; x.fillRect(e.x, e.y, 2, 2); }
      drawBanner(x, me(), 250, 95, 90, false, t, 1); if (S.opts.fid) drawBanner(x, S.opts.fid, 550, 95, 90, true, t + 1, 1); else { x.strokeStyle = '#2a1d12'; x.lineWidth = 2.6; x.beginPath(); x.moveTo(550, 185); x.lineTo(550, 90); x.stroke(); x.fillStyle = '#6b5a3a'; x.fillRect(524, 96, 26, 30); }
      const F = FAC(me()), c2 = F.arms && F.arms.c || '#f3e8cc'; bdPerson(x, 290, 192, 1.05, F.color, c2, 'foot', false, 1, 0); bdPerson(x, 330, 186, .95, F.color, c2, 'bow', false, 2, 0);
      const o = S.opts.fid ? FAC(S.opts.fid) : null; bdPerson(x, 510, 192, 1.05, o ? o.color : '#6b5a3a', o && o.arms && o.arms.c || '#f3e8cc', o ? 'foot' : 'militia', true, 3, 0); bdPerson(x, 470, 186, .95, o ? o.color : '#6b5a3a', '#f3e8cc', o ? 'cav' : 'militia', true, 4, 0);
      S.stars = S.stars || Array.from({ length: 30 }, () => [Math.random() * BDW, Math.random() * 60, Math.random() * 6]); x.fillStyle = '#fff'; for (const [sx, sy, w] of S.stars) { x.globalAlpha = .3 + .5 * Math.abs(Math.sin(t * 1.5 + w)); x.fillRect(sx, sy, 1.5, 1.5); } x.globalAlpha = 1;
    },
  },
  // the bower: a walled garden under a tower, roses on a trellis, doves, a lady on a bench
  bower: {
    paint(x, S) {
      const sk = PAL.sky[S.hour]; const g = x.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, sk[0]); g.addColorStop(1, sk[2]); x.fillStyle = g; x.fillRect(0, 0, BDW, 100);
      // the tower and the garden wall
      stoneFace(x, 600, 0, 90, 150, '#a69e8c', 4); x.fillStyle = '#6e3a2a'; x.beginPath(); x.moveTo(592, 4); x.lineTo(645, -40); x.lineTo(698, 4); x.fill(); x.fillStyle = '#2a2420'; x.fillRect(636, 40, 16, 26); x.beginPath(); x.arc(644, 40, 8, 3.14, 0); x.fill();
      stoneFace(x, 0, 70, BDW, 60, '#b5ab95', 11); x.fillStyle = '#8b816c'; for (let i = 0; i < 40; i++) if (i % 2) x.fillRect(i * 20, 62, 20, 10);
      const gp = PAL.ground[S.season === 3 ? 0 : S.season]; const gr = x.createLinearGradient(0, 128, 0, BDH); gr.addColorStop(0, gp[0]); gr.addColorStop(1, gp[1]); x.fillStyle = gr; x.fillRect(0, 128, BDW, BDH - 128);
      // a gravel walk and beds of flowers
      x.fillStyle = '#d9c59a'; x.fillRect(0, 160, BDW, 14); x.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 80; i++) x.fillRect((i * 37) % BDW, 162 + (i * 7) % 10, 3, 2);
      const fl = ['#f2d36b', '#fff6c8', '#e8a1b4', '#b8342c', '#cfe0ff']; for (let i = 0; i < 120; i++) { x.fillStyle = fl[i % 5]; x.beginPath(); x.arc((i * 61) % BDW, 136 + (i * 13) % 20, 2.5, 0, 7); x.fill(); x.fillStyle = fl[(i + 2) % 5]; x.beginPath(); x.arc((i * 83) % BDW, 180 + (i * 11) % 16, 2.5, 0, 7); x.fill(); }
      // the trellis with roses
      x.strokeStyle = '#8a6a42'; x.lineWidth = 2; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(60 + i * 24, 20); x.lineTo(60 + i * 24, 130); x.stroke(); x.beginPath(); x.moveTo(50, 30 + i * 14); x.lineTo(240, 30 + i * 14); x.stroke(); }
      for (let i = 0; i < 60; i++) { x.fillStyle = i % 3 ? '#3f6b35' : '#5d7c33'; x.beginPath(); x.arc(55 + (i * 47) % 190, 25 + (i * 29) % 105, 6, 0, 7); x.fill(); } for (let i = 0; i < 26; i++) { x.fillStyle = i % 2 ? '#c8365a' : '#f0a3b8'; x.beginPath(); x.arc(60 + (i * 53) % 180, 30 + (i * 37) % 95, 4, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(59 + (i * 53) % 180, 29 + (i * 37) % 95, 1.3, 0, 7); x.fill(); }
      // a stone bench and a fountain
      x.fillStyle = '#b5ab95'; x.fillRect(330, 140, 90, 10); x.fillRect(338, 150, 10, 16); x.fillRect(402, 150, 10, 16);
      x.fillStyle = '#9a9184'; x.beginPath(); x.ellipse(520, 150, 40, 12, 0, 0, 7); x.fill(); x.fillStyle = '#5c8a94'; x.beginPath(); x.ellipse(520, 148, 34, 8, 0, 0, 7); x.fill(); x.fillStyle = '#b5ab95'; x.fillRect(516, 110, 8, 38); x.beginPath(); x.ellipse(520, 110, 14, 4, 0, 0, 7); x.fill();
    },
    live(x, S, dt) {
      const t = S.t;
      // the lady on the bench and her suitor's man at the gate
      x.fillStyle = '#2e4a86'; x.beginPath(); x.moveTo(360, 150); x.lineTo(366, 112); x.lineTo(392, 112); x.lineTo(400, 150); x.fill(); x.fillStyle = '#e5c29a'; x.beginPath(); x.arc(379, 104, 8, 0, 7); x.fill(); x.fillStyle = '#f3e8cc'; x.beginPath(); x.moveTo(368, 100); x.quadraticCurveTo(379, 84, 390, 100); x.lineTo(392, 124); x.lineTo(366, 124); x.fill(); x.fillStyle = '#e2b33c'; x.fillRect(369, 98, 20, 3);
      const F = FAC(me()), c2 = F.arms && F.arms.c || '#f3e8cc'; bdPerson(x, 300, 192, 1.05, F.color, c2, 'foot', false, 1, 0);
      // the fountain plays, and doves come and go
      x.strokeStyle = 'rgba(220,240,255,.8)'; x.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(520, 106); x.quadraticCurveTo(520 + i * 12, 96 + Math.sin(t * 6 + i) * 2, 520 + i * 16, 146); x.stroke(); }
      S.doves = S.doves || [{ x: 100, y: 30, v: 22 }, { x: 500, y: 50, v: -18 }, { x: 700, y: 20, v: 16 }]; for (const d of S.doves) { d.x += d.v * dt; if (d.x > BDW + 30) d.x = -30; if (d.x < -30) d.x = BDW + 30; const fl = Math.sin(t * 9 + d.x) * 3; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(d.x - 6, d.y - fl); x.lineTo(d.x, d.y); x.lineTo(d.x + 6, d.y - fl); x.stroke(); }
      // petals on the breeze
      S.pet = S.pet || Array.from({ length: 14 }, () => ({ x: Math.random() * BDW, y: Math.random() * BDH, w: Math.random() * 6 })); for (const p of S.pet) { p.x += 10 * dt; p.y += (6 + Math.sin(t + p.w) * 4) * dt; if (p.y > BDH) { p.y = -4; p.x = Math.random() * BDW; } x.fillStyle = 'rgba(240,163,184,.8)'; x.beginPath(); x.ellipse(p.x, p.y, 3, 1.6, t + p.w, 0, 7); x.fill(); }
    },
  },
};

// ---------- the dialogs that open on a picture ----------
// each opener is wrapped rather than edited, so the rooms sit on top of the rules untouched
{
  const wrap = (name, kind, optsFn) => { const orig = window[name]; if (typeof orig !== 'function') return; window[name] = function (...a) { const r = orig.apply(this, a); if (modalOpen() && $('#mcard h2')) addBackdrop(kind, optsFn ? optsFn(...a) : {}); return r; }; };
  wrap('openCourt', 'court');
  wrap('openPope', 'church');
  wrap('openDiplo', 'envoys', () => ({ fid: typeof DP !== 'undefined' && DP.f !== 'me' ? DP.f : null }));
  wrap('drawFair', 'fair');
  wrap('openFair', 'fair');
  wrap('drawHaggle', 'envoys', () => ({ fid: typeof HG !== 'undefined' && HG ? (HG.with || HG.fid || HG.by || null) : null }));
  wrap('drawCourtship', 'bower');
  wrap('openPreBattle', 'eve', (kind, pid) => { const p = P(pid); return { fid: p.owner || null }; });
}
