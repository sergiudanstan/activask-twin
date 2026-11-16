// ================================================================ playback loop + window.pc (lead-owned)
// SEGS holds the current trial's Segment list (composed in M7). Modules animate by pushing a ticker
// (t) => void onto TICKERS; everything on screen is a pure function of t.
let SEGS = [], DURATION = 10;
const TICKERS = [];
// CHECKS: modules push { name, run: () => ({ ok, detail }) }; window.pc.checks() runs them (tools/shots.mjs reports them).
const CHECKS = [];
// Replaces the timeline. Call it after load (e.g. from queueMicrotask), never during module evaluation.
function setTimeline(segs, duration) {
  SEGS = segs;
  DURATION = Math.max(0.1, duration ?? segs.reduce((m, s) => Math.max(m, s.t1), 0));
  time = Math.min(time, DURATION);
}
let time = 0, playing = false, speed = 1;
const playIcon = $("play-icon");
function setPlaying(on) {
  playing = on;
  playIcon.innerHTML = on ? '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>' : '<path d="M7 4.5v15l13-7.5z"/>';
  $("play").setAttribute("aria-label", on ? "Pause" : "Play");
}
function seek(t) { time = clamp(t, 0, DURATION); }
$("play").addEventListener("click", () => setPlaying(!playing));
$("restart").addEventListener("click", () => { seek(0); setPlaying(true); });
document.querySelectorAll(".chips button").forEach((b) => b.addEventListener("click", () => {
  speed = Number(b.dataset.speed);
  document.querySelectorAll(".chips button").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
}));
const tl = $("timeline");
let scrubbing = false;
function scrubTo(e) { const r = tl.getBoundingClientRect(); seek(((e.clientX - r.left) / Math.max(1, r.width)) * DURATION); }
tl.addEventListener("pointerdown", (e) => { scrubbing = true; tl.setPointerCapture(e.pointerId); scrubTo(e); });
tl.addEventListener("pointermove", (e) => { if (scrubbing) scrubTo(e); });
tl.addEventListener("pointerup", () => { scrubbing = false; });
document.addEventListener("keydown", (e) => {
  if (e.target.closest && e.target.closest("input, select, textarea, button")) return;
  if (e.code === "Space") { e.preventDefault(); setPlaying(!playing); return; }
  const i = UI_VIEW_KEYS.indexOf(e.key);
  if (i >= 0) setView(Object.keys(views)[i]);
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
  if (playing) {
    time += dt * speed;
    if (time >= DURATION) { if ($("loop").checked) time = 0; else { time = DURATION; setPlaying(false); } }
  }
  if (flight) {
    flight.t = Math.min(1, flight.t + dt / 0.8);
    const k = ease(flight.t);
    camera.position.lerpVectors(flight.fromP, flight.toP, k); controls.target.lerpVectors(flight.fromT, flight.toT, k);
    if (flight.t >= 1) flight = null;
  }
  controls.update();
  for (const f of TICKERS) f(time);
  $("clock-now").textContent = time.toFixed(1); $("clock-total").textContent = DURATION.toFixed(1);
  $("playhead").style.left = `${(time / DURATION) * 100}%`;
  renderer.info.reset();
  renderFrame();
  window.pcReady = true;
  requestAnimationFrame(frame);
}

window.pc = {
  play: () => setPlaying(true), pause: () => setPlaying(false), seek, setView,
  setCamera(p, g, fov) {   // scene coordinates (y up), as tools/shots.mjs passes them
    flight = null; camera.position.set(...p); controls.target.set(...g);
    if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    controls.update();
  },
  get DURATION() { return DURATION; },
  views: Object.keys(views),
  renderInfo: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),   // whole last frame (shadows + passes)
  checks: () => {
    const results = CHECKS.map((c) => { try { return { name: c.name, ...c.run() }; } catch (e) { return { name: c.name, ok: false, detail: String(e) }; } });
    return { ok: results.every((r) => r.ok), results };
  },
};
applyTheme();
window.addEventListener("themechange", applyTheme);
setMode(mode);
requestAnimationFrame(frame);
