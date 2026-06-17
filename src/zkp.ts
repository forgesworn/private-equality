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

/** Proof of knowledge of (r, y) s.t. P = bP^r and Q = bQ1^r · bQ2^y. */
export interface Repr { c: bigint; sr: bigint; sy: bigint }

const DOM_REPR = new TextEncoder().encode('private-equality/repr-v1')

function challengeRepr(
  bP: Pt, bQ1: Pt, bQ2: Pt, P: Pt, Q: Pt, tP: Pt, tQ: Pt, bindingHash: Uint8Array, tag: number,
): bigint {
  return hashToScalar(
    DOM_REPR, bindingHash, new Uint8Array([tag]),
    encodePoint(bP), encodePoint(bQ1), encodePoint(bQ2),
    encodePoint(P), encodePoint(Q), encodePoint(tP), encodePoint(tQ),
  )
}

export function proveRepr(
  bP: Pt, bQ1: Pt, bQ2: Pt, r: bigint, y: bigint, P: Pt, Q: Pt, bindingHash: Uint8Array, tag: number,
): Repr {
  const rho = randomScalar(), sigma = randomScalar()
  const tP = bP.multiply(rho)
  const tQ = bQ1.multiply(rho).add(bQ2.multiply(sigma))
  const c = challengeRepr(bP, bQ1, bQ2, P, Q, tP, tQ, bindingHash, tag)
  return { c, sr: mod(rho + c * r), sy: mod(sigma + c * y) }
}

export function verifyRepr(
  bP: Pt, bQ1: Pt, bQ2: Pt, P: Pt, Q: Pt, proof: Repr, bindingHash: Uint8Array, tag: number,
): boolean {
  try {
    // tP' = bP^{sr} · P^{-c}; tQ' = bQ1^{sr} · bQ2^{sy} · Q^{-c}
    const tP = bP.multiply(proof.sr).add(P.multiply(proof.c).negate())
    const tQ = bQ1.multiply(proof.sr).add(bQ2.multiply(proof.sy)).add(Q.multiply(proof.c).negate())
    return challengeRepr(bP, bQ1, bQ2, P, Q, tP, tQ, bindingHash, tag) === proof.c
  } catch {
    return false
  }
}

// (Helpers re-exported for sibling proofs.)
export { mod, encodeScalar, G }
