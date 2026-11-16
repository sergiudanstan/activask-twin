// Stretch 3 specifications in 16-kinematics.js. The mesh tests (head camera within 2 cm) run in the browser.
export default function (L, check) {
  const S = L.STRETCH;
  const ranges = [S.lift, S.arm, S.wrist.yaw, S.wrist.pitch, S.wrist.roll, S.gripper, S.head.pan, S.head.tilt];
  check(ranges.every((r) => typeof r.min === "number" && typeof r.max === "number" && r.min < r.max), "every Stretch range is ordered (min < max)");
  check(S.lift.min < L.TABLE.h && S.lift.max > L.TABLE.h, "the lift range passes the table top (TABLE.h)");
  check(S.arm.segments === 5 && S.arm.max === 0.52 && S.gripper.max === 0.15, "5 arm links, 0.52 m reach, 15 cm gripper");
  check(Math.abs(S.gripY.extended - S.gripY.retracted - S.arm.max) < 1e-9, "extended fingertip = retracted + arm travel");
  // layoutScene's reachable band (10-contracts.js): centres lie inside this y interval.
  const yMin = -L.TABLE.d / 2 + L.TABLE.margin + 0.04;
  const yMax = yMin + 0.34;
  const near = L.ROBOT.base[1] + S.gripY.retracted;
  const far = L.ROBOT.base[1] + S.gripY.extended;
  check(near <= yMin && far >= yMax, "arm reach covers the layoutScene object band from ROBOT.base");
  check(Math.abs(S.d435i.z - L.CAM_POSE.pos[2]) <= 0.05, "head camera height within 5 cm of CAM_POSE");
  check(S.overallHeight === 1.41 && S.payload === 2 && S.footprint.x === 0.34 && S.footprint.y === 0.33, "datasheet size 0.34 x 0.33 x 1.41 m and 2 kg payload");

  const tool = S.tool;
  check(Math.abs(tool.stow0 + tool.armLen0 + tool.pitch + tool.roll + tool.tip - S.gripY.retracted) < 1e-9, "tool chain sums to the retracted fingertip");
  const flat = { x: 0, lift: 0.8, arm: 0, yaw: 0, pitch: 0, roll: 0, grip: 0, pan: 0, tilt: 0 };
  const fk0 = L.stretchFK(flat);
  const tipBuf = [0, 0, 0];
  L.kinToolPoint(flat, 0, tool.tip, 0, tipBuf);
  check(Math.hypot(tipBuf[0] - fk0.p[0], tipBuf[1] - fk0.p[1], tipBuf[2] - fk0.p[2]) < 1e-9, "kinToolPoint at the fingertip matches stretchFK");
  check(Math.abs(fk0.p[1] - (L.ROBOT.base[1] + S.gripY.retracted)) < 1e-9 && Math.abs(fk0.p[0]) < 1e-9 && Math.abs(fk0.p[2] - 0.8) < 1e-9, "pitch 0, arm 0 fingertip matches gripY.retracted");
  const fk1 = L.stretchFK({ ...flat, arm: S.arm.max });
  check(Math.abs(fk1.p[1] - (L.ROBOT.base[1] + S.gripY.extended)) < 1e-9, "full extension matches gripY.extended");

  const within = (q) => q
    && q.lift >= S.lift.min - 1e-6 && q.lift <= S.lift.max + 1e-6
    && q.arm >= S.arm.min - 1e-6 && q.arm <= S.arm.max + 1e-6
    && q.yaw >= S.wrist.yaw.min - 1e-6 && q.yaw <= S.wrist.yaw.max + 1e-6
    && q.pitch >= S.wrist.pitch.min - 1e-6 && q.pitch <= S.wrist.pitch.max + 1e-6
    && q.roll >= S.wrist.roll.min - 1e-6 && q.roll <= S.wrist.roll.max + 1e-6
    && q.grip >= S.gripper.min - 1e-9 && q.grip <= S.gripper.max + 1e-9
    && q.pan >= S.head.pan.min - 1e-6 && q.pan <= S.head.pan.max + 1e-6
    && q.tilt >= S.head.tilt.min - 1e-6 && q.tilt <= S.head.tilt.max + 1e-6;
  const hit = (p, q) => {
    const g = L.stretchFK(q).p;
    return Math.hypot(g[0] - p[0], g[1] - p[1], g[2] - p[2]);
  };

  const x0 = -L.TABLE.w / 2 + L.TABLE.margin, x1 = -x0;
  const y0 = -L.TABLE.d / 2 + L.TABLE.margin, y1 = y0 + 0.42;
  let band = "";
  for (const x of [x0, 0, x1]) for (const y of [y0, (y0 + y1) / 2, y1]) {
    const p = [x, y, L.TABLE.h + 0.05];
    let q = null;
    for (const yaw of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) {
      const c = L.stretchIK(p, yaw);
      if (c && (!q || c.pitch < q.pitch)) q = c;
    }
    if (!q) band = `no IK at ${x.toFixed(2)},${y.toFixed(2)}`;
    else if (!within(q)) band = `limits at ${x.toFixed(2)},${y.toFixed(2)}`;
    else if (hit(p, q) > 0.002) band = `round trip ${hit(p, q) * 1000} mm at ${x.toFixed(2)},${y.toFixed(2)}`;
    if (band) break;
  }
  check(!band, band || "the layout band is reachable top-down, inside the joint limits, within 2 mm");

  const nearPose = L.stretchIK([0, -0.05, L.TABLE.h + 0.06], 0);
  check(nearPose && nearPose.pitch < -1.0, "a near grasp pitches the wrist down");
  check(L.stretchIK([0, 2, 0.8], 0) === null, "a point past the arm is unreachable");

  const order = ["pregrasp", "descend", "close", "lift", "retract"];
  const seq = ["clear", "base", "reobserve", "pregrasp", "descend", "close", "lift", "retract"];
  const qHome = { x: 0, lift: 0.86, arm: 0, yaw: 0, pitch: -0.55, roll: 0, grip: 0.07, pan: 0, tilt: -0.75 };
  const keys = ["x", "lift", "arm", "yaw", "pitch", "roll", "grip", "pan", "tilt"];
  const only = (a, b, key) => keys.every((k) => k === key || Math.abs(a[k] - b[k]) <= 1e-6);
  const bodyTop = (o) => {
    const H = L.dimsOf(o).h;
    if (o.cat === "cup" && o.lid) return H + L.OBJ_SHAPE.cup.lidExtra;
    if (o.cat === "bottle" && o.lid) return H + L.OBJ_SHAPE.bottle.capExtra;
    return H;
  };
  let sceneBad = "";
  let nObj = 0;
  let nFail = 0;
  for (const scene of L.SCENES) {
    if (scene.set !== "offline" || sceneBad) continue;
    let laid;
    try { laid = L.layoutScene(scene, 1); } catch (e) { sceneBad = `${scene.id} layout: ${e.message}`; continue; }
    for (const o of laid.objects) {
      nObj++;
      const plan = L.planGrasp(o);
      const dims = L.dimsOf(o);
      const zLocal = plan.p[2] - L.TABLE.h;
      const span = (o.cat === "fork" || o.cat === "spoon") ? L.utensilWidthAt(o, plan.xLocal) : 2 * L.objRadiusAt(o, zLocal);
      const face = plan.width / 2 + S.tool.cupX - S.tool.mouth;
      const gap = face - span / 2;
      if (plan.ok !== true) { sceneBad = `${scene.id} ${o.id} plan ${plan.reason}`; break; }
      if (plan.mode !== (o.cat === "fork" || o.cat === "spoon" ? "pca" : "compact")) { sceneBad = `${scene.id} ${o.id} mode`; break; }
      if (!(span > 0.004) || Math.abs(gap) > 0.002 || plan.width > S.gripper.max + 1e-9) { sceneBad = `${scene.id} ${o.id} gap ${(gap * 1000).toFixed(2)} mm span ${span}`; break; }
      if (!(plan.approach[2] > 0)) { sceneBad = `${scene.id} ${o.id} approach`; break; }
      const q = L.stretchIK(plan.p, plan.yaw);
      if (!q || !within(q)) { sceneBad = `${scene.id} ${o.id} IK limits`; break; }
      const err = hit(plan.p, q);
      if (err > 0.002) { sceneBad = `${scene.id} ${o.id} round trip ${err * 1000} mm`; break; }
      const closeAx = L.stretchFK(q).close;
      const axis = [Math.cos(o.yaw || 0), Math.sin(o.yaw || 0)];
      const dot = closeAx[0] * axis[0] + closeAx[1] * axis[1];
      if ((plan.mode === "pca" || o.handle) && Math.abs(dot) > 0.02) { sceneBad = `${scene.id} ${o.id} closing not across the narrow axis`; break; }
      if (o.cat === "bottle" && plan.p[2] + S.tool.palm < L.TABLE.h + dims.h - 0.002) { sceneBad = `${scene.id} ${o.id} palm inside the bottle`; break; }
      if (o.cat === "fork" || o.cat === "spoon") {
        const handleH = dims.h * (o.cat === "fork" ? L.OBJ_SHAPE.fork.handleH : L.OBJ_SHAPE.spoon.handleH);
        if (plan.p[2] < L.TABLE.h + handleH - 0.001 - 1e-4 || plan.p[2] > L.TABLE.h + handleH + 1e-4) { sceneBad = `${scene.id} ${o.id} grasp not on the handle`; break; }
      }
      const others = laid.objects.filter((p) => p !== o);
      const segs = L.graspWaypoints(o, qHome, others);
      if (!Array.isArray(segs)) {
        if (!segs || segs.ok !== false || typeof segs.reason !== "string") { sceneBad = `${scene.id} ${o.id} bad failure`; break; }
        nFail++;
        continue;
      }
      const kinds = segs.map((s) => s.kind);
      let last = -1;
      for (let i = 0; i < kinds.length; i++) {
        const at = seq.indexOf(kinds[i]);
        if (at < 0 || at <= last) { sceneBad = `${scene.id} ${o.id} order ${kinds.join(",")}`; break; }
        last = at;
      }
      if (sceneBad) break;
      if (!order.every((k) => kinds.includes(k))) { sceneBad = `${scene.id} ${o.id} missing ${kinds.join(",")}`; break; }
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (!(s.t1 > s.t0) || (i > 0 && Math.abs(s.t0 - segs[i - 1].t1) > 1e-9)) { sceneBad = `${scene.id} ${o.id} times`; break; }
        if (!within(s.q0) || !within(s.q1)) { sceneBad = `${scene.id} ${o.id} segment limits ${s.kind}`; break; }
        if (s.kind === "clear" && !only(s.q0, s.q1, "lift")) { sceneBad = `${scene.id} ${o.id} clear is not lift-only`; break; }
        if (s.kind === "base" && !only(s.q0, s.q1, "x")) { sceneBad = `${scene.id} ${o.id} base is not x-only`; break; }
        if (s.kind === "descend" && !only(s.q0, s.q1, "lift")) { sceneBad = `${scene.id} ${o.id} descend is not vertical`; break; }
        if (s.kind === "lift" && !only(s.q0, s.q1, "lift")) { sceneBad = `${scene.id} ${o.id} lift is not vertical`; break; }
        if (s.kind === "retract" && !only(s.q0, s.q1, "arm")) { sceneBad = `${scene.id} ${o.id} retract moves more than the arm`; break; }
        if (s.kind === "close" && !only(s.q0, s.q1, "grip")) { sceneBad = `${scene.id} ${o.id} close moves more than the grip`; break; }
      }
      if (sceneBad) break;
      const dx = Math.abs(segs.find((s) => s.kind === "pregrasp").q1.x - qHome.x);
      const re = kinds.includes("reobserve");
      if (re !== (dx > 0.10)) { sceneBad = `${scene.id} ${o.id} reobserve dx ${dx.toFixed(3)}`; break; }
      if (re && Math.abs(segs.find((s) => s.kind === "reobserve").t1 - segs.find((s) => s.kind === "reobserve").t0 - 0.5) > 1e-9) { sceneBad = `${scene.id} ${o.id} reobserve duration`; break; }
      const pre = segs.find((s) => s.kind === "pregrasp");
      const cl = segs.find((s) => s.kind === "close");
      if (Math.abs(pre.q0.lift - pre.q1.lift) > 1e-6) { sceneBad = `${scene.id} ${o.id} pregrasp changes lift`; break; }
      if (pre.q1.grip + 1e-9 < plan.width || pre.q1.grip > S.gripper.max + 1e-9) { sceneBad = `${scene.id} ${o.id} pregrasp opening`; break; }
      if (Math.abs(cl.q1.grip - plan.width) > 1e-9) { sceneBad = `${scene.id} ${o.id} close width`; break; }
      const down = segs.find((s) => s.kind === "descend");
      if (!(L.stretchFK(down.q1).p[2] < L.stretchFK(pre.q1).p[2] - 0.01)) { sceneBad = `${scene.id} ${o.id} descend does not drop`; break; }
    }
  }
  check(!sceneBad, sceneBad || `local contact within 2 mm, IK and collision-free order on ${nObj} offline objects (${nFail} explicit failures)`);

  const tall = L.planGrasp({ id: "o1", cat: "bottle", color: "green", size: "large", material: "glass", handle: false, lid: true, x: 0.1, y: 0, yaw: 0.2 });
  const half = L.TABLE.h + L.DIMS.bottle.large.h * 0.5;
  check(tall.ok === true && tall.p[2] > half + 0.02, "a tall bottle is grasped above the centre slice so the palm clears the cap");

  const farObj = { id: "o9", cat: "cup", color: "white", size: "small", material: "ceramic", handle: false, lid: false, x: 0, y: 2, yaw: 0 };
  const farPlan = L.planGrasp(farObj);
  const farW = L.graspWaypoints(farObj, qHome, []);
  check(farPlan.ok === false && farPlan.reason === "unreachable" && !Array.isArray(farW) && farW.ok === false && farW.reason === "unreachable", "an out-of-reach object is an explicit failure");

  const cup = { id: "o1", cat: "cup", color: "white", size: "small", material: "ceramic", handle: false, lid: false, x: 0.1, y: 0, yaw: 0 };
  const bottle = { id: "o2", cat: "bottle", color: "green", size: "large", material: "glass", handle: false, lid: false, x: 0.1, y: -0.12, yaw: 0 };
  const corridor = L.graspWaypoints(cup, qHome, [bottle]);
  let corridorMsg = "a cup in front of a large bottle clears it by 20 mm";
  if (!Array.isArray(corridor)) corridorMsg = `corridor plan failed: ${corridor && corridor.reason}`;
  else {
    const liftSeg = corridor.find((s) => s.kind === "lift");
    const closeSeg = corridor.find((s) => s.kind === "close");
    const bottom = L.TABLE.h + (liftSeg.q1.lift - closeSeg.q1.lift);
    const bottleTop = L.TABLE.h + L.DIMS.bottle.large.h;
    if (bottom < bottleTop + 0.02 - 1e-6) corridorMsg = `held bottom ${bottom.toFixed(3)} vs bottle top ${bottleTop.toFixed(3)}`;
    else corridorMsg = "";
  }
  check(!corridorMsg, corridorMsg || "a cup in front of a large bottle clears it by 20 mm");

  // Fingertip, palm and the held footprint against every other solid, every scene, seeds 1..5.
  const gripBuf = [0, 0, 0];
  const qSamp = { x: 0, lift: 0, arm: 0, yaw: 0, pitch: 0, roll: 0, grip: 0, pan: 0, tilt: 0 };
  let sweepBad = "";
  let nOk = 0;
  let nSkip = 0;
  const pointIn = (x, y, z, solid) => {
    if (z <= solid.z0 + 1e-4 || z >= solid.z1 - 1e-4) return false;
    const discs = solid.discs;
    for (let i = 0; i < discs.length; i++) {
      const d = discs[i];
      if (Math.hypot(x - d[0], y - d[1]) < d[2] - 5e-4) return true;
    }
    return false;
  };
  const samplesOf = (a, b) => {
    const travel = Math.abs(b.x - a.x) + Math.abs(b.lift - a.lift) + Math.abs(b.arm - a.arm)
      + Math.abs(b.yaw - a.yaw) * 0.55 + Math.abs(b.pitch - a.pitch) * 0.16 + Math.abs(b.roll - a.roll) * 0.08;
    return Math.max(2, Math.ceil(travel / 0.008));
  };
  const sweep = (obj, segs, solids, selfSolid) => {
    const closeSeg = segs.find((s) => s.kind === "close");
    const descendSeg = segs.find((s) => s.kind === "descend");
    const closeTip = [0, 0, 0];
    L.kinToolPoint(closeSeg.q1, 0, S.tool.tip, 0, closeTip);
    const myTop = bodyTop(obj);
    const myDiscs = L.footprintDiscs(obj, obj.x, obj.y, obj.yaw || 0);
    for (let si = 0; si < segs.length; si++) {
      const seg = segs[si];
      const n = samplesOf(seg.q0, seg.q1);
      const allowTarget = seg.kind === "descend" || seg.kind === "close" || (descendSeg && seg === descendSeg);
      const carried = seg.kind === "lift" || seg.kind === "retract" || (closeSeg && seg.t0 >= closeSeg.t1 - 1e-9);
      for (let k = 0; k <= n; k++) {
        const u = k / n;
        for (let j = 0; j < 9; j++) qSamp[keys[j]] = seg.q0[keys[j]] + (seg.q1[keys[j]] - seg.q0[keys[j]]) * u;
        const pts = L.kinGripPoints(qSamp.grip);
        for (let p = 0; p < pts.length; p++) {
          L.kinToolPoint(qSamp, pts[p][0], pts[p][1], pts[p][2], gripBuf);
          for (let s = 0; s < solids.length; s++) {
            if (pointIn(gripBuf[0], gripBuf[1], gripBuf[2], solids[s])) return `${seg.kind} gripper in ${solids[s].id}`;
          }
          if (!allowTarget && L.kinHitsSolid(obj, gripBuf[0], gripBuf[1], gripBuf[2])) return `${seg.kind} gripper in the target`;
        }
        if (!carried) continue;
        L.kinToolPoint(qSamp, 0, S.tool.tip, 0, gripBuf);
        const dx = gripBuf[0] - closeTip[0], dy = gripBuf[1] - closeTip[1];
        const bot = L.TABLE.h + (gripBuf[2] - closeTip[2]);
        const top = bot + myTop;
        for (let s = 0; s < solids.length; s++) {
          const solid = solids[s];
          if (bot >= solid.z1 - 1e-4 || top <= solid.z0 + 1e-4) continue;
          for (let a = 0; a < myDiscs.length; a++) {
            const d = myDiscs[a];
            const nd = solid.discs;
            for (let b = 0; b < nd.length; b++) {
              if (Math.hypot(d[0] + dx - nd[b][0], d[1] + dy - nd[b][1]) < d[2] + nd[b][2] - 5e-4) return `${seg.kind} held footprint in ${solid.id}`;
            }
          }
        }
      }
    }
    return "";
  };
  if (sceneBad || corridorMsg) {
    nOk = 101;
  } else for (const scene of L.SCENES) {
    if (sweepBad) break;
    for (let seed = 1; seed <= 5; seed++) {
      if (sweepBad) break;
      let laid;
      try { laid = L.layoutScene(scene, seed); } catch (e) { sweepBad = `${scene.id}#${seed} layout: ${e.message}`; break; }
      const objs = laid.objects;
      for (let pass = 0; pass < 2; pass++) {
        let qCur = qHome;
        for (let i = 0; i < objs.length; i++) {
          const o = objs[i];
          const others = [];
          for (let j = 0; j < objs.length; j++) if (j !== i) others.push(objs[j]);
          const segs = L.graspWaypoints(o, pass === 0 ? qHome : qCur, others);
          if (!Array.isArray(segs)) {
            if (!segs || segs.ok !== false || typeof segs.reason !== "string") { sweepBad = `${scene.id}#${seed} ${o.id} bad failure`; break; }
            nSkip++;
            continue;
          }
          const solids = others.map((p) => ({ id: p.id, z0: L.TABLE.h, z1: L.TABLE.h + bodyTop(p), discs: L.footprintDiscs(p, p.x, p.y, p.yaw || 0) }));
          const why = sweep(o, segs, solids, null);
          if (why) { sweepBad = `${scene.id}#${seed} ${o.id} ${why}`; break; }
          nOk++;
          if (pass === 1) qCur = segs[segs.length - 1].q1;
        }
        if (sweepBad) break;
      }
    }
  }
  check(!sweepBad && nOk > 100, sweepBad || `collision-free gripper and held footprint on ${nOk} grasps (${nSkip} explicit failures) over every scene, seeds 1..5`);
}

export const perturbations = [
  { name: "lift ends swapped", find: "lift: Object.freeze({ min: 0.20, max: 1.29 })", replace: "lift: Object.freeze({ min: 1.29, max: 0.20 })" },
  { name: "arm extended reach shortened", find: "gripY: Object.freeze({ retracted: 0.28, extended: 0.80 })", replace: "gripY: Object.freeze({ retracted: 0.28, extended: 0.40 })" },
  { name: "camera height dropped by 30 cm", find: "d435i: Object.freeze({ x: 0.003, y: 0.045, z: 1.322 })", replace: "d435i: Object.freeze({ x: 0.003, y: 0.045, z: 1.00 })" },
  { name: "top-down pitch flattened", find: "const kinDown = -Math.PI / 2;", replace: "const kinDown = 0;" },
  { name: "reobserve threshold raised", find: "const kinBaseMove = 0.10;", replace: "const kinBaseMove = 5;" },
  { name: "grasp clearance wider than the aperture", find: "const kinClearance = 0.008;", replace: "const kinClearance = 0.20;" },
  { name: "safe-height margin removed", find: "const kinSafe = 0.02;", replace: "const kinSafe = 0;" },
  { name: "width taken from body diameter", find: "return 2 * objRadiusAt(obj, zLocal);", replace: "return dimsOf(obj).d;" },
];
