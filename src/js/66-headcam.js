// ================================================================ head camera (prefix hc)
// Renders stretchHeadCam() into #cam-canvas at <= 5 Hz while the Camera panel is open.
// Cand.box is the perception pinhole (CAM_POSE). The check projects each object's
// 3D box with this three.js camera and requires IoU >= 0.8. A shifted or oversized
// box must fail. Number tags keep a constant pixel size and sit above the object.

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
const hcLift = new Float64Array(128);
const hcPx = new Float64Array(128);
const hcPy = new Float64Array(128);
const hcPw = new Float64Array(128);
const hcLab = [];
for (let i = 0; i < 32; i++) hcLab.push({ x: 0, y: 0, w: 0, h: 0 });

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
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(0.02, 0.02, 1);
  s.center.set(0.5, 0);
  s.renderOrder = 20;
  s.castShadow = false;
  s.receiveShadow = false;
  s.name = "tag-c" + disp;
  s.userData.appSprite = true;
  s.userData.hcDisp = disp;
  s.userData.hcBase = new THREE.Vector3();
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
    // lies flat and casts a square shadow across the cup. The anchor is the
    // object top; hcLayoutTags lifts the disc above the screen box.
    const z = TABLE.h + dimsOf(o).h;
    s.userData.hcObj = o;
    s.userData.hcBase.set(o.x, z, -o.y);
    s.position.copy(s.userData.hcBase);
    scene.add(s);
    hcTags.push(s);
  }
}

function hcScreenTop(o, w, h) {
  const d = dimsOf(o);
  const hx = (o.cat === "cup" || o.cat === "bottle") ? d.d / 2 : d.l / 2;
  const hy = (o.cat === "cup" || o.cat === "bottle") ? d.d / 2 : d.w / 2;
  const yaw = o.yaw || 0;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  let top = Infinity, n = 0;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [0, 1]) {
    const lx = sx * hx, ly = sy * hy;
    hcTmp.set(o.x + c * lx - s * ly, TABLE.h + sz * d.h, -(o.y + s * lx + c * ly));
    hcTmp.project(camera);
    if (hcTmp.z < -1 || hcTmp.z > 1) continue;
    const v = (0.5 - hcTmp.y * 0.5) * h;
    if (v < top) top = v;
    n++;
  }
  return n ? top : null;
}

function hcTagOverlap(i, j) {
  const iw = hcPw[i], jw = hcPw[j];
  const ix0 = hcPx[i] - iw * 0.5, ix1 = hcPx[i] + iw * 0.5;
  const iy1 = hcPy[i] - hcLift[i] * iw, iy0 = iy1 - iw;
  const jx0 = hcPx[j] - jw * 0.5, jx1 = hcPx[j] + jw * 0.5;
  const jy1 = hcPy[j] - hcLift[j] * jw, jy0 = jy1 - jw;
  return ix0 < jx1 - 2 && ix1 > jx0 + 2 && iy0 < jy1 - 2 && iy1 > jy0 + 2;
}

function hcLayoutTags() {
  const n = hcTags.length;
  if (!n || n > hcLift.length) return;
  const w = viewport.clientWidth, h = viewport.clientHeight;
  if (w < 2 || h < 2) return;
  const k = 2 * Math.tan((camera.fov * Math.PI) / 360) / h;
  for (let i = 0; i < n; i++) {
    const s = hcTags[i];
    const px = appHot === s.userData.hcDisp ? 32 : 26;
    hcPw[i] = px;
    const sc = px * k;
    if (s.scale.x !== sc) s.scale.set(sc, sc, 1);
    const o = s.userData.hcObj;
    const top = o ? hcScreenTop(o, w, h) : null;
    hcTmp.copy(s.userData.hcBase);
    hcTmp.project(camera);
    if (hcTmp.z < -1 || hcTmp.z > 1) {
      s.visible = false;
      hcPx[i] = -9999;
      hcLift[i] = 0;
      continue;
    }
    s.visible = true;
    const u = (hcTmp.x * 0.5 + 0.5) * w;
    const v = (0.5 - hcTmp.y * 0.5) * h;
    hcPx[i] = u;
    hcPy[i] = v;
    const clear = top == null ? 0 : Math.max(0, (v - top) / px);
    hcLift[i] = clear + 4 / px;
  }
  for (let pass = 0; pass < 10; pass++) {
    let hit = false;
    for (let i = 0; i < n; i++) {
      if (hcPx[i] < -1000) continue;
      for (let j = 0; j < i; j++) {
        if (hcPx[j] < -1000) continue;
        if (!hcTagOverlap(i, j)) continue;
        const up = hcPy[i] >= hcPy[j] ? i : j;
        hcLift[up] += 0.55;
        hit = true;
      }
    }
    if (!hit) break;
  }
  for (let i = 0; i < n; i++) {
    if (hcLift[i] > 6) hcLift[i] = 6;
    const s = hcTags[i];
    if (s.center.y !== -hcLift[i]) s.center.set(0.5, -hcLift[i]);
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
    if (hot) s.renderOrder = 21;
    else s.renderOrder = 20;
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

function hcLabelHit(x, y, w, h, n) {
  for (let i = 0; i < n; i++) {
    const r = hcLab[i];
    if (x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y) return true;
  }
  return false;
}

function hcDrawBoxes() {
  const g = hcCtx;
  const canvas = $("cam-canvas");
  const shown = canvas ? canvas.clientWidth : CAM.w;
  const fontPx = Math.max(22, Math.round(14 * CAM.w / Math.max(80, shown || CAM.w)));
  const lh = fontPx + 6;
  g.font = "600 " + fontPx + "px sans-serif";
  g.textBaseline = "alphabetic";
  let placed = 0;
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
    const bw = tw + 10;
    let lx = x;
    let ly = y >= lh + 2 ? y - lh : y + 2;
    for (let k = 0; k < 6 && hcLabelHit(lx, ly, bw, lh, placed); k++) {
      if (k % 2 === 0) ly += lh + 2;
      else lx += 8;
    }
    if (ly + lh > CAM.h) ly = Math.max(0, CAM.h - lh);
    g.setLineDash(hcSolid);
    g.fillStyle = !alive ? "rgba(60,60,60,0.8)" : "rgba(20,16,14,0.82)";
    g.fillRect(lx, ly, bw, lh);
    g.fillStyle = "#ffffff";
    g.fillText(text, lx + 5, ly + fontPx);
    if (placed < hcLab.length) {
      hcLab[placed].x = lx;
      hcLab[placed].y = ly;
      hcLab[placed].w = bw;
      hcLab[placed].h = lh;
      placed++;
    }
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
  if (hcCam && panelOpen("camera-card")) hcRender();
  hcLayoutTags();
}

function hcIoU(a, b) {
  const x0 = Math.max(a[0], b[0]), y0 = Math.max(a[1], b[1]);
  const x1 = Math.min(a[2], b[2]), y1 = Math.min(a[3], b[3]);
  const iw = x1 - x0, ih = y1 - y0;
  if (iw <= 0 || ih <= 0) return 0;
  const inter = iw * ih;
  const aa = Math.max(0, a[2] - a[0]) * Math.max(0, a[3] - a[1]);
  const bb = Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  const uni = aa + bb - inter;
  return uni <= 0 ? 0 : inter / uni;
}

function hcProjectBox(o) {
  const d = dimsOf(o);
  const hx = (o.cat === "cup" || o.cat === "bottle") ? d.d / 2 : d.l / 2;
  const hy = (o.cat === "cup" || o.cat === "bottle") ? d.d / 2 : d.w / 2;
  const yaw = o.yaw || 0;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  let u0 = Infinity, v0 = Infinity, u1 = -Infinity, v1 = -Infinity, n = 0;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [0, 1]) {
    const lx = sx * hx, ly = sy * hy;
    hcTmp.set(o.x + c * lx - s * ly, TABLE.h + sz * d.h, -(o.y + s * lx + c * ly));
    hcTmp.project(hcCam);
    if (hcTmp.z < -1 || hcTmp.z > 1) continue;
    const u = (hcTmp.x * 0.5 + 0.5) * CAM.w;
    const v = (0.5 - hcTmp.y * 0.5) * CAM.h;
    n++;
    if (u < u0) u0 = u;
    if (v < v0) v0 = v;
    if (u > u1) u1 = u;
    if (v > v1) v1 = v;
  }
  return n ? [u0, v0, u1, v1] : null;
}

function hcCheckBoxes() {
  if (!hcCam) return { ok: false, detail: "head camera is not ready" };
  if (!appCands.length) return { ok: true, detail: "no candidates" };
  hcAim();
  let minIoU = 1, bad = 0, worstShift = 0, worstBig = 0;
  const bits = [];
  for (let i = 0; i < appCands.length; i++) {
    const c = appCands[i];
    const o = appObj(c.obj);
    const proj = o ? hcProjectBox(o) : null;
    if (!o || !c.box || !proj) { bad++; bits.push(c.id + " missing"); continue; }
    const iou = hcIoU(proj, c.box);
    if (iou < minIoU) minIoU = iou;
    const b = c.box;
    const bw = b[2] - b[0], bh = b[3] - b[1];
    const shift = Math.max(30, Math.min(bw, bh) * 0.5);
    const shifted = [b[0] + shift, b[1] + shift, b[2] + shift, b[3] + shift];
    const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    const big = [cx - bw * 1.5, cy - bh * 1.5, cx + bw * 1.5, cy + bh * 1.5];
    const si = hcIoU(proj, shifted), bi = hcIoU(proj, big);
    if (si > worstShift) worstShift = si;
    if (bi > worstBig) worstBig = bi;
    if (iou < 0.8) { bad++; bits.push(c.id + " IoU " + iou.toFixed(2)); }
    if (si >= 0.8 || bi >= 0.8) { bad++; bits.push(c.id + " control still passes"); }
  }
  const ok = bad === 0;
  const detail = ok
    ? appCands.length + " boxes, min IoU " + minIoU.toFixed(2) + "; shift IoU " + worstShift.toFixed(2) + "; oversized IoU " + worstBig.toFixed(2)
    : bits.join("; ");
  return { ok, detail };
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
