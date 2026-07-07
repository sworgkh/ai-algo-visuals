import { describe, expect, it } from 'vitest'
import { filter, predictAhead, smooth, viterbi } from './hmm'
import { NORAIN, RAIN, UMB, UMBRELLA_HMM } from '@/topics/topic06-temporal/domain'

const close = (a: number, b: number, d = 3) => expect(a).toBeCloseTo(b, d)

describe('HMM filtering — umbrella world', () => {
  const { steps } = filter(UMBRELLA_HMM, [UMB, UMB])

  it('predict then update: 0.5 → 0.818 → 0.883', () => {
    close(steps[0].predicted[RAIN], 0.5)
    close(steps[0].updated[RAIN], 0.818)
    close(steps[1].updated[RAIN], 0.883)
  })

  it('distributions are normalized', () => {
    for (const s of steps) close(s.updated[RAIN] + s.updated[NORAIN], 1)
  })
})

describe('prediction decays to the stationary distribution', () => {
  it('from certain rain, P(Rain) → 0.5', () => {
    const seq = predictAhead(UMBRELLA_HMM, { [RAIN]: 1, [NORAIN]: 0 }, 20)
    expect(seq[1][RAIN]).toBeCloseTo(0.7, 3) // one step
    close(seq[20][RAIN], 0.5)
  })
})

describe('forward–backward smoothing', () => {
  it('smoothed P(Rain₁ | u₁,u₂) = 0.883 (future evidence sharpens the past)', () => {
    const { filtered, smoothed } = smooth(UMBRELLA_HMM, [UMB, UMB])
    close(smoothed[0][RAIN], 0.883)
    // last step: no future evidence, so smoothed == filtered
    close(smoothed[1][RAIN], filtered[1][RAIN])
  })
})

describe('Viterbi', () => {
  it('most likely path for [U, U] is [Rain, Rain]', () => {
    expect(viterbi(UMBRELLA_HMM, [UMB, UMB]).path).toEqual([RAIN, RAIN])
  })
})
