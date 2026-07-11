# GEMINI.md — private-equality

Private equality of a secret, revealing one bit — Socialist Millionaires'
Protocol over Ristretto255.

## Commands

- `npm run build` / `npm test` / `npm run coverage` / `npm run typecheck`

## Key facts

- Pure state machine: `initiate`/`respond` → `session.next(incoming)` → one
  boolean. Four messages, ferried by the consumer over an authenticated channel.
- `sessionBinding` (the channel transcript hash) is mandatory and folded into
  every Fiat–Shamir challenge — it is the MITM defence.
- Crypto-sensitive files: `src/zkp.ts`, `src/smp.ts`, `src/group.ts`. Do not
  change constants or validation there without expert review (see `CLAUDE.md`).
- British English, ESM-only, `type: description` commits, no `Co-Authored-By`.
