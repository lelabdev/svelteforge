# Security Policy

SVForge ships boilerplate that scaffolds authentication, uploads, jobs, and
other security-sensitive surfaces. If you found a vulnerability, this document
explains how to report it privately and what to expect.

## Supported versions

SVForge packages are versioned independently. Only the **latest published
version of each package** receives security fixes. Before a package's first
stable release, only the current `main` branch is supported.

| Package | Supported |
|---------|-----------|
| latest published version of each `@svforge/*` package and `svforge` | ✅ |
| any older version | ❌ re-scaffold or upgrade instead |
| `main` (pre-release) | ✅ fixes land here first |

There is no backport policy yet: generated projects should pin, then upgrade
to the fixed version when it ships.

## Reporting a vulnerability

**Do NOT open a public GitHub issue for security reports.** Public issues can
expose exploitation details before a fix exists.

Report privately through GitHub's **private vulnerability reporting**:

> https://github.com/lelabdev/svelteforge/security/advisories/new

This channel is owned by the maintainers and is the only supported reporting
route. If you cannot use it, contact the maintainers directly through an
established private channel and reference "SVForge security".

### What a useful report contains

- affected package name(s) and version(s), or the `main` commit SHA;
- the affected surface (addon code, generated project code, `sv add` flow, CLI);
- a minimal proof of concept or reproduction steps;
- impact assessment (what an attacker gains);
- any known mitigation.

### What to expect

- **Acknowledgement:** within 72 hours of your report.
- **Status updates:** at least every 7 days until resolution.
- **Fix targets (from acknowledgement):** critical ≤ 7 days, high ≤ 30 days,
  medium/low ≤ 90 days. Complex dependency-chain issues may take longer; you
  will be told.
- **Credit:** reporters are credited in the advisory and changelog entry unless
  they prefer anonymity.

## Coordinated disclosure

We practice coordinated disclosure. Please give us a reasonable window —
default **90 days** — to ship a fix before public disclosure. We will keep you
informed of progress and agree on a disclosure date together. Avoid automated
scanning against hosted demos, and never access, modify, or exfiltrate data
that is not yours.

## Safe harbor

We consider security research conducted in good faith against this policy to be
authorized: we will not pursue legal action for accidental, respectful
vulnerability discovery and disclosure. This safe harbor does not cover denial
of service, social engineering, spam, physical attacks, or access to data you
are not explicitly allowed to process.

## Leaked credentials and secrets

If you discover credentials, tokens, or secrets committed in this repository or
in a published package:

1. **Do not publish them** — report privately through the channel above.
2. If they are yours, rotate them immediately; rotation is the primary fix.
3. We will revoke, rotate, and purge the secret from history when applicable.

## Vulnerabilities affecting generated projects

SVForge scaffolds projects with third-party foundations (Better Auth, Drizzle,
Skeleton, SvelteKit…).

- **Vulnerability in SVForge templates or generated code patterns** (insecure
  default, wrong middleware order, unsafe example) → report here.
- **Vulnerability in a third-party dependency of a generated project** → report
  to that project upstream; also tell us if a pinned version needs a bump.
- **Vulnerability in YOUR generated application's custom code** → this is not
  an SVForge issue; handle it in your own repository. The boilerplate cannot
  audit application logic written on top of it.
