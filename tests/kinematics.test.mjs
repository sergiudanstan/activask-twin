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
  const qHome = { x: 0, lift: 0.86, arm: 0, yaw: 0, pitch: -0.55, roll: 0, grip: 0.07, pan: 0, tilt: -0.75 };
  let sceneBad = "";
  let nObj = 0;
  for (const scene of L.SCENES) {
    if (scene.set !== "offline" || sceneBad) continue;
    let laid;
    try { laid = L.layoutScene(scene, 1); } catch (e) { sceneBad = `${scene.id} layout: ${e.message}`; continue; }
    for (const o of laid.objects) {
      nObj++;
      const plan = L.planGrasp(o);
      const dims = L.dimsOf(o);
      const span = plan.mode === "pca" ? dims.w : dims.d;
      if (plan.mode !== (o.cat === "fork" || o.cat === "spoon" ? "pca" : "compact")) { sceneBad = `${scene.id} ${o.id} mode`; break; }
      if (!(plan.width >= span - 1e-9 && plan.width <= span + 0.02 && plan.width <= S.gripper.max + 1e-9)) { sceneBad = `${scene.id} ${o.id} width ${plan.width}`; break; }
      if (!(plan.approach[2] > 0)) { sceneBad = `${scene.id} ${o.id} approach`; break; }
      const q = L.stretchIK(plan.p, plan.yaw);
      if (!q || !within(q)) { sceneBad = `${scene.id} ${o.id} IK limits`; break; }
      const err = hit(plan.p, q);
      if (err > 0.002) { sceneBad = `${scene.id} ${o.id} round trip ${err * 1000} mm`; break; }
      const close = L.stretchFK(q).close;
      const axis = [Math.cos(o.yaw || 0), Math.sin(o.yaw || 0)];
      const dot = close[0] * axis[0] + close[1] * axis[1];
      if ((plan.mode === "pca" || o.handle) && Math.abs(dot) > 0.02) { sceneBad = `${scene.id} ${o.id} closing not across the narrow axis`; break; }
      if (o.cat === "bottle" && plan.p[2] + S.tool.palm < L.TABLE.h + dims.h - 0.002) { sceneBad = `${scene.id} ${o.id} palm inside the bottle`; break; }
      if ((o.cat === "fork" || o.cat === "spoon") && plan.p[2] < L.TABLE.h + S.tool.cupR - 1e-6) { sceneBad = `${scene.id} ${o.id} fingers in the table`; break; }
      const segs = L.graspWaypoints(o, qHome);
      if (!segs.length) { sceneBad = `${scene.id} ${o.id} no waypoints`; break; }
      const kinds = segs.map((s) => s.kind);
      const core = kinds.filter((k) => order.includes(k));
      if (core.join(",") !== order.join(",")) { sceneBad = `${scene.id} ${o.id} order ${kinds.join(",")}`; break; }
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        if (!(s.t1 > s.t0) || (i > 0 && Math.abs(s.t0 - segs[i - 1].t1) > 1e-9)) { sceneBad = `${scene.id} ${o.id} times`; break; }
        if (!within(s.q0) || !within(s.q1)) { sceneBad = `${scene.id} ${o.id} segment limits ${s.kind}`; break; }
      }
      if (sceneBad) break;
      const dx = Math.abs(segs.find((s) => s.kind === "pregrasp").q1.x - qHome.x);
      const re = kinds.includes("reobserve");
      if (re !== (dx > 0.10)) { sceneBad = `${scene.id} ${o.id} reobserve dx ${dx.toFixed(3)}`; break; }
      if (re && Math.abs(segs.find((s) => s.kind === "reobserve").t1 - segs.find((s) => s.kind === "reobserve").t0 - 0.5) > 1e-9) { sceneBad = `${scene.id} ${o.id} reobserve duration`; break; }
      const pre = segs.find((s) => s.kind === "pregrasp");
      const cl = segs.find((s) => s.kind === "close");
      if (pre.q1.grip + 1e-9 < plan.width || pre.q1.grip > S.gripper.max + 1e-9) { sceneBad = `${scene.id} ${o.id} pregrasp opening`; break; }
      if (Math.abs(cl.q1.grip - plan.width) > 1e-9) { sceneBad = `${scene.id} ${o.id} close width`; break; }
      if (!(cl.q1.z === undefined)) { /* q has no z */ }
      const down = segs.find((s) => s.kind === "descend");
      if (!(L.stretchFK(down.q1).p[2] < L.stretchFK(pre.q1).p[2] - 0.01)) { sceneBad = `${scene.id} ${o.id} descend does not drop`; break; }
    }
  }
  check(!sceneBad, sceneBad || `IK round trip, limits, PCA close and waypoints on ${nObj} offline objects`);

  const tall = L.planGrasp({ id: "o1", cat: "bottle", color: "green", size: "large", material: "glass", handle: false, lid: true, x: 0.1, y: 0, yaw: 0.2 });
  const half = L.TABLE.h + L.DIMS.bottle.large.h * 0.5;
  check(tall.p[2] > half + 0.02, "a tall bottle is grasped above the centre slice so the palm clears the cap");
}

export const perturbations = [
  { name: "lift ends swapped", find: "lift: Object.freeze({ min: 0.20, max: 1.29 })", replace: "lift: Object.freeze({ min: 1.29, max: 0.20 })" },
  { name: "arm extended reach shortened", find: "gripY: Object.freeze({ retracted: 0.28, extended: 0.80 })", replace: "gripY: Object.freeze({ retracted: 0.28, extended: 0.40 })" },
  { name: "camera height dropped by 30 cm", find: "d435i: Object.freeze({ x: 0.003, y: 0.045, z: 1.322 })", replace: "d435i: Object.freeze({ x: 0.003, y: 0.045, z: 1.00 })" },
  { name: "top-down pitch flattened", find: "const kinDown = -Math.PI / 2;", replace: "const kinDown = 0;" },
  { name: "reobserve threshold raised", find: "const kinBaseMove = 0.10;", replace: "const kinBaseMove = 5;" },
  { name: "grasp clearance wider than the aperture", find: "const kinClearance = 0.008;", replace: "const kinClearance = 0.20;" },
];
