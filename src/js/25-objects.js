// ================================================================ tabletop objects
// makeObject(o) -> THREE.Group named o.id. Origin at the base centre, cell frame, z up.
// The caller sets x, y, TABLE.h and yaw. objGallery() fills the table when the URL has ?gallery.
const objRoot = moduleRoot("objects");

const OBJ_COLORS = Object.freeze({
  white: 0xf4f1ea, black: 0x1b1c1e, red: 0xc44738, orange: 0xe07a2c, yellow: 0xe4c24b,
  green: 0x3d8c4c, blue: 0x2c5fbe, pink: 0xd36b8c, grey: 0x8b9096, clear: 0xe6f1f5,
});

const objMatCache = new Map();
function objMaterial(color, material) {
  const key = color + "/" + material;
  const hit = objMatCache.get(key);
  if (hit) return hit;
  const c = OBJ_COLORS[color] !== undefined ? OBJ_COLORS[color] : 0xcccccc;
  const clear = color === "clear";
  const glass = clear || material === "glass";
  let m;
  if (glass) {
    m = phys(c, material === "paper" ? 0.45 : 0.06, material === "metal" ? 0.25 : 0, {
      transmission: 0.9, thickness: 0.35, transparent: true, opacity: 1, ior: 1.45,
      clearcoat: 0.55, clearcoatRoughness: 0.08, envMapIntensity: 1.05,
      attenuationColor: c, attenuationDistance: clear ? 0.22 : 0.4,
      side: THREE.DoubleSide,
    });
  } else if (material === "ceramic") {
    m = phys(c, 0.2, 0, { clearcoat: 0.82, clearcoatRoughness: 0.16, envMapIntensity: 0.75, side: THREE.DoubleSide });
  } else if (material === "plastic") {
    m = phys(c, 0.42, 0, { clearcoat: 0.16, clearcoatRoughness: 0.42, side: THREE.DoubleSide });
  } else if (material === "metal") {
    m = phys(c, 0.34, 1, { roughnessMap: brushRough, envMapIntensity: 0.85, side: THREE.DoubleSide });
  } else {
    m = mat(c, 0.92, 0, { side: THREE.DoubleSide });
  }
  objMatCache.set(key, m);
  return m;
}

function objLathe(prof, material, parent, seg, name) {
  const o = lathe(prof, material, parent, seg);
  if (name) o.name = name;
  return o;
}

function objCup(o, material, parent) {
  const d = dimsOf(o);
  const R = d.d / 2;
  const H = d.h;
  const wall = Math.max(0.0016, Math.min(0.0026, R * 0.07));
  const lip = Math.min(0.0032, H * 0.04);
  objLathe([
    [0.001, 0],
    [R * 0.7, 0],
    [R * 0.95, 0.003],
    [R, H * 0.16],
    [R * 0.985, H - lip],
    [R + lip * 0.4, H],
    [R - wall, H],
    [R - wall, wall + 0.0014],
    [R * 0.5, wall * 0.6],
    [0.001, wall * 0.5],
  ], material, parent, 36, o.id + "-body");
  if (o.handle) {
    const hr = Math.min(0.015, H * 0.18);
    const z0 = H * 0.36;
    const z1 = H * 0.76;
    const h = tubeAlong([
      [R * 0.9, 0, z0],
      [R + hr * 0.7, 0, z0 + (z1 - z0) * 0.2],
      [R + hr * 1.15, 0, (z0 + z1) * 0.5],
      [R + hr * 0.7, 0, z1 - (z1 - z0) * 0.2],
      [R * 0.9, 0, z1],
    ], 0.0034, material, parent, 8, 6);
    h.name = o.id + "-handle";
  }
  if (o.lid) {
    const z = H + 0.0006;
    objLathe([
      [0.001, z],
      [R * 1.005, z],
      [R * 1.04, z + 0.0035],
      [R * 0.7, z + 0.008],
      [R * 0.46, z + 0.014],
      [R * 0.14, z + 0.018],
      [0.001, z + 0.011],
    ], material, parent, 28, o.id + "-lid");
    const sip = mesh(new THREE.SphereGeometry(Math.max(0.004, R * 0.16), 10, 8), material, parent);
    sip.scale.set(1.2, 0.72, 0.55);
    sip.position.set(R * 0.42, 0, z + 0.020);
    sip.name = o.id + "-sip";
  }
}

function objBottle(o, material, parent) {
  const d = dimsOf(o);
  const R = d.d / 2;
  const H = d.h;
  const neck = Math.max(0.01, R * 0.32);
  const shoulder = H * 0.66;
  const neckZ = H * 0.82;
  const wall = 0.0014;
  const prof = [
    [0.001, 0],
    [R * 0.75, 0],
    [R, H * 0.05],
    [R, shoulder],
    [neck * 1.25, neckZ],
    [neck, H - 0.002],
    [neck + 0.0008, H],
    [neck - wall, H],
    [neck - wall, neckZ + 0.012],
    [R - wall, shoulder - 0.004],
    [R - wall, wall],
    [0.001, wall * 0.65],
  ];
  objLathe(prof, material, parent, 36, o.id + "-body");
  if (o.lid) {
    objLathe([
      [0.001, H - 0.001],
      [neck * 1.2, H - 0.001],
      [neck * 1.28, H + 0.003],
      [neck * 1.28, H + 0.016],
      [neck * 0.55, H + 0.022],
      [0.001, H + 0.022],
    ], material, parent, 24, o.id + "-cap");
  }
}

function objShift(geo, x, y, z) {
  geo.translate(x, y, z);
  return geo;
}

function objFork(o, material, parent) {
  const d = dimsOf(o);
  const L = d.l;
  const W = d.w;
  const T = d.h;
  const handleL = L * 0.56;
  const rr = Math.min(0.0012, T * 0.25);
  const handleH = T * 0.85;
  const handle = mesh(new RoundedBoxGeometry(handleL, W * 0.42, handleH, 2, rr), material, parent);
  handle.position.set(-L / 2 + handleL / 2, 0, handleH / 2);
  handle.name = o.id + "-handle";
  const boxes = [];
  const neckL = L * 0.10;
  const neckX = -L / 2 + handleL + neckL / 2 - L * 0.02;
  boxes.push(objShift(new THREE.BoxGeometry(neckL, W * 0.88, T * 0.9), neckX, 0, T * 0.48));
  const tineW = W * 0.15;
  const span = W * 0.92;
  const gap = (span - 4 * tineW) / 3;
  const tineStart = neckX + neckL / 2 - L * 0.015;
  const tineLen = L / 2 - tineStart;
  for (let i = 0; i < 4; i++) {
    const y = -span / 2 + tineW / 2 + i * (tineW + gap);
    boxes.push(objShift(new THREE.BoxGeometry(tineLen, tineW, T * 0.42), tineStart + tineLen / 2, y, T * 0.26));
  }
  const merged = BufferGeometryUtils.mergeGeometries(boxes);
  boxes.forEach((g) => g.dispose());
  const head = mesh(merged, material, parent);
  head.name = o.id + "-tines";
}

function objSpoon(o, material, parent) {
  const d = dimsOf(o);
  const L = d.l;
  const W = d.w;
  const T = d.h;
  const bowlL = L * 0.4;
  const handleL = L * 0.68;
  const rr = Math.min(0.0016, T * 0.3);
  const handleH = T * 0.72;
  const handle = mesh(new RoundedBoxGeometry(handleL, Math.min(W * 0.38, 0.012), handleH, 2, rr), material, parent);
  handle.position.set(-L / 2 + handleL / 2, 0, handleH / 2);
  handle.name = o.id + "-handle";
  const Rb = W / 2;
  const depth = Math.max(0.006, T * 1.15);
  const bowl = objLathe([
    [0.001, 0.0012],
    [Rb * 0.45, 0.0016],
    [Rb * 0.82, depth * 0.32],
    [Rb, depth * 0.78],
    [Rb * 0.86, depth * 0.96],
    [Rb * 0.62, depth * 0.42],
    [Rb * 0.30, depth * 0.22],
    [0.001, depth * 0.22],
  ], material, parent, 28, o.id + "-bowl");
  bowl.scale.set(bowlL / W, 0.92, 1);
  bowl.position.set(L / 2 - bowlL / 2, 0, 0);
}

function makeObject(o) {
  const g = new THREE.Group();
  g.name = o.id;
  const material = objMaterial(o.color, o.material);
  if (o.cat === "cup") objCup(o, material, g);
  else if (o.cat === "bottle") objBottle(o, material, g);
  else if (o.cat === "fork") objFork(o, material, g);
  else objSpoon(o, material, g);
  return g;
}

function objMount(o) {
  const g = makeObject(o);
  g.position.set(o.x, o.y, TABLE.h);
  g.rotation.z = o.yaw || 0;
  objRoot.add(g);
  return g;
}

// Eight-object demo the table, robot and close-up shots use. Hero cup is o1.
function objDemo() {
  const demo = [
    { id: "o1", cat: "cup", color: "orange", size: "large", material: "ceramic", handle: true, lid: true, x: 0.18, y: 0.02, yaw: 0.6 },
    { id: "o2", cat: "cup", color: "white", size: "medium", material: "ceramic", handle: true, lid: false, x: -0.24, y: 0.10, yaw: -0.5 },
    { id: "o3", cat: "cup", color: "blue", size: "small", material: "plastic", handle: false, lid: false, x: -0.02, y: 0.18, yaw: 0.2 },
    { id: "o4", cat: "bottle", color: "clear", size: "medium", material: "glass", handle: false, lid: false, x: -0.40, y: -0.06, yaw: 0.15 },
    { id: "o5", cat: "bottle", color: "green", size: "large", material: "glass", handle: false, lid: true, x: 0.40, y: -0.04, yaw: -0.2 },
    { id: "o6", cat: "fork", color: "grey", size: "medium", material: "metal", handle: false, lid: false, x: -0.16, y: -0.16, yaw: 0.9 },
    { id: "o7", cat: "spoon", color: "grey", size: "medium", material: "metal", handle: false, lid: false, x: 0.08, y: -0.18, yaw: -0.45 },
    { id: "o8", cat: "spoon", color: "pink", size: "small", material: "plastic", handle: false, lid: false, x: 0.30, y: 0.18, yaw: 1.1 },
  ];
  for (const o of demo) objMount(o);
}

// Every category × size, plus a few colour / material / handle / lid variants, packed on the table.
function objGallery() {
  const items = [];
  let n = 1;
  const add = (o) => { items.push({ handle: false, lid: false, yaw: 0, ...o, id: "o" + n }); n += 1; };
  for (const size of ATTRS.size) add({ cat: "cup", size, color: "white", material: "ceramic" });
  add({ cat: "cup", size: "medium", color: "orange", material: "ceramic", handle: true, lid: true, yaw: 0.7 });
  add({ cat: "cup", size: "medium", color: "red", material: "plastic", handle: true, yaw: -0.4 });
  add({ cat: "cup", size: "large", color: "clear", material: "glass", lid: true });
  for (const size of ATTRS.size) add({ cat: "bottle", size, color: size === "small" ? "clear" : "blue", material: size === "large" ? "plastic" : "glass", lid: size !== "medium" });
  add({ cat: "bottle", size: "medium", color: "green", material: "glass", lid: true });
  for (const size of ATTRS.size) add({ cat: "fork", size, color: "grey", material: "metal", yaw: Math.PI / 2 });
  for (const size of ATTRS.size) add({ cat: "spoon", size, color: size === "large" ? "pink" : "grey", material: size === "small" ? "plastic" : "metal", yaw: Math.PI / 2 });
  add({ cat: "cup", size: "small", color: "black", material: "metal", handle: true, yaw: 0.4 });
  add({ cat: "spoon", size: "medium", color: "yellow", material: "plastic", yaw: 0.4 });
  // 3 rows. Utensils lie along y (yaw π/2) so the row pitch can stay inside the table.
  const rows = [-0.20, 0.02, 0.22];
  const per = Math.ceil(items.length / rows.length);
  items.forEach((o, i) => {
    const row = Math.floor(i / per);
    const col = i % per;
    const nCol = Math.min(per, items.length - row * per);
    const span = 1.0;
    o.x = nCol === 1 ? 0 : -span / 2 + (span * col) / (nCol - 1);
    o.y = rows[Math.min(row, rows.length - 1)];
    objMount(o);
  });
}

if (QS.has("gallery")) objGallery();
else objDemo();

if (QS.has("solo") && QS.get("solo") !== "objects") objRoot.visible = false;
