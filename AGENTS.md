# AGENTS.md: private-equality

Instructions in this file apply to the entire repository.

## Project Summary

`@forgesworn/private-equality` decides "do two parties hold the same secret,
yes or no?" via the Socialist Millionaires' Protocol (OTR variant) over
Ristretto255, revealing nothing else on mismatch. Pure four-message state
machine; the consumer supplies the authenticated channel and ferries opaque
bytes.

## Build & Test

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run the test suite (vitest, single run) |
| `npm run coverage` | Run tests with the per-file coverage gate |
| `npm run typecheck` | Type-check without emitting (`tsc --noEmit`) |

Always run `npm test` and `npm run typecheck` before committing.

## Architecture

| File | Purpose |
|------|---------|
| `src/group.ts` | Isolates `@noble/curves` ristretto255: the only file importing it. Point/scalar codecs, `hashToScalar`, `randomScalar`. `Pt` is a structural interface (dodges TS4094 on @noble's anonymous class). |
| `src/zkp.ts` | Three sigma proofs: PoK of a discrete log, representation (`P = g3^r`, `Q = g1^r · g2^y`), equality of two discrete logs. All Fiat–Shamir with domain separation and a per-proof tag byte. |
| `src/smp.ts` | The four-message OTR-SMP state machine and fixed-layout wire codec. `initiate`/`respond` entry points. |
| `src/types.ts` | Public types: `Secret`, `SmpResult`, `SmpStep`, `SmpSession`, `SmpError`, `PRIVATE_EQUALITY_VERSION`. |
| `src/index.ts` | Public API re-exports. |

### Data flow

Pure state machine, no transport. The consumer ferries opaque `Uint8Array`
messages over an authenticated channel: `initiate(secret, binding)` returns
`{ session, first }`; each side calls `session.next(incoming)` until
`{ done: true, result: { match } }`. Four messages total.

## Crypto Safety: Do Not Change Without Expert Review

- **Domain separators** (`private-equality/pok-v1`, `private-equality/repr-v1`,
  `private-equality/eq-v1`, `private-equality/secret-v1`) are protocol
  constants. Changing them breaks interoperability between versions.
- **Per-proof tag bytes** separate the distinct proofs within a session. Do
  not renumber or merge them; two proofs sharing a challenge domain enables
  proof transplantation.
- **`sessionBinding` is folded into every Fiat–Shamir challenge.** Never make
  it optional and never drop it from a challenge: it is the MITM defence.
- **Identity points are rejected on the wire** (decode-time). Do not relax
  this: it closes the degenerate `QaQb = identity` case.
- **The zero secret-scalar guard** in secret derivation is intentional. Do
  not remove it.
- **The wire codec is fixed-layout** (32-byte points and scalars, strict
  length checks). Do not add variable-length fields without redesigning the
  codec.
- **`PRIVATE_EQUALITY_VERSION` in `src/types.ts` is pinned by
  `src/smoke.test.ts` as a literal string.** Anvil bumps `package.json` from
  commit prefixes; the constant does not update itself. Any releasing change
  (`feat:`/`fix:`) must update `src/types.ts` and `src/smoke.test.ts` to the
  new version in the same PR.

## Conventions

- **British English** in all prose (colour, initialise, behaviour, licence).
- **ESM-only**: all imports use `.js` extensions.
- **Commit messages**: `type: description` (e.g. `feat: add subpath export`,
  `fix: reject oversized message`). No `Co-Authored-By` lines.
- **Anvil auto-releases on push to main**: every push to `main` runs
  `forgesworn/anvil@v0` and can auto-publish. Work on branches; merge to
  main only when a logical chunk is complete.

## Release & Versioning

Automated via [forgesworn/anvil](https://github.com/forgesworn/anvil):
`auto-release.yml` reads conventional commits on push to `main`, bumps the
version, and creates a GitHub Release; `release.yml` then runs the
pre-publish gates and publishes to npm via OIDC trusted publishing.

| Type | Version bump |
|------|--------------|
| `fix:` | Patch (0.1.x) |
| `feat:` | Minor (0.x.0) |
| `BREAKING CHANGE:` (in commit body) | Major (x.0.0) |
| `chore:`, `docs:`, `refactor:`, `ci:` | None |

Every release needs a matching `CHANGELOG.md` entry (anvil extracts the
release body from it) and a synchronised `PRIVATE_EQUALITY_VERSION`.

## Testing

Tests live in `src/*.test.ts`. Vitest with a per-file coverage gate
(`vitest.config.ts`). Coverage floors (per file): functions 100% on all
three gated files; `zkp` lines ≥95 / branches ≥90; `group` and `smp` lines
≥90 / branches ≥70 (branch floors re-baselined for vitest 4's stricter
AST-aware counting). Tests cover the full protocol round-trip, mismatch
non-leakage, binding mismatch aborts, malformed/replayed messages, and
tampered proofs. PRs touching `zkp.ts` or `smp.ts` require crypto review.

## Common Pitfalls

- Do not modify domain separators, tag bytes, the `sessionBinding` folding,
  identity-point rejection, or the zero-scalar guard without crypto review
  (see "Crypto Safety" above).
- Do not bump `PRIVATE_EQUALITY_VERSION` in isolation: it must move together
  with `package.json` and a `CHANGELOG.md` entry.

## How to Verify a Change

Run `npm run typecheck` and `npm test` (or `npm run coverage` for the full
gate) before committing. For any change to `src/zkp.ts` or `src/smp.ts`,
get crypto review in addition to the test suite passing.
