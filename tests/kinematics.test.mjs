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
}

export const perturbations = [
  { name: "lift ends swapped", find: "lift: Object.freeze({ min: 0.20, max: 1.29 })", replace: "lift: Object.freeze({ min: 1.29, max: 0.20 })" },
  { name: "arm extended reach shortened", find: "gripY: Object.freeze({ retracted: 0.28, extended: 0.80 })", replace: "gripY: Object.freeze({ retracted: 0.28, extended: 0.40 })" },
  { name: "camera height dropped by 30 cm", find: "d435i: Object.freeze({ x: 0.003, y: 0.045, z: 1.322 })", replace: "d435i: Object.freeze({ x: 0.003, y: 0.045, z: 1.00 })" },
];
