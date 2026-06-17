import { describe, it, expect } from 'vitest'
import { G, randomScalar } from './group.js'
import { encodeMsg1, decodeMsg1, encodeMsg2, decodeMsg2, encodeMsg3, decodeMsg3, encodeMsg4, decodeMsg4 } from './smp.js'

const pt = () => G.multiply(randomScalar())
const sc = () => randomScalar()

describe('smp codec', () => {
  it('msg1 round-trips (192 bytes)', () => {
    const m = { g2a: pt(), g3a: pt(), pok2: { c: sc(), s: sc() }, pok3: { c: sc(), s: sc() } }
    const b = encodeMsg1(m); expect(b.length).toBe(192)
    const d = decodeMsg1(b)
    expect(d.g2a.equals(m.g2a)).toBe(true)
    expect(d.g3a.equals(m.g3a)).toBe(true)
    expect(d.pok2.c).toBe(m.pok2.c); expect(d.pok3.s).toBe(m.pok3.s)
  })
  it('msg2 round-trips (352 bytes)', () => {
    const m = { g2b: pt(), g3b: pt(), Pb: pt(), Qb: pt(),
      pokB2: { c: sc(), s: sc() }, pokB3: { c: sc(), s: sc() }, reprB: { c: sc(), sr: sc(), sy: sc() } }
    const b = encodeMsg2(m); expect(b.length).toBe(352)
    const d = decodeMsg2(b)
    expect(d.Qb.equals(m.Qb)).toBe(true)
    expect(d.reprB.sy).toBe(m.reprB.sy); expect(d.pokB2.c).toBe(m.pokB2.c)
  })
  it('msg3 round-trips (256 bytes)', () => {
    const m = { Pa: pt(), Qa: pt(), Ra: pt(), reprA: { c: sc(), sr: sc(), sy: sc() }, eqRa: { c: sc(), s: sc() } }
    const b = encodeMsg3(m); expect(b.length).toBe(256)
    const d = decodeMsg3(b)
    expect(d.Ra.equals(m.Ra)).toBe(true)
    expect(d.eqRa.s).toBe(m.eqRa.s); expect(d.reprA.sr).toBe(m.reprA.sr)
  })
  it('msg4 round-trips (96 bytes)', () => {
    const m = { Rb: pt(), eqRb: { c: sc(), s: sc() } }
    const b = encodeMsg4(m); expect(b.length).toBe(96)
    const d = decodeMsg4(b)
    expect(d.Rb.equals(m.Rb)).toBe(true); expect(d.eqRb.c).toBe(m.eqRb.c)
  })
  it('decoders reject wrong-length buffers', () => {
    expect(() => decodeMsg1(new Uint8Array(10))).toThrow()
    expect(() => decodeMsg2(new Uint8Array(10))).toThrow()
    expect(() => decodeMsg3(new Uint8Array(10))).toThrow()
    expect(() => decodeMsg4(new Uint8Array(10))).toThrow()
  })
})
