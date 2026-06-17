import { describe, it, expect } from 'vitest'
import { G, L, randomScalar, mod, hashToScalar, encodePoint, decodePoint } from './group.js'

describe('group', () => {
  it('scalar multiplication is consistent with repeated addition', () => {
    expect(G.multiply(2n).equals(G.add(G))).toBe(true)
  })
  it('randomScalar is in [1, L)', () => {
    for (let i = 0; i < 50; i++) {
      const s = randomScalar()
      expect(s > 0n && s < L).toBe(true)
    }
  })
  it('mod reduces into [0, L)', () => {
    expect(mod(L + 5n)).toBe(5n)
    expect(mod(-1n)).toBe(L - 1n)
  })
  it('point encode/decode round-trips (32 bytes)', () => {
    const p = G.multiply(randomScalar())
    const b = encodePoint(p)
    expect(b.length).toBe(32)
    expect(decodePoint(b).equals(p)).toBe(true)
  })
  it('hashToScalar is deterministic and reduced', () => {
    const a = hashToScalar(new Uint8Array([1, 2, 3]))
    const b = hashToScalar(new Uint8Array([1, 2, 3]))
    expect(a).toBe(b)
    expect(a < L && a >= 0n).toBe(true)
  })
  it('decodePoint rejects garbage', () => {
    expect(() => decodePoint(new Uint8Array(32))).not.toThrow() // all-zero is the identity, valid
    expect(() => decodePoint(new Uint8Array([255, ...new Array(31).fill(255)]))).toThrow()
  })
})
