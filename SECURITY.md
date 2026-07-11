# Security Policy

## Audit Status

This library has not undergone a third-party cryptographic audit. It implements
the published Socialist Millionaires' Protocol (a standard construction, not a
novel one), but do not rely on it for a production privacy guarantee, and do not
make privacy marketing claims, until it has been audited.

## Algorithm

The Socialist Millionaires' Protocol (SMP) decides whether two parties hold the
same secret while revealing exactly one bit — equal or not equal. On mismatch,
neither party learns anything about the other's secret beyond inequality. This
implementation ports the OTR variant of SMP to the Ristretto255 prime-order
group, driven as a pure state machine over the consumer's transport.

## Academic References

- **Boudot, Schoenmakers, Traoré (2001)** — "A Fair and Efficient Solution to
  the Socialist Millionaires' Problem". The underlying private-equality
  protocol.
- **Alexander, Goldberg (2007)** — "Improved User Authentication in
  Off-the-Record Messaging". The OTR adaptation of SMP that this library
  implements, including the zero-knowledge proofs accompanying each message.

## Security Properties

- **One-bit leakage** — on completion both sides learn the same single bit;
  on mismatch nothing else about either secret leaks.
- **Channel binding** — plain SMP is vulnerable to a man-in-the-middle relaying
  messages between two honest parties. This library REQUIRES a `sessionBinding`
  (the authenticated channel's transcript hash, e.g. a Noise handshake hash)
  and folds it into every Fiat–Shamir challenge. Mismatched bindings abort with
  `SmpError`. The library does not provide the authenticated channel itself.
- **Domain separation** — all hashes use fixed protocol constants
  (`private-equality/pok-v1`, `private-equality/repr-v1`,
  `private-equality/eq-v1`, `private-equality/secret-v1`) plus a per-proof tag
  byte, so no two proofs in a session share a challenge domain.
- **Wire hygiene** — identity points are rejected when decoding peer messages
  (closing degenerate-point attacks), and the negligible zero secret-scalar
  case is guarded.
- **Not post-quantum** — security rests on the decisional Diffie–Hellman
  assumption in Ristretto255. Fine for ephemeral secrets; do not use it to
  protect long-lived high-value secrets against a future quantum adversary.

## Dependencies

Runtime dependencies are limited to [`@noble/curves`](https://github.com/paulmillr/noble-curves)
and [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) — audited,
widely deployed primitives. `@noble/curves` is isolated behind `src/group.ts`,
the only file that imports it.

## Reporting a Vulnerability

Use GitHub's private vulnerability reporting on this repository
(Security → Report a vulnerability). Please do not open public issues for
suspected vulnerabilities.
