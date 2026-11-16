// Node-only checks of the pure logic block (src/js files 10-19) inside the built index.html.
// Usage: node tests/run.mjs [index.html] [--perturb]
// Every tests/*.test.mjs exports `default (L, check) => void | Promise<void>` (L = the LOGIC object) and may export
// `perturbations = [{ name, find, replace }]`. With --perturb each perturbation is applied to the logic code on its
// own and at least one check must FAIL; a perturbation every check survives is reported as MISSED (exit 1).
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const perturb = args.includes("--perturb");
const file = args.find((a) => !a.startsWith("--")) || join(here, "..", "index.html");
const html = readFileSync(file, "utf8");
const m = html.match(/\/\/ @@logic-start[^\n]*\n([\s\S]*?)\/\/ @@logic-end/);
if (!m) { console.error("logic block not found (is index.html built?)"); process.exit(2); }
const code = m[1];
const files = readdirSync(here).filter((f) => f.endsWith(".test.mjs")).sort();
const mods = [];
for (const f of files) mods.push(await import(pathToFileURL(join(here, f)).href));
const load = (src) => new Function("console", `${src}\nreturn LOGIC;`)({ log() {}, warn() {}, error() {} });

async function runAll(L, quiet) {
  let fails = 0, passes = 0;
  const check = (ok, msg) => { if (ok) passes++; else fails++; if (!quiet) console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); };
  for (const [i, mod] of mods.entries()) {
    if (!quiet) console.log(`\n${files[i]}`);
    try { await mod.default(L, check); } catch (e) { fails++; if (!quiet) console.log(`FAIL  ${files[i]} threw: ${e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e}`); }
  }
  return { fails, passes };
}

if (!perturb) {
  const { fails, passes } = await runAll(load(code), false);
  console.log(`\n${passes} passed, ${fails} failed (${files.length} test files)`);
  console.log(fails ? "CHECKS FAILED" : "all checks passed");
  process.exit(fails ? 1 : 0);
}
let missed = 0, n = 0;
for (const mod of mods) for (const p of mod.perturbations || []) {
  n++;
  if (!code.includes(p.find)) { console.log(`MISSED ${p.name}: target text not found in the logic block`); missed++; continue; }
  let L;
  try { L = load(code.replace(p.find, p.replace)); } catch (e) { console.log(`CAUGHT ${p.name}: the logic no longer loads`); continue; }
  const { fails } = await runAll(L, true);
  if (fails) console.log(`CAUGHT ${p.name}: ${fails} check(s) failed`);
  else { console.log(`MISSED ${p.name}: every check still passes`); missed++; }
}
console.log(n === 0 ? "no perturbations defined" : missed ? `${missed} of ${n} perturbations NOT caught` : `all ${n} perturbations caught`);
process.exit(missed || n === 0 ? 1 : 0);
