// ================================================================ lab room + table
// Cell frame (z up). MODULES.room holds everything static. The table top is exactly TABLE.
const labRoot = moduleRoot("room");

const labWall = phys(0xf3f0ea, 0.72, 0);
const labBoard = phys(0xe6e0d6, 0.7, 0);
const labTop = phys(0xf7f4ef, 0.38, 0.02, { clearcoat: 0.28, clearcoatRoughness: 0.32 });
const labEdge = phys(0xe4ddd4, 0.5, 0.02);
const labLeg = phys(0x5a6068, 0.46, 0.35);
const labShelf = phys(0xc9c3b8, 0.62, 0.04);
const labBin = phys(0xd5ddd9, 0.7, 0);
const labBin2 = phys(0xc5d0d4, 0.65, 0);
const labCart = phys(0xd8d4ce, 0.55, 0.04);
const labGlass = phys(0xd5e4ee, 0.08, 0, {
  transmission: 0.86, thickness: 0.4, transparent: true, opacity: 1, roughness: 0.06,
  envMapIntensity: 0.8, emissive: 0xe7f1f7, emissiveIntensity: 0.18, side: THREE.DoubleSide,
});
const labFrame = phys(0xf7f5f1, 0.5, 0);
const labRecess = phys(0xb7c9d4, 0.9, 0);
const labLight = phys(0xfff4e2, 0.45, 0, { emissive: 0xffefd2, emissiveIntensity: 1.15 });
const labHouse = phys(0x2c3136, 0.5, 0.25);
const labBoardFace = phys(0xfbfbf8, 0.6, 0);
const labFloorMat = phys(0xd4d0ca, 0.62, 0, { map: epoxyMap });

{
  const floor = mesh(new THREE.PlaneGeometry(7.2, 6.2), labFloorMat, labRoot);
  floor.name = "lab-floor";
  floor.receiveShadow = true;
  floor.castShadow = false;
}

// Two walls meeting at the back-left corner. Open on the right and the robot side.
rbox(5.4, 0.08, 2.32, 0.01, labWall, 0.15, 1.78, 1.16, labRoot).name = "lab-wall-back";
rbox(0.08, 4.7, 2.32, 0.01, labWall, -2.45, 0.15, 1.16, labRoot).name = "lab-wall-left";
rbox(5.4, 0.025, 0.09, 0.004, labBoard, 0.15, 1.73, 0.045, labRoot).name = "lab-baseboard-back";
rbox(0.025, 4.7, 0.09, 0.004, labBoard, -2.40, 0.15, 0.045, labRoot).name = "lab-baseboard-left";

// Window on the back wall, high enough to clear the shelf.
rbox(1.15, 0.012, 0.78, 0.004, labRecess, 0.85, 1.732, 1.48, labRoot).name = "lab-window-recess";
{
  const glass = mesh(new THREE.PlaneGeometry(1.02, 0.66), labGlass, labRoot);
  glass.rotation.x = Math.PI / 2;
  glass.position.set(0.85, 1.724, 1.48);
  glass.name = "lab-window";
  glass.castShadow = false;
}
rbox(1.12, 0.018, 0.035, 0.004, labFrame, 0.85, 1.718, 1.82, labRoot).name = "lab-window-rail-t";
rbox(1.12, 0.018, 0.035, 0.004, labFrame, 0.85, 1.718, 1.14, labRoot).name = "lab-window-rail-b";
rbox(0.035, 0.018, 0.70, 0.004, labFrame, 0.31, 1.718, 1.48, labRoot).name = "lab-window-rail-l";
rbox(0.035, 0.018, 0.70, 0.004, labFrame, 1.39, 1.718, 1.48, labRoot).name = "lab-window-rail-r";
rbox(0.018, 0.016, 0.66, 0.002, labFrame, 0.85, 1.716, 1.48, labRoot).name = "lab-window-mullion";
rbox(1.22, 0.05, 0.022, 0.003, labFrame, 0.85, 1.70, 1.10, labRoot).name = "lab-window-sill";

// Whiteboard on the left wall.
rbox(0.02, 0.9, 0.55, 0.006, labBoardFace, -2.39, -0.35, 1.45, labRoot).name = "lab-board";
rbox(0.015, 0.96, 0.025, 0.003, labHouse, -2.385, -0.35, 1.74, labRoot);
rbox(0.015, 0.96, 0.025, 0.003, labHouse, -2.385, -0.35, 1.16, labRoot);

// Shelf against the back wall, left of the window.
rbox(1.15, 0.28, 0.02, 0.003, labShelf, -0.85, 1.50, 0.38, labRoot).name = "lab-shelf-1";
rbox(1.15, 0.28, 0.02, 0.003, labShelf, -0.85, 1.50, 0.72, labRoot).name = "lab-shelf-2";
rbox(1.15, 0.28, 0.02, 0.003, labShelf, -0.85, 1.50, 1.04, labRoot).name = "lab-shelf-3";
rbox(0.03, 0.28, 1.02, 0.004, labShelf, -1.40, 1.50, 0.55, labRoot).name = "lab-shelf-up-l";
rbox(0.03, 0.28, 1.02, 0.004, labShelf, -0.30, 1.50, 0.55, labRoot).name = "lab-shelf-up-r";
rbox(0.22, 0.16, 0.14, 0.004, labBin, -1.15, 1.50, 0.46, labRoot).name = "lab-bin-a";
rbox(0.16, 0.12, 0.10, 0.003, labBin2, -0.78, 1.50, 0.44, labRoot).name = "lab-bin-b";
rbox(0.28, 0.18, 0.08, 0.003, labBin, -0.95, 1.50, 0.78, labRoot).name = "lab-bin-c";
rbox(0.10, 0.14, 0.18, 0.003, labBin2, -0.55, 1.50, 1.15, labRoot).name = "lab-bin-d";

// Utility cart, back right, clear of the table.
rbox(0.46, 0.32, 0.02, 0.003, labCart, 1.45, 0.95, 0.42, labRoot).name = "lab-cart-low";
rbox(0.46, 0.32, 0.02, 0.003, labCart, 1.45, 0.95, 0.78, labRoot).name = "lab-cart-high";
rbox(0.025, 0.025, 0.76, 0.003, labLeg, 1.25, 0.82, 0.39, labRoot);
rbox(0.025, 0.025, 0.76, 0.003, labLeg, 1.65, 0.82, 0.39, labRoot);
rbox(0.025, 0.025, 0.76, 0.003, labLeg, 1.25, 1.08, 0.39, labRoot);
rbox(0.025, 0.025, 0.76, 0.003, labLeg, 1.65, 1.08, 0.39, labRoot);
{
  const wheel = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 12);
  for (const [x, y] of [[1.25, 0.82], [1.65, 0.82], [1.25, 1.08], [1.65, 1.08]]) {
    const w = mesh(wheel, M.blackRubber, labRoot);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, y, 0.03);
    w.castShadow = true;
  }
}
rbox(0.2, 0.16, 0.1, 0.004, labBin2, 1.45, 0.95, 0.85, labRoot).name = "lab-cart-box";

// Two pendant fixtures over the table. No ceiling, so the iso view still reads the room.
rbox(0.62, 0.08, 0.025, 0.004, labHouse, -0.34, -0.02, 1.78, labRoot).name = "lab-light-a";
rbox(0.62, 0.08, 0.025, 0.004, labHouse, 0.34, -0.02, 1.78, labRoot).name = "lab-light-b";
{
  const glow = new THREE.BoxGeometry(0.5, 0.045, 0.008);
  const a = mesh(glow, labLight, labRoot);
  a.position.set(-0.34, -0.02, 1.76);
  a.castShadow = false;
  const b = mesh(glow, labLight, labRoot);
  b.position.set(0.34, -0.02, 1.76);
  b.castShadow = false;
}

// Test table. Top face is the plane z = TABLE.h. Legs and an apron underneath. Light top.
{
  const topT = 0.02;
  const top = rbox(TABLE.w, TABLE.d, topT, 0.004, labTop, 0, 0, TABLE.h - topT / 2, labRoot);
  top.name = "lab-table-top";
  const lip = rbox(TABLE.w + 0.008, TABLE.d + 0.008, 0.008, 0.002, labEdge, 0, 0, TABLE.h - topT - 0.004, labRoot);
  lip.name = "lab-table-edge";
  const legH = TABLE.h - topT - 0.07;
  const lx = TABLE.w / 2 - 0.09;
  const ly = TABLE.d / 2 - 0.08;
  for (const x of [-lx, lx]) for (const y of [-ly, ly]) {
    rbox(0.038, 0.038, legH, 0.003, labLeg, x, y, legH / 2, labRoot);
  }
  const apronZ = TABLE.h - topT - 0.032;
  rbox(TABLE.w - 0.22, 0.016, 0.055, 0.002, labEdge, 0, ly, apronZ, labRoot).name = "lab-apron-n";
  rbox(TABLE.w - 0.22, 0.016, 0.055, 0.002, labEdge, 0, -ly, apronZ, labRoot).name = "lab-apron-s";
  rbox(0.016, TABLE.d - 0.2, 0.055, 0.002, labEdge, lx, 0, apronZ, labRoot).name = "lab-apron-e";
  rbox(0.016, TABLE.d - 0.2, 0.055, 0.002, labEdge, -lx, 0, apronZ, labRoot).name = "lab-apron-w";
}

if (QS.has("solo") && QS.get("solo") !== "room") labRoot.visible = false;
