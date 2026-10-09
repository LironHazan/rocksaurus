# anti-slop (vendored)

- Source: https://github.com/dmmulroy/anti-slop, `src/` at commit `c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b`.
  Verified: every copied file has the same git blob hash as upstream at that commit.
- Installed with the `install-anti-slop` skill (pinned in `skills-lock.json`), which copies `src/` without the
  `*.test.ts` RuleTester suites.
- Installed plugin: `index.ts` (generic rules), registered in `.oxlintrc.json`. The Effect plugin (`effect/`) is copied
  but not registered: this repo does not depend on Effect.
- Dependencies: `@oxlint/plugins` pinned to the installed `oxlint` version (1.86.0). Upgrade both together.
- Prettier does not format this directory (`.prettierignore`), so it stays byte-for-byte comparable with upstream.

## Intentional deviations

- `rules/no-shape-in-symbol-names.ts`: `EXTERNAL_API_NAMES` exempts `WaveShaperNode` (Web Audio) and three.js's
  `Shape`, `ShapeGeometry`, `ShapePath` and `ShapeUtils`. In a 3D and audio app "shape" is the domain, and these names
  belong to the platform and the library, so they cannot be renamed. Names this repo owns are still checked.
