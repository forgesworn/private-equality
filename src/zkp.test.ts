import { describe, it, expect } from 'vitest'
import { G, randomScalar, mod } from './group.js'
import { provePoK, verifyPoK } from './zkp.js'

const bh = new Uint8Array(32).fill(7) // a fixed bindingHash for tests

describe('zkp: proof of knowledge of discrete log', () => {
  it('a valid proof verifies', () => {
    const x = randomScalar()
    const X = G.multiply(x)
    const proof = provePoK(G, x, X, bh, 1)
    expect(verifyPoK(G, X, proof, bh, 1)).toBe(true)
  })
  it('rejects a proof under the wrong statement', () => {
    const x = randomScalar()
    const X = G.multiply(x)
    const proof = provePoK(G, x, X, bh, 1)
    const wrongX = G.multiply(mod(x + 1n))
    expect(verifyPoK(G, wrongX, proof, bh, 1)).toBe(false)
  })
  it('rejects a tampered response', () => {
    const x = randomScalar()
    const X = G.multiply(x)
    const proof = provePoK(G, x, X, bh, 1)
    expect(verifyPoK(G, X, { c: proof.c, s: mod(proof.s + 1n) }, bh, 1)).toBe(false)
  })
  it('rejects a proof bound to a different session', () => {
    const x = randomScalar()
    const X = G.multiply(x)
    const proof = provePoK(G, x, X, bh, 1)
    const otherBinding = new Uint8Array(32).fill(9)
    expect(verifyPoK(G, X, proof, otherBinding, 1)).toBe(false)
  })
})
