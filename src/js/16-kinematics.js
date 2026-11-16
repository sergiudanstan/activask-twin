// ================================================================ Stretch 3 specifications (M1)
// Pure logic: no DOM, no three.js. The build keeps this file inside the logic block.
// Ranges are metres or radians. Each line cites the page the number comes from.
// docs.hello-robot.com no longer hosts the Stretch 3 guide (the live docs have moved on to Stretch 4);
// the guide text is the Hello Robot hardware-guide repo that site published.
const kinGuide = "https://github.com/hello-robot/stretch_hardware_guides/blob/master/docs/hardware_guide_stretch_3.md";
const kinSheet = "https://github.com/hello-robot/stretch_hardware_guides/blob/master/docs/images/Stretch_3_Datasheet_2.2024.png"; // rev 2.14.2024
const kinGrip = "https://hello-robot.com/stretchgripper3-specs";
const kinUrdf = "https://github.com/hello-robot/stretch_forcesight/blob/main/stretch_uncalibrated.urdf";
const kinDeg = (d) => d * Math.PI / 180;

const STRETCH = Object.freeze({
  // Datasheet "Size 33 x 34 x 141 cm" does not assign the two footprint axes. The published URDF puts the
  // drive wheels at y = ±0.17035 (0.34 m across the axles), so 0.34 is the wheel-to-wheel width and 0.33 is
  // the length. In this twin the arm points along +y and the wheels sit on ±x, so x is the 0.34 m width.
  footprint: Object.freeze({ x: 0.34, y: 0.33 }), // kinSheet, axis split from kinUrdf wheel joints
  baseHeight: 0.12, // TODO-SOURCE shell height. Datasheet gives only the 1.41 m overall. 0.12 m sits just above the 4 inch wheels.
  wheelDiameter: 0.1016, // 4 inch drive wheels, kinGuide "Drive wheels"
  mastHeight: 1.33, // kinUrdf joint_head origin y = 1.33 along link_mast (respeaker ends at z = 1.401, matching the 1.41 m overall)
  overallHeight: 1.41, // kinSheet "Size 33 x 34 x 141 cm"
  // Arm-centre height above the floor. URDF joint_lift is 0..1.095 along +z and the carriage origin is at
  // z = 0.195 when the joint is 0, so the axis runs 0.195..1.290. Rounded to 0.20..1.29.
  lift: Object.freeze({ min: 0.20, max: 1.29 }), // kinUrdf joint_lift upper 1.095; kinGuide does not restate the travel in text
  arm: Object.freeze({
    min: 0,
    max: 0.52, // kinGuide "Reach: 0.52m"
    segments: 5, // kinGuide "5 telescoping aluminum links"
    retracted: 0.255, // kinUrdf joint_arm_l4 offset 0.2547 m. kinGuide: the retracted arm and wrist fit inside the base footprint
  }),
  // Fingertip y in the base frame (arm along +y) at yaw = pitch = roll = 0.
  // retracted parks the tool just over the near table edge; extended = retracted + arm.max.
  // TODO-SOURCE the factory does not publish a fingertip coordinate, only the 0.52 m reach.
  gripY: Object.freeze({ retracted: 0.28, extended: 0.80 }),
  wrist: Object.freeze({
    yaw: Object.freeze({ min: kinDeg(-76), max: kinDeg(256) }), // kinGuide wrist yaw +256/−76 deg
    pitch: Object.freeze({ min: kinDeg(-90), max: kinDeg(20) }), // kinGuide wrist pitch +20/−90 deg
    roll: Object.freeze({ min: kinDeg(-172.5), max: kinDeg(172.5) }), // kinGuide wrist roll ±172.5 deg
  }),
  gripper: Object.freeze({ min: 0, max: 0.15 }), // kinGrip "Max grasp aperture 15 cm"
  head: Object.freeze({
    pan: Object.freeze({ min: kinDeg(-234), max: kinDeg(112) }), // kinGuide head pan −234..112 deg (range 346)
    // The guide's tilt diagram is −25..+90 deg. That stop cannot aim CAM_POSE (about −43 deg down).
    // The published URDF joint_head_tilt lower limit is −1.53 rad, which does include the table view.
    // The twin uses the URDF lower stop so the head can look at the table. Upper stop stays the guide's +90 deg.
    tilt: Object.freeze({ min: -1.53, max: kinDeg(90) }), // lower: kinUrdf; upper: kinGuide +90 deg. Diagram min −25 deg does not reach the table.
  }),
  // Colour optical centre in the base frame at pan = tilt = 0: x right, y forward (arm), z up.
  // FK of kinUrdf camera_color_optical_frame. Stretch 3's head camera is a D435if (same body as the paper's D435i).
  d435i: Object.freeze({ x: 0.003, y: 0.045, z: 1.322 }), // kinUrdf; height 1.322 m vs CAM_POSE 1.30 m (22 mm, inside 50 mm)
  payload: 2, // kinSheet "Payload (including gripper) 2 Kg"; kinGuide arm "Recommended Max payload - 2kg"
  // Tool chain of the mesh in 40-stretch.js, so stretchFK and the rendered fingertip share one set of numbers.
  // Distal link y = stow0 + arm (that link's share is 1) and the yaw origin sits armLen0 further along +y.
  // Then pitch, roll and the fingertip are offsets along the wrist +y. At pitch 0:
  // 0.012 + 0.130 + 0.015 + 0.030 + 0.093 = 0.280 = gripY.retracted.
  tool: Object.freeze({
    stow0: 0.012,
    armLen0: 0.130,
    pitch: 0.015,
    roll: 0.030,
    tip: 0.093,
    palm: 0.047, // fingertip y 0.093 minus the palm face at y 0.046 (palm rbox centre 0.028, depth 0.036)
    cupR: 0.011, // suction-cup radius on that mesh
  }),
  // Joint speeds used to time waypoints. Metres/second or radians/second.
  speed: Object.freeze({
    // The hardware guide and the datasheet do not publish a linear base speed.
    // 0.15 m/s is the example base.motion.default.vel_m in the Stretch Body guide. TODO-SOURCE factory Stretch 3 figure.
    // https://docs.hello-robot.com/0.1/stretch_body_guide/
    base: 0.15,
    // Printed RobotParams lift.motion.default.vel_m (Hello Robot forum, live params dump).
    // https://forum.hello-robot.com/t/ros-integration-for-custom-motion-profiles/702
    lift: 0.095,
    // Stretch Body guide, arm motion default vel_m 0.14. The Stretch 3 fast profile in
    // stretch_dex_teleop robot_move.py (`fastest_stretch_3`) is 0.18 m/s; the twin uses the guide default.
    arm: 0.14,
    // Same forum dump: wrist_yaw.motion.default.vel = 2.0 rad/s.
    yaw: 2.0,
    pitch: 2.0, // TODO-SOURCE. Same default family as wrist yaw. Dex-teleop fast pitch is 3.0 rad/s.
    roll: 2.0, // TODO-SOURCE. Dex-teleop fast roll is 4.5 rad/s. The factory default was not in that dump.
    grip: 0.08, // TODO-SOURCE aperture m/s. The dynamixel speed is motor rad/s, not metres of opening.
    head: 1.5, // TODO-SOURCE. Re-observe itself is fixed at 0.5 s (below), not integrated from this speed.
  }),
});

// Twin timing floors and grasp clearances. Not in the paper or the hardware guide.
const kinClearance = 0.008; // TODO-SOURCE extra opening beyond the object width (m)
const kinOpenMargin = 0.04; // TODO-SOURCE how much further the gripper opens at pregrasp (m)
const kinLiftOff = 0.12; // TODO-SOURCE lift after the fingers close (m)
const kinAbove = 0.025; // TODO-SOURCE fingertip clearance above the object top at pregrasp (m)
const kinBaseMove = 0.10; // re-observe after a base move larger than this (m), task brief Sec. 3.5
const kinReobserve = 0.5; // re-observe duration (s), task brief Sec. 3.5
const kinMinSeg = 0.2; // TODO-SOURCE shortest segment so a small joint step still advances time
const kinDown = -Math.PI / 2; // top-down pitch the IK aims for (hardware pitch stop is this value)
const kinGap = 0.004; // palm stays this far above a tall body (m)

const kinJoints = ["x", "lift", "arm", "yaw", "pitch", "roll", "grip", "pan", "tilt"];

function kinQ(q) {
  return {
    x: q.x, lift: q.lift, arm: q.arm, yaw: q.yaw, pitch: q.pitch,
    roll: q.roll, grip: q.grip, pan: q.pan, tilt: q.tilt,
  };
}

// Writes the fingertip centre and the finger closing axis (gripper local +x) into out. No allocations.
function kinFK(q, out) {
  const tool = STRETCH.tool;
  const pitch = q.pitch, yaw = q.yaw, roll = q.roll;
  const along = tool.roll + tool.tip;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const yIn = tool.pitch + along * cp;
  const zIn = along * sp;
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  out.p[0] = ROBOT.base[0] + q.x - yIn * sy;
  out.p[1] = ROBOT.base[1] + tool.stow0 + tool.armLen0 + q.arm + yIn * cy;
  out.p[2] = ROBOT.base[2] + q.lift + zIn;
  const cr = Math.cos(roll), sr = Math.sin(roll);
  out.close[0] = cy * cr - sy * sr * sp;
  out.close[1] = sy * cr + cy * sr * sp;
  out.close[2] = -sr * cp;
}

function stretchFK(q) {
  const out = { p: [0, 0, 0], close: [0, 0, 0] };
  kinFK(q, out);
  return out;
}

// One equivalent yaw inside the wrist stop, or null when the orientation is in the dead zone.
function kinWrapYaw(yaw) {
  if (!Number.isFinite(yaw)) return null;
  const lo = STRETCH.wrist.yaw.min, hi = STRETCH.wrist.yaw.max, turn = Math.PI * 2;
  let y = yaw;
  for (let i = 0; i < 4; i++) {
    if (y < lo - 1e-9) y += turn;
    else if (y > hi + 1e-9) y -= turn;
    else return Math.min(hi, Math.max(lo, y));
  }
  return null;
}

// Top-down IK. Wrist pitch stays in [kinDown, 0], as close to straight down as the arm reach allows.
// Roll stays 0 so the fingers close horizontally. x is a base slide and is not a hardware joint.
function stretchIK(p, yaw) {
  const yawN = kinWrapYaw(yaw);
  if (yawN === null) return null;
  const tool = STRETCH.tool;
  const along = tool.roll + tool.tip;
  const down = Math.max(kinDown, STRETCH.wrist.pitch.min);
  const yMin = tool.pitch + along * Math.cos(down);
  const yMax = tool.pitch + along; // pitch 0, the furthest the fingertip reaches along +y
  const cy = Math.cos(yawN), sy = Math.sin(yawN);
  const yawBase = tool.stow0 + tool.armLen0;
  const target = p[1] - ROBOT.base[1] - yawBase;
  const amin = STRETCH.arm.min, amax = STRETCH.arm.max;
  let yLo, yHi;
  if (Math.abs(cy) < 1e-6) {
    if (target < amin - 1e-6 || target > amax + 1e-6) return null;
    yLo = yMin;
    yHi = yMax;
  } else if (cy > 0) {
    yLo = (target - amax) / cy;
    yHi = (target - amin) / cy;
  } else {
    yLo = (target - amin) / cy;
    yHi = (target - amax) / cy;
  }
  const lo = Math.max(yLo, yMin), hi = Math.min(yHi, yMax);
  if (lo > hi + 1e-9) return null;
  // Most downward pitch is the smallest yIn. A higher lift that would pass the stop forces the wrist up.
  let yIn = lo;
  const liftAt = (y) => {
    const c = clamp((y - tool.pitch) / along, -1, 1);
    const s = -Math.sqrt(Math.max(0, 1 - c * c));
    return p[2] - ROBOT.base[2] - along * s;
  };
  if (liftAt(hi) > STRETCH.lift.max + 1e-6) return null;
  if (liftAt(yIn) > STRETCH.lift.max) {
    let a = yIn, b = hi;
    for (let i = 0; i < 24; i++) {
      const m = (a + b) * 0.5;
      if (liftAt(m) > STRETCH.lift.max) a = m;
      else b = m;
    }
    yIn = b;
  }
  const lift = liftAt(yIn);
  if (lift < STRETCH.lift.min - 1e-6) return null;
  const c = clamp((yIn - tool.pitch) / along, -1, 1);
  const pitch = -Math.acos(c);
  if (pitch < STRETCH.wrist.pitch.min - 1e-6 || pitch > STRETCH.wrist.pitch.max + 1e-6) return null;
  const arm = target - yIn * cy;
  if (arm < amin - 1e-6 || arm > amax + 1e-6) return null;
  return {
    x: p[0] - ROBOT.base[0] + yIn * sy,
    lift, arm, yaw: yawN, pitch, roll: 0, grip: 0,
    pan: 0, tilt: 0,
  };
}

// Grasp height. Cups use the centre slice. A tall bottle is raised until the palm (tool.palm above the
// fingertip) clears the cap; if the body is taller than the finger can clear, the highest on-body point
// is used. That is the paper's bottle failure mode, "height and clearance constraints" (Table 10).
// A fork or spoon is only millimetres thick, so the centre would put the suction cups through the table;
// the point rises to one cup radius, and the fingers still close across the narrow axis.
function kinGraspZ(o) {
  const H = dimsOf(o).h;
  const top = TABLE.h + H;
  const centre = TABLE.h + H * 0.5;
  const low = TABLE.h + STRETCH.tool.cupR;
  const high = top - Math.min(STRETCH.tool.cupR, H * 0.5);
  if (o.cat === "fork" || o.cat === "spoon") return Math.max(centre, low);
  let z = centre;
  const raised = top + kinGap - STRETCH.tool.palm;
  if (raised > centre) z = raised;
  if (z > high) z = high;
  if (z < low) z = low;
  return z;
}

function kinYawCandidates(o) {
  const a = o.yaw || 0;
  // Closing direction is gripper +x at roll 0, which is (cos wristYaw, sin wristYaw).
  // Compact, with a handle along local +x: close perpendicular to that handle.
  // Compact, no handle: a round section, so an axis-aligned close is enough.
  // PCA: the major axis is local +x, so the fingers close on local +y, which is the same perpendicular.
  if (o.cat === "fork" || o.cat === "spoon" || o.handle) return [a + Math.PI / 2, a - Math.PI / 2];
  return [0, Math.PI, a + Math.PI / 2, a - Math.PI / 2];
}

function planGrasp(obj) {
  const mode = obj.cat === "fork" || obj.cat === "spoon" ? "pca" : "compact";
  const dims = dimsOf(obj);
  const span = mode === "pca" ? dims.w : dims.d;
  const width = clamp(span + kinClearance, STRETCH.gripper.min, STRETCH.gripper.max);
  const z = kinGraspZ(obj);
  const p = [obj.x, obj.y, z];
  const top = TABLE.h + dims.h;
  const stand = Math.max(0.06, top + kinAbove - z);
  let best = null, bestYaw = 0, bestScore = Infinity;
  const cands = kinYawCandidates(obj);
  for (let i = 0; i < cands.length; i++) {
    const q = stretchIK(p, cands[i]);
    if (!q) continue;
    // More downward pitch wins. A tie prefers the yaw that points the wrist offset along +y (more reach).
    const score = q.pitch * 1000 - Math.cos(q.yaw);
    if (score < bestScore) { bestScore = score; best = q; bestYaw = q.yaw; }
  }
  const yaw = best ? bestYaw : (kinWrapYaw(cands[0]) ?? 0);
  return { mode, p, yaw, width, approach: [0, 0, stand] };
}

function kinSegDt(q0, q1) {
  const s = STRETCH.speed;
  const rates = [s.base, s.lift, s.arm, s.yaw, s.pitch, s.roll, s.grip, s.head, s.head];
  let dt = 0;
  for (let i = 0; i < kinJoints.length; i++) {
    const d = Math.abs(q1[kinJoints[i]] - q0[kinJoints[i]]) / rates[i];
    if (d > dt) dt = d;
  }
  return Math.max(dt, kinMinSeg);
}

// Head pan/tilt that aim the D435i optical axis at a cell-frame point. Matches stretchHeadCam's axes:
// pan about z, tilt about x, optical axis ( -sin pan cos tilt, cos pan cos tilt, sin tilt ).
function kinLook(qx, target) {
  const camX = ROBOT.base[0] + qx + (CAM_POSE.pos[0] - ROBOT.base[0]);
  const camY = CAM_POSE.pos[1];
  const camZ = CAM_POSE.pos[2];
  let dx = target[0] - camX, dy = target[1] - camY, dz = target[2] - camZ;
  const n = Math.hypot(dx, dy, dz) || 1;
  dx /= n; dy /= n; dz /= n;
  return {
    pan: clamp(Math.atan2(-dx, dy), STRETCH.head.pan.min, STRETCH.head.pan.max),
    tilt: clamp(Math.atan2(dz, Math.hypot(dx, dy)), STRETCH.head.tilt.min, STRETCH.head.tilt.max),
  };
}

function graspWaypoints(obj, q0) {
  const plan = planGrasp(obj);
  const open = Math.min(STRETCH.gripper.max, plan.width + kinOpenMargin);
  let rise = plan.approach[2];
  let qAt = null;
  let qAbove = null;
  while (rise >= 0.02) {
    qAbove = stretchIK([plan.p[0], plan.p[1], plan.p[2] + rise], plan.yaw);
    qAt = stretchIK(plan.p, plan.yaw);
    if (qAbove && qAt) break;
    rise -= 0.01;
  }
  if (!qAbove || !qAt) return [];
  qAbove.grip = open;
  qAt.grip = open;
  const segs = [];
  let cursor = kinQ(q0);
  let t = 0;
  const push = (kind, q1, dur) => {
    const q = kinQ(q1);
    const t1 = t + dur;
    segs.push({ t0: t, t1, kind, label: kind, q0: kinQ(cursor), q1: q });
    t = t1;
    cursor = q;
  };
  const qBase = kinQ(cursor);
  qBase.x = qAt.x;
  const dx = qBase.x - q0.x;
  if (Math.abs(dx) > 1e-4) push("base", qBase, kinSegDt(cursor, qBase));
  if (Math.abs(dx) > kinBaseMove) {
    const look = kinLook(cursor.x, [obj.x, obj.y, TABLE.h]);
    const qLook = kinQ(cursor);
    qLook.pan = look.pan;
    qLook.tilt = look.tilt;
    push("reobserve", qLook, kinReobserve);
  }
  qAbove.pan = cursor.pan;
  qAbove.tilt = cursor.tilt;
  qAt.pan = cursor.pan;
  qAt.tilt = cursor.tilt;
  push("pregrasp", qAbove, kinSegDt(cursor, qAbove));
  push("descend", qAt, kinSegDt(cursor, qAt));
  const qClose = kinQ(cursor);
  qClose.grip = plan.width;
  push("close", qClose, kinSegDt(cursor, qClose));
  const qLift = kinQ(cursor);
  qLift.lift = Math.min(STRETCH.lift.max, qLift.lift + kinLiftOff);
  push("lift", qLift, kinSegDt(cursor, qLift));
  const qRet = kinQ(cursor);
  qRet.arm = STRETCH.arm.min;
  push("retract", qRet, kinSegDt(cursor, qRet));
  return segs;
}

Object.assign(LOGIC, { STRETCH, stretchFK, planGrasp, stretchIK, graspWaypoints });
