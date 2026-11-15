'use strict';
// ================= SCENERY: the painted versions of the smaller scenes =================
// The raid, the mine and the charter keep their rules and their plan coordinates (minigames.js, dealings.js);
// only their drawing is replaced here, in the style of the battle scene. Loaded after them, so these
// definitions are the ones the game uses.

// ---------- shared brushes ----------
function paintSmoke(x, s, dt) { // s: {x,y,r,a,vx,vy,t}
  s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += 9 * dt;
  x.fillStyle = `rgba(70,60,55,${Math.max(0, s.a * (1 - s.t / 2.6))})`; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fill();
}
function paintFlame(x, fx, fy, w, h, t, seed) {
  for (let i = 0; i < 3; i++) {
    const ww = w * (1 - i * .28), hh = h * (1 - i * .3) * (1 + Math.sin(t * 11 + seed + i) * .15), lean = Math.sin(t * 7 + seed * 2 + i) * w * .18;
    x.fillStyle = i === 0 ? 'rgba(220,80,20,.85)' : i === 1 ? 'rgba(255,160,40,.9)' : 'rgba(255,235,150,.95)';
    x.beginPath(); x.moveTo(fx - ww / 2, fy); x.quadraticCurveTo(fx - ww * .55, fy - hh * .45, fx + lean, fy - hh); x.quadraticCurveTo(fx + ww * .55, fy - hh * .45, fx + ww / 2, fy); x.closePath(); x.fill();
  }
}
function paintHut(x, hx, hy, w, h, seed, burnt) {
  // a thatched cottage seen from above and a little to the south
  x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(hx + w * .55, hy + h * .55, w * .7, h * .35, 0, 0, 7); x.fill();
  x.fillStyle = burnt ? '#4a3a30' : '#c9a877'; x.fillRect(hx, hy, w, h);
  x.fillStyle = burnt ? '#2e2420' : (seed % 2 ? '#9a6b35' : '#8a5f2e'); x.beginPath(); x.moveTo(hx - 3, hy + 2); x.lineTo(hx + w / 2, hy - h * .75); x.lineTo(hx + w + 3, hy + 2); x.lineTo(hx + w + 3, hy + h * .35); x.lineTo(hx + w / 2, hy - h * .35); x.lineTo(hx - 3, hy + h * .35); x.closePath(); x.fill();
  if (!burnt) { x.strokeStyle = 'rgba(255,230,170,.25)'; x.lineWidth = 1; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(hx + 2 + i * w / 6, hy + 1); x.lineTo(hx + w / 2, hy - h * .7); x.stroke(); } x.fillStyle = '#3a2a1c'; x.fillRect(hx + w * .4, hy + h * .45, w * .2, h * .55); }
}
function paintTreeTop(x, tx, ty, r, season) {
  const tr = PAL.tree[season];
  x.fillStyle = 'rgba(0,0,0,.16)'; x.beginPath(); x.ellipse(tx + r * .35, ty + r * .35, r, r * .8, 0, 0, 7); x.fill();
  x.fillStyle = tr[0]; x.beginPath(); x.arc(tx, ty, r, 0, 7); x.fill();
  x.fillStyle = tr[1]; x.beginPath(); x.arc(tx - r * .25, ty - r * .25, r * .6, 0, 7); x.fill();
  x.fillStyle = 'rgba(255,255,220,.18)'; x.beginPath(); x.arc(tx - r * .35, ty - r * .4, r * .25, 0, 7); x.fill();
}
function paintLongship(x, t, crew, sail, rowing, seed) {
  // hull from above and a little to the side, prow to the right
  x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(4, 8, 40, 8, 0, 0, 7); x.fill();
  if (rowing) { x.strokeStyle = '#6b4a2b'; x.lineWidth = 1.6; for (let i = 0; i < 6; i++) { const ox = -24 + i * 9, ph = Math.sin(t * 5 + i * .6 + seed); x.beginPath(); x.moveTo(ox, -8); x.lineTo(ox - 6 + ph * 5, -20); x.moveTo(ox, 6); x.lineTo(ox - 6 + ph * 5, 18); x.stroke(); }
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-38, -3); x.quadraticCurveTo(-60, -6 + Math.sin(t * 3) * 3, -80, -2); x.moveTo(-38, 3); x.quadraticCurveTo(-60, 7, -82, 4); x.stroke(); }
  x.fillStyle = '#7a5433'; x.beginPath(); x.moveTo(-36, 0); x.quadraticCurveTo(-44, -14, -30, -16); x.lineTo(30, -12); x.quadraticCurveTo(46, -18, 50, -30); x.quadraticCurveTo(42, -8, 40, 2); x.quadraticCurveTo(0, 16, -36, 0); x.fill();
  x.strokeStyle = '#3a2817'; x.lineWidth = 1.3; x.stroke();
  x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1; for (let i = -3; i < 3; i++) { x.beginPath(); x.moveTo(-32, i * 3 - 2); x.quadraticCurveTo(0, i * 3 + 2, 36, i * 3 - 6); x.stroke(); }
  // the dragon's head and the shields along the gunwale
  x.fillStyle = '#5a3e24'; x.beginPath(); x.moveTo(48, -28); x.quadraticCurveTo(56, -36, 52, -40); x.lineTo(58, -38); x.quadraticCurveTo(60, -30, 52, -26); x.fill(); x.fillStyle = '#e2b33c'; x.beginPath(); x.arc(54, -36, 1.4, 0, 7); x.fill();
  for (let i = 0; i < 7; i++) { x.fillStyle = (i + seed) % 3 === 0 ? '#b8342c' : (i + seed) % 3 === 1 ? '#e8dcc0' : '#3d4f6e'; x.beginPath(); x.arc(-28 + i * 9.5, -10 + i * .6, 4, 0, 7); x.fill(); x.fillStyle = '#2a1d12'; x.beginPath(); x.arc(-28 + i * 9.5, -10 + i * .6, 1.2, 0, 7); x.fill(); }
  if (sail) { x.strokeStyle = '#2a1d12'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -10); x.lineTo(0, -44); x.stroke(); const bil = 4 + Math.sin(t * 2 + seed) * 2;
    x.fillStyle = '#c9b48a'; x.beginPath(); x.moveTo(-18, -42); x.lineTo(18, -42); x.quadraticCurveTo(22 + bil, -30, 18, -18); x.lineTo(-18, -18); x.quadraticCurveTo(-22 - bil, -30, -18, -42); x.fill();
    x.fillStyle = '#b8342c'; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-18 + i * 12, -42); x.lineTo(-12 + i * 12, -42); x.lineTo(-12 + i * 12, -18); x.lineTo(-18 + i * 12, -18); x.fill(); }
    x.strokeStyle = '#2a1d12'; x.lineWidth = 1; x.beginPath(); x.moveTo(-18, -42); x.lineTo(18, -42); x.stroke(); }
  x.fillStyle = '#d9c09a'; for (let i = 0; i < Math.min(crew, 6); i++) { x.beginPath(); x.arc(-22 + i * 9, -3, 2.6, 0, 7); x.fill(); x.fillStyle = '#8a7a66'; x.beginPath(); x.arc(-22 + i * 9, -4.2, 2.6, 3.1, 6.3); x.fill(); x.fillStyle = '#d9c09a'; }
}

// ================= THE RAID, PAINTED =================
function drawRaidGround(x, S) {
  const season = SEASON_K(), gp = PAL.ground[season];
  S.season = season;
  // the sea: deep water to the west, shoaling toward the sand
  const sea = x.createLinearGradient(0, 0, R_BEACH, 0); sea.addColorStop(0, '#2f5f74'); sea.addColorStop(.55, '#4f8a94'); sea.addColorStop(.92, '#8ac0b8'); sea.addColorStop(1, '#c9e0cf'); x.fillStyle = sea; x.fillRect(0, 0, R_BEACH + 10, RH);
  for (let i = 0; i < 26; i++) { const px = (i * 61) % (R_BEACH - 60) + 10, py = (i * 97) % RH; x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.ellipse(px, py, 30 + (i % 4) * 8, 6, 0, 0, 7); x.fill(); }
  x.strokeStyle = 'rgba(230,245,240,.4)'; x.lineWidth = 1.4; for (let i = 0; i < 34; i++) { const px = (i * 71) % (R_BEACH - 40), py = (i * 113) % RH; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + 9, py - 4, px + 18, py); x.stroke(); }
  // rocks off the point
  for (const [rx, ry, rr] of [[40, 30, 14], [62, 44, 9], [30, 410, 12]]) { x.fillStyle = '#4e4a44'; x.beginPath(); x.ellipse(rx, ry, rr, rr * .6, .3, 0, 7); x.fill(); x.fillStyle = '#6e6962'; x.beginPath(); x.ellipse(rx - 3, ry - 3, rr * .5, rr * .3, .3, 0, 7); x.fill(); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(rx, ry, rr + 4, rr * .6 + 3, .3, 0, 7); x.stroke(); }
  // the strand: wet sand, dry sand, dunes
  const shore = y => R_BEACH - 14 + Math.sin(y / 30) * 6;
  x.fillStyle = '#b8a37c'; x.beginPath(); x.moveTo(shore(0) - 8, 0); for (let y = 0; y <= RH; y += 10) x.lineTo(shore(y) - 8, y); x.lineTo(R_LAND, RH); x.lineTo(R_LAND, 0); x.fill();
  const sand = x.createLinearGradient(R_BEACH, 0, R_LAND, 0); sand.addColorStop(0, '#d9c59a'); sand.addColorStop(.5, '#e6d4a6'); sand.addColorStop(1, '#d6c38f'); x.fillStyle = sand; x.beginPath(); x.moveTo(shore(0) + 10, 0); for (let y = 0; y <= RH; y += 10) x.lineTo(shore(y) + 10, y); x.lineTo(R_LAND, RH); x.lineTo(R_LAND, 0); x.fill();
  x.fillStyle = 'rgba(120,90,50,.08)'; for (let i = 0; i < 60; i++) { x.beginPath(); x.ellipse(R_BEACH + 20 + (i * 37) % 95, (i * 53) % RH, 10, 2, 0, 0, 7); x.fill(); }
  // dune grass and the land beyond, with strips of field
  const land = x.createLinearGradient(R_LAND, 0, RW, 0); land.addColorStop(0, mix(gp[0], '#d6c38f', .3)); land.addColorStop(.2, gp[0]); land.addColorStop(1, gp[1]); x.fillStyle = land; x.fillRect(R_LAND - 6, 0, RW - R_LAND + 6, RH);
  x.strokeStyle = gp[2]; x.lineWidth = 1.4; for (let i = 0; i < 50; i++) { const px = R_LAND - 10 + (i * 29) % 40, py = (i * 47) % RH; x.beginPath(); x.moveTo(px, py); x.lineTo(px - 3, py - 8); x.moveTo(px, py); x.lineTo(px + 3, py - 9); x.moveTo(px, py); x.lineTo(px + 1, py - 11); x.stroke(); }
  for (const [fy, fh] of [[16, 60], [330, 70]]) { x.fillStyle = season === 3 ? '#d9d4c4' : season === 2 ? '#b89a5a' : '#c9b56a'; x.globalAlpha = .8; x.fillRect(R_LAND + 130, fy, 120, fh); x.globalAlpha = 1; x.strokeStyle = 'rgba(90,70,40,.3)'; x.lineWidth = 1; for (let k = 0; k < fh; k += 6) { x.beginPath(); x.moveTo(R_LAND + 132, fy + k); x.lineTo(R_LAND + 248, fy + k + 2); x.stroke(); } x.strokeStyle = '#6b4a2b'; x.lineWidth = 1.5; x.strokeRect(R_LAND + 130, fy, 120, fh); }
  // the track to the village
  x.strokeStyle = 'rgba(120,95,55,.45)'; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(R_LAND + 10, 230); x.quadraticCurveTo(R_LAND + 120, 210, R_VILL + 30, 236); x.stroke();
  for (let i = 0; i < 7; i++) paintTreeTop(x, R_LAND + 30 + (i * 83) % 230, 120 + (i * 149) % 300, 12 + (i % 3) * 4, season);
  // the village: cottages about a green, the church, a well and ricks
  x.fillStyle = 'rgba(255,240,180,.12)'; x.beginPath(); x.ellipse(R_VILL + 50, 236, 60, 40, 0, 0, 7); x.fill();
  S.huts = []; for (let i = 0; i < 6; i++) { const hx = R_VILL + 8 + (i % 2) * 44, hy = 46 + i * 64; S.huts.push([hx, hy]); paintHut(x, hx, hy, 30, 20, i); }
  x.fillStyle = '#bdb3a0'; x.fillRect(R_VILL + 52, 206, 34, 44); x.fillStyle = '#9a9184'; x.fillRect(R_VILL + 52, 206, 10, 44); x.fillStyle = '#6e3a2a'; x.beginPath(); x.moveTo(R_VILL + 50, 208); x.lineTo(R_VILL + 69, 194); x.lineTo(R_VILL + 88, 208); x.fill(); x.fillStyle = '#7d7363'; x.fillRect(R_VILL + 61, 176, 14, 30); x.fillStyle = '#5c5444'; x.beginPath(); x.moveTo(R_VILL + 59, 178); x.lineTo(R_VILL + 68, 164); x.lineTo(R_VILL + 77, 178); x.fill(); x.strokeStyle = '#e2b33c'; x.lineWidth = 2; x.beginPath(); x.moveTo(R_VILL + 68, 152); x.lineTo(R_VILL + 68, 164); x.moveTo(R_VILL + 63, 156); x.lineTo(R_VILL + 73, 156); x.stroke();
  for (const [rx, ry] of [[R_VILL + 20, 290], [R_VILL + 34, 300]]) { x.fillStyle = '#c9a85a'; x.beginPath(); x.arc(rx, ry, 8, 0, 7); x.fill(); x.fillStyle = '#e0c272'; x.beginPath(); x.arc(rx - 2, ry - 2, 4, 0, 7); x.fill(); }
  x.strokeStyle = '#6b4a2b'; x.lineWidth = 1.5; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(R_VILL - 6, 30 + i * 50); x.lineTo(R_VILL - 6, 44 + i * 50); x.stroke(); } x.beginPath(); x.moveTo(R_VILL - 6, 30); x.lineTo(R_VILL - 6, RH - 20); x.stroke();
  // the lanes, faintly, so the player can read them
  x.setLineDash([3, 9]); x.strokeStyle = 'rgba(42,29,18,.16)'; x.lineWidth = 1; for (const l of R_LANES) { x.beginPath(); x.moveTo(R_BEACH - 10, l); x.lineTo(R_VILL - 10, l); x.stroke(); } x.setLineDash([]);
}
function raidDraw(S) {
  const x = S.ctx, t = S.t; x.drawImage(S.ground, 0, 0, RW, RH);
  // surf at the water's edge
  x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 2.5; x.beginPath(); for (let y = 0; y <= RH; y += 6) { const sx = R_BEACH - 22 + Math.sin(y / 30) * 6 + Math.sin(t * 1.6 + y / 18) * 5; y ? x.lineTo(sx, y) : x.moveTo(sx, y); } x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = 6; x.beginPath(); for (let y = 0; y <= RH; y += 6) { const sx = R_BEACH - 28 + Math.sin(y / 30) * 6 + Math.sin(t * 1.6 + y / 18 + 1) * 7; y ? x.lineTo(sx, y) : x.moveTo(sx, y); } x.stroke();
  // burning cottages
  S.smoke = S.smoke || [];
  for (const f of S.fx) if (f.fire) { const h = S.huts.reduce((a, b) => Math.abs(b[1] + 10 - f.y) < Math.abs(a[1] + 10 - f.y) ? b : a, S.huts[0]); if (!f.drawn) { f.drawn = 1; } paintHut(x, h[0], h[1], 30, 20, 0, true); paintFlame(x, h[0] + 15, h[1] + 14, 26, 34, t, h[1]); paintFlame(x, h[0] + 4, h[1] + 16, 14, 20, t, h[0]); if (Math.random() < 0.25) S.smoke.push({ x: h[0] + 15, y: h[1] - 10, r: 5, a: .5, vx: 8, vy: -22, t: 0 }); }
  const dt = 0.016; S.smoke = S.smoke.filter(s => s.t < 2.6); for (const s of S.smoke) paintSmoke(x, s, dt);
  // the longships
  const col = '#3d4f6e';
  for (const b of S.boats) {
    if (b.st === 'wait' || b.st === 'gone') continue;
    const bob = Math.sin(t * 3 + b.lane) * 2, sunk = b.st === 'sunk';
    if (sunk) { b.fade = (b.fade === undefined ? 1 : b.fade) - 0.012; if (b.fade <= 0) continue; b.x -= 0.4; x.globalAlpha = b.fade; }
    x.save(); x.translate(b.x, b.lane + bob); x.rotate(Math.sin(t * 2 + b.lane) * .02); paintLongship(x, t, b.crew, !sunk, b.st === 'row', b.lane | 0); x.restore(); x.globalAlpha = 1;
    if (b.st === 'land') { for (let i = 0; i < b.crew; i++) figureAt(x, b.rx + (i % 3) * 11, b.lane - 4 + Math.floor(i / 3) * 13, .78, 1, col, '#e8dcc0', i % 4 === 0 ? 'militia' : 'foot', Math.floor(t * 7 + i) % 3, false, i + 2, true); }
  }
  // your companies, each under a small banner
  for (const k of S.toks) if (k.alive) {
    if (S.drag === k) { x.fillStyle = 'rgba(226,179,60,.25)'; x.beginPath(); x.arc(k.x, k.y, 34, 0, 7); x.fill(); x.strokeStyle = '#e2b33c'; x.lineWidth = 2; x.stroke(); }
    const mine = FAC(me()), c2 = mine.arms && mine.arms.c ? mine.arms.c : '#f3e8cc';
    for (let i = 0; i < 4; i++) figureAt(x, k.x - 12 + (i % 2) * 15, k.y - 6 + Math.floor(i / 2) * 15, .78, 0, mine.color, c2, i === 3 ? 'bow' : 'foot', (Math.floor(t * 6 + i) % 3), true, i, true);
    drawBanner(x, me(), k.x + 16, k.y - 30, 24, false, t + k.y, .55);
  }
  // arrows, each volley a handful
  for (const a of S.arrows) for (let j = 0; j < 5; j++) { const tt = a.t, ax = a.x0 + (a.x1 - a.x0) * tt + j * 6, ay = a.y0 + (a.y1 - a.y0) * tt - Math.sin(tt * Math.PI) * 60 + j * 4; x.strokeStyle = '#3a2a18'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax - 9, ay + 2.5); x.stroke(); x.strokeStyle = '#e8dcc0'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(ax - 9, ay + 2.5); x.lineTo(ax - 6.5, ay + 1.8); x.stroke(); }
  for (const f of S.fx) if (!f.fire) { f.t += 0.02; x.strokeStyle = `rgba(255,243,196,${1 - f.t})`; x.lineWidth = 2; x.beginPath(); for (let i = 0; i < 6; i++) { const r = 10 + f.t * 24; x.moveTo(f.x + Math.cos(i * 1.05) * r * .4, f.y + Math.sin(i * 1.05) * r * .4); x.lineTo(f.x + Math.cos(i * 1.05) * r, f.y + Math.sin(i * 1.05) * r); } x.stroke(); }
  S.fx = S.fx.filter(f => f.fire || f.t < 1);
  const left = S.boats.filter(b => b.st !== 'gone' && b.st !== 'sunk').length;
  mgSet('mg-ships', left); mgSet('mg-rep', S.rep); mgSet('mg-pl', S.pl);
  const m = $('#mgmsg'); if (m && m.textContent !== S.msg) m.textContent = S.msg;
}

// ================= THE MINE, PAINTED =================
function drawMineGround(x, S) {
  // the sky and the land above
  const sky = x.createLinearGradient(0, 0, 0, M_SURF); sky.addColorStop(0, '#5d8fc4'); sky.addColorStop(.7, '#b9cfdc'); sky.addColorStop(1, '#e3dcc2'); x.fillStyle = sky; x.fillRect(0, 0, MW_, M_SURF);
  for (const [cx, cy, w] of [[120, 30, 90], [420, 46, 120], [640, 24, 70]]) { x.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(cx + (i - 1.5) * w / 4.5, cy + (i % 2) * 4, w / 3.4, 9, 0, 0, 7); x.fill(); } }
  x.fillStyle = '#7f99a8'; x.beginPath(); x.moveTo(0, M_SURF - 2); for (let i = 0; i <= 16; i++) x.lineTo(i * 50, M_SURF - 8 - Math.abs(Math.sin(i * 1.7)) * 16); x.lineTo(MW_, M_SURF); x.fill();
  const season = SEASON_K(); x.fillStyle = PAL.tree[season][0]; for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(i * 21 + 5, M_SURF - 2, 5 + (i % 3) * 2, 0, 7); x.fill(); }
  x.fillStyle = PAL.ground[season][1]; x.fillRect(0, M_SURF - 4, MW_, 8);
  // strata: topsoil, clay, chalk and the rock, each with its own grain
  const bands = [[M_SURF, 150, '#7d5a36', '#6a4b2c'], [150, 235, '#8a6a42', '#75583a'], [235, 300, '#a89a7a', '#978968'], [300, M_WATER, '#6e5234', '#5a4229']];
  for (const [y0, y1, c0, c1] of bands) { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(0, y0, MW_, y1 - y0); x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1; x.beginPath(); for (let i = 0; i <= 20; i++) x.lineTo(i * 40, y0 + Math.sin(i * 1.3 + y0) * 3); x.stroke(); }
  x.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 90; i++) { const px = (i * 97) % MW_, py = M_SURF + 10 + (i * 53) % (M_WATER - M_SURF - 20); x.beginPath(); x.ellipse(px, py, 6 + (i % 4) * 2, 2.5, 0, 0, 7); x.fill(); }
  x.strokeStyle = 'rgba(60,40,20,.45)'; x.lineWidth = 2; for (let i = 0; i < 9; i++) { const rx = 20 + i * 90; x.beginPath(); x.moveTo(rx, M_SURF); x.quadraticCurveTo(rx - 10, M_SURF + 20, rx + 6, M_SURF + 34); x.moveTo(rx, M_SURF); x.quadraticCurveTo(rx + 12, M_SURF + 14, rx + 8, M_SURF + 26); x.stroke(); }
  // old bones and a buried pot, for the sappers to pick past
  x.fillStyle = '#e8e0c8'; x.fillRect(330, 320, 22, 3); x.beginPath(); x.arc(330, 321, 3, 0, 7); x.arc(352, 321, 3, 0, 7); x.fill(); x.fillStyle = '#b06a3a'; x.beginPath(); x.ellipse(500, 275, 9, 11, 0, 0, 7); x.fill(); x.fillStyle = '#7a4a28'; x.fillRect(493, 264, 14, 3);
  // the foundations to aim for
  x.fillStyle = 'rgba(226,179,60,.14)'; x.fillRect(M_WALL - 20, M_BAND[0], MW_ - M_WALL + 20, M_BAND[1] - M_BAND[0]);
  x.strokeStyle = 'rgba(226,179,60,.7)'; x.setLineDash([6, 6]); x.lineWidth = 1.5; x.strokeRect(M_WALL - 20, M_BAND[0], MW_ - M_WALL + 18, M_BAND[1] - M_BAND[0]); x.setLineDash([]);
  stoneFace(x, M_WALL, M_SURF, 60, M_BAND[0] - M_SURF, '#7d7363', 5);
  for (const r of S.rocks) { x.fillStyle = '#4e4a44'; x.beginPath(); x.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, 7); x.fill(); x.fillStyle = '#6e6962'; x.beginPath(); x.ellipse(r.x - r.rx * .25, r.y - r.ry * .3, r.rx * .5, r.ry * .4, 0, 0, 7); x.fill(); x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 1; x.beginPath(); x.ellipse(r.x, r.y, r.rx - 2, r.ry - 2, 0, 3.4, 5.6); x.stroke(); }
  const wg = x.createLinearGradient(0, M_WATER, 0, MH_); wg.addColorStop(0, '#4f7f8a'); wg.addColorStop(1, '#223f48'); x.fillStyle = wg; x.fillRect(0, M_WATER, MW_, MH_ - M_WATER);
  x.strokeStyle = '#8fb5bb'; x.lineWidth = 1.5; x.beginPath(); for (let i = 0; i < 16; i++) { x.moveTo(i * 52, M_WATER + 12); x.quadraticCurveTo(i * 52 + 13, M_WATER + 6, i * 52 + 26, M_WATER + 12); } x.stroke();
  // your camp: a tent, a fire and the spoil heap at the mine's mouth
  x.fillStyle = '#e8dcc0'; x.beginPath(); x.moveTo(14, M_SURF - 4); x.lineTo(44, M_SURF - 42); x.lineTo(74, M_SURF - 4); x.fill(); x.strokeStyle = '#6b4a2b'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#b8342c'; x.beginPath(); x.moveTo(44, M_SURF - 42); x.lineTo(30, M_SURF - 24); x.lineTo(58, M_SURF - 24); x.fill();
  x.fillStyle = '#6a4b2c'; x.beginPath(); x.ellipse(96, M_SURF - 2, 26, 10, 0, 3.14, 0); x.fill();
  x.font = '600 12px Cinzel, Georgia, serif'; x.fillStyle = '#f3e8cc'; x.textAlign = 'center'; x.fillText('FOUNDATIONS', M_WALL + 70, M_BAND[1] + 16);
}
function mineDraw(S) {
  const x = S.ctx, sink = S.over && S.quality ? Math.min(1, (S.collapse || 0) / 1.2) : 0;
  x.drawImage(S.ground, 0, 0, MW_, MH_);
  // the castle above, sinking when the mine is fired
  x.save(); x.translate(0, sink * 40);
  stoneFace(x, M_WALL, M_SURF - 72, 70, 72, '#9a917c', 2); x.fillStyle = '#7a7262'; for (let i = 0; i < 4; i++) x.fillRect(M_WALL + 2 + i * 18, M_SURF - 82, 10, 10);
  stoneFace(x, 728, M_SURF - 104, 54, 104, '#857d6b', 9); x.fillStyle = '#6a6252'; for (let i = 0; i < 4; i++) x.fillRect(730 + i * 14, M_SURF - 114, 8, 10); x.fillStyle = '#2a2420'; x.fillRect(750, M_SURF - 80, 8, 14); x.fillRect(750, M_SURF - 50, 8, 14);
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(M_WALL + 48, M_SURF - 72, 22, 72); x.fillRect(766, M_SURF - 104, 16, 104);
  x.restore();
  drawBanner(x, S.p.owner || S.p.ally, 760, M_SURF - 150 + sink * 40, 40, false, S.t, .9);
  drawBanner(x, me(), 50, M_SURF - 84, 34, false, S.t, .8);
  paintFlame(x, 100, M_SURF - 4, 12, 16, S.t, 3);
  // the tunnel, its props and its lamp
  x.lineCap = 'round'; x.lineJoin = 'round';
  x.strokeStyle = '#1a110a'; x.lineWidth = 18; x.beginPath(); S.trail.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.lineTo(S.head.x, S.head.y); x.stroke();
  x.strokeStyle = '#2f2016'; x.lineWidth = 12; x.beginPath(); S.trail.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.lineTo(S.head.x, S.head.y); x.stroke();
  x.strokeStyle = '#a07a44'; x.lineWidth = 2.2; x.beginPath(); for (let i = 3; i < S.trail.length; i += 4) { const [a, b] = S.trail[i]; x.moveTo(a, b - 8); x.lineTo(a, b + 8); x.moveTo(a - 3, b - 8); x.lineTo(a + 3, b - 8); } x.stroke();
  for (const c of S.cm) {
    if (c.warn > 0) { x.fillStyle = `rgba(184,52,44,${0.5 + 0.5 * Math.sin(S.t * 14)})`; x.font = '700 24px Cinzel, Georgia, serif'; x.textAlign = 'center'; x.fillText('!', c.x, M_SURF - 10); continue; }
    x.fillStyle = '#120c07'; x.fillRect(c.x - 9, M_SURF, 18, c.y - M_SURF); if (c.gal) x.fillRect(c.x - c.gal, c.depth - 9, c.gal, 18);
    x.strokeStyle = '#6b4a2b'; x.lineWidth = 1.5; for (let yy = M_SURF + 10; yy < c.y; yy += 14) { x.beginPath(); x.moveTo(c.x - 7, yy); x.lineTo(c.x + 7, yy); x.stroke(); }
  }
  // the dark of the earth, lit by the sapper's lamp
  const h = S.head;
  const lamp = x.createRadialGradient(h.x, h.y, 10, h.x, h.y, 170); lamp.addColorStop(0, 'rgba(255,214,120,.0)'); lamp.addColorStop(.35, 'rgba(20,10,0,.0)'); lamp.addColorStop(1, 'rgba(20,10,0,.42)');
  x.fillStyle = lamp; x.fillRect(0, M_SURF, MW_, MH_ - M_SURF);
  x.fillStyle = 'rgba(255,214,120,.28)'; x.beginPath(); x.arc(h.x, h.y, 26 + Math.sin(S.t * 9) * 2, 0, 7); x.fill();
  figureAt(x, h.x - 6, h.y + 9, .7, 0, '#8a6a42', '#f3e8cc', 'militia', Math.floor(S.t * 8) % 3, false, 1, true);
  x.strokeStyle = '#3a2817'; x.lineWidth = 2.5; const sw = Math.sin(S.t * 12) * 0.6; x.beginPath(); x.moveTo(h.x - 2, h.y - 2); x.lineTo(h.x + 10 * Math.cos(sw), h.y - 10 * Math.sin(sw) - 4); x.stroke();
  if (S.down) { x.strokeStyle = 'rgba(243,232,204,.6)'; x.setLineDash([4, 6]); x.lineWidth = 1.5; x.beginPath(); x.moveTo(h.x + 20, S.ty); x.lineTo(MW_, S.ty); x.stroke(); x.setLineDash([]); }
  for (const f of S.fx) { f.t += 0.016; x.fillStyle = `rgba(120,100,70,${Math.max(0, 0.6 - f.t)})`; x.beginPath(); x.arc(f.x, f.y, 10 + f.t * 40, 0, 7); x.fill(); }
  S.fx = S.fx.filter(f => f.t < 0.6);
  if (sink) { x.fillStyle = `rgba(150,130,100,${0.6 * (1 - Math.abs(sink - 0.5) * 2) + 0.15})`; for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(M_WALL + 10 + i * 9, M_SURF - 10 + Math.sin(i + S.t * 5) * 6, 18 + sink * 20, 0, 7); x.fill(); } }
  mgSet('mg-time', Math.max(0, Math.ceil(S.left)) + 's'); mgSet('mg-dist', Math.round(clamp((h.x - 70) / (M_WALL - 70), 0, 1) * 100) + '%'); mgSet('mg-lost', S.lost);
  const m = $('#mgmsg'); if (m && m.textContent !== S.msg) m.textContent = S.msg;
}

// ================= THE CHARTER, ILLUMINATED =================
function drawCharterGround(x) {
  const g = x.createRadialGradient(CW_ / 2, CH_ / 2, 60, CW_ / 2, CH_ / 2, 520); g.addColorStop(0, '#f7eccf'); g.addColorStop(1, '#d4bd8c'); x.fillStyle = g; x.fillRect(0, 0, CW_, CH_);
  // foxing and the grain of the skin
  for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(120,80,30,${0.03 + (i % 5) * 0.012})`; x.beginPath(); x.ellipse((i * 131) % CW_, (i * 71) % CH_, 14 + (i % 7) * 6, 6 + (i % 4) * 3, i, 0, 7); x.fill(); }
  // the border: a gilt frame with vine-work in red and blue
  x.strokeStyle = '#b8892c'; x.lineWidth = 3; x.strokeRect(14, 14, CW_ - 28, CH_ - 28); x.lineWidth = 1; x.strokeRect(22, 22, CW_ - 44, CH_ - 44);
  const vine = (px, py, dx, dy, n) => { for (let i = 0; i < n; i++) { const vx = px + dx * i, vy = py + dy * i, k = i % 2; x.fillStyle = k ? '#8e1f1b' : '#2e4a86'; x.beginPath(); x.ellipse(vx, vy, 4.5, 2.6, dx ? (k ? .6 : -.6) : (k ? 2.2 : 1), 0, 7); x.fill(); x.fillStyle = '#e2b33c'; x.beginPath(); x.arc(vx + (dx ? 6 : 0), vy + (dy ? 6 : 0), 1.3, 0, 7); x.fill(); } };
  vine(40, 18, 12, 0, 60); vine(40, CH_ - 18, 12, 0, 60); vine(18, 44, 0, 12, 30); vine(CW_ - 18, 44, 0, 12, 30);
  for (const [cx, cy] of [[18, 18], [CW_ - 18, 18], [18, CH_ - 18], [CW_ - 18, CH_ - 18]]) { x.fillStyle = '#e2b33c'; x.beginPath(); x.arc(cx, cy, 7, 0, 7); x.fill(); x.fillStyle = '#8e1f1b'; x.beginPath(); x.arc(cx, cy, 3.2, 0, 7); x.fill(); }
  // ruling, the rubric and an illuminated initial
  x.strokeStyle = 'rgba(120,90,50,.2)'; x.lineWidth = 1; for (let y = 60; y < CH_ - 40; y += 26) { x.beginPath(); x.moveTo(40, y); x.lineTo(CW_ - 40, y); x.stroke(); }
  x.fillStyle = '#8e1f1b'; x.font = '700 15px Cinzel, Georgia, serif'; x.textAlign = 'center'; x.fillText('IN NOMINE SANCTAE ET INDIVIDUAE TRINITATIS', CW_ / 2 + 20, 46);
  x.fillStyle = '#2e4a86'; x.fillRect(38, 34, 44, 44); x.strokeStyle = '#e2b33c'; x.lineWidth = 2; x.strokeRect(38, 34, 44, 44); x.fillStyle = '#e2b33c'; x.font = '900 34px Cinzel, Georgia, serif'; x.fillText('I', 60, 68); x.strokeStyle = '#f3e8cc'; x.lineWidth = 1; x.beginPath(); x.arc(50, 44, 5, 0, 7); x.arc(72, 68, 5, 0, 7); x.stroke();
  // lines of faded minuscule, for the look of it
  x.strokeStyle = 'rgba(70,45,20,.22)'; x.lineWidth = 1.4; x.beginPath();
  for (const y0 of [86, 398, 416]) for (let i = 0; i < 44; i++) { const bx = 90 + i * 15; x.moveTo(bx, y0); x.quadraticCurveTo(bx + 4, y0 - 7 - (i % 3) * 2, bx + 9, y0); if (i % 7 === 3) { x.moveTo(bx + 9, y0); x.lineTo(bx + 9, y0 - 12); } }
  x.stroke();
}
function charterDraw(S) {
  const x = S.ctx; x.drawImage(S.ground, 0, 0, CW_, CH_);
  x.lineCap = 'round'; x.lineJoin = 'round';
  S.strokes.forEach((g, k) => {
    if (k < S.i) return;
    x.strokeStyle = k === S.i ? 'rgba(90,60,30,.5)' : 'rgba(90,60,30,.14)'; x.lineWidth = k === S.i ? 9 : 6; x.setLineDash(k === S.i ? [2, 10] : []);
    x.beginPath(); g.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); x.setLineDash([]);
    if (k === S.i && S.phase === 'trace') { const [a, b] = g[0], [c, d] = g[g.length - 1]; x.fillStyle = 'rgba(63,107,53,.3)'; x.beginPath(); x.arc(a, b, 16 + Math.sin(S.t * 6) * 3, 0, 7); x.fill(); x.fillStyle = '#3f6b35'; x.beginPath(); x.arc(a, b, 8, 0, 7); x.fill(); x.fillStyle = 'rgba(142,31,27,.6)'; x.beginPath(); x.arc(c, d, 7, 0, 7); x.fill(); }
  });
  // the ink: a dark line with a wet sheen while the stroke is being made
  x.strokeStyle = '#1e0f06'; x.lineWidth = 6.5;
  for (const u of S.inked) { x.beginPath(); u.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); }
  if (S.cur && S.cur.length) { x.beginPath(); S.cur.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); x.strokeStyle = 'rgba(80,60,120,.35)'; x.lineWidth = 2; x.stroke();
    // the quill
    const [qx, qy] = S.cur[S.cur.length - 1]; x.save(); x.translate(qx, qy); x.rotate(-.7); x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(6, 4, 10, 3, 0, 0, 7); x.fill(); x.fillStyle = '#e9dcc0'; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(14, -30, 9, -72); x.quadraticCurveTo(-4, -40, 0, 0); x.fill(); x.strokeStyle = '#6b5a3a'; x.lineWidth = 1.2; x.stroke(); x.strokeStyle = '#a08a66'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, 0); x.lineTo(7, -64); x.stroke(); for (let i = 1; i < 7; i++) { x.beginPath(); x.moveTo(1 + i, -10 * i); x.lineTo(7 + i * .6, -10 * i - 6); x.stroke(); } x.fillStyle = '#2a1d12'; x.beginPath(); x.moveTo(-1, 2); x.lineTo(2, -10); x.lineTo(1, 2); x.fill(); x.restore(); }
  if (S.phase === 'seal' || S.phase === 'done') {
    const bx = 250, by = 352, bw = 300, pos = S.phase === 'done' ? 0.5 : sealPos(S);
    const grad = x.createLinearGradient(bx, 0, bx + bw, 0); grad.addColorStop(0, '#6d8fb0'); grad.addColorStop(.5, '#e2b33c'); grad.addColorStop(1, '#b8342c');
    x.fillStyle = grad; x.fillRect(bx, by, bw, 16); x.strokeStyle = '#2a1d12'; x.lineWidth = 1.5; x.strokeRect(bx, by, bw, 16);
    x.strokeStyle = '#fff8e4'; x.lineWidth = 2; x.strokeRect(bx + bw * 0.39, by - 3, bw * 0.22, 22);
    x.font = 'italic 13px "IM Fell English", Georgia, serif'; x.fillStyle = '#2a1d12'; x.textAlign = 'left'; x.fillText('too cold', bx, by + 32); x.textAlign = 'right'; x.fillText('too hot', bx + bw, by + 32);
    if (S.phase === 'seal') { x.fillStyle = '#2a1d12'; x.beginPath(); x.moveTo(bx + bw * pos, by - 4); x.lineTo(bx + bw * pos - 7, by - 14); x.lineTo(bx + bw * pos + 7, by - 14); x.fill(); }
    else { // the wax, pressed with your arms
      const s = S.seal || 0, sx = CW_ - 90, sy = CH_ - 110, wax = s > 0.6 ? '#8e1f1b' : s > 0.3 ? '#a8574f' : '#b58a7a';
      x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(sx + 3, sy + 5, 36, 34, 0, 0, 7); x.fill();
      x.fillStyle = wax; x.beginPath(); for (let a = 0; a < 6.3; a += .3) { const r = 34 + Math.sin(a * 5 + 1) * 2.5; x.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } x.closePath(); x.fill();
      x.strokeStyle = mix(wax, '#000', .35); x.lineWidth = 2; x.beginPath(); x.arc(sx, sy, 26, 0, 7); x.stroke(); x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.ellipse(sx - 10, sy - 12, 12, 6, -.6, 0, 7); x.fill();
      const spr = armsSprite(me()); if (spr) { x.globalAlpha = .55; x.drawImage(spr, sx - 11, sy - 15, 22, 26); x.globalAlpha = 1; } else { x.fillStyle = '#e8c9a0'; x.font = '700 22px Cinzel, Georgia, serif'; x.textAlign = 'center'; x.fillText('✠', sx, sy + 8); }
    }
  }
  const tr = S.scores.length ? S.scores.reduce((a, b) => a + b, 0) / S.scores.length : 0;
  mgSet('mg-time', S.phase === 'trace' ? Math.max(0, Math.ceil(S.left)) + 's' : '—'); mgSet('mg-stroke', `${Math.min(S.i + (S.phase === 'trace' ? 1 : 0), 3)}/3`); mgSet('mg-q', S.scores.length ? Math.round(tr * 100) + '%' : '—');
  const m = $('#mgmsg'); if (m && m.textContent !== S.msg) m.textContent = S.msg;
}
