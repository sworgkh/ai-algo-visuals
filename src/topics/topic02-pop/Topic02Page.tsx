import { useSearchParams } from 'react-router-dom'
import { TopicPage } from '@/components/TopicPage'
import { topicBySlug } from '@/topics/registry'
import { PopPlanner } from './PopPlanner'
import { StripsForward } from './StripsForward'
import { Regression } from './Regression'
import { ForwardVsBackward } from './ForwardVsBackward'
import './Topic02Page.css'

type TabId = 'pop' | 'strips' | 'regression' | 'search'

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'pop', label: 'POP Planner', blurb: 'Causal links, threats, promotion / demotion' },
  { id: 'strips', label: 'STRIPS forward', blurb: 'Apply actions; watch add/delete lists' },
  { id: 'regression', label: 'Regression', blurb: 'Search backward from the goal' },
  { id: 'search', label: 'Forward vs. Backward', blurb: 'Branching & relevance' },
]

const TAB_IDS: TabId[] = ['pop', 'strips', 'regression', 'search']

export default function Topic02Page() {
  const topic = topicBySlug('pop')!
  const [params, setParams] = useSearchParams()
  const paramTab = params.get('tab') as TabId | null
  const tab: TabId = paramTab && TAB_IDS.includes(paramTab) ? paramTab : 'pop'
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
          Planning treats actions as <strong>STRIPS operators</strong> with explicit
          preconditions and add/delete effects. This lets us reason about plans directly —
          protecting what each step achieves (POP), applying effects forward, regressing goals
          backward, and comparing search directions. Everything below runs on the{' '}
          <strong>Sussman anomaly</strong>: the blocks-world problem that proves why goals must
          sometimes be interleaved.
        </p>
      }
    >
      <div className="t2-tabs" role="tablist" aria-label="Topic 2 visualizations">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`t2-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="t2-tab-label">{t.label}</span>
            <span className="t2-tab-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      <div className="t2-panel" role="tabpanel">
        {tab === 'pop' && <PopPlanner />}
        {tab === 'strips' && <StripsForward />}
        {tab === 'regression' && <Regression />}
        {tab === 'search' && <ForwardVsBackward />}
      </div>
    </TopicPage>
  )
}
