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
const VIEW_DEFS = {
  room:   { label: "Room",   pos: [3.2, -3.6, 2.2],   target: [0.0, 0.0, 0.70] },
  iso:    { label: "Iso",    pos: [1.55, -1.95, 1.65], target: [0.0, -0.20, 0.80] },
  robot:  { label: "Robot",  pos: [-1.30, -1.10, 1.30], target: [0.0, -0.55, 0.85] },
  table:  { label: "Table",  pos: [0.0, -0.95, 1.45],  target: [0.0, -0.05, 0.74] },
  top:    { label: "Top",    pos: [0.0, -0.30, 3.2],   target: [0.0, -0.30, 0.74] },
  user:   { label: "User",   pos: [0.0, 1.60, 1.55],   target: [0.0, -0.30, 0.85] },
};
const views = Object.fromEntries(Object.entries(VIEW_DEFS).map(([k, v]) => [k, { label: v.label, pos: cv(...v.pos), target: cv(...v.target) }]));
window.pcViews = views;
const UI_VIEW_KEYS = ["1", "2", "3", "4", "5", "6"];   // keys follow the toolbar order
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
  if (camera.fov !== 34) { camera.fov = 34; camera.updateProjectionMatrix(); }   // a film fov never sticks to the views
  flight = { t: 0, fromP: camera.position.clone(), fromT: controls.target.clone(), toP: v.pos.clone(), toT: v.target.clone() };
  document.querySelectorAll(".views button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === name)));
}
camera.position.copy(views.iso.pos); controls.target.copy(views.iso.target);
document.querySelectorAll(".views button").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
controls.addEventListener("start", () => { flight = null; document.querySelectorAll(".views button").forEach((b) => b.setAttribute("aria-pressed", "false")); });
function resize() {
  const w = viewport.clientWidth, h = viewport.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(viewport);
