import type { World } from '@/lib/particleFilter'

/**
 * A 12-cell ring corridor with an irregular door pattern (so the sensor
 * sequence is locally distinctive enough to localize). The robot drives one
 * cell per step and senses door / no-door.
 */
export const CORRIDOR: World = {
  size: 12,
  doors: [false, true, false, false, true, true, false, false, true, false, false, false],
}

export const MOTION = { step: 1, pExact: 0.9 }
export const P_HIT = 0.9
/** Fixed seed so a fresh run always replays identically. */
export const SEED = 42
