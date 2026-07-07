import type { CpmTask } from '@/lib/cpm'

/**
 * Canonical AIMA car-assembly scheduling problem.
 *   AddEngine1(30) ≺ AddWheels1(30) ≺ Inspect(10)
 *   AddEngine2(60) ≺ AddWheels2(15) ≺ Inspect(10)
 * Critical path: AddEngine2 → AddWheels2 → Inspect (duration 85); the AddEngine1
 * / AddWheels1 branch has 15 units of slack.
 */
export const CAR_ASSEMBLY: CpmTask[] = [
  { id: 'AE1', label: 'AddEngine1', duration: 30, deps: [] },
  { id: 'AE2', label: 'AddEngine2', duration: 60, deps: [] },
  { id: 'AW1', label: 'AddWheels1', duration: 30, deps: ['AE1'] },
  { id: 'AW2', label: 'AddWheels2', duration: 15, deps: ['AE2'] },
  { id: 'INS', label: 'Inspect', duration: 10, deps: ['AW1', 'AW2'] },
]

// ---------------------------------------------------------------------------
// HTN — hierarchical decomposition (AIMA "go to the airport")
// ---------------------------------------------------------------------------

export interface HtnRefinement {
  name: string
  /** Ordered step ids (each is another HtnNode: HLA or primitive). */
  steps: string[]
}

export interface HtnNode {
  id: string
  label: string
  sub?: string
  primitive: boolean
  /** Alternative ways to decompose an HLA (empty for primitives). */
  refinements?: HtnRefinement[]
}

export const HTN_ROOT = 'Go'

export const HTN_NODES: Record<string, HtnNode> = {
  Go: {
    id: 'Go',
    label: 'Go(Home, SFO)',
    sub: 'high-level action',
    primitive: false,
    refinements: [
      { name: 'Drive & shuttle', steps: ['Drive', 'Shuttle'] },
      { name: 'Take a taxi', steps: ['Taxi'] },
    ],
  },
  Drive: {
    id: 'Drive',
    label: 'Drive(Home, LongTermParking)',
    sub: 'primitive',
    primitive: true,
  },
  Shuttle: {
    id: 'Shuttle',
    label: 'Shuttle(LongTermParking, SFO)',
    sub: 'primitive',
    primitive: true,
  },
  Taxi: { id: 'Taxi', label: 'Taxi(Home, SFO)', sub: 'primitive', primitive: true },
}

// ---------------------------------------------------------------------------
// Resources — reusable vs consumable
// ---------------------------------------------------------------------------

export interface ResourceOp {
  name: string
  /** Units of the consumable used (never returned). */
  bolts: number
}

/** Reusable resource: a welding robot (1 unit) — busy during an op, then freed
 *  and available again. Consumable: bolts — spent and never returned. */
export const REUSABLE_CAPACITY = 1
export const CONSUMABLE_START = 40
export const RESOURCE_OPS: ResourceOp[] = [
  { name: 'Weld chassis', bolts: 8 },
  { name: 'Attach door', bolts: 12 },
  { name: 'Mount wheels', bolts: 16 },
  { name: 'Final check', bolts: 0 },
]
