# @forgesworn/private-equality

Decide *"do two parties hold the same secret — yes/no?"* via the Socialist Millionaires' Protocol over Ristretto255, revealing nothing else on mismatch.

## What it is

`@forgesworn/private-equality` is a small cryptographic primitive for private equality testing. The consumer derives a canonical secret or codeword, supplies an authenticated channel, and the library runs the Socialist Millionaires' Protocol (OTR's SMP variant, ported to Ristretto255) as a pure state machine, returning a single boolean.

**When to use it:** any time two parties need to establish "do we share the same value?" without disclosing what the value is. Equal secrets yield `match: true`; unequal secrets yield `match: false` with nothing about either secret leaking. This is a general-purpose primitive — the consumer is responsible for deriving the secret and providing the authenticated channel.

This implements the published SMP as specified in the OTR protocol, adapted for the Ristretto255 prime-order group. It is a standard construction, not a novel one.

## Install

```sh
npm install @forgesworn/private-equality
```

## Usage

The protocol runs four messages. In production each `Uint8Array` travels over the consumer's authenticated channel; the example below drives both sides in-process for illustration.

```ts
import { initiate, respond } from '@forgesworn/private-equality'

// `sessionBinding` MUST be your authenticated channel's transcript hash
// (e.g. the Noise handshake hash). Both sides must supply the same value.
const binding = new TextEncoder().encode('your-authenticated-channel-transcript-hash')

const alice = initiate('shared-codeword', binding)
const bob = respond('shared-codeword', binding)

let msg = alice.first
const s1 = bob.session.next(msg)         // { send: msg2 }
const s2 = alice.session.next(s1.send!)  // { send: msg3 }
const s3 = bob.session.next(s2.send!)    // { send: msg4, done: true, result }
const s4 = alice.session.next(s3.send!)  // { done: true, result }

console.log(s3.result.match, s4.result.match) // the single bit — identical on both sides
```

### The single bit

Equal secrets produce `match: true` on both sides. Unequal secrets produce `match: false` — and on mismatch, neither party learns anything about the other's secret beyond the fact that the two values differ.

### API surface

| Export | Description |
|---|---|
| `initiate(secret, sessionBinding)` | Start the protocol as the initiating party. Returns `{ session: SmpSession; first: Uint8Array }`. |
| `respond(secret, sessionBinding)` | Start the protocol as the responding party. Returns `{ session: SmpSession }`. |
| `SmpSession.next(incoming)` | Advance the state machine. Returns `{ send: Uint8Array }` for intermediate steps, or `{ send?: Uint8Array; done: true; result: { match: boolean } }` at completion. |
| `SmpError` | Thrown on protocol violations (invalid proof, wrong state, mismatched binding). |
| `PRIVATE_EQUALITY_VERSION` | Library version string. |
| `Secret` | `Uint8Array \| string` |

## Security

Plain SMP is vulnerable to man-in-the-middle attack. This library **requires** that both sides run over an authenticated channel and binds to it via the `sessionBinding` parameter (typically the Noise handshake hash or equivalent channel transcript). The library does **not** provide the authenticated channel — use an off-the-shelf Noise library for that.

Supplying a mismatched or relayed `sessionBinding` causes the protocol to abort with `SmpError`.

> This library implements the published Socialist Millionaires' Protocol (OTR's SMP) over
> Ristretto255. It has **not** had a third-party cryptographic audit. Do not rely on it for a
> production privacy guarantee, and do not make privacy marketing claims, until it has been
> audited. It must be run over an authenticated channel (e.g. Noise); it does not provide one.

## Licence

MIT — see [LICENSE](./LICENSE).
