// ================================================================ Experiments panel (prefix exu)
// Renders into #exp and writes offline accuracy into #report [data-twin].
// Every twin figure is simulated and is drawn beside the paper's measured number.
// No Math.random: batches use the seeded protocol in 15-experiments.js.
// This file is concatenated before 70-loop.js, so CHECKS and window.pc are used
// from the load microtask, after that file has published them.

const EXU_COLOR = {
  firstQ: "var(--scara)",
  randomQ: "var(--delta)",
  vlmQ: "var(--vision)",
  activask: "var(--accent)",
};
const EXU_SHORT = {
  top: "Top",
  random: "Random",
  directVLM: "Direct",
  firstQ: "First Q",
  randomQ: "Random Q",
  vlmQ: "VLM Q",
  activask: "ActivAsk",
};

let exuLast = null;

function exuEsc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
}

function exuFmt(v, d = 2) {
  if (v == null || !Number.isFinite(Number(v))) return "–";
  return Number(v).toFixed(d);
}

function exuInt(v) {
  if (v == null || !Number.isFinite(Number(v))) return "–";
  return String(Math.round(Number(v)));
}

function exuCi(ci) {
  if (!ci || ci.length < 2) return "–";
  return `${exuFmt(ci[0])}–${exuFmt(ci[1])}`;
}

function exuPolicy(id) {
  return POLICIES.find((p) => p.id === id) || { id, label: id };
}

function exuControls() {
  const set = $("exu-set").value === "online" ? "online" : "offline";
  const num = (id, fallback, lo, hi, integer) => {
    const v = Number($(id).value);
    if (!Number.isFinite(v)) return fallback;
    const c = Math.min(hi, Math.max(lo, v));
    return integer ? Math.round(c) : c;
  };
  return {
    set,
    seed: num("exu-seed", 11, 1, 1e9, true),
    eps: num("exu-eps", 0, 0, 1, false),
    K: num("exu-k", PARAMS.K, 1, 5, true),
    slip: num("exu-slip", 0.05, 0, 1, false),
  };
}

function exuByType(trials) {
  const out = {};
  for (const type of INSTR_TYPES) out[type] = { n: 0, correct: 0, askedN: 0, qAskedSum: 0 };
  for (const t of trials || []) {
    const b = out[t.type];
    if (!b) continue;
    b.n++;
    if (t.outcome === "correct") b.correct++;
    if ((t.questions || 0) > 0) { b.askedN++; b.qAskedSum += t.questions; }
  }
  for (const type of INSTR_TYPES) {
    const b = out[type];
    b.acc = b.n ? (100 * b.correct) / b.n : 0;
    b.asked = b.n ? (100 * b.askedN) / b.n : 0;
    b.qAsked = b.askedN ? b.qAskedSum / b.askedN : null;
  }
  return out;
}

function exuPair(paper, twin, title) {
  const badge = twin === "–" ? "" : `<span class="exu-sim">sim</span>`;
  const tip = title ? ` title="${exuEsc(title)}"` : "";
  return `<td${tip}><span class="exu-p">${paper}</span><span class="exu-t">${twin}</span>${badge}</td>`;
}

function exuNameCell(id, span) {
  const p = exuPolicy(id);
  const rows = span ? ` rowspan="${span}"` : "";
  return `<td class="exu-name"${rows} title="${exuEsc(p.label)}">${exuEsc(EXU_SHORT[id] || p.label)}</td>`;
}

// One number per line. The paper row is muted; the twin row carries the sim mark.
// A confidence interval stays on its own line so it is not cut at the dash.
function exuSide(text, ci, twin, title) {
  const tip = title ? ` title="${exuEsc(title)}"` : "";
  const badge = twin && text !== "–" ? `<span class="exu-sim">sim</span>` : "";
  const line = ci ? `<span class="exu-ci">${ci}</span>` : "";
  return `<td${tip}><span class="${twin ? "exu-t" : "exu-p"}">${text}</span>${badge}${line}</td>`;
}

function exuOfflineTable(summary) {
  const rows = POLICIES.map((p) => {
    const paper = PAPER.offline[p.id];
    const twin = summary[p.id];
    if (!paper || !twin) return "";
    const accTip = `paper ${exuFmt(paper.acc)} [${exuCi(paper.ci)}] · twin (simulated) ${exuFmt(twin.acc)} [${exuCi(twin.ci)}]`;
    return `<tr>${exuNameCell(p.id, 2)}
      ${exuSide(exuFmt(paper.acc), exuCi(paper.ci), false, accTip)}
      ${exuSide(exuFmt(paper.asked), "", false, "asked %")}
      ${exuSide(exuFmt(paper.qAll), "", false, "mean questions, all trials")}
      ${exuSide(paper.qAsked == null ? "–" : exuFmt(paper.qAsked), "", false, "mean questions on asked trials")}</tr>
    <tr class="exu-twin">
      ${exuSide(exuFmt(twin.acc), exuCi(twin.ci), true, accTip)}
      ${exuSide(exuFmt(twin.asked), "", true, "asked % · twin (simulated)")}
      ${exuSide(exuFmt(twin.qAll), "", true, "mean questions, all trials · twin (simulated)")}
      ${exuSide(exuFmt(twin.qAsked), "", true, "mean questions on asked trials · twin (simulated)")}</tr>`;
  }).join("");
  return `<h3 class="sec-h">Offline, per policy <em>paper, then twin</em></h3>
    <table class="grid exu-metrics"><colgroup><col class="exu-c-name"><col class="exu-c-acc"><col><col><col></colgroup>
    <thead><tr><th>Policy</th><th>Acc % ± CI</th><th>Asked %</th><th>Q all</th><th>Q asked</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function exuOnlineTable(summary) {
  const rows = POLICIES.filter((p) => p.online).map((p) => {
    const paper = PAPER.online[p.id];
    const twin = summary[p.id];
    if (!paper || !twin) return "";
    const accTip = `target % · paper ${exuCi(paper.targetCi)} · twin (simulated) ${exuCi(twin.ci)}`;
    const graspTip = `grasp % · paper ${exuCi(paper.graspCi)} · twin (simulated) ${exuCi(twin.graspCi)}`;
    const fullTip = `full-task % · paper ${exuCi(paper.fullCi)} · twin (simulated) ${exuCi(twin.fullCi)} · Q asked paper ${paper.q == null ? "–" : exuFmt(paper.q)}, twin (simulated) ${exuFmt(twin.qAsked)}`;
    return `<tr>${exuNameCell(p.id, 2)}
      ${exuSide(exuFmt(paper.targetAcc), "", false, accTip)}
      ${exuSide(exuInt(paper.attempts), "", false, "grasp attempts")}
      ${exuSide(exuFmt(paper.grasp), "", false, graspTip)}
      ${exuSide(exuFmt(paper.full), "", false, fullTip)}
      ${exuSide(exuInt(paper.nonExec), "", false, "not executed")}</tr>
    <tr class="exu-twin">
      ${exuSide(exuFmt(twin.acc), "", true, accTip)}
      ${exuSide(exuInt(twin.attempts), "", true, "grasp attempts · twin (simulated)")}
      ${exuSide(exuFmt(twin.grasp), "", true, graspTip)}
      ${exuSide(exuFmt(twin.full), "", true, fullTip)}
      ${exuSide(exuInt(twin.nonExec), "", true, "not executed · twin (simulated)")}</tr>`;
  }).join("");
  return `<h3 class="sec-h">Online, per policy <em>paper, then twin</em></h3>
    <table class="grid exu-metrics exu-online"><colgroup><col class="exu-c-name"><col class="exu-c-acc"><col><col><col><col></colgroup>
    <thead><tr><th>Policy</th><th>Target %</th><th>Tries</th><th>Grasp %</th><th>Full %</th><th>Skip</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="small-note">Grasp success is a category-rate draw from the paper. Twin (simulated). A wrong or unresolved target is not executed.</p>`;
}

function exuTypeTable(trials) {
  const twin = exuByType(trials);
  const label = { clear: "Clear", partial: "Partial", ambiguous: "Ambiguous" };
  const rows = INSTR_TYPES.map((type) => {
    const paper = PAPER.byType[type];
    const row = twin[type];
    return `<tr><td class="exu-name">${label[type]}</td>${exuPair(exuFmt(paper.acc), exuFmt(row.acc), `accuracy % · n paper ${paper.n}, twin (simulated) ${row.n}`)}${exuPair(exuFmt(paper.asked), exuFmt(row.asked), "asked % · pooled over methods · twin (simulated)")}${exuPair(paper.qAsked == null ? "–" : exuFmt(paper.qAsked), exuFmt(row.qAsked), "mean questions on asked trials · twin (simulated)")}</tr>`;
  }).join("");
  return `<h3 class="sec-h">By instruction type <em>pooled</em></h3>
    <table class="grid exu-metrics"><thead><tr><th>Type</th><th>Acc %</th><th>Asked %</th><th>Q asked</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function exuLegend(items) {
  return `<div class="exu-leg">${items.map((it) => `<span><i class="exu-sw" style="border-top-color:${it.color};border-top-style:${it.dash ? "dashed" : "solid"}"></i>${exuEsc(it.name)}</span>`).join("")}</div>`;
}

// Inline SVG. Colours are the page's CSS variables, so light and dark (including
// prefers-color-scheme) restyle the chart without a redraw.
function exuChart(id, aria, xName, xLabels, yName, yMin, yMax, yDigits, yTicks, series) {
  const W = 300, H = 128;
  const left = yDigits >= 3 ? 52 : 34;
  const right = 10, top = 22, bottom = 28;
  const plotB = H - bottom;
  const iw = W - left - right;
  const ih = plotB - top;
  const xAt = (i) => left + (xLabels.length <= 1 ? iw / 2 : (i / (xLabels.length - 1)) * iw);
  const yAt = (v) => plotB - ((v - yMin) / (yMax - yMin)) * ih;
  const ticks = [];
  for (let i = 0; i < yTicks; i++) ticks.push(yMin + (yMax - yMin) * (i / (yTicks - 1)));
  const grid = ticks.map((v) => {
    const y = yAt(v).toFixed(1);
    return `<line class="exu-grid" x1="${left}" y1="${y}" x2="${W - right}" y2="${y}"></line><text x="${left - 4}" y="${y}" text-anchor="end" dominant-baseline="middle">${exuFmt(v, yDigits)}</text>`;
  }).join("");
  const xText = xLabels.map((lab, i) => `<text x="${xAt(i).toFixed(1)}" y="${plotB + 12}" text-anchor="middle">${exuEsc(lab)}</text>`).join("");
  const lines = series.map((s) => {
    let d = "", pen = false;
    s.values.forEach((v, i) => {
      if (v == null || !Number.isFinite(v)) { pen = false; return; }
      d += `${pen ? "L" : "M"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`;
      pen = true;
    });
    if (!d) return "";
    const dash = s.dash ? "stroke-dasharray:4 3;" : "";
    return `<path d="${d}" style="fill:none;stroke:${s.color};stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke;${dash}"></path>`;
  }).join("");
  const dots = series.map((s) => s.values.map((v, i) => {
    if (v == null || !Number.isFinite(v)) return "";
    const kind = s.dash ? "paper" : "twin (simulated)";
    return `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(v).toFixed(1)}" r="2.2" style="fill:${s.color};stroke:var(--panel);stroke-width:1;vector-effect:non-scaling-stroke"><title>${exuEsc(s.name)} ${exuEsc(xLabels[i])}: ${exuFmt(v, 3)} · ${kind}</title></circle>`;
  }).join("")).join("");
  return `<svg id="${id}" class="exu-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${exuEsc(aria)}">
    <text x="${W - right}" y="12" text-anchor="end" style="fill:var(--ink);font-weight:600">${exuEsc(yName)}</text>
    ${grid}
    <line class="exu-axis" x1="${left}" y1="${top}" x2="${left}" y2="${plotB}"></line>
    <line class="exu-axis" x1="${left}" y1="${plotB}" x2="${W - right}" y2="${plotB}"></line>
    ${lines}${dots}${xText}
    <text x="${(left + W - right) / 2}" y="${H - 3}" text-anchor="middle" style="fill:var(--ink);font-weight:600">${exuEsc(xName)}</text>
  </svg>`;
}

function exuQSeries(summary) {
  const xs = [2, 3, 4, 5, 6];
  const qOf = (id) => xs.map((s) => {
    const bin = summary[id] && summary[id].qByS0 && summary[id].qByS0[s];
    return bin && bin.n && bin.q != null ? bin.q : null;
  });
  return [
    { name: "Ideal", color: "var(--faint)", dash: true, values: xs.map((s) => PAPER.qByS0[s].ideal) },
    { name: "ActivAsk paper", color: "var(--accent)", dash: true, values: xs.map((s) => PAPER.qByS0[s].activask) },
    { name: "firstQ", color: EXU_COLOR.firstQ, dash: false, values: qOf("firstQ") },
    { name: "randomQ", color: EXU_COLOR.randomQ, dash: false, values: qOf("randomQ") },
    { name: "vlmQ", color: EXU_COLOR.vlmQ, dash: false, values: qOf("vlmQ") },
    { name: "ActivAsk", color: EXU_COLOR.activask, dash: false, values: qOf("activask") },
  ];
}

function exuEpsSeries(sweep) {
  const ids = ["firstQ", "randomQ", "vlmQ", "activask"];
  const series = [];
  for (const id of ids) {
    const rows = (sweep.byPolicy && sweep.byPolicy[id]) || [];
    series.push({ name: `${id} paper`, color: EXU_COLOR[id], dash: true, values: PAPER.noise[id].slice() });
    series.push({ name: id, color: EXU_COLOR[id], dash: false, values: rows.map((r) => r.acc) });
  }
  return series;
}

function exuKSeries(sweep) {
  return [
    { name: "Ambiguous paper", color: "var(--bad)", dash: true, values: PAPER.kSweep.ambMinG.slice() },
    { name: "Ambiguous", color: "var(--bad)", dash: false, values: sweep.ambiguous.slice() },
    { name: "Partial paper", color: "var(--press)", dash: true, values: PAPER.kSweep.partMinG.slice() },
    { name: "Partial", color: "var(--press)", dash: false, values: sweep.partial.slice() },
  ];
}

function exuYMaxQ(series) {
  let hi = 4;
  for (const s of series) for (const v of s.values) if (v != null && v > hi) hi = v;
  return Math.ceil(hi * 2) / 2;
}

function exuYEps(series) {
  let lo = 50;
  for (const s of series) for (const v of s.values) if (v != null && v < lo) lo = Math.floor(v / 10) * 10;
  return Math.max(0, lo);
}

function exuYK(series) {
  let lo = Infinity, hi = -Infinity;
  for (const s of series) for (const v of s.values) {
    if (v == null || !Number.isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  if (!Number.isFinite(lo)) return [-0.7, -0.6];
  const pad = Math.max(0.004, (hi - lo) * 0.25);
  return [lo - pad, hi + pad];
}

function exuCharts(summary, eps, ks) {
  const qSeries = exuQSeries(summary);
  const eSeries = exuEpsSeries(eps);
  const kSeries = exuKSeries(ks);
  const [kLo, kHi] = exuYK(kSeries);
  const q = exuChart("exu-chart-q", "Mean questions by initial candidate count. Ideal reference, paper ActivAsk, and the twin clarifying policies.", "|S0|", ["2", "3", "4", "5", "6"], "mean Q", 0, exuYMaxQ(qSeries), 0, 5, qSeries);
  const e = exuChart("exu-chart-eps", "Accuracy against answer noise. Dashed lines are the paper, solid lines are the twin.", "ε", ["0", ".05", ".10", ".15", ".20"], "accuracy %", exuYEps(eSeries), 100, 0, 6, eSeries);
  const k = exuChart("exu-chart-k", "Mean minimum proposal G against the number of proposals, for partial and ambiguous instructions.", "K", ["1", "2", "3", "4", "5"], "mean min G", kLo, kHi, 3, 4, kSeries);
  const eNote = `Dashed is the paper. Solid is the twin (simulated). N = ${eps.n}.`;
  return `<h3 class="sec-h">Questions by |S0| <em>simulated</em></h3><div class="chart">${q}</div>${exuLegend(qSeries)}
    <h3 class="sec-h">Accuracy vs eps <em>N ${eps.n}</em></h3><div class="chart">${e}</div>${exuLegend(eSeries)}<p class="small-note">${eNote}</p>
    <h3 class="sec-h">Minimum G vs K <em>simulated</em></h3><div class="chart">${k}</div>${exuLegend(kSeries)}
    <p class="small-note">Sweeps use this seed. They stay at K = 4 and slip 0.05. The controls apply to the batch.</p>`;
}

function exuStatus(batch, ms, ctrl) {
  const row = batch.summary.activask || batch.summary.top || batch.summary[Object.keys(batch.summary)[0]];
  const nPol = Object.keys(batch.summary).length;
  const extra = [];
  if (ctrl.eps !== 0) extra.push(`ε ${ctrl.eps}`);
  if (ctrl.K !== PARAMS.K) extra.push(`K ${ctrl.K}`);
  if (Math.abs(ctrl.slip - 0.05) > 1e-9) extra.push(`slip ${ctrl.slip}`);
  const tail = extra.length ? ` · ${extra.join(" · ")}` : "";
  return `twin (simulated) · ${batch.set} · seed ${batch.seed} · ${nPol}×${row ? row.n : 0} · ${ms.toFixed(0)} ms · mean |S0| ${row ? exuFmt(row.meanS0) : "–"} · multi ${row ? exuFmt(row.multi) : "–"}%${tail}`;
}

function exuPaint() {
  const { batch, ms, ctrl, eps, ks } = exuLast;
  $("exu-status").textContent = exuStatus(batch, ms, ctrl);
  const table = batch.set === "online" ? exuOnlineTable(batch.summary) : exuOfflineTable(batch.summary);
  $("exu-charts").innerHTML = exuCharts(batch.summary, eps, ks);
  $("exu-tables").innerHTML = table + exuTypeTable(batch.trials);
}

function exuFillTwin(summary) {
  for (const p of POLICIES) {
    const cell = document.querySelector(`#report [data-twin="${p.id}"]`);
    const row = summary[p.id];
    if (!cell || !row) continue;
    cell.textContent = exuFmt(row.acc);
    cell.title = `Wilson 95% CI ${exuCi(row.ci)} · twin (simulated)`;
  }
}

function exuCsvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
}

function exuCsv(last) {
  const { batch, ctrl } = last;
  const head = ["set", "seed", "eps", "K", "slip", "scene", "family", "type", "instruction", "target", "policy", "s0", "questions", "outcome", "resolved", "executed", "grasped", "grasp", "simulated"];
  const lines = [head.join(",")];
  for (const t of batch.trials) {
    const cells = [
      batch.set, batch.seed, ctrl.eps, ctrl.K, ctrl.slip,
      t.scene, t.family || "", t.type || "", t.instr, t.target, t.policy,
      t.S0 ? t.S0.length : 0, t.questions, t.outcome, t.resolved || "",
      t.executed == null ? "" : t.executed, t.grasped == null ? "" : t.grasped, t.grasp || "",
      "simulated",
    ];
    lines.push(cells.map(exuCsvCell).join(","));
  }
  return lines.join("\n");
}

function exuCopy() {
  if (!exuLast) return;
  const text = exuCsv(exuLast);
  const done = (ok) => { $("exu-status").textContent = ok ? `Copied ${exuLast.batch.trials.length} trial rows · twin (simulated)` : "Copy failed"; };
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-1000px";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    ta.remove();
    done(ok);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => done(true), fallback);
  } else fallback();
}

function exuExecute() {
  const ctrl = exuControls();
  const t0 = performance.now();
  const batch = runBatch({ set: ctrl.set, seed: ctrl.seed, eps: ctrl.eps, K: ctrl.K, slip: ctrl.slip });
  // The ε and K charts are the paper's sweeps, not the single operating point of the batch.
  // Same seed, so a re-run moves the batch and both sweeps together.
  const eps = epsSweep({ seed: ctrl.seed });
  const ks = kSweep({ seed: ctrl.seed });
  const ms = performance.now() - t0;
  exuLast = { batch, ms, ctrl, eps, ks };
  if (batch.set === "offline") exuFillTwin(batch.summary);
  exuPaint();
  $("exu-csv").disabled = false;
}

function exuPanelCheck() {
  const nums = [...document.querySelectorAll("#report [data-twin]")].filter((el) => /^\d+(\.\d+)?$/.test(el.textContent.trim()));
  const charts = ["exu-chart-q", "exu-chart-eps", "exu-chart-k"].map((id) => document.getElementById(id)).filter((el) => el && el.tagName.toLowerCase() === "svg" && el.querySelector("path") && el.querySelector("text"));
  const ok = nums.length === 7 && charts.length === 3;
  return { ok, detail: ok ? "7 twin accuracies and 3 charts" : `twin numbers ${nums.length}/7, charts ${charts.length}/3` };
}

function exuRegisterCheck() {
  const entry = { name: "experiments panel", run: exuPanelCheck };
  try {
    if (typeof CHECKS !== "undefined" && Array.isArray(CHECKS)) {
      CHECKS.push(entry);
      return;
    }
  } catch (e) { /* CHECKS is not declared on this branch */ }
  // This branch's 70-loop.js still returns { ok: true } and does not own CHECKS.
  // Fold the same check into window.pc.checks so shots run it. The lead's loop,
  // which maps CHECKS itself, skips this branch because the push above returned.
  const prev = window.pc && window.pc.checks;
  if (typeof prev !== "function") return;
  window.pc.checks = () => {
    const base = prev.call(window.pc) || { ok: true };
    let mine;
    try { mine = entry.run(); } catch (e) { mine = { ok: false, detail: String(e && e.message || e) }; }
    const results = (base.results || []).concat([{ name: entry.name, ok: mine.ok === true, detail: mine.detail }]);
    return { ok: base.ok !== false && mine.ok === true, results };
  };
}

function exuMount() {
  $("exp").innerHTML = `<style>
    #exp .exu-ctl { display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: flex-end; }
    #exp .exu-ctl label { display: flex; flex-direction: column; gap: 2px; font-size: 10.5px; color: var(--muted); }
    #exp .exu-ctl input, #exp .exu-ctl select { font: 500 12px var(--mono); color: var(--ink); background: var(--panel-2); border: 1px solid var(--line); border-radius: 7px; padding: 3px 6px; width: 68px; }
    #exp .exu-ctl select { width: 104px; }
    #exp .btn-row { margin-top: 8px; }
    #exp button:disabled { opacity: 0.55; cursor: progress; }
    #exp .sec-h { margin: 9px 0 3px; }
    #exp table.exu-metrics { table-layout: fixed; font-size: 10.5px; }
    #exp col.exu-c-name { width: 22%; }
    #exp col.exu-c-acc { width: 30%; }
    #exp table.exu-online col.exu-c-acc { width: 22%; }
    #exp table.exu-metrics th, #exp table.exu-metrics td { white-space: normal; vertical-align: top; padding: 3px 2px; overflow: hidden; }
    #exp td.exu-name { white-space: nowrap; font-weight: 500; }
    #exp tr.exu-twin td { background: color-mix(in srgb, var(--accent) 7%, transparent); }
    #exp .exu-p { display: block; color: var(--muted); white-space: nowrap; }
    #exp .exu-t { display: block; color: var(--ink); font-weight: 500; white-space: nowrap; }
    #exp .exu-ci { display: block; color: var(--faint); font-size: 9px; white-space: nowrap; }
    #report table.grid { table-layout: fixed; width: 100%; font-size: 10.5px; }
    #report table.grid th { white-space: normal; line-height: 1.15; overflow: visible; }
    #report table.grid td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #report table.grid th:first-child, #report table.grid td:first-child { white-space: normal; width: 32%; }
    #report table.grid th:nth-child(5), #report table.grid td:nth-child(5) { width: 18%; }
    #report .sec-h { flex-wrap: wrap; }
    #report .sec-h em { white-space: normal; overflow: visible; text-overflow: clip; }
    #exp .exu-sim { font: 8px var(--mono); font-style: normal; letter-spacing: 0.03em; text-transform: uppercase; color: var(--faint); border: 1px solid var(--line); border-radius: 3px; padding: 0 2px; margin-left: 3px; vertical-align: 1px; }
    #exp .exu-leg { display: flex; flex-wrap: wrap; gap: 2px 8px; margin: 2px 0 4px; font-size: 10.5px; color: var(--muted); line-height: 1.35; }
    #exp .exu-leg span { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
    #exp .exu-sw { width: 14px; height: 0; border-top-width: 2px; display: inline-block; }
    #exp .exu-svg { width: 100%; height: auto; display: block; }
    #exp .exu-svg text { font: 500 9.5px var(--mono); fill: var(--muted); }
    #exp .exu-grid { stroke: var(--line); stroke-width: 1; }
    #exp .exu-axis { stroke: var(--faint); stroke-width: 1; }
    #exp .small-note { margin: 3px 0 0; }
  </style>
  <div class="exu-ctl">
    <label>Set<select id="exu-set"><option value="offline">Offline</option><option value="online">Online</option></select></label>
    <label>Seed<input id="exu-seed" type="number" min="1" step="1" value="11"></label>
    <label>ε<input id="exu-eps" type="number" min="0" max="1" step="0.01" value="0"></label>
    <label>K<input id="exu-k" type="number" min="1" max="5" step="1" value="${PARAMS.K}"></label>
    <label>Slip<input id="exu-slip" type="number" min="0" max="1" step="0.01" value="0.05"></label>
  </div>
  <div class="btn-row">
    <button class="btn" id="exu-run" type="button">Run batch</button>
    <button class="btn" id="exu-csv" type="button" disabled>Copy batch CSV</button>
  </div>
  <p id="exu-status" class="small-note" aria-live="polite">Running the offline batch…</p>
  <div id="exu-charts"></div>
  <div id="exu-tables"></div>`;
  $("exu-run").addEventListener("click", () => {
    const btn = $("exu-run");
    if (btn.disabled) return;
    btn.disabled = true;
    $("exu-status").textContent = "Running the batch…";
    setTimeout(() => {
      try { exuExecute(); } catch (e) { $("exu-status").textContent = `Batch failed: ${e && e.message ? e.message : e}`; }
      btn.disabled = false;
    }, 0);
  });
  $("exu-csv").addEventListener("click", exuCopy);
}

exuMount();
queueMicrotask(() => {
  try { exuExecute(); } catch (e) { $("exu-status").textContent = `Batch failed: ${e && e.message ? e.message : e}`; }
  exuRegisterCheck();
});
