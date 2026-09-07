# Tailwind arbitrary-value linting

## Decision (#349)

**Do not adopt `eslint-plugin-tailwindcss` for arbitrary-value enforcement.**
SvelteForge keeps the conservative `svforge-check.mjs` WARN policy introduced
in #345. It is the single severity policy for arbitrary spacing and radius;
no ESLint rule or dependency is added.

## Evaluation

Evaluated against `eslint-plugin-tailwindcss` v4.4.0, Tailwind CSS v4.2.2,
the generated project's flat `eslint.config.js`, and Svelte markup. The plugin
parses Svelte attributes and the configured helper names, including `cn`,
`clsx`, `twMerge`, `cva`, and template literals.

| Candidate | Result | Why |
| --- | --- | --- |
| `tailwindcss/no-arbitrary-value` | Rejected | It has no rule options and reports every arbitrary value. This incorrectly rejects accepted structural values such as `grid-cols-[minmax(0,1fr)_auto]` and one-off widths. |
| `tailwindcss/no-unnecessary-arbitrary-value` | Rejected | It can suggest a scale equivalent (for example `p-[1rem]` → `p-4`) and supports the helpers above, but intentionally does not report `p-[13px]` or `rounded-[7px]` when no exact preset exists. Those are the spacing/radius cases #345 must surface. |
| ESLint overrides | Rejected | File or helper overrides only change where a rule runs; they cannot narrow `no-arbitrary-value` by Tailwind utility namespace or restore structural exceptions. |
| #346 AST work | Follow-up | An AST-aware rule can eventually provide editor diagnostics with the #345 boundary and dynamic-helper support. It must reuse, not duplicate, the existing policy. |

`no-unnecessary-arbitrary-value` is useful generic formatting feedback, but it
does not enforce SvelteForge's component-reuse boundary. It cannot tell an
agent to select an existing SVForge/Skeleton component, and enabling it next
to #345 would create overlapping, non-equivalent diagnostics.

## Verification record

The base and dashboard templates continue to use the same generated flat ESLint
configuration inherited from the base scaffold. Their static arbitrary classes
are checked by `svforge-check.mjs`; WARN findings do not fail `bun run check`.
The #345 behavioral tests cover spacing/radius findings, structural exceptions,
variants, negative margins, and exact canonical-component exemptions.

Revalidate this decision when #346 has an AST implementation. Until then,
run the normal scaffold verification:

```bash
bun run build
bun run test
bash scripts/test-scaffold.sh base
bash scripts/test-scaffold.sh dashboard
```
