// Drive both sides of the protocol in-process. In production each Uint8Array
// travels over YOUR authenticated channel, and `binding` is that channel's
// transcript hash (e.g. the Noise handshake hash).
import { initiate, respond } from '../src/index.js'

function run(secretA: string, secretB: string): boolean {
  const binding = new TextEncoder().encode('example-transcript-hash')
  const alice = initiate(secretA, binding)
  const bob = respond(secretB, binding)

  const s1 = bob.session.next(alice.first) // { send: msg2 }
  const s2 = alice.session.next(s1.send!)  // { send: msg3 }
  const s3 = bob.session.next(s2.send!)    // { send: msg4, done: true, result }
  const s4 = alice.session.next(s3.send!)  // { done: true, result }

  if (!s3.done || !s4.done) throw new Error('protocol did not complete')
  if (s3.result.match !== s4.result.match) throw new Error('sides disagree')
  return s4.result.match
}

console.log('equal secrets   →', run('correct horse battery staple', 'correct horse battery staple'))
console.log('unequal secrets →', run('correct horse battery staple', 'incorrect donkey battery staple'))
