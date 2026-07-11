# Changelog

## 0.1.0

Initial public release.

- Socialist Millionaires' Protocol (the OTR SMP variant) over Ristretto255 as a
  pure four-message state machine — `initiate`/`respond` → `session.next(incoming)`
  → a single boolean, identical on both sides.
- Mandatory `sessionBinding` (the consumer's authenticated-channel transcript
  hash) folded into every Fiat–Shamir challenge — relaying messages across two
  separate channels aborts with `SmpError`.
- Wire hardening: identity points are rejected on decode; the ~2^-252
  zero-secret-scalar edge case is guarded.
- 32 tests; 100% line coverage on `group`, `zkp`, and `smp`.
