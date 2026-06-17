import { mod, randomScalar, hashToScalar, encodePoint, encodeScalar, G, type Pt } from './group.js'

/** Schnorr proof of knowledge of x s.t. X = base^x. */
export interface PoK { c: bigint; s: bigint }

const DOM_POK = new TextEncoder().encode('private-equality/pok-v1')

function challengePoK(base: Pt, X: Pt, T: Pt, bindingHash: Uint8Array, tag: number): bigint {
  return hashToScalar(DOM_POK, bindingHash, new Uint8Array([tag]), encodePoint(base), encodePoint(X), encodePoint(T))
}

/** Prove knowledge of `x` such that `X = base^x`. `tag` separates distinct proofs in one session. */
export function provePoK(base: Pt, x: bigint, X: Pt, bindingHash: Uint8Array, tag: number): PoK {
  const r = randomScalar()
  const T = base.multiply(r)
  const c = challengePoK(base, X, T, bindingHash, tag)
  const s = mod(r + c * x)
  return { c, s }
}

/** Verify a PoK. Total — returns false on any inconsistency, never throws. */
export function verifyPoK(base: Pt, X: Pt, proof: PoK, bindingHash: Uint8Array, tag: number): boolean {
  try {
    // T' = base^s · X^{-c}
    const T = base.multiply(proof.s).add(X.multiply(proof.c).negate())
    return challengePoK(base, X, T, bindingHash, tag) === proof.c
  } catch {
    return false
  }
}

// (Helpers re-exported for sibling proofs.)
export { mod, encodeScalar, G }
