import { useState } from 'react'

type Nums = Record<string, number>

function numsEqual(a: Nums, b: Nums, eps = 1e-9): boolean {
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  for (const k of keys) if (Math.abs(a[k] - (b[k] ?? NaN)) > eps) return false
  return true
}

function diffKeys(prev: Nums, next: Nums, eps = 1e-9): Set<string> {
  const out = new Set<string>()
  for (const k of Object.keys(next)) {
    if (Math.abs(next[k] - (prev[k] ?? next[k])) > eps) out.add(k)
  }
  return out
}

/**
 * Given a map of named numbers, returns the set of keys whose values changed
 * since the previous render (empty on first render). Uses React's "adjust
 * state during render" pattern — no refs, no effects.
 */
export function useChangedKeys(nums: Nums): Set<string> {
  const [prev, setPrev] = useState<Nums | null>(null)
  const [hot, setHot] = useState<Set<string>>(() => new Set())
  if (prev === null || !numsEqual(prev, nums)) {
    setPrev(nums)
    setHot(prev === null ? new Set() : diffKeys(prev, nums))
  }
  return hot
}
