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
});

Object.assign(LOGIC, { STRETCH });
