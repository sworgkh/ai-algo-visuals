/**
 * 1-D Monte-Carlo localization (particle filter) on a ring corridor of cells,
 * some of which are "doors". A robot drives one cell per step (with slip) and
 * senses door / no-door (with error). The filter tracks a cloud of weighted
 * particles through predict → weight → resample. Pure and seedable so the
 * `particleFilter.test.ts` suite is deterministic.
 */

/** Deterministic RNG (mulberry32) — components seed it; tests pin the seed. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface World {
  size: number
  /** doors[i] = true if cell i is a door (an observable landmark). */
  doors: boolean[]
}

export interface Particle {
  pos: number
  weight: number
}

export interface MotionParams {
  /** Cells advanced per step (intended). */
  step: number
  /** P(move exactly `step`); the rest slips ±1 evenly. */
  pExact: number
}

/** Sample one motion outcome: `step` w.p. pExact, else step±1. Ring-wrapped. */
export function moveOne(pos: number, world: World, rng: () => number, m: MotionParams): number {
  const r = rng()
  const slip = r < m.pExact ? 0 : r < m.pExact + (1 - m.pExact) / 2 ? -1 : 1
  return (((pos + m.step + slip) % world.size) + world.size) % world.size
}

/** Advance every particle through the (noisy) motion model. */
export function predict(
  particles: Particle[],
  world: World,
  rng: () => number,
  m: MotionParams,
): Particle[] {
  return particles.map((p) => ({ pos: moveOne(p.pos, world, rng, m), weight: p.weight }))
}

/** P(observation | the cell at `pos`), given the sensor hit-rate. */
export function sensorLikelihood(world: World, pos: number, obs: boolean, pHit: number): number {
  const truth = world.doors[pos]
  return truth === obs ? pHit : 1 - pHit
}

/** Reweight particles by the sensor likelihood of `obs`, then normalize. */
export function weight(
  particles: Particle[],
  world: World,
  obs: boolean,
  pHit: number,
): Particle[] {
  const raw = particles.map((p) => ({
    pos: p.pos,
    weight: p.weight * sensorLikelihood(world, p.pos, obs, pHit),
  }))
  const total = raw.reduce((a, p) => a + p.weight, 0)
  if (total === 0) return particles.map((p) => ({ pos: p.pos, weight: 1 / particles.length }))
  return raw.map((p) => ({ pos: p.pos, weight: p.weight / total }))
}

/** Systematic resampling: N draws on a single random comb → low-variance. */
export function systematicResample(particles: Particle[], rng: () => number): Particle[] {
  const n = particles.length
  const cum: number[] = []
  let s = 0
  for (const p of particles) {
    s += p.weight
    cum.push(s)
  }
  const u0 = rng() / n
  const out: Particle[] = []
  let j = 0
  for (let i = 0; i < n; i++) {
    const u = u0 + i / n
    while (j < n - 1 && u > cum[j]) j++
    out.push({ pos: particles[j].pos, weight: 1 / n })
  }
  return out
}

export interface FilterStep {
  obs: boolean
  predicted: Particle[]
  weighted: Particle[]
  resampled: Particle[]
}

/** One full predict → weight → resample cycle. */
export function step(
  world: World,
  particles: Particle[],
  obs: boolean,
  rng: () => number,
  m: MotionParams,
  pHit: number,
): FilterStep {
  const predicted = predict(particles, world, rng, m)
  const weighted = weight(predicted, world, obs, pHit)
  const resampled = systematicResample(weighted, rng)
  return { obs, predicted, weighted, resampled }
}

/** Count particles per cell (for a belief histogram). */
export function histogram(particles: Particle[], size: number): number[] {
  const h = new Array(size).fill(0)
  for (const p of particles) h[p.pos] += 1
  return h
}

/** Weighted belief mass per cell (sums to ~1 when weights are normalized). */
export function beliefMass(particles: Particle[], size: number): number[] {
  const h = new Array(size).fill(0)
  for (const p of particles) h[p.pos] += p.weight
  return h
}

/** Maximum-a-posteriori cell estimate (argmax of the particle count). */
export function mapEstimate(particles: Particle[], size: number): number {
  const h = histogram(particles, size)
  let best = 0
  for (let i = 1; i < size; i++) if (h[i] > h[best]) best = i
  return best
}

/** Spawn `n` particles uniformly across the corridor. */
export function uniformParticles(n: number, size: number): Particle[] {
  return Array.from({ length: n }, (_, i) => ({ pos: Math.floor((i * size) / n), weight: 1 / n }))
}
