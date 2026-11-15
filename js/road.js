'use strict';
// ================= THE ROAD: the campaign laid out as an illuminated itinerary =================
// Nothing here is a new rule. The stations are the goal's own conditions (core.js); the errands are the
// openings the game already offers this turn (a fair, an heiress, a general for hire, a charter to forge,
// unrest to cover, an envoy waiting), each with a way straight to it. It is the quest board the rules imply.
const RDW = 900, RDH = 300;
function roadStations() {
  const F = G.fac[me()], g = goalId();
  if (g === 'king') {
    const seats = winSeats(me()), heldSeats = seats.filter(id => P(id).owner === me()).length;
    const dh = domainHeld(me()), dn = domainNeed(), r = greatRival(me()), rh = r ? domainHeld(r) : 0, cap = rivalCap();
    const crowned = wears(me()), cn = crownNeeds(me()), cnHeld = cn.filter(id => P(id).owner === me()).length;
    return [
      { t: 'A host in the field', s: `${totalMen(me())} men · ${usableArmies(me()).length} of ${armyMax(me())} armies`, f: clamp(totalMen(me()) / 24, 0, 1), icon: 'sword', go: "closeModal();ACC.armies=true;G.sel=null;render();document.getElementById('acc-armies').scrollIntoView({behavior:'smooth'})", done: totalMen(me()) >= 24 },
      { t: 'The Church won over', s: `${F.bishops} bishop${F.bishops === 1 ? '' : 's'}, ${F.cardinals} cardinal${F.cardinals === 1 ? '' : 's'} · ${Math.round(influence(me()) * 100)}% of the Pope's ear`, f: clamp(influence(me()) * 2, 0, 1), icon: 'church', go: 'closeModal();openPope()', done: influence(me()) >= 0.5 },
      { t: 'The coronation', s: crowned ? 'Anointed at Reims' : `${cnHeld} of ${cn.length} seats · ${Math.min(dh, CROWN_LANDS)} of ${CROWN_LANDS} counties`, f: crowned ? 1 : clamp((cnHeld / cn.length) * 0.5 + Math.min(dh, CROWN_LANDS) / CROWN_LANDS * 0.5, 0, 1), icon: 'crown', go: crowned ? '' : "closeModal();ACC.crowns=true;G.sel=null;render();document.getElementById('acc-crowns').scrollIntoView({behavior:'smooth'})", done: crowned },
      { t: 'The royal seats', s: seats.map(id => `${P(id).name} ${P(id).owner === me() ? '✓' : '·'}`).join('  '), f: heldSeats / seats.length, icon: 'castle', go: `closeModal();goProv('${seats.find(id => P(id).owner !== me()) || seats[0]}')`, done: heldSeats === seats.length },
      { t: 'Half the kingdom', s: `${dh} of ${dn} counties in your own hands`, f: clamp(dh / dn, 0, 1), icon: 'map', go: 'closeModal();homeView(true)', done: dh >= dn },
      { t: 'No rival too strong', s: r ? `${FAC(r).name} holds ${rh} · the cap is ${cap}` : 'No rival stands', f: r ? clamp(1 - Math.max(0, rh - cap) / Math.max(1, rh), 0, 1) : 1, icon: 'swords', go: r ? `closeModal();goProv('${homeOf(r)}')` : '', done: !r || rh <= cap },
    ];
  }
  const all = G.fdefs.filter(d => FACMAP[d.id] && d.id !== me()).length, left = alive().length - 1;
  return [
    { t: 'A host in the field', s: `${totalMen(me())} men`, f: clamp(totalMen(me()) / 30, 0, 1), icon: 'sword', go: 'closeModal()', done: totalMen(me()) >= 30 },
    { t: 'Break the rival houses', s: `${all - left} of ${all} fallen`, f: 1 - left / Math.max(1, all), icon: 'swords', go: 'closeModal()', done: left === 0 },
  ];
}
function roadErrands() {
  const F = G.fac[me()], out = [];
  if (G.diplo) out.push({ icon: 'handshake', t: `${FAC(G.diplo.from).name}'s envoy waits`, s: 'An offer stands until the turn ends.', go: "closeModal();G.sel=null;render();setSheet('full');const e=document.getElementById('envoybox');e&&e.scrollIntoView({behavior:'smooth'})", hot: 1 });
  if (G.offers.length) out.push({ icon: 'coin', t: `${G.offers.length} ransom offer${G.offers.length > 1 ? 's' : ''}`, s: 'Silver for a prisoner, or keep him a season.', go: "closeModal();G.sel=null;ACC.prisoners=true;render()", hot: 1 });
  if (F.captive) out.push({ icon: 'chain', t: 'Your lord is a prisoner', s: 'Ransom him, or haggle with his captor.', go: "closeModal();G.sel=null;render();setSheet('full')", hot: 1 });
  if (F.unrest) { const p = P(F.unrest.seed); out.push({ icon: 'fire', t: `Unrest at ${p.name}`, s: unrestCovered(me()) ? 'Your army there overawes them.' : `Falls due ${dateStr(F.unrest.at)}. March an army there, or buy them off.`, go: `closeModal();goProv('${p.id}')`, hot: unrestCovered(me()) ? 0 : 1 }); }
  if (fairOpen()) out.push({ icon: 'market', t: SC.fair.open, s: `Your carts are worth about ${fairCap()} d there. This turn only.`, go: 'closeModal();openFair()', hot: 1 });
  if (G.genPool.length) { const d = GENMAP[G.genPool[0]]; out.push({ icon: 'fleur', t: `${G.genPool.length} general${G.genPool.length > 1 ? 's' : ''} seeking a lord`, s: `${d.n}: ${d.d}`, go: 'closeModal();openCourt()' }); }
  const ladies = provList().filter(p => p.heiress && !p.owner);
  if (ladies.length && F.sons > 0) { const l = ladies.sort((a, b) => reachOf(me(), a) - reachOf(me(), b))[0]; out.push({ icon: 'ring', t: `Lady ${l.heiress} of ${l.name}`, s: F.proposed ? 'A suit has gone out this turn.' : 'A marriage brings a county without a blow struck.', go: `closeModal();goProv('${l.id}')` }); }
  const ch = canForge && provList().find(p => canForge(p, F)); if (ch) out.push({ icon: 'scroll', t: `A charter for ${ch.name}`, s: `Your monks can make a lord swear to you · ${FORGE_COST} d.`, go: `closeModal();openCharter('${ch.id}')` });
  const idle = armiesToMove(); if (idle.length) out.push({ icon: 'sword', t: `${idle.length} ${idle.length === 1 ? 'army has' : 'armies have'} not moved`, s: 'Each may march twice, or strike once.', go: 'closeModal();nextArmy()', hot: 1 });
  const build = owned(me()).filter(p => !p.build && ['farm', 'market'].some(b => canBuild(p, b) && F.gold >= bldCost(p, b) + 20)).length; if (build && F.gold >= 60) out.push({ icon: 'hammer', t: 'Silver lies idle', s: `${F.gold} d in the treasury and ${build} count${build === 1 ? 'y' : 'ies'} that could build.`, go: `closeModal();goProv('${homeOf(me())}');PANEL.tab='build';render()` });
  return out;
}
function openRoad() {
  const st = roadStations(), er = roadErrands(), goal = GOALS[goalId()];
  const cards = er.map(e => `<button class="errand${e.hot ? ' hot' : ''}" onclick="${e.go}">${ico(e.icon)}<div><b>${esc(e.t)}</b><span>${esc(e.s)}</span></div>${ico('next')}</button>`).join('');
  showModal(`<h2>${ico('crown')} The road to ${esc(goal.n.toLowerCase().startsWith('king') || goal.n.toLowerCase().startsWith('the') ? goal.n.replace(/^the /i, 'the ') : goal.n)}</h2><p class="sub">${esc(goal.d)}</p>
    <div class="roadwrap"><canvas id="roadc"></canvas><div class="roadpins" id="roadpins"></div></div>
    <h3>Errands this turn</h3>${er.length ? `<div class="errands">${cards}</div>` : '<p class="sub">Nothing waits on you. March, build, or end the turn.</p>'}
    <div class="row ctr" style="margin-top:12px"><button class="btn gold" onclick="closeModal()">Back to the realm</button></div>`, 'wide', { closable: true });
  const cv = $('#roadc'), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = RDW * dpr; cv.height = RDH * dpr; const x = cv.getContext('2d'); x.scale(dpr, dpr);
  paintRoad(x, st);
  const pins = $('#roadpins');
  pins.innerHTML = st.map((s, i) => { const p = roadPoint(i, st.length); return `<button class="pin${s.done ? ' done' : ''}" style="left:${(p.x / RDW * 100).toFixed(1)}%;top:${(p.y / RDH * 100).toFixed(1)}%" onclick="${s.go || ''}"><span class="ring"><i style="--f:${s.f.toFixed(2)}"></i>${ico(s.icon)}</span><b>${esc(s.t)}</b><small>${esc(s.s)}</small></button>`; }).join('');
}
function roadPoint(i, n) { const f = n === 1 ? .5 : i / (n - 1); return { x: 90 + f * (RDW - 180), y: 160 + Math.sin(f * Math.PI * 1.7 + .4) * 40 + (i % 2 ? -22 : 22) }; }
function paintRoad(x, st) {
  const season = SEASON_K(), gp = PAL.ground[season];
  // vellum, with the land painted on it as a chronicler would
  const g = x.createRadialGradient(RDW / 2, RDH / 2, 40, RDW / 2, RDH / 2, 600); g.addColorStop(0, '#f3e6c6'); g.addColorStop(1, '#d6c08c'); x.fillStyle = g; x.fillRect(0, 0, RDW, RDH);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(120,80,30,${0.03 + (i % 4) * 0.01})`; x.beginPath(); x.ellipse((i * 131) % RDW, (i * 71) % RDH, 20 + (i % 5) * 8, 8, i, 0, 7); x.fill(); }
  // hills and woods behind the road
  for (let L = 0; L < 3; L++) { x.fillStyle = L === 0 ? mix(gp[0], '#f3e6c6', .6) : L === 1 ? mix(gp[0], '#f3e6c6', .35) : mix(gp[1], '#f3e6c6', .3); x.beginPath(); x.moveTo(0, RDH); for (let i = 0; i <= 18; i++) x.lineTo(i * 50, 120 + L * 40 - Math.abs(Math.sin(i * 1.3 + L * 2)) * (40 - L * 8)); x.lineTo(RDW, RDH); x.fill(); }
  for (let i = 0; i < 30; i++) { const tx = (i * 97) % RDW, ty = 250 + (i * 37) % 40; paintTree(x, tx, ty, 10 + (i % 3) * 3, i / 30, season); }
  // the road itself
  const pts = st.map((_, i) => roadPoint(i, st.length));
  const path = () => { x.beginPath(); pts.forEach((p, i) => { if (!i) x.moveTo(p.x - 70, p.y + 30); const q = pts[i - 1] || { x: p.x - 70, y: p.y + 30 }; x.quadraticCurveTo((q.x + p.x) / 2, q.y + (p.y - q.y) * .1, p.x, p.y); }); const l = pts[pts.length - 1]; x.quadraticCurveTo(l.x + 40, l.y - 10, l.x + 80, l.y - 30); };
  x.lineCap = 'round'; x.strokeStyle = 'rgba(120,88,50,.55)'; x.lineWidth = 16; path(); x.stroke();
  x.strokeStyle = '#d9c59a'; x.lineWidth = 11; path(); x.stroke();
  x.setLineDash([3, 9]); x.strokeStyle = 'rgba(90,60,30,.55)'; x.lineWidth = 1.4; path(); x.stroke(); x.setLineDash([]);
  // the walked part of the road is gilded
  const doneN = st.findIndex(s => !s.done); const upto = doneN < 0 ? st.length : doneN;
  if (upto > 0) { x.save(); x.beginPath(); x.rect(0, 0, pts[upto - 1].x + 2, RDH); x.clip(); x.strokeStyle = 'rgba(226,179,60,.85)'; x.lineWidth = 5; path(); x.stroke(); x.restore(); }
  // a cathedral at the road's end, the player's seat at its start
  const end = pts[pts.length - 1]; stoneFace(x, end.x + 56, end.y - 90, 44, 60, '#b5ab95', 3); x.fillStyle = '#6e3a2a'; x.beginPath(); x.moveTo(end.x + 52, end.y - 90); x.lineTo(end.x + 78, end.y - 124); x.lineTo(end.x + 104, end.y - 90); x.fill(); x.fillStyle = '#e2b33c'; x.fillRect(end.x + 77, end.y - 136, 2, 12); x.fillRect(end.x + 73, end.y - 132, 10, 2); x.fillStyle = '#2a2420'; x.fillRect(end.x + 74, end.y - 60, 8, 16);
  const beg = pts[0]; x.save(); x.translate(beg.x - 70, beg.y + 30); x.scale(1.4, 1.4); x.fillStyle = '#6b4a2b'; x.fillRect(-12, -18, 24, 18); x.fillStyle = '#5a3e24'; for (let i = 0; i < 4; i++) x.fillRect(-12 + i * 7, -22, 4, 5); x.restore();
  x.font = '600 10px Cinzel, serif'; x.fillStyle = 'rgba(90,60,30,.7)'; x.textAlign = 'center'; x.fillText(P(homeOf(me())).name.toUpperCase(), beg.x - 70, beg.y + 46); x.fillText('REIMS', end.x + 78, end.y - 44);
  // a compass rose and the margin's rule
  x.strokeStyle = '#b8892c'; x.lineWidth = 1.5; x.strokeRect(8, 8, RDW - 16, RDH - 16);
  x.save(); x.translate(RDW - 60, 56); for (let i = 0; i < 8; i++) { x.rotate(Math.PI / 4); x.fillStyle = i % 2 ? '#8e1f1b' : '#e2b33c'; x.beginPath(); x.moveTo(0, 0); x.lineTo(-4, -8); x.lineTo(0, i % 2 ? -18 : -26); x.lineTo(4, -8); x.fill(); } x.restore();
}
