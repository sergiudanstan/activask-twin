// ================================================================ head camera (prefix hc)
// Renders stretchHeadCam() into #cam-canvas at <= 5 Hz while the Camera panel is open.
// Cand.box is the perception pinhole (CAM_POSE). The check projects each object centre
// with this same three.js camera and requires it inside that box.

let hcCam = null;
let hcTarget = null;
let hcCtx = null;
let hcImg = null;
let hcBuf = null;
let hcStamp = 0;
const hcTags = [];
const hcLabels = [];
const hcStroke = [];
const hcDash = [6, 4];
const hcSolid = [];
const hcPos = new THREE.Vector3();
const hcLook = new THREE.Vector3();
const hcTmp = new THREE.Vector3();
const hcVp = new THREE.Vector4();
const hcSc = new THREE.Vector4();

function hcAim() {
  const h = stretchHeadCam();
  hcPos.set(h.pos[0], h.pos[2], -h.pos[1]);
  hcLook.set(h.look[0], h.look[2], -h.look[1]);
  hcCam.position.copy(hcPos);
  hcCam.up.set(0, 1, 0);
  hcCam.lookAt(hcLook);
  hcCam.updateMatrixWorld(true);
}

function hcMakeSprite(disp) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#c4531a";
  g.beginPath();
  g.arc(64, 64, 54, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 6;
  g.strokeStyle = "#ffffff";
  g.stroke();
  g.fillStyle = "#ffffff";
  g.font = "700 72px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 6;
  g.strokeStyle = "#1a100c";
  g.strokeText(String(disp), 64, 70);
  g.fillText(String(disp), 64, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(0.09, 0.09, 1);
  s.renderOrder = 20;
  s.castShadow = false;
  s.receiveShadow = false;
  s.name = "tag-c" + disp;
  s.userData.appSprite = true;
  s.userData.hcDisp = disp;
  return s;
}

function hcRebuildTags() {
  for (let i = 0; i < hcTags.length; i++) {
    const s = hcTags[i];
    if (s.parent) s.parent.remove(s);
    if (s.material) {
      if (s.material.map) s.material.map.dispose();
      s.material.dispose();
    }
  }
  hcTags.length = 0;
  if (!appUse3d()) return;
  for (let i = 0; i < appCands.length; i++) {
    const c = appCands[i];
    const o = appObj(c.obj);
    const group = appGroups.get(c.obj);
    if (!o || !group) continue;
    const s = hcMakeSprite(c.disp);
    // Scene space, not under world: a sprite parented to the -90° cell frame
    // lies flat and casts a square shadow across the cup.
    const z = TABLE.h + dimsOf(o).h + 0.08;
    s.position.set(o.x, z, -o.y);
    scene.add(s);
    hcTags.push(s);
  }
}

function hcSyncTags() {
  for (let i = 0; i < hcTags.length; i++) {
    const s = hcTags[i];
    const n = s.userData.hcDisp;
    const alive = appAlive[n] === 1;
    const hot = appHot === n;
    const opacity = alive ? 1 : 0.28;
    if (s.material.opacity !== opacity) s.material.opacity = opacity;
    s.material.color.setHex(alive ? 0xffffff : 0x9a9a9a);
    const sc = hot ? 0.11 : 0.09;
    if (s.scale.x !== sc) s.scale.set(sc, sc, 1);
  }
}

function hcPrepOverlay() {
  const n = appCands.length;
  hcLabels.length = n;
  hcStroke.length = n;
  for (let i = 0; i < n; i++) {
    const c = appCands[i];
    const o = appObj(c.obj);
    hcLabels[i] = c.disp + "  " + c.score.toFixed(2);
    hcStroke[i] = uiHex(o && o.color);
  }
}

function hcBlit() {
  const w = CAM.w, h = CAM.h, row = w * 4;
  const src = hcBuf, dst = hcImg.data;
  for (let y = 0; y < h; y++) dst.set(src.subarray((h - 1 - y) * row, (h - y) * row), y * row);
  hcCtx.putImageData(hcImg, 0, 0);
}

function hcDrawBoxes() {
  const g = hcCtx;
  g.font = "600 15px sans-serif";
  g.textBaseline = "alphabetic";
  for (let i = 0; i < appCands.length; i++) {
    const c = appCands[i];
    const b = c.box;
    if (!b) continue;
    const x = b[0], y = b[1], w = b[2] - b[0], h = b[3] - b[1];
    const alive = appAlive[c.disp] === 1;
    const hot = appHot === c.disp;
    g.lineWidth = hot ? 4 : 2;
    g.strokeStyle = !alive ? "rgba(150,150,150,0.95)" : (hot ? "#ff8a4c" : (hcStroke[i] || "#c4531a"));
    g.setLineDash(alive ? hcSolid : hcDash);
    g.strokeRect(x, y, w, h);
    const text = hcLabels[i] || String(c.disp);
    const tw = g.measureText(text).width;
    const ly = y >= 20 ? y - 18 : y + 2;
    g.setLineDash(hcSolid);
    g.fillStyle = !alive ? "rgba(60,60,60,0.8)" : "rgba(20,16,14,0.82)";
    g.fillRect(x, ly, tw + 8, 16);
    g.fillStyle = "#ffffff";
    g.fillText(text, x + 4, ly + 13);
  }
}

function hcRender() {
  if (!hcCam || !hcCtx) return;
  const now = performance.now();
  if (now - hcStamp < 200) return;
  hcStamp = now;
  for (let i = 0; i < hcTags.length; i++) hcTags[i].visible = false;
  const prevTarget = renderer.getRenderTarget();
  const prevClear = renderer.autoClear;
  const scTest = renderer.getScissorTest();
  renderer.getViewport(hcVp);
  renderer.getScissor(hcSc);
  try {
    hcAim();
    renderer.autoClear = true;
    renderer.setScissorTest(false);
    renderer.setRenderTarget(hcTarget);
    renderer.clear();
    renderer.render(scene, hcCam);
    renderer.readRenderTargetPixels(hcTarget, 0, 0, CAM.w, CAM.h, hcBuf);
  } finally {
    renderer.setRenderTarget(prevTarget);
    renderer.setViewport(hcVp.x, hcVp.y, hcVp.z, hcVp.w);
    renderer.setScissor(hcSc.x, hcSc.y, hcSc.z, hcSc.w);
    renderer.setScissorTest(scTest);
    renderer.autoClear = prevClear;
    for (let i = 0; i < hcTags.length; i++) hcTags[i].visible = true;
  }
  hcBlit();
  hcDrawBoxes();
}

function hcTick() {
  if (!hcCam || !panelOpen("camera-card")) return;
  hcRender();
}

function hcCheckBoxes() {
  if (!hcCam) return { ok: false, detail: "head camera is not ready" };
  if (!appCands.length) return { ok: true, detail: "no candidates" };
  hcAim();
  let worst = 0, bad = 0;
  const bits = [];
  for (let i = 0; i < appCands.length; i++) {
    const c = appCands[i];
    const o = appObj(c.obj);
    if (!o || !c.box) { bad++; bits.push(c.id + " missing"); continue; }
    const z = TABLE.h + dimsOf(o).h * 0.5;
    hcTmp.set(o.x, z, -o.y);
    hcTmp.project(hcCam);
    const u = (hcTmp.x * 0.5 + 0.5) * CAM.w;
    const v = (0.5 - hcTmp.y * 0.5) * CAM.h;
    const b = c.box;
    const du = u < b[0] ? b[0] - u : (u > b[2] ? u - b[2] : 0);
    const dv = v < b[1] ? b[1] - v : (v > b[3] ? v - b[3] : 0);
    const out = Math.hypot(du, dv);
    if (out > worst) worst = out;
    const behind = hcTmp.z < -1 || hcTmp.z > 1;
    if (behind || out > 3) {
      bad++;
      bits.push(c.id + " (" + u.toFixed(0) + "," + v.toFixed(0) + ") off " + out.toFixed(1) + "px");
    }
  }
  return {
    ok: bad === 0,
    detail: bad ? bits.join("; ") : appCands.length + " centres inside, max outside " + worst.toFixed(2) + " px",
  };
}

function hcBoot() {
  const canvas = $("cam-canvas");
  if (!canvas) return;
  hcCtx = canvas.getContext("2d", { willReadFrequently: true });
  hcImg = hcCtx.createImageData(CAM.w, CAM.h);
  hcCam = new THREE.PerspectiveCamera(CAM.vfov, CAM.w / CAM.h, 0.05, 12);
  hcTarget = new THREE.WebGLRenderTarget(CAM.w, CAM.h, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    depthBuffer: true,
    stencilBuffer: false,
    samples: 0,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
  });
  hcTarget.texture.colorSpace = THREE.SRGBColorSpace;
  hcBuf = new Uint8Array(CAM.w * CAM.h * 4);
  TICKERS.push(hcTick);
  CHECKS.push({ name: "headcam boxes", run: hcCheckBoxes });
}

queueMicrotask(hcBoot);
