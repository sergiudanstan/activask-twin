// Property sweep over the merged logic (SPEC §3–4): every scene x instruction x policy x seeds 1,2 through
// L.runTrial, plus a slip-free rerun ({ seed, slip: 0 }). One check per rule; failures are collected per rule
// and the first 5 are shown in the message. Also re-derives candidates with L.initialCandidates for rule 8.
export default function (L, check) {
  if (!L.SCENES || !L.INSTRUCTIONS || !L.POLICIES || !L.runTrial || !L.layoutScene || !L.initialCandidates || !L.updateState) {
    check(false, "sweep needs SCENES, INSTRUCTIONS, POLICIES, runTrial, layoutScene, initialCandidates, updateState");
    return;
  }
  const t0 = performance.now();
  const OUTCOMES = ["correct", "wrong", "unresolved", "none"];
  const WORDS = /\b(score|box|iou|threshold|candidate|id)s?\b/i;   // internal-vocabulary words (rule 6)
  const ID_TOKEN = /\b[co]\d+\b/i;                                // id-like tokens: c3, o4 (rule 6)
  const okWording = (t) => typeof t === "string" && !/\d/.test(t) && !ID_TOKEN.test(t) && !WORDS.test(t);
  const selOf = (r) => (typeof r.sel === "number" ? r.props[r.sel] : r.sel);   // Round.sel is the proposal object
  const subset = (a, b) => (a || []).every((x) => (b || []).includes(x));
  const sameSet = (a, b) => (a || []).length === (b || []).length && subset(a, b);
  const flagsOk = (p) => { const v = p && p.valid; return !!(v && v.exhaustive && v.disjoint && v.legal && v.wording); };

  const bad = { outcome: [], qcount: [], ask: [], shrink: [], selflags: [], wording: [], duptext: [], resolved: [], slipfree: [], time: [] };
  const stats = { trials: 0, reruns: 0, s0sum: 0, multi: 0, outcome: { correct: 0, wrong: 0, unresolved: 0, none: 0 } };

  for (const scene of L.SCENES) {
    const pool = L.INSTRUCTIONS[scene.id] || [];
    for (const ins of pool) {
      for (const policy of L.POLICIES) {
        for (const seed of [1, 2]) {
          const sc = L.layoutScene(scene, seed);
          const target = ins.matches[seed % ins.matches.length];
          const tr = L.runTrial(sc, ins, target, policy.id, { seed });
          stats.trials++;
          stats.s0sum += tr.S0.length;
          if (tr.S0.length >= 2) stats.multi++;
          stats.outcome[tr.outcome] = (stats.outcome[tr.outcome] || 0) + 1;
          const where = `${tr.scene} ${policy.id} s${seed} "${ins.text}"`;

          // 1 outcome vocabulary
          if (!OUTCOMES.includes(tr.outcome)) bad.outcome.push(`${where} -> ${JSON.stringify(tr.outcome)}`);
          // 2 questions == rounds and <= |S0| - 1
          if (tr.questions !== tr.rounds.length) bad.qcount.push(`${where}: q=${tr.questions} rounds=${tr.rounds.length}`);
          if (tr.S0.length >= 1 && tr.questions > tr.S0.length - 1) bad.qcount.push(`${where}: q=${tr.questions} > |S0|-1=${tr.S0.length - 1}`);
          // 3 ask behaviour per policy family
          if (!policy.clarifies && tr.questions !== 0) bad.ask.push(`${where}: ${policy.id} asked ${tr.questions}`);
          if (policy.clarifies && tr.S0.length >= 2 && tr.questions < 1) bad.ask.push(`${where}: ${policy.id} silent at |S0|=${tr.S0.length}`);
          // 4 the candidate set shrinks strictly, subset of the previous, starting from S0
          let prev = tr.S0.slice();
          for (let i = 0; i < tr.rounds.length; i++) {
            const r = tr.rounds[i];
            if (!sameSet(r.S, prev)) { bad.shrink.push(`${where} r${i}: stored state is not the tracked state`); break; }
            if (i > 0 && !(r.S.length < tr.rounds[i - 1].S.length)) { bad.shrink.push(`${where} r${i}: not strictly smaller`); break; }
            const next = L.updateState(r.S, selOf(r), r.answer);
            if (!(next.length < r.S.length) || !subset(next, r.S)) { bad.shrink.push(`${where} r${i}: update did not shrink`); break; }
            prev = next;
          }
          // 5 every selected proposal has all four valid flags
          for (let i = 0; i < tr.rounds.length; i++) {
            if (!flagsOk(selOf(tr.rounds[i]))) bad.selflags.push(`${where} r${i}`);
          }
          // 6 independent wording test on every selected question text
          for (let i = 0; i < tr.rounds.length; i++) {
            const t = selOf(tr.rounds[i]) && selOf(tr.rounds[i]).text;
            if (!okWording(t)) bad.wording.push(`${where} r${i} -> ${JSON.stringify(t)}`);
          }
          // 7 no question text asked twice in one trial
          {
            const seen = new Set();
            for (let i = 0; i < tr.rounds.length; i++) {
              const t = selOf(tr.rounds[i]) && selOf(tr.rounds[i]).text;
              if (seen.has(t)) { bad.duptext.push(`${where} r${i} -> ${JSON.stringify(t)}`); break; }
              if (t != null) seen.add(t);
            }
          }
          // 8 resolved in S0; on a correct trial it is the target's candidate
          if (tr.resolved != null && !tr.S0.includes(tr.resolved)) bad.resolved.push(`${where}: resolved ${tr.resolved} not in S0`);
          if (tr.outcome === "correct") {
            const c = L.initialCandidates(sc, ins, seed >>> 0).find((x) => x.id === tr.resolved);
            if (!c || c.obj !== target) bad.resolved.push(`${where}: correct but resolved is not the target's candidate`);
          }
          // 9 slip-free rerun: every proposal of every round valid with non-empty branches
          const tr2 = L.runTrial(sc, ins, target, policy.id, { seed, slip: 0 });
          stats.reruns++;
          for (let i = 0; i < tr2.rounds.length; i++) {
            for (const p of tr2.rounds[i].props) {
              if (!flagsOk(p)) { bad.slipfree.push(`${where} slip0 r${i}: invalid proposal ${JSON.stringify(p && p.text)}`); continue; }
              if (!p.yes.length || !p.no.length) bad.slipfree.push(`${where} slip0 r${i}: empty branch in ${JSON.stringify(p.text)}`);
            }
          }
        }
      }
    }
  }

  const ms = Math.round(performance.now() - t0);
  if (ms >= 15000) bad.time.push(`${ms} ms`);
  const msg = (list, rule) => `${rule}: ${list.length} bad${list.length ? " — " + list.slice(0, 5).join(" | ") : ""}`;
  check(bad.outcome.length === 0, msg(bad.outcome, "R1 outcome is correct|wrong|unresolved|none"));
  check(bad.qcount.length === 0, msg(bad.qcount, "R2 questions == rounds and <= |S0|-1"));
  check(bad.ask.length === 0, msg(bad.ask, "R3 non-clarifying ask 0, clarifying ask >= 1 at |S0| >= 2"));
  check(bad.shrink.length === 0, msg(bad.shrink, "R4 candidate set shrinks strictly, subset chain from S0"));
  check(bad.selflags.length === 0, msg(bad.selflags, "R5 selected proposal has all four valid flags"));
  check(bad.wording.length === 0, msg(bad.wording, "R6 selected text passes the independent wording test"));
  check(bad.duptext.length === 0, msg(bad.duptext, "R7 no question text twice in one trial"));
  check(bad.resolved.length === 0, msg(bad.resolved, "R8 resolved in S0 and correct == target's candidate"));
  check(bad.slipfree.length === 0, msg(bad.slipfree, "R9 slip-free rerun: every proposal valid, both branches non-empty"));
  check(bad.time.length === 0, `R10 sweep of ${stats.trials}+${stats.reruns} trials finished in ${ms} ms (< 15000)`);
}

export const perturbations = [
  { name: "wording validator ignores digits", find: "if (/\\d/.test(t)) return false;", replace: "if (false) return false;" },
  { name: "red colour question leaks a digit", find: 'return "Is it the " + v + " one?";', replace: 'return "Is it the " + v + " one?" + (v === "red" ? " 2" : "");' },
];
