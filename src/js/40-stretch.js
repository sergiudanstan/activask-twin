// ================================================================ Stretch 3
// Base at ROBOT.base, arm along +y. setStretch(q) poses every joint and allocates nothing.
// stretchHeadCam() is the D435i optical centre in the cell frame.
const stretchRoot = moduleRoot("stretch");
stretchRoot.name = "stretch";

const stretchBaseMat = phys(0xd7dadf, 0.4, 0.06, { clearcoat: 0.28, clearcoatRoughness: 0.35 });
const stretchMastMat = phys(0x2c3138, 0.4, 0.62);
const stretchDark = phys(0x23272b, 0.48, 0.25);
const stretchWrist = phys(0x1c2024, 0.42, 0.3);
const stretchCupMat = phys(0xd5d8dc, 0.45, 0, { clearcoat: 0.2, clearcoatRoughness: 0.4 });
const stretchArmMats = [
  phys(0x8d949c, 0.34, 0.8),
  phys(0x6c747c, 0.36, 0.72),
  phys(0x525a62, 0.4, 0.6),
  phys(0x3c444c, 0.42, 0.5),
  phys(0x2c333a, 0.46, 0.4),
];

function stretchProjMap() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#4a515a";
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#f2f4f6";
  for (let y = 10; y <= 54; y += 6) {
    for (let x = 10; x <= 54; x += 6) g.fillRect(x, y, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const stretchProjMat = new THREE.MeshStandardMaterial({ map: stretchProjMap(), roughness: 0.4, metalness: 0.1 });

// Index 0 is the distal link and carries the wrist at local y = stretchArmLen[0].
// Pitch 0, arm 0: stow[0] + armLen[0] + 0.015 + 0.03 + 0.093 = 0.28 = STRETCH.gripY.retracted.
// Retracted tips step outward (0.142, 0.132, 0.118, 0.102, 0.090) so each sleeve shows.
// Shares keep the sleeves overlapped at full extension (0.52 m on the distal link).
const stretchArmLen = [0.130, 0.150, 0.160, 0.180, 0.210];
const stretchArmW = [0.030, 0.042, 0.054, 0.066, 0.078];
const stretchArmH = [0.020, 0.028, 0.036, 0.044, 0.052];
const stretchArmStow = [0.012, -0.018, -0.042, -0.078, -0.120];
const stretchArmShare = [1, 0.78, 0.55, 0.30, 0];

const stretchMastY = -0.09;
const stretchCamLocalY = CAM_POSE.pos[1] - ROBOT.base[1];
const stretchCamLocalZ = CAM_POSE.pos[2] - ROBOT.base[2];
const stretchTilt0 = -Math.atan2(CAM_POSE.pos[2] - CAM_POSE.look[2], CAM_POSE.look[1] - CAM_POSE.pos[1]);

const stretchQ = { x: 0, lift: 0.86, arm: 0, yaw: 0, pitch: -0.55, roll: 0, grip: 0.07, pan: 0, tilt: stretchTilt0 };
const stretchCamPos = new THREE.Vector3();
const stretchCamQuat = new THREE.Quaternion();
const stretchCamDir = new THREE.Vector3();
const stretchHeadOut = { pos: [0, 0, 0], look: [0, 0, 0] };
const stretchArms = new Array(5);

// ---- base, mast ----
rbox(0.34, 0.33, 0.100, 0.014, stretchBaseMat, 0, 0, 0.064, stretchRoot).name = "stretch-base";
rbox(0.362, 0.352, 0.026, 0.008, M.blackRubber, 0, 0, 0.028, stretchRoot).name = "stretch-bumper";
{
  const tireGeo = new THREE.CylinderGeometry(STRETCH.wheelDiameter / 2, STRETCH.wheelDiameter / 2, 0.026, 28);
  const hubGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 16);
  for (const x of [-0.172, 0.172]) {
    const tire = new THREE.Mesh(tireGeo, M.blackRubber);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, 0.02, STRETCH.wheelDiameter / 2);
    tire.castShadow = tire.receiveShadow = true;
    tire.name = x > 0 ? "stretch-wheel-r" : "stretch-wheel-l";
    stretchRoot.add(tire);
    const hub = new THREE.Mesh(hubGeo, M.gearboxSilver);
    hub.rotation.z = Math.PI / 2;
    hub.position.copy(tire.position);
    hub.castShadow = hub.receiveShadow = true;
    hub.name = x > 0 ? "stretch-hub-r" : "stretch-hub-l";
    stretchRoot.add(hub);
  }
  const caster = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 14), M.blackRubber);
  caster.rotation.z = Math.PI / 2;
  caster.position.set(0, -0.125, 0.02);
  caster.castShadow = caster.receiveShadow = true;
  caster.name = "stretch-caster";
  stretchRoot.add(caster);
  const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.018, 20), stretchDark);
  lidar.position.set(0, 0.145, 0.125);
  lidar.castShadow = lidar.receiveShadow = true;
  lidar.name = "stretch-lidar";
  stretchRoot.add(lidar);
}
rbox(0.05, 0.04, 1.28, 0.004, stretchMastMat, 0, stretchMastY, 0.76, stretchRoot).name = "stretch-mast";
tubeAlong(
  [[0.028, stretchMastY - 0.02, 0.18], [0.03, stretchMastY - 0.02, 0.7], [0.022, stretchMastY, 1.22]],
  0.0045, M.blackRubber, stretchRoot, 10, 6,
).name = "stretch-cable-mast";

// ---- lift, nested arm, wrist, gripper ----
const stretchLift = new THREE.Group();
stretchLift.name = "stretch-lift";
stretchRoot.add(stretchLift);
rbox(0.09, 0.055, 0.07, 0.005, stretchDark, 0, stretchMastY + 0.04, 0, stretchLift).name = "stretch-carriage";
rbox(0.10, 0.07, 0.008, 0.002, stretchBaseMat, 0, stretchMastY + 0.03, 0.04, stretchLift).name = "stretch-tray";

for (let i = 0; i < 5; i++) {
  const link = new THREE.Group();
  link.name = "stretch-arm-" + i;
  const body = rbox(stretchArmW[i], stretchArmLen[i], stretchArmH[i], 0.0025, stretchArmMats[i], 0, stretchArmLen[i] / 2, 0, link);
  body.name = "stretch-arm-" + i + "-body";
  stretchLift.add(link);
  stretchArms[i] = link;
}
tubeAlong(
  [[0.04, 0.02, -0.01], [0.045, 0.08, -0.02], [0.03, 0.14, -0.012]],
  0.0035, M.blackRubber, stretchLift, 8, 5,
).name = "stretch-cable-arm";

const stretchYaw = new THREE.Group();
stretchYaw.name = "stretch-wrist-yaw";
stretchArms[0].add(stretchYaw);
stretchYaw.position.y = stretchArmLen[0];
{
  const yawBody = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.036, 18), stretchWrist);
  yawBody.rotation.x = Math.PI / 2;
  yawBody.position.y = 0.012;
  yawBody.castShadow = yawBody.receiveShadow = true;
  yawBody.name = "stretch-wrist-yaw-body";
  stretchYaw.add(yawBody);
}

const stretchPitch = new THREE.Group();
stretchPitch.name = "stretch-wrist-pitch";
stretchPitch.position.y = 0.015;
stretchYaw.add(stretchPitch);
rbox(0.038, 0.028, 0.032, 0.003, stretchWrist, 0, 0.012, -0.008, stretchPitch).name = "stretch-wrist-pitch-body";

const stretchRoll = new THREE.Group();
stretchRoll.name = "stretch-wrist-roll";
stretchRoll.position.y = 0.03;
stretchPitch.add(stretchRoll);
{
  const rollBody = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.022, 16), stretchWrist);
  rollBody.position.y = 0.012;
  rollBody.castShadow = rollBody.receiveShadow = true;
  rollBody.name = "stretch-wrist-roll-body";
  stretchRoll.add(rollBody);
}

const stretchGripper = new THREE.Group();
stretchGripper.name = "stretch-gripper";
stretchRoll.add(stretchGripper);
rbox(0.052, 0.036, 0.03, 0.003, stretchDark, 0, 0.028, 0, stretchGripper).name = "stretch-palm";

function stretchFinger(sign) {
  const g = new THREE.Group();
  g.name = sign < 0 ? "stretch-finger-l" : "stretch-finger-r";
  stretchGripper.add(g);
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    pts.push(new THREE.Vector3(sign * Math.sin(t * Math.PI) * 0.010, 0.014 + t * 0.074, 0));
  }
  const spring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.004, 6, false), stretchDark);
  spring.castShadow = spring.receiveShadow = true;
  spring.name = g.name + "-spring";
  g.add(spring);
  // Open mouth at +z. rotation.y turns that mouth toward the grasp centreline.
  const cup = lathe([
    [0.001, 0], [0.0045, 0.001], [0.008, 0.0035], [0.0105, 0.006],
    [0.0082, 0.0072], [0.004, 0.0048], [0.001, 0.003],
  ], stretchCupMat, g, 16);
  cup.rotation.y = sign > 0 ? -Math.PI / 2 : Math.PI / 2;
  cup.position.set(sign * 0.003, 0.09, 0);
  cup.name = g.name + "-tip";
  return g;
}
const stretchFingerL = stretchFinger(-1);
const stretchFingerR = stretchFinger(1);
const stretchTip = new THREE.Object3D();
stretchTip.name = "stretch-fingertip";
stretchTip.position.set(0, 0.093, 0);
stretchGripper.add(stretchTip);

// ---- head: pan, tilt, D435i. The optical centre is the tilt origin, parked on CAM_POSE. ----
const stretchPan = new THREE.Group();
stretchPan.name = "stretch-head-pan";
stretchPan.position.set(0, stretchCamLocalY, stretchCamLocalZ);
stretchRoot.add(stretchPan);
{
  const servo = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.022, 16), stretchWrist);
  servo.rotation.x = Math.PI / 2;
  servo.position.set(0, -0.01, 0.012);
  servo.castShadow = servo.receiveShadow = true;
  servo.name = "stretch-head-pan-servo";
  stretchPan.add(servo);
  const neck = rbox(0.026, 0.04, 0.055, 0.003, stretchDark, 0, -0.028, 0.045, stretchPan);
  neck.name = "stretch-head-neck";
  const shell = rbox(0.078, 0.048, 0.052, 0.005, stretchDark, 0, -0.04, 0.078, stretchPan);
  shell.name = "stretch-head-shell";
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.01, 20), stretchDark);
  mic.position.set(0, -0.04, 0.11);
  mic.castShadow = mic.receiveShadow = true;
  mic.name = "stretch-respeaker";
  stretchPan.add(mic);
  const stop = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.008, 14), M.estopRed);
  stop.rotation.z = Math.PI / 2;
  stop.position.set(0.046, -0.04, 0.078);
  stop.castShadow = stop.receiveShadow = true;
  stop.name = "stretch-runstop";
  stretchPan.add(stop);
}

const stretchTilt = new THREE.Group();
stretchTilt.name = "stretch-head-tilt";
stretchPan.add(stretchTilt);

const stretchCamAnchor = new THREE.Object3D();
stretchCamAnchor.name = "stretch-d435i";
stretchTilt.add(stretchCamAnchor);
{
  const body = rbox(0.090, 0.023, 0.025, 0.002, stretchDark, 0, -0.006, 0, stretchTilt);
  body.name = "stretch-d435i-body";
  // Cylinder axis is Y, the optical axis of this tilt frame. Bezels keep the glass readable.
  const bezelGeo = new THREE.CylinderGeometry(0.0066, 0.0066, 0.004, 16);
  const lensGeo = new THREE.CylinderGeometry(0.0044, 0.0044, 0.003, 16);
  for (const x of [-0.014, 0.018]) {
    const bezel = new THREE.Mesh(bezelGeo, M.gearboxSilver);
    bezel.position.set(x, 0.006, 0);
    bezel.castShadow = bezel.receiveShadow = true;
    bezel.name = x < 0 ? "stretch-d435i-bezel-l" : "stretch-d435i-bezel-r";
    stretchTilt.add(bezel);
    const lens = new THREE.Mesh(lensGeo, M.lens);
    lens.position.set(x, 0.0085, 0);
    lens.name = x < 0 ? "stretch-d435i-lens-l" : "stretch-d435i-lens-r";
    stretchTilt.add(lens);
  }
  const proj = mesh(new THREE.CircleGeometry(0.0062, 16), stretchProjMat, stretchTilt);
  proj.rotation.x = -Math.PI / 2;
  proj.position.set(-0.034, 0.009, 0);
  proj.name = "stretch-d435i-projector";
  proj.castShadow = false;
}

function setStretch(q) {
  stretchQ.x = q.x;
  stretchQ.lift = clamp(q.lift, STRETCH.lift.min, STRETCH.lift.max);
  stretchQ.arm = clamp(q.arm, STRETCH.arm.min, STRETCH.arm.max);
  stretchQ.yaw = clamp(q.yaw, STRETCH.wrist.yaw.min, STRETCH.wrist.yaw.max);
  stretchQ.pitch = clamp(q.pitch, STRETCH.wrist.pitch.min, STRETCH.wrist.pitch.max);
  stretchQ.roll = clamp(q.roll, STRETCH.wrist.roll.min, STRETCH.wrist.roll.max);
  stretchQ.grip = clamp(q.grip, STRETCH.gripper.min, STRETCH.gripper.max);
  stretchQ.pan = clamp(q.pan, STRETCH.head.pan.min, STRETCH.head.pan.max);
  stretchQ.tilt = clamp(q.tilt, STRETCH.head.tilt.min, STRETCH.head.tilt.max);
  stretchRoot.position.set(ROBOT.base[0] + stretchQ.x, ROBOT.base[1], ROBOT.base[2]);
  stretchLift.position.z = stretchQ.lift;
  for (let i = 0; i < 5; i++) stretchArms[i].position.y = stretchArmStow[i] + stretchQ.arm * stretchArmShare[i];
  stretchYaw.rotation.z = stretchQ.yaw;
  stretchPitch.rotation.x = stretchQ.pitch;
  stretchRoll.rotation.y = stretchQ.roll;
  const half = stretchQ.grip * 0.5;
  stretchFingerL.position.x = -half;
  stretchFingerR.position.x = half;
  stretchPan.rotation.z = stretchQ.pan;
  stretchTilt.rotation.x = stretchQ.tilt;
}

function stretchHeadCam() {
  stretchCamAnchor.updateWorldMatrix(true, false);
  stretchCamAnchor.getWorldPosition(stretchCamPos);
  stretchCamAnchor.getWorldQuaternion(stretchCamQuat);
  stretchCamDir.set(0, 1, 0).applyQuaternion(stretchCamQuat);
  const px = stretchCamPos.x;
  const py = -stretchCamPos.z;
  const pz = stretchCamPos.y;
  const dx = stretchCamDir.x;
  const dy = -stretchCamDir.z;
  const dz = stretchCamDir.y;
  stretchHeadOut.pos[0] = px;
  stretchHeadOut.pos[1] = py;
  stretchHeadOut.pos[2] = pz;
  const t = dz < -1e-4 ? (TABLE.h - pz) / dz : 1;
  stretchHeadOut.look[0] = px + dx * t;
  stretchHeadOut.look[1] = py + dy * t;
  stretchHeadOut.look[2] = pz + dz * t;
  return stretchHeadOut;
}

setStretch(stretchQ);
window.setStretch = setStretch;
window.stretchHeadCam = stretchHeadCam;

if (QS.has("solo") && QS.get("solo") !== "stretch") stretchRoot.visible = false;
