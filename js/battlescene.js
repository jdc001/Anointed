'use strict';
// ================= THE FIELD: the painted battle scene =================
// The battle model (battle.js) is untouched: it still thinks in a 1000 x 540 plan, with the attackers on the
// left and the wall at WALLX. This file only draws that plan as a three-quarter view: a horizon, a sky that
// knows the season and the hour, ground that recedes, figures that grow as they come nearer, and walls that stand up.
const HOR = 116;
const cam_first = bg => { if (bg._camInit) return false; bg._camInit = true; return true; };
// plan -> screen. d is depth (0 far, 1 near); k is the size of things at that depth
// the camera sits a little to the south-west, so lines that run north-south lean across the screen and a wall shows its face
const SKEW = 200;
function proj(x, y) { const d = clamp(y / BH_, -0.2, 1.2); return { x: 500 + (x - 500) * (0.82 + 0.18 * d) + (d - 0.5) * SKEW, y: HOR + 28 + d * (BH_ - HOR - 34), k: 0.56 + 0.62 * d }; }
const SEASON_K = () => (G.turn + 1) % 4;
const HOURS = ['dawn', 'day', 'day', 'dusk'];
const PAL = {
  sky: { dawn: ['#6a5f8f', '#c9a0a8', '#f3cf9a'], day: ['#5d8fc4', '#9fc1dd', '#dbe6e4'], dusk: ['#3f3463', '#b56a6a', '#f0b26a'] },
  ground: [['#86a64d', '#5c7b33', '#4a6529'], ['#a3a84f', '#7a8a3b', '#5f6e2e'], ['#a98f46', '#7b7236', '#5b5a2c'], ['#e9ecec', '#c7cfcf', '#a9b4b6']],
  tree: [['#4b6a2c', '#6b8a3a'], ['#3f5f28', '#5d7c33'], ['#8a5a26', '#b8782e'], ['#4e4a44', '#6a645c']],
  far: [['#7f99a8', '#5f7f8a'], ['#8aa1a4', '#637f82'], ['#9a8f8e', '#6f6a70'], ['#9fb0bb', '#7a8e9c']],
};
function battleBg() {
  const season = SEASON_K(), hour = pick(HOURS);
  const R = Math.random;
  const clouds = []; for (let i = 0; i < 7; i++) clouds.push({ x: R() * 1100 - 50, y: 18 + R() * 70, w: 70 + R() * 130, h: 10 + R() * 14, a: .35 + R() * .4, v: 2 + R() * 4 });
  const hills = []; for (let L = 0; L < 2; L++) { const pts = []; for (let i = 0; i <= 20; i++) pts.push(HOR - (L ? 6 : 14) - Math.abs(Math.sin(i * 1.7 + L * 2.3) * (L ? 9 : 18)) - R() * 4); hills.push(pts); }
  const wood = []; for (let i = 0; i < 70; i++) wood.push({ x: i * 15 + R() * 10, r: 5 + R() * 6, v: R() });
  const patches = []; for (let i = 0; i < 40; i++) patches.push([R() * BW_, R() * BH_, 40 + R() * 110, R()]);
  const streaks = []; for (let i = 0; i < 9; i++) streaks.push([R() * BW_, R() * BH_, 120 + R() * 240]);
  const flowers = []; for (let i = 0; i < 160; i++) flowers.push([R() * BW_, 60 + R() * (BH_ - 60), R()]);
  const trees = []; for (let i = 0; i < 9; i++) { const left = i % 2 === 0; trees.push({ x: left ? -40 + R() * 90 : BW_ - 50 + R() * 90, y: 40 + R() * 480, r: 16 + R() * 14, v: R() }); }
  const gaps = []; for (let i = 0; i < 14; i++) gaps.push(R());
  const tufts = []; for (let i = 0; i < 60; i++) tufts.push([R() * BW_, BH_ - R() * 30, R()]);
  const flakes = []; const nF = season === 3 ? 110 : season === 2 ? 36 : 0; for (let i = 0; i < nF; i++) flakes.push({ x: R() * BW_, y: R() * BH_, v: 14 + R() * 30, w: R() * 6.28, r: season === 3 ? 1 + R() * 1.8 : 2 + R() * 2 });
  const birds = []; for (let i = 0; i < 2; i++) birds.push({ x: R() * 600 - 300, y: 30 + R() * 50, v: 18 + R() * 10, n: 3 + Math.floor(R() * 5) });
  const rain = season !== 3 && hour !== 'dusk' && R() < 0.22, mist = hour === 'dawn' || (season === 2 && R() < 0.5);
  const drops = []; if (rain) for (let i = 0; i < 160; i++) drops.push({ x: R() * (BW_ + 200) - 100, y: R() * BH_, v: 520 + R() * 200, l: 10 + R() * 10 });
  return { season, hour, rain, mist, drops, clouds, hills, wood, patches, streaks, flowers, trees, gaps, tufts, flakes, birds, road: 120 + R() * 300, sun: { x: hour === 'day' ? 160 + R() * 680 : 300 + R() * 400, y: hour === 'day' ? 28 + R() * 30 : HOR - 24 - R() * 14 }, spire: R() < 0.6 ? 150 + R() * 700 : -1, cam: { z: 1, x: 500, y: 300 } };
}

// ---------- the sky ----------
function drawSky(x, V) {
  const bg = V.bg, sk = PAL.sky[bg.hour];
  SUN_DX = bg.rain ? -0.3 : clamp((bg.sun.x - 500) / 500, -1, 1) * -0.9;
  const g = x.createLinearGradient(0, 0, 0, HOR + 10); if (bg.rain) { g.addColorStop(0, '#4f5663'); g.addColorStop(.6, '#7d8793'); g.addColorStop(1, '#a9adaa'); } else { g.addColorStop(0, sk[0]); g.addColorStop(.6, sk[1]); g.addColorStop(1, sk[2]); }
  x.fillStyle = g; x.fillRect(0, 0, BW_, HOR + 12);
  // the sun and its glow
  const s = bg.sun, big = bg.hour !== 'day';
  if (!bg.rain) {
  const gl = x.createRadialGradient(s.x, s.y, 0, s.x, s.y, big ? 150 : 90); gl.addColorStop(0, big ? 'rgba(255,214,150,.75)' : 'rgba(255,250,220,.6)'); gl.addColorStop(1, 'rgba(255,230,180,0)');
  x.fillStyle = gl; x.fillRect(0, 0, BW_, HOR + 12);
  x.fillStyle = big ? '#ffe3a8' : '#fff9e0'; x.beginPath(); x.arc(s.x, s.y, big ? 20 : 11, 0, 7); x.fill();
  }
  // clouds, lit from the sun
  for (const c of bg.clouds) {
    x.globalAlpha = c.a;
    const cg = x.createLinearGradient(0, c.y - c.h, 0, c.y + c.h); cg.addColorStop(0, bg.rain ? '#9aa3ad' : '#fff'); cg.addColorStop(1, bg.rain ? '#5a626d' : big ? '#d9a7a0' : '#b9c7d6');
    x.fillStyle = cg;
    for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(c.x + (i - 1.5) * c.w / 4.5, c.y + (i % 2) * c.h * .3, c.w / 3.4, c.h * (i % 2 ? .8 : 1.1), 0, 0, 7); x.fill(); }
    x.globalAlpha = 1;
  }
  // far hills, then the near wood on the skyline
  const far = PAL.far[bg.season];
  bg.hills.forEach((pts, L) => { x.fillStyle = L ? far[1] : far[0]; x.globalAlpha = L ? .9 : .6; x.beginPath(); x.moveTo(0, HOR + 12); pts.forEach((py, i) => x.lineTo(i * 50, py)); x.lineTo(BW_, HOR + 12); x.closePath(); x.fill(); x.globalAlpha = 1; });
  const tr = PAL.tree[bg.season];
  for (const w of bg.wood) { x.fillStyle = w.v < .5 ? tr[0] : mix(tr[0], tr[1], .5); x.beginPath(); x.arc(w.x, HOR + 2, w.r, 0, 7); x.fill(); }
  if (bg.spire > 0) { x.fillStyle = '#5b5246'; x.fillRect(bg.spire - 6, HOR - 14, 12, 16); x.beginPath(); x.moveTo(bg.spire - 7, HOR - 14); x.lineTo(bg.spire, HOR - 34); x.lineTo(bg.spire + 7, HOR - 14); x.fill(); x.fillStyle = '#e2b33c'; x.fillRect(bg.spire - .6, HOR - 40, 1.2, 7); x.fillRect(bg.spire - 2.5, HOR - 38, 5, 1.2); }
  // ground haze at the horizon
  const hz = x.createLinearGradient(0, HOR - 4, 0, HOR + 40); hz.addColorStop(0, sk[2] + 'cc'); hz.addColorStop(1, sk[2] + '00'); x.fillStyle = hz; x.fillRect(0, HOR - 4, BW_, 44);
}
// ---------- the ground ----------
function paintTree(x, tx, ty, r, v, season) {
  const tr = PAL.tree[season];
  x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.ellipse(tx + r * .3, ty + 2, r * 1.1, r * .32, 0, 0, 7); x.fill();
  x.strokeStyle = '#4a3522'; x.lineWidth = r * .22; x.beginPath(); x.moveTo(tx, ty); x.lineTo(tx + r * .1, ty - r * .9); x.stroke();
  if (season === 3) { x.lineWidth = r * .08; for (let i = 0; i < 6; i++) { const a = -1.2 - i * .3 + v; x.beginPath(); x.moveTo(tx + r * .1, ty - r * (.6 + i * .08)); x.lineTo(tx + Math.cos(a) * r * .9, ty - r * .9 + Math.sin(a) * r * .9); x.stroke(); } return; }
  const blobs = [[0, -1.25, 1], [-.55, -.95, .7], [.6, -1, .72], [.1, -.7, .6]];
  for (const [bx, by, br] of blobs) { x.fillStyle = tr[0]; x.beginPath(); x.arc(tx + bx * r, ty + by * r, br * r * .75, 0, 7); x.fill(); }
  for (const [bx, by, br] of blobs) { x.fillStyle = tr[1]; x.beginPath(); x.arc(tx + bx * r - r * .18, ty + by * r - r * .2, br * r * .45, 0, 7); x.fill(); }
}
function drawGround(x, V) {
  const B = V.B, bg = V.bg, gp = PAL.ground[bg.season];
  drawSky(x, V);
  const g = x.createLinearGradient(0, HOR, 0, BH_); g.addColorStop(0, mix(gp[0], PAL.sky[bg.hour][2], .35)); g.addColorStop(.25, gp[0]); g.addColorStop(.7, gp[1]); g.addColorStop(1, gp[2]);
  x.fillStyle = g; x.fillRect(0, HOR, BW_, BH_ - HOR);
  if (bg.rain) { x.fillStyle = 'rgba(40,50,60,.22)'; x.fillRect(0, HOR, BW_, BH_ - HOR); }
  // soft shade and sunlit streaks, foreshortened
  for (const [px, py, r, v] of bg.patches) { const p = proj(px, py); x.fillStyle = v < .5 ? 'rgba(30,50,15,.13)' : 'rgba(255,240,160,.10)'; x.beginPath(); x.ellipse(p.x, p.y, r * p.k, r * p.k * .28, 0, 0, 7); x.fill(); }
  for (const [px, py, w] of bg.streaks) { const p = proj(px, py); x.fillStyle = 'rgba(255,250,200,.07)'; x.beginPath(); x.ellipse(p.x, p.y, w * p.k, 6 * p.k, 0, 0, 7); x.fill(); }
  // a cart road wandering across
  { const a = proj(0, bg.road), b = proj(400, bg.road + 60), c = proj(700, bg.road - 50), d = proj(B.castle ? WALLX - 30 : BW_, bg.road + 10);
    x.strokeStyle = 'rgba(110,88,50,.26)'; x.lineWidth = 11; x.lineCap = 'round'; x.beginPath(); x.moveTo(a.x, a.y); x.bezierCurveTo(b.x, b.y, c.x, c.y, d.x, d.y); x.stroke();
    x.strokeStyle = 'rgba(60,45,25,.18)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(a.x, a.y - 3); x.bezierCurveTo(b.x, b.y - 3, c.x, c.y - 3, d.x, d.y - 3); x.moveTo(a.x, a.y + 3); x.bezierCurveTo(b.x, b.y + 3, c.x, c.y + 3, d.x, d.y + 3); x.stroke(); }
  // flowers in spring and summer, leaves in autumn, snow glitter in winter
  for (const [fx_, fy, v] of bg.flowers) { if (B.castle && fx_ > WALLX - 40) continue; const p = proj(fx_, fy); const r = (0.8 + v) * p.k; x.fillStyle = bg.season === 0 ? (v < .5 ? '#fff6c8' : '#f2d36b') : bg.season === 1 ? (v < .5 ? '#f6e27a' : '#e4e9c8') : bg.season === 2 ? (v < .5 ? '#c8742a' : '#8a4a1c') : '#ffffff'; x.globalAlpha = .55 + v * .4; x.beginPath(); x.arc(p.x, p.y, r, 0, 7); x.fill(); }
  x.globalAlpha = 1;
  // grass at the near edge
  x.strokeStyle = gp[2]; x.lineWidth = 1.6;
  for (const [tx, ty, v] of bg.tufts) { x.beginPath(); x.moveTo(tx, ty + 8); x.lineTo(tx - 4 - v * 3, ty - 10); x.moveTo(tx, ty + 8); x.lineTo(tx + 3, ty - 12 - v * 4); x.moveTo(tx, ty + 8); x.lineTo(tx + 6 + v * 2, ty - 8); x.stroke(); }
  if (B.castle) drawCastle(x, V);
  // trees at the margins, nearest last
  for (const t of bg.trees.slice().sort((a, b) => a.y - b.y)) { if (B.castle && t.x > WALLX - 60) continue; const p = proj(t.x, t.y); paintTree(x, p.x, p.y, t.r * p.k, t.v, bg.season); }
}
// ---------- the castle ----------
const WALL_H = lv => lv === 1 ? 46 : lv === 2 ? 72 : 88;
function wallTop(y, lv) { const p = proj(WALLX, y); return { x: p.x, y: p.y - WALL_H(lv) * p.k, k: p.k }; }
function stoneFace(x, x0, y0, w, h, base, seed) {
  x.fillStyle = base; x.fillRect(x0, y0, w, h);
  x.fillStyle = 'rgba(255,255,255,.07)'; let r = seed;
  for (let yy = y0; yy < y0 + h; yy += 7) { r = (r * 9301 + 49297) % 233280; const off = (r / 233280) * 9; for (let xx = x0 - 9 + off; xx < x0 + w; xx += 13) { if (xx > x0 && xx + 11 < x0 + w) x.fillRect(xx, yy + 1, 11, 5); } }
  x.fillStyle = 'rgba(0,0,0,.08)'; for (let yy = y0 + 6; yy < y0 + h; yy += 7) x.fillRect(x0, yy, w, 1);
}
function drawCastle(x, V) {
  const lv = V.cfg.castleLv || 1, ruined = V.cfg.ruined, intact = (V.walls || 0) / 100, bg = V.bg, dusk = bg.hour !== 'day';
  const stone = lv === 1 ? '#7a5530' : lv === 3 ? '#9a9486' : '#a69e8c', dark = mix(stone, '#000', .35), light = mix(stone, '#fff', .25);
  // the bailey behind the wall
  { const a = proj(WALLX, 0), b = proj(BW_ + 400, 0), c = proj(BW_ + 400, BH_), d = proj(WALLX, BH_); const gg = x.createLinearGradient(0, a.y, 0, d.y); gg.addColorStop(0, '#9a8f74'); gg.addColorStop(1, '#7d7257'); x.fillStyle = gg; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.lineTo(c.x, c.y); x.lineTo(d.x, d.y); x.closePath(); x.fill();
    x.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 70; i++) { const p = proj(WALLX + 30 + (i * 37) % 300, (i * 53) % BH_); x.beginPath(); x.ellipse(p.x, p.y, 9 * p.k, 3 * p.k, 0, 0, 7); x.fill(); } }
  // the keep
  { const kp = proj(905, 250), kw = 120 * kp.k, kh = 165 * kp.k, kx = kp.x - kw / 2, ky = kp.y - kh;
    x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.ellipse(kp.x + 10, kp.y + 4, kw * .7, 10, 0, 0, 7); x.fill();
    stoneFace(x, kx, ky, kw, kh, mix(stone, '#000', .12), 7);
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(kx + kw * .62, ky, kw * .38, kh);
    for (const tx of [kx - 8, kx + kw - 14]) { stoneFace(x, tx, ky - 14, 22, kh + 14, stone, 3); x.fillStyle = dark; for (let i = 0; i < 3; i++) x.fillRect(tx + i * 8, ky - 20, 5, 7); }
    x.fillStyle = dark; for (let i = 0; i < 6; i++) x.fillRect(kx + 10 + i * (kw - 20) / 6, ky - 8, 8, 9);
    const win = dusk ? '#ffcf6a' : '#2a2420'; x.fillStyle = win; for (const [wx, wy] of [[.3, .25], [.5, .25], [.4, .5], [.3, .72], [.52, .72]]) { x.beginPath(); x.moveTo(kx + kw * wx, ky + kh * wy); x.lineTo(kx + kw * wx + 7, ky + kh * wy); x.lineTo(kx + kw * wx + 7, ky + kh * wy + 12); x.lineTo(kx + kw * wx, ky + kh * wy + 12); x.fill(); x.beginPath(); x.arc(kx + kw * wx + 3.5, ky + kh * wy, 3.5, 3.14, 0); x.fill(); }
    if (dusk) { x.fillStyle = 'rgba(255,200,100,.08)'; x.fillRect(kx + kw * .25, ky + kh * .2, kw * .35, kh * .6); }
    V.keepTop = { x: kp.x - kw * .1, y: ky - 12 };
  }
  // the moat
  if (V.cfg.moat) { const a = proj(WALLX - 56, 0), b = proj(WALLX - 16, 0), c = proj(WALLX - 16, BH_), d = proj(WALLX - 56, BH_); const wg = x.createLinearGradient(0, a.y, 0, d.y); wg.addColorStop(0, '#5c8a94'); wg.addColorStop(1, '#3f6b76'); x.fillStyle = wg; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.lineTo(c.x, c.y); x.lineTo(d.x, d.y); x.closePath(); x.fill(); x.strokeStyle = 'rgba(40,60,40,.5)'; x.lineWidth = 2; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(d.x, d.y); x.stroke(); }
  // the curtain wall, in segments, standing up from the plan
  const segs = 14, H = WALL_H(lv), thick = lv === 1 ? 10 : lv === 2 ? 18 : 26;
  for (let i = 0; i < segs; i++) {
    const y0 = i * BH_ / segs, y1 = y0 + BH_ / segs;
    const b0 = proj(WALLX, y0), b1 = proj(WALLX, y1), t0 = wallTop(y0, lv), t1 = wallTop(y1, lv);
    const broken = ruined || bg.gaps[i] > intact;
    if (broken) {
      // a heap of rubble where the wall has come down
      x.fillStyle = dark; x.beginPath(); x.moveTo(b0.x - 14 * b0.k, b0.y); x.quadraticCurveTo((b0.x + b1.x) / 2, (b0.y + b1.y) / 2 - 22 * b0.k, b1.x + 16 * b1.k, b1.y); x.lineTo(b1.x + thick * b1.k, b1.y); x.lineTo(b0.x + thick * b0.k, b0.y); x.closePath(); x.fill();
      x.fillStyle = stone; for (let k = 0; k < 9; k++) { const p = proj(WALLX - 10 + ((k * 13 + i * 7) % 34), y0 + ((k * 17) % (BH_ / segs))); x.fillRect(p.x, p.y - 4 * p.k - (k % 3) * 4, 7 * p.k, 5 * p.k); }
      continue;
    }
    // the shadow the wall throws on the field, then the face
    x.fillStyle = 'rgba(20,15,5,.16)'; x.beginPath(); x.moveTo(b0.x, b0.y); x.lineTo(b0.x - 26 * b0.k, b0.y + 2); x.lineTo(b1.x - 26 * b1.k, b1.y + 2); x.lineTo(b1.x, b1.y); x.closePath(); x.fill();
    const fg = x.createLinearGradient(0, t0.y, 0, b0.y); fg.addColorStop(0, light); fg.addColorStop(.4, stone); fg.addColorStop(1, mix(dark, '#000', .25));
    x.fillStyle = fg; x.beginPath(); x.moveTo(b0.x, b0.y); x.lineTo(t0.x, t0.y); x.lineTo(t1.x, t1.y); x.lineTo(b1.x, b1.y); x.closePath(); x.fill();
    if (lv === 1) { // a stockade of split logs, each with a sharpened top
      const n = 9; for (let k = 0; k < n; k++) { const f0 = k / n, f1 = (k + .92) / n; const bx0 = b0.x + (b1.x - b0.x) * f0, by0 = b0.y + (b1.y - b0.y) * f0, bx1 = b0.x + (b1.x - b0.x) * f1, by1 = b0.y + (b1.y - b0.y) * f1, tx0 = t0.x + (t1.x - t0.x) * f0, ty0 = t0.y + (t1.y - t0.y) * f0, tx1 = t0.x + (t1.x - t0.x) * f1, ty1 = t0.y + (t1.y - t0.y) * f1;
        x.fillStyle = k % 2 ? '#8a6238' : '#6e4a2a'; x.beginPath(); x.moveTo(bx0, by0); x.lineTo(tx0, ty0 + 4); x.lineTo((tx0 + tx1) / 2, (ty0 + ty1) / 2 - 7 * t0.k); x.lineTo(tx1, ty1 + 4); x.lineTo(bx1, by1); x.closePath(); x.fill();
        x.fillStyle = 'rgba(255,230,180,.14)'; x.beginPath(); x.moveTo(bx0, by0); x.lineTo(tx0, ty0 + 4); x.lineTo(tx0 + (tx1 - tx0) * .3, ty0 + 4); x.lineTo(bx0 + (bx1 - bx0) * .3, by0); x.closePath(); x.fill(); }
      x.strokeStyle = '#3a2817'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(b0.x, b0.y - (b0.y - t0.y) * .3); x.lineTo(b1.x, b1.y - (b1.y - t1.y) * .3); x.moveTo(b0.x, b0.y - (b0.y - t0.y) * .72); x.lineTo(b1.x, b1.y - (b1.y - t1.y) * .72); x.stroke(); continue; }
    else { x.strokeStyle = 'rgba(0,0,0,.14)'; x.lineWidth = 1; for (let k = 1; k < 4; k++) { const f = k / 4; x.beginPath(); x.moveTo(b0.x + (b1.x - b0.x) * f, b0.y + (b1.y - b0.y) * f); x.lineTo(t0.x + (t1.x - t0.x) * f, t0.y + (t1.y - t0.y) * f); x.stroke(); } x.fillStyle = 'rgba(255,255,255,.06)'; for (let r = 1; r < 6; r++) { const f = r / 6; x.beginPath(); x.moveTo(b0.x + (t0.x - b0.x) * f, b0.y + (t0.y - b0.y) * f); x.lineTo(b1.x + (t1.x - b1.x) * f, b1.y + (t1.y - b1.y) * f); x.lineTo(b1.x + (t1.x - b1.x) * f, b1.y + (t1.y - b1.y) * f + 2); x.lineTo(b0.x + (t0.x - b0.x) * f, b0.y + (t0.y - b0.y) * f + 2); x.fill(); } x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse((t0.x + t1.x) / 2 + 1, (t0.y + b0.y) / 2 + 6, 2.2, 5, 0, 0, 7); x.fill(); }
    // the walk and the battlements
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(t0.x, t0.y); x.lineTo(t1.x, t1.y); x.stroke();
    x.fillStyle = mix(stone, '#fff', .12); x.beginPath(); x.moveTo(t0.x, t0.y); x.lineTo(t0.x + thick * t0.k, t0.y - 4 * t0.k); x.lineTo(t1.x + thick * t1.k, t1.y - 4 * t1.k); x.lineTo(t1.x, t1.y); x.closePath(); x.fill();
    const n = lv === 1 ? 3 : 4; for (let k = 0; k < n; k++) { const f = (k + .2) / n, mx = t0.x + (t1.x - t0.x) * f, my = t0.y + (t1.y - t0.y) * f, kk = t0.k; x.fillStyle = lv === 1 ? dark : light; if (lv === 1) { x.beginPath(); x.moveTo(mx - 2 * kk, my); x.lineTo(mx, my - 9 * kk); x.lineTo(mx + 2 * kk, my); x.fill(); } else { x.fillRect(mx - 4 * kk, my - 11 * kk, 8 * kk, 11 * kk); x.fillStyle = dark; x.fillRect(mx + 2 * kk, my - 11 * kk, 2 * kk, 11 * kk); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(mx - 4 * kk, my - 1, 8 * kk, 1.5); } }
    if (i === 6 && lv > 1 && !ruined) { // the gate
      const gm = proj(WALLX, 270), gw = 16 * gm.k, gh = 28 * gm.k; x.fillStyle = '#2a211a'; x.beginPath(); x.moveTo(gm.x - gw / 2, gm.y); x.lineTo(gm.x - gw / 2, gm.y - gh + gw / 2); x.arc(gm.x, gm.y - gh + gw / 2, gw / 2, 3.14, 0); x.lineTo(gm.x + gw / 2, gm.y); x.fill(); x.strokeStyle = '#6b4a2b'; x.lineWidth = 1; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(gm.x - gw / 2 + k * gw / 4, gm.y); x.lineTo(gm.x - gw / 2 + k * gw / 4, gm.y - gh + 6); x.stroke(); }
    }
  }
  // the towers
  if (!ruined && lv > 1) for (const ty of [60, 270, 480]) {
    const b = proj(WALLX + thick / 2, ty), r = (lv === 3 ? 24 : 19) * b.k, h = (WALL_H(lv) + 24) * b.k;
    x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(b.x + r * .4, b.y + 2, r * 1.3, r * .4, 0, 0, 7); x.fill();
    const tg = x.createLinearGradient(b.x - r, 0, b.x + r, 0); tg.addColorStop(0, light); tg.addColorStop(.45, stone); tg.addColorStop(1, dark);
    x.fillStyle = tg; x.fillRect(b.x - r, b.y - h, r * 2, h); x.beginPath(); x.ellipse(b.x, b.y, r, r * .35, 0, 0, 7); x.fill();
    x.fillStyle = light; x.beginPath(); x.ellipse(b.x, b.y - h, r, r * .35, 0, 0, 7); x.fill();
    x.fillStyle = dark; for (let a = 3.3; a < 6.2; a += .5) x.fillRect(b.x + Math.cos(a) * r - 2.5, b.y - h + Math.sin(a) * r * .35 - 6, 5, 6);
    x.fillStyle = '#2a2420'; x.fillRect(b.x - 2, b.y - h * .55, 4, 9); x.fillRect(b.x - 2, b.y - h * .3, 4, 9);
    if (lv === 3) { x.fillStyle = '#6e3a2a'; x.beginPath(); x.moveTo(b.x - r - 3, b.y - h); x.lineTo(b.x, b.y - h - r * 1.5); x.lineTo(b.x + r + 3, b.y - h); x.fill(); x.fillStyle = '#8a4a36'; x.beginPath(); x.moveTo(b.x - r - 3, b.y - h); x.lineTo(b.x, b.y - h - r * 1.5); x.lineTo(b.x - r * .2, b.y - h); x.fill(); }
  }
}
// ---------- figures: drawn once per look into a small bitmap, then stamped at any size ----------
const SPR = new Map(), SPR_W = 72, SPR_H = 70, SPR_OX = 36, SPR_OY = 56, SPR_S = 2.0;
// the older call, used by the siege and raid scenes: figure(ctx, {x,y}, side, colour, type, k, flip). Drawn at the old size.
function figure(x, t, side, color, type, k, flip) { figureAt(x, t.x, t.y + 2, 0.72, side, color, '#f3e8cc', type, type === 'cav' ? k % 4 : k % 3, flip, k | 0); }
function spriteFor(color, c2, type, frame, flip, variant) {
  const key = color + '|' + c2 + '|' + type + frame + (flip ? 'f' : '') + variant;
  let c = SPR.get(key);
  if (!c) { c = makeLayer(SPR_W, SPR_H, 2, g => figureRaw(g, color, c2, type, frame, flip, variant)); SPR.set(key, c); }
  return c;
}
// the figure and the shadow it throws are baked together once, so each man on the field is a single draw
let SUN_DX = -0.55; // where shadows fall, set from the hour when the scene is made
const CMB = new Map(), CMB_W = 124, CMB_OX = 64;
// figures are kept at a few fixed sizes, so every draw is a straight copy rather than a resample
const KB = k => Math.max(0.5, Math.min(1.25, Math.round(k * 4) / 4));
function figureAt(x, px, py, k, side, color, c2, type, frame, flip, variant, noShadow) {
  const kb = KB(k), key = color + '|' + c2 + '|' + type + frame + (flip ? 'f' : '') + variant + '|' + (noShadow ? 'n' : SUN_DX.toFixed(2)) + '|' + kb;
  let c = CMB.get(key);
  if (!c) {
    const spr = spriteFor(color, c2, type, frame, flip, variant);
    c = makeLayer(Math.ceil(CMB_W * kb), Math.ceil(SPR_H * kb), 2, g => {
      g.scale(kb, kb);
      if (!noShadow) { g.save(); g.translate(CMB_OX, SPR_OY); g.transform(1, 0, SUN_DX, 0.38, 0, 0); g.globalAlpha = 0.28; g.drawImage(spr, -SPR_OX, -SPR_OY, SPR_W, SPR_H); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 1; g.fillStyle = '#1a1208'; g.fillRect(-200, -200, 400, 400); g.restore(); }
      g.drawImage(spr, CMB_OX - SPR_OX, 0, SPR_W, SPR_H);
    });
    CMB.set(key, c);
  }
  x.drawImage(c, px - CMB_OX * kb, py - SPR_OY * kb, CMB_W * kb, SPR_H * kb);
}
// a man or a horseman about 18 units tall, feet at the origin, facing right
function figureRaw(x, color, c2, type, frame, flip, variant) {
  const s = flip ? -1 : 1, dark = mix(color, '#000', .35), lit = mix(color, '#fff', .18);
  const skin = variant % 3 === 0 ? '#e5c29a' : variant % 3 === 1 ? '#d6ad83' : '#c99a70';
  x.save(); x.translate(SPR_OX, SPR_OY); x.scale(s * SPR_S, SPR_S);
  x.lineCap = 'round'; x.lineJoin = 'round';
  x.fillStyle = 'rgba(0,0,0,.16)'; x.beginPath(); x.ellipse(0, 0.6, type === 'cav' ? 10 : 4.2, 1.4, 0, 0, 7); x.fill();
  const legs = (y0, h, stride, col) => { x.strokeStyle = col; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-1.2, y0); x.lineTo(-1.2 - stride, y0 + h); x.moveTo(1.2, y0); x.lineTo(1.2 + stride, y0 + h); x.stroke(); };
  const head = (hx, hy, helm) => { x.fillStyle = skin; x.beginPath(); x.arc(hx, hy, 2.1, 0, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.arc(hx - .6, hy + .3, 1.6, 1.2, 3.6); x.fill(); if (helm === 'conical') { x.fillStyle = '#8e949a'; x.beginPath(); x.moveTo(hx - 2.5, hy - .4); x.lineTo(hx, hy - 4.8); x.lineTo(hx + 2.5, hy - .4); x.closePath(); x.fill(); x.fillStyle = '#d9dee2'; x.beginPath(); x.moveTo(hx - .6, hy - .6); x.lineTo(hx - .1, hy - 4.2); x.lineTo(hx + .6, hy - .6); x.closePath(); x.fill(); x.fillStyle = '#c9ced2'; x.fillRect(hx - 2.5, hy - .9, 5, .9); x.fillStyle = '#6e7378'; x.fillRect(hx + 1.6, hy - .6, .8, 2.6); x.fillStyle = '#8e949a'; x.fillRect(hx - 2.2, hy + .2, 1.2, 2.2); } else if (helm === 'hood') { x.fillStyle = dark; x.beginPath(); x.arc(hx, hy - .4, 2.5, 3.0, 6.4); x.fill(); } else if (helm === 'cap') { x.fillStyle = '#8a6a42'; x.beginPath(); x.arc(hx, hy - .5, 2.4, 3.14, 6.28); x.fill(); } else { x.fillStyle = '#9ea3a8'; x.beginPath(); x.arc(hx, hy - .4, 2.5, 3.1, 6.3); x.fill(); x.fillRect(hx - 2.5, hy - .6, 5, 1); } };
  const kite = (kx, ky, h) => { x.fillStyle = color; x.beginPath(); x.moveTo(kx - 2.6, ky - h * .35); x.quadraticCurveTo(kx - 2.6, ky - h * .5, kx, ky - h * .5); x.quadraticCurveTo(kx + 2.6, ky - h * .5, kx + 2.6, ky - h * .35); x.lineTo(kx, ky + h * .5); x.closePath(); x.fill(); x.strokeStyle = '#f3e8cc'; x.lineWidth = .6; x.stroke(); x.fillStyle = c2; x.fillRect(kx - .5, ky - h * .45, 1, h * .8); x.fillRect(kx - 2, ky - h * .2, 4, 1); x.fillStyle = '#d9dee2'; x.beginPath(); x.arc(kx, ky - h * .2, .9, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.moveTo(kx - 2.2, ky - h * .35); x.quadraticCurveTo(kx - 2.2, ky - h * .5, kx - .4, ky - h * .5); x.lineTo(kx - .4, ky + h * .2); x.closePath(); x.fill(); };
  if (type === 'cav') {
    const horse = variant % 4 === 0 ? '#4a3220' : variant % 4 === 1 ? '#7a5433' : variant % 4 === 2 ? '#2b2119' : '#8f8a80';
    const hd = mix(horse, '#000', .3), f = frame % 4;
    // legs in four beats of the gallop
    x.strokeStyle = hd; x.lineWidth = 1.7;
    const L = [[-7, -2, 7, 3], [-6, -4, 6, 5], [-5, -5, 8, 1], [-8, 0, 5, 4]][f];
    x.beginPath(); x.moveTo(-6, -4); x.lineTo(L[0], 0); x.moveTo(-4.5, -4); x.lineTo(L[1], 0); x.moveTo(5, -4); x.lineTo(L[2], 0); x.moveTo(6.5, -4); x.lineTo(L[3], 0); x.stroke();
    // body, neck, head, tail
    x.fillStyle = horse; x.beginPath(); x.ellipse(0, -7, 9, 4, 0, 0, 7); x.fill();
    x.beginPath(); x.moveTo(6, -9); x.quadraticCurveTo(10, -14, 12, -16); x.lineTo(14.5, -14); x.quadraticCurveTo(12, -11, 9, -7); x.closePath(); x.fill();
    x.beginPath(); x.ellipse(13.5, -15.5, 3.2, 1.8, -.5, 0, 7); x.fill();
    x.fillStyle = hd; x.beginPath(); x.moveTo(11.5, -17.5); x.lineTo(12.5, -20); x.lineTo(13.5, -17.5); x.fill();
    x.strokeStyle = hd; x.lineWidth = 1.3; x.beginPath(); x.moveTo(-8.5, -8); x.quadraticCurveTo(-12, -6 + (f % 2), -11, -1); x.stroke();
    // caparison and saddle cloth in the house colour
    x.fillStyle = color; x.beginPath(); x.moveTo(-6, -8); x.lineTo(5, -8); x.lineTo(6, -3); x.lineTo(-7, -3); x.closePath(); x.fill();
    x.fillStyle = '#f3e8cc'; x.fillRect(-7, -4, 13, .8); x.fillStyle = c2; x.fillRect(-1, -7.5, 2, 3.5);
    // the rider, cloaked
    x.fillStyle = dark; x.beginPath(); x.moveTo(-2, -17); x.quadraticCurveTo(-9 - (f % 2), -12, -8, -6); x.lineTo(-3, -9); x.closePath(); x.fill();
    x.fillStyle = color; x.fillRect(-2.2, -17, 4.4, 8); x.fillStyle = dark; x.fillRect(-2.2, -17, 1.4, 8); x.fillStyle = '#8e949a'; x.fillRect(-2.4, -16.4, 4.8, 1.6);
    x.strokeStyle = '#6b5a3a'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(-1, -9.5); x.lineTo(-2, -4); x.stroke();
    head(0, -19.5, 'conical');
    // couched lance, with a gonfanon on every other horseman
    x.strokeStyle = '#3a2817'; x.lineWidth = .9; x.beginPath(); x.moveTo(-4, -13); x.lineTo(20, -20); x.stroke();
    x.fillStyle = '#c9ced2'; x.beginPath(); x.moveTo(19.5, -19.8); x.lineTo(23, -21.2); x.lineTo(20.2, -18.6); x.fill();
    if (variant % 2) { x.fillStyle = color; x.beginPath(); x.moveTo(13, -18); x.lineTo(19, -19.7); x.lineTo(15, -22); x.lineTo(12, -21); x.closePath(); x.fill(); }
    kite(-3.5, -13, 9);
  } else {
    const militia = type === 'militia', tunic = militia ? (variant % 2 ? '#b59a6a' : '#8f7a55') : color, td = mix(tunic, '#000', .3);
    const stride = frame === 1 ? 2.6 : frame === 2 ? 0.4 : -1.6;
    legs(-5, 5, stride, militia ? '#6b5a3a' : '#5a4a36');
    // mail shows at the arms and under the tunic on fighting men
    if (!militia && type === 'foot') { x.fillStyle = '#8e949a'; x.fillRect(-3, -14, 6, 10); }
    x.fillStyle = tunic; x.beginPath(); x.moveTo(-2.6, -13.5); x.lineTo(2.6, -13.5); x.lineTo(3.2, -5); x.lineTo(-3.2, -5); x.closePath(); x.fill();
    x.fillStyle = td; x.beginPath(); x.moveTo(-2.6, -13.5); x.lineTo(-1.2, -13.5); x.lineTo(-1.6, -5); x.lineTo(-3.2, -5); x.closePath(); x.fill();
    x.fillStyle = '#3a2a1c'; x.fillRect(-3, -9.2, 6.2, .9);
    if (type === 'foot') {
      head(0, -16, 'conical');
      x.strokeStyle = '#3a2817'; x.lineWidth = .9; x.beginPath(); x.moveTo(-1, -6); x.lineTo(4, -26); x.stroke();
      x.fillStyle = '#c9ced2'; x.beginPath(); x.moveTo(3.6, -25.6); x.lineTo(4.6, -29.5); x.lineTo(5.5, -25.3); x.fill();
      if (variant % 3 === 0) { x.fillStyle = color; x.beginPath(); x.moveTo(4.2, -25); x.lineTo(9, -24); x.lineTo(4.6, -22); x.closePath(); x.fill(); }
      kite(3.4, -9, 11);
    } else if (type === 'bow') {
      head(0, -16, 'hood');
      x.fillStyle = '#6b4a2b'; x.fillRect(-4.2, -14, 1.6, 7); x.strokeStyle = '#f3e8cc'; x.lineWidth = .4; x.beginPath(); x.moveTo(-3.4, -14); x.lineTo(-3.4, -15.5); x.stroke();
      const bx = frame === 2 ? 1 : 3, pull = frame === 2 ? -3.5 : frame === 1 ? 0.5 : null;
      x.strokeStyle = '#5a3e24'; x.lineWidth = 1.1; x.beginPath(); x.arc(bx, -10, 6, -1.25, 1.25); x.stroke();
      x.strokeStyle = '#e8dcc0'; x.lineWidth = .5; x.beginPath(); if (pull !== null) { x.moveTo(bx + 1.9, -15.7); x.lineTo(pull, -10); x.lineTo(bx + 1.9, -4.3); } else { x.moveTo(bx + 1.9, -15.7); x.lineTo(bx + 1.9, -4.3); } x.stroke();
      if (pull !== null) { x.strokeStyle = '#3a2817'; x.lineWidth = .7; x.beginPath(); x.moveTo(pull, -10); x.lineTo(bx + 7, -10); x.stroke(); x.fillStyle = '#c9ced2'; x.beginPath(); x.moveTo(bx + 7, -10.8); x.lineTo(bx + 9, -10); x.lineTo(bx + 7, -9.2); x.fill(); }
      x.strokeStyle = skin; x.lineWidth = 1.2; x.beginPath(); x.moveTo(0, -11); x.lineTo(pull !== null ? pull + 1 : bx - 1, -10); x.stroke();
    } else {
      head(0, -16, 'cap');
      x.strokeStyle = '#5a3e24'; x.lineWidth = .9; x.beginPath(); x.moveTo(-1, -6); x.lineTo(3, -24); x.stroke();
      if (variant % 2) { x.beginPath(); x.moveTo(1.6, -22.5); x.lineTo(4.4, -22.5); x.moveTo(1.9, -22.5); x.lineTo(1.9, -25); x.moveTo(3, -22.5); x.lineTo(3, -25.5); x.moveTo(4.1, -22.5); x.lineTo(4.1, -25); x.stroke(); }
      else { x.fillStyle = '#c9ced2'; x.beginPath(); x.moveTo(2.6, -23.6); x.lineTo(3.4, -26.5); x.lineTo(4.2, -23.4); x.fill(); }
      x.fillStyle = '#7a5a34'; x.beginPath(); x.arc(3.2, -9.5, 3, 0, 7); x.fill(); x.fillStyle = '#9ea3a8'; x.beginPath(); x.arc(3.2, -9.5, .9, 0, 7); x.fill();
    }
  }
  x.restore();
}
// a banner on a staff: the arms wave in the wind
function drawBanner(x, fid, px, py, h, flip, t, k = 1) {
  const spr = armsSprite(fid), w = 26 * k, hh = 32 * k;
  x.strokeStyle = '#2a1d12'; x.lineWidth = 2.6 * k; x.beginPath(); x.moveTo(px, py + h); x.lineTo(px, py - 6 * k); x.stroke();
  x.strokeStyle = '#8a6a42'; x.lineWidth = .8 * k; x.beginPath(); x.moveTo(px - .6 * k, py + h); x.lineTo(px - .6 * k, py - 6 * k); x.stroke();
  x.fillStyle = '#e2b33c'; x.beginPath(); x.moveTo(px, py - 12 * k); x.lineTo(px + 2.6 * k, py - 7 * k); x.lineTo(px, py - 4 * k); x.lineTo(px - 2.6 * k, py - 7 * k); x.closePath(); x.fill();
  // the cloth, drawn in strips so it ripples
  const strips = 4, dir = flip ? -1 : 1;
  x.save(); x.beginPath(); x.rect(px - w - 4, py - 8, 2 * w + 8, hh + 16); x.clip();
  for (let i = 0; i < strips; i++) {
    const f0 = i / strips, f1 = (i + 1) / strips, wave = f => Math.sin(t * 5 + f * 4.5) * 2.4 * k * f;
    const sx0 = px + dir * (1 + w * f0), sx1 = px + dir * (1 + w * f1);
    if (spr) { x.save(); x.beginPath(); x.moveTo(sx0, py + wave(f0)); x.lineTo(sx1, py + wave(f1)); x.lineTo(sx1, py + hh + wave(f1)); x.lineTo(sx0, py + hh + wave(f0)); x.closePath(); x.clip(); x.drawImage(spr, flip ? px - w - 1 : px + 1, py + (wave(f0) + wave(f1)) / 2, w, hh); x.restore(); }
    else { x.fillStyle = '#c9b48a'; x.fillRect(Math.min(sx0, sx1), py, Math.abs(sx1 - sx0) + .5, hh); }
    x.fillStyle = i % 2 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.08)'; x.beginPath(); x.moveTo(sx0, py + wave(f0)); x.lineTo(sx1, py + wave(f1)); x.lineTo(sx1, py + hh + wave(f1)); x.lineTo(sx0, py + hh + wave(f0)); x.closePath(); x.fill();
  }
  x.restore();
}
// a siege ladder against the wall, with men on it
function drawLadder(x, V, y, t, color, c2, variant) {
  const lv = V.cfg.castleLv || 1, b = proj(WALLX - 16, y), tp = wallTop(y, lv), H = tp.y - 6 - b.y;
  x.strokeStyle = '#6b4a2b'; x.lineWidth = 2.2 * b.k; x.beginPath(); x.moveTo(b.x - 3 * b.k, b.y); x.lineTo(tp.x - 1, tp.y - 6); x.moveTo(b.x + 3 * b.k, b.y); x.lineTo(tp.x + 5, tp.y - 6); x.stroke();
  x.lineWidth = 1.2 * b.k; for (let f = .08; f < 1; f += .1) { x.beginPath(); x.moveTo(b.x - 3 * b.k + (tp.x - 1 - b.x + 3 * b.k) * f, b.y + H * f); x.lineTo(b.x + 3 * b.k + (tp.x + 5 - b.x - 3 * b.k) * f, b.y + H * f); x.stroke(); }
  for (let i = 0; i < 3; i++) { const f = ((t * .25 + i * .33 + variant * .1) % 1); const fx = b.x + (tp.x + 2 - b.x) * f, fy = b.y + H * f; figureAt(x, fx, fy + 4, b.k * .9, 0, color, c2, 'foot', Math.floor(t * 4 + i) % 3, false, i + variant, true); }
}
// ---------- the frame ----------
function drawBattle(V) {
  const x = V.ctx, B = V.B, bg = V.bg, time = B.t, dt = V.dt || 0.016;
  // the camera eases in on the clash and out again at the end; it is a transform on the canvases, so the GPU does the work
  if (cam_first(bg)) { bg.cam.z = 1.34; bg.cam.x = proj(500, 270).x; bg.cam.y = proj(500, 270).y; }
  const cam = bg.cam, wantZ = B.done ? 1.0 : (B.contact ? (V.slow > 0 ? 1.22 : 1.12) : 1.0);
  const focus = B.castle ? proj(WALLX - 30, 270) : proj((B.front[0] + B.front[1]) / 2, 270);
  cam.z += (wantZ - cam.z) * Math.min(1, dt * (V.slow > 0 ? 4 : 1.5)); cam.x += (focus.x - cam.x) * Math.min(1, dt * 1.2); cam.y += (focus.y - cam.y) * Math.min(1, dt * 1.2);
  // the canvases carry no transform at all while the camera rests, so the compositor has nothing to do
  if (!V.camLast || Math.abs(V.camLast - cam.z) > 0.002 || Math.abs((V.camX || 0) - cam.x) > 2) {
    V.camLast = cam.z; V.camX = cam.x;
    const rest = cam.z < 1.004;
    const px = (cam.x / BW_ * 100 - 50).toFixed(1), py = (cam.y / BH_ * 100 - 50).toFixed(1);
    const tf = rest ? (V.camBase || '') : `${V.camBase} translate(${px}%,${py}%) scale(${cam.z.toFixed(3)}) translate(${-px}%,${-py}%)`;
    for (const c of [x.canvas, V.bgc]) c.style.transform = tf;
  }
  x.clearRect(0, 0, BW_, BH_);
  // the fallen are laid down on the field canvas once each and never redrawn
  const cx = V.corpX;
  while (V.corpN < B.corpses.length) { const c = B.corpses[V.corpN++]; const p = proj(c.x, c.y); cx.save(); cx.translate(p.x, p.y); cx.scale(p.k, p.k); cx.rotate((c.r % 1.2) - .6); cx.globalAlpha = .85; cx.fillStyle = 'rgba(0,0,0,.18)'; cx.beginPath(); cx.ellipse(0, 1, 9, 2.4, 0, 0, 7); cx.fill(); cx.fillStyle = V.colors[c.s]; cx.fillRect(-6, -2.6, 9, 4.2); cx.fillStyle = mix(V.colors[c.s], '#000', .35); cx.fillRect(-6, -2.6, 9, 1.4); cx.fillStyle = '#e5c29a'; cx.beginPath(); cx.arc(5, -.6, 2, 0, 7); cx.fill(); cx.fillStyle = '#9ea3a8'; cx.beginPath(); cx.arc(5.4, -1.4, 1.9, 3.1, 6.3); cx.fill(); cx.strokeStyle = '#3a2817'; cx.lineWidth = .8; cx.beginPath(); cx.moveTo(-9, 3); cx.lineTo(8, 4.5); cx.stroke(); cx.restore(); }
  // water glints on the moat
  if (B.castle && V.cfg.moat) { x.strokeStyle = 'rgba(220,240,255,.45)'; x.lineWidth = 1; for (let y = 20; y < BH_; y += 34) { const p = proj(WALLX - 36 + Math.sin(time * 1.3 + y) * 8, y); x.beginPath(); x.moveTo(p.x - 6 * p.k, p.y); x.lineTo(p.x + 6 * p.k, p.y); x.stroke(); } }
  // everything that stands is sorted by depth and drawn far to near
  const items = [];
  const lv = V.cfg.castleLv || 1, live = B.sq.filter(q => q.n >= 0.05).length, perSq = live > 22 ? 8 : live > 14 ? 10 : 12;
  for (const q of B.sq) {
    if (q.n < 0.05) continue;
    const count = clamp(Math.round(q.n * 3), 2, perSq), cols = q.t === 'cav' ? 3 : 4;
    const onWall = B.castle && q.s === 1 && q.role === 'wall';
    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols), c = i % cols;
      const bob = q.moving ? Math.abs(Math.sin(time * 9 + i * 1.3 + q.hy)) * 1.6 : Math.sin(time * 2 + i) * 0.3;
      const px = q.x + (q.s === 0 ? -1 : 1) * r * (q.t === 'cav' ? 26 : 15) + (c % 2) * 6, py = q.y + (c - (cols - 1) / 2) * (q.t === 'cav' ? 22 : 17);
      const p = proj(onWall ? WALLX + 6 : px, py);
      const frame = q.t === 'cav' ? Math.floor(time * 10 + i) % 4 : q.t === 'bow' ? (q.role === 'wall' || B.arrows.length ? Math.floor(time * 2.2 + i * .9) % 3 : 0) : q.moving ? Math.floor(time * 8 + i * .7) % 3 : (q.s === 0 ? 0 : 2);
      items.push({ y: p.y + (onWall ? -1000 : 0), d: () => figureAt(x, p.x, onWall ? p.y - WALL_H(lv) * p.k - 3 : p.y - bob * p.k, p.k * (onWall ? .85 : 1), q.s, V.colors[q.s], V.c2[q.s], q.t, frame, q.s === 1, i + r * 3 + (q.hy | 0)) });
    }
  }
  // standards with the lines, and over the keep
  for (const s of [0, 1]) {
    const qs = B.sq.filter(q => q.s === s && q.n > 0.05 && (q.role === 'line' || q.role === 'wall'));
    if (!qs.length || (B.castle && s === 1)) continue;
    const mx = qs.reduce((a, q) => a + q.x, 0) / qs.length + (s === 0 ? -34 : 34), p = proj(mx, 236);
    items.push({ y: p.y + 1, d: () => drawBanner(x, V.fids[s], p.x, p.y - 64 * p.k, 64 * p.k, s === 1, time + s, p.k) });
  }
  if (B.castle && V.keepTop) items.push({ y: -2000, d: () => drawBanner(x, V.fids[1], V.keepTop.x, V.keepTop.y - 40, 40, true, time, .9) });
  // ladders go up once the attackers reach the wall
  if (B.castle && B.contact && B.lvl > 0 && !B.done) for (const q of B.sq) if (q.s === 0 && q.role === 'line' && q.n > 0.05) { const p = proj(WALLX, q.y); items.push({ y: p.y + 2, d: () => drawLadder(x, V, q.y, time, V.colors[0], V.c2[0], q.hy | 0) }); }
  // catapults on the walls
  if (B.castle && B.cats && !V.cfg.ruined) [60, 270, 480].slice(0, Math.min(3, B.cats)).forEach((ty, i) => { const tp = wallTop(ty, lv); items.push({ y: -1500 + i, d: () => { x.save(); x.translate(tp.x + 8 * tp.k, tp.y - 4 * tp.k); x.scale(tp.k, tp.k); x.fillStyle = '#5a3e24'; x.fillRect(-9, -5, 18, 7); x.fillStyle = '#3a2817'; x.fillRect(-10, 1, 20, 2); x.strokeStyle = '#3a2817'; x.lineWidth = 3; const a = -2.3 + Math.sin(time * 2 + i) * 0.5; x.beginPath(); x.moveTo(0, -2); x.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); x.stroke(); x.restore(); } }); });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.d();
  // dust: behind the horse, and hanging over the clash
  for (const d of V.dust) { const p = proj(d.x, d.y); const a = 0.28 * (1 - d.t); x.fillStyle = `rgba(190,170,120,${a})`; x.beginPath(); x.arc(p.x, p.y - d.t * 14 * p.k, (d.r + d.t * 12) * p.k, 0, 7); x.fill(); }
  if (B.contact && !B.done) { const m = B.castle ? proj(WALLX - 30, 270) : proj((B.front[0] + B.front[1]) / 2, 270); const hg = x.createRadialGradient(m.x, m.y, 10, m.x, m.y, 190); hg.addColorStop(0, 'rgba(200,180,130,.22)'); hg.addColorStop(1, 'rgba(200,180,130,0)'); x.fillStyle = hg; x.fillRect(m.x - 200, m.y - 160, 400, 320); }
  // arrows in flight, each with its shadow running along the ground
  x.lineCap = 'round';
  for (const a of B.arrows) {
    const t = a.t, gx = a.x + (a.tx - a.x) * t, gy = a.y + (a.ty - a.y) * t, lift = Math.sin(t * Math.PI) * 46;
    const p = proj(gx, gy), t2 = Math.max(0, t - .06), p2 = proj(a.x + (a.tx - a.x) * t2, a.y + (a.ty - a.y) * t2), lift2 = Math.sin(t2 * Math.PI) * 46;
    x.fillStyle = 'rgba(0,0,0,.12)'; x.beginPath(); x.ellipse(p.x, p.y, 3 * p.k, 1 * p.k, 0, 0, 7); x.fill();
    const fire = bg.hour === 'dusk' && a.s === 1 && B.castle;
    if (fire) { x.strokeStyle = 'rgba(255,140,40,.5)'; x.lineWidth = 4 * p.k; x.beginPath(); x.moveTo(p2.x, p2.y - lift2 * p.k); x.lineTo(p.x, p.y - lift * p.k); x.stroke(); x.fillStyle = '#ffd27a'; x.beginPath(); x.arc(p.x, p.y - lift * p.k, 2.2 * p.k, 0, 7); x.fill(); }
    x.strokeStyle = '#3a2a18'; x.lineWidth = 1.3 * p.k; x.beginPath(); x.moveTo(p2.x, p2.y - lift2 * p.k); x.lineTo(p.x, p.y - lift * p.k); x.stroke();
    x.strokeStyle = '#e8dcc0'; x.lineWidth = 1.6 * p.k; x.beginPath(); x.moveTo(p2.x, p2.y - lift2 * p.k); x.lineTo(p2.x + (p.x - p2.x) * .3, p2.y - lift2 * p.k + (p.y - lift * p.k - p2.y + lift2 * p.k) * .3); x.stroke();
  }
  // rubble where a stone has just struck, hoofprints where the horse has passed
  V.rubble = V.rubble || [];
  for (const s of B.stones) if (s.tx !== undefined && s.t > 0.96 && !s.hit) { s.hit = 1; const p = proj(s.tx, s.ty); for (let i = 0; i < 10; i++) V.rubble.push({ x: p.x, y: p.y - WALL_H(lv) * p.k * (s.x < WALLX ? 1 : 0), vx: (Math.random() - .5) * 90, vy: -40 - Math.random() * 70, t: 0, r: (1.5 + Math.random() * 2.5) * p.k, g: p.y }); for (let i = 0; i < 4; i++) V.dust.push({ x: s.tx + (Math.random() - .5) * 20, y: s.ty + (Math.random() - .5) * 20, r: 8 + Math.random() * 8, t: 0 }); }
  V.rubble = V.rubble.filter(r => r.t < 1.6);
  for (const r of V.rubble) { r.t += dt; r.vy += 160 * dt; r.x += r.vx * dt; r.y += r.vy * dt; if (r.y > r.g) { r.y = r.g; r.vy *= -0.3; r.vx *= 0.6; } x.fillStyle = '#5a5248'; x.fillRect(r.x, r.y, r.r, r.r); }
  for (const q of B.sq) if (q.t === 'cav' && q.moving && q.n > 0.05 && Math.random() < 0.5) { const p = proj(q.x + (Math.random() - .5) * 30, q.y + (Math.random() - .5) * 30); cx.fillStyle = 'rgba(60,45,20,.10)'; cx.beginPath(); cx.ellipse(p.x, p.y, 4 * p.k, 1.6 * p.k, 0, 0, 7); cx.fill(); }
  for (const s of B.stones) if (s.tx !== undefined) { const t = s.t, gx = s.x + (s.tx - s.x) * t, gy = s.y + (s.ty - s.y) * t, p = proj(gx, gy), lift = Math.sin(t * Math.PI) * 150 + (1 - t) * WALL_H(lv); x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.ellipse(p.x, p.y + 3, 7 * p.k, 2.6 * p.k, 0, 0, 7); x.fill(); x.fillStyle = '#4a4338'; x.beginPath(); x.arc(p.x, p.y - lift * p.k, 6 * p.k, 0, 7); x.fill(); x.fillStyle = '#7a7368'; x.beginPath(); x.arc(p.x - 2 * p.k, p.y - lift * p.k - 2 * p.k, 2.4 * p.k, 0, 7); x.fill(); }
  // charges raise a wall of dust; the reserve comes up under a brief golden sheen
  for (const f of B.fx) if (f.k === 'charge') { for (let i = 0; i < 5; i++) { const p = proj(B.front[1 - f.s] + (f.s === 0 ? 70 : -70), 150 + i * 60); x.fillStyle = `rgba(180,150,90,${0.4 * (1 - f.t / 1.5)})`; x.beginPath(); x.arc(p.x, p.y - 6, (18 + f.t * 40) * p.k, 0, 7); x.fill(); } }
  // the clash: flashes of steel where the lines meet
  if ((B.contact || B.wing[0].s === 'fight') && !B.done) {
    x.strokeStyle = '#fff3c4'; x.lineWidth = 1.5;
    const spots = [];
    if (B.contact) for (let i = 0; i < 7; i++) spots.push([B.castle ? WALLX - 12 : (B.front[0] + B.front[1]) / 2 + (Math.random() - .5) * 20, 150 + Math.random() * 240]);
    if (B.wing[0].s === 'fight') spots.push([(B.front[0] + B.front[1]) / 2, 70 + Math.random() * 12], [(B.front[0] + B.front[1]) / 2, 462 + Math.random() * 12]);
    for (const [sx, sy] of spots) { const p = proj(sx, sy), h = (12 + Math.random() * 10) * p.k; x.globalAlpha = .5 + Math.random() * .5; x.beginPath(); x.moveTo(p.x - 3, p.y - h); x.lineTo(p.x + 3, p.y - h + 6); x.moveTo(p.x + 3, p.y - h); x.lineTo(p.x - 3, p.y - h + 6); x.stroke(); }
    x.globalAlpha = 1;
  }
  // spent arrows stay where they fell
  for (const a of B.arrows) if (a.t > 0.93 && !a.stuck) { a.stuck = 1; const p = proj(a.tx, a.ty); cx.strokeStyle = '#3a2a18'; cx.lineWidth = 1 * p.k; cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(p.x + (a.tx > a.x ? -3 : 3) * p.k, p.y - 7 * p.k); cx.stroke(); cx.strokeStyle = '#e8dcc0'; cx.beginPath(); cx.moveTo(p.x + (a.tx > a.x ? -2.4 : 2.4) * p.k, p.y - 5.6 * p.k); cx.lineTo(p.x + (a.tx > a.x ? -3 : 3) * p.k, p.y - 7 * p.k); cx.stroke(); }
  if (bg.mist) { const m = x.createLinearGradient(0, HOR - 10, 0, HOR + 90); m.addColorStop(0, 'rgba(235,235,230,0)'); m.addColorStop(.4, `rgba(235,235,230,${.35 + Math.sin(time * .4) * .06})`); m.addColorStop(1, 'rgba(235,235,230,0)'); x.fillStyle = m; x.fillRect(0, HOR - 10, BW_, 100); }
  if (bg.rain) { x.strokeStyle = 'rgba(220,230,240,.35)'; x.lineWidth = 1; x.beginPath(); for (const d of bg.drops) { d.y += d.v * dt; d.x += 60 * dt; if (d.y > BH_) { d.y = -10; d.x = Math.random() * (BW_ + 200) - 100; } x.moveTo(d.x, d.y); x.lineTo(d.x - 1.5, d.y + d.l); } x.stroke(); }
  // weather and birds
  if (bg.flakes.length) { x.fillStyle = bg.season === 3 ? 'rgba(255,255,255,.85)' : 'rgba(200,120,40,.8)'; for (const f of bg.flakes) { f.y += f.v * dt; f.x += Math.sin(time * 1.5 + f.w) * 18 * dt + (bg.season === 2 ? 12 * dt : 0); if (f.y > BH_) { f.y = -4; f.x = Math.random() * BW_; } if (f.x > BW_ + 4) f.x = -4; if (bg.season === 3) x.fillRect(f.x, f.y, f.r * 1.6, f.r * 1.6); else { x.beginPath(); x.ellipse(f.x, f.y, f.r, f.r * .5, f.w + time, 0, 7); x.fill(); } } }
  for (const b of bg.birds) { b.x += b.v * dt; if (b.x > BW_ + 60) b.x = -80; x.strokeStyle = 'rgba(40,30,20,.6)'; x.lineWidth = 1; for (let i = 0; i < b.n; i++) { const bx = b.x + i * 11 - (i % 2) * 4, by = b.y + i * 3, fl = Math.sin(time * 8 + i) * 2; x.beginPath(); x.moveTo(bx - 4, by - fl); x.lineTo(bx, by); x.lineTo(bx + 4, by - fl); x.stroke(); } }
  for (const c of bg.clouds) c.x += c.v * dt * 0; // clouds are baked into the sky; they stay
  // the end of the day
  if (B.done) {
    const e = Math.min(1, V.endT / 1.2);
    if (B.win === 0 && V.endT > 0.4) { const p = proj(B.castle ? WALLX - 60 : (B.front[0] + B.front[1]) / 2, 300); const lift = Math.min(1, (V.endT - 0.4) / 0.8); const gl = x.createRadialGradient(p.x, p.y - 70 * lift, 5, p.x, p.y - 70 * lift, 120); gl.addColorStop(0, `rgba(255,235,170,${.45 * lift})`); gl.addColorStop(1, 'rgba(255,235,170,0)'); x.fillStyle = gl; x.fillRect(p.x - 130, p.y - 200, 260, 260); drawBanner(x, V.fids[0], p.x, p.y - 20 - 70 * lift, 90 * lift + 20, false, time * 1.6, 1.25); }
    if (B.win !== 0) { V.crows = V.crows || Array.from({ length: 9 }, (_, i) => ({ x: -40 - i * 60, y: 40 + (i * 37) % 70, v: 50 + (i % 3) * 14 })); x.strokeStyle = 'rgba(20,12,8,.8)'; x.lineWidth = 1.4; for (const b of V.crows) { b.x += b.v * dt; const fl = Math.sin(time * 9 + b.x) * 3; x.beginPath(); x.moveTo(b.x - 6, b.y - fl); x.lineTo(b.x, b.y); x.lineTo(b.x + 6, b.y - fl); x.stroke(); } }
    if (B.win === 0) { const g = x.createRadialGradient(500, 300, 20, 500, 300, 620); g.addColorStop(0, `rgba(255,225,150,${.28 * e})`); g.addColorStop(1, 'rgba(255,200,100,0)'); x.fillStyle = g; x.fillRect(0, 0, BW_, BH_);
      V.sparks = V.sparks || []; if (V.sparks.length < 90 && Math.random() < .8) V.sparks.push({ x: Math.random() * BW_, y: BH_ + 10, v: 30 + Math.random() * 60, w: Math.random() * 6.28, r: 1 + Math.random() * 2 });
      x.fillStyle = '#ffe9a8'; for (const s of V.sparks) { s.y -= s.v * dt; s.x += Math.sin(time * 2 + s.w) * 12 * dt; x.globalAlpha = Math.max(0, Math.min(1, (s.y / BH_))) * .9; x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fill(); } x.globalAlpha = 1; }
    else { x.fillStyle = `rgba(40,20,20,${.32 * e})`; x.fillRect(0, 0, BW_, BH_); }
  }
  drawTitle(x, V);
}
// the phase titles are written on the scene itself, so they turn with it on a phone
function drawTitle(x, V) {
  const B = V.B, tt = V.title; if (!tt) return;
  const age = (performance.now() - tt.t0) / 1000, big = B.done;
  const life = big ? 99 : 2.2, a = age < .25 ? age / .25 : age > life - .5 ? Math.max(0, (life - age) / .5) : 1;
  if (a <= 0) { if (!big) V.title = null; return; }
  const sc = big ? 1 + Math.max(0, .18 - age * .3) : 1 + Math.max(0, .06 - age * .2);
  // the lettering is set once into a layer; each frame only places it
  if (!tt.layer || tt.big !== big) {
    tt.big = big;
    tt.layer = makeLayer(BW_, 120, 2, g => {
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.translate(BW_ / 2, 60);
      if (big) { g.fillStyle = 'rgba(20,12,6,.55)'; g.fillRect(-520, -46, 1040, 92); g.fillStyle = '#e2b33c'; g.fillRect(-520, -47, 1040, 1.5); g.fillRect(-520, 46, 1040, 1.5); }
      g.font = `${big ? 900 : 700} ${big ? 54 : 26}px Cinzel, serif`; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(20,12,6,.9)'; g.lineWidth = big ? 8 : 5; g.strokeText(tt.text, 0, 0);
      const gr = g.createLinearGradient(0, -24, 0, 24); gr.addColorStop(0, '#fff2c9'); gr.addColorStop(.5, '#e2b33c'); gr.addColorStop(1, '#b8892c');
      g.fillStyle = gr; g.fillText(tt.text, 0, 0);
      if (tt.sub) { g.font = `italic 15px "IM Fell English", serif`; g.fillStyle = '#f3e8cc'; g.strokeStyle = 'rgba(20,12,6,.8)'; g.lineWidth = 3; g.strokeText(tt.sub, 0, big ? 34 : 24); g.fillText(tt.sub, 0, big ? 34 : 24); }
    });
  }
  x.save(); x.globalAlpha = a; x.translate(500, big ? 230 : 150); x.scale(sc, sc); x.drawImage(tt.layer, -BW_ / 2, -60, BW_, 120); x.restore();
}
function setTitle(V, text, sub) { V.title = { text, sub, t0: performance.now() }; }
