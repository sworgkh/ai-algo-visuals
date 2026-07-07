import { describe, expect, it } from 'vitest'
import { computeSchedule, topoOrder } from './cpm'
import type { CpmTask } from './cpm'
import { CAR_ASSEMBLY } from '@/topics/topic03-real-world-planning/domain'

describe('CPM — AIMA car-assembly', () => {
  const s = computeSchedule(CAR_ASSEMBLY)

  it('project duration is 85', () => {
    expect(s.projectDuration).toBe(85)
  })

  it('forward pass (ES/EF) matches the textbook', () => {
    expect(s.tasks.AE1).toMatchObject({ es: 0, ef: 30 })
    expect(s.tasks.AE2).toMatchObject({ es: 0, ef: 60 })
    expect(s.tasks.AW1).toMatchObject({ es: 30, ef: 60 })
    expect(s.tasks.AW2).toMatchObject({ es: 60, ef: 75 })
    expect(s.tasks.INS).toMatchObject({ es: 75, ef: 85 })
  })

  it('backward pass (LS/LF) and slack match the textbook', () => {
    expect(s.tasks.AE1).toMatchObject({ ls: 15, lf: 45, slack: 15 })
    expect(s.tasks.AW1).toMatchObject({ ls: 45, lf: 75, slack: 15 })
    expect(s.tasks.AE2).toMatchObject({ ls: 0, lf: 60, slack: 0 })
    expect(s.tasks.AW2).toMatchObject({ ls: 60, lf: 75, slack: 0 })
    expect(s.tasks.INS).toMatchObject({ ls: 75, lf: 85, slack: 0 })
  })

  it('critical path is AddEngine2 → AddWheels2 → Inspect', () => {
    expect(s.criticalPath).toEqual(['AE2', 'AW2', 'INS'])
  })
})

describe('CPM — edge cases', () => {
  it('detects cycles', () => {
    const cyclic: CpmTask[] = [
      { id: 'A', label: 'A', duration: 1, deps: ['B'] },
      { id: 'B', label: 'B', duration: 1, deps: ['A'] },
    ]
    expect(topoOrder(cyclic)).toBeNull()
    expect(() => computeSchedule(cyclic)).toThrow()
  })

  it('a linear chain is entirely critical', () => {
    const chain: CpmTask[] = [
      { id: 'A', label: 'A', duration: 2, deps: [] },
      { id: 'B', label: 'B', duration: 3, deps: ['A'] },
      { id: 'C', label: 'C', duration: 4, deps: ['B'] },
    ]
    const s2 = computeSchedule(chain)
    expect(s2.projectDuration).toBe(9)
    expect(s2.criticalPath).toEqual(['A', 'B', 'C'])
    expect(Object.values(s2.tasks).every((t) => t.slack === 0)).toBe(true)
  })
})
