// Clarification (14-clarify.js): validation, repair, EFE, update, policies, the trial loop.
export default function (L, check) {
  const ln2 = Math.log(2);
  const S4 = ["c1", "c2", "c3", "c4"];
  const p22 = { yes: ["c1", "c2"], no: ["c3", "c4"] };
  const p13 = { yes: ["c1"], no: ["c2", "c3", "c4"] };
  check(Math.abs(L.efe(p22, S4) - (-ln2)) < 1e-9, "efe 2|2 of 4 = −ln 2");
  check(Math.abs(L.efe(p13, S4) - (-0.5623)) < 1e-4, "efe 1|3 = −0.5623");
  check(Math.abs(L.efe({ yes: ["c1"], no: ["c2"] }, ["c1", "c2"]) - (-ln2)) < 1e-9, "efe 1|1 = −ln 2");
  check(Math.abs(L.efe({ yes: ["c1", "c2", "c3"], no: ["c4", "c5", "c6"] }, ["c1", "c2", "c3", "c4", "c5", "c6"]) - (-ln2)) < 1e-9, "efe 3|3 = −ln 2");
  check(L.efe(p22, S4) < L.efe(p13, S4), "a balanced split has lower G");

  const good = { text: "Is it the orange one?", yes: ["c1", "c2"], no: ["c3", "c4"], key: "color=orange" };
  const g = L.validateProp(good, S4);
  check(g.exhaustive && g.disjoint && g.legal && g.wording, "a clean partition is valid");
  const dropped = L.validateProp({ ...good, yes: ["c1"] }, S4);
  check(!dropped.exhaustive && dropped.disjoint && dropped.legal && dropped.wording, "a dropped candidate fails exhaustive");
  const duplicated = L.validateProp({ ...good, yes: ["c1", "c1", "c2"] }, S4);
  check(!duplicated.disjoint && duplicated.exhaustive && duplicated.legal, "a duplicated candidate fails disjoint");
  const foreign = L.validateProp({ ...good, no: ["c3", "c4", "c9"] }, S4);
  check(!foreign.legal && foreign.exhaustive && foreign.wording, "a foreign candidate fails legal");
  const leaked = L.validateProp({ ...good, text: "Is it c2?" }, S4);
  check(!leaked.wording && leaked.exhaustive && leaked.disjoint && leaked.legal, "an id-leaking text fails wording");

  const colors = ["black", "green", "orange", "red", "white", "yellow"];
  const objects = colors.map((color, i) => ({
    id: "o" + (i + 1), cat: "cup", color, size: i < 3 ? "large" : "small", material: "ceramic",
    handle: i < 3, lid: false, x: -0.40 + i * 0.16, y: 0, yaw: 0,
  }));
  const scene = { id: "syn-6", set: "offline", family: "cups", objects };
  const cands = objects.map((o, i) => ({ id: "c" + (i + 1), disp: i + 1, obj: o.id, label: "cup", score: 0.8 - i * 0.01, box: [0, 0, 10, 10] }));
  const S0 = cands.map((c) => c.id);
  const instr = { text: "pick up my cup", type: "ambiguous", noun: "cup", mods: {}, matches: objects.map((o) => o.id) };

  const yesO = cands.filter((c) => objects.find((o) => o.id === c.obj).color === "orange").map((c) => c.id);
  const noO = S0.filter((id) => !yesO.includes(id));
  const slip = { text: "Is it c1?", key: "color=orange", yes: yesO.slice(1), no: noO };
  const fixed = L.repairProp(slip, S0, cands, scene);
  const fv = L.validateProp(fixed, S0);
  check(fixed && fv.exhaustive && fv.disjoint && fv.legal && fv.wording && fixed.text === "Is it the orange one?" && fixed.yes.length === 1,
    "repair puts a dropped candidate back and strips the leaked id");
  const dup = { text: "Is it the orange one?", key: "color=orange", yes: yesO.concat(yesO), no: noO };
  const fixedDup = L.repairProp(dup, S0, cands, scene);
  check(L.validateProp(fixedDup, S0).disjoint && fixedDup.yes.length === 1, "repair collapses a duplicated candidate");

  const fb = L.fallbackProp(S0, cands, scene);
  const fbv = L.validateProp(fb, S0);
  check(fbv.exhaustive && fbv.disjoint && fbv.legal && fbv.wording && !/\d/.test(fb.text), "fallback on six candidates is valid");
  const fb1 = L.fallbackProp([S0[0]], cands, scene);
  const fb1v = L.validateProp(fb1, [S0[0]]);
  check(fb1v.exhaustive && fb1v.disjoint && fb1v.legal && fb1v.wording, "fallback on one candidate is valid");

  check(L.updateState(S4, p22, "yes").join() === "c1,c2", "yes keeps the yes branch");
  check(L.updateState(S4, p22, "no").join() === "c3,c4", "no keeps the no branch");
  const back = L.updateState(["c1", "c2"], { yes: ["c1", "c3", "c9"], no: ["c2"] }, "yes");
  check(back.join() === "c1", "updateState returns a subset and never reintroduces candidates");

  const hand = (key, yes, no, text) => {
    const p = { key, yes, no, text, vlmPick: false, count: { total: S4.length, yes: yes.length, no: no.length }, valid: { exhaustive: true, disjoint: true, legal: true, wording: true } };
    p.G = L.efe(p, S4);
    return p;
  };
  const unbalanced = hand("color=orange", ["c1"], ["c2", "c3", "c4"], "Is it the orange one?");
  const balanced = hand("x<0", ["c1", "c2"], ["c3", "c4"], "Is it on the left side?");
  const offered = [unbalanced, balanced];
  check(L.selectProp("activask", offered, 1).key === "x<0", "activask takes the lower G, ties aside");
  check(L.selectProp("firstQ", offered, 1).key === "color=orange", "firstQ takes the first proposal");
  check(L.selectProp("vlmQ", offered, 1).key === "color=orange", "vlmQ prefers colour over a balanced spatial split");
  const rnd = L.selectProp("randomQ", offered, 1);
  check(offered.includes(rnd), "randomQ returns one of the proposals");

  const round1 = L.proposeQuestions(S0, cands, scene, [], { K: 4, seed: 2, slip: 0 });
  check(round1.length === 4 && round1.every((p) => p.valid.exhaustive && p.valid.disjoint && p.valid.legal && p.valid.wording && !/\d/.test(p.text)),
    "proposals are natural valid questions with no digits");
  check(round1.some((p) => p.text === "Is it the orange one?" || p.text === "Does it have a handle?" || p.text === "Is it on the left side?"),
    "question text is about colour, a handle, or the left side");
  const again = L.proposeQuestions(S0, cands, scene, round1.map((p) => p.key), { K: 4, seed: 3, slip: 0 });
  check(again.length > 0 && again.every((p) => !round1.some((q) => q.key === p.key)), "history stops a question from being asked twice");
  const messy = L.proposeQuestions(S0, cands, scene, [], { K: 4, seed: 5, slip: 1 });
  check(messy.every((p) => p.valid.exhaustive && p.valid.disjoint && p.valid.legal && p.valid.wording), "every slipped proposal is repaired or replaced");

  function drive(policy, target, seed0) {
    let S = S0.slice();
    const hist = [];
    let q = 0;
    while (S.length > 1) {
      const props = L.proposeQuestions(S, cands, scene, hist, { K: 4, seed: seed0 + q * 97, slip: 0 });
      if (!props.length) return -1;
      const opt = S.length % 2 === 0 ? 0 : 1;
      if (Math.min(...props.map((p) => Math.abs(p.count.yes - p.count.no))) > opt) return -1;
      const sel = L.selectProp(policy, props, seed0 + q * 13);
      const ans = L.operatorAnswer(sel, target, 0, () => 0);
      hist.push(sel.key);
      const next = L.updateState(S, sel, ans);
      if (next.length >= S.length || next.some((id) => !S.includes(id))) return -2;
      S = next;
      q++;
      if (q > 12) return -3;
    }
    return q;
  }
  let sumA = 0, sumF = 0, sumR = 0, nQ = 0, bad = 0;
  for (let seed = 1; seed <= 30; seed++) {
    for (const o of objects) {
      const a = drive("activask", o, seed);
      const f = drive("firstQ", o, seed);
      const r = drive("randomQ", o, seed);
      if (a < 0 || f < 0 || r < 0) bad++;
      else { sumA += a; sumF += f; sumR += r; nQ++; }
    }
  }
  const mA = sumA / nQ, mF = sumF / nQ, mR = sumR / nQ;
  check(nQ >= 20, "enough six-candidate drives (" + nQ + " of 180, need 20) offer a balanced proposal in every round to compare with the ideal (K = 4 is a uniform draw, so not all do)");
  check(Math.abs(mA - 2.6666666667) < 0.1, "ActivAsk mean questions " + mA.toFixed(3) + " within 0.1 of the ideal 2.667");
  check(mA < mF && mA < mR, "ActivAsk " + mA.toFixed(3) + " is below firstQ " + mF.toFixed(3) + " and randomQ " + mR.toFixed(3));

  const clarifying = ["firstQ", "randomQ", "vlmQ", "activask"];
  const stats = {};
  for (const p of clarifying.concat(["top", "random"])) stats[p] = { ok: 0, n: 0 };
  let chance = 0, kept = 0, seed = 1, guard = 0;
  while (kept < 500 && guard < 5000) {
    guard++;
    const target = objects[(seed - 1) % 6];
    const cs = L.initialCandidates(scene, instr, seed);
    seed++;
    if (!cs.some((c) => c.obj === target.id)) continue;
    kept++;
    chance += 1 / cs.length;
    for (const policy of Object.keys(stats)) {
      const t = L.runTrial(scene, instr, target.id, policy, { seed: seed - 1, eps: 0 });
      stats[policy].n++;
      if (t.outcome === "correct") stats[policy].ok++;
      if (policy === "activask" && kept === 1) {
        check(t.rounds.every((r) => r.S.length > 1) && t.questions === t.rounds.length, "the loop stops at |S| ≤ 1");
      }
    }
  }
  check(kept === 500, "500 trials with the target inside S0");
  for (const policy of clarifying) {
    check(stats[policy].ok === 500, policy + " resolves the correct target in 500 trials (" + stats[policy].ok + "/500)");
  }
  const topAcc = stats.top.ok / 500, rndAcc = stats.random.ok / 500, chanceAcc = chance / 500;
  check(Math.abs(topAcc - chanceAcc) < 0.08 && Math.abs(rndAcc - chanceAcc) < 0.08 && topAcc < 0.45 && rndAcc < 0.45,
    "top " + topAcc.toFixed(3) + " and random " + rndAcc.toFixed(3) + " sit near chance " + chanceAcc.toFixed(3));

  let ok0 = 0, ok2 = 0;
  const N = 200;
  for (let s = 1; s <= N; s++) {
    const target = objects[(s - 1) % 6].id;
    if (L.runTrial(scene, instr, target, "activask", { seed: s, eps: 0, slip: 0 }).outcome === "correct") ok0++;
    if (L.runTrial(scene, instr, target, "activask", { seed: s, eps: 0.2, slip: 0 }).outcome === "correct") ok2++;
  }
  check(ok2 < ok0, "eps 0.2 lowers ActivAsk accuracy (" + ok2 + "/" + N + " vs " + ok0 + "/" + N + ")");

  const d1 = L.runTrial(scene, instr, "o3", "activask", { seed: 42, eps: 0.2, slip: 0.05 });
  const d2 = L.runTrial(scene, instr, "o3", "activask", { seed: 42, eps: 0.2, slip: 0.05 });
  const d3 = L.runTrial(scene, instr, "o3", "randomQ", { seed: 42, eps: 0.2, slip: 0.05 });
  check(JSON.stringify(d1) === JSON.stringify(d2), "runTrial is deterministic per seed");
  check(JSON.stringify(d1) !== JSON.stringify(d3), "policy changes the trial");
  check(d1.questions === d1.rounds.length && typeof d1.outcome === "string" && Array.isArray(d1.S0), "trial carries S0, rounds and an outcome");
}

export const perturbations = [
  { name: "natural log replaced by log2", find: "py * Math.log(py)", replace: "py * Math.log2(py)" },
  { name: "argmin G replaced by argmax", find: "if (p.G < best.G) best = p;", replace: "if (p.G > best.G) best = p;" },
  { name: "yes and no branches swapped", find: "answer === \"yes\" ? p.yes : p.no", replace: "answer === \"yes\" ? p.no : p.yes" },
];
