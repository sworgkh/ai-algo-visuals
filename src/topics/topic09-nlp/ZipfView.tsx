import { useMemo, useState } from 'react'
import { coverage, tokenize, zipfTable } from '@/lib/nlp'
import { VizGuide } from '@/components/VizGuide'
import { CORPUS } from './domain'
import './ZipfView.css'

const PW = 520
const PH = 260
const PAD = 44

export function ZipfView() {
  const tokens = useMemo(() => tokenize(CORPUS), [])
  const table = useMemo(() => zipfTable(tokens), [tokens])
  const [vocab, setVocab] = useState(() => Math.max(1, Math.round(table.length / 4)))

  const maxRank = table.length
  const maxFreq = table[0]?.freq ?? 1
  const cov = coverage(tokens, vocab)

  // log-log scales
  const lx = (rank: number) => PAD + (Math.log10(rank) / Math.log10(maxRank)) * (PW - PAD * 1.5)
  const ly = (freq: number) => PH - PAD - (Math.log10(freq) / Math.log10(maxFreq)) * (PH - PAD * 1.5)

  // cumulative coverage curve (pure prefix sums — n is small)
  const cumulative = useMemo(() => {
    const freqs = table.map((e) => e.freq)
    return freqs.map((_, i) => freqs.slice(0, i + 1).reduce((a, b) => a + b, 0) / tokens.length)
  }, [table, tokens.length])

  const cw = 520
  const ch = 180
  const cx = (v: number) => PAD + (v / maxRank) * (cw - PAD * 1.4)
  const cy = (frac: number) => ch - 34 - frac * (ch - 60)

  return (
    <div className="zf">
      <VizGuide
        what={
          <>
            <strong>Zipf's law</strong>: a word's frequency is roughly inversely proportional to its
            rank — the 2nd word appears ~½ as often as the 1st, the 3rd ~⅓, and so on. On a{' '}
            <strong>log-log</strong> plot that's a straight line. The consequence:{' '}
            <strong>a few words are everywhere and a long tail is rare</strong>, so no matter how big
            your vocabulary, new words (<strong>OOV</strong>) keep appearing.
          </>
        }
        how="The left plot is rank vs. frequency (log-log) against the ideal 1/rank line. Drag the vocabulary slider on the right to see how much of the text a fixed vocabulary covers — and how much stays out-of-vocabulary."
        legend={[
          { color: 'var(--brand-500)', label: 'observed word (rank, frequency)' },
          { color: 'var(--viz-5)', label: 'ideal Zipf 1/rank' },
        ]}
      />

      <div className="zf-panels">
        <div className="zf-panel">
          <span className="zf-panel-title">Rank × frequency (log-log)</span>
          <svg className="zf-svg" viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label="Zipf log-log plot">
            {/* axes */}
            <line x1={PAD} y1={PH - PAD} x2={PW - PAD * 0.5} y2={PH - PAD} className="zf-axis" />
            <line x1={PAD} y1={PAD * 0.5} x2={PAD} y2={PH - PAD} className="zf-axis" />
            {/* ideal 1/rank reference */}
            <line
              x1={lx(1)}
              y1={ly(maxFreq)}
              x2={lx(maxRank)}
              y2={ly(Math.max(1, maxFreq / maxRank))}
              className="zf-ideal"
            />
            {/* points */}
            {table.map((e) => (
              <circle key={e.word} cx={lx(e.rank)} cy={ly(e.freq)} r={3.2} className="zf-dot">
                <title>{`${e.word}: rank ${e.rank}, freq ${e.freq}`}</title>
              </circle>
            ))}
            <text x={PW / 2} y={PH - 6} textAnchor="middle" className="zf-axlabel">rank (log) →</text>
            <text x={12} y={PH / 2} textAnchor="middle" className="zf-axlabel" transform={`rotate(-90 12 ${PH / 2})`}>frequency (log) →</text>
          </svg>
        </div>

        <div className="zf-panel">
          <span className="zf-panel-title">Vocabulary coverage</span>
          <svg className="zf-svg" viewBox={`0 0 ${cw} ${ch}`} role="img" aria-label="coverage curve">
            <line x1={PAD} y1={ch - 34} x2={cw - PAD * 0.4} y2={ch - 34} className="zf-axis" />
            <line x1={PAD} y1={16} x2={PAD} y2={ch - 34} className="zf-axis" />
            {/* 100% guide */}
            <line x1={PAD} y1={cy(1)} x2={cw - PAD * 0.4} y2={cy(1)} className="zf-guide" />
            {/* cumulative coverage curve */}
            <polyline
              className="zf-curve"
              points={cumulative.map((f, i) => `${cx(i + 1)},${cy(f)}`).join(' ')}
            />
            {/* current vocab marker */}
            <line x1={cx(vocab)} y1={16} x2={cx(vocab)} y2={ch - 34} className="zf-marker" />
            <circle cx={cx(vocab)} cy={cy(cov.coverage)} r={4} className="zf-marker-dot" />
            <text x={cw / 2} y={ch - 8} textAnchor="middle" className="zf-axlabel">vocabulary size (word types) →</text>
          </svg>

          <label className="zf-slider">
            <span>
              vocabulary = top <span className="mono">{vocab}</span> of {maxRank} types
            </span>
            <input
              type="range"
              min={1}
              max={maxRank}
              step={1}
              value={vocab}
              onChange={(e) => setVocab(e.currentTarget.valueAsNumber)}
            />
          </label>

          <div className="zf-readout">
            <div className="zf-stat zf-stat--cov">
              <span className="zf-stat-num mono">{(cov.coverage * 100).toFixed(0)}%</span>
              <span className="zf-stat-lbl">of running text covered</span>
            </div>
            <div className="zf-stat zf-stat--oov">
              <span className="zf-stat-num mono">{(cov.oovRate * 100).toFixed(0)}%</span>
              <span className="zf-stat-lbl">out-of-vocabulary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
