import { useSearchParams } from 'react-router-dom'
import { TopicPage } from '@/components/TopicPage'
import { topicBySlug } from '@/topics/registry'
import { EnumerationTable } from './EnumerationTable'
import { BayesMassFlow } from './BayesMassFlow'
import { ParamCounts } from './ParamCounts'
import { ConditionalIndependence } from './ConditionalIndependence'
import { UNCERTAINTY_EXAMPLES } from './examples'
import './Topic04Page.css'

function ExampleSwitcher({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="t4-example">
      <span className="t4-example-label">Example</span>
      <div className="t4-example-seg">
        {UNCERTAINTY_EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            className={`t4-example-btn${value === ex.id ? ' is-active' : ''}`}
            onClick={() => onChange(ex.id)}
          >
            <span className="t4-example-name">{ex.label}</span>
            <span className="t4-example-note mono">{ex.note}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

type TabId = 'enum' | 'bayes' | 'params' | 'ci'
const TAB_IDS: TabId[] = ['enum', 'bayes', 'params', 'ci']

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'enum', label: 'Enumeration', blurb: 'Joint distribution · sum & normalize' },
  { id: 'bayes', label: 'Bayes’ rule', blurb: 'Mass flow · base-rate fallacy' },
  { id: 'params', label: 'Parameter counts', blurb: 'Full joint vs. naïve Bayes' },
  { id: 'ci', label: 'Cond. independence', blurb: 'A common cause screens off' },
]

export default function Topic04Page() {
  const topic = topicBySlug('uncertainty')!
  const [params, setParams] = useSearchParams()
  const paramTab = params.get('tab') as TabId | null
  const tab: TabId = paramTab && TAB_IDS.includes(paramTab) ? paramTab : 'enum'
  const setTab = (id: TabId) => {
    const next = new URLSearchParams(params)
    next.set('tab', id)
    setParams(next, { replace: true })
  }

  const exParam = params.get('ex')
  const exId = exParam && UNCERTAINTY_EXAMPLES.some((e) => e.id === exParam) ? exParam : 'dentist'
  const example = UNCERTAINTY_EXAMPLES.find((e) => e.id === exId) ?? UNCERTAINTY_EXAMPLES[0]
  const setExId = (id: string) => {
    const next = new URLSearchParams(params)
    next.set('ex', id)
    setParams(next, { replace: true })
  }
  const usesJoint = tab === 'enum' || tab === 'ci'

  return (
    <TopicPage
      topic={topic}
      intro={
        <p>
          Probability lets an agent reason under uncertainty. The <strong>joint distribution</strong>{' '}
          answers any query by enumeration; <strong>Bayes’ rule</strong> inverts conditionals; and{' '}
          <strong>(conditional) independence</strong> is what keeps the numbers from exploding —
          the bridge to Bayesian networks.
        </p>
      }
    >
      <div className="t4-tabs" role="tablist" aria-label="Topic 4 visualizations">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`t4-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="t4-tab-label">{t.label}</span>
            <span className="t4-tab-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      <div className="t4-panel" role="tabpanel">
        {usesJoint && <ExampleSwitcher value={exId} onChange={setExId} />}
        {tab === 'enum' && <EnumerationTable key={exId} joint={example.joint} />}
        {tab === 'bayes' && <BayesMassFlow />}
        {tab === 'params' && <ParamCounts />}
        {tab === 'ci' && <ConditionalIndependence key={exId} joint={example.joint} />}
      </div>
    </TopicPage>
  )
}
