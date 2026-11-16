// ================================================================ lab room + table (M0 placeholder; the M1 "scene" task replaces this file)
// Cell frame (z up). MODULES.room holds everything static.
const labRoot = moduleRoot("room");
{
  const floor = mesh(new THREE.PlaneGeometry(8, 8), M.floor, labRoot);
  floor.castShadow = false;
  box(TABLE.w, TABLE.d, 0.03, M.steel, 0, 0, TABLE.h - 0.015, labRoot);
}
