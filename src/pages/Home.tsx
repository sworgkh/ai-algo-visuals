import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TOPICS } from '@/topics/registry'
import { FormulaBlock } from '@/components/FormulaBlock'
import { term } from '@/components/formula'
import { Lock, Star } from '@/components/Icons'
import './Home.css'

const FILTERING_TEX = String.raw`P(X_t \mid e_{1:t}) = ${term('norm', '\\alpha')}\;${term(
  'update',
  'P(e_t \\mid X_t)',
)}\sum_{x_{t-1}} ${term('predict', 'P(X_t \\mid x_{t-1})\\,P(x_{t-1}\\mid e_{1:t-1})')}`

const SHOWCASE_STEPS: { keys: string[]; label: string; text: string }[] = [
  { keys: ['predict'], label: 'Predict', text: 'Roll last step’s belief forward through the transition model.' },
  { keys: ['update'], label: 'Update', text: 'Reweight by how well each state explains the new evidence.' },
  { keys: ['norm'], label: 'Normalize', text: 'Rescale by α so the distribution sums back to 1.' },
]

function FormulaShowcase() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % SHOWCASE_STEPS.length), 1900)
    return () => window.clearInterval(id)
  }, [])
  const step = SHOWCASE_STEPS[i]
  return (
    <section className="home-formula card">
      <div className="hf-head">
        <span className="hf-eyebrow">Formulas are first-class</span>
        <p className="hf-sub">
          Every equation renders with KaTeX and can highlight term-by-term in sync with the
          animation — like the filtering recursion below.
        </p>
      </div>
      <FormulaBlock tex={FILTERING_TEX} activeTerms={step.keys} ariaLabel="Filtering recursion" />
      <div className="hf-caption">
        <span className="hf-step-label">{step.label}</span>
        <span className="hf-step-text">{step.text}</span>
      </div>
    </section>
  )
}

export function Home() {
  const built = TOPICS.filter((t) => t.status === 'available').length

  return (
    <div className="home">
      <header className="home-hero">
        <span className="home-kicker">Algorithms in AI · 3520103</span>
        <h1 className="home-title">
          See the algorithms <span className="grad">move</span>.
        </h1>
        <p className="home-lede">
          An interactive study companion for the exam — watch BFS flood a grid, a POP planner
          resolve a threat, probability mass flow through a Bayesian network, and particles die
          and resample. Built to make the <em>mechanics</em> visible, one topic at a time.
        </p>
      </header>

      <section className="home-exam">
        <div className="card exam-card">
          <span className="exam-tag exam-tag--a">Part A</span>
          <h3>True / False — graded on reasoning</h3>
          <p>
            Almost entirely about <em>why</em>. Each visualization runs in step-through mode so
            you can narrate the reasoning at every step — that narration is the exam skill.
          </p>
        </div>
        <div className="card exam-card">
          <span className="exam-tag exam-tag--b">
            <Star size={12} /> Part B
          </span>
          <h3>Open computational questions</h3>
          <p>
            Historically <strong>POP planning</strong>, <strong>Bayesian-network inference</strong>,
            and <strong>HMM filtering</strong>. Those topics ship with editable inputs and live
            recomputation so you can practice cranking real numbers.
          </p>
        </div>
      </section>

      <FormulaShowcase />

      <section className="home-topics">
        <div className="ht-head">
          <h2>Topics</h2>
          <span className="ht-progress">
            <span className="ht-progress-num">{built}</span> / {TOPICS.length} built
          </span>
        </div>
        <div className="ht-grid">
          {TOPICS.map((t) => {
            const locked = t.status !== 'available'
            const card = (
              <>
                <div className="tc-top">
                  <span className="tc-num">{t.num}</span>
                  <div className="tc-badges">
                    {t.examStar && (
                      <span className="tc-star" title="Exam Part B">
                        <Star size={12} />
                      </span>
                    )}
                    {locked ? (
                      <span className="tc-status tc-status--soon">
                        <Lock size={12} /> Soon
                      </span>
                    ) : (
                      <span className="tc-status tc-status--ready">Ready</span>
                    )}
                  </div>
                </div>
                <h3 className="tc-title">{t.title}</h3>
                <p className="tc-tagline">{t.tagline}</p>
              </>
            )
            return locked ? (
              <div className="topic-card is-locked" key={t.slug} aria-disabled="true">
                {card}
              </div>
            ) : (
              <Link className="topic-card" to={`/topic/${t.slug}`} key={t.slug}>
                {card}
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
