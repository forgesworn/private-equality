import { encodePoint, decodePoint, encodeScalar, decodeScalar, type Pt } from './group.js'
import type { PoK, Repr, EqualLogs } from './zkp.js'
import { SmpError } from './types.js'

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
