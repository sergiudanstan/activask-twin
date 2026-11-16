// ================================================================ clarification loop (Sec. 3.4)
// VLM stand-in: enumerate visible yes/no partitions, keep K of them, validate, repair or fall back.
// ActivAsk picks the lowest EFE (Eq. 11). The update is deterministic (Eq. 4). No DOM, no three.js, no Math.random.
//
// ---------------------------------------------------------------- directVLM and vlmQ heuristics (twin stand-ins)
// TODO-SOURCE: the paper's direct pick and VLM-selected question come from MiMo-VL-7B. The twin does not run a VLM.
// directVLM — no question. Rank candidates by how many instruction modifiers the object satisfies
//   (colour, size, material, handle, lid), then by a category match, then by detector score, then by
//   earlier disp. An ambiguous instruction has no modifiers, so the rank collapses to the top score.
//   That matches the paper's near-chance direct-pick accuracy (53.70 %, tied with the top-score baseline).
// vlmQ — salience, not balance. Among the K valid proposals, prefer the most salient family and ignore G.
//   Order: colour, handle, size, material, lid, near-category, left/right, near/far. Ties keep proposal order.
//   A colour question is often a 1-versus-rest split, so vlmQ asks more than ActivAsk on the same K proposals.

// TODO-SOURCE: the paper never states a distance for "next to". 0.22 m is about two cup-diameters on this table.
const CL_NEAR_M = 0.22;
const CL_SALIENCE = ["color", "handle", "size", "material", "lid", "near", "x", "y"];
const clPropScene = new WeakMap();
let clView = null;

function clWordingOk(text) {
  if (typeof text !== "string") return false;
  const t = text.trim();
  if (!t) return false;
  if (/\d/.test(t)) return false;
  if (/\b(score|scores|iou|threshold|thresholds|box|boxes|pixel|pixels|bbox|candidate|candidates|disp)\b/i.test(t)) return false;
  if (/\b(id|ids)\b/i.test(t)) return false;
  return true;
}

function clTextForKey(key) {
  const attr = /^([a-z]+)=([a-z]+)$/.exec(key);
  if (attr) {
    const k = attr[1], v = attr[2];
    if (k === "handle" && v === "true") return "Does it have a handle?";
    if (k === "handle" && v === "false") return "Is it the one without a handle?";
    if (k === "lid" && v === "true") return "Does it have a lid?";
    if (k === "lid" && v === "false") return "Is it the one without a lid?";
    if (k === "near") return "Is it the one next to the " + v + "?";
    if (k === "color" || k === "size" || k === "material") return "Is it the " + v + " one?";
  }
  if (key.startsWith("x<")) return "Is it on the left side?";
  if (key.startsWith("x>")) return "Is it on the right side?";
  if (key.startsWith("y<")) return "Is it on the near side?";
  if (key.startsWith("y>")) return "Is it on the far side?";
  return "Is it the one on the left side?";
}

function clParsable(key) {
  return typeof key === "string" && (/^(color|size|material|handle|lid|near)=[a-z]+$/.test(key) || /^[xy][<>]-?\d+(\.\d+)?$/.test(key));
}

function clObj(id, cands, scene) {
  if (!cands || !scene) return null;
  const c = cands.find((x) => x.id === id);
  if (!c) return null;
  return scene.objects.find((o) => o.id === c.obj) || null;
}

function clIsNear(obj, cat, scene) {
  if (!obj || !scene) return false;
  let best = Infinity;
  for (const o of scene.objects) {
    if (o.id === obj.id || o.cat !== cat) continue;
    if (typeof o.x !== "number" || typeof obj.x !== "number") continue;
    const d = Math.hypot(o.x - obj.x, o.y - obj.y);
    if (d < best) best = d;
  }
  return best <= CL_NEAR_M;
}

function clEvalKey(key, obj, scene) {
  if (!obj || typeof key !== "string") return false;
  const attr = /^(color|size|material|handle|lid|near)=([a-z]+)$/.exec(key);
  if (attr) {
    if (attr[1] === "near") return clIsNear(obj, attr[2], scene || clView);
    if (attr[1] === "handle" || attr[1] === "lid") return String(!!obj[attr[1]]) === attr[2];
    return String(obj[attr[1]]) === attr[2];
  }
  const cmp = /^([xy])([<>])(-?\d+(?:\.\d+)?)$/.exec(key);
  if (!cmp || typeof obj[cmp[1]] !== "number") return false;
  const v = obj[cmp[1]], t = parseFloat(cmp[3]);
  return cmp[2] === "<" ? v < t : v > t;
}

// Eq. 3. exhaustive: Y ∪ N = S. disjoint: no id repeated (within a branch or across). legal: no foreign id.
// wording: visible properties only — no ids, digits, scores, boxes, thresholds, IoU.
function validateProp(p, S) {
  const yes = p && Array.isArray(p.yes) ? p.yes : [];
  const no = p && Array.isArray(p.no) ? p.no : [];
  const Sset = new Set(S || []);
  const seen = new Set();
  let duplicated = false, foreign = false;
  for (const id of yes.concat(no)) {
    if (!Sset.has(id)) foreign = true;
    if (seen.has(id)) duplicated = true;
    seen.add(id);
  }
  let dropped = false;
  for (const id of Sset) if (!seen.has(id)) dropped = true;
  return { exhaustive: !dropped, disjoint: !duplicated, legal: !foreign, wording: clWordingOk(p && p.text) };
}

function clFlagsOk(v) { return !!(v && v.exhaustive && v.disjoint && v.legal && v.wording); }

// Eq. 11. p_yes = |Y|/|S|, p_no = |N|/|S|, G = Σ p ln p, zero-mass terms omitted. Natural log. Lower is better.
function efe(p, S) {
  const n = S ? S.length : 0;
  if (!n) return 0;
  const set = new Set(S);
  const ys = new Set(), ns = new Set();
  for (const id of (p && p.yes) || []) if (set.has(id)) ys.add(id);
  for (const id of (p && p.no) || []) if (set.has(id)) ns.add(id);
  const py = ys.size / n, pn = ns.size / n;
  let G = 0;
  if (py > 0) G += py * Math.log(py);
  if (pn > 0) G += pn * Math.log(pn);
  return G;
}

function clAnnotate(p, S, scene) {
  const yes = p.yes.slice(), no = p.no.slice();
  const prop = {
    text: p.text, yes, no, key: p.key,
    count: { total: S.length, yes: yes.length, no: no.length },
    valid: { exhaustive: false, disjoint: false, legal: false, wording: false },
    G: 0, vlmPick: false,
  };
  prop.valid = validateProp(prop, S);
  prop.G = efe(prop, S);
  if (scene) clPropScene.set(prop, scene);
  return prop;
}

// The key decides the branch. A dropped id, a duplicate, or a leaked id in the text is rewritten from the key.
// Returns null when the key is missing or does not split S (the slip is then not unambiguous).
function repairProp(p, S, cands, scene) {
  if (!p || !clParsable(p.key)) return null;
  const yes = [], no = [];
  for (const id of S) {
    const o = clObj(id, cands, scene);
    if (!o) return null;
    if (clEvalKey(p.key, o, scene)) yes.push(id); else no.push(id);
  }
  if (!yes.length || !no.length) return null;
  const text = clTextForKey(p.key);
  if (!clWordingOk(text)) return null;
  return clAnnotate({ text, yes, no, key: p.key }, S, scene);
}

function clSig(yes, no) {
  const a = yes.slice().sort().join(","), b = no.slice().sort().join(",");
  return a < b ? a + "/" + b : b + "/" + a;
}

function clFmt(t) {
  const s = (Math.round(t * 1e6) / 1e6).toString();
  return s === "-0" ? "0" : s;
}

// One split on this axis: the gap closest to the median, so 6 → 3|3, 5 → 2|3, 4 → 2|2, 3 → 1|2.
function clAxisSplit(S, cands, scene, axis) {
  const rows = [];
  for (const id of S) {
    const o = clObj(id, cands, scene);
    if (!o || typeof o[axis] !== "number") return null;
    rows.push({ id, v: o[axis] });
  }
  rows.sort((a, b) => a.v - b.v || (a.id < b.id ? -1 : 1));
  const want = Math.floor(rows.length / 2);
  let bestI = -1, bestDist = Infinity;
  for (let i = 0; i < rows.length - 1; i++) {
    if (!(rows[i + 1].v > rows[i].v)) continue;
    const dist = Math.abs(i + 1 - want);
    if (dist < bestDist) { bestDist = dist; bestI = i; }
  }
  if (bestI < 0) return null;
  const key = axis + "<" + clFmt((rows[bestI].v + rows[bestI + 1].v) / 2);
  const yes = [], no = [];
  for (const id of S) {
    const o = clObj(id, cands, scene);
    if (clEvalKey(key, o, scene)) yes.push(id); else no.push(id);
  }
  if (!yes.length || !no.length) return null;
  return { key, yes, no, text: clTextForKey(key) };
}

function clPushAttrs(raw, S, cands, scene) {
  const attrs = ["color", "size", "material", "handle", "lid"];
  for (const attr of attrs) {
    const groups = new Map();
    for (const id of S) {
      const o = clObj(id, cands, scene);
      if (!o || o[attr] == null) continue;
      const val = String(o[attr]);
      if (!groups.has(val)) groups.set(val, []);
      groups.get(val).push(id);
    }
    for (const [val, ids] of groups) {
      if ((attr === "handle" || attr === "lid") && val !== "true") continue;
      if (!ids.length || ids.length === S.length) continue;
      const yesSet = new Set(ids);
      const yes = [], no = [];
      for (const id of S) (yesSet.has(id) ? yes : no).push(id);
      if (!yes.length || !no.length) continue;
      const key = attr + "=" + val;
      raw.push({ key, yes, no, text: clTextForKey(key) });
    }
  }
}

function clPushNear(raw, S, cands, scene) {
  if (!scene) return;
  const cats = [];
  for (const o of scene.objects) if (!cats.includes(o.cat)) cats.push(o.cat);
  for (const cat of cats) {
    const yes = [], no = [];
    for (const id of S) {
      const o = clObj(id, cands, scene);
      if (clIsNear(o, cat, scene)) yes.push(id); else no.push(id);
    }
    if (!yes.length || !no.length) continue;
    const key = "near=" + cat;
    raw.push({ key, yes, no, text: clTextForKey(key) });
  }
}

// Deterministic pool. Complement partitions (yes/no swapped) collapse to one question.
function clEnumerate(S, cands, scene) {
  const raw = [];
  clPushAttrs(raw, S, cands, scene);
  const xs = clAxisSplit(S, cands, scene, "x");
  if (xs) raw.push(xs);
  const ys = clAxisSplit(S, cands, scene, "y");
  if (ys) raw.push(ys);
  clPushNear(raw, S, cands, scene);
  raw.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const seen = new Set(), out = [];
  for (const p of raw) {
    const sig = clSig(p.yes, p.no);
    if (seen.has(sig)) continue;
    seen.add(sig);
    out.push(p);
  }
  return out;
}

function clImb(p) { return Math.abs(p.yes.length - p.no.length); }

function clSample(pool, K, r) {
  const n = Math.min(K, pool.length);
  const arr = pool.slice();
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(r() * (arr.length - i));
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr.slice(0, n);
}

// TODO-SOURCE: the paper says the VLM proposes K questions; it does not say how they are distributed. The twin
// draws K distinct partitions uniformly from the enumerated pool (simulated VLM diversity). ActivAsk chooses only
// inside the K it is shown, so a larger K raises the chance of a balanced split (paper Sec. 5.3: the mean minimum
// EFE falls as K grows). An earlier version swapped the most balanced partition into every draw; that made K
// irrelevant (flat K sweep) and changed ActivAsk's questions on asked trials by only 0.007, so it was removed.
function clSlip(p, S, r) {
  const kind = Math.floor(r() * 3);
  if (kind === 0 && S.length) {
    const id = S[Math.floor(r() * S.length)];
    return { text: p.text, key: p.key, yes: p.yes.filter((x) => x !== id), no: p.no.filter((x) => x !== id) };
  }
  if (kind === 1 && p.yes.length) {
    const id = p.yes[Math.floor(r() * p.yes.length)];
    return { text: p.text, key: p.key, yes: [id].concat(p.yes), no: p.no.slice() };
  }
  return { text: "Is it " + (S[0] || "c1") + "?", key: p.key, yes: p.yes.slice(), no: p.no.slice() };
}

// K proposals drawn with rng. history lists the keys AND texts already asked: an asked partition is not offered
// again, and a new partition whose wording was already used (two split points both read "Is it on the near
// side?") is reworded relative to the remaining candidates ("Of the ones left, ..."), so the dialogue never
// repeats a question (Sec. 3.4.1: dialogue history avoids repeating answered questions).
// slip (default 0 here; runTrial defaults to 0.05) drops a candidate, duplicates one, or leaks an id, then repairs.
function proposeQuestions(S, cands, scene, history, opts) {
  const opt = opts || {};
  const K = opt.K == null ? PARAMS.K : opt.K;
  const seed = opt.seed == null ? 1 : opt.seed;
  const slip = opt.slip == null ? 0 : opt.slip;
  clView = scene || null;
  if (!S || S.length < 2) return [];
  const hist = new Set(history || []);
  const pool = clEnumerate(S, cands, scene).filter((p) => !hist.has(p.key));
  if (!pool.length) return [];
  const r = rng((seed >>> 0) || 1);
  const chosen = clSample(pool, K, r);
  const built = [];
  for (const raw of chosen) {
    const damaged = slip > 0 && r() < slip ? clSlip(raw, S, r) : raw;
    const flags = validateProp(damaged, S);
    if (clFlagsOk(flags)) built.push(clAnnotate(damaged, S, scene));
    else built.push(repairProp(damaged, S, cands, scene) || fallbackProp(S, cands, scene));
  }
  for (const p of built) if (hist.has(p.text)) p.text = "Of the ones left, " + p.text.charAt(0).toLowerCase() + p.text.slice(1);
  const fresh = built.filter((p) => !hist.has(p.text));
  built.length = 0; built.push(...fresh);
  built.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const pref = clVlmPreferred(built);
  for (const p of built) p.vlmPick = p === pref;
  return built;
}

// Rule fallback from labels and positions: the most balanced enumerated predicate. Always a valid partition
// when |S| >= 2 and some visible property or coordinate differs. Identical objects split 1 vs rest so the
// four validity flags still hold (the key is then only a label, not a truthful cut).
function fallbackProp(S, cands, scene) {
  const pool = S && S.length ? clEnumerate(S, cands, scene) : [];
  if (pool.length) {
    let best = pool[0];
    for (const p of pool) {
      if (clImb(p) < clImb(best) || (clImb(p) === clImb(best) && p.key < best.key)) best = p;
    }
    return clAnnotate(best, S, scene);
  }
  const yes = S && S.length ? [S[0]] : [];
  const no = S && S.length > 1 ? S.slice(1) : [];
  const text = "Is it the one on the left side?";
  return clAnnotate({ text, yes, no, key: "x<0" }, S || [], scene);
}

// Eq. 4. S ← Y on yes, S ← N on no. Ids that were not in S are not reintroduced.
function updateState(S, p, answer) {
  const branch = answer === "yes" ? p.yes : p.no;
  const keep = new Set(branch || []);
  return (S || []).filter((id) => keep.has(id));
}

function clFamily(key) {
  if (typeof key !== "string") return "";
  if (key.startsWith("near=")) return "near";
  if (key.startsWith("x<") || key.startsWith("x>")) return "x";
  if (key.startsWith("y<") || key.startsWith("y>")) return "y";
  const eq = key.indexOf("=");
  return eq < 0 ? key : key.slice(0, eq);
}

function clVlmPreferred(pool) {
  let best = pool[0], bestRank = 1000;
  for (const p of pool) {
    const rank = CL_SALIENCE.indexOf(clFamily(p.key));
    const r = rank < 0 ? 500 : rank;
    if (r < bestRank) { best = p; bestRank = r; }
  }
  return best;
}

function selectProp(policy, props, seed) {
  const id = typeof policy === "string" ? policy : (policy && policy.id);
  const list = Array.isArray(props) ? props : [];
  const valid = list.filter((p) => clFlagsOk(p && p.valid));
  const pool = valid.length ? valid : list;
  if (!pool.length || !id) return null;
  if (id === "firstQ") return pool[0];
  if (id === "randomQ") {
    const r = rng((seed >>> 0) || 1);
    return pool[Math.floor(r() * pool.length)];
  }
  if (id === "vlmQ") return clVlmPreferred(pool);
  if (id === "activask") {
    let best = pool[0];
    for (const p of pool) if (p.G < best.G) best = p;
    return best;
  }
  return null;
}

// Truthful answer from the intended object (even when perception missed it). With probability eps, flip.
function operatorAnswer(p, targetObj, eps, r) {
  const scene = (p && clPropScene.get(p)) || clView;
  let ans = clEvalKey(p && p.key, targetObj, scene) ? "yes" : "no";
  if (typeof eps === "number" && eps > 0 && typeof r === "function" && r() < eps) ans = ans === "yes" ? "no" : "yes";
  return ans;
}

function clTupleGreater(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

function clDirectPick(cands, scene, instr) {
  const mods = (instr && instr.mods) || {};
  const keys = Object.keys(mods).filter((k) => mods[k] != null);
  let best = null, bestTuple = null;
  for (const c of cands) {
    const o = scene.objects.find((x) => x.id === c.obj);
    let hit = 0;
    for (const k of keys) if (o && o[k] === mods[k]) hit++;
    const tuple = [hit, o && o.cat === instr.noun ? 1 : 0, c.score, -c.disp];
    if (!best || clTupleGreater(tuple, bestTuple)) { best = c; bestTuple = tuple; }
  }
  return best ? best.id : null;
}

function clJudge(candId, byId, targetObjId) {
  if (!candId) return "none";
  const c = byId.get(candId);
  return c && c.obj === targetObjId ? "correct" : "wrong";
}

// Trial (SPEC §2). policy is an id or a POLICIES entry. Defaults: eps 0, K 4, slip 0.05.
// outcome "none" when S0 is empty; "unresolved" when the loop empties S or cannot split further;
// "correct" / "wrong" once one candidate remains (or a non-clarifying policy has picked one).
function runTrial(scene, instr, targetObjId, policy, opts) {
  const opt = opts || {};
  const seed = opt.seed == null ? 1 : opt.seed;
  const eps = opt.eps == null ? 0 : opt.eps;
  const K = opt.K == null ? PARAMS.K : opt.K;
  const slip = opt.slip == null ? 0.05 : opt.slip;
  const policyId = typeof policy === "string" ? policy : policy.id;
  const placed = scene.objects.length && scene.objects.every((o) => typeof o.x === "number" && typeof o.y === "number")
    ? scene : layoutScene(scene, seed);
  clView = placed;
  const cands = initialCandidates(placed, instr, seed >>> 0);
  const byId = new Map(cands.map((c) => [c.id, c]));
  const S0 = cands.map((c) => c.id);
  const targetObj = placed.objects.find((o) => o.id === targetObjId) || null;
  const info = POLICIES.find((p) => p.id === policyId);
  const clarifies = !!(info && info.clarifies);
  const trial = { scene: placed.id, instr: instr.text, target: targetObjId, policy: policyId, eps, S0, rounds: [] };
  if (!S0.length) return { ...trial, resolved: null, outcome: "none", questions: 0 };
  if (!clarifies) {
    let resolved;
    if (policyId === "random") {
      const r = rng(((seed + 0x6d2b79f5) >>> 0) || 1);
      resolved = S0[Math.floor(r() * S0.length)];
    } else if (policyId === "directVLM") resolved = clDirectPick(cands, placed, instr);
    else {
      let top = cands[0];
      for (const c of cands) if (c.score > top.score || (c.score === top.score && c.disp < top.disp)) top = c;
      resolved = top.id;
    }
    return { ...trial, resolved, outcome: clJudge(resolved, byId, targetObjId), questions: 0 };
  }
  const noise = rng(((seed ^ 0x51ed) >>> 0) || 1);
  let S = S0.slice();
  const rounds = [], history = [];
  let guard = 0;
  while (S.length > 1 && guard < 24) {
    guard++;
    const roundSeed = (seed + guard * 0x9e3779b1) >>> 0;
    const props = proposeQuestions(S, cands, placed, history, { K, seed: roundSeed || 1, slip });
    if (!props.length) break;
    const sel = selectProp(policyId, props, roundSeed || 1);
    if (!sel) break;
    const answer = operatorAnswer(sel, targetObj, eps, noise);
    rounds.push({ S: S.slice(), props, sel, answer });
    history.push(sel.key, sel.text);
    S = updateState(S, sel, answer);
  }
  const resolved = S.length === 1 ? S[0] : null;
  const outcome = S.length === 1 ? clJudge(resolved, byId, targetObjId) : "unresolved";
  return { ...trial, rounds, resolved, outcome, questions: rounds.length };
}

Object.assign(LOGIC, {
  proposeQuestions, validateProp, repairProp, fallbackProp, efe, updateState, selectProp, operatorAnswer, runTrial,
});
