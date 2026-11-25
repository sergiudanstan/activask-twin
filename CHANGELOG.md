# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-25

First tagged release of a digital twin of ActivAsk (Robotics 15(8):154), a Hello Robot Stretch 3 that asks expected-free-energy-selected yes/no questions to resolve an ambiguous grasping instruction, as published at
https://sergiudanstan.github.io/activask-twin/.

### Added
- Headless page smoke test (`npm run smoke`): loads `index.html` in Chrome and fails on any page error, failed request, console error or missing WebGL canvas.
- CI that rebuilds `index.html` from `src/` and fails if the committed file differs, runs the logic tests (7 files under `tests/`, 178 checks), the perturbation check (`npm run perturb`) and the headless page smoke test, and audits dependencies and workflows.
- CodeQL, OpenSSF Scorecard and a tag-triggered release workflow with build provenance; Dependabot for actions and npm.
- `SECURITY.md`, `CONTRIBUTING.md` and this changelog.

### Changed
- `playwright-core` (test tooling only) pinned exactly at 1.65.0.

[Unreleased]: https://github.com/sergiudanstan/activask-twin/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sergiudanstan/activask-twin/releases/tag/v0.1.0
