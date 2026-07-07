import { useSearchParams } from 'react-router-dom'
import { TopicPage } from '@/components/TopicPage'
import { topicBySlug } from '@/topics/registry'
import { EnumerationInference } from './EnumerationInference'
import { MarkovBlanketView } from './MarkovBlanketView'
import { VariableOrdering } from './VariableOrdering'
import { VariableElimination } from './VariableElimination'
import './Topic05Page.css'

type TabId = 'enum' | 'blanket' | 'ordering' | 've'
const TAB_IDS: TabId[] = ['enum', 'blanket', 'ordering', 've']

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'enum', label: 'Network + enumeration', blurb: 'Editable CPTs · term-by-term' },
  { id: 'blanket', label: 'Markov blanket', blurb: 'What a node depends on' },
  { id: 'ordering', label: 'Variable ordering', blurb: 'Causal vs. dense' },
  { id: 've', label: 'Variable elimination', blurb: 'Factors merge & shrink' },
]

export default function Topic05Page() {
  const topic = topicBySlug('bayes-nets')!
  const [params, setParams] = useSearchParams()
  const paramTab = params.get('tab') as TabId | null
  const tab: TabId = paramTab && TAB_IDS.includes(paramTab) ? paramTab : 'enum'
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
          A Bayesian network is a DAG plus a CPT per node, encoding the joint compactly via{' '}
          <strong>∏ P(xᵢ | parents)</strong>. It answers queries exactly by{' '}
          <strong>enumeration</strong> or <strong>variable elimination</strong>, and its structure
          makes independence — the <strong>Markov blanket</strong> — readable off the graph.
          Everything below runs on the classic burglary network.
        </p>
      }
    >
      <div className="t5-tabs" role="tablist" aria-label="Topic 5 visualizations">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`t5-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="t5-tab-label">{t.label}</span>
            <span className="t5-tab-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      <div className="t5-panel" role="tabpanel">
        {tab === 'enum' && <EnumerationInference />}
        {tab === 'blanket' && <MarkovBlanketView />}
        {tab === 'ordering' && <VariableOrdering />}
        {tab === 've' && <VariableElimination />}
      </div>
    </TopicPage>
  )
}
