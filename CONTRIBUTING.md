# Contributing

## Setup

```bash
git clone https://github.com/forgesworn/private-equality.git
cd private-equality
npm install
npm test
```

## Development Workflow

```bash
npm run build      # Compile TypeScript → dist/
npm test           # Run test suite (vitest)
npm run coverage   # Test suite with the per-file coverage gate
npm run typecheck  # Type-check without emitting (tsc --noEmit)
```

Always run `npm run typecheck` and `npm test` before committing.

## Branch Strategy

This repository releases via [forgesworn/anvil](https://github.com/forgesworn/anvil)
on `main` — pushes to `main` with a releasing commit type automatically publish
a new npm version.

- **Always work on a branch** (never commit directly to `main`).
- Merge or squash to `main` only when a logical chunk of work is complete.
- This produces one clean release instead of many incremental versions.

## Commit Conventions

Commit messages follow the `type: description` format. The type determines the
version bump:

| Type | Version bump | Example |
|------|-------------|---------|
| `feat:` | minor | `feat: add subpath export` |
| `fix:` | patch | `fix: reject oversized message` |
| `docs:` | none | `docs: clarify session binding derivation` |
| `refactor:` | none | `refactor: extract challenge helper` |
| `test:` | none | `test: add binding mismatch cases` |
| `chore:` | none | `chore: update dev dependencies` |

Use `BREAKING CHANGE:` in the commit body (or `feat!:` / `fix!:`) for major
version bumps. Releases also need a `CHANGELOG.md` entry and a synchronised
`PRIVATE_EQUALITY_VERSION` (see `CLAUDE.md`).

## Crypto Review Policy

**PRs that touch protocol logic require careful review.** This includes:

- Anything in `src/zkp.ts`, `src/smp.ts`, or `src/group.ts`
- Changes to domain separators, tag bytes, hashing, or scalar arithmetic
- Changes to `sessionBinding` handling or wire-format validation

If you are unsure whether a change affects cryptographic security, flag it for
review. The domain separators (`private-equality/pok-v1`, `.../repr-v1`,
`.../eq-v1`, `.../secret-v1`) are protocol constants — changing them breaks
interoperability between versions.

## Style

- **British English** in all prose — colour, initialise, behaviour, licence.
- **ESM-only** — all imports use `.js` extensions.
- Keep test coverage high. Every new function or code path should have
  corresponding tests.

## Reporting Issues

Open an issue on GitHub. If the issue involves a potential security
vulnerability, use GitHub's private vulnerability reporting instead of a
public issue — see `SECURITY.md`.
