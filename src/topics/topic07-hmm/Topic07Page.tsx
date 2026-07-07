import { useSearchParams } from 'react-router-dom'
import { TopicPage } from '@/components/TopicPage'
import { topicBySlug } from '@/topics/registry'
import { MatrixFilterView } from './MatrixFilterView'
import { ForwardBackwardView } from './ForwardBackwardView'
import { MatrixViterbiView } from './MatrixViterbiView'
import { MegaBlowupView } from './MegaBlowupView'
import './Topic07Page.css'

type TabId = 'filter' | 'forward-backward' | 'viterbi' | 'blowup'
const TAB_IDS: TabId[] = ['filter', 'forward-backward', 'viterbi', 'blowup']

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'filter', label: 'Matrix filtering', blurb: 'f′ = α · Oₑ · Tᵀ · f' },
  { id: 'forward-backward', label: 'Forward–backward', blurb: 'Two passes → smoothing' },
  { id: 'viterbi', label: 'Sum vs. max', blurb: 'Filtering & Viterbi, one operator apart' },
  { id: 'blowup', label: 'Mega-variable', blurb: 'The 2ᵏ blow-up' },
]

export default function Topic07Page() {
  const topic = topicBySlug('hmm')!
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
          A hidden Markov model is a temporal model with a <strong>single</strong> discrete state
          variable, which lets every inference recursion collapse into <strong>matrix algebra</strong>:
          a transition matrix <strong>T</strong>, a diagonal sensor matrix <strong>Oₑ</strong>, and
          the belief as a column vector. Filtering, smoothing and Viterbi are then one matrix
          expression each — and folding several variables into that one state is what makes the
          matrix explode. Same umbrella world as Topic 6, seen through linear algebra.
        </p>
      }
    >
      <div className="t7-tabs" role="tablist" aria-label="Topic 7 visualizations">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`t7-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="t7-tab-label">{t.label}</span>
            <span className="t7-tab-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      <div className="t7-panel" role="tabpanel">
        {tab === 'filter' && <MatrixFilterView />}
        {tab === 'forward-backward' && <ForwardBackwardView />}
        {tab === 'viterbi' && <MatrixViterbiView />}
        {tab === 'blowup' && <MegaBlowupView />}
      </div>
    </TopicPage>
  )
}
