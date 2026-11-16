// Perception (13-perception.js): query, ground-truth matches, simulated detector, candidates.
export default function (L, check) {
  const cup = (id, color, size, material, handle, lid, x, y, yaw) => ({
    id, cat: "cup", color, size, material, handle, lid, x, y, yaw: yaw || 0,
  });
  const qCup = { noun: "cup", mods: {}, text: "cup", broad: true };

  const built = L.buildQuery({ text: "pick up the large orange ceramic cup", noun: "cup", mods: { size: "large", color: "orange", material: "ceramic", lid: true } });
  check(built.text === "large orange ceramic cup" && built.broad === false && built.mods.color === "orange" && built.mods.lid == null,
    "buildQuery keeps colour, size and material, and leaves handle/lid out of the detector phrase");
  check(L.buildQuery({ noun: "cup", mods: {}, text: "pick up my cup" }).broad === true, "a bare noun is the broad query");

  const orange = cup("o1", "orange", "medium", "ceramic", true, false, 0, 0, 0);
  const orangeLid = cup("o2", "orange", "medium", "ceramic", true, true, 0.2, 0, 0);
  const blue = cup("o3", "blue", "small", "plastic", false, false, -0.2, 0, 0);
  const instrLid = { noun: "cup", mods: { color: "orange", lid: true }, text: "orange cup with a lid" };
  check(L.matches(orangeLid, instrLid) && !L.matches(orange, instrLid) && !L.matches(blue, instrLid),
    "matches is category plus every modifier, including lid");
  check(!L.matches({ ...orange, cat: "bottle", lid: false }, { noun: "cup", mods: {}, text: "cup" }), "matches rejects the wrong category");

  const one = (size, yaw, x) => ({
    id: "t", set: "offline", family: "cups",
    objects: [cup("o1", "orange", size, "ceramic", false, false, x, 0, yaw)],
  });
  const fork = (yaw) => ({
    id: "t", set: "offline", family: "utensils",
    objects: [{ id: "o1", cat: "fork", color: "grey", size: "medium", material: "metal", x: 0, y: 0, yaw }],
  });
  const qFork = { noun: "fork", mods: {}, text: "fork", broad: true };
  const smallBox = L.detect(one("small", 0, 0), qCup, 1)[0].box;
  const largeBox = L.detect(one("large", 0, 0), qCup, 1)[0].box;
  check(smallBox && largeBox && largeBox.length === 4 && largeBox[1] < smallBox[1] - 0.5, "a taller cup projects higher (box from the 8 corners)");
  const yaw0 = L.detect(fork(0), qFork, 1)[0].box;
  const yaw1 = L.detect(fork(1.1), qFork, 1)[0].box;
  check(yaw0 && yaw1 && Math.abs((yaw0[2] - yaw0[0]) - (yaw1[2] - yaw1[0])) > 1, "yaw changes the projected fork box");

  const row = {
    id: "row", set: "offline", family: "cups",
    objects: [
      cup("oR", "red", "medium", "ceramic", false, false, 0.30, 0, 0),
      cup("oL", "blue", "medium", "ceramic", true, false, -0.30, 0, 0),
      cup("oC", "green", "medium", "plastic", false, true, 0, 0, 0),
    ],
  };
  const rowInstr = { text: "pick up my cup", noun: "cup", mods: {}, matches: ["oR", "oL", "oC"] };
  const props = L.detect(row, L.buildQuery(rowInstr), 1);
  check(props.length === 3 && props.every((p) => p.box && p.score > 0 && p.score < 1 && p.label === "cup"), "detect returns one scored box per object");
  const uOf = (id) => { const p = props.find((q) => q.obj === id); return (p.box[0] + p.box[2]) / 2; };
  check(uOf("oL") < uOf("oC") && uOf("oC") < uOf("oR"), "image u grows with cell x");
  let ordered = 0, wrong = 0;
  for (let s = 1; s <= 40; s++) {
    const cs = L.initialCandidates(row, rowInstr, s);
    if (cs.length !== 3) continue;
    ordered++;
    const xs = cs.map((c) => row.objects.find((o) => o.id === c.obj).x);
    if (!(xs[0] < xs[1] && xs[1] < xs[2])) wrong++;
    if (cs.some((c, i) => c.disp !== i + 1 || c.id !== "c" + (i + 1))) wrong++;
  }
  check(ordered > 0 && wrong === 0, "disp is 1..n left to right and cand ids follow it");

  const lone = { id: "lone", set: "offline", family: "cups", objects: [cup("o1", "orange", "medium", "ceramic", true, false, 0, 0, 0)] };
  const loneInstr = { text: "pick up my cup", noun: "cup", mods: {}, matches: ["o1"] };
  let keptLone = 0;
  for (let s = 1; s <= 30; s++) if (L.initialCandidates(lone, loneInstr, s).some((c) => c.obj === "o1")) keptLone++;
  check(keptLone >= 20, "a true category match clears τ on most seeds (" + keptLone + "/30)");

  const piled = {
    id: "pile", set: "offline", family: "cups",
    objects: [
      cup("o1", "orange", "medium", "ceramic", true, false, 0, 0, 0),
      cup("o2", "blue", "medium", "plastic", false, false, 0, 0, 0.4),
    ],
  };
  const pileInstr = { text: "pick up my cup", noun: "cup", mods: {}, matches: ["o1", "o2"] };
  let piledOk = true, bothAbove = 0;
  for (let s = 1; s <= 40; s++) {
    const det = L.detect(piled, L.buildQuery(pileInstr), s);
    const cs = L.initialCandidates(piled, pileInstr, s);
    if (cs.length > 1) piledOk = false;
    const above = det.filter((p) => p.box && p.score >= L.PARAMS.tau);
    if (above.length >= 2) {
      bothAbove++;
      above.sort((a, b) => b.score - a.score);
      if (cs.length !== 1 || cs[0].obj !== above[0].obj) piledOk = false;
    }
  }
  check(piledOk && bothAbove > 0, "same-label NMS at IoU 0.50 keeps the higher score");

  const oranges = {
    id: "oranges", set: "offline", family: "cups",
    objects: [0, 1, 2, 3].map((i) => cup("o" + (i + 1), "orange", "medium", "ceramic", i % 2 === 0, false, -0.30 + i * 0.2, 0, 0)),
  };
  const blueInstr = { text: "pick up the blue cup", noun: "cup", mods: { color: "blue" }, matches: [] };
  let recovered = 0;
  for (let s = 1; s <= 25; s++) if (L.initialCandidates(oranges, blueInstr, s).length >= 1) recovered++;
  check(recovered === 25, "broad noun fallback recovers cups when the colour phrase matches nothing");

  // Synthetic offline-like mix (SPEC §5 counts). Twin (simulated), not the paper's 36 scenes.
  const PAL = ["white", "black", "red", "orange", "yellow", "green", "blue", "pink", "grey", "clear"];
  const O = (id, cat, color, size, material, handle, lid) => {
    const o = { id, cat, color, size, material };
    if (cat === "cup") { o.handle = handle; o.lid = lid; }
    else if (cat === "bottle") o.lid = lid;
    return o;
  };
  const colorAt = (i, k) => PAL[(i + k) % PAL.length];
  function cupsOf(k) {
    const spec = [[0, "medium", "ceramic", true, false], [0, "large", "plastic", false, false], [1, "medium", "ceramic", true, true],
      [2, "small", "paper", false, false], [3, "large", "ceramic", true, false], [4, "small", "plastic", false, true]];
    return spec.map((s, i) => O("o" + (i + 1), "cup", colorAt(s[0], k), s[1], s[2], s[3], s[4]));
  }
  function bottlesOf(k) {
    const spec = [[0, "medium", "glass", false], [0, "large", "plastic", true], [1, "small", "glass", false], [2, "medium", "plastic", true]];
    return spec.map((s, i) => O("o" + (i + 1), "bottle", colorAt(s[0], k), s[1], s[2], false, s[3]));
  }
  function toolsOf(cat, k) {
    const spec = [[0, "medium", "metal"], [0, "large", "plastic"], [1, "small", "metal"], [2, "medium", "plastic"]];
    return spec.map((s, i) => O("o" + (i + 1), cat, colorAt(s[0], k), s[1], s[2]));
  }
  function mixTools(forks, k) {
    const out = [];
    for (let i = 0; i < forks; i++) out.push(O("o" + (out.length + 1), "fork", colorAt(i, k), ["small", "medium", "large"][i % 3], i % 2 ? "plastic" : "metal"));
    for (let i = 0; i < 6 - forks; i++) out.push(O("o" + (out.length + 1), "spoon", colorAt(i + 3, k), ["small", "medium", "large"][i % 3], i % 2 ? "metal" : "plastic"));
    return out;
  }
  function mixedOf(k) {
    const cups3 = cupsOf(k).slice(0, 3).map((o, i) => ({ ...o, id: "o" + (i + 1) }));
    const bottles = bottlesOf(k + 1).slice(0, 2).map((o, i) => ({ ...o, id: "o" + (i + 4) }));
    const fork = toolsOf("fork", k).slice(0, 2).map((o, i) => ({ ...o, id: "o" + (i + 6) }));
    const spoon = { ...toolsOf("spoon", k + 2)[0], id: "o8" };
    return cups3.concat(bottles, fork, spoon);
  }
  function take(list, n, shift) {
    const out = [];
    if (!list.length) return out;
    for (let i = 0; i < n; i++) out.push(list[(i + shift) % list.length]);
    return out;
  }
  function poolFor(objects) {
    const by = {};
    for (const o of objects) (by[o.cat] || (by[o.cat] = [])).push(o);
    const instrs = { clear: [], partial: [], ambiguous: [] };
    for (const noun of Object.keys(by)) {
      const group = by[noun];
      if (group.length < 2) continue;
      instrs.ambiguous.push({ text: "pick up my " + noun, type: "ambiguous", noun, mods: {}, matches: group.map((o) => o.id) });
      const attrs = ["color", "size", "material"].concat(noun === "cup" ? ["handle", "lid"] : noun === "bottle" ? ["lid"] : []);
      for (const attr of attrs) {
        const vals = [...new Set(group.map((o) => o[attr]))];
        for (const v of vals) {
          const ids = group.filter((o) => o[attr] === v).map((o) => o.id);
          const mods = {}; mods[attr] = v;
          const text = "pick up the " + noun;
          if (ids.length >= 2 && ids.length < group.length) instrs.partial.push({ text, type: "partial", noun, mods, matches: ids });
          if (ids.length === 1) instrs.clear.push({ text, type: "clear", noun, mods, matches: ids });
        }
      }
    }
    return instrs;
  }
  const scenes = [];
  for (let k = 0; k < 9; k++) scenes.push({ id: "off-cups-" + (k + 1), set: "offline", family: "cups", objects: cupsOf(k) });
  for (let k = 0; k < 9; k++) scenes.push({ id: "off-bottles-" + (k + 1), set: "offline", family: "bottles", objects: bottlesOf(k) });
  for (let k = 0; k < 3; k++) scenes.push({ id: "off-utensils-f" + k, set: "offline", family: "utensils", objects: toolsOf("fork", k) });
  for (let k = 0; k < 3; k++) scenes.push({ id: "off-utensils-s" + k, set: "offline", family: "utensils", objects: toolsOf("spoon", k + 3) });
  for (let k = 0; k < 3; k++) scenes.push({ id: "off-utensils-m" + k, set: "offline", family: "utensils", objects: mixTools(k + 2, k) });
  for (let k = 0; k < 9; k++) scenes.push({ id: "off-mixed-" + (k + 1), set: "offline", family: "mixed", objects: mixedOf(k) });
  let sum = 0, multi = 0, n = 0, lo = 99, hi = 0, trials = 0;
  const byType = { clear: [0, 0, 0], partial: [0, 0, 0], ambiguous: [0, 0, 0] };
  scenes.forEach((scene, si) => {
    const pool = poolFor(scene.objects);
    // Colour / size / material are the detector's modifiers (handle and lid are not in the phrase).
    const vis = (list) => {
      const v = list.filter((ins) => ["color", "size", "material"].includes(Object.keys(ins.mods)[0]));
      return v.length ? v : list;
    };
    const chosen = take(vis(pool.clear), 2, si).concat(take(vis(pool.partial), 2, si), take(pool.ambiguous, 2, si));
    const cols = Math.min(scene.objects.length, 4);
    const placed = {
      ...scene,
      objects: scene.objects.map((o, i) => ({
        ...o,
        x: -0.36 + (i % cols) * 0.24,
        y: -0.12 + Math.floor(i / cols) * 0.16,
        yaw: ((si + i) % 5) * 0.25,
      })),
    };
    chosen.forEach((instr, ti) => {
      trials++;
      const cs = L.initialCandidates(placed, instr, si * 20 + ti * 3 + 1);
      sum += cs.length; n++;
      if (cs.length > 1) multi++;
      if (cs.length < lo) lo = cs.length;
      if (cs.length > hi) hi = cs.length;
      const slot = byType[instr.type];
      slot[0] += cs.length; slot[1]++; if (cs.length > 1) slot[2]++;
    });
  });
  const mean = sum / n, rate = multi / n;
  const bit = (k) => k + " |S0| " + (byType[k][0] / byType[k][1]).toFixed(2) + " multi " + (100 * byType[k][2] / byType[k][1]).toFixed(0) + "%";
  check(scenes.length === 36 && trials === 216 && mean > 1.4 && mean < 4.2 && rate > 0.25 && rate < 0.85,
    "synthetic offline-like |S0| mean " + mean.toFixed(3) + " (range " + lo + "–" + hi + "), multi " + (100 * rate).toFixed(1) + "% — paper 2.49, 46.1% (twin, simulated); " + bit("clear") + "; " + bit("partial") + "; " + bit("ambiguous"));
}

export const perturbations = [
  { name: "box threshold comparison flipped", find: "p.score >= perCut", replace: "p.score < perCut" },
  { name: "left-to-right image order reversed", find: "(a.box[0] + a.box[2]) - (b.box[0] + b.box[2])", replace: "(b.box[0] + b.box[2]) - (a.box[0] + a.box[2])" },
  { name: "broad-noun fallback removed", find: "if (!kept.length && !query.broad)", replace: "if (false && !kept.length && !query.broad)" },
];
