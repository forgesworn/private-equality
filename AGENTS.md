# AGENTS.md — private-equality

Instructions in this file apply to the entire repository.

## Project Summary

`@forgesworn/private-equality` decides "do two parties hold the same secret —
yes/no?" via the Socialist Millionaires' Protocol (OTR variant) over
Ristretto255, revealing nothing else on mismatch. Pure four-message state
machine; the consumer supplies the authenticated channel and ferries opaque
bytes.

## Commands

- Build: `npm run build`
- Test: `npm test`
- Coverage gate: `npm run coverage`
- Typecheck: `npm run typecheck`

## Rules

- British English in all prose. ESM-only; imports use `.js` extensions.
- Commits: `type: description`. No `Co-Authored-By` lines.
- Do not modify domain separators, tag bytes, the `sessionBinding` folding,
  identity-point rejection, or the zero-scalar guard without crypto review —
  see the "Crypto Safety" section of `CLAUDE.md`.
- Bump `PRIVATE_EQUALITY_VERSION` (`src/types.ts`) together with
  `package.json` and add a `CHANGELOG.md` entry for any release.
- Anvil auto-releases on push to main — work on branches.
