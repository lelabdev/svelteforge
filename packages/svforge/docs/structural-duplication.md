# Experimental structural duplication detector

Issue #353 adds an opt-in, WARN-only detector for copied SvelteForge components.

```bash
SVFORGE_EXPERIMENTAL_STRUCTURAL_DUPLICATION=1 bun svforge-check.mjs
```

Programmatic callers can pass `{ experimentalStructuralDuplication: true }` to
`checkDesignSystem`. A finding names the SvelteForge component to reuse and
reports its element, Skeleton-utility, and composition-sequence overlap.

## How it works

The detector parses Svelte with `svelte/compiler` and normalizes element and
component sequences, attribute names, Skeleton utilities, blocks, and snippet
composition. Reference fingerprints are read from the installed project's
`svforge-catalog.json` paths and from every installed
`@skeletonlabs/skeleton-svelte/dist/components/**/*.svelte` source. A finding
therefore identifies either the SVForge component or the matching `Skeleton
<component>/<anatomy>` source, including when a copied Skeleton file is
renamed. The generated Skeleton inventory remains the authority for exact
Skeleton primitive names, which are already ERROR diagnostics.

Fingerprints are cached in-process by file key **and source SHA-256**, so an
editor buffer or file changed at the same path is re-fingerprinted. The checker
does no network or filesystem writes. It is linear in component count for
fingerprinting, then compares each local component with the SVForge catalog and
the installed Skeleton sources.

Calibration is covered by the behavioral test matrix: `base`,
`dashboard-vitest`, and `dashboard-playwright` each get an ordinary Hero layout
variation and the detector must produce no finding in a combined measured time
below one second. The initial local calibration completed in **719 ms** (three
profiles, Skeleton 5.0.1). Keep it opt-in and WARN-only until broader
false-positive review justifies an enforceable severity.

The threshold is currently 0.86. Normal page/layout variations should stay
below it; a renamed copy with class-order changes should report the canonical
component to reuse.
