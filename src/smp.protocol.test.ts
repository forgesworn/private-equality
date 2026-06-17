import { describe, it, expect } from 'vitest'
import { initiate, respond } from './smp.js'

/** Drive two sessions to completion in-process. Returns both results. */
function run(secretA: string, secretB: string, bindA = 'chan', bindB = bindA) {
  const A = initiate(secretA, new TextEncoder().encode(bindA))
  const B = respond(secretB, new TextEncoder().encode(bindB))
  let msg = A.first
  let aResult: boolean | undefined, bResult: boolean | undefined
  let bStep = B.session.next(msg)               // consumes msg1, sends msg2
  msg = (bStep as { send: Uint8Array }).send
  let aStep = A.session.next(msg)               // consumes msg2, sends msg3
  msg = (aStep as { send: Uint8Array }).send
  bStep = B.session.next(msg)                   // consumes msg3, sends msg4 + result
  if (bStep.done) bResult = bStep.result.match
  msg = (bStep as { send: Uint8Array }).send
  aStep = A.session.next(msg)                   // consumes msg4, result
  if (aStep.done) aResult = aStep.result.match
  return { aResult, bResult }
}

describe('smp protocol', () => {
  it('equal secrets → match on both sides', () => {
    expect(run('hunter2', 'hunter2')).toEqual({ aResult: true, bResult: true })
  })
  it('unequal secrets → no match on both sides', () => {
    expect(run('hunter2', 'swordfish')).toEqual({ aResult: false, bResult: false })
  })
})
