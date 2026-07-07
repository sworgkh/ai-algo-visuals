/**
 * Topic 7 reuses the exact umbrella HMM from Topic 6 — the whole point is to
 * show the *same* model as matrix machinery. Re-exported here so the matrix
 * views have one canonical source and can't drift from the recursion views.
 */
export {
  UMBRELLA_HMM,
  RAIN,
  NORAIN,
  UMB,
  NOUMB,
  STATE_LABEL,
  OBS_LABEL,
  DEFAULT_OBS,
} from '@/topics/topic06-temporal/domain'

/** Short state labels for matrix row/column headers. */
export const MX_STATE_LABELS = ['Rain', '¬Rain']
