// @ts-check
// Deep-module enforcement for dependency-cruiser, adapted from mattpocock/skills `setup-ts-deep-modules`
// (pinned in skills-lock.json). Decision record: docs/adr/0001-deep-modules.md.
//
// Each library folder under src/ is a DEEP MODULE: its root files are its entry points (public); anything in a
// subfolder (by convention `lib/`) is private. Episodes are leaves: one folder per Short, reachable only through
// the registry. Run with `npm run lint:boundaries` (part of `npm run check`).

/** The library modules. Each is flat at its root; subfolders are private. */
const MODULES = '(engine|audio|band|characters|props|world|lib|ui)';
const M = `^src/${MODULES}/`;
/** A module's private internals: anything inside one of its subfolders. */
const INTERNALS = `^src/${MODULES}/[^/]+/`;
const TEST = '\\.test\\.tsx?$';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // --- Deep modules: import through the entry points ------------------------------------------------------------
    {
      name: 'entrypoint-boundary',
      comment: "Import a module's entry points (its root files), never anything in its subfolders.",
      severity: 'error',
      from: { pathNot: M },
      to: { path: INTERNALS },
    },
    {
      name: 'entrypoint-boundary-across-modules',
      comment: "A module's own files import each other freely; other modules only through their entry points.",
      severity: 'error',
      from: { path: M, pathNot: TEST },
      to: { path: INTERNALS, pathNot: '^src/$1/' },
    },
    {
      name: 'tests-through-entrypoints',
      comment: 'Tests exercise a module through its entry points, like everyone else.',
      severity: 'error',
      from: { path: TEST },
      to: { path: INTERNALS },
    },
    {
      name: 'typescript-only',
      comment: 'The app is TypeScript only: no .js/.jsx files in src (allowJs is off, so they would go unchecked).',
      severity: 'error',
      from: {},
      to: { path: '^src/.*\\.jsx?$' },
    },
    {
      name: 'no-circular',
      comment: 'No dependency cycles.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },

    // --- Episodes are leaves ---------------------------------------------------------------------------------------
    {
      name: 'no-cross-episode',
      comment:
        "An episode never reaches into another episode's files: shared sets belong in src/world. A joke variant may spread another episode through its index.",
      severity: 'error',
      from: { path: '^src/episodes/([^/]+)/' },
      to: { path: '^src/episodes/[^/]+/', pathNot: ['^src/episodes/$1/', '^src/episodes/[^/]+/index\\.[jt]s$'] },
    },
    {
      name: 'episodes-through-the-registry',
      comment: 'The app reaches Shorts only through the registry (src/episodes/index.ts).',
      severity: 'error',
      from: { pathNot: '^src/episodes/' },
      to: { path: '^src/episodes/[^/]+/' },
    },

    // --- Layers: features → episodes → band → characters, props, world → engine → audio -----------------------------
    {
      name: 'engine-below-the-scene',
      comment:
        'The engine plays any Short on the audio clock; it knows nothing about the band, the dinos or the Shorts.',
      severity: 'error',
      from: { path: '^src/engine/' },
      to: { path: '^src/(band|characters|props|world|episodes|features|app|ui)/' },
    },
    {
      name: 'audio-is-the-bottom',
      comment: 'Audio is sound only. From the engine it takes only the seeded rng (engine/math).',
      severity: 'error',
      from: { path: '^src/audio/' },
      to: {
        path: '^src/(engine|band|characters|props|world|episodes|features|app|ui)/',
        pathNot: '^src/engine/math\\.ts$',
      },
    },
    {
      name: 'scene-below-episodes',
      comment: 'Rigs, props, sets and band members never import a Short or the UI.',
      severity: 'error',
      from: { path: '^src/(band|characters|props|world)/' },
      to: { path: '^src/(episodes|features|app|ui)/' },
    },
    {
      name: 'episodes-below-the-ui',
      comment: 'A Short is a pure function of time: it never imports the React app.',
      severity: 'error',
      from: { path: '^src/episodes/' },
      to: { path: '^src/(features|app|ui)/' },
    },
  ],
  options: {
    // TypeScript 7 has no JS API yet, so dependency-cruiser parses .ts/.tsx with swc instead of tsc.
    parser: 'swc',
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '^src/test/' },
    tsConfig: { fileName: 'tsconfig.app.json' },
    enhancedResolveOptions: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
  },
};
