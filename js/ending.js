'use strict';
// ================= THE END OF A GAME, STATISTICS, SHARING, AND THE CHRONICLER'S CHALLENGE =================
const LAST_KEY = 'cotf-lastgame';
// a finished game belongs to its own map: its names, dates and coastline come from there, not from the map now open
const mapOfGame = S => MAPS[(S && S.map) || 'france'] || SC;
const onThisMap = L => !!L && (L.map || 'france') === MAP_ID && (L.ids || []).every(id => CELLD[id]);
// a house as it was on the map its game was played on
const houseOfGame = (id, map) => ((MAPS[map || 'france'] || SC).FACTIONS.find(f => f.id === id)) || FACMAP[id] || null;
const latinTitle = M => ((M.win && M.win.latin) || M.crown.latin).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// ---------- the ending ----------
// replaces the old one-box ending: a coronation (or a fall), then the chronicle of the game
gameOver = function () {
  const won = G.winner === me();
  const S = recordGame();
  saveLastGame(S);
  clearSave();
  if (won) {
    setMusic('coronation'); sfx('bell'); setTimeout(() => sfx('cheer'), 900); buzz(60);
    const body = S.how === 'conquest'
      ? `In ${dateStr(G.turn)} the last rival house falls. ${WIN.endAll(FAC(me()).pname)}`
      : `In ${dateStr(G.turn)} ${WIN.endWon(FAC(me()).pname)} ${owned(me()).length} counties, ${SHARE_TXT === 'half' ? 'half the realm' : 'the heart of the realm'} of ${SC.crown.people}.`;
    showModal(`<div class="splash">${coronationScene(me(), 'franks', WIN.latin)}<div class="splashtxt"><h2>${WIN.latin.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</h2><p class="sub ctr" style="margin-top:-6px">${esc(FAC(me()).name)} · ${G.turn} turns</p><p>${body}</p>
      <div class="row ctr"><button class="btn gold big" onclick="closeModal();openStats(G.recorded,0)">${WIN.cheer || 'Long live the King'}</button></div></div></div>`, 'splashcard');
  } else {
    setMusic('defeat'); sfx('defeat');
    const W = G.winner ? FAC(G.winner) : null;
    showModal(`<div class="rep badrep"><div class="sealmark">${ico('swords')}</div><h2>${W ? `${esc(W.name)} takes the crown` : 'Your house has fallen'}</h2>
      <p>${W ? `${esc(W.pname)} ${alive().length === 1 ? 'has broken every rival house' : `is ${WIN.anointed}, master of half the kingdom`}. ${G.fac[me()].alive ? `${esc(rulerOf(me()))} keeps his lands, but not the crown.` : `${esc(rulerOf(me()))}'s line is broken.`}` : `${esc(rulerOf(me()))}'s line is broken. Another will take the kingdom.`}</p>
      <p class="sub ctr">${dateStr(G.turn)} · ${G.turn} turns</p>
      <div class="row ctr"><button class="btn gold big" onclick="closeModal();openStats(G.recorded,0)">The chronicle of your reign</button></div></div>`);
  }
};
// what the statistics pages need from the last game, kept apart from the long history
function saveLastGame(S) {
  if (!G.stats) return;
  const houses = G.fdefs.map(d => ({ id: d.id, n: d.name, col: d.color, c: (G.stats.h[d.id] || { c: [] }).c }));
  saveJ(LAST_KEY, { when: S.when, map: MAP_ID, player: G.player, houses, own: G.stats.own, ids: PROV.map(r => r[0]) });
}

// ---------- the statistics pages ----------
let STP = null;
function openStats(S, page = 0) {
  const H = gameHistory();
  S = S || H[H.length - 1] || null;
  const L = loadJ(LAST_KEY, null), last = L && S && L.when === S.when ? L : null;
  const P = profile(), r = rankOf(P.points);
  const pages = [statsGame(S, last), statsHistory(H), statsVsAvg(S, H)];
  const names = ['This game', 'Your games', 'Against your average'];
  showModal(`<div class="sthead">${myAchievement(56, { noScroll: true })}<div><b>${RANKS[r].n}</b><small>${P.points} points</small></div></div>
    <div class="stdots">${names.map((n, i) => `<button onclick="stGo(${i})" data-i="${i}">${n}</button>`).join('')}</div>
    <div class="stpages" id="stpages">${pages.map(h => `<section class="stpage">${h}</section>`).join('')}</div>
    <div class="row ctr" style="margin-top:8px"><button class="btn gold" onclick="closeModal();${G && !G.over ? 'render()' : 'showTitle()'}">${G && !G.over ? 'Back to the game' : 'To the title'}</button>${S ? `<button class="btn" onclick="shareGame()"><span class="lbl">${ico('star')}Share</span></button>` : ''}<button class="btn" onclick="openMedals('trophies')">Medals</button></div>`, 'wide statsm', { closable: true });
  const box = $('#stpages');
  const mark = () => { const i = Math.round(box.scrollLeft / Math.max(1, box.clientWidth)); document.querySelectorAll('.stdots button').forEach(b => b.classList.toggle('on', +b.dataset.i === i)); };
  box.addEventListener('scroll', mark, { passive: true });
  requestAnimationFrame(() => { box.scrollLeft = box.clientWidth * page; mark(); if (last) playLapse(last); });
}
function stGo(i) { const box = $('#stpages'); if (box) box.scrollTo({ left: box.clientWidth * i, behavior: 'smooth' }); }
const row = (k, v, cls = '') => `<tr><td>${k}</td><td class="${cls}">${v}</td></tr>`;
function statsGame(S, L) {
  if (!S) return '<p class="sub">No game finished yet. Play one to the end and its chronicle appears here.</p>';
  const m = S.m || {}, P = profile();
  let h = `<h3>${S.won ? 'Victory' : 'Defeat'} · ${esc(S.name)}</h3><p class="sub">${S.won ? (S.how === 'conquest' ? 'Every rival broken' : `${((mapOfGame(S).win && mapOfGame(S).win.crowned) || mapOfGame(S).crown.crowned)[0].toUpperCase() + ((mapOfGame(S).win && mapOfGame(S).win.crowned) || mapOfGame(S).crown.crowned).slice(1)} with half the kingdom`) : S.winner ? `The crown went to ${esc(FACMAP[S.winner] ? FACMAP[S.winner].name : 'a rebel house')}` : 'Your house fell'} · ${S.year} · ${S.turns} turns · ${DIFF[S.diff] ? DIFF[S.diff].n : ''} rivals${S.challenge ? ' · challenge' : ''}</p>`;
  if (S.rankAfter > S.rankBefore) h += `<div class="notebox good rankup">${myAchievement(70, { noScroll: true })}<div><b>You rise to ${RANKS[S.rankAfter].n}!</b><br><span class="sub">Unlocked: ${RANKS[S.rankAfter].unlock}.</span></div></div>`;
  else if (S.honour) h += `<div class="notebox good">${ico('star')} <b>An honour: ${esc(S.honour)}.</b> <span class="sub">${(() => { const ho = honourOf(profile().points); return ho.next ? `${ho.n} of 3 honours toward ${RANKS[ho.r + 1].n}.` : `The way to ${RANKS[ho.r + 1] ? RANKS[ho.r + 1].n : 'the next rank'} is open.`; })()}</span></div>`;
  if (S.trophies && S.trophies.length) h += `<div class="notebox good">${ico('star')} <b>New trophies:</b> ${S.trophies.map(id => { const t = TROPHIES.find(x => x.id === id); return t ? `${t.n} (${t.pts})` : id; }).join(', ')}</div>`;
  h += `<p class="sub">+${S.points || 0} points this game.</p>`;
  if (L) {
    if (onThisMap(L)) h += `<h3>The kingdom, turn by turn</h3><div class="lapse"><svg id="lapse" viewBox="0 0 ${MW} ${MH}"></svg><div class="lapsebar"><button class="btn sm" onclick="playLapse()">${ico('next')}Replay</button><button class="btn sm ghost" onclick="lapseFit()">Whole map</button><span id="lapseyr"></span></div><p class="sub zhint">Pinch or scroll to zoom, drag to look around.</p></div>`;
    else h += `<p class="sub">This game was played on ${esc(mapOfGame(L).name)}. Open that map from the title screen to watch it again, turn by turn.</p>`;
    h += `<h3>Counties held</h3>${territoryChart(L)}`;
    const others = L.houses.filter(x => x.id !== L.player && x.c.some(v => v > 0));
    const pk = x => Math.max(0, ...x.c.filter(v => v != null)), you = L.houses.find(x => x.id === L.player);
    const best = others.slice().sort((a, b) => pk(b) - pk(a))[0];
    h += `<h3>You and the other houses</h3><table class="sttab"><tr><th></th><th>You</th><th>${best ? esc(best.n) : 'Best rival'}</th><th>Average house</th></tr>
      <tr><td>Most counties</td><td>${pk(you)}</td><td>${best ? pk(best) : '–'}</td><td>${others.length ? Math.round(others.reduce((s, x) => s + pk(x), 0) / others.length) : '–'}</td></tr>
      <tr><td>Counties at the end</td><td>${S.counties}</td><td>${best ? best.c[best.c.length - 1] || 0 : '–'}</td><td>${others.length ? Math.round(others.reduce((s, x) => s + (x.c[x.c.length - 1] || 0), 0) / others.length) : '–'}</td></tr></table>`;
  }
  h += `<h3>Your deeds</h3><table class="sttab">${[
    ['Battles won', m.won], ['Battles lost', m.lost], ['Attacks beaten off', m.defWon], ['Counties lost to assault', m.defLost], ['Counties taken', m.taken], ['Castles taken', m.castlesTaken], ['House seats taken', m.seats],
    ['Enemies killed', m.kills], ['Men lost', m.menLost], ['Lords captured', m.lords], ['Ransoms collected', m.ransomGold ? `${m.ransomGold} d (${m.ransoms})` : 0], ['Ransom paid', m.ransomPaid ? m.ransomPaid + ' d' : 0],
    ['Castles raised', m.castles], ['Pacts signed', m.pacts], ['Alliances sworn', m.alliances], ['Heiresses married', m.heiresses], ['Charters forged', m.charters], ['Profit at the fair', (m.fairProfit || 0) + ' d'],
    ['Walls brought down by mines', m.mines], ['Viking raids driven off', m.raids], [SC.raider ? SC.raider.who + ' thrown back' : 'Almanzor thrown back', m.almanzor], ['Most killed by rats in one bombardment', m.ratBest], ['Most burned by oil in one bombardment', m.oilBest],
    ['Most counties', m.peakC], ['Largest treasury', (m.peakG || 0) + ' d'], ['Largest host', (m.peakM || 0) + ' men'], ['Crowned', m.crownedAt != null ? dateIn(S.map, m.crownedAt) : 'never'],
  ].map(([k, v]) => row(k, v ?? 0)).join('')}</table>`;
  return h;
}
function territoryChart(L) {
  const W = 340, Hh = 170, n = Math.max(...L.houses.map(x => x.c.length), 2) - 1;
  const top = Math.max(10, ...L.houses.flatMap(x => x.c.filter(v => v != null)));
  const X = t => 24 + (W - 30) * t / n, Y = v => Hh - 18 - (Hh - 26) * v / top;
  let s = `<svg viewBox="0 0 ${W} ${Hh}" class="chart"><path d="M24 ${Hh - 18}H${W - 6}M24 8V${Hh - 18}" stroke="#8a7458" stroke-width="1"/>`;
  for (let v = 0; v <= top; v += Math.ceil(top / 4 / 5) * 5) s += `<text x="20" y="${Y(v) + 3}" text-anchor="end" font-size="8" fill="#5c4630">${v}</text>`;
  for (let t = 0; t <= n; t += Math.max(4, Math.ceil(n / 6 / 4) * 4)) s += `<text x="${X(t)}" y="${Hh - 6}" text-anchor="middle" font-size="8" fill="#5c4630">${yearOf(t)}</text>`;
  const lines = L.houses.filter(x => x.c.some(v => v > 0)).sort((a, b) => (a.id === L.player) - (b.id === L.player));
  for (const x of lines) {
    let d = ''; x.c.forEach((v, t) => { if (v == null) return; d += (d ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(v).toFixed(1); });
    const mine = x.id === L.player;
    s += `<path d="${d}" fill="none" stroke="${x.col}" stroke-width="${mine ? 3.4 : 1.4}" stroke-opacity="${mine ? 1 : 0.75}"${mine ? '' : ' stroke-dasharray="0"'}/>`;
  }
  return s + `</svg><p class="sub">Your house is the thick line.</p>`;
}
// the time-lapse: the map's colours change turn by turn, with the year beside it
let LAPSE = null;
function playLapse(L) {
  L = L || loadJ(LAST_KEY, null); const svg = document.getElementById('lapse'); if (!L || !svg || !onThisMap(L)) return;
  if (LAPSE) clearInterval(LAPSE);
  const frames = L.own.map((s, t) => [t, s]).filter(x => x[1]); if (!frames.length) return;
  if (!svg.childElementCount) svg.innerHTML = lapseArt(L);
  lapseControls();
  const H = L.houses, cols = H.map(h => h.col), fill = H.map(h => mix(h.col, '#efe3c4', 0.18));
  const cells = [...svg.querySelectorAll('[data-c]')], seats = [...svg.querySelectorAll('[data-seat]')];
  const rows = [...svg.querySelectorAll('[data-row]')], bord = svg.querySelector('#lapsebord');
  const yr = svg.querySelector('#lapseyear'), bar = svg.querySelector('#lapsebar'), out = document.getElementById('lapseyr');
  const E = LAPSE_EDGES(L), T0 = frames[0][0], T1 = frames[frames.length - 1][0];
  let i = 0;
  const step = () => {
    const [t, s] = frames[i], n = H.map(() => 0);
    cells.forEach((el, k) => { const ch = s[k], h = ch === '.' || ch == null ? -1 : ch.charCodeAt(0) - 48; if (h >= 0) n[h]++; el.setAttribute('fill', h < 0 ? '#e8dcb9' : fill[h] || '#999'); });
    // the borders of every realm in ink: each edge between two counties with different lords
    bord.setAttribute('d', E.filter(e => s[e[0]] !== s[e[1]]).map(e => e[2]).join(''));
    seats.forEach(el => { const h = +el.dataset.seat, k = +el.dataset.k; el.style.opacity = s[k] && s[k].charCodeAt(0) - 48 === h ? 1 : 0; });
    // the legend, largest house first; the fallen sink to the bottom and fade
    const order = H.map((x, h) => h).sort((a, b) => n[b] - n[a] || a - b);
    order.forEach((h, r) => { const el = rows[h], per = +el.dataset.per; el.setAttribute('transform', `translate(${Math.floor(r / per) * el.dataset.dx},${(r % per) * el.dataset.dy})`); el.style.opacity = n[h] ? 1 : 0.35; el.querySelector('.ln').textContent = n[h]; });
    const ds = dateStr(t); if (yr) yr.textContent = ds; if (out) out.textContent = ds;
    if (bar) bar.setAttribute('width', (T1 > T0 ? (t - T0) / (T1 - T0) : 1) * bar.dataset.w);
    if (++i >= frames.length) { clearInterval(LAPSE); LAPSE = null; }
  };
  step();
  LAPSE = setInterval(() => { if (!document.getElementById('lapse')) { clearInterval(LAPSE); LAPSE = null; return; } step(); }, Math.max(70, Math.min(170, 18000 / frames.length)));
}
// the edges shared by two counties, as [index, index, path]; worked out once from the county shapes
let LAPSE_E = null;
function LAPSE_EDGES(L) {
  if (LAPSE_E && LAPSE_E.map === MAP_ID) return LAPSE_E.e;
  const at = {}, idx = {}, seen = {}; PROV.forEach((r, i) => idx[r[0]] = i);
  const key = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
  L.ids.forEach((id, k) => { const poly = CELLS[idx[id]]; if (!poly) return; for (let a = 0; a < poly.length; a++) { const p = poly[a], q = poly[(a + 1) % poly.length], ka = key(p), kb = key(q), e = ka < kb ? ka + '|' + kb : kb + '|' + ka; (at[e] = at[e] || []).push(k); seen[e] = [p, q]; } });
  const e = []; for (const k in at) if (at[k].length === 2) { const [p, q] = seen[k]; e.push([at[k][0], at[k][1], `M${p[0].toFixed(1)},${p[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`]); }
  LAPSE_E = { map: MAP_ID, e }; return e;
}
// where the legend and the cartouche can sit: the open sea, clear of the margin pictures.
// The land is painted on a coarse canvas once, then every place a box could go is scored by how much it covers.
function lapseSpots() {
  const g = 8, W = Math.ceil(MW / g), Hh = Math.ceil(MH / g), c = document.createElement('canvas'); c.width = W; c.height = Hh;
  const x = c.getContext('2d'); x.scale(1 / g, 1 / g); x.fillStyle = '#0f0';
  // land beyond the playing area costs little to cover; the counties themselves and the margin pictures cost a great deal
  const landP = new Path2D(LANDS.concat(ISLES).map(pathOf).join(' ')); x.fill(landP);
  x.save(); x.clip(landP); x.fillStyle = '#f00'; PROV.forEach(r => x.fill(new Path2D(CELLD[r[0]]))); x.restore();
  const A = SC.art || {}; x.fillStyle = '#f00';
  if (A.cart) x.fillRect(px(A.cart[0]) - 10, py(A.cart[1]) - 10, 270, 90);
  if (A.rose) x.fillRect(px(A.rose[0]) - 55, py(A.rose[1]) - 70, 110, 125);
  if (A.serpent) x.fillRect(px(A.serpent[0]) - 90 * A.serpent[2], py(A.serpent[1]) - 35 * A.serpent[2], 180 * A.serpent[2], 70 * A.serpent[2]);
  (A.ships || []).forEach(([lo, la, k]) => x.fillRect(px(lo) - 60 * k, py(la) - 75 * k, 120 * k, 105 * k));
  const d = x.getImageData(0, 0, W, Hh).data, S = new Float64Array((W + 1) * (Hh + 1));
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) S[(j + 1) * (W + 1) + i + 1] = (d[(j * W + i) * 4 + 3] < 40 ? 0 : d[(j * W + i) * 4] > 128 ? 12 : 1) + S[j * (W + 1) + i + 1] + S[(j + 1) * (W + 1) + i] - S[j * (W + 1) + i];
  const sum = (x0, y0, x1, y1) => { [x0, x1] = [x0, x1].map(v => Math.max(0, Math.min(W, Math.round(v / g)))); [y0, y1] = [y0, y1].map(v => Math.max(0, Math.min(Hh, Math.round(v / g)))); return S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0]; };
  return (w, h, m, avoid) => {
    let best = null, bs = Infinity; const F = LF;
    for (let y = F.y + m; y + h <= F.y + F.h - m; y += 8) for (let xx = F.x + m; xx + w <= F.x + F.w - m; xx += 8) {
      if (avoid && xx < avoid[0] + avoid[2] + m && xx + w + m > avoid[0] && y < avoid[1] + avoid[3] + m && y + h + m > avoid[1]) continue;
      // covered land counts most; after that, keep near a frame edge
      const sc = sum(xx - 6, y - 6, xx + w + 6, y + h + 6) * 100 + Math.min(xx - F.x, F.x + F.w - xx - w, y - F.y, F.y + F.h - y - h) * 0.02;
      if (sc < bs) { bs = sc; best = [xx, y]; }
    }
    return best ? best.concat(bs) : [F.x + m, F.y + m, Infinity];
  };
}
// the replay is drawn like the title map: sea, coast ripples, rivers, hills and woods, vellum and the margin pictures,
// with each house's arms over its seat, a cartouche for the year and a roll of the houses with their counties
function lapseArt(L) {
  lapseFrame(); const u = Math.max(MW, MH) / 1000, H = L.houses, idx = {}; PROV.forEach((r, i) => idx[r[0]] = i);
  const clip = x => x.split('url(#landclip)').join('url(#lapseclip)').split('url(#vellum)').join('url(#lvellum)');
  const cols2 = H.length > 9, rw = 262 * u, lw = rw * (cols2 ? 2 : 1) + (cols2 ? 10 * u : 0), rh = 30 * u, per = cols2 ? Math.ceil(H.length / 2) : H.length, lh = 54 * u + per * rh, cw = 270 * u, ch = 92 * u, m = 14 * u;
  const spot = lapseSpots();
  const [lx, ly] = spot(lw, lh, m);
  const [cx, cy] = spot(cw, ch, m, [lx, ly, lw, lh]);
  const def = h => houseOfGame(h.id, L.map) || {};
  const shield = (a, x, y, s) => a ? armsSvg(a, s).replace('<svg ', `<svg x="${(x - s / 2).toFixed(1)}" y="${(y - s * 0.6).toFixed(1)}" `) : '';
  const seats = H.map((h, k) => { const d = def(h), home = d.home || (FACMAP[h.id] || {}).home, j = L.ids.indexOf(home); if (j < 0 || !d.arms) return ''; const r = PROV[idx[home]], x = px(r[2]), y = py(r[3]), s = 34 * u;
    return `<g data-seat="${k}" data-k="${j}" class="lseat"><ellipse cx="${x}" cy="${y + s * 0.62}" rx="${s * 0.5}" ry="${s * 0.14}" fill="#1d140b" opacity=".35"/>${shield(d.arms, x, y, s)}${mapIco('crown', x, y - s * 0.78, s * 0.62, 'style="color:#e2b33c"')}</g>`; }).join('');
  const rows = H.map((h, k) => { const d = def(h), y = 46 * u + rh / 2, mine = h.id === L.player, lwr = rw;
    return `<g data-row="${k}" data-dy="${rh}" data-per="${per}" data-dx="${rw + 10 * u}" class="lrow">${d.arms ? shield(d.arms, 22 * u, y, 20 * u) : `<rect x="${14 * u}" y="${y - 8 * u}" width="${16 * u}" height="${16 * u}" fill="${h.col}"/>`}
      <rect x="${38 * u}" y="${y - 3 * u}" width="${10 * u}" height="${6 * u}" rx="${2 * u}" fill="${h.col}"/>
      <text x="${56 * u}" y="${y + 5.5 * u}" font-size="${16 * u}" font-weight="${mine ? 800 : 600}" fill="#2a1d12">${esc(h.n || d.name || h.id)}${mine ? ' ★' : ''}</text>
      <text class="ln" x="${lwr - 14 * u}" y="${y + 5.5 * u}" font-size="${17 * u}" font-weight="800" text-anchor="end" fill="#2a1d12">0</text></g>`; }).join('');
  const panel = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${8 * u}" fill="#efe3c4" fill-opacity=".93" stroke="#3a2b1b" stroke-width="${2.4 * u}"/><rect x="${x + 5 * u}" y="${y + 5 * u}" width="${w - 10 * u}" height="${h - 10 * u}" rx="${5 * u}" fill="none" stroke="#8a6a3c" stroke-width="${1 * u}"/>`;
  return `<defs><clipPath id="lapseclip">${LANDS.map(l => `<path d="${pathOf(l)}"/>`).join('')}</clipPath>${vellumDefs().replace('id="vellum"', 'id="lvellum"')}
    <filter id="lshadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="${2 * u}" stdDeviation="${3 * u}" flood-color="#1d140b" flood-opacity=".45"/></filter></defs>
    <rect x="${-MW}" y="${-MH}" width="${MW * 3}" height="${MH * 3}" fill="#8fa8a3"/><rect width="${MW}" height="${MH}" fill="#d9ca9f"/>${SEA_POLYS.map(l => `<path d="${pathOf(l)}" fill="#8fa8a3"/>`).join('')}
    <g clip-path="url(#lapseclip)">${EDGES.map((e, i) => `<path d="${EDGE_CELLD[i]}" fill="#d6c79f" stroke="#7d6646" stroke-width="1"/>`).join('')}${L.ids.map(id => `<path d="${CELLD[id] || ''}" data-c="${id}" fill="#e8dcb9" stroke="#5c4630" stroke-width="1" stroke-opacity=".7"/>`).join('')}</g>
    ${clip(coastLayer() + riversLayer() + terrainLayer())}
    <g clip-path="url(#lapseclip)" pointer-events="none"><path id="lapsebord" fill="none" stroke="#1d140b" stroke-width="${3.2 * u}" stroke-linecap="round" stroke-opacity=".85"/></g>
    ${LANDS.map(l => `<path d="${pathOf(l)}" fill="none" stroke="#3a2b1b" stroke-width="2.4"/>`).join('')}
    <rect x="${LF.x - 50}" y="${LF.y - 50}" width="${LF.w + 100}" height="${LF.h + 100}" fill="url(#lvellum)" pointer-events="none"/>${clip(marginArt())}
    <g filter="url(#lshadow)">${seats}</g>
    <g transform="translate(${lx},${ly})" filter="url(#lshadow)">${panel(0, 0, lw, lh)}<text x="${lw / 2}" y="${30 * u}" font-size="${17 * u}" font-weight="800" letter-spacing="${2 * u}" text-anchor="middle" fill="#6b1d1d">THE HOUSES</text>${rows}</g>
    <g transform="translate(${cx},${cy})" filter="url(#lshadow)">${panel(0, 0, cw, ch)}
      <text x="${cw / 2}" y="${26 * u}" font-size="${13 * u}" font-weight="700" letter-spacing="${1.5 * u}" text-anchor="middle" fill="#6b1d1d"${(SC.name || '').length > 22 ? ` textLength="${cw - 36 * u}" lengthAdjust="spacingAndGlyphs"` : ''}>${esc((SC.name || '').toUpperCase())}</text>
      <text id="lapseyear" x="${cw / 2}" y="${60 * u}" font-size="${30 * u}" font-weight="800" text-anchor="middle" fill="#2a1d12"></text>
      <rect x="${20 * u}" y="${72 * u}" width="${cw - 40 * u}" height="${6 * u}" rx="${3 * u}" fill="#cdbb92"/><rect id="lapsebar" data-w="${cw - 40 * u}" x="${20 * u}" y="${72 * u}" width="0" height="${6 * u}" rx="${3 * u}" fill="#8a2a22"/></g>`;
}
function statsHistory(H) {
  if (!H.length) return '<p class="sub">Your finished games will be listed here.</p>';
  const wins = H.filter(g => g.won).length, by = {};
  for (const g of H) { const key = (g.map || 'france') + ':' + g.house, b = by[key] = by[key] || { n: 0, w: 0, d: houseOfGame(g.house, g.map), map: g.map || 'france' }; b.n++; if (g.won) b.w++; }
  let h = `<h3>Your games</h3><p>${H.length} finished · ${wins} won · ${Math.round(wins / H.length * 100)}% won</p>
    <div class="byhouse">${Object.keys(by).map(k => { const b = by[k], d = b.d; return `<span class="tag">${d ? armsSvg(d.arms, 14) : ''} ${d ? esc(d.name) : esc(k.split(':')[1])}${b.map !== 'france' && MAPS[b.map] ? ` <small>${MAPS[b.map].date.y0}</small>` : ''} ${b.w}/${b.n}</span>`; }).join('')}</div>
    <div class="glist">${H.slice().reverse().map(g => `<div class="gitem${g.won ? ' won' : ''}">${houseOfGame(g.house, g.map) ? armsSvg(houseOfGame(g.house, g.map).arms, 26) : ''}<div style="min-width:0"><b>${esc(g.name)}</b> <span class="${g.won ? 'good' : 'bad'}">${g.won ? (g.how === 'conquest' ? 'conquest' : 'crowned') : 'lost'}</span><small>${new Date(g.when).toLocaleDateString()} · ${g.year} · ${g.turns} turns · ${DIFF[g.diff] ? DIFF[g.diff].n : ''}${g.challenge ? ' · challenge' : ''}</small></div><div class="pw"><b>+${g.points || 0}</b>pts</div></div>`).join('')}</div>`;
  return h;
}
const STAT_KEYS = [['Turns played', S => S.turns, 'turns'], ['Most counties', S => S.m.peakC], ['Battles won', S => S.m.won], ['Battles lost', S => S.m.lost, 'less'], ['Counties taken', S => S.m.taken], ['Enemies killed', S => S.m.kills], ['Men lost', S => S.m.menLost, 'less'], ['Lords captured', S => S.m.lords], ['Ransoms collected', S => S.m.ransomGold], ['Castles raised', S => S.m.castles], ['Largest treasury', S => S.m.peakG], ['Pacts and alliances', S => (S.m.pacts || 0) + (S.m.alliances || 0)]];
function statsVsAvg(S, H) {
  if (!S) return '<p class="sub">Finish a game to compare it with your others.</p>';
  const rest = H.filter(g => g.when !== S.when && g.m);
  if (!rest.length) return `<h3>Against your average</h3><p class="sub">This is your first finished game. From the next one on, each game is measured against your average.</p>`;
  const won = rest.filter(g => g.won);
  let h = `<h3>Against your average</h3><p class="sub">This game against the average of your ${rest.length} other finished game${rest.length === 1 ? '' : 's'}${won.length ? ` (and of your ${won.length} win${won.length === 1 ? '' : 's'} for the time to the crown)` : ''}.</p><div class="vs">`;
  for (const [n, f, how] of STAT_KEYS) {
    const pool = how === 'turns' && S.won && won.length ? won : rest;
    const avg = pool.reduce((s, g) => s + (f(g) || 0), 0) / pool.length, v = f(S) || 0;
    const better = how === 'less' || how === 'turns' ? v < avg : v > avg, same = Math.abs(v - avg) < 0.5;
    const mx = Math.max(v, avg, 1);
    h += `<div class="vsrow"><div class="vsn">${n}</div><div class="vsb"><i style="width:${pct(v, mx)}%" class="me"></i><i style="width:${pct(avg, mx)}%" class="avg"></i></div><div class="vsv"><b>${Math.round(v)}</b> <small>avg ${avg.toFixed(avg < 10 ? 1 : 0)}</small> <span class="${same ? '' : better ? 'good' : 'bad'}">${same ? '=' : v > avg ? '▲' : '▼'}</span></div></div>`;
  }
  return h + '</div><p class="sub">Gold bar: this game. Grey bar: your average.</p>';
}

// ---------- sharing ----------
function svgImg(svg) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }); }
async function shareCard(draw, name, M = SC) {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, '#f6ecd2'); g.addColorStop(1, '#e6d4a8'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
  x.strokeStyle = '#8e1f1b'; x.lineWidth = 14; x.strokeRect(24, 24, 1032, 1302); x.strokeStyle = '#e2b33c'; x.lineWidth = 4; x.strokeRect(46, 46, 988, 1258);
  x.fillStyle = '#8e1f1b'; x.font = '700 58px Cinzel, Georgia, serif'; x.textAlign = 'center'; x.fillText('Anointed', 540, 130); x.font = 'italic 30px Georgia, serif'; x.fillStyle = '#5c4630'; x.fillText(M.game, 540, 172);
  x.fillStyle = '#5c4630'; x.font = 'italic 34px Georgia, serif'; x.fillText(`Anno Domini ${M.date.y0}`, 540, 180);
  await draw(x);
  x.fillStyle = '#5c4630'; x.font = 'italic 28px Georgia, serif'; x.fillText('jdc001.github.io/Anointed', 540, 1290);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = new File([blob], name, { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Anointed' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const url = URL.createObjectURL(blob);
  showModal(`<h2>${ico('star')} Your card</h2><p class="sub">Press and hold the picture to save or share it.</p><img src="${url}" style="width:100%;border-radius:8px">`, '', { closable: true });
}
function wrapText(x, text, cx, y, w, lh) { const words = text.split(' '); let line = ''; for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (x.measureText(t).width > w && line) { x.fillText(line, cx, y); y += lh; line = wd; } else line = t; } if (line) x.fillText(line, cx, y); return y + lh; }
function shareGame() {
  const S = (G && G.recorded) || gameHistory().slice(-1)[0]; if (!S) return;
  const L = loadJ(LAST_KEY, null), P = profile(), r = rankOf(P.points);
  shareCard(async x => {
    const im = await svgImg(myAchievement(300)); if (im) x.drawImage(im, 120, 220, 300, 333);
    if (houseOfGame(S.house, S.map)) { const hs = await svgImg(armsSvg(houseOfGame(S.house, S.map).arms, 200)); if (hs) x.drawImage(hs, 680, 250, 200, 240); }
    x.fillStyle = '#2a1d12'; x.font = '700 50px Cinzel, Georgia, serif';
    x.fillText(S.won ? latinTitle(mapOfGame(S)) : 'The crown escapes me', 540, 640);
    x.font = '36px Georgia, serif'; x.fillStyle = '#5c4630';
    let y = wrapText(x, `${S.name}, ${S.won ? (S.how === 'conquest' ? 'every rival broken' : ((mapOfGame(S).win && mapOfGame(S).win.crowned) || mapOfGame(S).crown.crowned)) : 'beaten'}, in the year ${S.year}, after ${S.turns} turns.`, 540, 700, 880, 48);
    x.font = 'italic 32px Georgia, serif'; x.fillText(`${RANKS[r].n} · ${P.points} points${S.trophies && S.trophies.length ? ` · ${S.trophies.length} new troph${S.trophies.length === 1 ? 'y' : 'ies'}` : ''}`, 540, y + 6);
    if (onThisMap(L) && L.when === S.when && L.own && L.own.length) {
      const s = L.own[L.own.length - 1] || L.own.filter(Boolean).pop(), cols = L.houses.map(h => h.col), sc = 430 / MH;
      x.save(); x.translate(540 - MW * sc / 2, y + 40); x.scale(sc, sc);
      x.beginPath(); x.rect(0, 0, MW, MH); x.clip();
      x.fillStyle = '#9fc3c8'; x.fillRect(0, 0, MW, MH);
      x.fillStyle = '#d8cba5'; for (const l of LANDS) x.fill(new Path2D(pathOf(l)));
      x.clip(new Path2D(LANDS.map(pathOf).join(' ')));
      L.ids.forEach((id, k) => { const ch = s[k]; x.fillStyle = ch === '.' ? '#efe4c6' : cols[ch.charCodeAt(0) - 48] || '#999'; const pth = new Path2D(CELLD[id]); x.fill(pth); x.strokeStyle = '#5c4630'; x.lineWidth = 2; x.stroke(pth); });
      x.restore();
    }
  }, 'anointed.png', mapOfGame(S));
}
function shareRank() {
  const P = profile(), r = rankOf(P.points), got = Object.keys(P.trophies).length;
  shareCard(async x => {
    const im = await svgImg(myAchievement(520)); if (im) x.drawImage(im, 280, 230, 520, 577);
    x.fillStyle = RANKS[r].col; x.font = '700 64px Cinzel, Georgia, serif'; x.fillText(RANKS[r].n, 540, 900);
    x.fillStyle = '#5c4630'; x.font = '36px Georgia, serif';
    x.fillText(`${P.points} points · ${got} of ${TROPHIES.length} trophies · ${P.games} games`, 540, 970);
    const H = gameHistory(), w = H.filter(g => g.won).length; x.fillText(`${w} crown${w === 1 ? '' : 's'} won`, 540, 1025);
  }, 'my-rank.png');
}

// ---------- the Chronicler's challenge ----------
// A set start that changes from time to time: the same house, rivals and twists for every player while it lasts,
// so friends can compare how quickly they took the crown.
const CHALLENGES = SC.challenges;
const chalWeek = () => Math.floor((Date.now() / 864e5 + 3) / 7);
function currentChallenge() { const w = chalWeek(); return { ...CHALLENGES[w % CHALLENGES.length], seed: w }; }
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function startChallenge() {
  if (!fullGame()) return openUnlock('chal');
  const C = currentChallenge();
  sndUnlock();
  const rnd0 = Math.random; Math.random = mulberry(C.seed * 7919 + 13);
  try { newGame(C.house); } finally { Math.random = rnd0; }
  G.diff = C.diff; G.goal = 'king'; G.tut = null; G.challenge = { id: C.id + ':' + C.seed, n: C.n, mod: C.mod || {} };
  if (C.mod && C.mod.gold != null) G.fac[C.house].gold = C.mod.gold;
  $('#title').style.display = 'none'; setMusic('map'); applyLayout(); save(); render(); homeView(false); if (isPhone()) setSheet('peek'); showIntro(C.house);
}
function challengeBest() { const C = currentChallenge(), id = C.id + ':' + C.seed; const runs = gameHistory().filter(g => g.challenge === id); const w = runs.filter(g => g.won).sort((a, b) => a.turns - b.turns)[0]; return { runs: runs.length, best: w ? w.turns : null }; }
function challengeBox() {
  const C = currentChallenge(), B = challengeBest();
  return `<div class="chal"><div class="chalh">${ico('scroll')} <b>The Chronicler's Challenge</b></div><div style="display:flex;gap:10px;align-items:center">${armsSvg(FACMAP[C.house].arms, 40)}<div style="min-width:0"><b>${esc(C.n)}</b><small>${esc(C.d)} Everyone who takes it up starts the same way. It changes from time to time.</small>${B.runs ? `<small>${B.best ? `Your best: crowned in ${B.best} turns` : `${B.runs} attempt${B.runs === 1 ? '' : 's'}, no crown yet`}.</small>` : ''}</div></div><button class="btn gold" onclick="startChallenge()"><span class="lbl">${ico('flag')}Take up the challenge</span></button></div>`;
}
// ---------- the title: your rank ----------
function rankBox() { const P = profile(), r = rankOf(P.points), nx = RANKS[r + 1]; return `<div class="rankbox" style="border-color:${RANKS[r].col}" onclick="openMedals('rank')">${myAchievement(96)}<div style="min-width:0"><div class="rk">${RANKS[r].n}</div><small>${P.points} points${nx ? ` · ${nx.n} at ${nx.at}` : ''}</small><small>${Object.keys(P.trophies).length} of ${TROPHIES.length} trophies</small><span class="btn sm"><span class="lbl">${ico('crown')}Medals and arms</span></span></div></div>`; }
function refreshTitleRank() { const el = document.getElementById('titlerank'); if (el) el.innerHTML = rankBox(); }

// the replay map: the whole kingdom at first, then pinch, scroll and drag to look closer
const LZ = { x: 0, y: 0, w: 0, h: 0 };
function lapseView(svg) { svg.setAttribute('viewBox', `${LZ.x} ${LZ.y} ${LZ.w} ${LZ.h}`); }
// the frame the replay is drawn in: the map, widened to a landscape picture when the map is tall, so the legend can sit beside it
const LF = { x: 0, y: 0, w: 0, h: 0 };
function lapseFrame() { const w = Math.max(MW, MH * 1.6); Object.assign(LF, { x: -(w - MW) / 2, y: 0, w, h: MH }); return LF; }
function lapseFit() { const svg = document.getElementById('lapse'); if (!svg) return; if (!LF.w) lapseFrame(); Object.assign(LZ, LF); lapseView(svg); }
function lapseZoomAt(svg, k, cx, cy) {
  const r = svg.getBoundingClientRect(), s = Math.max(LZ.w / r.width, LZ.h / r.height);
  const ox = (r.width - LZ.w / s) / 2, oy = (r.height - LZ.h / s) / 2, mx = LZ.x + (cx - r.left - ox) * s, my = LZ.y + (cy - r.top - oy) * s;
  const w = clamp(LZ.w * k, LF.w / 8, LF.w), h = w * LF.h / LF.w;
  LZ.x = clamp(mx - (mx - LZ.x) * w / LZ.w, LF.x - LF.w * 0.1, LF.x + LF.w - w * 0.9); LZ.y = clamp(my - (my - LZ.y) * h / LZ.h, LF.y - LF.h * 0.1, LF.y + LF.h - h * 0.9); LZ.w = w; LZ.h = h; lapseView(svg);
}
function lapseControls() {
  const svg = document.getElementById('lapse'); if (!svg || svg._z) return; svg._z = true; lapseFit();
  const pts = new Map(); let last = null, pinch = 0;
  svg.addEventListener('wheel', e => { e.preventDefault(); lapseZoomAt(svg, e.deltaY > 0 ? 1.15 : 0.87, e.clientX, e.clientY); }, { passive: false });
  svg.addEventListener('pointerdown', e => { svg.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); last = [e.clientX, e.clientY]; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  svg.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) lapseZoomAt(svg, pinch / d, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch = d; return; }
    const r = svg.getBoundingClientRect(), s = Math.max(LZ.w / r.width, LZ.h / r.height);
    LZ.x = clamp(LZ.x - (e.clientX - last[0]) * s, LF.x - LF.w * 0.1, LF.x + LF.w - LZ.w * 0.9); LZ.y = clamp(LZ.y - (e.clientY - last[1]) * s, LF.y - LF.h * 0.1, LF.y + LF.h - LZ.h * 0.9); last = [e.clientX, e.clientY]; lapseView(svg);
  });
  const up = e => { pts.delete(e.pointerId); pinch = 0; if (pts.size === 1) last = [...pts.values()][0]; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
}
