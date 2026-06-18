import { describe, it, expect } from 'vitest'
import { PRIVATE_EQUALITY_VERSION } from './index.js'

describe('private-equality', () => {
  it('exposes a version', () => {
    expect(PRIVATE_EQUALITY_VERSION).toBe('0.1.0')
  })
})
