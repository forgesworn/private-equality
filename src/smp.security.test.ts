import { describe, it, expect } from 'vitest'
import { initiate, respond } from './smp.js'
import { SmpError } from './types.js'

const enc = (s: string) => new TextEncoder().encode(s)

describe('smp security', () => {
  it('a relay (mismatched session binding) aborts with SmpError', () => {
    const A = initiate('secret', enc('channel-A'))
    const B = respond('secret', enc('channel-B')) // different authenticated channel
    expect(() => B.session.next(A.first)).toThrow(SmpError)
  })

  it('a flipped byte in msg1 aborts (bad proof or bad length)', () => {
    const A = initiate('secret', enc('chan'))
    const B = respond('secret', enc('chan'))
    const tampered = A.first.slice()
    tampered[0] ^= 0xff
    expect(() => B.session.next(tampered)).toThrow(SmpError)
  })

  it('calling next() after completion throws (responder)', () => {
    const A = initiate('x', enc('chan'))
    const B = respond('x', enc('chan'))
    let msg = A.first
    msg = (B.session.next(msg) as { send: Uint8Array }).send
    msg = (A.session.next(msg) as { send: Uint8Array }).send
    const bDone = B.session.next(msg)
    expect(bDone.done).toBe(true)
    expect(() => B.session.next((bDone as { send: Uint8Array }).send)).toThrow(SmpError)
  })

  it('calling next() after completion throws (initiator)', () => {
    const A = initiate('x', enc('chan'))
    const B = respond('x', enc('chan'))
    let msg = A.first
    const msg2 = (B.session.next(msg) as { send: Uint8Array }).send
    const msg3 = (A.session.next(msg2) as { send: Uint8Array }).send
    const bDone = B.session.next(msg3) as { send: Uint8Array; done: true }
    // feed msg4 to A — this completes A (state → done)
    const aDone = A.session.next(bDone.send)
    expect(aDone.done).toBe(true)
    // calling A.session.next() again must throw SmpError
    expect(() => A.session.next(new Uint8Array(96))).toThrow(SmpError)
  })

  it('never returns a false match: tampering msg3 makes Bob abort, not match', () => {
    const A = initiate('same', enc('chan'))
    const B = respond('same', enc('chan'))
    let msg = A.first
    msg = (B.session.next(msg) as { send: Uint8Array }).send
    const msg3 = (A.session.next(msg) as { send: Uint8Array }).send
    msg3[40] ^= 0xff // corrupt a field inside msg3
    expect(() => B.session.next(msg3)).toThrow(SmpError)
  })

  it('invalid point encoding in msg2 (correct length, bad bytes) throws SmpError from initiator', () => {
    // Initiator receives a 352-byte buffer (correct msg2 length) whose first 32 bytes are not a valid
    // Ristretto255 point — forces decodePoint to throw a raw @noble error, which the catch gate must
    // re-wrap as SmpError rather than leaking the raw error.
    const A = initiate('x', enc('chan'))
    const badMsg2 = new Uint8Array(352).fill(0xff) // all-0xff is not a valid encoded point
    expect(() => A.session.next(badMsg2)).toThrow(SmpError)
  })

  it('rejects an identity point on the wire (SmpError)', () => {
    const A = initiate('secret', enc('chan'))
    const B = respond('secret', enc('chan'))
    const m = A.first.slice()
    m.fill(0, 0, 32) // 32 zero bytes = the ristretto identity, in the g2a slot
    expect(() => B.session.next(m)).toThrow(SmpError)
  })
})
