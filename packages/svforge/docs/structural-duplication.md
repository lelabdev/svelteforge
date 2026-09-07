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
`svforge-catalog.json` paths; there is no second component list. The generated
Skeleton inventory remains the authority for exact Skeleton primitive names,
which are already ERROR diagnostics.

Fingerprints are cached in-process by file key. The checker does no network or
filesystem writes. It is linear in component count for fingerprinting, then
compares each local component with the small catalog (currently 14 entries).
Across the base/dashboard scaffold matrix this is expected to remain below one
second; keep it opt-in and WARN-only until a matrix benchmark and false-positive
review justify a calibrated threshold or enforceable severity.

The threshold is currently 0.86. Normal page/layout variations should stay
below it; a renamed copy with class-order changes should report the canonical
component to reuse.
