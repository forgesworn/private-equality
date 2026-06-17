import { describe, it, expect } from 'vitest'
import { G, randomScalar, mod } from './group.js'
import { provePoK, verifyPoK, proveRepr, verifyRepr, proveEqualLogs, verifyEqualLogs } from './zkp.js'

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

describe('zkp: representation proof', () => {
  it('verifies a well-formed (P, Q)', () => {
    const bP = G.multiply(randomScalar()), bQ1 = G.multiply(randomScalar()), bQ2 = G.multiply(randomScalar())
    const r = randomScalar(), y = randomScalar()
    const P = bP.multiply(r)
    const Q = bQ1.multiply(r).add(bQ2.multiply(y))
    const proof = proveRepr(bP, bQ1, bQ2, r, y, P, Q, bh, 5)
    expect(verifyRepr(bP, bQ1, bQ2, P, Q, proof, bh, 5)).toBe(true)
  })
  it('rejects a forged Q', () => {
    const bP = G.multiply(randomScalar()), bQ1 = G.multiply(randomScalar()), bQ2 = G.multiply(randomScalar())
    const r = randomScalar(), y = randomScalar()
    const P = bP.multiply(r)
    const Q = bQ1.multiply(r).add(bQ2.multiply(y))
    const proof = proveRepr(bP, bQ1, bQ2, r, y, P, Q, bh, 5)
    const badQ = Q.add(bQ2) // off by one in y
    expect(verifyRepr(bP, bQ1, bQ2, P, badQ, proof, bh, 5)).toBe(false)
  })
})

describe('zkp: equality of two discrete logs', () => {
  it('verifies equal exponents across two bases', () => {
    const base1 = G.multiply(randomScalar()), base2 = G.multiply(randomScalar())
    const x = randomScalar()
    const X1 = base1.multiply(x), X2 = base2.multiply(x)
    const proof = proveEqualLogs(base1, base2, x, X1, X2, bh, 7)
    expect(verifyEqualLogs(base1, base2, X1, X2, proof, bh, 7)).toBe(true)
  })
  it('rejects unequal exponents', () => {
    const base1 = G.multiply(randomScalar()), base2 = G.multiply(randomScalar())
    const x = randomScalar()
    const X1 = base1.multiply(x), X2 = base2.multiply(mod(x + 1n))
    const proof = proveEqualLogs(base1, base2, x, X1, X2, bh, 7)
    expect(verifyEqualLogs(base1, base2, X1, X2, proof, bh, 7)).toBe(false)
  })
})
