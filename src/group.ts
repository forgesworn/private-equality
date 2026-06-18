import { ristretto255 } from '@noble/curves/ed25519.js'
import { sha512 } from '@noble/hashes/sha2.js'
import { randomBytes } from '@noble/hashes/utils.js'

const Point = ristretto255.Point

/** A Ristretto255 group element — the subset of operations this library uses. */
export interface Pt {
  multiply(scalar: bigint): Pt
  add(other: Pt): Pt
  subtract(other: Pt): Pt
  negate(): Pt
  equals(other: Pt): boolean
  toBytes(): Uint8Array
  is0(): boolean
}

/** The fixed generator g1. */
export const G: Pt = Point.BASE as unknown as Pt

/** The prime order of the scalar field. */
export const L: bigint = Point.Fn.ORDER

/** Reduce a (possibly negative) bigint into [0, L). */
export function mod(x: bigint): bigint {
  const r = x % L
  return r >= 0n ? r : r + L
}

/** Convert little-endian bytes to a bigint. */
function bytesToBigIntLE(bytes: Uint8Array): bigint {
  let n = 0n
  for (let i = bytes.length - 1; i >= 0; i--) n = (n << 8n) | BigInt(bytes[i])
  return n
}

/** A uniform non-zero scalar in [1, L). Wide reduction (64 bytes) avoids modulo bias. */
export function randomScalar(): bigint {
  for (;;) {
    const s = mod(bytesToBigIntLE(randomBytes(64)))
    if (s !== 0n) return s
  }
}

/** Hash arbitrary byte parts to a scalar in [0, L) via SHA-512 wide reduction. */
export function hashToScalar(...parts: Uint8Array[]): bigint {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const buf = new Uint8Array(total)
  let o = 0
  for (const p of parts) { buf.set(p, o); o += p.length }
  return mod(bytesToBigIntLE(sha512(buf)))
}

/** Encode a point to its canonical 32-byte form. */
export function encodePoint(p: Pt): Uint8Array {
  return p.toBytes()
}

/** Decode a 32-byte point; throws on a non-canonical / invalid encoding. */
export function decodePoint(bytes: Uint8Array): Pt {
  return Point.fromBytes(bytes) as unknown as Pt
}

/** Encode a scalar to a fixed 32-byte little-endian form. */
export function encodeScalar(s: bigint): Uint8Array {
  const out = new Uint8Array(32)
  let n = mod(s)
  for (let i = 0; i < 32; i++) { out[i] = Number(n & 0xffn); n >>= 8n }
  return out
}

/** Decode a 32-byte little-endian scalar, reduced mod L. */
export function decodeScalar(bytes: Uint8Array): bigint {
  return mod(bytesToBigIntLE(bytes))
}
