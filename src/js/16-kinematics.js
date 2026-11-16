// ================================================================ Stretch 3 specifications (M1)
// Pure logic: no DOM, no three.js. The build keeps this file inside the logic block.
// Ranges are metres or radians. Each line cites the page the number comes from.
// docs.hello-robot.com no longer hosts the Stretch 3 guide (the live docs have moved on to Stretch 4);
// the guide text is the Hello Robot hardware-guide repo that site published.
const kinGuide = "https://github.com/hello-robot/stretch_hardware_guides/blob/master/docs/hardware_guide_stretch_3.md";
const kinSheet = "https://github.com/hello-robot/stretch_hardware_guides/blob/master/docs/images/Stretch_3_Datasheet_2.2024.png"; // rev 2.14.2024
// The Stretch Gripper 3 product page (hello-robot.com/stretchgripper3-specs) now returns 404.
// 0.15 m is the aperture that page stated. TODO-SOURCE a live page. Stretch 3's "what's new" notes a
// larger aperture than Stretch 2 but does not restate 15 cm.
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
  // Arm-centre height above the floor. The carriage origin is at z = 0.195 when joint_lift is 0.
  // In stretch_uncalibrated.urdf the live joint_lift upper is 1.1; the 1.095 line is commented out.
  // 0.195 + 1.095 = 1.290, which is the figure used here. 0.195 + 1.1 = 1.295. TODO-SOURCE which stop
  // the Stretch 3 ships with. kinGuide does not restate the travel in text. Rounded to 0.20..1.29.
  lift: Object.freeze({ min: 0.20, max: 1.29 }),
  arm: Object.freeze({
    min: 0,
    max: 0.52, // kinGuide "Reach: 0.52m"
    segments: 5, // kinGuide "5 telescoping aluminum links"
    retracted: 0.255, // TODO-SOURCE. kinUrdf joint_arm_l4 xyz is a fixed link offset of 0.2547 m, not a measured retracted length. kinGuide only says the retracted arm and wrist fit inside the base footprint.
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
    // TODO-SOURCE mixed zeros. The guide diagram is −25..+90 deg about the guide's nominal zero.
    // kinUrdf joint_head_tilt is −1.53..+0.79 rad about a different zero. The twin keeps the URDF lower
    // stop, because −25 deg cannot aim CAM_POSE (about −43 deg down), and the guide's +90 deg upper stop.
    tilt: Object.freeze({ min: -1.53, max: kinDeg(90) }),
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
    cupR: 0.011, // suction-cup radius on that mesh (lathe r max is 0.0105)
    cupX: 0.003, // suction-cup origin, outward of the finger group's grip slide
    cupY: 0.090, // suction-cup origin along the gripper. The fingertip marker is at tip, 3 mm further.
    mouth: 0.0072, // cup lathe axis length; rotation.y turns it back toward the centreline
  }),
  // Joint speeds used to time waypoints. Metres/second or radians/second.
  speed: Object.freeze({
    // TODO-SOURCE. 0.15 m/s is the example base.motion.default.vel_m quoted from the Stretch Body
    // guide. That guide is RE1-era and https://docs.hello-robot.com/0.1/stretch_body_guide/ now 404s,
    // so the number cannot be checked. Not a Stretch 3 factory table.
    base: 0.15,
    // Printed RobotParams lift.motion.default.vel_m. The thread is a Stretch RE2 params dump, not Stretch 3.
    // https://forum.hello-robot.com/t/ros-integration-for-custom-motion-profiles/702
    lift: 0.095,
    // TODO-SOURCE. No checked page states an arm default of 0.14 m/s. The Stretch 3 fast profile in
    // stretch_dex_teleop robot_move.py (`fastest_stretch_3`) is 0.18 m/s and is not used here.
    // https://github.com/hello-robot/stretch_dex_teleop/blob/main/robot_move.py
    arm: 0.14,
    // Same RE2 forum dump: wrist_yaw.motion.default.vel = 2.0 rad/s. Not a Stretch 3 factory table.
    yaw: 2.0,
    pitch: 2.0, // TODO-SOURCE. Same default family as wrist yaw. Dex-teleop fast pitch is 3.0 rad/s.
    roll: 2.0, // TODO-SOURCE. Dex-teleop fast roll is 4.5 rad/s. The factory default was not in that dump.
    grip: 0.08, // TODO-SOURCE aperture m/s. The dynamixel speed is motor rad/s, not metres of opening.
    head: 1.5, // TODO-SOURCE. Re-observe itself is fixed at 0.5 s (below), not integrated from this speed.
  }),
});

// Twin timing floors and grasp clearances. Not in the paper or the hardware guide.
const kinClearance = 0.008; // TODO-SOURCE extra opening beyond the local cross-section (m). With the suction-cup mouth this leaves about 0.2 mm of interference, inside the 2 mm contact band.
const kinOpenMargin = 0.04; // TODO-SOURCE how much further the gripper opens at pregrasp (m)
const kinAbove = 0.025; // TODO-SOURCE nominal fingertip clearance above the object (m), reported on plan.approach
const kinSafe = 0.02; // TODO-SOURCE vertical margin above the tallest object the gripper or the held body must clear (m)
const kinBaseMove = 0.10; // re-observe after a base move larger than this (m), task brief Sec. 3.5
const kinReobserve = 0.5; // re-observe duration (s), task brief Sec. 3.5
const kinMinSeg = 0.2; // TODO-SOURCE shortest segment so a small joint step still advances time
const kinDown = -Math.PI / 2; // top-down pitch the IK aims for (hardware pitch stop is this value)
const kinGap = 0.004; // palm face stays this far above a body or lid (m)

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

// Object meshes (25-objects.js) and planGrasp share these fractions. The lathe profiles below are the
// same polylines the meshes revolve. Twin assumption, paper Table 10 "height and clearance constraints":
// the palm face is tool.palm (47 mm) above the fingertip, so a centre-height slice puts the palm inside
// any body taller than about 86 mm, and a lid or cap makes that worse. The grasp starts at the centre,
// rises until the palm clears the top, then keeps rising while a higher slice is wider, so the closed
// fingers are outside every slice above them. Measured on DIMS, as a fraction of body height H:
//   cup, no lid: small 0.99, medium 1.00, large 1.00 (the rim is wider than the wall)
//   cup, lid:    small 1.00, medium 1.00, large 1.03 (the lid is wider than the rim)
//   bottle, no lid: small 0.75, medium 0.80, large 0.83 (neck taper, above the shoulder at 0.66 H)
//   bottle, lid:    small 1.02, medium 1.01, large 1.01 (on the cap, wider than the neck)
// Width is the local cross-section there plus
// kinClearance, not the body's maximum diameter.
// PCA of a depth slice is replaced by the object's known yaw and these analytic widths. A fork or spoon
// is grasped at the handle's centre along local x, closing across the handle width. z is 1 mm under the
// handle top so the suction cup stays on the handle and just meets the table.
const OBJ_SHAPE = Object.freeze({
  cup: Object.freeze({
    wallMin: 0.0016, wallMax: 0.0026, wallK: 0.07, lipMax: 0.0032, lipK: 0.04,
    handleR: 0.015, handleRK: 0.18, handleZ0: 0.36, handleZ1: 0.76, tubeR: 0.0034,
    lidExtra: 0.0206,
  }),
  bottle: Object.freeze({
    neckK: 0.32, neckMin: 0.01, shoulder: 0.66, neckZ: 0.82, wall: 0.0014, capExtra: 0.022,
  }),
  fork: Object.freeze({
    handleL: 0.56, handleW: 0.42, handleH: 0.85, neckL: 0.10, neckBack: 0.02, neckW: 0.88,
    neckH: 0.9, tineW: 0.15, tineSpan: 0.92, tineN: 4, tineBack: 0.015, tineH: 0.42, rrMax: 0.0012, rrK: 0.25,
  }),
  spoon: Object.freeze({
    handleL: 0.68, handleW: 0.38, handleCap: 0.012, handleH: 0.72, bowlL: 0.40, bowlScaleY: 0.92,
    depthK: 1.15, depthMin: 0.006, rrMax: 0.0016, rrK: 0.3,
  }),
});

function objCupMetrics(o) {
  const d = dimsOf(o);
  const R = d.d / 2, H = d.h, S = OBJ_SHAPE.cup;
  const wall = Math.max(S.wallMin, Math.min(S.wallMax, R * S.wallK));
  const lip = Math.min(S.lipMax, H * S.lipK);
  return { R, H, wall, lip };
}

function objCupProfile(o) {
  const { R, H, wall, lip } = objCupMetrics(o);
  return [
    [0.001, 0], [R * 0.7, 0], [R * 0.95, 0.003], [R, H * 0.16], [R * 0.985, H - lip],
    [R + lip * 0.4, H], [R - wall, H], [R - wall, wall + 0.0014], [R * 0.5, wall * 0.6], [0.001, wall * 0.5],
  ];
}

function objCupLid(o) {
  const { R, H } = objCupMetrics(o);
  const z = H + 0.0006;
  return {
    profile: [
      [0.001, z], [R * 1.005, z], [R * 1.04, z + 0.0035], [R * 0.7, z + 0.008],
      [R * 0.46, z + 0.014], [R * 0.14, z + 0.018], [0.001, z + 0.011],
    ],
    sipR: Math.max(0.004, R * 0.16), sipSx: 1.2, sipSy: 0.72, sipSz: 0.55,
    sipX: R * 0.42, sipZ: z + 0.020,
  };
}

function objCupHandle(o) {
  const { R, H } = objCupMetrics(o);
  const S = OBJ_SHAPE.cup;
  const hr = Math.min(S.handleR, H * S.handleRK);
  const z0 = H * S.handleZ0, z1 = H * S.handleZ1;
  return {
    r: S.tubeR,
    pts: [
      [R * 0.9, 0, z0],
      [R + hr * 0.7, 0, z0 + (z1 - z0) * 0.2],
      [R + hr * 1.15, 0, (z0 + z1) * 0.5],
      [R + hr * 0.7, 0, z1 - (z1 - z0) * 0.2],
      [R * 0.9, 0, z1],
    ],
  };
}

function objBottleMetrics(o) {
  const d = dimsOf(o);
  const R = d.d / 2, H = d.h, S = OBJ_SHAPE.bottle;
  const neck = Math.max(S.neckMin, R * S.neckK);
  return { R, H, neck, shoulder: H * S.shoulder, neckZ: H * S.neckZ, wall: S.wall };
}

function objBottleProfile(o) {
  const { R, H, neck, shoulder, neckZ, wall } = objBottleMetrics(o);
  return [
    [0.001, 0], [R * 0.75, 0], [R, H * 0.05], [R, shoulder], [neck * 1.25, neckZ],
    [neck, H - 0.002], [neck + 0.0008, H], [neck - wall, H], [neck - wall, neckZ + 0.012],
    [R - wall, shoulder - 0.004], [R - wall, wall], [0.001, wall * 0.65],
  ];
}

function objBottleCapProfile(o) {
  const { H, neck } = objBottleMetrics(o);
  return [
    [0.001, H - 0.001], [neck * 1.2, H - 0.001], [neck * 1.28, H + 0.003],
    [neck * 1.28, H + 0.016], [neck * 0.55, H + 0.022], [0.001, H + 0.022],
  ];
}

function objForkParts(o) {
  const d = dimsOf(o);
  const S = OBJ_SHAPE.fork;
  const L = d.l, W = d.w, T = d.h;
  const handleL = L * S.handleL;
  const handleH = T * S.handleH;
  const neckL = L * S.neckL;
  const neckX = -L / 2 + handleL + neckL / 2 - L * S.neckBack;
  const tineW = W * S.tineW;
  const span = W * S.tineSpan;
  const gap = (span - S.tineN * tineW) / (S.tineN - 1);
  const tineStart = neckX + neckL / 2 - L * S.tineBack;
  const tineLen = L / 2 - tineStart;
  const boxes = [{ l: neckL, w: W * S.neckW, h: T * S.neckH, x: neckX, y: 0, z: T * 0.48 }];
  for (let i = 0; i < S.tineN; i++) {
    const y = -span / 2 + tineW / 2 + i * (tineW + gap);
    boxes.push({ l: tineLen, w: tineW, h: T * S.tineH, x: tineStart + tineLen / 2, y, z: T * 0.26 });
  }
  return {
    handle: { x: -L / 2 + handleL / 2, y: 0, z: handleH / 2, l: handleL, w: W * S.handleW, h: handleH, r: Math.min(S.rrMax, T * S.rrK) },
    boxes,
  };
}

function objSpoonParts(o) {
  const d = dimsOf(o);
  const S = OBJ_SHAPE.spoon;
  const L = d.l, W = d.w, T = d.h;
  const handleL = L * S.handleL;
  const handleH = T * S.handleH;
  const bowlL = L * S.bowlL;
  const depth = Math.max(S.depthMin, T * S.depthK);
  const Rb = W / 2;
  return {
    handle: {
      x: -L / 2 + handleL / 2, y: 0, z: handleH / 2, l: handleL,
      w: Math.min(W * S.handleW, S.handleCap), h: handleH, r: Math.min(S.rrMax, T * S.rrK),
    },
    bowl: {
      profile: [
        [0.001, 0.0012], [Rb * 0.45, 0.0016], [Rb * 0.82, depth * 0.32], [Rb, depth * 0.78],
        [Rb * 0.86, depth * 0.96], [Rb * 0.62, depth * 0.42], [Rb * 0.30, depth * 0.22], [0.001, depth * 0.22],
      ],
      sx: bowlL / W, sy: S.bowlScaleY, x: L / 2 - bowlL / 2,
    },
  };
}

function kinBodyTop(o) {
  const H = dimsOf(o).h;
  if (o.cat === "cup" && o.lid) return H + OBJ_SHAPE.cup.lidExtra;
  if (o.cat === "bottle" && o.lid) return H + OBJ_SHAPE.bottle.capExtra;
  return H;
}

function objOuter(o) {
  if (o.cat === "bottle") {
    const { R, H, neck, shoulder, neckZ } = objBottleMetrics(o);
    const pts = [[R * 0.75, 0], [R, H * 0.05], [R, shoulder], [neck * 1.25, neckZ], [neck, H - 0.002], [neck + 0.0008, H]];
    if (o.lid) pts.push([neck * 1.2, H - 0.001], [neck * 1.28, H + 0.003], [neck * 1.28, H + 0.016], [neck * 0.55, H + OBJ_SHAPE.bottle.capExtra]);
    return pts;
  }
  const { R, H, lip } = objCupMetrics(o);
  const pts = [[R * 0.7, 0], [R * 0.95, 0.003], [R, H * 0.16], [R * 0.985, H - lip], [R + lip * 0.4, H]];
  if (o.lid) {
    const z = H + 0.0006;
    pts.push([R * 1.005, z], [R * 1.04, z + 0.0035], [R * 0.7, z + 0.008], [R * 0.14, z + 0.018], [0.001, H + OBJ_SHAPE.cup.lidExtra]);
  }
  return pts;
}

// Outer radius (m) of a cup or bottle at a height above its base. 0 outside the solid.
function objRadiusAt(obj, zLocal) {
  if (obj.cat !== "cup" && obj.cat !== "bottle") return 0;
  const pts = objOuter(obj);
  if (zLocal < pts[0][1] - 1e-6 || zLocal > pts[pts.length - 1][1] + 1e-6) return 0;
  if (zLocal <= pts[0][1]) return pts[0][0];
  for (let i = 1; i < pts.length; i++) {
    if (zLocal <= pts[i][1]) {
      const a = pts[i - 1], b = pts[i];
      const den = b[1] - a[1];
      const t = den === 0 ? 0 : (zLocal - a[1]) / den;
      return a[0] + (b[0] - a[0]) * t;
    }
  }
  return 0;
}

// Full width (m) of a fork or spoon at a station along local x. The handle is the narrow station.
function utensilWidthAt(obj, xLocal) {
  const d = dimsOf(obj);
  const L = d.l, W = d.w;
  if (obj.cat === "fork") {
    const S = OBJ_SHAPE.fork;
    const handleEnd = -L / 2 + L * S.handleL;
    if (xLocal <= handleEnd) return W * S.handleW;
    return W * S.tineSpan;
  }
  const S = OBJ_SHAPE.spoon;
  const handleEnd = -L / 2 + L * S.handleL;
  if (xLocal <= handleEnd) return Math.min(W * S.handleW, S.handleCap);
  return W;
}

function kinLocalSpan(obj, zLocal, xLocal) {
  if (obj.cat === "fork" || obj.cat === "spoon") return utensilWidthAt(obj, xLocal);
  return 2 * objRadiusAt(obj, zLocal);
}

// Gripper-frame point to the cell frame. The fingertip (0, tool.tip, 0) matches kinFK.
function kinToolPoint(q, lx, ly, lz, out) {
  const o = out || [0, 0, 0];
  const tool = STRETCH.tool;
  const cr = Math.cos(q.roll), sr = Math.sin(q.roll);
  const cp = Math.cos(q.pitch), sp = Math.sin(q.pitch);
  const cy = Math.cos(q.yaw), sy = Math.sin(q.yaw);
  const xr = cr * lx + sr * lz;
  const yr = ly;
  const zr = -sr * lx + cr * lz;
  const y2 = yr + tool.roll;
  const xp = xr;
  const yp = cp * y2 - sp * zr;
  const zp = sp * y2 + cp * zr;
  const yy = yp + tool.pitch;
  o[0] = ROBOT.base[0] + q.x + cy * xp - sy * yy;
  o[1] = ROBOT.base[1] + tool.stow0 + tool.armLen0 + q.arm + sy * xp + cy * yy;
  o[2] = ROBOT.base[2] + q.lift + zp;
  return o;
}

// Points the collision sweep treats as the gripper: inner cup faces, cup bottoms, palm-face corners.
function kinGripPoints(grip) {
  const t = STRETCH.tool;
  const face = grip * 0.5 + t.cupX - t.mouth;
  const side = grip * 0.5 + t.cupX;
  const py = t.tip - t.palm;
  return [
    [face, t.cupY, 0], [-face, t.cupY, 0],
    [side, t.cupY + t.cupR, 0], [-side, t.cupY + t.cupR, 0],
    [0.026, py, 0.015], [-0.026, py, 0.015], [0.026, py, -0.015], [-0.026, py, -0.015],
  ];
}

function kinHitsSolid(o, x, y, z) {
  const zL = z - TABLE.h;
  const top = kinBodyTop(o);
  if (zL < -1e-4 || zL > top + 1e-4) return false;
  if (o.cat === "cup" || o.cat === "bottle") {
    const r = objRadiusAt(o, Math.min(Math.max(zL, 0), top));
    return Math.hypot(x - o.x, y - o.y) < r - 5e-4;
  }
  const d = dimsOf(o);
  if (zL > d.h + 1e-4) return false;
  const yaw = o.yaw || 0, c = Math.cos(yaw), s = Math.sin(yaw);
  const dx = x - o.x, dy = y - o.y;
  const lx = c * dx + s * dy, ly = -s * dx + c * dy;
  if (lx < -d.l / 2 - 1e-4 || lx > d.l / 2 + 1e-4) return false;
  return Math.abs(ly) < utensilWidthAt(o, lx) / 2 - 5e-4;
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

// Handle centre, 1 mm under the handle top. The twin grasps the handle, not the head.
function kinHandleSpec(obj) {
  const d = dimsOf(obj);
  const S = obj.cat === "fork" ? OBJ_SHAPE.fork : OBJ_SHAPE.spoon;
  const handleL = d.l * S.handleL;
  const handleH = d.h * S.handleH;
  return {
    xLocal: -d.l / 2 + handleL / 2,
    zLocal: Math.max(0.002, handleH - 0.001),
    span: utensilWidthAt(obj, -d.l / 2 + handleL / 2),
  };
}

// Centre slice, then up until the palm clears the top, then up to the widest slice above that.
function kinGraspZLocal(obj) {
  const top = kinBodyTop(obj);
  let z = Math.max(dimsOf(obj).h * 0.5, top + kinGap - STRETCH.tool.palm);
  if (z < 0) z = 0;
  if (z > top) z = top;
  let bestZ = z;
  let bestR = objRadiusAt(obj, z);
  const step = 0.001;
  for (let zz = z + step; zz <= top + 1e-9; zz += step) {
    const r = objRadiusAt(obj, Math.min(zz, top));
    if (r > bestR + 4e-4) { bestR = r; bestZ = Math.min(zz, top); }
  }
  return bestZ;
}

function planGrasp(obj) {
  const mode = obj.cat === "fork" || obj.cat === "spoon" ? "pca" : "compact";
  const utensil = mode === "pca";
  const spec = utensil ? kinHandleSpec(obj) : null;
  const xLocal = spec ? spec.xLocal : 0;
  const zLocal = spec ? spec.zLocal : kinGraspZLocal(obj);
  const span = spec ? spec.span : kinLocalSpan(obj, zLocal, xLocal);
  const width = clamp(span + kinClearance, STRETCH.gripper.min, STRETCH.gripper.max);
  const yaw0 = obj.yaw || 0;
  const c = Math.cos(yaw0), s = Math.sin(yaw0);
  const p = [obj.x + xLocal * c, obj.y + xLocal * s, TABLE.h + zLocal];
  const stand = Math.max(0.06, TABLE.h + kinBodyTop(obj) + kinAbove - p[2]);
  const approach = [0, 0, stand];
  if (!(span > 0.004)) return { ok: false, reason: "unreachable", mode, p, yaw: 0, width, approach, xLocal };
  let best = null, bestScore = Infinity;
  const cands = kinYawCandidates(obj);
  for (let i = 0; i < cands.length; i++) {
    const q = stretchIK(p, cands[i]);
    if (!q) continue;
    // More downward pitch wins. A tie prefers the yaw that points the wrist offset along +y (more reach).
    const score = q.pitch * 1000 - Math.cos(q.yaw);
    if (score < bestScore) { bestScore = score; best = q; }
  }
  if (!best) return { ok: false, reason: "unreachable", mode, p, yaw: kinWrapYaw(cands[0]) ?? 0, width, approach, xLocal };
  return { ok: true, mode, p, yaw: best.yaw, width, approach, xLocal };
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

// World z of the lowest gripper sample at this pose. Lift is linear in that z.
function kinGripLowZ(q) {
  const pts = kinGripPoints(q.grip);
  let z = Infinity;
  const p = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    kinToolPoint(q, pts[i][0], pts[i][1], pts[i][2], p);
    if (p[2] < z) z = p[2];
  }
  return z;
}

function kinSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let u = len2 < 1e-12 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  if (u < 0) u = 0;
  else if (u > 1) u = 1;
  return Math.hypot(px - (ax + u * dx), py - (ay + u * dy));
}

// World z of the tallest neighbour whose disc meets the retract sweep, or 0 when the corridor is empty.
// The sweep is pure -y: arm retraction. Discs are the footprint; finger samples use the closed grip.
function kinCorridorTop(obj, qHold, others) {
  let top = 0;
  const arm = qHold.arm;
  const discs = footprintDiscs(obj, obj.x, obj.y, obj.yaw || 0);
  const fingers = kinGripPoints(qHold.grip);
  const buf = [0, 0, 0];
  const qRet = kinQ(qHold);
  qRet.arm = STRETCH.arm.min;
  const sweeps = [];
  for (let i = 0; i < discs.length; i++) {
    const d = discs[i];
    sweeps.push([d[0], d[1], d[0], d[1] - arm, d[2]]);
  }
  for (let i = 0; i < fingers.length; i++) {
    const f = fingers[i];
    kinToolPoint(qHold, f[0], f[1], f[2], buf);
    const ax = buf[0], ay = buf[1];
    kinToolPoint(qRet, f[0], f[1], f[2], buf);
    sweeps.push([ax, ay, buf[0], buf[1], 0]);
  }
  for (let i = 0; i < others.length; i++) {
    const o = others[i];
    if (!o || o === obj || o.id === obj.id) continue;
    const nd = footprintDiscs(o, o.x, o.y, o.yaw || 0);
    let hit = false;
    for (let a = 0; a < sweeps.length && !hit; a++) {
      const s = sweeps[a];
      for (let b = 0; b < nd.length; b++) {
        const n = nd[b];
        if (kinSegDist(n[0], n[1], s[0], s[1], s[2], s[3]) < s[4] + n[2] - 5e-4) { hit = true; break; }
      }
    }
    if (!hit) continue;
    const z = TABLE.h + kinBodyTop(o);
    if (z > top) top = z;
  }
  return top;
}

// Success is a Segment[]. Failure is { ok: false, reason } and is not an array.
// Order: clear (lift only) → base → reobserve → pregrasp at the safe height → vertical descend →
// close → lift until the held bottom clears the retract corridor → retract at that height.
function graspWaypoints(obj, q0, others) {
  const crowd = others || [];
  const plan = planGrasp(obj);
  if (!plan.ok) return { ok: false, reason: plan.reason };
  const qGrasp = stretchIK(plan.p, plan.yaw);
  if (!qGrasp) return { ok: false, reason: "unreachable" };

  let tallest = kinBodyTop(obj);
  for (let i = 0; i < crowd.length; i++) {
    const h = kinBodyTop(crowd[i]);
    if (h > tallest) tallest = h;
  }
  const zLine = TABLE.h + tallest + kinSafe;
  const qProbe = kinQ(q0);
  qProbe.lift = 0;
  qProbe.roll = 0;
  const loP = Math.min(q0.pitch, qGrasp.pitch);
  const hiP = Math.max(q0.pitch, qGrasp.pitch);
  let lowZ = Infinity;
  for (let i = 0; i <= 4; i++) {
    qProbe.pitch = loP + (hiP - loP) * (i / 4);
    const z = kinGripLowZ(qProbe);
    if (z < lowZ) lowZ = z;
  }
  const needLift = zLine - lowZ;
  if (needLift > STRETCH.lift.max + 1e-6) return { ok: false, reason: "lift cannot clear the table" };
  let safeLift = Math.max(q0.lift, needLift);
  if (qGrasp.lift > safeLift) safeLift = qGrasp.lift;

  const qHold = kinQ(qGrasp);
  qHold.grip = plan.width;
  const corridor = kinCorridorTop(obj, qHold, crowd);
  const needBottom = Math.max(TABLE.h, corridor) + kinSafe;
  const liftZ = qGrasp.lift + (needBottom - TABLE.h);
  if (liftZ > STRETCH.lift.max + 1e-6) return { ok: false, reason: "lift cannot clear the retract corridor" };

  const open = Math.min(STRETCH.gripper.max, plan.width + kinOpenMargin);
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
  const moved = (q1) => {
    for (let i = 0; i < kinJoints.length; i++) {
      if (Math.abs(q1[kinJoints[i]] - cursor[kinJoints[i]]) > 1e-6) return true;
    }
    return false;
  };

  const qClear = kinQ(cursor);
  qClear.lift = safeLift;
  if (moved(qClear)) push("clear", qClear, kinSegDt(cursor, qClear));

  const qBase = kinQ(cursor);
  qBase.x = qGrasp.x;
  const dx = qBase.x - q0.x;
  if (Math.abs(qBase.x - cursor.x) > 1e-4) push("base", qBase, kinSegDt(cursor, qBase));
  if (Math.abs(dx) > kinBaseMove) {
    const look = kinLook(cursor.x, [obj.x, obj.y, TABLE.h]);
    const qLook = kinQ(cursor);
    qLook.pan = look.pan;
    qLook.tilt = look.tilt;
    push("reobserve", qLook, kinReobserve);
  }

  const qPre = kinQ(qGrasp);
  qPre.lift = cursor.lift;
  qPre.x = cursor.x;
  qPre.grip = open;
  qPre.pan = cursor.pan;
  qPre.tilt = cursor.tilt;
  push("pregrasp", qPre, kinSegDt(cursor, qPre));

  const qDown = kinQ(cursor);
  qDown.lift = qGrasp.lift;
  push("descend", qDown, kinSegDt(cursor, qDown));

  const qClose = kinQ(cursor);
  qClose.grip = plan.width;
  push("close", qClose, kinSegDt(cursor, qClose));

  const qLift = kinQ(cursor);
  qLift.lift = liftZ;
  push("lift", qLift, kinSegDt(cursor, qLift));

  const qRet = kinQ(cursor);
  qRet.arm = STRETCH.arm.min;
  push("retract", qRet, kinSegDt(cursor, qRet));
  return segs;
}

Object.assign(LOGIC, {
  STRETCH, OBJ_SHAPE, stretchFK, planGrasp, stretchIK, graspWaypoints,
  objRadiusAt, utensilWidthAt, kinToolPoint, kinGripPoints, kinHitsSolid,
});
