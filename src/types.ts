export const PRIVATE_EQUALITY_VERSION = '0.1.0'

/** The secret to compare. Hashed to a scalar internally; equal secrets → match. */
export type Secret = Uint8Array | string

/** The one bit the protocol reveals. */
export interface SmpResult { match: boolean }

/** The result of advancing the protocol one step. */
export type SmpStep =
  | { send: Uint8Array; done?: false }                   // intermediate: emit and continue
  | { send?: Uint8Array; done: true; result: SmpResult } // terminal: optionally emit a final message, plus the bit

export interface SmpSession {
  /** Feed an incoming peer message; returns the next step. Throws SmpError on a bad proof or abort. */
  next(incoming: Uint8Array): SmpStep
}

/** Thrown on an invalid proof, malformed message, wrong-state call, or relay/binding mismatch. */
export class SmpError extends Error {
  constructor(message: string) { super(message); this.name = 'SmpError' }
}
