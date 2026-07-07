import { useMemo, useState } from 'react'
import { lemmatize, stem, tokenize } from '@/lib/nlp'
import { VizGuide } from '@/components/VizGuide'
import './TokenizationView.css'

const DEFAULT = 'The studies show that mice were running quickly and happily.'

export function TokenizationView() {
  const [text, setText] = useState(DEFAULT)
  const tokens = useMemo(() => tokenize(text), [text])
  const rows = useMemo(() => {
    const seen = new Set<string>()
    const out: { word: string; stem: string; lemma: string }[] = []
    for (const t of tokens) {
      if (seen.has(t)) continue
      seen.add(t)
      out.push({ word: t, stem: stem(t), lemma: lemmatize(t) })
    }
    return out
  }, [tokens])

  const types = rows.length

  return (
    <div className="tk">
      <VizGuide
        what={
          <>
            Before a model can do anything, raw text must become discrete{' '}
            <strong>tokens</strong>. Then two kinds of normalization collapse word forms together:{' '}
            <strong>stemming</strong> crudely chops suffixes (fast, may not yield a real word) and{' '}
            <strong>lemmatization</strong> maps to the dictionary form (slower, linguistically
            aware). Both shrink the vocabulary the model must learn.
          </>
        }
        how="Edit the text. Each unique token shows its stem and lemma; rows where they differ are highlighted — that gap is exactly what a lemmatizer buys you."
        legend={[
          { color: 'var(--viz-5)', label: 'stem ≠ lemma (crude vs. dictionary form)' },
        ]}
      />

      <textarea
        className="tk-input"
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        rows={2}
        spellCheck={false}
        aria-label="text to tokenize"
      />

      <div className="tk-tokens">
        {tokens.map((t, i) => (
          <span key={i} className="tk-token mono">
            {t}
          </span>
        ))}
      </div>

      <div className="tk-counts">
        <span>
          <span className="mono">{tokens.length}</span> tokens
        </span>
        <span>
          <span className="mono">{types}</span> types (unique)
        </span>
        <span>
          type/token ratio <span className="mono">{tokens.length ? (types / tokens.length).toFixed(2) : '—'}</span>
        </span>
      </div>

      <div className="tk-table">
        <div className="tk-head">
          <span>token</span>
          <span>stem</span>
          <span>lemma</span>
        </div>
        {rows.map((r) => {
          const diff = r.stem !== r.lemma
          return (
            <div className={`tk-row${diff ? ' is-diff' : ''}`} key={r.word}>
              <span className="mono">{r.word}</span>
              <span className="mono tk-stem">{r.stem}</span>
              <span className="mono tk-lemma">{r.lemma}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
