import { useSearchParams } from 'react-router-dom'
import { TopicPage } from '@/components/TopicPage'
import { topicBySlug } from '@/topics/registry'
import { SearchLab } from './SearchLab'
import { StrategyRace } from './StrategyRace'
import { ComplexityView } from './ComplexityView'
import './Topic01Page.css'

type TabId = 'lab' | 'race' | 'complexity'
const TAB_IDS: TabId[] = ['lab', 'race', 'complexity']

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'lab', label: 'Pathfinding lab', blurb: 'Step through any strategy' },
  { id: 'race', label: 'Strategy race', blurb: 'Nodes expanded vs. path cost' },
  { id: 'complexity', label: 'Complexity & heuristics', blurb: 'bᵈ vs. b·m, admissibility' },
]

export default function Topic01Page() {
  const topic = topicBySlug('search')!
  const [params, setParams] = useSearchParams()
  const paramTab = params.get('tab') as TabId | null
  const tab: TabId = paramTab && TAB_IDS.includes(paramTab) ? paramTab : 'lab'
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
          Search treats problem-solving as exploring a graph of states from a start toward a goal.
          Every algorithm here shares one loop — pop from the <strong>frontier</strong>, expand,
          repeat — and differs only in <em>which</em> node it pops: shallowest (<strong>BFS</strong>),
          deepest (<strong>DFS</strong>), cheapest so far (<strong>UCS</strong>), closest by estimate
          (<strong>Greedy</strong>), or best total (<strong>A*</strong>). That single choice decides
          completeness, optimality and cost.
        </p>
      }
    >
      <div className="t1-tabs" role="tablist" aria-label="Topic 1 visualizations">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`t1-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="t1-tab-label">{t.label}</span>
            <span className="t1-tab-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      <div className="t1-panel" role="tabpanel">
        {tab === 'lab' && <SearchLab />}
        {tab === 'race' && <StrategyRace />}
        {tab === 'complexity' && <ComplexityView />}
      </div>
    </TopicPage>
  )
}
