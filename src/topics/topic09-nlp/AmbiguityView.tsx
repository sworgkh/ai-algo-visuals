import { useState } from 'react'
import type { ReactNode } from 'react'
import { VizGuide } from '@/components/VizGuide'
import { AMBIGUITIES } from './domain'
import './AmbiguityView.css'

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Highlight every whole-word occurrence of `span` in `sentence`. */
function renderSentence(sentence: string, span: string): ReactNode[] {
  const parts = sentence.split(new RegExp(`\\b(${escapeRe(span)})\\b`))
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark className="am-span" key={i}>
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export function AmbiguityView() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="am">
      <VizGuide
        what={
          <>
            The core difficulty of language is <strong>ambiguity</strong>: the same string can mean
            different things. It shows up at three levels — <strong>lexical</strong> (one word, many
            senses), <strong>syntactic</strong> (the words group in more than one way), and{' '}
            <strong>semantic / referential</strong> (what a phrase refers to). People resolve these
            instantly with context and world knowledge; machines must model them.
          </>
        }
        how="Click a card to reveal its competing interpretations. The highlighted span is the source of the ambiguity."
      />

      <div className="am-cards">
        {AMBIGUITIES.map((a, i) => {
          const isOpen = open === i
          return (
            <button
              key={a.tag}
              className={`am-card am-card--${a.tag}${isOpen ? ' is-open' : ''}`}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <div className="am-card-head">
                <span className={`am-tag am-tag--${a.tag}`}>{a.type}</span>
                <span className="am-chevron">{isOpen ? '−' : '+'}</span>
              </div>
              <p className="am-sentence">{renderSentence(a.sentence, a.span)}</p>
              {isOpen && (
                <div className="am-readings">
                  {a.readings.map((r, j) => (
                    <div className="am-reading" key={j}>
                      <span className="am-reading-num">{j + 1}</span>
                      <div>
                        <span className="am-reading-label">{r.label}</span>
                        <span className="am-reading-gloss">{r.gloss}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <p className="am-note">
        This is why the same NLP task can have more than one correct-looking output, and why context
        — the surrounding words, the domain, and knowledge about the world — is what disambiguates.
      </p>
    </div>
  )
}
