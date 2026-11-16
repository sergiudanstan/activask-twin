// ================================================================ experiments (Sec. 4) — twin (simulated)
// Offline: 36 scenes, 216 trials per policy, types cycling clear → partial → ambiguous, scenes round-robin.
// Online: 20 scenes, 57 trials per policy (19 per type), the four online policies, then a simulated grasp.
// A wrong, unresolved or empty target is not executed (operator verification). An executed grasp succeeds
// with PAPER.graspByCat, drawn with rng. Every number this module produces is twin (simulated).
// No DOM, no three.js, no Math.random.

function exMix(seed, salt) {
  let x = (Math.imul((seed >>> 0) || 1, 0x9E3779B1) + Math.imul(salt >>> 0, 0x85EBCA6B)) >>> 0;
  x ^= x >>> 16;
  return x || 1;
}

function exRound(x) {
  return Math.round(x * 100) / 100;
}

// Wilson score interval, in percent. wilson(199, 216) is the paper's [87.76, 95.03].
function wilson(k, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = k / n;
  const z2 = z * z;
  const den = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / den;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
  const lo = Math.max(0, centre - margin) * 100;
  const hi = Math.min(1, centre + margin) * 100;
  return [exRound(lo), exRound(hi)];
}

function exPolicyIds(list) {
  const src = list && list.length ? list : POLICIES;
  return src.map((p) => (typeof p === "string" ? p : p.id));
}

function exScenes(set) {
  const out = [];
  for (const s of SCENES) if (s.set === set) out.push(s);
  return out;
}

// Trial i: type cycles clear → partial → ambiguous, scene is round-robin inside that cycle.
function exRow(scenes, seed, i) {
  const t = i % INSTR_TYPES.length;
  const k = Math.floor(i / INSTR_TYPES.length);
  const type = INSTR_TYPES[t];
  const scene = scenes[(k + t) % scenes.length];
  const r = rng(exMix(seed, i + 1));
  const pool = INSTRUCTIONS[scene.id].filter((ins) => ins.type === type);
  const instr = pool[Math.floor(r() * pool.length)];
  const target = instr.matches[Math.floor(r() * instr.matches.length)];
  return {
    scene, instr, target, type,
    layoutSeed: exMix(seed, 0x5100 + i),
    trialSeed: exMix(seed, 0x7A1100 + i),
  };
}

const exPlaced = new Map();
function exPlace(scene, seed) {
  const key = scene.id + ":" + (seed >>> 0);
  let placed = exPlaced.get(key);
  if (!placed) {
    placed = layoutScene(scene, seed >>> 0 || 1);
    exPlaced.set(key, placed);
  }
  return placed;
}

function exPlan(set, count, seed) {
  const scenes = exScenes(set);
  const rows = [];
  for (let i = 0; i < count; i++) rows.push(exRow(scenes, seed, i));
  return rows;
}

function exGrasp(trial, placed, targetId, trialSeed) {
  const executed = trial.outcome === "correct";
  let grasped = false;
  if (executed) {
    const obj = placed.objects.find((o) => o.id === targetId);
    const cat = obj ? PAPER.graspByCat[obj.cat] : null;
    const rate = cat ? cat.rate / 100 : 0;
    const g = rng(exMix(trialSeed, 0x6A09E667));
    grasped = g() < rate;
  }
  trial.executed = executed;
  trial.grasped = grasped;
  trial.grasp = executed ? (grasped ? "ok" : "fail") : "skipped";
  trial.simulated = true;
  return trial;
}

function exBlank(n) {
  return { n, correct: 0, askedN: 0, qSum: 0, qAskedSum: 0 };
}

function exFinish(row) {
  const acc = row.n ? (100 * row.correct) / row.n : 0;
  const asked = row.n ? (100 * row.askedN) / row.n : 0;
  const qAll = row.n ? row.qSum / row.n : 0;
  const qAsked = row.askedN ? row.qAskedSum / row.askedN : null;
  return {
    n: row.n, correct: row.correct, acc, ci: wilson(row.correct, row.n),
    asked, qAll, qAsked,
  };
}

// Per policy: n, correct, acc + Wilson CI, asked %, mean Q (all and asked), outcome counts,
// by instruction type, by family, mean questions by |S0| = 2..6.
// Online rows also carry attempts, grasp %, full-task %, non-executed.
function summarize(trials) {
  const groups = new Map();
  for (const t of trials || []) {
    if (!groups.has(t.policy)) groups.set(t.policy, []);
    groups.get(t.policy).push(t);
  }
  const summary = {};
  for (const [policy, list] of groups) {
    const base = exBlank(list.length);
    const outcomes = { correct: 0, wrong: 0, unresolved: 0, none: 0 };
    const byType = {};
    const byFamily = {};
    const qByS0 = {};
    for (let s = 2; s <= 6; s++) qByS0[s] = { n: 0, qSum: 0 };
    let s0 = 0, multi = 0, attempts = 0, grasped = 0, online = false;
    for (const t of list) {
      const n0 = t.S0 ? t.S0.length : 0;
      s0 += n0;
      if (n0 > 1) multi++;
      if (outcomes[t.outcome] != null) outcomes[t.outcome]++;
      base.correct += t.outcome === "correct" ? 1 : 0;
      base.qSum += t.questions || 0;
      if ((t.questions || 0) > 0) { base.askedN++; base.qAskedSum += t.questions; }
      const type = t.type || "clear";
      const fam = t.family || "mixed";
      if (!byType[type]) byType[type] = exBlank(0);
      if (!byFamily[fam]) byFamily[fam] = exBlank(0);
      for (const bucket of [byType[type], byFamily[fam]]) {
        bucket.n++;
        bucket.correct += t.outcome === "correct" ? 1 : 0;
        bucket.qSum += t.questions || 0;
        if ((t.questions || 0) > 0) { bucket.askedN++; bucket.qAskedSum += t.questions; }
      }
      if (n0 >= 2 && n0 <= 6) { qByS0[n0].n++; qByS0[n0].qSum += t.questions || 0; }
      if (t.executed != null) {
        online = true;
        if (t.executed) attempts++;
        if (t.grasped) grasped++;
      }
    }
    const done = exFinish(base);
    const typeOut = {};
    for (const key of Object.keys(byType)) typeOut[key] = exFinish(byType[key]);
    const famOut = {};
    for (const key of Object.keys(byFamily)) famOut[key] = exFinish(byFamily[key]);
    const qOut = {};
    for (let s = 2; s <= 6; s++) qOut[s] = { n: qByS0[s].n, q: qByS0[s].n ? qByS0[s].qSum / qByS0[s].n : null };
    summary[policy] = {
      ...done, outcomes, byType: typeOut, byFamily: famOut, qByS0: qOut,
      meanS0: list.length ? s0 / list.length : 0,
      multi: list.length ? (100 * multi) / list.length : 0,
      simulated: true,
    };
    if (online) {
      summary[policy].attempts = attempts;
      summary[policy].nonExec = list.length - attempts;
      summary[policy].grasp = attempts ? (100 * grasped) / attempts : 0;
      summary[policy].graspCi = wilson(grasped, attempts);
      summary[policy].full = list.length ? (100 * grasped) / list.length : 0;
      summary[policy].fullCi = wilson(grasped, list.length);
    }
  }
  return summary;
}

// One schedule shared by every policy, so the methods are paired on scene, instruction, target and S0.
function runBatch(opts) {
  const opt = opts || {};
  const set = opt.set === "online" ? "online" : "offline";
  const seed = opt.seed == null ? 1 : opt.seed;
  const eps = opt.eps == null ? 0 : opt.eps;
  const K = opt.K == null ? PARAMS.K : opt.K;
  const slip = opt.slip == null ? 0.05 : opt.slip;
  const count = opt.perPolicy == null ? (set === "online" ? 57 : 216) : opt.perPolicy;
  const policies = exPolicyIds(opt.policies || (set === "online" ? POLICIES.filter((p) => p.online) : POLICIES));
  const plan = exPlan(set, count, seed >>> 0 || 1);
  const trials = [];
  for (const policy of policies) {
    for (let i = 0; i < plan.length; i++) {
      const row = plan[i];
      const placed = exPlace(row.scene, row.layoutSeed);
      const trial = runTrial(placed, row.instr, row.target, policy, {
        seed: row.trialSeed, eps, K, slip,
      });
      trial.type = row.type;
      trial.family = row.scene.family;
      if (set === "online") exGrasp(trial, placed, row.target, row.trialSeed);
      trials.push(trial);
    }
  }
  return { trials, summary: summarize(trials), seed, set, simulated: true };
}

// Clarifying policies, conditioned on |S0| ≥ 2 and the intended target inside S0. N per policy.
function epsSweep(opts) {
  const opt = opts || {};
  const epsList = opt.eps || [0, 0.05, 0.1, 0.15, 0.2];
  const n = opt.n == null ? 98 : opt.n;
  const seed = opt.seed == null ? 1 : opt.seed;
  const set = opt.set || "offline";
  const slip = opt.slip == null ? 0.05 : opt.slip;
  const K = opt.K == null ? PARAMS.K : opt.K;
  const policies = exPolicyIds(opt.policies || ["firstQ", "randomQ", "vlmQ", "activask"]);
  const scenes = exScenes(set);
  const planSeed = exMix(seed, 0xE550);
  const specs = [];
  let i = 0;
  while (specs.length < n && i < Math.max(n * 40, 400)) {
    const row = exRow(scenes, planSeed, i);
    i++;
    const placed = exPlace(row.scene, row.layoutSeed);
    const cs = initialCandidates(placed, row.instr, row.trialSeed >>> 0);
    if (cs.length >= 2 && cs.some((c) => c.obj === row.target)) specs.push({ row, placed });
  }
  const byPolicy = {};
  for (const policy of policies) {
    byPolicy[policy] = epsList.map((eps) => {
      let correct = 0;
      for (const spec of specs) {
        const trial = runTrial(spec.placed, spec.row.instr, spec.row.target, policy, {
          seed: spec.row.trialSeed, eps, K, slip,
        });
        if (trial.outcome === "correct") correct++;
      }
      return { eps, n: specs.length, correct, acc: specs.length ? (100 * correct) / specs.length : 0, simulated: true };
    });
  }
  return { eps: epsList.slice(), n: specs.length, byPolicy, simulated: true };
}

function exMinG(round) {
  let g = 0, any = false;
  for (const p of round.props || []) {
    if (typeof p.G !== "number") continue;
    if (!any || p.G < g) { g = p.G; any = true; }
  }
  return any ? g : null;
}

// Mean minimum proposal G per round, for ambiguous and partial instructions, at each K.
function kSweep(opts) {
  const opt = opts || {};
  const Ks = opt.K || [1, 2, 3, 4, 5];
  const seed = opt.seed == null ? 1 : opt.seed;
  const slip = opt.slip == null ? 0.05 : opt.slip;
  const perType = opt.perType == null ? 72 : opt.perType;
  const plan = exPlan("offline", perType * 3, seed >>> 0 || 1).filter((row) => row.type !== "clear");
  const ambiguous = [];
  const partial = [];
  const rounds = { ambiguous: [], partial: [] };
  for (const K of Ks) {
    const sum = { ambiguous: 0, partial: 0 };
    const cnt = { ambiguous: 0, partial: 0 };
    for (const row of plan) {
      const placed = exPlace(row.scene, row.layoutSeed);
      const trial = runTrial(placed, row.instr, row.target, "activask", {
        seed: row.trialSeed, eps: 0, K, slip,
      });
      for (const round of trial.rounds) {
        const g = exMinG(round);
        if (g == null) continue;
        sum[row.type] += g;
        cnt[row.type]++;
      }
    }
    ambiguous.push(cnt.ambiguous ? sum.ambiguous / cnt.ambiguous : null);
    partial.push(cnt.partial ? sum.partial / cnt.partial : null);
    rounds.ambiguous.push(cnt.ambiguous);
    rounds.partial.push(cnt.partial);
  }
  return { K: Ks.slice(), ambiguous, partial, rounds, simulated: true };
}

Object.assign(LOGIC, { runBatch, wilson, summarize, epsSweep, kSweep });
