// @@logic-start  (pure JS, no DOM and no three.js: tests/run.mjs evaluates this block in Node)
// ================================================================ contracts (lead-owned; read-only for module workers)
// Source: Yang, Haddon-Hill, Zielinska, Murata, "ActivAsk: Free-Energy-Guided Clarification for Robotic Grasping
// Under Ambiguous Instructions", Robotics 15(8):154 (MDPI, 2026). Section numbers below refer to that paper.
// Every logic module (files 10-19) publishes its API with Object.assign(LOGIC, { ... }); tests reach it as L.<name>.
const LOGIC = {};

// ---------------------------------------------------------------- math + seeded randomness
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => { t = clamp(t, 0, 1); return t * t * t * (10 - 15 * t + 6 * t * t); };   // minimum jerk
function rng(seed) {                                   // mulberry32: same seed, same scene / trial / batch
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];

// ---------------------------------------------------------------- ActivAsk parameters (Sec. 3.3, 4.1, Appendix A)
const PARAMS = Object.freeze({
  tau: 0.38,        // GroundingDINO box threshold: a proposal is a candidate when score >= tau
  textThr: 0.30,    // text threshold
  nmsIoU: 0.50,     // non-maximum suppression IoU
  maxDet: 100,      // detections per image
  K: 4,             // VLM proposals per clarification round (main experiments)
  camHz: 15,        // RealSense D435i aligned colour + depth rate
});

// ---------------------------------------------------------------- vocabulary
const CATEGORIES = ["cup", "bottle", "fork", "spoon"];
const FAMILIES = ["cups", "bottles", "utensils", "mixed"];          // scene families (Sec. 4.1)
const INSTR_TYPES = ["clear", "partial", "ambiguous"];               // Sec. 4.1, Figure 4
// Visible attributes an object carries. Questions may use these plus geometry (left/right/front/back, next to);
// never internal ids, display numbers, detector scores, boxes, thresholds or IoU (Sec. 3.4.2).
const ATTRS = Object.freeze({
  color: ["white", "black", "red", "orange", "yellow", "green", "blue", "pink", "grey", "clear"],
  size: ["small", "medium", "large"],
  material: ["ceramic", "glass", "plastic", "metal", "paper"],
});
// Category -> which boolean attributes are meaningful, and nominal dimensions (m) per size.
// cup/bottle: d = diameter, h = height. fork/spoon: l = length, w = head width, h = thickness.  (twin assumption)
const DIMS = Object.freeze({
  cup:    { small: { d: 0.065, h: 0.075 }, medium: { d: 0.080, h: 0.095 }, large: { d: 0.090, h: 0.115 } },
  bottle: { small: { d: 0.055, h: 0.170 }, medium: { d: 0.065, h: 0.210 }, large: { d: 0.075, h: 0.250 } },
  fork:   { small: { l: 0.150, w: 0.022, h: 0.012 }, medium: { l: 0.180, w: 0.025, h: 0.014 }, large: { l: 0.205, w: 0.027, h: 0.015 } },
  spoon:  { small: { l: 0.140, w: 0.032, h: 0.014 }, medium: { l: 0.170, w: 0.038, h: 0.016 }, large: { l: 0.200, w: 0.042, h: 0.018 } },
});
const BOOL_ATTRS = Object.freeze({ cup: ["handle", "lid"], bottle: ["lid"], fork: [], spoon: [] });

// ---------------------------------------------------------------- frames
// Cell frame: metres, z up, origin on the floor under the table-top centre. x runs along the table (right as the
// robot's head camera sees it), y points away from the robot, z up. The robot works from the -y side.
// Table frame = cell frame shifted up by TABLE.h (objects stand at z = TABLE.h).  (twin assumption: the paper gives
// no table size; a typical service-robot test table is used)
const TABLE = Object.freeze({ w: 1.20, d: 0.70, h: 0.74, margin: 0.06 });
// Virtual head camera image (D435i colour FOV 69 x 42 deg; the paper does not state the resolution used).
const CAM = Object.freeze({ w: 640, h: 360, hfov: 69, vfov: 42 });
// Robot placement and the head-camera pose shared by perception (box projection) and the 3D model (Camera panel).
// The base stands on the -y side, drives along x, and its telescoping arm extends along +y over the table.
// The paper sets head pan/tilt so the tabletop fills the image while limiting arm occlusion (Sec. 4.1); the twin
// realises that with this pose. pos height = Stretch 3 head-camera height (twin assumption until M1 sources it).
const ROBOT = Object.freeze({ base: [0.0, -0.62, 0.0] });
const CAM_POSE = Object.freeze({ pos: [0.0, -0.66, 1.30], look: [0.0, -0.06, TABLE.h] });
// Pinhole projection of a cell-frame point into CAM pixels (u right, v down); null when behind the camera.
function camProject(p) {
  const [cx, cy, cz] = CAM_POSE.pos, [lx, ly, lz] = CAM_POSE.look;
  let fx = lx - cx, fy = ly - cy, fz = lz - cz; const fn = Math.hypot(fx, fy, fz); fx /= fn; fy /= fn; fz /= fn;   // forward
  let rx = fy, ry = -fx, rz = 0; const rn = Math.hypot(rx, ry); rx /= rn; ry /= rn;                              // right = forward x up
  const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;                                   // up = right x forward
  const dx = p[0] - cx, dy = p[1] - cy, dz = p[2] - cz;
  const zc = dx * fx + dy * fy + dz * fz; if (zc <= 1e-6) return null;
  const xc = dx * rx + dy * ry + dz * rz, yc = dx * ux + dy * uy + dz * uz;
  const fpx = CAM.w / 2 / Math.tan((CAM.hfov * Math.PI) / 360), fpy = CAM.h / 2 / Math.tan((CAM.vfov * Math.PI) / 360);
  return [CAM.w / 2 + fpx * (xc / zc), CAM.h / 2 - fpy * (yc / zc), zc];
}

// ---------------------------------------------------------------- data contracts
// Object  { id:"o3", cat:"cup", color:"orange", size:"medium", material:"ceramic", handle:true, lid:false,
//           x, y, yaw }            x, y in the table frame (m), yaw about z (rad); filled by layoutScene.
// Scene   { id:"off-cups-01", set:"offline"|"online", family, objects:[Object] }
// Instr   { text:"pick up my cup", type, noun:"cup", mods:{color?,size?,material?,handle?,lid?}, matches:["o1",...] }
// Cand    { id:"c2", disp:2, obj:"o3", label:"cup", score:0.61, box:[u0,v0,u1,v1] }      box in CAM pixels
// Prop    { text, yes:["c1",...], no:[...], key:"handle=true", count:{total,yes,no},
//           valid:{exhaustive,disjoint,legal,wording}, G, vlmPick:false }
// Round   { S:[cand ids], props:[Prop], sel, answer:"yes"|"no" }
// Trial   { scene, instr, target, policy, eps, S0:[cand ids], rounds:[Round], resolved:cand id|null,
//           outcome:"correct"|"wrong"|"unresolved"|"none", questions }
// Segment { t0, t1, kind, label, q0, q1 }   one robot motion or dialogue step on the timeline (q = joint dict)

function dimsOf(o) { return DIMS[o.cat][o.size]; }
function footprint(o) { const d = dimsOf(o); return o.cat === "cup" || o.cat === "bottle" ? d.d / 2 + (o.handle ? 0.02 : 0) : d.l / 2; }
function checkObject(o) {
  const errs = [];
  if (!/^o\d+$/.test(o.id)) errs.push(`bad id ${o.id}`);
  if (!CATEGORIES.includes(o.cat)) errs.push(`${o.id}: bad cat ${o.cat}`);
  for (const k of Object.keys(ATTRS)) if (!ATTRS[k].includes(o[k])) errs.push(`${o.id}: bad ${k} ${o[k]}`);
  for (const k of ["handle", "lid"]) {
    const allowed = (BOOL_ATTRS[o.cat] || []).includes(k);
    if (allowed && typeof o[k] !== "boolean") errs.push(`${o.id}: ${k} must be boolean`);
    if (!allowed && o[k]) errs.push(`${o.id}: a ${o.cat} cannot have ${k}`);
  }
  return errs;
}

// Discs [x, y, r] covering an object's footprint at pose (x, y, yaw): one disc for cups and bottles (handle included),
// a chain of discs for forks and spoons, whose length runs along the object's local x axis (yaw 0 = along cell x).
function footprintDiscs(o, x, y, yaw) {
  const d = dimsOf(o);
  if (o.cat === "cup" || o.cat === "bottle") return [[x, y, d.d / 2 + (o.handle ? 0.02 : 0)]];
  const r = d.w / 2 + 0.004, n = Math.ceil(d.l / (2 * r)) + 1, c = Math.cos(yaw), s = Math.sin(yaw);
  return Array.from({ length: n }, (_, i) => { const t = -d.l / 2 + r + ((d.l - 2 * r) * i) / (n - 1); return [x + c * t, y + s * t, r]; });
}
const LAYOUT_GAP = 0.03;   // clear space between objects (m), so the gripper fingers fit
// Places a scene's objects on the table inside the robot's working band, without overlap, deterministically.
// Restarts the whole scene when an object finds no room.
function layoutScene(scene, seed = 1) {
  const r = rng(seed);
  const x0 = -TABLE.w / 2 + TABLE.margin, x1 = TABLE.w / 2 - TABLE.margin;
  const y0 = -TABLE.d / 2 + TABLE.margin, y1 = y0 + 0.42;
  for (let attempt = 0; attempt < 60; attempt++) {
    const placed = [];
    for (const o of scene.objects) {
      let done = false;
      for (let k = 0; k < 300 && !done; k++) {
        const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), yaw = (r() - 0.5) * Math.PI;
        const discs = footprintDiscs(o, x, y, yaw);
        const inside = discs.every(([u, v, q]) => u - q >= x0 && u + q <= x1 && v - q >= y0 && v + q <= y1);
        const free = inside && placed.every((p) => p.discs.every(([u, v, q]) => discs.every(([u2, v2, q2]) => Math.hypot(u - u2, v - v2) > q + q2 + LAYOUT_GAP)));
        if (free) { placed.push({ o: { ...o, x, y, yaw }, discs }); done = true; }
      }
      if (!done) break;
    }
    if (placed.length === scene.objects.length) return { ...scene, objects: placed.map((p) => p.o) };
  }
  throw new Error(`layoutScene: no room for the objects of ${scene.id}`);
}

// ---------------------------------------------------------------- policies (Table 3)
const POLICIES = Object.freeze([
  { id: "top",       label: "Top score detector",   clarifies: false, offline: true, online: true,  rule: "Highest detector confidence." },
  { id: "random",    label: "Random candidate",     clarifies: false, offline: true, online: true,  rule: "Uniform candidate sample." },
  { id: "directVLM", label: "Direct VLM decision",  clarifies: false, offline: true, online: false, rule: "VLM selects target directly." },
  { id: "firstQ",    label: "First VLM question",   clarifies: true,  offline: true, online: false, rule: "First valid VLM question." },
  { id: "randomQ",   label: "Random VLM question",  clarifies: true,  offline: true, online: false, rule: "Uniform valid question sample." },
  { id: "vlmQ",      label: "VLM-selected question", clarifies: true, offline: true, online: true,  rule: "VLM-preferred valid question." },
  { id: "activask",  label: "ActivAsk",             clarifies: true,  offline: true, online: true,  rule: "Lowest EFE over valid partitions." },
]);

Object.assign(LOGIC, { clamp, lerp, ease, rng, pick, PARAMS, CATEGORIES, FAMILIES, INSTR_TYPES, ATTRS, DIMS, BOOL_ATTRS,
  TABLE, CAM, ROBOT, CAM_POSE, camProject, POLICIES, dimsOf, footprint, footprintDiscs, checkObject, layoutScene });
