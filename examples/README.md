# Examples

Run directly from the repo with [tsx](https://tsx.is):

```sh
npx tsx examples/basic-match.ts
npx tsx examples/session-binding-abort.ts
```

| Example | Shows |
|---|---|
| `basic-match.ts` | The four-message flow; equal secrets → `true`, unequal → `false` |
| `session-binding-abort.ts` | Mismatched `sessionBinding` values abort with `SmpError` instead of completing — the MITM defence |

In production, replace the in-process ferrying with your authenticated
channel, and derive `sessionBinding` from that channel's transcript
(e.g. the Noise handshake hash). Both sides must supply the same value.
