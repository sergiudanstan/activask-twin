// ================================================================ perception (Sec. 3.3) — simulated GroundingDINO
// One proposal per object. No DOM, no three.js, no Math.random.
//
// TODO-SOURCE: the paper does not publish per-tier score distributions. Bands below are a twin assumption,
// refit on the 36 offline scenes (paper: mean |S0| 2.49, multi-candidate 46.1 %, clarifying asked rates by
// type about 3 / 47 / 92 %). Three documented rules sit on top of the bands:
//
// 1. Specific phrase ("orange cup"). Every phrase match draws from `specific`, then all but the highest
//    are redrawn from `rival` (PER_RIVAL). A modified prompt usually keeps one box; each extra phrase
//    match clears τ with probability (rival.hi − τ) / (rival.hi − rival.lo). Noun, confusable and other
//    stay under τ, so a clear instruction rarely grows a second candidate and the broad-noun fallback
//    fires only when the phrase matches nothing at all.
// 2. Bare noun ("cup"). Category members draw from `full` (a missP fraction from the miss band, under τ).
//    Confusable categories draw from `broadConf` and unrelated objects from `broadOther`, so an ambiguous
//    instruction keeps most of the category and a few extras. Those loose bands are not used for a
//    specific phrase. broadConf and broadOther top out below `full.lo`, so the top-score pick on a bare
//    noun is still a category member.
// 3. With probability `singleP` a bare-noun query is collapsed to its single best category box (PER_BARE).
//    That is what lets ambiguous asked-rate sit near 92 % while the other ambiguous trials stay large
//    enough for mean |S0| ≈ 2.49. Collapsing keeps the argmax, so a top-score policy is unchanged.
//
// A handle/lid constraint on an otherwise bare phrase is scored as specific even though buildQuery leaves
// it out of the detector string (SPEC §3.1). TODO-SOURCE: the paper does not publish the text prompt per
// attribute; without this, "the cup with a lid" would detect every cup.

const PER_SCORE = Object.freeze({
  full: Object.freeze({ lo: 0.60, hi: 0.96 }),          // bare noun, every modifier matches
  specific: Object.freeze({ lo: 0.64, hi: 0.97 }),      // best modified-phrase match (always ≥ τ)
  rival: Object.freeze({ lo: 0.14, hi: 0.58 }),         // other phrase matches; P(≥ τ) = 0.455 before NMS
  noun: Object.freeze({ lo: 0.06, hi: 0.36 }),          // right category, a modifier does not (always < τ)
  confusable: Object.freeze({ lo: 0.02, hi: 0.30 }),    // specific phrase: fork↔spoon, cup↔bottle, under τ
  other: Object.freeze({ lo: 0.01, hi: 0.18 }),         // specific phrase: anything else, under τ
  broadConf: Object.freeze({ lo: 0.40, hi: 0.57 }),     // bare noun: confusable, above τ, below full
  broadOther: Object.freeze({ lo: 0.33, hi: 0.58 }),    // bare noun: unrelated; P(≥ τ) = 0.80, still below full.lo
  missP: 0.03,                                          // P(a bare-noun true match is drawn below τ)
  missLo: 0.05,
  missHi: 0.37,
  singleP: 0.10,                                        // P(a bare-noun query keeps only its best category box)
});
const PER_RIVAL = PER_SCORE.rival;
const PER_BARE = PER_SCORE.singleP;
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
    if (!keys.every((k) => obj[k] === query.mods[k])) return "noun";
    const bools = query.bools || {};
    const bk = Object.keys(bools);
    if (bk.some((k) => obj[k] !== bools[k])) return "noun";
    if (keys.length || bk.length) return "specific";
    return "full";
  }
  if (PER_CONFUSABLE[obj.cat] === query.noun) return "confusable";
  return "other";
}

function perBand(tier, broad) {
  if (tier === "confusable") return broad ? PER_SCORE.broadConf : PER_SCORE.confusable;
  if (tier === "other") return broad ? PER_SCORE.broadOther : PER_SCORE.other;
  return PER_SCORE[tier] || PER_SCORE.other;
}

// Two rng draws per object, always, so a miss coin cannot shift the stream.
function perDrawScore(r, tier, broad) {
  const u = r();
  const m = r();
  if (tier === "full" && m < PER_SCORE.missP) return PER_SCORE.missLo + u * (PER_SCORE.missHi - PER_SCORE.missLo);
  const band = perBand(tier, broad);
  return band.lo + u * (band.hi - band.lo);
}

// Keep the highest phrase match. Every other phrase match is redrawn from PER_RIVAL (one extra rng draw).
function perSuppressRivals(rows, r) {
  const specs = [];
  for (const row of rows) if (row.tier === "specific") specs.push(row);
  if (specs.length < 2) return;
  specs.sort((a, b) => b.score - a.score || (a.obj < b.obj ? -1 : a.obj > b.obj ? 1 : 0));
  const lo = PER_RIVAL.lo, span = PER_RIVAL.hi - PER_RIVAL.lo;
  for (let i = 1; i < specs.length; i++) specs[i].score = lo + r() * span;
}

// Bare-noun queries only. One rng draw. With probability PER_BARE, every box except the best category
// match is pushed under τ. The survivor is the same argmax a top-score policy would have picked.
function perBareTop(rows, r) {
  if (r() >= PER_BARE) return;
  const floor = Math.max(PARAMS.tau, PARAMS.textThr);
  let best = null;
  for (const row of rows) {
    if (row.tier !== "full") continue;
    if (!best || row.score > best.score || (row.score === best.score && row.obj < best.obj)) best = row;
  }
  for (const row of rows) {
    if (row === best) { if (row.score < floor) row.score = PER_SCORE.full.lo; }
    else if (row.score >= floor) row.score = PER_SCORE.missHi;
  }
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

// Phrase used for scoring. buildQuery's public shape is unchanged. A bare phrase that still names a
// handle or a lid is narrowed so those objects score as a specific match (see the header).
function perScoreQuery(instr) {
  const query = buildQuery(instr);
  if (!query.broad) return query;
  const src = (instr && instr.mods) || {};
  const bools = {};
  for (const k of ["handle", "lid"]) if (typeof src[k] === "boolean") bools[k] = src[k];
  if (!Object.keys(bools).length) return query;
  return { noun: query.noun, mods: query.mods, text: query.text, broad: false, bools };
}

// Every object, unfiltered. Scores and boxes only; the tier is internal and stripped before return.
function detect(scene, query, seed) {
  const r = rng((seed >>> 0) || 1);
  const broad = !!query.broad;
  const out = [];
  for (const o of scene.objects) {
    const tier = perTier(o, query);
    out.push({ obj: o.id, label: o.cat, score: perDrawScore(r, tier, broad), box: perProjectBox(o), tier });
  }
  if (broad) perBareTop(out, r);
  else perSuppressRivals(out, r);
  for (const row of out) delete row.tier;
  return out;
}

// τ, same-label NMS at IoU 0.50, at most 100. If the specific phrase returns nothing, run the bare noun
// (recall first). disp is 1..n from left to right in the image; cand ids follow that order.
function initialCandidates(scene, instr, seed) {
  const query = perScoreQuery(instr);
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
