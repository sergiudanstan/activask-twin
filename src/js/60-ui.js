// ================================================================ UI shell: panels, mode, Now overlay, paper table, trial readouts
// Panel bodies are filled from the trial state in 65-app.js (appShown, appCands, appTrial).
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const fmt = (v, d = 2) => (v == null || Number.isNaN(v) ? "–" : Number(v).toFixed(d));
const uiNarrow = matchMedia("(max-width: 720px)");

// ---- mode: who answers the robot (auto = simulated operator, interactive = the viewer)
let mode = QS.get("mode") === "interactive" ? "interactive" : "auto";
// ---- panels (?panels=clarify,camera opens exactly these)
const openPanels = { auto: new Set(["live-card", "clarify-card"]), interactive: new Set(["clarify-card", "camera-card"]) };
if (uiNarrow.matches) { openPanels.auto.clear(); openPanels.interactive.clear(); }
function uiPanelAllowed(id, m) {
  const node = $(id);
  if (!node) return false;
  const rail = document.querySelector(`.rail-item[data-panel="${id}"]`);
  if (!rail) return false;
  return rail.dataset.modes.split(" ").includes(m);
}
if (QS.has("panels")) {
  const ids = QS.get("panels").split(",").map((k) => `${k.trim().toLowerCase()}-card`);
  for (const m of ["auto", "interactive"]) openPanels[m] = new Set(ids.filter((id) => uiPanelAllowed(id, m)));
}
const uiDrawer = $("drawer");
let uiDrawerOpen = false;
function syncPanels() {
  const open = openPanels[mode];
  document.querySelectorAll(".rail-item").forEach((b) => {
    const allowed = b.dataset.modes.split(" ").includes(mode);
    b.hidden = !allowed; b.setAttribute("aria-pressed", String(allowed && open.has(b.dataset.panel)));
  });
  let any = false;
  document.querySelectorAll(".drawer .card").forEach((c) => { const show = open.has(c.id); c.hidden = !show; any = any || show; });
  uiDrawer.hidden = !any; uiDrawerOpen = any;
  requestAnimationFrame(() => { resize(); fitComposer(); });
}
document.querySelectorAll(".rail-item").forEach((b) => b.addEventListener("click", () => {
  const set = openPanels[mode], id = b.dataset.panel;
  if (set.has(id)) set.delete(id); else set.add(id);
  syncPanels();
}));
document.querySelectorAll(".card .close").forEach((b) => b.addEventListener("click", () => { openPanels[mode].delete(b.closest(".card").id); syncPanels(); }));
const panelOpen = (id) => uiDrawerOpen && openPanels[mode].has(id);
function setMode(m) {
  const keepClarify = openPanels[mode].has("clarify-card");
  mode = m;
  if (keepClarify) openPanels[mode].add("clarify-card");
  document.querySelectorAll(".mode-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
  $("now-mode").textContent = m === "auto" ? "AUTO" : "YOU";
  syncPanels();
  uiSyncEps();
}
function uiSyncEps() {
  const eps = $("app-eps");
  const note = $("app-eps-note");
  const off = mode === "interactive";
  if (eps) eps.disabled = off;
  if (note) note.hidden = !off;
}
const UI_VLM = { directVLM: 1, firstQ: 1, randomQ: 1, vlmQ: 1 };
function uiPolicyLabel(p) {
  if (!p) return "–";
  return UI_VLM[p.id] ? p.label + " (sim.)" : p.label;
}
function uiPolicyRule(p) {
  if (!p) return "";
  return UI_VLM[p.id] ? p.rule + " Simulated." : p.rule;
}
document.querySelectorAll(".mode-switch button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

// ---- Now overlay: one row per lane
const NOW_LANES = [["robot", "Robot"], ["say", "Asks"], ["user", "User"]];
const nowEls = {};
for (const [k, name] of NOW_LANES) {
  const row = el("div", "now-row idle", `<span class="prog"></span><span class="chip">${name}</span><div class="what"><b>–</b><code></code></div>`);
  $("now-rows").appendChild(row); nowEls[k] = row;
}
function uiSetNow(lane, label, cmd = "") {
  const row = nowEls[lane]; if (!row) return;
  const b = row.querySelector("b"), c = row.querySelector("code");
  if (b.textContent !== label) b.textContent = label;
  if (c.textContent !== cmd) c.textContent = cmd;
  row.classList.toggle("idle", label === "–");
}

// ---- paper vs twin table (the twin column is filled by the experiments step)
function renderPaperTable() {
  const rows = POLICIES.map((p) => {
    const o = PAPER.offline[p.id];
    return `<tr><td>${uiPolicyLabel(p)}</td><td>${fmt(o.acc)}</td><td>${fmt(o.asked)}</td><td>${o.qAsked == null ? "–" : fmt(o.qAsked)}</td><td data-twin="${p.id}">–</td></tr>`;
  }).join("");
  $("report").innerHTML = `<h3 class="sec-h">Offline target resolution <em>paper: 216 trials per method</em></h3>
    <table class="grid"><thead><tr><th>Policy</th><th>Acc %</th><th>Asked %</th><th>Q / asked</th><th>Twin acc % (sim, mean of seeds 1–5)</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="small-note">Paper: ${PAPER.ref} Twin numbers are simulated (rule-based questions, simulated perception) and are never the paper's results.</p>`;
}
renderPaperTable();

const uiKindShort = { listen: "in", perceive: "see", answer: "yn", resolved: "ok", unresolved: "stop", grasp: "grip", pregrasp: "pre", descend: "down", close: "shut", lift: "up", retract: "back", reobserve: "look" };
const uiKindTiny = { listen: "L", perceive: "S", ask: "Q", answer: "A", resolved: "R", unresolved: "X", grasp: "G", pregrasp: "P", descend: "D", close: "C", lift: "U", retract: "B", reobserve: "O" };
const uiKindHex = {
  listen: "#a8620c", perceive: "#7a4fc0", ask: "#0b8484", answer: "#e0922a",
  resolved: "#2a8a3e", unresolved: "#c8312b", grasp: "#3550c8", pregrasp: "#3550c8",
  descend: "#8a6d1f", close: "#c4531a", lift: "#0b8484", retract: "#5f6670", reobserve: "#7a4fc0",
};
function uiEsc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
}
function uiHex(color) {
  const n = OBJ_COLORS[color];
  return n == null ? "#cccccc" : "#" + n.toString(16).padStart(6, "0");
}
function uiCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
}
function uiCsv() {
  const head = ["scene", "instruction", "type", "policy", "eps", "K", "seed", "mode", "S0", "questions", "outcome", "resolved", "target"];
  const lines = [head.join(",")];
  for (const row of appLog) {
    lines.push([row.scene, row.instruction, row.type, row.policy, row.eps, row.K, row.seed, row.mode, row.S0, row.questions, row.outcome, row.resolved, row.target].map(uiCell).join(","));
  }
  return lines.join("\n");
}
function uiOutcomeLine(shown) {
  if (shown.outcome === "none" && mode === "interactive") {
    const line = "resolved; no hidden target was set (click an object before answering to score the trial)";
    return shown.belief ? line + " · " + shown.belief : line;
  }
  return shown.belief ? shown.outcome + " · " + shown.belief : shown.outcome;
}
function uiPaint() {
  const shown = appShown || {};
  const S = new Set(shown.S || []);
  const cands = $("ui-cands");
  if (cands) {
    let html = "";
    for (const c of appCands) {
      const o = appObj(c.obj);
      const dead = !S.has(c.id);
      const hot = shown.resolved === c.id;
      html += `<span class="cand${dead ? " dead" : ""}${hot ? " hot" : ""}"><i style="background:${uiHex(o && o.color)}"></i><b>${c.disp}</b> ${uiEsc(c.label)}</span>`;
    }
    cands.innerHTML = html || `<span class="small-note">No candidate passed τ.</span>`;
  }
  const round = $("ui-round");
  if (round) round.textContent = shown.roundLabel || "";
  const table = $("ui-props");
  if (table) {
    const props = shown.props || [];
    const sel = shown.sel;
    let rows = "";
    for (const p of props) {
      const n = p.count && p.count.total ? p.count.total : 0;
      const py = n ? p.count.yes / n : 0;
      const pn = n ? p.count.no / n : 0;
      const on = !!(sel && (p === sel || p.key === sel.key));
      const flags = p.raw || p.valid || {};
      const flag = (ok, name, title) => `<span class="flag ${ok ? "on" : "off"}" title="${title}">${name}</span>`;
      const badge = p.fallback
        ? ` <span class="flag repair" title="fallback partition; the key is only a label">fallback</span>`
        : (p.repaired ? ` <span class="flag repair" title="repaired after a validity check failed">repaired</span>` : "");
      rows += `<tr class="${on ? "sel" : ""}"><td class="q">${on ? `<span class="star">★</span> ` : ""}${uiEsc(p.text)}${badge}</td>`
        + `<td>${p.count ? p.count.yes : "–"}</td><td>${p.count ? p.count.no : "–"}</td>`
        + `<td>${n ? py.toFixed(3) : "–"}</td><td>${n ? pn.toFixed(3) : "–"}</td><td>${fmt(p.G, 3)}</td>`
        + `<td class="flags">${flag(flags.exhaustive, "E", "exhaustive")}${flag(flags.disjoint, "D", "disjoint")}${flag(flags.legal, "L", "legal")}${flag(flags.wording, "W", "wording")}</td></tr>`;
    }
    table.innerHTML = `<thead><tr><th>Question</th><th title="yes branch">Y</th><th title="no branch">N</th><th title="p yes">p<sub>y</sub></th><th title="p no">p<sub>n</sub></th><th>G</th><th title="exhaustive, disjoint, legal, wording, before repair">Raw</th></tr></thead><tbody>${rows || `<tr><td class="q">No proposal this round.</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`}</tbody>`;
  }
  const hist = $("ui-hist");
  if (hist) {
    const items = shown.history || [];
    hist.innerHTML = items.length
      ? items.map((h, i) => `<li><span>${i + 1}. ${uiEsc(h.text)}</span><b>${uiEsc(h.answer)}</b></li>`).join("")
      : `<li><span>No question yet.</span><b></b></li>`;
  }
  const say = $("ui-say");
  if (say) {
    const asking = (shown.phase === "ask" || shown.phase === "answer") && shown.sel;
    say.hidden = false;
    const polNow = POLICIES.find((p) => p.id === appPolicy);
    if (asking) say.innerHTML = `<small>robot asks</small>${uiEsc(shown.sel.text)}`;
    else if (appInstr) say.innerHTML = `<small>${uiEsc(appInstr.type)} · ${uiEsc(polNow ? uiPolicyLabel(polNow) : appPolicy)}</small>${uiEsc(appInstr.text)}`;
    else say.hidden = true;
  }
  const answers = $("ui-answer");
  if (answers) answers.hidden = !(mode === "interactive" && shown.pending);
  const yn = $("ui-yn");
  if (yn) yn.hidden = !(mode === "interactive" && shown.pending && uiNarrow.matches);
  const out = $("ui-outcome");
  if (out) {
    if (shown.outcome) {
      out.hidden = false;
      out.className = "outcome " + shown.outcome;
      out.textContent = uiOutcomeLine(shown);
    } else {
      out.hidden = true;
      out.textContent = "";
    }
  }
  const note = $("app-target-note");
  if (note) {
    note.textContent = mode === "interactive"
      ? (appTargetChosen ? "Hidden target set." : "Click an object to set the hidden target.")
      : "Hidden target: drawn from the instruction's matches.";
  }
  const polNote = $("app-policy-note");
  if (polNote) {
    const info = POLICIES.find((p) => p.id === appPolicy);
    polNote.hidden = !(info && !info.clarifies);
  }
  uiSyncEps();
  uiPaintLive();
  uiPaintCam();
  uiPaintGrasp();
}
function uiPaintLive() {
  const host = $("live-stats");
  if (!host) return;
  const ins = appInstr;
  const pol = POLICIES.find((p) => p.id === appPolicy);
  const outcome = (appShown && appShown.outcome) || "in progress";
  const questions = appShown ? appShown.questions : 0;
  const epsLine = mode === "interactive" ? "ε not applied · seed " + appSeed : "ε " + Number(appEps).toFixed(2) + " · seed " + appSeed;
  host.innerHTML = `<div class="stat"><small>Scene</small><div class="value sm">${uiEsc(appSceneId || "–")}</div><div class="sub">${uiEsc(appPlaced ? appPlaced.family : "")} · ${uiEsc(appSet || "")}</div></div>`
    + `<div class="stat"><small>Instruction</small><div class="value sm">${uiEsc(ins ? ins.type : "–")}</div><div class="sub">|S0| = ${appCands.length}</div></div>`
    + `<div class="stat"><small>Questions</small><div class="value">${questions}</div><div class="sub">${uiEsc(outcome === "none" && mode === "interactive" ? "no target set" : outcome)}</div></div>`
    + `<div class="stat"><small>Policy</small><div class="value sm">${uiEsc(pol ? uiPolicyLabel(pol) : appPolicy || "–")}</div><div class="sub">${uiEsc(pol ? uiPolicyRule(pol) : "")}</div></div>`
    + `<div class="stat"><small>τ</small><div class="value">${PARAMS.tau}</div><div class="sub">text ${PARAMS.textThr} · NMS ${PARAMS.nmsIoU}</div></div>`
    + `<div class="stat"><small>K</small><div class="value">${appK}</div><div class="sub">${uiEsc(epsLine)}</div></div>`;
  const sub = $("live-sub");
  if (sub) sub.textContent = appShown && appShown.phase ? appShown.phase : "";
}
function uiPaintCam() {
  const host = $("camera-res");
  if (!host) return;
  const alive = appShown && appShown.S ? appShown.S.length : 0;
  host.innerHTML = `<div><small>Candidates</small><b>${appCands.length}</b></div>`
    + `<div><small>Still in S</small><b class="${alive ? "ok" : "warn"}">${alive}</b></div>`
    + `<div><small>τ</small><b>${PARAMS.tau}</b></div>`
    + `<div><small>Head</small><b>${CAM.w}×${CAM.h}</b></div>`;
}
function uiPaintGrasp() {
  const host = $("grasp");
  if (!host) return;
  if (!appWillGrasp) {
    const outcome = (appShown && appShown.outcome) || "";
    if (outcome === "none") {
      host.innerHTML = `<p class="outcome none">not executed</p><p class="small-note">No hidden target was set, so the robot does not grasp.</p>`;
    } else if (outcome === "correct") {
      host.innerHTML = `<p class="outcome correct">not executed</p><p class="small-note">The target is correct. Grasp motion is not in this build.</p>`;
    } else {
      host.innerHTML = `<p class="outcome unresolved">not executed</p><p class="small-note">Wrong or unresolved targets are not executed. The operator verifies the target first (Sec. 4.3).</p>`;
    }
    return;
  }
  const belief = appShown && appShown.belief ? appShown.belief : "Resolved target.";
  if (!appPlan || !appPlan.plan) {
    host.innerHTML = `<p class="outcome">${uiEsc(belief)}</p><p class="small-note">Placeholder grasp. planGrasp and stretchIK are not in this build, so the timeline holds one grasp segment and the arm stays put.</p>`;
    return;
  }
  const plan = appPlan.plan;
  const q = appPlan.q;
  const keys = ["x", "lift", "arm", "yaw", "pitch", "roll", "grip", "pan", "tilt"];
  let joints = "";
  if (q) for (const k of keys) if (typeof q[k] === "number") joints += `<dt>${k}</dt><dd>${q[k].toFixed(3)}</dd>`;
  host.innerHTML = `<p class="small-note">${uiEsc(belief)}</p>`
    + `<dl class="kv"><dt>Mode</dt><dd>${uiEsc(plan.mode || "–")}</dd>`
    + `<dt>Width</dt><dd>${typeof plan.width === "number" ? plan.width.toFixed(3) + " m" : "–"}</dd>`
    + `<dt>Yaw</dt><dd>${typeof plan.yaw === "number" ? plan.yaw.toFixed(3) + " rad" : "–"}</dd></dl>`
    + (joints ? `<h3 class="sec-h">Joints</h3><dl class="kv">${joints}</dl>` : `<p class="small-note">${q ? "" : "stretchIK: unreachable."}</p>`)
    + `<p class="small-note">${appHasWaypoints ? "Waypoint motion." : "Placeholder segment. graspWaypoints is not in this build."} <span class="tag-sim">twin (simulated)</span></p>`;
}
function uiDrawLanes() {
  const c = $("lanes");
  if (!c) return;
  const g = c.getContext("2d");
  const w = c.width, h = c.height;
  g.clearRect(0, 0, w, h);
  const segs = appSegs;
  const dur = Math.max(0.1, DURATION);
  const dpr = w / Math.max(1, c.clientWidth || w);
  const y = 5 * dpr, bh = Math.max(4, h - 10 * dpr);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const x = (s.t0 / dur) * w;
    const bw = Math.max(dpr, ((s.t1 - s.t0) / dur) * w - dpr);
    g.fillStyle = uiKindHex[s.kind] || "#8a8078";
    g.beginPath();
    if (g.roundRect) g.roundRect(x, y, bw, bh, 3 * dpr);
    else g.rect(x, y, bw, bh);
    g.fill();
    g.font = `600 ${Math.round(11 * dpr)}px "IBM Plex Sans", sans-serif`;
    const brief = uiKindShort[s.kind];
    const tiny = uiKindTiny[s.kind];
    const pad = 8 * dpr;
    const text = g.measureText(s.kind).width + pad <= bw ? s.kind
      : (brief && g.measureText(brief).width + pad <= bw ? brief
        : (tiny && g.measureText(tiny).width + 4 * dpr <= bw ? tiny : ""));
    if (text) {
      g.save();
      g.beginPath();
      g.rect(x, y, bw, bh);
      g.clip();
      g.fillStyle = "#fff";
      g.textBaseline = "middle";
      g.fillText(text, x + 4 * dpr, y + bh * 0.52);
      g.restore();
    }
  }
}
function uiFitLanes() {
  const c = $("lanes");
  if (!c) return;
  const r = c.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.max(2, Math.round(r.width * dpr));
  const h = Math.max(2, Math.round(r.height * dpr));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  uiDrawLanes();
}
function uiSegAtClient(clientX) {
  const tl = $("timeline");
  const r = tl.getBoundingClientRect();
  const t = ((clientX - r.left) / Math.max(1, r.width)) * DURATION;
  return appSegAt(t);
}
const uiTip = el("div", "tl-tip glass");
uiTip.hidden = true;
$("timeline").appendChild(uiTip);
let uiTipSeg = null;
function uiHover(e) {
  const seg = uiSegAtClient(e.clientX);
  const tl = $("timeline");
  const r = tl.getBoundingClientRect();
  if (!seg) { uiTip.hidden = true; uiTipSeg = null; return; }
  if (seg !== uiTipSeg) {
    uiTipSeg = seg;
    uiTip.innerHTML = `<div class="t"><span>${uiEsc(seg.kind)}</span><em>${seg.t0.toFixed(1)}–${seg.t1.toFixed(1)} s</em></div>`
      + `<div class="r"><span class="chip">${uiEsc(seg.kind)}</span><span>${uiEsc(seg.label || "")}</span></div>`;
  }
  uiTip.hidden = false;
  const left = e.clientX - r.left;
  uiTip.style.left = `${Math.max(4, Math.min(left, r.width - 200))}px`;
}
$("timeline").addEventListener("pointermove", uiHover);
$("timeline").addEventListener("pointerleave", () => { uiTip.hidden = true; uiTipSeg = null; });
new ResizeObserver(uiFitLanes).observe($("timeline"));
function uiCopyState(text) {
  const b = $("copy-csv");
  if (!b) return;
  b.textContent = text;
  setTimeout(() => { b.textContent = "Copy trials CSV"; }, 1400);
}
function uiCopyCsv() {
  const text = uiCsv();
  const done = () => uiCopyState("Copied");
  const fail = () => uiCopyState("Copy failed");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { fail(); }
      ta.remove();
    });
  } else fail();
}
function uiBindChrome() {
  const copy = $("copy-csv");
  if (copy) copy.addEventListener("click", uiCopyCsv);
  const yes = $("ui-yes"), no = $("ui-no");
  if (yes) yes.addEventListener("click", () => appAnswer("yes"));
  if (no) no.addEventListener("click", () => appAnswer("no"));
  const ynYes = $("ui-yn-yes"), ynNo = $("ui-yn-no");
  if (ynYes) ynYes.addEventListener("click", () => appAnswer("yes"));
  if (ynNo) ynNo.addEventListener("click", () => appAnswer("no"));
  uiNarrow.addEventListener("change", () => uiPaint());
}
function uiThemeChanged() { uiDrawLanes(); }
queueMicrotask(() => { uiBindChrome(); uiFitLanes(); });
