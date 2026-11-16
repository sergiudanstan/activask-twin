// Acceptance test for src/js/11-scenes.js (written by the lead; workers do not edit it).
export default function (L, check) {
  check(Array.isArray(L.SCENES) && L.INSTRUCTIONS && typeof L.INSTRUCTIONS === "object", "SCENES and INSTRUCTIONS are published");
  if (!Array.isArray(L.SCENES) || !L.INSTRUCTIONS) return;
  const S = L.SCENES, I = L.INSTRUCTIONS;
  const off = S.filter((s) => s.set === "offline"), on = S.filter((s) => s.set === "online");
  check(off.length === 36 && on.length === 20 && S.length === 56, `36 offline + 20 online scenes (got ${off.length} + ${on.length}, total ${S.length})`);
  check(new Set(S.map((s) => s.id)).size === S.length, "scene ids unique");
  for (const f of L.FAMILIES) check(off.filter((s) => s.family === f).length === 9 && on.filter((s) => s.family === f).length === 5, `family ${f}: 9 offline, 5 online`);
  check(S.every((s) => new RegExp(`^${s.set === "offline" ? "off" : "on"}-${s.family}-\\d\\d$`).test(s.id)), "ids follow off|on-<family>-NN");
  const cnt = (s, c) => s.objects.filter((o) => o.cat === c).length;
  const sig = (s) => ["cup", "bottle", "fork", "spoon"].map((c) => cnt(s, c)).join(",");
  const badComp = [];
  for (const s of S) {
    const n = s.objects.length, cu = cnt(s, "cup"), bo = cnt(s, "bottle"), fo = cnt(s, "fork"), sp = cnt(s, "spoon");
    let ok = true;
    if (s.family === "cups") ok = n === 6 && cu === 6;
    if (s.family === "bottles") ok = bo === n && n === (s.set === "offline" ? 4 : 3);
    if (s.family === "utensils") ok = cu === 0 && bo === 0 && (n === 4 ? fo === 4 || sp === 4 : n === 6 && fo + sp === 6 && fo >= 2 && sp >= 2);
    if (s.family === "mixed") ok = n === 8 && cu >= 2 && cu <= 3 && bo === 2 && fo + sp >= 3 && fo + sp <= 4;
    if (!ok) badComp.push(`${s.id}(${sig(s)})`);
  }
  check(badComp.length === 0, `family compositions follow Sec. 4.1${badComp.length ? ": " + badComp.join(" ") : ""}`);
  const ut = (set) => S.filter((s) => s.set === set && s.family === "utensils").map(sig).sort().join(" ");
  check(ut("offline") === ["0,0,0,4", "0,0,0,4", "0,0,0,4", "0,0,2,4", "0,0,3,3", "0,0,4,0", "0,0,4,0", "0,0,4,0", "0,0,4,2"].join(" "), `offline utensils: 3x four forks, 3x four spoons, 2:4, 3:3, 4:2 (got ${ut("offline")})`);
  check(ut("online") === ["0,0,0,4", "0,0,0,4", "0,0,4,0", "0,0,4,0", "0,0,4,2"].join(" "), `online utensils: 2x four forks, 2x four spoons, 4 forks + 2 spoons (got ${ut("online")})`);
  const objErrs = [];
  for (const s of S) {
    s.objects.forEach((o, i) => { if (o.id !== `o${i + 1}`) objErrs.push(`${s.id}: id ${o.id} should be o${i + 1}`); objErrs.push(...L.checkObject(o).map((e) => `${s.id}: ${e}`)); });
    for (const o of s.objects) if ((o.cat === "fork" || o.cat === "spoon") && ("handle" in o || "lid" in o)) objErrs.push(`${s.id}/${o.id}: utensils carry no handle/lid keys`);
    for (const o of s.objects) if (o.cat === "bottle" && "handle" in o) objErrs.push(`${s.id}/${o.id}: bottles carry no handle key`);
  }
  check(objErrs.length === 0, `every object valid${objErrs.length ? ": " + objErrs.slice(0, 5).join("; ") : ""}`);
  const key = (o) => [o.cat, o.color, o.size, o.material, o.handle, o.lid].join("|");
  const twins = S.filter((s) => new Set(s.objects.map(key)).size !== s.objects.length).map((s) => s.id);
  check(twins.length === 0, `same-category objects are distinguishable by an attribute${twins.length ? ": " + twins.join(" ") : ""}`);
  const MODS = ["color", "size", "material", "handle", "lid"];
  const wordOf = (k, v) => (k === "handle" ? "handle" : k === "lid" ? "lid" : String(v));
  const iErrs = [], short = [];
  for (const s of S) {
    const pool = I[s.id] || [];
    for (const t of L.INSTR_TYPES) if (pool.filter((x) => x.type === t).length < 2) short.push(`${s.id}:${t}`);
    for (const x of pool) {
      const where = `${s.id} "${x.text}"`;
      if (!L.INSTR_TYPES.includes(x.type)) { iErrs.push(`${where}: bad type`); continue; }
      if (!s.objects.some((o) => o.cat === x.noun)) { iErrs.push(`${where}: noun not in scene`); continue; }
      const mk = Object.keys(x.mods || {});
      if (mk.some((k) => !MODS.includes(k))) iErrs.push(`${where}: unknown mod`);
      const want = s.objects.filter((o) => o.cat === x.noun && mk.every((k) => o[k] === x.mods[k])).map((o) => o.id).sort().join();
      if (want !== [...x.matches].sort().join()) iErrs.push(`${where}: matches ${x.matches} should be ${want}`);
      const nm = want ? want.split(",").length : 0, all = cnt(s, x.noun);
      if (x.type === "clear" && nm !== 1) iErrs.push(`${where}: clear needs exactly 1 match`);
      if (x.type === "partial" && !(mk.length > 0 && nm >= 2 && nm < all)) iErrs.push(`${where}: partial needs mods and 2 <= matches < ${all}`);
      if (x.type === "ambiguous" && !(mk.length === 0 && nm === all && all >= 2)) iErrs.push(`${where}: ambiguous needs no mods and all ${all} of the category`);
      const low = x.text.toLowerCase();
      if (!low.includes(x.noun)) iErrs.push(`${where}: text lacks the noun`);
      if (/\d/.test(x.text)) iErrs.push(`${where}: digits in text`);
      for (const k of mk) if (!low.includes(wordOf(k, x.mods[k]))) iErrs.push(`${where}: text lacks "${wordOf(k, x.mods[k])}"`);
    }
  }
  check(short.length === 0, `every scene has >= 2 instructions of each type${short.length ? ": missing " + short.slice(0, 8).join(" ") : ""}`);
  check(iErrs.length === 0, `every instruction is consistent with its scene${iErrs.length ? ` (${iErrs.length} errors): ` + iErrs.slice(0, 6).join("; ") : ""}`);
  const texts = new Set(off.flatMap((s) => (I[s.id] || []).map((x) => x.text)));
  check(texts.size >= 150, `>= 150 different instruction texts offline (got ${texts.size})`);
  check(Object.keys(I).every((id) => S.some((s) => s.id === id)), "no instruction pool for an unknown scene");
  // every scene lays out on the table (seeds 1..3), objects apart and inside the head-camera image
  const lay = [];
  for (const s of S) for (const seed of [1, 2, 3]) {
    let sc; try { sc = L.layoutScene(s, seed); } catch (e) { lay.push(`${s.id}#${seed}: ${e.message}`); continue; }
    const ds = sc.objects.map((o) => L.footprintDiscs(o, o.x, o.y, o.yaw));
    const overlap = ds.some((A, i) => ds.some((B, j) => i < j && A.some(([u, v, q]) => B.some(([u2, v2, q2]) => Math.hypot(u - u2, v - v2) <= q + q2))));
    const offImg = sc.objects.filter((o) => { const p = L.camProject([o.x, o.y, L.TABLE.h]); return !p || p[0] < 0 || p[0] > L.CAM.w || p[1] < 0 || p[1] > L.CAM.h; });
    if (overlap) lay.push(`${s.id}#${seed}: overlap`);
    if (offImg.length) lay.push(`${s.id}#${seed}: ${offImg.map((o) => o.id)} outside the camera image`);
  }
  check(lay.length === 0, `all 56 scenes lay out (3 seeds), no overlap, every object in the head-camera image${lay.length ? ": " + lay.slice(0, 4).join("; ") : ""}`);
}
export const perturbations = [
  { name: "an online scene relabelled offline", find: 'set: "online"', replace: 'set: "offline"' },
  { name: "a clear instruction relabelled partial", find: 'type: "clear"', replace: 'type: "partial"' },
];
