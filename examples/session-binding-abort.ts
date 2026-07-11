// Plain SMP is MITM-able: a relay can ferry messages between two honest
// parties who each think they're talking to the other. This library binds
// every proof to the consumer's authenticated-channel transcript, so a
// cross-channel relay aborts. Here Alice and Bob hold the SAME secret but
// bind to DIFFERENT channel transcripts — the protocol must abort, not match.
import { initiate, respond, SmpError } from '../src/index.js'

const alice = initiate('shared-codeword', new TextEncoder().encode('channel-transcript-A'))
const bob = respond('shared-codeword', new TextEncoder().encode('channel-transcript-B'))

try {
  const s1 = bob.session.next(alice.first)
  const s2 = alice.session.next(s1.send!)
  bob.session.next(s2.send!)
  console.log('unexpected: protocol completed across mismatched channels')
  process.exit(1)
} catch (e) {
  if (e instanceof SmpError) {
    console.log('aborted as designed:', e.message)
  } else {
    throw e
  }
}
