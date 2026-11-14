'use strict';
// ================= THE GUIDED FIRST CAMPAIGN =================
// One objective at a time, in a small card over the map. A step is done when the player actually does it
// (actions mark G.tut.did); the card then moves on. Any step can be skipped, and the guide can be ended.
// The guide walks a new player through a real first two turns: raise a man and gather the host, win the Pope's
// blessing, take a county and see what it pays, build a farm, guard your back, end the turn; then a market and the
// fair, a siege train, and a bombardment where every kind of shot is tried once. A few things are free or instant
// this once (the blessing, the farm and the market, the catapults and the Greek fire); the card says so each time.
const tut = () => G.tut, tutHome = () => P(homeOf(me())), tutA = () => armiesOf(me())[0];
const tutP = k => G.tut && G.tut[k] ? P(G.tut[k]) : null;
const inc = () => grossIncome(me()), pay = () => upkeepOf(me());
const DESK = () => document.body.classList.contains('d');
const where = (desk, phone) => DESK() ? desk : phone;
// the lesser lord to take on the first turn: a neighbour with no castle and no house, the weakest first
function tutPickPrey() {
  const A = tutA(); if (!A) return null;
  const ok = q => !q.owner && !q.ally && !q.b.castle && strikeFrom(me(), A, q), weak = (x, y) => fighters(defenders(x)) - fighters(defenders(y));
  const next = (ADJ[A.loc] || []).map(P).filter(ok).sort(weak);
  const c = next.length ? next : provList().filter(ok).sort(weak);
  return c[0] ? c[0].id : null;
}
// the castle to bombard on the second turn: a lesser lord's castle the army can reach
function tutPickCastle() {
  const A = tutA(); if (!A) return null;
  const c = provList().filter(q => !q.owner && !q.ally && q.b.castle && !q.ruined && strikeFrom(me(), A, q)).sort((x, y) => fighters(defenders(x)) - fighters(defenders(y)));
  return c[0] ? c[0].id : null;
}
const TUT = [
  { id: 'home', t: 'Your seat', b: () => `This is your duchy. Tap ${tutHome().name}, the county with the crown, to open it.`, done: () => G.sel === 'p:' + homeOf(me()) },
  { id: 'raise', t: 'Raise a man', b: () => `In ${tutHome().name}, open the Raise tab and buy one Footman for the garrison (${unitCost(me(), 'foot')} d). Men in a garrison guard the county and cost nothing to keep.`, done: d => d.raise },
  { id: 'gather', t: 'Gather the host', b: () => `Now open the Army tab and tap All to army. Every man in the garrison joins army 1, the host you campaign with. Men in an army fight anywhere, but they are paid every turn.`, done: d => d.allArmy || d.toArmy },
  { id: 'church', t: 'The Church', b: () => `Open the Church ${where('at the top', 'in the bottom bar')} and ask the Pope to bless your arms. It is free this time and he will say yes; usually it costs ${POPE.bless.c} d and he may refuse. A blessing makes your men fight harder for ${TR(me()).bless || 3} turns. The more cardinals you have in Rome, the likelier he listens.`,
    enter: () => { G.tut.free = G.tut.free || {}; G.tut.free.bless = 1; }, done: d => d.pope },
  { id: 'attack', t: 'Take a county', b: () => { const q = tutP('prey'); return q ? `${q.name}, next to ${tutHome().name}, belongs to ${q.lord}: no house colour, no castle, only peasant levies. Tap ${q.name}, then Attack, then Sound the advance (or Auto-resolve). Lesser lords may be attacked at any time.` : 'Tap a neighbouring county with no house colour and no castle, then attack it.'; },
    enter: () => { G.tut.prey = tutPickPrey(); G.tut.inc0 = inc(); }, done: () => { const q = tutP('prey'); return q ? holds(me(), q.id) : true; } },
  { id: 'income', t: 'What it pays', next: true, b: () => { const q = tutP('prey'); return `${q ? q.name : 'The county'} is yours. Your lands now bring in ${inc()} d a turn, up from ${G.tut.inc0}. Counties pay less the further they lie from your seat. But army 1 costs ${pay()} d a turn in pay, so the treasury at the top grows by only ${inc() - pay()}. Men in a garrison are free: send them home when you are not campaigning.`; } },
  { id: 'farm', t: 'Build a farm', b: () => { const q = tutP('prey'); return `Tap ${q ? q.name : 'your new county'}, open its Build tab and build Farms (${BLD.farm.c} d). Farms usually take ${BLD.farm.t} turns to finish; this once they go up at once, so you can see what they do.`; },
    enter: () => { G.tut.instant = 'farm'; G.tut.inc1 = inc(); }, done: () => { const q = tutP('prey'); return q ? (q.b.farm || 0) > 0 : true; } },
  { id: 'farmed', t: 'Buildings pay', next: true, b: () => `Your lands now bring in ${inc()} d a turn, up ${Math.max(0, inc() - (G.tut.inc1 ?? inc()))} from the farms, leaving ${inc() - pay()} a turn after the army's pay. Buildings keep paying for the rest of the game: farms, market towns, mines, ports. A busy realm builds something every turn.` },
  { id: 'peace', t: SC.peace.Name, next: true, b: () => `${SC.peace.Name} holds until ${dateStr(TRUCE)}: until then no great house may attack another, or the Pope will excommunicate it. Lesser lords like the one you just beat are fair game. Use the peace to grow, and to make friends before it ends.` },
  { id: 'pact', t: 'Guard your back', b: () => `Open ${where('Diplomacy', 'Envoys')}, choose a neighbouring house you do not mean to fight, and sign a pact of peace. Neither of you can break it, so you can turn your army elsewhere when the peace ends.`, done: d => d.pact },
  { id: 'end', t: 'End the turn', b: () => 'Press End turn. The other houses move, and the map shows what the ones near you did.', done: d => (d.end || 0) >= 1 },
  { id: 'market', t: 'A market town', b: () => `Tap ${tutHome().name}, open Build and build a Market town (${BLD.market.c} d). It pays more than farms and lets you trade at the fair. It usually takes ${BLD.market.t} turns; this once it opens at once.`,
    enter: () => { G.tut.instant = 'market'; }, done: () => markets() > 0 },
  { id: 'fair', t: 'The fair', b: () => `Once a year, in summer, merchants gather for ${SC.fair.name}. Lords with a market town bring what their lands make: grain and wool from farms, cloth from markets. Over three days you sell when the price is right; the merchants' gossip about tomorrow is usually true. This once the fair is open now.`,
    act: ['Go to the fair', 'tutFair()'], enter: () => { G.tut.fairNow = true; }, done: d => d.fair || G.fairYear === yearOf(G.turn) },
  { id: 'train', t: 'A siege train', b: () => { const A = tutA(); return `Tap ${A && A.loc ? P(A.loc).name : 'the county where army 1 stands'}, where army 1 stands, and open Raise. Buy 2 Catapults into the army (free this time, usually ${UNIT.cat.c} d each), then a jar of Greek fire (free, usually ${gfCost(me(), A)} d). Catapults break walls; nothing else does.`; },
    enter: () => { G.tut.free = G.tut.free || {}; G.tut.free.cat = 2; G.tut.free.gf = 1; }, done: () => { const A = tutA(); return !!A && A.cat >= 2 && (A.gf || 0) >= 1; } },
  { id: 'siege', t: 'Lay siege', b: () => { const q = tutP('castle'); return q ? `${q.name} has a castle and only a lesser lord to hold it. Tap ${q.name} and choose Lay siege. Storming walls at once costs men; a siege lets your catapults go to work first.` : 'Tap a lesser lord\'s county with a castle, within reach of your army, and lay siege to it.'; },
    enter: () => { G.tut.castle = tutPickCastle(); }, done: () => { const A = tutA(), q = tutP('castle'); return !!A && !!A.siege && (!q || A.siege === q.id); } },
  { id: 'bombard', t: 'Bombard', b: () => `In the siege panel, tap Bombard. The siege lines open, and the guide shows you every kind of shot.`, done: () => { const A = tutA(); return !A || !!A.bombarded; } },
  { id: 'realm', t: 'Your realm', act: ['Show my realm', 'tutRealm()'], b: () => `The realm panel shows the whole of it: treasury and income, garrisons and armies, sons for marriages, bishops, and the other houses and how they feel about you. ${where('Tap the sea or Realm at the top of a county panel', 'Tap Realm in the bottom bar')} to open it any time.`, done: d => d['next:realm'] },
  { id: 'goal', t: 'Your goal', b: () => `In the realm panel, open "Your goal": the crown, the places a king is made in, and how much of the kingdom you must hold. Everything you just learned is how you get there.`, done: d => d.goal },
];
function tutRealm() { G.sel = null; tutorDid('next:realm'); render(); if (isPhone()) setSheet('half'); }
function tutFair() { if (!G.tut) return; G.tut.fairNow = true; openFair(); }
function tutorDid(k) { if (G && G.tut) { G.tut.did[k] = (G.tut.did[k] || 0) + 1; } }
function tutorNext() { const T = G && G.tut; if (!T) return; T.did['next:' + TUT[T.i].id] = 1; save(); renderTutor(); }
function tutorSkip() { if (!G.tut) return; G.tut.i++; sfx('click'); save(); renderTutor(); }
function tutorEnd() { G.tut = null; save(); renderTutor(); toast('Guide closed. How to play is in Settings.', 'info'); }
function renderTutor() {
  let el = $('#tutor');
  const T = G && G.tut;
  if (!T || G.over) { if (el) el.remove(); return; }
  const enter = () => { const st = TUT[T.i]; if (st && T.entered !== st.id) { T.entered = st.id; if (st.enter) st.enter(); } };
  enter();
  while (T.i < TUT.length && (TUT[T.i].next ? T.did['next:' + TUT[T.i].id] : TUT[T.i].done(T.did))) { T.i++; sfx('coin'); enter(); }
  if (T.i >= TUT.length) { G.tut = null; if (el) el.remove(); report('The guide is done', 'You know the whole of it now: raise and gather your host, win the Pope to your side, take counties and build on them, guard your back with pacts, trade at the fair, and break walls with your siege train. Marriages, heiresses and the court are yours to discover. How to play, in Settings, has the details.'); return; }
  if (!el) { el = document.createElement('div'); el.id = 'tutor'; $('#mapwrap').appendChild(el); }
  const s = TUT[T.i];
  if (el.dataset.step !== s.id) { el.dataset.step = s.id; el.classList.remove('new'); void el.offsetWidth; el.classList.add('new'); }
  const go = s.next ? `<button class="tgo" onclick="tutorNext()">Next</button>` : s.act ? `<button class="tgo" onclick="${s.act[1]}">${esc(s.act[0])}</button>` : '';
  setHTML(el, `<div class="tn">${T.i + 1}/${TUT.length}</div><div class="tb"><b>${esc(s.t)}</b>${esc(s.b())}${go ? `<div class="tgow">${go}</div>` : ''}</div><div class="tx"><button onclick="tutorSkip()">Skip</button><button onclick="tutorEnd()">End guide</button></div>`);
}
