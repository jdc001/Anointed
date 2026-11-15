'use strict';
// ================= BATTLE: pre-battle & live view =================
let PB = null, BV = null;
function openPreBattle(kind, pid) {
  const p = P(pid), F = G.fac[me()], A = myA();
  armsImage(me()); armsImage(kind === 'relief' ? besiegerOf(p) : p.owner);
  const peace = kind === 'assault' && p.owner && truce() && F.excom < 1;
  const cfgFor = (st, res) => { const c = kind === 'relief' ? reliefCfg(me(), A, p, st) : assaultCfg(me(), A, p, st); if (peace) c.aMod = mods(me()) - 1; c.aRes = !!res; return c; };
  PB = { kind, p, A, st: 'balanced', res: false, cfgFor, peace, odds: {} };
  for (const st of ['aggressive', 'balanced', 'defensive']) PB.odds[st] = estimateWin(cfgFor(st, PB.res), 40);
  setMusic('battle');
  drawPreBattle();
}
function bonusTxt(b, gen, mod) {
  const t = [];
  if (b.atk) t.push(`+${Math.round(b.atk * 100)}% attack`); if (b.hp) t.push(`+${Math.round(b.hp * 100)}% hit points`); if (b.cav) t.push(`+${Math.round(b.cav * 100)}% cavalry`);
  if (gen) t.push(ico('fleur') + ' ' + gen.n); if (mod > 0) t.push('blessed'); if (mod < 0) t.push('excommunicated');
  return t.length ? `<p class="sub">${t.join(' · ')}</p>` : '';
}
const STANCE_ICON = { aggressive: 'swords', balanced: 'flag', defensive: 'foot' };
function drawPreBattle() {
  const { kind, p, A } = PB, cfg = PB.cfgFor(PB.st, PB.res);
  const canRes = armySize(A) >= 9 && !(cfg.castle && !p.ruined);
  const enemyF = kind === 'relief' ? cfg.besieger : p.owner;
  const title = kind === 'relief' ? `Relief of ${p.name}` : (p.b.castle && !p.ruined ? `Storming ${p.name}` : `Battle for ${p.name}`);
  const col = (fid, name, U, extra) => `<div class="bcol">${shield(fid, 34)}<div class="bname">${name}</div><p class="units">${uStr(U, true, false)}</p>${extra || ''}</div>`;
  const castleTxt = cfg.castle && !p.ruined ? `<p>${ico('castle')} ${CASTLE_N[castleLv(p)]}${p.b.moat ? ', moat' : ''} · walls ${p.walls}%</p>${cfg.D.cat ? `<p>${ico('cat')} ${cfg.D.cat} catapult${cfg.D.cat > 1 ? 's' : ''} on the walls</p>` : ''}` : '';
  showModal(`<h2 class="ctr">${title}</h2>
    <div class="vs">${col(me(), FAC(me()).name, cfg.A, bonusTxt(cfg.aBon, cfg.aGen, cfg.aMod))}<div class="vsx">vs</div>${col(enemyF, enemyF ? FAC(enemyF).name : p.lord, cfg.D, castleTxt + bonusTxt(cfg.dBon || {}, cfg.dGen, cfg.dMod) + `<p class="sub">Expect a ${STANCE[cfg.dSt].n.toLowerCase()} stand</p>`)}</div>
    ${PB.peace ? `<div class="notebox bad">${ico('dove')} ${SC.peace.breakTxt}</div>` : ''}
    <h3>Your orders · army ${ARMY_NUM(A)}</h3>
    <div class="stances">${['aggressive', 'balanced', 'defensive'].map(st => `<button class="btn stance${PB.st === st ? ' on' : ''}" onclick="PB.st='${st}';drawPreBattle()"><b>${ico(STANCE_ICON[st])}${STANCE[st].n}</b><small>${STANCE[st].d}</small><span class="odds">${oddsTxt(PB.odds[st])} to win</span></button>`).join('')}</div>
    ${canRes ? `<button class="btn${PB.res ? ' on' : ''}" style="width:100%;margin-top:8px" onclick="PB.res=!PB.res;for(const st of ['aggressive','balanced','defensive'])PB.odds[st]=estimateWin(PB.cfgFor(st,PB.res),40);drawPreBattle()"><span class="lbl">${ico('foot')}Hold a reserve</span><small>A third of the foot and bowmen wait behind the line. Commit them for a surge; held back, they halve the losses of a defeat.</small></button>` : ''}
    ${!cfg.castle && cfg.A.cav > 0 ? `<p class="sub" style="margin-top:8px">${ico('cav')} During the battle, while your horse still hold, you may send them at the enemy horse, at their bowmen, or round to the rear. Left alone, they charge as the lines close.</p>` : ''}
    <div class="row ctr"><button class="btn gold big" onclick="startBattle()"><span class="lbl">${ico('swords')}Sound the advance</span></button><button class="btn big" onclick="autoBattle()"><span class="lbl">${ico('skip')}Auto-resolve</span></button>${kind === 'assault' && p.b.castle && !p.ruined && A.siege !== p.id ? `<button class="btn" onclick="PB=null;closeModal();act('besiege')"><span class="lbl">${ico('tent')}Lay siege instead</span></button>` : ''}<button class="btn" onclick="PB=null;closeModal();setMusic('map')"><span class="lbl">${ico('back')}Back</span><small>choose again</small></button></div>
    <p class="sub ctr">Auto-resolve fights the same battle with your stance and reserve, without the battle scene.</p>`, 'wide');
}
// move the army into position for the fight; false if it can no longer reach
function stageBattle(kind, p, A) {
  if (kind === 'assault') { if (A.siege !== p.id) { const s = stageFor(me(), A, p); if (!s) return false; } breakPeace(p); if (p.b.castle && !p.ruined) { A.siege = p.id; A.loc = p.id; } }
  else { if (A.siege && A.siege !== p.id) note(`You lift the siege of ${P(A.siege).name}.`); A.siege = null; if (A.loc !== p.id) { const s = strikeFrom(me(), A, p); if (s) { A.mp -= s.dist; A.loc = s.stage; } else if (canMarch(me(), A, p.id)) marchArmy(me(), A, p.id); } }
  return true;
}
const battleNames = (kind, p, cfg) => { const e = kind === 'relief' ? cfg.besieger : p.owner; return [FAC(me()).name, e ? FAC(e).name : p.lord]; };
// fight it out without the battle scene: the same battle model, your stance and reserve, the horse left to charge as the lines close
function autoBattle() {
  if (!PB) return;
  const { kind, p, A } = PB;
  if (!stageBattle(kind, p, A)) { PB = null; closeModal(); return toast('Out of reach'); }
  const cfg = PB.cfgFor(PB.st, PB.res); PB = null;
  const res = runBattle(cfg);
  finishBattle({ kind, p, army: A, cfg, a0: { ...cfg.A }, d0: { ...cfg.D }, names: battleNames(kind, p, cfg) }, res, res.why);
}
function startBattle() {
  if (BV) { BV.dead = true; releaseScene(BV); BV = null; }
  const { kind, p, A } = PB;
  if (!stageBattle(kind, p, A)) { PB = null; closeModal(); return toast('Out of reach'); }
  const cfg = PB.cfgFor(PB.st, PB.res); cfg.manualA = true;
  const B = makeBattle(cfg);
  const enemyF = kind === 'relief' ? cfg.besieger : p.owner;
  BV = { fids: [me(), enemyF], B, kind, p, army: A, cfg, a0: { ...cfg.A }, d0: { ...cfg.D }, enemyF, last: 0, clashT: 0, volley: 0, endT: 0, dead: false, bg: battleBg(), walls: p.walls, names: [FAC(me()).name, enemyF ? FAC(enemyF).name : p.lord], colors: [FAC(me()).color, enemyF ? FAC(enemyF).color : '#d9cba5'], dust: [], speed: SET.speed || 1, lastPhase: '' };
  PB = null;
  BV.c2 = BV.fids.map(f => { const a = f && FAC(f).arms; return a && a.c && a.t !== 'plain' ? a.c : '#f3e8cc'; });
  const side = (i, cls) => `<div class="side ${cls}"><div class="nm">${shield(BV.fids[i], 26)}<span>${esc(BV.names[i])}</span></div><div class="st">${STANCE[i ? cfg.dSt : cfg.aSt].n}</div><div class="hb"><i id="hb${i}" style="width:100%;background:linear-gradient(${BV.colors[i]},${mix(BV.colors[i], '#000', .3)})"></i></div><div class="cnts" id="cn${i}"></div></div>`;
  showModal(`<div class="bview"><div class="bhud">${side(0, 'l')}<div class="mid"><div class="phase" id="bphase">The armies advance</div><div class="tot" id="btot"></div></div>${side(1, 'r')}</div><div class="bstage"><canvas id="bvc"></canvas></div>
    <div class="bord" id="bord"></div>
    <div class="bctl" id="bvbtns"><button class="btn dark sm" onclick="bvSpeed()" id="bvspd"><span class="lbl">${ico('speed')}${BV.speed}×</span></button><button class="btn" onclick="bvRetreat()"><span class="lbl">${ico('retreat')}Sound the retreat</span></button><button class="btn" onclick="bvSkip()"><span class="lbl">${ico('skip')}Skip to the end</span></button></div></div>`, 'wide battle');
  const cv = $('#bvc');
  fitCanvas(cv, BW_, BH_);
  // draw no finer than the screen can show: the field is shown smaller than 1000 points on a phone
  const shown = (() => { const r = cv.getBoundingClientRect(); return Math.max(r.width, r.height) || BW_; })();
  const dpr = clamp(shown * (window.devicePixelRatio || 1) / BW_, 1, 2);
  cv.width = Math.round(BW_ * dpr); cv.height = Math.round(BH_ * dpr); BV.ctx = cv.getContext('2d'); BV.ctx.scale(dpr, dpr);
  // the field itself sits on a second canvas underneath: the sky, the ground, the walls and the fallen are painted
  // there and never redrawn, so each frame only clears and redraws what moves. The camera is a CSS transform on both.
  const bgc = document.createElement('canvas'); bgc.id = 'bvbg'; bgc.width = cv.width; bgc.height = cv.height; bgc.className = cv.className;
  bgc.style.cssText = cv.style.cssText; cv.parentNode.insertBefore(bgc, cv);
  if (!cv.closest('.rotbox')) { bgc.style.cssText += ';position:absolute;left:0;top:0;width:100%;height:100%'; cv.style.position = 'relative'; }
  BV.bgc = bgc; BV.bgx = bgc.getContext('2d'); BV.bgx.scale(dpr, dpr); BV.camBase = cv.style.transform || '';
  BV.ground = BV.bgc; drawGround(BV.bgx, BV);
  // the vignette and the hour's light are a layer of CSS over the stage, not a blit every frame
  { const st = $('.bstage') || cv.parentElement, h = BV.bg.hour, s = BV.bg.sun; const ov = document.createElement('div'); ov.className = 'bvlight'; ov.style.background = (h === 'day' ? '' : `radial-gradient(circle at ${(s.x / BW_ * 100).toFixed(0)}% ${(s.y / BH_ * 100).toFixed(0)}%, rgba(255,220,150,.22), rgba(255,220,150,0) 55%), linear-gradient(${h === 'dusk' ? 'rgba(240,150,80,.18)' : 'rgba(250,200,150,.14)'}, rgba(60,30,60,.18)),`) + 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(20,12,4,.45) 100%)'; st.appendChild(ov); }
  BV.corpX = BV.bgx; BV.corpN = 0;
  setTitle(BV, BV.kind === 'relief' ? `The relief of ${p.name}` : cfg.castle && !p.ruined ? `The storming of ${p.name}` : `The battle of ${p.name}`, `${dateStr(G.turn)} · ${BV.names[0]} against ${BV.names[1]}`);
  sfx('horn'); buzz(30);
  const scene = BV; requestAnimationFrame(t => bvFrame(t, scene));
}
function bvOrder(k) {
  if (!BV || BV.B.done) return;
  const B = BV.B;
  if (k === 'reserve') { if (commitReserve(B, 0)) { sfx('horn'); buzz(20); } }
  else if (orderCav(B, 0, k)) { sfx('horn'); buzz(20); }
  drawHud(BV);
}
function bvSpeed() { if (!BV) return; BV.speed = BV.speed >= 4 ? 1 : BV.speed * 2; SET.speed = BV.speed; saveSettings(); $('#bvspd').innerHTML = `<span class="lbl">${ico('speed')}${BV.speed}×</span>`; }
function bvRetreat() { if (!BV || BV.B.done) return; endBattle(BV.B, 1, 'retreat'); BV.endT = 0.01; }
function bvSkip() { if (!BV) return; const B = BV.B; let g = 0; while (!B.done && g++ < 2000) battleStep(B, 0.25); if (!B.done) endBattle(B, 1, 'time'); for (let i = 0; i < 40; i++) animateSquads(B, 0.1); BV.endT = 1.6; }
// each battle owns its own loop, so an old loop can never carry on drawing into a newer battle
function bvFrame(ts, scene) {
  if (!BV || BV !== scene || BV.dead) return;
  const dt = Math.min(0.05, BV.last ? (ts - BV.last) / 1000 : 0.016); BV.last = ts; BV.dt = dt;
  const B = BV.B;
  if (B.contact && !BV.clashed) { BV.clashed = true; BV.slow = SET.motion ? 0.9 : 0; buzz(40); }
  if (BV.slow > 0) BV.slow -= dt;
  const sim = dt * 2.4 * BV.speed * (BV.slow > 0 ? 0.3 : 1);
  if (!B.done) { let left = sim; while (left > 0 && !B.done) { const s = Math.min(0.1, left); battleStep(B, s); left -= s; } }
  animateSquads(B, sim);
  if (B.contact && !B.done) { BV.clashT -= dt; if (BV.clashT <= 0) { sfx('clash'); BV.clashT = 0.12 + Math.random() * 0.25; } }
  if (B.volley - BV.volley > 6) { sfx('arrows'); BV.volley = B.volley; }
  // dust behind moving squads
  for (const q of B.sq) if (q.moving && q.n > 0.1 && Math.random() < dt * 6) BV.dust.push({ x: q.x + (q.s === 0 ? -14 : 14), y: q.y + 6 + (Math.random() - .5) * 10, t: 0, r: 4 + Math.random() * 5 });
  BV.dust.forEach(d => d.t += dt); BV.dust = BV.dust.filter(d => d.t < 1.1);
  drawBattle(BV); drawHud(BV);
  if (B.done) { BV.endT += dt; if (BV.endT > 3.2) return bvFinish(); }
  requestAnimationFrame(t => bvFrame(t, scene));
}
function drawHud(V) {
  const B = V.B, tot = s => sideAll(B, s);
  // touch the page only when a number actually changes; rewriting it every frame forces a relayout
  for (const s of [0, 1]) {
    const hb = $('#hb' + s), w = Math.round(100 * tot(s) / Math.max(1, B.n0[s])) + '%'; if (hb && hb._w !== w) { hb._w = w; hb.style.width = w; }
    const cn = $('#cn' + s); if (cn) { const h = SIDE_T.filter(t => B.u0[s][t] > 0).map(t => `<span>${ico(UNIT_ICON[t])}${Math.round(B.u[s][t] + (B.res[s] ? (B.res[s][t] || 0) : 0))}</span>`).join('') + (B.res[s] ? `<span class="tag" style="font-size:11px;padding:1px 6px;margin:0">reserve ${resN(B, s)}</span>` : ''); if (cn._h !== h) { cn._h = h; cn.innerHTML = h; } }
  }
  const ob = $('#bord');
  if (ob) {
    let h = '';
    if (!B.done) {
      if (B.res[0]) h += `<button class="btn sm gold" onclick="bvOrder('reserve')"><span class="lbl">${ico('foot')}Commit the reserve</span></button>`;
      if (!B.castle && B.wing[0].s === 'hold' && B.u[0].cav > 0.05) h += `<button class="btn sm" onclick="bvOrder('wing')"><span class="lbl">${ico('cav')}At their horse</span></button><button class="btn sm" onclick="bvOrder('archers')"><span class="lbl">${ico('bow')}At their bowmen</span></button><button class="btn sm" onclick="bvOrder('rear')"><span class="lbl">${ico('flag')}Round the rear</span></button>`;
      else if (!B.castle && B.u0[0].cav > 0) h += `<span class="st">${B.status[0] || (B.wing[0].s === 'fight' ? 'The horse are engaged' : B.wing[0].s === 'flank' ? 'The horse are in the enemy rear' : B.wing[0].s === 'broken' ? 'The horse are broken' : B.wing[0].s === 'ride' ? 'The horse ride round' : B.wing[0].s === 'raid' ? 'The horse are among the bowmen' : 'The horse await the enemy')}</span>`;
      if (B.boost[0] > B.t) h += `<span class="st good">Surge: +15% attack</span>`;
    } else h += `<span class="st">${B.win === 0 ? 'The day is yours.' : 'The field is lost.'}</span>`;
    if (ob.innerHTML !== h) ob.innerHTML = h;
  }
  const phase = B.done ? (B.win === 0 ? 'VICTORY' : B.why === 'retreat' ? 'RETREAT' : 'DEFEAT')
    : B.wing.some(w => w.s === 'flank') ? 'The horse strike the rear!' : B.wing[0].s === 'fight' ? 'The horse clash on the wings' : B.contact ? 'The lines clash' : (B.castle ? B.front[0] > WALLX - 330 : gap(B) <= 300) ? 'Arrows fly' : 'The armies advance';
  if (phase !== V.lastPhase) { if (V.lastPhase) setTitle(V, B.done ? phase : phase, B.done ? (B.win === 0 ? 'The day is yours' : B.why === 'retreat' ? 'Your men leave the field in good order' : 'The field is lost') : null); if (phase.includes('rear') || phase.includes('clash')) { const cv = $('#bvc'), box = cv && (cv.closest('.rotbox') || cv); if (box && SET.motion) { box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); } } V.lastPhase = phase; const el = $('#bphase'); if (el) { el.textContent = phase; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); } if (phase.includes('rear')) buzz(25); }
  const bt = $('#btot'), tt = `${Math.round(tot(0))} vs ${Math.round(tot(1))}`; if (bt && bt.textContent !== tt) bt.textContent = tt;
}

function bvFinish() {
  const V = BV; BV = null; V.dead = true;
  const res = battleResult(V.B), why = V.B.why;
  releaseScene(V);
  finishBattle(V, res, why);
}
function finishBattle(V, res, why) {
  const p = V.p; tutorDid('battle');
  const from = V.army.loc;
  if (V.kind === 'relief') resolveRelief(me(), V.army, p, res, V.cfg); else resolveAssault(me(), V.army, p, res, V.cfg);
  if (res.won && V.kind !== 'relief') setTimeout(() => flashProv(p.id), 300);
  sfx(res.won ? 'victory' : 'defeat'); buzz(res.won ? 50 : 80);
  const head = res.won ? (V.kind === 'relief' ? `The siege of ${p.name} is broken!` : `${p.name} is yours!`) : (why === 'retreat' ? 'You sound the retreat' : why === 'time' ? 'The attack stalls and your men fall back' : 'Your army is beaten');
  const foe = V.names[1].charAt(0).toUpperCase() + V.names[1].slice(1);
  const body = `Your losses: ${lossStr(V.a0, res.A)}. ${foe} lost ${lossStr(V.d0, res.D)}.`;
  note(head + ' ' + body);
  const row = (name, before, after) => `<tr><td>${name}</td><td>${uStr(before, true, false)}</td><td>${uStr(after, true, false)}</td></tr>`;
  showModal(`<div class="rep${res.won ? '' : ' badrep'}"><div class="sealmark">${ico(res.won ? 'star' : 'swords')}</div><h2>${head}</h2><p>${body}</p>
    <table class="stat"><tr><th></th><th>Before</th><th>After</th></tr>${row(V.names[0], V.a0, res.A)}${row(V.names[1], V.d0, res.D)}</table>
    ${pullBackHtml(V.army, from, p)}<div class="row ctr"><button class="btn gold big" onclick="closeModal();save();render();showReports()">Continue</button></div></div>`);
}

// after a won field battle the army has marched into the county it took; the player may pull it back instead
function pullBackHtml(A, from, p) {
  if (!A || A.loc !== p.id || !from || from === p.id || !P(from) || !passable(me(), from) || !armySize(A)) return '';
  window._pullBack = { a: A.id, from, to: p.id };
  return `<div class="notebox">${ico('flag')} Army ${ARMY_NUM(A)} has marched into ${p.name} and holds it. <span class="sub">Leave it there, or bring it back to ${P(from).name} and leave ${p.name} empty.</span><div class="row" style="margin-top:6px"><button class="btn sm" onclick="pullBack()"><span class="lbl">${ico('back')}Pull back to ${P(from).name}</span></button></div></div>`;
}
function pullBack() {
  const d = window._pullBack; if (!d) return; const A = army(me(), d.a); window._pullBack = null;
  if (A && A.loc === d.to) { A.loc = d.from; note(`Army ${ARMY_NUM(A)} falls back to ${P(d.from).name}, leaving ${P(d.to).name} without a garrison.`); toast(`Army ${ARMY_NUM(A)} pulls back to ${P(d.from).name}`, 'back'); }
  closeModal(); save(); render(); showReports();
}
