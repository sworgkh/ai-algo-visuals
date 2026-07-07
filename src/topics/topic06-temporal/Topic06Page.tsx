import { useSearchParams } from 'react-router-dom'
import { TopicPage } from '@/components/TopicPage'
import { topicBySlug } from '@/topics/registry'
import { FilteringView } from './FilteringView'
import { PredictionDecay } from './PredictionDecay'
import { SmoothingView } from './SmoothingView'
import { ViterbiTrellis } from './ViterbiTrellis'
import './Topic06Page.css'

type TabId = 'filter' | 'predict' | 'smooth' | 'viterbi'
const TAB_IDS: TabId[] = ['filter', 'predict', 'smooth', 'viterbi']

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'filter', label: 'Filtering', blurb: 'Predict → update, day by day' },
  { id: 'predict', label: 'Prediction', blurb: 'Belief decays to stationary' },
  { id: 'smooth', label: 'Smoothing', blurb: 'Use the future too' },
  { id: 'viterbi', label: 'Viterbi', blurb: 'Most likely sequence' },
]

export default function Topic06Page() {
  const topic = topicBySlug('temporal')!
  const [params, setParams] = useSearchParams()
  const paramTab = params.get('tab') as TabId | null
  const tab: TabId = paramTab && TAB_IDS.includes(paramTab) ? paramTab : 'filter'
  const setTab = (id: TabId) => {
    const next = new URLSearchParams(params)
    next.set('tab', id)
    setParams(next, { replace: true })
  }

  return (
    <TopicPage
      topic={topic}
      intro={
        <p>
          A temporal model tracks a hidden state that evolves over time from noisy observations. On
          a <strong>hidden Markov model</strong>, four inference tasks reuse the same forward and
          backward messages: <strong>filtering</strong> (belief now), <strong>prediction</strong>{' '}
          (belief later), <strong>smoothing</strong> (belief about the past), and{' '}
          <strong>Viterbi</strong> (the most likely path). Everything below runs on the classic
          umbrella world.
        </p>
      }
    >
      <div className="t6-tabs" role="tablist" aria-label="Topic 6 visualizations">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`t6-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="t6-tab-label">{t.label}</span>
            <span className="t6-tab-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      <div className="t6-panel" role="tabpanel">
        {tab === 'filter' && <FilteringView />}
        {tab === 'predict' && <PredictionDecay />}
        {tab === 'smooth' && <SmoothingView />}
        {tab === 'viterbi' && <ViterbiTrellis />}
      </div>
    </TopicPage>
  )
}
