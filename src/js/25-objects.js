// ================================================================ tabletop objects
// makeObject(o) -> THREE.Group named o.id. Origin at the base centre, cell frame, z up.
// The caller sets x, y, TABLE.h and yaw. objGallery() fills the table when the URL has ?gallery.
// Local axes match footprintDiscs: cups and bottles are round about z, a cup handle points along +x,
// a fork or spoon lies flat with its length along x and its tines or bowl toward +x (yaw 0 = cell +x).
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
  objLathe(objCupProfile(o), material, parent, 36, o.id + "-body");
  if (o.handle) {
    const hnd = objCupHandle(o);
    const h = tubeAlong(hnd.pts, hnd.r, material, parent, 8, 6);
    h.name = o.id + "-handle";
  }
  if (o.lid) {
    const lid = objCupLid(o);
    objLathe(lid.profile, material, parent, 28, o.id + "-lid");
    const sip = mesh(new THREE.SphereGeometry(lid.sipR, 10, 8), material, parent);
    sip.scale.set(lid.sipSx, lid.sipSy, lid.sipSz);
    sip.position.set(lid.sipX, 0, lid.sipZ);
    sip.name = o.id + "-sip";
  }
}

function objBottle(o, material, parent) {
  objLathe(objBottleProfile(o), material, parent, 36, o.id + "-body");
  if (o.lid) objLathe(objBottleCapProfile(o), material, parent, 24, o.id + "-cap");
}

function objShift(geo, x, y, z) {
  geo.translate(x, y, z);
  return geo;
}

function objFork(o, material, parent) {
  const parts = objForkParts(o);
  const h = parts.handle;
  const handle = mesh(new RoundedBoxGeometry(h.l, h.w, h.h, 2, h.r), material, parent);
  handle.position.set(h.x, h.y, h.z);
  handle.name = o.id + "-handle";
  const boxes = [];
  for (let i = 0; i < parts.boxes.length; i++) {
    const b = parts.boxes[i];
    boxes.push(objShift(new THREE.BoxGeometry(b.l, b.w, b.h), b.x, b.y, b.z));
  }
  const merged = BufferGeometryUtils.mergeGeometries(boxes);
  boxes.forEach((g) => g.dispose());
  const head = mesh(merged, material, parent);
  head.name = o.id + "-tines";
}

function objSpoon(o, material, parent) {
  const parts = objSpoonParts(o);
  const h = parts.handle;
  const handle = mesh(new RoundedBoxGeometry(h.l, h.w, h.h, 2, h.r), material, parent);
  handle.position.set(h.x, h.y, h.z);
  handle.name = o.id + "-handle";
  const bowl = objLathe(parts.bowl.profile, material, parent, 28, o.id + "-bowl");
  bowl.scale.set(parts.bowl.sx, parts.bowl.sy, 1);
  bowl.position.set(parts.bowl.x, 0, 0);
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
  // 3 rows. yaw π/2 turns local +x onto cell +y so the utensils fit the row pitch.
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
