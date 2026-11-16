// ================================================================ grasp animation
// graspTicker(segs, objGroup, ok) poses the robot with setStretch and carries objGroup from the end of
// close. ok === false slips the object out after lift and settles it back on the table. The tick allocates nothing.
const graspChkV = new THREE.Vector3();
const graspFkBuf = { p: [0, 0, 0], close: [0, 0, 0] };
const graspKeys = ["x", "lift", "arm", "yaw", "pitch", "roll", "grip", "pan", "tilt"];

function graspTicker(segs, objGroup, ok) {
  const q = { x: 0, lift: 0, arm: 0, yaw: 0, pitch: 0, roll: 0, grip: 0, pan: 0, tilt: 0 };
  const home = {
    x: objGroup.position.x, y: objGroup.position.y, z: objGroup.position.z, yaw: objGroup.rotation.z,
  };
  let close = null, lift = null, retract = null;
  for (let i = 0; i < segs.length; i++) {
    if (segs[i].kind === "close") close = segs[i];
    if (segs[i].kind === "lift") lift = segs[i];
    if (segs[i].kind === "retract") retract = segs[i];
  }
  const off = [0, 0, 0];
  const lifted = [home.x, home.y, home.z];
  const parked = [home.x, home.y, home.z];
  const settle = [home.x, home.y, TABLE.h];
  if (close) {
    kinFK(close.q1, graspFkBuf);
    off[0] = home.x - graspFkBuf.p[0];
    off[1] = home.y - graspFkBuf.p[1];
    off[2] = home.z - graspFkBuf.p[2];
    settle[0] = home.x + graspFkBuf.close[0] * 0.035;
    settle[1] = home.y + graspFkBuf.close[1] * 0.035;
  }
  if (lift) {
    kinFK(lift.q1, graspFkBuf);
    lifted[0] = graspFkBuf.p[0] + off[0];
    lifted[1] = graspFkBuf.p[1] + off[1];
    lifted[2] = graspFkBuf.p[2] + off[2];
  }
  if (retract) {
    kinFK(retract.q1, graspFkBuf);
    parked[0] = graspFkBuf.p[0] + off[0];
    parked[1] = graspFkBuf.p[1] + off[1];
    parked[2] = graspFkBuf.p[2] + off[2];
  }
  const slipDur = lift && retract ? Math.max(0.4, retract.t1 - lift.t1) : 0.8;
  const n = segs.length;

  return function graspTick(t) {
    let seg = null;
    for (let i = 0; i < n; i++) {
      const s = segs[i];
      if (t >= s.t0 && (t < s.t1 || (i === n - 1 && t <= s.t1 + 1e-9))) seg = s;
    }
    if (seg) {
      const u = seg.t1 <= seg.t0 ? 1 : (t - seg.t0) / (seg.t1 - seg.t0);
      const k = ease(u);
      for (let i = 0; i < 9; i++) {
        const key = graspKeys[i];
        q[key] = seg.q0[key] + (seg.q1[key] - seg.q0[key]) * k;
      }
      setStretch(q);
    }
    if (!close) return;
    objGroup.rotation.z = home.yaw;
    if (t < close.t1) {
      objGroup.position.set(home.x, home.y, home.z);
      return;
    }
    if (ok || !lift || t < lift.t1) {
      if (retract && t >= retract.t1) objGroup.position.set(parked[0], parked[1], parked[2]);
      else if (seg) {
        kinFK(q, graspFkBuf);
        objGroup.position.set(graspFkBuf.p[0] + off[0], graspFkBuf.p[1] + off[1], graspFkBuf.p[2] + off[2]);
      }
      return;
    }
    const u = Math.min(1, (t - lift.t1) / slipDur);
    const k = ease(u);
    objGroup.position.set(
      lifted[0] + (settle[0] - lifted[0]) * k,
      lifted[1] + (settle[1] - lifted[1]) * k,
      lifted[2] + (settle[2] - lifted[2]) * k,
    );
  };
}

function graspFingerCheck() {
  const tip = stretchRoot.getObjectByName("stretch-fingertip");
  if (!tip) return { ok: false, detail: "stretch-fingertip missing" };
  const poses = [
    { x: 0, lift: 0.86, arm: 0, yaw: 0, pitch: -0.55, roll: 0, grip: 0.07, pan: 0, tilt: -0.75 },
    { x: 0.12, lift: 0.95, arm: 0.22, yaw: 0.4, pitch: -1.2, roll: 0, grip: 0.04, pan: 0, tilt: -0.5 },
    { x: -0.18, lift: 1.02, arm: 0.48, yaw: -0.7, pitch: -0.85, roll: 0.4, grip: 0.09, pan: 0.2, tilt: -0.4 },
    { x: 0.05, lift: 0.9, arm: 0.15, yaw: 1.4, pitch: -1.57, roll: 0, grip: 0.02, pan: -0.3, tilt: -0.6 },
  ];
  let worst = 0;
  for (let i = 0; i < poses.length; i++) {
    setStretch(poses[i]);
    tip.updateWorldMatrix(true, false);
    tip.getWorldPosition(graspChkV);
    const fk = stretchFK(poses[i]).p;
    const err = Math.hypot(graspChkV.x - fk[0], -graspChkV.z - fk[1], graspChkV.y - fk[2]);
    if (err > worst) worst = err;
  }
  return { ok: worst <= 0.005, detail: `max ${(worst * 1000).toFixed(2)} mm` };
}

// ?demo=grasp lays out SCENES[0] and picks each object, then one bottle and one spoon so the close-ups
// have a pose. A bottle or spoon stays hidden until its own motion so it does not sit on the cups.
function graspDemoBoot() {
  CHECKS.push({ name: "fingertip FK", run: graspFingerCheck });
  if (QS.get("demo") !== "grasp") return;
  for (let i = objRoot.children.length - 1; i >= 0; i--) objRoot.remove(objRoot.children[i]);
  const scene = layoutScene(SCENES[0], 1);
  const extras = [];
  for (const cat of ["bottle", "spoon"]) {
    const host = SCENES.find((s) => s.set === "offline" && s.objects.some((o) => o.cat === cat));
    const laid = layoutScene(host, 1);
    extras.push(laid.objects.find((o) => o.cat === cat));
  }
  const objects = scene.objects.concat(extras);
  const home = {
    x: 0, lift: 0.86, arm: 0, yaw: 0, pitch: -0.55, roll: 0, grip: 0.07, pan: 0,
    tilt: -Math.atan2(CAM_POSE.pos[2] - CAM_POSE.look[2], CAM_POSE.look[1] - CAM_POSE.pos[1]),
  };
  let q = home;
  let tShift = 0;
  const all = [];
  const slipFirst = QS.get("slip") === "1";
  for (let i = 0; i < objects.length; i++) {
    const o = objects[i];
    const g = makeObject(o);
    g.position.set(o.x, o.y, TABLE.h);
    g.rotation.z = o.yaw || 0;
    g.visible = i < scene.objects.length;
    objRoot.add(g);
    const raw = graspWaypoints(o, q);
    const segs = [];
    for (let k = 0; k < raw.length; k++) {
      const s = raw[k];
      segs.push({ t0: s.t0 + tShift, t1: s.t1 + tShift, kind: s.kind, label: o.id + " " + s.kind, q0: s.q0, q1: s.q1 });
    }
    tShift = segs[segs.length - 1].t1;
    q = segs[segs.length - 1].q1;
    const showAt = segs[0].t0;
    if (i >= scene.objects.length) {
      TICKERS.push((t) => { g.visible = t >= showAt; });
    }
    TICKERS.push(graspTicker(segs, g, !(slipFirst && i === 0)));
    for (let k = 0; k < segs.length; k++) all.push(segs[k]);
  }
  setTimeline(all);
  window.graspDemo = all;
  if (window.pc && window.pc.play) window.pc.play();
}

queueMicrotask(graspDemoBoot);
