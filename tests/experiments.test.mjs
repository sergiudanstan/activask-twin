// Experiments (15-experiments.js): Wilson CI, offline/online protocol, perception calibration, grasp stage.
export default function (L, check) {
  const w = L.wilson(199, 216);
  check(w.length === 2 && w[0] === 87.76 && w[1] === 95.03, "wilson(199, 216) is [" + w.join(", ") + "] (paper CI 87.76, 95.03)");
  const wTop = L.wilson(116, 216);
  check(wTop[0] === 47.05 && wTop[1] === 60.23, "wilson(116, 216) matches the paper top-score CI");
  check(L.wilson(0, 0)[0] === 0 && L.wilson(0, 0)[1] === 0, "wilson(0, 0) is defined");

  const t0 = Date.now();
  const batch = L.runBatch({ set: "offline", seed: 11 });
  const ms = Date.now() - t0;
  check(ms < 1000, "offline batch of 7×216 trials in " + ms + " ms");
  check(batch.trials.length === 7 * 216 && batch.simulated === true, "offline batch is 1512 simulated trials");

  const again = L.runBatch({ set: "offline", seed: 11 });
  check(JSON.stringify(batch.trials) === JSON.stringify(again.trials), "offline batch is deterministic per seed");
  const other = L.runBatch({ set: "offline", seed: 2 });
  const sig = (b) => b.trials.filter((t) => t.policy === "top").map((t) => t.scene + "|" + t.instr + "|" + t.target + "|" + t.S0.join(",")).join(";");
  check(sig(batch) !== sig(other), "a different seed draws a different offline schedule");

  const top = batch.trials.filter((t) => t.policy === "top");
  check(top.length === 216, "216 trials for the top-score policy");
  check(top[0].type === "clear" && top[1].type === "partial" && top[2].type === "ambiguous",
    "instruction type cycles clear → partial → ambiguous");
  check(top[0].scene !== top[1].scene && top[1].scene !== top[2].scene && top[0].scene !== top[2].scene,
    "scenes round-robin as the type cycles");
  const typeN = { clear: 0, partial: 0, ambiguous: 0 };
  const sceneN = {};
  for (const t of top) { typeN[t.type]++; sceneN[t.scene] = (sceneN[t.scene] || 0) + 1; }
  const sceneCounts = Object.values(sceneN);
  check(typeN.clear === 72 && typeN.partial === 72 && typeN.ambiguous === 72, "72 trials of each instruction type");
  check(sceneCounts.length === 36 && sceneCounts.every((n) => n === 6), "every offline scene is used 6 times");
  for (const id of ["top", "random", "directVLM", "firstQ", "randomQ", "vlmQ", "activask"]) {
    check(batch.summary[id] && batch.summary[id].n === 216, id + " is summarised over 216 trials");
  }

  const act = batch.summary.activask;
  check(act.ci[0] === L.wilson(act.correct, act.n)[0] && act.ci[1] === L.wilson(act.correct, act.n)[1],
    "summary CI is the Wilson interval");
  check(Math.abs(act.meanS0 - 2.49) <= 0.15, "mean |S0| " + act.meanS0.toFixed(3) + " is 2.49 ± 0.15");
  check(Math.abs(act.multi - 46.1) <= 4, "multi-candidate " + act.multi.toFixed(1) + "% is 46.1 ± 4 pp");
  const asked = act.byType;
  check(Math.abs(asked.clear.asked - 3) <= 8, "clear asked " + asked.clear.asked.toFixed(1) + "% ≈ 3 (± 8 pp)");
  check(Math.abs(asked.partial.asked - 47) <= 8, "partial asked " + asked.partial.asked.toFixed(1) + "% ≈ 47 (± 8 pp)");
  check(Math.abs(asked.ambiguous.asked - 92) <= 8, "ambiguous asked " + asked.ambiguous.asked.toFixed(1) + "% ≈ 92 (± 8 pp)");
  for (const id of ["firstQ", "randomQ", "vlmQ"]) {
    const p = batch.summary[id];
    check(Math.abs(p.byType.clear.asked - asked.clear.asked) < 1e-9
      && Math.abs(p.byType.partial.asked - asked.partial.asked) < 1e-9
      && Math.abs(p.byType.ambiguous.asked - asked.ambiguous.asked) < 1e-9,
      id + " sees the same candidate sets as ActivAsk");
  }

  for (const id of ["top", "random", "directVLM"]) {
    const a = batch.summary[id].acc;
    check(a >= 40 && a <= 65, id + " accuracy " + a.toFixed(1) + "% is between 40 and 65");
  }
  for (const id of ["firstQ", "randomQ", "vlmQ", "activask"]) {
    const a = batch.summary[id].acc;
    check(a >= 85, id + " accuracy " + a.toFixed(1) + "% is at least 85");
  }
  check(act.qAsked < batch.summary.firstQ.qAsked && act.qAsked < batch.summary.randomQ.qAsked && act.qAsked < batch.summary.vlmQ.qAsked,
    "ActivAsk asked-trial questions " + act.qAsked.toFixed(3)
    + " below firstQ " + batch.summary.firstQ.qAsked.toFixed(3)
    + ", randomQ " + batch.summary.randomQ.qAsked.toFixed(3)
    + ", vlmQ " + batch.summary.vlmQ.qAsked.toFixed(3));
  for (let s0 = 2; s0 <= 6; s0++) check(Object.prototype.hasOwnProperty.call(act.qByS0, s0), "mean questions reported at |S0| = " + s0);

  const on = L.runBatch({ set: "online", seed: 11 });
  check(on.trials.length === 4 * 57, "online batch is the four online policies, 57 each");
  const onAct = on.trials.filter((t) => t.policy === "activask");
  const onType = { clear: 0, partial: 0, ambiguous: 0 };
  for (const t of onAct) onType[t.type]++;
  check(onAct.length === 57 && onType.clear === 19 && onType.partial === 19 && onType.ambiguous === 19,
    "online protocol is 19 trials of each type");
  let illegal = 0;
  for (const t of on.trials) {
    if ((t.executed || t.grasped) && t.outcome !== "correct") illegal++;
    if (t.outcome === "correct" && !t.executed) illegal++;
    if (t.grasped && !t.executed) illegal++;
  }
  check(illegal === 0, "grasp stage executes only a correct target (" + illegal + " violations)");
  for (const id of ["top", "random", "vlmQ", "activask"]) {
    const list = on.trials.filter((t) => t.policy === id);
    const p = on.summary[id];
    let g = 0, a = 0;
    for (const t of list) { if (t.executed) a++; if (t.grasped) g++; }
    check(p.n === 57 && p.attempts === a && p.nonExec === p.n - a, id + " attempts " + p.attempts + " and non-executed " + p.nonExec);
    check(Math.abs(p.full - (100 * g) / p.n) < 1e-9, id + " full-task " + p.full.toFixed(2) + "% is correct-and-grasped / n");
    check(a === 0 || Math.abs(p.grasp - (100 * g) / a) < 1e-9, id + " grasp " + p.grasp.toFixed(2) + "% is successes / attempts");
  }

  const sw = L.epsSweep({ seed: 11, n: 98 });
  const at0 = sw.byPolicy.activask.find((r) => r.eps === 0);
  const at2 = sw.byPolicy.activask.find((r) => r.eps === 0.2);
  check(sw.n === 98 && sw.eps.length === 5 && at0 && at2, "eps sweep is 98 conditioned trials at five noise levels");
  check(at2.acc < at0.acc, "eps 0.2 lowers ActivAsk (" + at2.acc.toFixed(1) + "% vs " + at0.acc.toFixed(1) + "%)");

  const ks = L.kSweep({ seed: 11 });
  check(ks.K.join(",") === "1,2,3,4,5" && ks.ambiguous.length === 5 && ks.partial.length === 5, "k sweep reports K = 1..5");
  check(ks.ambiguous.every((g) => g < -0.4 && g > -1) && ks.partial.every((g) => g < -0.4 && g > -1),
    "minimum proposal G is an information gain (ambiguous " + ks.ambiguous.map((g) => g.toFixed(3)).join(", ") + ")");
}

export const perturbations = [
  { name: "Wilson centre term quartered", find: "const centre = (p + z2 / (2 * n)) / den;", replace: "const centre = (p + z2 / (8 * n)) / den;" },
  { name: "grasp executes the wrong targets", find: "const executed = trial.outcome === \"correct\";", replace: "const executed = trial.outcome !== \"correct\";" },
  { name: "scene round-robin collapsed", find: "const scene = scenes[(k + t) % scenes.length];", replace: "const scene = scenes[k % scenes.length];" },
];
