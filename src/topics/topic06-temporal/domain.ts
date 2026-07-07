import type { HMM } from '@/lib/hmm'

/**
 * The AIMA umbrella world. Hidden: Rain / NoRain. Evidence: the director carries
 * an umbrella (U) or not (¬U).
 *   Transition: P(rain | rain)=0.7, P(rain | ¬rain)=0.3
 *   Sensor:     P(U | rain)=0.9,   P(U | ¬rain)=0.2
 * Filtering with u=T,T gives P(Rain) = 0.5 → 0.818 → 0.883.
 */
export const RAIN = 'Rain'
export const NORAIN = 'NoRain'
export const UMB = 'U'
export const NOUMB = '¬U'

export const UMBRELLA_HMM: HMM = {
  states: [RAIN, NORAIN],
  prior: { [RAIN]: 0.5, [NORAIN]: 0.5 },
  trans: {
    [RAIN]: { [RAIN]: 0.7, [NORAIN]: 0.3 },
    [NORAIN]: { [RAIN]: 0.3, [NORAIN]: 0.7 },
  },
  sensor: {
    [RAIN]: { [UMB]: 0.9, [NOUMB]: 0.1 },
    [NORAIN]: { [UMB]: 0.2, [NOUMB]: 0.8 },
  },
}

export const STATE_LABEL: Record<string, string> = { [RAIN]: 'Rain', [NORAIN]: 'No rain' }
export const OBS_LABEL: Record<string, string> = { [UMB]: 'umbrella', [NOUMB]: 'no umbrella' }

/** Default observed sequence (classic 0.818 → 0.883, then a dry day). */
export const DEFAULT_OBS = [UMB, UMB, NOUMB]
