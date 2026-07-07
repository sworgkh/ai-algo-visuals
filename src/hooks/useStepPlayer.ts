import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Drives a step-through visualization: current step index + play/pause/speed.
 * A hook (not a global store) so multiple independent players can coexist on a
 * page. Pair with the <StepPlayer> presentational component.
 */

export interface StepPlayerOptions {
  /** Playback speed multiplier (1 = one step per BASE_MS). */
  initialSpeed?: number
  /** Restart from 0 after the last step instead of stopping. */
  loop?: boolean
  /** Step to start on (clamped). Useful for deep-linking. */
  initialIndex?: number
}

export interface StepPlayerApi {
  index: number
  numSteps: number
  isPlaying: boolean
  speed: number
  isFirst: boolean
  isLast: boolean
  next: () => void
  prev: () => void
  goTo: (i: number) => void
  play: () => void
  pause: () => void
  toggle: () => void
  reset: () => void
  setSpeed: (s: number) => void
}

/** Base autoplay interval at speed = 1. */
const BASE_MS = 950

export function useStepPlayer(
  numSteps: number,
  { initialSpeed = 1, loop = false, initialIndex = 0 }: StepPlayerOptions = {},
): StepPlayerApi {
  const [rawIndex, setIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, numSteps - 1))),
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(initialSpeed)

  const last = Math.max(0, numSteps - 1)
  // Clamp on read so a shrunk step count can't leave us past the end.
  const index = Math.min(rawIndex, last)

  const goTo = useCallback(
    (i: number) => setIndex(Math.max(0, Math.min(i, last))),
    [last],
  )
  const next = useCallback(() => setIndex((i) => Math.min(i + 1, last)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])
  const play = useCallback(() => {
    // Restart from the beginning if we're parked on the last step.
    setIndex((i) => (i >= last ? 0 : i))
    setIsPlaying(true)
  }, [last])
  const pause = useCallback(() => setIsPlaying(false), [])
  const toggle = useCallback(() => {
    setIsPlaying((p) => {
      if (!p) setIndex((i) => (i >= last ? 0 : i))
      return !p
    })
  }, [last])
  const reset = useCallback(() => {
    setIsPlaying(false)
    setIndex(0)
  }, [])

  // Autoplay loop — reschedules whenever index/speed changes while playing.
  useEffect(() => {
    if (!isPlaying) return
    const ms = BASE_MS / Math.max(0.25, speed)
    const id = window.setTimeout(() => {
      if (index >= last) {
        if (loop) setIndex(0)
        else setIsPlaying(false)
      } else {
        setIndex(index + 1)
      }
    }, ms)
    return () => window.clearTimeout(id)
  }, [isPlaying, index, speed, last, loop])

  return useMemo(
    () => ({
      index,
      numSteps,
      isPlaying,
      speed,
      isFirst: index <= 0,
      isLast: index >= last,
      next,
      prev,
      goTo,
      play,
      pause,
      toggle,
      reset,
      setSpeed,
    }),
    [index, numSteps, isPlaying, speed, last, next, prev, goTo, play, pause, toggle, reset],
  )
}
