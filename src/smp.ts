import { encodePoint, decodePoint, encodeScalar, decodeScalar, G, randomScalar, hashToScalar, type Pt } from './group.js'
import type { PoK, Repr, EqualLogs } from './zkp.js'
import { provePoK, verifyPoK, proveRepr, verifyRepr, proveEqualLogs, verifyEqualLogs } from './zkp.js'
import { SmpError } from './types.js'
import type { Secret, SmpSession, SmpStep } from './types.js'
import { sha256 } from '@noble/hashes/sha2.js'

// --- fixed-layout buffer writer/reader ---
class Writer {
  private parts: Uint8Array[] = []
  point(p: Pt) { this.parts.push(encodePoint(p)); return this }
  scalar(s: bigint) { this.parts.push(encodeScalar(s)); return this }
  bytes(): Uint8Array {
    const total = this.parts.reduce((n, p) => n + p.length, 0)
    const out = new Uint8Array(total); let o = 0
    for (const p of this.parts) { out.set(p, o); o += p.length }
    return out
  }
}

class Reader {
  private o = 0
  constructor(private buf: Uint8Array, expectedLen: number) {
    if (buf.length !== expectedLen) throw new SmpError(`bad message length: ${buf.length}, expected ${expectedLen}`)
  }
  point(): Pt { const p = decodePoint(this.buf.subarray(this.o, this.o + 32)); this.o += 32; return p }
  scalar(): bigint { const s = decodeScalar(this.buf.subarray(this.o, this.o + 32)); this.o += 32; return s }
}

export interface Msg1 { g2a: Pt; g3a: Pt; pok2: PoK; pok3: PoK }
export interface Msg2 { g2b: Pt; g3b: Pt; Pb: Pt; Qb: Pt; pokB2: PoK; pokB3: PoK; reprB: Repr }
export interface Msg3 { Pa: Pt; Qa: Pt; Ra: Pt; reprA: Repr; eqRa: EqualLogs }
export interface Msg4 { Rb: Pt; eqRb: EqualLogs }

// msg1: g2a, g3a, pok2{c,s}, pok3{c,s} → 2 points + 4 scalars = 192 B
export function encodeMsg1(m: Msg1): Uint8Array {
  return new Writer().point(m.g2a).point(m.g3a)
    .scalar(m.pok2.c).scalar(m.pok2.s).scalar(m.pok3.c).scalar(m.pok3.s).bytes()
}
export function decodeMsg1(b: Uint8Array): Msg1 {
  const r = new Reader(b, 192)
  const g2a = r.point(), g3a = r.point()
  const pok2 = { c: r.scalar(), s: r.scalar() }, pok3 = { c: r.scalar(), s: r.scalar() }
  return { g2a, g3a, pok2, pok3 }
}

// msg2: g2b, g3b, Pb, Qb, pokB2{c,s}, pokB3{c,s}, reprB{c,sr,sy} → 4 points + 7 scalars = 352 B
export function encodeMsg2(m: Msg2): Uint8Array {
  return new Writer().point(m.g2b).point(m.g3b).point(m.Pb).point(m.Qb)
    .scalar(m.pokB2.c).scalar(m.pokB2.s).scalar(m.pokB3.c).scalar(m.pokB3.s)
    .scalar(m.reprB.c).scalar(m.reprB.sr).scalar(m.reprB.sy).bytes()
}
export function decodeMsg2(b: Uint8Array): Msg2 {
  const r = new Reader(b, 352)
  const g2b = r.point(), g3b = r.point(), Pb = r.point(), Qb = r.point()
  const pokB2 = { c: r.scalar(), s: r.scalar() }
  const pokB3 = { c: r.scalar(), s: r.scalar() }
  const reprB = { c: r.scalar(), sr: r.scalar(), sy: r.scalar() }
  return { g2b, g3b, Pb, Qb, pokB2, pokB3, reprB }
}

// msg3: Pa, Qa, Ra, reprA{c,sr,sy}, eqRa{c,s} → 3 points + 5 scalars = 256 B
export function encodeMsg3(m: Msg3): Uint8Array {
  return new Writer().point(m.Pa).point(m.Qa).point(m.Ra)
    .scalar(m.reprA.c).scalar(m.reprA.sr).scalar(m.reprA.sy)
    .scalar(m.eqRa.c).scalar(m.eqRa.s).bytes()
}
export function decodeMsg3(b: Uint8Array): Msg3 {
  const r = new Reader(b, 256)
  const Pa = r.point(), Qa = r.point(), Ra = r.point()
  const reprA = { c: r.scalar(), sr: r.scalar(), sy: r.scalar() }
  const eqRa = { c: r.scalar(), s: r.scalar() }
  return { Pa, Qa, Ra, reprA, eqRa }
}

// msg4: Rb, eqRb{c,s} → 1 point + 2 scalars = 96 B
export function encodeMsg4(m: Msg4): Uint8Array {
  return new Writer().point(m.Rb).scalar(m.eqRb.c).scalar(m.eqRb.s).bytes()
}
export function decodeMsg4(b: Uint8Array): Msg4 {
  const r = new Reader(b, 96)
  const Rb = r.point()
  const eqRb = { c: r.scalar(), s: r.scalar() }
  return { Rb, eqRb }
}

const DOM_SECRET = new TextEncoder().encode('private-equality/secret-v1')

function secretToScalar(secret: Secret): bigint {
  const bytes = typeof secret === 'string' ? new TextEncoder().encode(secret) : secret
  return hashToScalar(DOM_SECRET, bytes)
}
function toBindingHash(sessionBinding: Uint8Array): Uint8Array {
  return sha256(sessionBinding) // fixed 32 bytes for unambiguous transcripts
}

/** Begin as the initiator (secret x). Returns the session and the first message to send. */
export function initiate(secret: Secret, sessionBinding: Uint8Array): { session: SmpSession; first: Uint8Array } {
  const x = secretToScalar(secret)
  const bh = toBindingHash(sessionBinding)
  const a2 = randomScalar(), a3 = randomScalar()
  const g2a = G.multiply(a2), g3a = G.multiply(a3)
  const first = encodeMsg1({ g2a, g3a, pok2: provePoK(G, a2, g2a, bh, 1), pok3: provePoK(G, a3, g3a, bh, 2) })

  let g3b!: Pt, Pa!: Pt, Pb!: Pt, QaQb!: Pt
  let state: 'await2' | 'await4' | 'done' = 'await2'

  const session: SmpSession = {
    next(incoming: Uint8Array): SmpStep {
      try {
        if (state === 'await2') {
          const m = decodeMsg2(incoming)
          if (!verifyPoK(G, m.g2b, m.pokB2, bh, 3)) throw new SmpError('bad g2b proof')
          if (!verifyPoK(G, m.g3b, m.pokB3, bh, 4)) throw new SmpError('bad g3b proof')
          g3b = m.g3b
          const g2 = m.g2b.multiply(a2)
          const g3 = m.g3b.multiply(a3)
          if (!verifyRepr(g3, G, g2, m.Pb, m.Qb, m.reprB, bh, 5)) throw new SmpError('bad Pb/Qb proof')
          Pb = m.Pb
          const s = randomScalar()
          Pa = g3.multiply(s)
          const Qa = G.multiply(s).add(g2.multiply(x))
          const reprA = proveRepr(g3, G, g2, s, x, Pa, Qa, bh, 6)
          QaQb = Qa.add(m.Qb.negate())
          const Ra = QaQb.multiply(a3)
          const eqRa = proveEqualLogs(G, QaQb, a3, g3a, Ra, bh, 7)
          state = 'await4'
          return { send: encodeMsg3({ Pa, Qa, Ra, reprA, eqRa }) }
        }
        if (state === 'await4') {
          const m = decodeMsg4(incoming)
          if (!verifyEqualLogs(G, QaQb, g3b, m.Rb, m.eqRb, bh, 8)) throw new SmpError('bad Rb proof')
          const Rab = m.Rb.multiply(a3)
          const match = Rab.equals(Pa.add(Pb.negate()))
          state = 'done'
          return { done: true, result: { match } }
        }
        throw new SmpError('protocol already complete')
      } catch (e) {
        if (e instanceof SmpError) throw e
        throw new SmpError('malformed message')
      }
    },
  }
  return { session, first }
}

/** Begin as the responder (secret y). No message until the first incoming one. */
export function respond(secret: Secret, sessionBinding: Uint8Array): { session: SmpSession } {
  const y = secretToScalar(secret)
  const bh = toBindingHash(sessionBinding)
  const b2 = randomScalar(), b3 = randomScalar()

  let g3a!: Pt, g3b!: Pt, g2!: Pt, g3!: Pt, Pb!: Pt, Qb!: Pt
  let state: 'await1' | 'await3' | 'done' = 'await1'

  const session: SmpSession = {
    next(incoming: Uint8Array): SmpStep {
      try {
        if (state === 'await1') {
          const m = decodeMsg1(incoming)
          if (!verifyPoK(G, m.g2a, m.pok2, bh, 1)) throw new SmpError('bad g2a proof')
          if (!verifyPoK(G, m.g3a, m.pok3, bh, 2)) throw new SmpError('bad g3a proof')
          g3a = m.g3a
          const g2b = G.multiply(b2)
          g3b = G.multiply(b3)
          g2 = m.g2a.multiply(b2)
          g3 = m.g3a.multiply(b3)
          const r = randomScalar()
          Pb = g3.multiply(r)
          Qb = G.multiply(r).add(g2.multiply(y))
          const reprB = proveRepr(g3, G, g2, r, y, Pb, Qb, bh, 5)
          state = 'await3'
          return { send: encodeMsg2({
            g2b, g3b, Pb, Qb,
            pokB2: provePoK(G, b2, g2b, bh, 3),
            pokB3: provePoK(G, b3, g3b, bh, 4),
            reprB,
          }) }
        }
        if (state === 'await3') {
          const m = decodeMsg3(incoming)
          if (!verifyRepr(g3, G, g2, m.Pa, m.Qa, m.reprA, bh, 6)) throw new SmpError('bad Pa/Qa proof')
          const QaQb = m.Qa.add(Qb.negate())
          if (!verifyEqualLogs(G, QaQb, g3a, m.Ra, m.eqRa, bh, 7)) throw new SmpError('bad Ra proof')
          const Rb = QaQb.multiply(b3)
          const eqRb = proveEqualLogs(G, QaQb, b3, g3b, Rb, bh, 8)
          const Rab = m.Ra.multiply(b3)
          const match = Rab.equals(m.Pa.add(Pb.negate()))
          state = 'done'
          return { send: encodeMsg4({ Rb, eqRb }), done: true, result: { match } }
        }
        throw new SmpError('protocol already complete')
      } catch (e) {
        if (e instanceof SmpError) throw e
        throw new SmpError('malformed message')
      }
    },
  }
  return { session }
}
