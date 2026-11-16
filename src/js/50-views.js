function applyTheme() {
  const top = new THREE.Color(css("--scene-top")), bottom = new THREE.Color(css("--scene-bottom"));
  const c = document.createElement("canvas"); c.width = 2; c.height = 256;
  const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "#" + top.getHexString()); gr.addColorStop(1, "#" + bottom.getHexString());
  g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; scene.background = tex;
  scene.environmentIntensity = themeIsDark() ? 0.5 : 0.7;
  if (typeof uiThemeChanged === "function") uiThemeChanged();
}

// ---------------------------------------------------------------- camera views. Written in the cell frame (x, y, z up) and
// converted to three.js scene space: cell (x, y, z) -> scene (x, z, -y).
const cv = (x, y, z) => V(x, z, -y);
// Aimed at the real cell: robot base on the -y side, table centred at the origin, head at CAM_POSE.
// Table sits off the mast axis so the mast is not between the lens and the objects.
// Head is the head camera: CAM vertical fov, near enough to clip the D435i housing.
// Pulled back so the mast top and the base stay in frame when the drawer narrows the viewport.
// Robot x stays inside the left wall (inner face about x = -2.41).
const VIEW_DEFS = {
  room:  { label: "Room",  pos: [2.55, -2.35, 1.95], target: [-0.40, 0.20, 0.82], fov: 50 },
  iso:   { label: "Iso",   pos: [2.20, -2.55, 2.05], target: [0.00, -0.30, 0.52], fov: 44 },
  robot: { label: "Robot", pos: [-1.72, -0.55, 1.48], target: [0.22, -0.32, 0.48], fov: 54 },
  table: { label: "Table", pos: [0.78, 1.22, 1.32], target: [-0.02, -0.02, 0.78], fov: 40 },
  top:   { label: "Top",   pos: [0.00, -0.16, 2.65], target: [0.00, -0.24, 0.74], fov: 40 },
  user:  { label: "User",  pos: [0.28, 1.52, 1.62], target: [-0.05, -0.55, 0.62], fov: 50 },
  head:  { label: "Head",  pos: [CAM_POSE.pos[0], CAM_POSE.pos[1], CAM_POSE.pos[2]], target: [CAM_POSE.look[0], CAM_POSE.look[1], CAM_POSE.look[2]], fov: CAM.vfov, near: 0.05 },
};
const views = Object.fromEntries(Object.entries(VIEW_DEFS).map(([k, v]) => [k, {
  label: v.label, pos: cv(...v.pos), target: cv(...v.target), fov: v.fov || 0, near: v.near || 0,
}]));
window.pcViews = views;
const UI_VIEW_KEYS = ["1", "2", "3", "4", "5", "6", "7"];   // keys follow the toolbar order
{
  const host = $("views");
  Object.entries(views).forEach(([k, v], i) => {
    const b = document.createElement("button"), key = UI_VIEW_KEYS[i];
    b.type = "button"; b.dataset.view = k; b.innerHTML = `<span>${v.label}</span>${key ? `<kbd>${key}</kbd>` : ""}`;
    b.title = key ? `${v.label} view (key ${key})` : `${v.label} view`;
    if (key) b.setAttribute("aria-keyshortcuts", key);
    b.setAttribute("aria-pressed", String(k === "iso")); host.appendChild(b);
  });
}
let flight = null;
function setView(name) {
  const v = views[name]; if (!v) return;
  const fov = v.fov || 34, near = v.near || 0.01;
  if (camera.fov !== fov || camera.near !== near) {
    camera.fov = fov; camera.near = near; camera.updateProjectionMatrix();
  }
  flight = { t: 0, fromP: camera.position.clone(), fromT: controls.target.clone(), toP: v.pos.clone(), toT: v.target.clone() };
  document.querySelectorAll(".views button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === name)));
}
camera.position.copy(views.iso.pos); controls.target.copy(views.iso.target);
if (views.iso.fov) { camera.fov = views.iso.fov; camera.updateProjectionMatrix(); }
document.querySelectorAll(".views button").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
controls.addEventListener("start", () => { flight = null; document.querySelectorAll(".views button").forEach((b) => b.setAttribute("aria-pressed", "false")); });
function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);
