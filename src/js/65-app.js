// ================================================================ trial controller (prefix app)
// Auto runs runTrial and plays the dialogue. Interactive asks one proposal and waits for Yes/No.
// Grasp runs only after a correct resolution (operator verification, Sec. 4.3).
// A placeholder grasp segment is 2.4 s when graspWaypoints cannot reach the object. That duration is a twin assumption.

const appHomeQ = Object.freeze({
  x: stretchQ.x, lift: stretchQ.lift, arm: stretchQ.arm, yaw: stretchQ.yaw,
  pitch: stretchQ.pitch, roll: stretchQ.roll, grip: stretchQ.grip, pan: stretchQ.pan, tilt: stretchQ.tilt,
});

let appReady = false;
let appFilling = false;
let appSet = "offline";
let appSceneId = "off-cups-01";
let appInstrIndex = 0;
let appPolicy = "activask";
let appEps = 0;
let appK = 4;
let appSeed = 1;
let appSpeech = false;
let appSpoken = "";
let appSerial = 1;
let appPlaced = null;
let appInstr = null;
let appCands = [];
let appTarget = null;
let appTargetChosen = false;
let appTrial = null;
let appSegs = [];
let appGroups = new Map();
let appLog = [];
let appLogRow = null;
let appWillGrasp = false;
let appHasWaypoints = false;
let appPlan = null;
let appGraspTick = null;
let appLastSeg = null;
let appS = [];
let appRounds = [];
let appHist = [];
let appProps = [];
let appPending = null;
let appIxDone = false;
let appIxLogged = false;
let appShown = {
  S: [], props: [], sel: null, history: [], outcome: null, resolved: null,
  questions: 0, pending: false, belief: "", phase: "", roundLabel: "",
};
const appAlive = new Uint8Array(24);
let appHot = 0;
const appRay = new THREE.Raycaster();
const appPtr = new THREE.Vector2();
let appDownX = 0;
let appDownY = 0;

function appUse3d() { return !QS.has("gallery"); }

function appFreshSeed() {
  appSerial = (appSerial + 1) >>> 0;
  return (((Date.now() >>> 0) ^ Math.imul(appSerial, 0x9e3779b1)) >>> 0) || 1;
}

function appDrawTarget(instr, seed) {
  const ids = (instr && instr.matches) || [];
  if (!ids.length) return null;
  const r = rng((seed >>> 0) || 1);
  return ids[Math.floor(r() * ids.length)];
}

function appCand(id) {
  for (let i = 0; i < appCands.length; i++) if (appCands[i].id === id) return appCands[i];
  return null;
}

function appObj(id) {
  const list = appPlaced && appPlaced.objects;
  if (!list) return null;
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function appResolvedObj() {
  if (!appTrial || !appTrial.resolved) return null;
  const c = appCand(appTrial.resolved);
  return c ? appObj(c.obj) : null;
}

function appBelief() {
  if (!appTrial || !appTrial.resolved) return "";
  const c = appCand(appTrial.resolved);
  const o = c ? appObj(c.obj) : null;
  if (!o) return "I think you mean that one.";
  return "I think you mean the " + o.color + " " + o.size + " " + o.cat + ".";
}

function appGraspKind(kind) {
  return kind === "grasp" || kind === "clear" || kind === "base" || kind === "pregrasp" || kind === "descend"
    || kind === "close" || kind === "lift" || kind === "retract" || kind === "reobserve";
}

function appMarkAlive(ids) {
  appAlive.fill(0);
  for (let i = 0; i < ids.length; i++) {
    const n = +String(ids[i]).slice(1);
    if (n > 0 && n < appAlive.length) appAlive[n] = 1;
  }
}

function appMarkResolved(id) {
  appHot = id ? +String(id).slice(1) : 0;
}

function appSegAt(t) {
  const n = appSegs.length;
  if (!n) return null;
  for (let i = 0; i < n; i++) if (t < appSegs[i].t1) return appSegs[i];
  return appSegs[n - 1];
}

function appPushSeg(segs, kind, label, dur, extra) {
  const t0 = segs.length ? segs[segs.length - 1].t1 : 0;
  const s = { t0, t1: t0 + dur, kind, label };
  if (extra) Object.assign(s, extra);
  segs.push(s);
  return s;
}

function appPlanOf(obj) {
  if (typeof planGrasp !== "function" || typeof stretchIK !== "function" || !obj) return null;
  try {
    const plan = planGrasp(obj);
    if (!plan || plan.ok === false) return null;
    const q = stretchIK(plan.p, plan.yaw);
    return { plan, q };
  } catch (e) { return null; }
}

function appClearGraspTick() {
  if (!appGraspTick) return;
  const i = TICKERS.indexOf(appGraspTick);
  if (i >= 0) TICKERS.splice(i, 1);
  appGraspTick = null;
}

function appAppendMotion(segs, obj) {
  let motion = null;
  if (typeof graspWaypoints === "function") {
    const others = [];
    const all = appPlaced && appPlaced.objects ? appPlaced.objects : [];
    for (let i = 0; i < all.length; i++) if (all[i].id !== obj.id) others.push(all[i]);
    try { motion = graspWaypoints(obj, { ...appHomeQ }, others); }
    catch (e) { motion = null; }
  }
  const tBase = segs.length ? segs[segs.length - 1].t1 : 0;
  if (Array.isArray(motion) && motion.length) {
    let t = tBase;
    for (let i = 0; i < motion.length; i++) {
      const s = motion[i];
      const dur = Math.max(0.05, (s.t1 || 0) - (s.t0 || 0));
      segs.push({ ...s, t0: t, t1: t + dur });
      t += dur;
    }
    appHasWaypoints = true;
  } else {
    const q = { ...appHomeQ };
    segs.push({ t0: tBase, t1: tBase + 2.4, kind: "grasp", label: "grasp", q0: q, q1: q });
    appHasWaypoints = false;
  }
  appWillGrasp = true;
  if (appHasWaypoints && typeof graspTicker === "function") {
    try {
      const tick = graspTicker(segs, appGroups.get(obj.id) || null, true);
      if (typeof tick === "function") { appGraspTick = tick; TICKERS.push(tick); }
    } catch (e) { appGraspTick = null; }
  }
}

function appComposeAuto(trial) {
  const segs = [];
  appWillGrasp = false;
  appHasWaypoints = false;
  appPlan = null;
  appPushSeg(segs, "listen", trial.instr, 1.5);
  appPushSeg(segs, "perceive", trial.S0.length + " candidates", 1.0);
  const rounds = trial.rounds || [];
  for (let i = 0; i < rounds.length; i++) {
    appPushSeg(segs, "ask", rounds[i].sel.text, 2.5, { round: i });
    appPushSeg(segs, "answer", rounds[i].answer, 1.2, { round: i });
  }
  if (trial.resolved) appPushSeg(segs, "resolved", trial.outcome, 0.8);
  else appPushSeg(segs, "unresolved", trial.outcome, 0.8);
  if (trial.outcome === "correct") {
    const obj = appResolvedObj();
    if (obj) {
      appPlan = appPlanOf(obj);
      appAppendMotion(segs, obj);
    }
  }
  return segs;
}

function appClearObjects() {
  for (let i = 0; i < hcTags.length; i++) {
    const s = hcTags[i];
    if (s.parent) s.parent.remove(s);
    if (s.material) {
      if (s.material.map) s.material.map.dispose();
      s.material.dispose();
    }
  }
  hcTags.length = 0;
  appGroups.clear();
  if (!appUse3d()) return;
  const root = MODULES.objects;
  for (let i = root.children.length - 1; i >= 0; i--) {
    const g = root.children[i];
    root.remove(g);
    g.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.userData && o.userData.appSprite && o.material) {
        if (o.material.map) o.material.map.dispose();
        o.material.dispose();
      }
    });
  }
}

function appMountObjects(placed) {
  if (!appUse3d()) return;
  const root = MODULES.objects;
  for (let i = 0; i < placed.objects.length; i++) {
    const o = placed.objects[i];
    const g = makeObject(o);
    g.position.set(o.x, o.y, TABLE.h);
    g.rotation.z = o.yaw || 0;
    g.userData.appId = o.id;
    root.add(g);
    appGroups.set(o.id, g);
  }
}

function appMaybeSpeak(text) {
  if (!appSpeech || !text || text === appSpoken) return;
  appSpoken = text;
  const syn = window.speechSynthesis;
  if (!syn || typeof SpeechSynthesisUtterance !== "function") return;
  try {
    syn.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    syn.speak(u);
  } catch (e) { /* headless, or no voice */ }
}

function appApplyNow(seg) {
  const cyc = $("now-cyc");
  if (!seg) {
    uiSetNow("robot", "–");
    uiSetNow("say", "–");
    uiSetNow("user", "–");
    if (cyc) cyc.textContent = "";
    return;
  }
  if (cyc && cyc.textContent !== seg.kind) cyc.textContent = seg.kind;
  if (seg.kind === "listen") {
    uiSetNow("robot", "Listen", "wait");
    uiSetNow("say", seg.label || "–", "say");
    uiSetNow("user", "–");
  } else if (seg.kind === "perceive") {
    uiSetNow("robot", "Look", "head");
    uiSetNow("say", seg.label || "–", "perceive");
    uiSetNow("user", "–");
  } else if (seg.kind === "ask") {
    uiSetNow("robot", "Ask", "question");
    uiSetNow("say", seg.label || "–", "ask");
    uiSetNow("user", "–");
    appMaybeSpeak(seg.label);
  } else if (seg.kind === "answer") {
    uiSetNow("robot", "–");
    uiSetNow("say", "–");
    uiSetNow("user", seg.label === "yes" ? "Yes" : "No", "answer");
  } else if (seg.kind === "resolved") {
    uiSetNow("robot", "Resolved", appTrial && appTrial.resolved ? appTrial.resolved : "");
    uiSetNow("say", appBelief() || "resolved", "say");
    uiSetNow("user", "–");
  } else if (seg.kind === "unresolved") {
    uiSetNow("robot", "Stop", "unresolved");
    uiSetNow("say", "Unresolved", "");
    uiSetNow("user", "–");
  } else {
    uiSetNow("robot", seg.label || seg.kind, seg.kind);
    uiSetNow("say", "–");
    uiSetNow("user", "–");
  }
}

function appSyncAuto(t) {
  const trial = appTrial;
  if (!trial) return;
  const rounds = trial.rounds || [];
  let answered = 0;
  for (let i = 0; i < appSegs.length; i++) {
    if (appSegs[i].kind === "answer" && t >= appSegs[i].t1) answered++;
  }
  let S = trial.S0.slice();
  for (let i = 0; i < answered && i < rounds.length; i++) S = updateState(S, rounds[i].sel, rounds[i].answer);
  const seg = appSegAt(t);
  const show = !!(seg && (seg.kind === "resolved" || seg.kind === "unresolved" || appGraspKind(seg.kind)));
  if (show && trial.resolved) S = [trial.resolved];
  else if (show) S = [];
  let round = null;
  if (seg && seg.round != null) round = rounds[seg.round];
  else if (rounds.length) round = rounds[Math.min(answered, rounds.length - 1)];
  const history = [];
  for (let i = 0; i < answered && i < rounds.length; i++) history.push({ text: rounds[i].sel.text, answer: rounds[i].answer });
  appShown = {
    S, props: round ? round.props : [], sel: round ? round.sel : null, history,
    outcome: show ? trial.outcome : null, resolved: show ? trial.resolved : null,
    questions: answered, pending: false,
    belief: show && trial.resolved ? appBelief() : "",
    phase: seg ? seg.kind : "",
    roundLabel: round ? "round " + (rounds.indexOf(round) + 1) : "",
  };
  appMarkAlive(S);
  appMarkResolved(show ? trial.resolved : null);
  hcSyncTags();
  uiPaint();
}

function appSyncInteractive() {
  const done = !!(appIxDone && appTrial);
  const phase = appPending ? "ask" : (done ? (appTrial.resolved ? "resolved" : "unresolved") : "listen");
  appShown = {
    S: appS, props: appProps, sel: appPending || (appRounds.length ? appRounds[appRounds.length - 1].sel : null),
    history: appHist, outcome: done ? appTrial.outcome : null, resolved: done ? appTrial.resolved : null,
    questions: appRounds.length, pending: !!appPending,
    belief: done && appTrial.resolved ? appBelief() : "",
    phase,
    roundLabel: appPending ? "round " + (appRounds.length + 1) : (appRounds.length ? "round " + appRounds.length : ""),
  };
  appMarkAlive(appS);
  appMarkResolved(done ? appTrial.resolved : null);
  hcSyncTags();
  uiPaint();
}

function appRowFromTrial(tr) {
  return {
    scene: appSceneId, instruction: appInstr ? appInstr.text : "", type: appInstr ? appInstr.type : "",
    policy: appPolicy, eps: appEps, K: appK, S0: appCands.length,
    questions: tr ? tr.questions : 0, outcome: tr ? tr.outcome : "",
    resolved: tr && tr.resolved ? tr.resolved : "", target: appTarget || "",
  };
}

function appRecord(row) {
  appLog.push(row);
  appLogRow = row;
}

function appDropPartial() {
  if (mode !== "interactive" || appIxLogged || !appRounds.length || !appInstr) return;
  appRecord({
    scene: appSceneId, instruction: appInstr.text, type: appInstr.type, policy: appPolicy,
    eps: appEps, K: appK, S0: appCands.length, questions: appRounds.length,
    outcome: "unresolved", resolved: "", target: appTarget || "",
  });
  appIxLogged = true;
}

function appRunAuto() {
  appTarget = appDrawTarget(appInstr, appSeed);
  appTargetChosen = true;
  appIxDone = true;
  appIxLogged = true;
  appTrial = runTrial(appPlaced, appInstr, appTarget, appPolicy, { seed: appSeed, eps: appEps, K: appK });
  appSegs = appComposeAuto(appTrial);
  setTimeline(appSegs);
  setStretch({ ...appHomeQ });
  appRecord(appRowFromTrial(appTrial));
  seek(0);
  setPlaying(true);
  appSyncAuto(0);
  appApplyNow(appSegAt(0));
  appLastSeg = appSegAt(0);
}

function appDirectResolved() {
  const dummy = (appInstr.matches && appInstr.matches[0]) || (appPlaced.objects[0] && appPlaced.objects[0].id);
  if (!dummy) return null;
  const probe = runTrial(appPlaced, appInstr, dummy, appPolicy, { seed: appSeed, eps: 0, K: appK, slip: 0 });
  return probe.resolved;
}

function appAskNext() {
  const roundSeed = (appSeed + (appRounds.length + 1) * 0x9e3779b1) >>> 0 || 1;
  const hist = [];
  for (let i = 0; i < appRounds.length; i++) hist.push(appRounds[i].sel.key);
  appProps = proposeQuestions(appS, appCands, appPlaced, hist, { K: appK, seed: roundSeed, slip: 0.05 });
  appPending = selectProp(appPolicy, appProps, roundSeed);
  if (appPending) appMaybeSpeak(appPending.text);
}

function appFinishInteractive() {
  appIxDone = true;
  appPending = null;
  const resolved = appS.length === 1 ? appS[0] : null;
  let outcome;
  if (!resolved) outcome = appCands.length ? "unresolved" : "none";
  else if (!appTargetChosen) outcome = "none";
  else {
    const c = appCand(resolved);
    outcome = c && c.obj === appTarget ? "correct" : "wrong";
  }
  const fromStart = appRounds.length === 0;
  appTrial = {
    scene: appSceneId, instr: appInstr.text, target: appTarget, policy: appPolicy, eps: appEps,
    S0: appCands.map((c) => c.id), rounds: appRounds, resolved, outcome, questions: appRounds.length,
  };
  appClearGraspTick();
  appSegs = appComposeAuto(appTrial);
  setTimeline(appSegs);
  setStretch({ ...appHomeQ });
  appRecord(appRowFromTrial(appTrial));
  appIxLogged = true;
  let resolvedT0 = 0;
  for (let i = 0; i < appSegs.length; i++) if (appSegs[i].kind === "resolved" || appSegs[i].kind === "unresolved") resolvedT0 = appSegs[i].t0;
  if (fromStart) { seek(0); setPlaying(true); }
  else if (appWillGrasp) { seek(resolvedT0); setPlaying(true); }
  else { seek(resolvedT0); setPlaying(false); }
  appSyncInteractive();
  appApplyNow(appSegAt(time));
  appLastSeg = appSegAt(time);
  uiDrawLanes();
}

function appStartInteractive() {
  appTarget = null;
  appTargetChosen = false;
  appTrial = null;
  appIxDone = false;
  appIxLogged = false;
  appRounds = [];
  appHist = [];
  appProps = [];
  appPending = null;
  appS = appCands.map((c) => c.id);
  appWillGrasp = false;
  appPlan = null;
  appHasWaypoints = false;
  const info = POLICIES.find((p) => p.id === appPolicy);
  if (appS.length < 2) { appFinishInteractive(); return; }
  if (!info || !info.clarifies) {
    const id = appDirectResolved();
    appS = id ? [id] : [];
    appFinishInteractive();
    return;
  }
  appAskNext();
  if (!appPending) { appFinishInteractive(); return; }
  appSegs = [];
  appPushSeg(appSegs, "listen", appInstr.text, 1.5);
  appPushSeg(appSegs, "perceive", appCands.length + " candidates", 1.0);
  appPushSeg(appSegs, "ask", appPending.text, 6);
  setTimeline(appSegs);
  setStretch({ ...appHomeQ });
  seek(0);
  setPlaying(true);
  appSyncInteractive();
  appApplyNow(appSegAt(0));
  appLastSeg = appSegAt(0);
}

function appAnswer(ans) {
  if (mode !== "interactive" || !appPending || appIxDone) return;
  if (ans !== "yes" && ans !== "no") return;
  const sel = appPending;
  appRounds.push({ S: appS.slice(), props: appProps, sel, answer: ans });
  appHist.push({ text: sel.text, answer: ans });
  appS = updateState(appS, sel, ans);
  appPending = null;
  if (appS.length <= 1) { appFinishInteractive(); return; }
  appAskNext();
  if (!appPending) { appFinishInteractive(); return; }
  for (let i = 0; i < appSegs.length; i++) if (appSegs[i].kind === "ask") appSegs[i].label = appPending.text;
  appSyncInteractive();
  appApplyNow(appSegAt(time));
  uiDrawLanes();
}

function appChooseTarget(id) {
  if (mode !== "interactive") return;
  appTarget = id;
  appTargetChosen = true;
  if (appIxDone && appTrial && appTrial.resolved) {
    const c = appCand(appTrial.resolved);
    appTrial.outcome = c && c.obj === id ? "correct" : "wrong";
    appTrial.target = id;
    if (appLogRow) { appLogRow.outcome = appTrial.outcome; appLogRow.target = id; }
    appSyncInteractive();
    return;
  }
  const note = $("app-target-note");
  if (note) note.textContent = "Hidden target set.";
}

function appRebuild() {
  appDropPartial();
  appClearGraspTick();
  appClearObjects();
  appSpoken = "";
  appWillGrasp = false;
  appHasWaypoints = false;
  appPlan = null;
  appPending = null;
  appIxDone = false;
  appRounds = [];
  appHist = [];
  appProps = [];
  appS = [];
  appTrial = null;
  appLastSeg = null;
  let src = null;
  for (let i = 0; i < SCENES.length; i++) if (SCENES[i].id === appSceneId) { src = SCENES[i]; break; }
  const pool = src ? (INSTRUCTIONS[src.id] || []) : [];
  const idx = pool.length ? Math.max(0, Math.min(appInstrIndex, pool.length - 1)) : 0;
  const instr = pool.length ? pool[idx] : null;
  if (!src || !instr) {
    appPlaced = null; appInstr = null; appCands = []; appSegs = [];
    uiPaint(); uiDrawLanes(); return;
  }
  let placed;
  try { placed = layoutScene(src, appSeed); }
  catch (e) {
    appPlaced = null; appCands = []; appSegs = [];
    uiPaint(); uiDrawLanes(); return;
  }
  appPlaced = placed;
  appInstr = instr;
  appInstrIndex = idx;
  appCands = initialCandidates(placed, instr, appSeed >>> 0);
  appMountObjects(placed);
  hcRebuildTags();
  hcPrepOverlay();
  if (mode === "auto") appRunAuto();
  else appStartInteractive();
  uiDrawLanes();
}

function appShowRanges() {
  const eps = $("app-eps"), k = $("app-k");
  if ($("app-eps-out") && eps) $("app-eps-out").textContent = Number(eps.value).toFixed(2);
  if ($("app-k-out") && k) $("app-k-out").textContent = String(Math.round(Number(k.value)));
}

function appReadForm() {
  appSet = $("app-set").value || "offline";
  appSceneId = $("app-scene").value || appSceneId;
  const idx = Number($("app-instr").value);
  appInstrIndex = Number.isFinite(idx) ? idx : 0;
  appPolicy = $("app-policy").value || "activask";
  appEps = Math.min(0.2, Math.max(0, Number($("app-eps").value) || 0));
  appK = Math.min(5, Math.max(1, Math.round(Number($("app-k").value) || 4)));
  const seed = Math.round(Number($("app-seed").value));
  appSeed = Number.isFinite(seed) && seed >= 1 ? seed : 1;
  appSpeech = !!($("app-speech") && $("app-speech").checked);
}

function appFillScenes() {
  const sel = $("app-scene");
  const set = $("app-set").value;
  const prev = appSceneId;
  sel.replaceChildren();
  for (let i = 0; i < SCENES.length; i++) {
    const s = SCENES[i];
    if (s.set !== set) continue;
    const o = document.createElement("option");
    o.value = s.id;
    o.textContent = s.id + " · " + s.family;
    sel.appendChild(o);
  }
  if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
}

function appFillPolicies() {
  const sel = $("app-policy");
  const set = $("app-set").value;
  const prev = appPolicy;
  sel.replaceChildren();
  for (let i = 0; i < POLICIES.length; i++) {
    const p = POLICIES[i];
    if (set === "online" && !p.online) continue;
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.label;
    o.title = p.rule;
    sel.appendChild(o);
  }
  if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
  else if ([...sel.options].some((o) => o.value === "activask")) sel.value = "activask";
}

function appFillInstr(keep) {
  const sel = $("app-instr");
  const id = $("app-scene").value;
  const prev = sel.value;
  const pool = INSTRUCTIONS[id] || [];
  sel.replaceChildren();
  const groups = {};
  for (let i = 0; i < INSTR_TYPES.length; i++) {
    const g = document.createElement("optgroup");
    g.label = INSTR_TYPES[i];
    groups[INSTR_TYPES[i]] = g;
    sel.appendChild(g);
  }
  for (let i = 0; i < pool.length; i++) {
    const ins = pool[i];
    const o = document.createElement("option");
    o.value = String(i);
    o.textContent = ins.text;
    o.title = ins.text;
    (groups[ins.type] || sel).appendChild(o);
  }
  if (keep && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
  else {
    let amb = 0;
    for (let i = 0; i < pool.length; i++) if (pool[i].type === "ambiguous") { amb = i; break; }
    sel.value = String(amb);
  }
}

function appOnForm(e) {
  if (appFilling) return;
  const t = e && e.target;
  if (t && t.id === "app-speech") {
    appSpeech = !!t.checked;
    if (appSpeech) { appSpoken = ""; appMaybeSpeak(appPending ? appPending.text : ""); }
    return;
  }
  const setNow = $("app-set").value;
  if (setNow !== appSet) {
    appFilling = true;
    appFillScenes();
    appFillPolicies();
    appFillInstr(false);
    appFilling = false;
  } else if (t && t.id === "app-scene") {
    appFilling = true;
    appFillInstr(false);
    appFilling = false;
  }
  appReadForm();
  appShowRanges();
  appRebuild();
}

function appNewTrial() {
  const set = $("app-set").value || "offline";
  const scenes = [];
  for (let i = 0; i < SCENES.length; i++) if (SCENES[i].set === set) scenes.push(SCENES[i]);
  if (!scenes.length) return;
  const r = rng(appFreshSeed());
  const scene = scenes[Math.floor(r() * scenes.length)];
  const pool = INSTRUCTIONS[scene.id] || [];
  const idx = pool.length ? Math.floor(r() * pool.length) : 0;
  const seed = (Math.floor(r() * 0x7ffffffe) + 1) >>> 0;
  appFilling = true;
  $("app-scene").value = scene.id;
  appFillInstr(false);
  $("app-instr").value = String(idx);
  $("app-seed").value = String(seed || 1);
  appFilling = false;
  appReadForm();
  appShowRanges();
  appRebuild();
}

function appBindPointer() {
  const node = renderer.domElement;
  node.addEventListener("pointerdown", (e) => { appDownX = e.clientX; appDownY = e.clientY; });
  node.addEventListener("pointerup", (e) => {
    if (mode !== "interactive" || e.button !== 0) return;
    if (Math.hypot(e.clientX - appDownX, e.clientY - appDownY) > 5) return;
    const rect = node.getBoundingClientRect();
    appPtr.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    appPtr.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    appRay.setFromCamera(appPtr, camera);
    const hits = appRay.intersectObject(MODULES.objects, true);
    for (let i = 0; i < hits.length; i++) {
      let n = hits[i].object;
      while (n && n !== MODULES.objects) {
        if (n.userData && n.userData.appId) { appChooseTarget(n.userData.appId); return; }
        n = n.parent;
      }
    }
  });
}

function appOnKey(e) {
  if (mode !== "interactive" || e.repeat) return;
  if (e.target && e.target.closest && e.target.closest("input, select, textarea")) return;
  if (e.key === "y" || e.key === "Y") { e.preventDefault(); appAnswer("yes"); }
  else if (e.key === "n" || e.key === "N") { e.preventDefault(); appAnswer("no"); }
}

function appTick(t) {
  const seg = appSegAt(t);
  if (mode === "interactive" && !appIxDone && playing && !scrubbing && seg && seg.kind === "ask") {
    setPlaying(false);
    if (t > seg.t0) seek(seg.t0);
  }
  if (seg === appLastSeg) return;
  appLastSeg = seg;
  appApplyNow(seg);
  if (mode === "auto") appSyncAuto(t);
}

function appBoot() {
  appReady = true;
  const form = $("app-form");
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("input", (e) => {
    if (e.target.id === "app-eps" || e.target.id === "app-k") appShowRanges();
  });
  form.addEventListener("change", appOnForm);
  $("app-new").addEventListener("click", appNewTrial);
  appFilling = true;
  $("app-set").value = "offline";
  appFillScenes();
  $("app-scene").value = "off-cups-01";
  appFillPolicies();
  $("app-policy").value = "activask";
  appFillInstr(false);
  $("app-eps").value = "0";
  $("app-k").value = "4";
  $("app-seed").value = "1";
  appShowRanges();
  appFilling = false;
  appReadForm();
  appBindPointer();
  document.addEventListener("keydown", appOnKey);
  TICKERS.push(appTick);
  appRebuild();
}

const appSetMode = setMode;
setMode = function (m) {
  if (appReady && mode === "interactive" && m !== "interactive") appDropPartial();
  appSetMode(m);
  if (appReady) appRebuild();
};

queueMicrotask(appBoot);
