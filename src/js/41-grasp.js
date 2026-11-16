// ================================================================ grasp animation
// graspTicker(segs, objGroup, ok, releaseAt) poses the robot with setStretch and carries objGroup from
// the end of close. ok === false opens the gripper, then drops the object straight down onto the table
// under the grasp point, and only then retracts. releaseAt, when set, puts the object back on its table
// pose at that time (the demo's next grasp). Omit it and a successful grasp stays in the hand (paper:
// grasp, lift, and retain). The tick allocates nothing.
const graspChkV = new THREE.Vector3();
const graspFkBuf = { p: [0, 0, 0], close: [0, 0, 0] };
const graspKeys = ["x", "lift", "arm", "yaw", "pitch", "roll", "grip", "pan", "tilt"];
const graspOpenDur = 0.25;
const graspDropDur = 0.35;

function graspTicker(segs, objGroup, ok, releaseAt) {
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
  if (close) {
    kinFK(close.q1, graspFkBuf);
    off[0] = home.x - graspFkBuf.p[0];
    off[1] = home.y - graspFkBuf.p[1];
    off[2] = home.z - graspFkBuf.p[2];
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
  const openGrip = lift ? Math.min(STRETCH.gripper.max, lift.q1.grip + 0.02) : 0;
  const n = segs.length;
  const haveRelease = releaseAt !== undefined && releaseAt !== null;

  return function graspTick(t) {
    let seg = null;
    let posed = false;
    if (ok === false && lift && retract && t >= lift.t1 && t <= retract.t1 + 1e-9) {
      const openEnd = lift.t1 + graspOpenDur;
      const dropEnd = openEnd + graspDropDur;
      if (t < dropEnd) {
        for (let i = 0; i < 9; i++) q[graspKeys[i]] = lift.q1[graspKeys[i]];
        const uo = Math.min(1, (t - lift.t1) / graspOpenDur);
        q.grip = lift.q1.grip + (openGrip - lift.q1.grip) * uo;
      } else {
        const span = retract.t1 - dropEnd;
        const u = span <= 1e-6 ? 1 : Math.min(1, (t - dropEnd) / span);
        const k = ease(u);
        for (let i = 0; i < 9; i++) {
          const key = graspKeys[i];
          q[key] = lift.q1[key] + (retract.q1[key] - lift.q1[key]) * k;
        }
        q.grip = openGrip;
      }
      setStretch(q);
      posed = true;
    }
    if (!posed) {
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
    }
    if (!close) return;
    objGroup.rotation.z = home.yaw;
    if (haveRelease && t >= releaseAt) {
      objGroup.position.set(home.x, home.y, home.z);
      return;
    }
    if (t < close.t1) {
      objGroup.position.set(home.x, home.y, home.z);
      return;
    }
    if (ok === false && lift && t >= lift.t1) {
      if (t < lift.t1 + graspOpenDur) {
        objGroup.position.set(lifted[0], lifted[1], lifted[2]);
        return;
      }
      const u = Math.min(1, (t - lift.t1 - graspOpenDur) / graspDropDur);
      const k = u * u;
      objGroup.position.set(lifted[0], lifted[1], lifted[2] + (TABLE.h - lifted[2]) * k);
      return;
    }
    if (retract && t >= retract.t1) {
      objGroup.position.set(parked[0], parked[1], parked[2]);
      return;
    }
    if (seg || posed) {
      kinFK(q, graspFkBuf);
      objGroup.position.set(graspFkBuf.p[0] + off[0], graspFkBuf.p[1] + off[1], graspFkBuf.p[2] + off[2]);
    }
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

// A laid-out object of `cat` that does not overlap `placed`. Falls back to the seed-1 sample.
function graspExtra(cat, placed) {
  const host = SCENES.find((s) => s.set === "offline" && s.objects.some((o) => o.cat === cat));
  for (let seed = 1; seed <= 8; seed++) {
    const laid = layoutScene(host, seed);
    for (let k = 0; k < laid.objects.length; k++) {
      const cand = laid.objects[k];
      if (cand.cat !== cat) continue;
      const discs = footprintDiscs(cand, cand.x, cand.y, cand.yaw || 0);
      const free = placed.every((p) => {
        const pd = footprintDiscs(p, p.x, p.y, p.yaw || 0);
        return pd.every(([u, v, r]) => discs.every(([u2, v2, r2]) => Math.hypot(u - u2, v - v2) > r + r2 + 0.03));
      });
      if (free) return { ...cand, id: "x-" + cat };
    }
  }
  const laid = layoutScene(host, 1);
  const cand = laid.objects.find((o) => o.cat === cat);
  return { ...cand, id: "x-" + cat };
}

// ?demo=grasp lays out SCENES[0] and picks each object, then a bottle, a fork and a spoon on free spots.
// ?mix=1 lays out the first offline mixed scene instead. ?slip=1 drops the first grasp.
// An object that cannot clear the table is left where it is. Previously carried objects are back on
// the table when the next grasp starts; the last one stays in the hand.
function graspDemoBoot() {
  CHECKS.push({ name: "fingertip FK", run: graspFingerCheck });
  if (QS.get("demo") !== "grasp") return;
  for (let i = objRoot.children.length - 1; i >= 0; i--) objRoot.remove(objRoot.children[i]);
  let objects;
  if (QS.get("mix") === "1") {
    const mixed = SCENES.find((s) => s.set === "offline" && s.family === "mixed");
    objects = layoutScene(mixed, 1).objects;
  } else {
    const scene = layoutScene(SCENES[0], 1);
    const placed = scene.objects.slice();
    const extras = [];
    for (const cat of ["bottle", "fork", "spoon"]) {
      const extra = graspExtra(cat, placed);
      extras.push(extra);
      placed.push(extra);
    }
    objects = scene.objects.concat(extras);
  }
  const home = {
    x: 0, lift: 0.86, arm: 0, yaw: 0, pitch: -0.55, roll: 0, grip: 0.07, pan: 0,
    tilt: -Math.atan2(CAM_POSE.pos[2] - CAM_POSE.look[2], CAM_POSE.look[1] - CAM_POSE.pos[1]),
  };
  let q = home;
  let tShift = 0;
  const all = [];
  const runs = [];
  const slipFirst = QS.get("slip") === "1";
  for (let i = 0; i < objects.length; i++) {
    const o = objects[i];
    const g = makeObject(o);
    g.position.set(o.x, o.y, TABLE.h);
    g.rotation.z = o.yaw || 0;
    objRoot.add(g);
    const others = [];
    for (let j = 0; j < objects.length; j++) if (j !== i) others.push(objects[j]);
    const raw = graspWaypoints(o, q, others);
    if (!Array.isArray(raw)) continue;
    const segs = [];
    for (let k = 0; k < raw.length; k++) {
      const s = raw[k];
      segs.push({ t0: s.t0 + tShift, t1: s.t1 + tShift, kind: s.kind, label: o.id + " " + s.kind, q0: s.q0, q1: s.q1 });
    }
    if (slipFirst && runs.length === 0) segs[segs.length - 1].t1 += graspOpenDur + graspDropDur;
    tShift = segs[segs.length - 1].t1;
    q = segs[segs.length - 1].q1;
    runs.push({ segs, g, ok: !(slipFirst && runs.length === 0) });
    for (let k = 0; k < segs.length; k++) all.push(segs[k]);
  }
  for (let i = 0; i < runs.length; i++) {
    const releaseAt = i + 1 < runs.length ? runs[i].segs[runs[i].segs.length - 1].t1 : undefined;
    TICKERS.push(graspTicker(runs[i].segs, runs[i].g, runs[i].ok, releaseAt));
  }
  setTimeline(all);
  window.graspDemo = all;
  if (window.pc && window.pc.play) window.pc.play();
}

queueMicrotask(graspDemoBoot);
