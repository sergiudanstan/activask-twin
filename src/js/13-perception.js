// ================================================================ perception (Sec. 3.3) — simulated GroundingDINO
// One proposal per object. Score bands stand in for the detector; M5 recalibrates PER_SCORE on the 36 offline
// scenes (paper: mean |S0| 2.49, range 0–8, multi-candidate 46.1 %). No DOM, no three.js, no Math.random.
//
// TODO-SOURCE: the paper does not publish per-tier score distributions. Bands below are a twin assumption.
// A bare category prompt ("cup") is treated as easier to ground than a modified phrase ("large orange cup"),
// so a full noun match outscores a specific match, which outscores noun-only, confusable (fork↔spoon,
// cup↔bottle), then anything else. missP is the extra chance a bare-noun true match falls below τ.

const PER_SCORE = Object.freeze({
  full: Object.freeze({ lo: 0.58, hi: 0.96 }),          // bare noun, every modifier (there are none) matches
  specific: Object.freeze({ lo: 0.26, hi: 0.72 }),      // noun + colour/size/material all match
  noun: Object.freeze({ lo: 0.16, hi: 0.36 }),          // right category, a modifier does not match (always < τ)
  confusable: Object.freeze({ lo: 0.05, hi: 0.44 }),    // fork↔spoon, cup↔bottle; a tail sits above τ
  other: Object.freeze({ lo: 0.01, hi: 0.20 }),
  missP: 0.05,                                          // P(a bare-noun true match is drawn below τ)
  missLo: 0.04,
  missHi: 0.37,
});
const PER_CONFUSABLE = Object.freeze({ fork: "spoon", spoon: "fork", cup: "bottle", bottle: "cup" });

// Query { noun, mods:{color?,size?,material?}, text, broad }.
// Detector text is the noun plus colour, size and material only. handle and lid stay in matches()
// (the operator's ground truth) but are not part of the GroundingDINO phrase (SPEC §3.1).
function buildQuery(instr) {
  const src = (instr && instr.mods) || {};
  const mods = {};
  for (const k of ["color", "size", "material"]) if (src[k] != null && src[k] !== "") mods[k] = src[k];
  const words = [];
  if (mods.size) words.push(String(mods.size));
  if (mods.color) words.push(String(mods.color));
  if (mods.material) words.push(String(mods.material));
  words.push(instr.noun);
  return { noun: instr.noun, mods, text: words.join(" "), broad: Object.keys(mods).length === 0 };
}

// Ground truth for the simulated operator. Not used by the policy.
function matches(obj, instr) {
  if (!obj || !instr || obj.cat !== instr.noun) return false;
  const mods = instr.mods || {};
  for (const k of Object.keys(mods)) {
    if (mods[k] == null) continue;
    if (obj[k] !== mods[k]) return false;
  }
  return true;
}

function perTier(obj, query) {
  if (obj.cat === query.noun) {
    const keys = Object.keys(query.mods || {});
    if (keys.every((k) => obj[k] === query.mods[k])) return keys.length ? "specific" : "full";
    return "noun";
  }
  if (PER_CONFUSABLE[obj.cat] === query.noun) return "confusable";
  return "other";
}

// Two rng draws per object, always, so a miss coin cannot shift the stream.
function perDrawScore(r, tier) {
  const u = r();
  const m = r();
  const band = PER_SCORE[tier] || PER_SCORE.other;
  if (tier === "full" && m < PER_SCORE.missP) return PER_SCORE.missLo + u * (PER_SCORE.missHi - PER_SCORE.missLo);
  return band.lo + u * (band.hi - band.lo);
}

// Axis-aligned body in the object's yaw frame, standing on the table. 8 corners, then the image AABB.
// Cup/bottle: vertical box of the nominal diameter and height. Fork/spoon: length along yaw, width across.
// The handle spur (layout adds 2 cm) is outside this body — the task fixes the corners to dimsOf.
function perProjectBox(o) {
  if (typeof o.x !== "number" || typeof o.y !== "number") return null;
  const d = dimsOf(o);
  const hx = (o.cat === "cup" || o.cat === "bottle") ? d.d / 2 : d.l / 2;
  const hy = (o.cat === "cup" || o.cat === "bottle") ? d.d / 2 : d.w / 2;
  const hz = d.h;
  const yaw = o.yaw || 0;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  let u0 = Infinity, v0 = Infinity, u1 = -Infinity, v1 = -Infinity, n = 0;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [0, 1]) {
    const lx = sx * hx, ly = sy * hy;
    const q = camProject([o.x + c * lx - s * ly, o.y + s * lx + c * ly, TABLE.h + sz * hz]);
    if (!q) continue;
    n++;
    if (q[0] < u0) u0 = q[0];
    if (q[1] < v0) v0 = q[1];
    if (q[0] > u1) u1 = q[0];
    if (q[1] > v1) v1 = q[1];
  }
  return n ? [u0, v0, u1, v1] : null;
}

function perIoU(a, b) {
  const iu0 = Math.max(a[0], b[0]), iv0 = Math.max(a[1], b[1]);
  const iu1 = Math.min(a[2], b[2]), iv1 = Math.min(a[3], b[3]);
  const iw = iu1 - iu0, ih = iv1 - iv0;
  if (iw <= 0 || ih <= 0) return 0;
  const inter = iw * ih;
  const areaA = Math.max(0, a[2] - a[0]) * Math.max(0, a[3] - a[1]);
  const areaB = Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  const uni = areaA + areaB - inter;
  return uni <= 0 ? 0 : inter / uni;
}

// τ is binding because PARAMS.tau (0.38) > PARAMS.textThr (0.30). Both are applied so a later edit
// that lowers τ still honours the text threshold (Appendix A).
function perKeep(props) {
  const perCut = Math.max(PARAMS.tau, PARAMS.textThr);
  const ranked = props.filter((p) => p.box && p.score >= perCut);
  ranked.sort((a, b) => b.score - a.score || (a.obj < b.obj ? -1 : a.obj > b.obj ? 1 : 0));
  const kept = [];
  for (const p of ranked) {
    let suppress = false;
    for (const q of kept) if (q.label === p.label && perIoU(q.box, p.box) >= PARAMS.nmsIoU) { suppress = true; break; }
    if (suppress) continue;
    kept.push(p);
    if (kept.length >= PARAMS.maxDet) break;
  }
  return kept;
}

function perLeftToRight(a, b) {
  return (a.box[0] + a.box[2]) - (b.box[0] + b.box[2]) || (a.box[1] - b.box[1]) || (a.obj < b.obj ? -1 : a.obj > b.obj ? 1 : 0);
}

// Every object, unfiltered. Scores and boxes only; the tier is internal.
function detect(scene, query, seed) {
  const r = rng((seed >>> 0) || 1);
  const out = [];
  for (const o of scene.objects) {
    out.push({ obj: o.id, label: o.cat, score: perDrawScore(r, perTier(o, query)), box: perProjectBox(o) });
  }
  return out;
}

// τ, same-label NMS at IoU 0.50, at most 100. If the specific phrase returns nothing, run the bare noun
// (recall first). disp is 1..n from left to right in the image; cand ids follow that order.
function initialCandidates(scene, instr, seed) {
  const query = buildQuery(instr);
  let kept = perKeep(detect(scene, query, seed >>> 0));
  if (!kept.length && !query.broad) {
    const broad = { noun: query.noun, mods: {}, text: query.noun, broad: true };
    kept = perKeep(detect(scene, broad, (seed + 1) >>> 0));
  }
  kept.sort(perLeftToRight);
  return kept.map((p, i) => ({
    id: "c" + (i + 1), disp: i + 1, obj: p.obj, label: p.label, score: p.score, box: p.box.slice(),
  }));
}

Object.assign(LOGIC, { PER_SCORE, buildQuery, matches, detect, initialCandidates });
