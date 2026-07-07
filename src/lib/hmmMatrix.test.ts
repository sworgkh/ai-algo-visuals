import { describe, expect, it } from 'vitest'
import { filter, smooth, viterbi } from './hmm'
import {
  blowup,
  matrixFilter,
  matrixSmooth,
  matrixViterbi,
  observationMatrix,
  transitionMatrix,
  transpose,
} from './hmmMatrix'
import { UMBRELLA_HMM, UMB, NOUMB } from '@/topics/topic06-temporal/domain'

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6)
const OBS = [UMB, UMB, NOUMB]

describe('matrix construction', () => {
  it('builds the umbrella transition matrix in state order [Rain, NoRain]', () => {
    expect(transitionMatrix(UMBRELLA_HMM)).toEqual([
      [0.7, 0.3],
      [0.3, 0.7],
    ])
  })

  it('builds a diagonal observation matrix', () => {
    expect(observationMatrix(UMBRELLA_HMM, UMB)).toEqual([
      [0.9, 0],
      [0, 0.2],
    ])
    expect(observationMatrix(UMBRELLA_HMM, NOUMB)).toEqual([
      [0.1, 0],
      [0, 0.8],
    ])
  })

  it('transpose is its own inverse', () => {
    const T = transitionMatrix(UMBRELLA_HMM)
    expect(transpose(transpose(T))).toEqual(T)
  })
})

describe('matrix filtering matches the recursion form', () => {
  it('reproduces 0.818 then 0.883 on u=T,T', () => {
    const m = matrixFilter(UMBRELLA_HMM, [UMB, UMB])
    close(m.steps[0].updated[0], 0.8181818)
    close(m.steps[1].updated[0], 0.8833570)
  })

  it('agrees with hmm.ts filter step-by-step', () => {
    const rec = filter(UMBRELLA_HMM, OBS)
    const mat = matrixFilter(UMBRELLA_HMM, OBS)
    rec.steps.forEach((s, t) => {
      close(mat.steps[t].predicted[0], s.predicted.Rain)
      close(mat.steps[t].updated[0], s.updated.Rain)
    })
  })
})

describe('matrix smoothing matches the recursion form', () => {
  it('agrees with hmm.ts smooth', () => {
    const rec = smooth(UMBRELLA_HMM, OBS)
    const mat = matrixSmooth(UMBRELLA_HMM, OBS)
    rec.smoothed.forEach((s, t) => close(mat.smoothed[t][0], s.Rain))
  })
})

describe('matrix Viterbi matches the recursion form', () => {
  it('gives [Rain, Rain] on two umbrella days', () => {
    expect(matrixViterbi(UMBRELLA_HMM, [UMB, UMB]).path).toEqual(['Rain', 'Rain'])
  })

  it('agrees with hmm.ts viterbi path on the full sequence', () => {
    expect(matrixViterbi(UMBRELLA_HMM, OBS).path).toEqual(viterbi(UMBRELLA_HMM, OBS).path)
  })
})

describe('mega-variable blowup', () => {
  it('flattens k boolean vars into a 2^k mega-variable', () => {
    expect(blowup(1)).toEqual({ vars: 1, states: 2, cells: 4, freeParams: 2 })
    expect(blowup(3)).toEqual({ vars: 3, states: 8, cells: 64, freeParams: 56 })
    expect(blowup(5)).toEqual({ vars: 5, states: 32, cells: 1024, freeParams: 992 })
  })
})
