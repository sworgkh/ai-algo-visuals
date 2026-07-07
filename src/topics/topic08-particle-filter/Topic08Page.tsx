import { useSearchParams } from 'react-router-dom'
import { TopicPage } from '@/components/TopicPage'
import { topicBySlug } from '@/topics/registry'
import { ParticleFilterLab } from './ParticleFilterLab'
import { DbnUnrolling } from './DbnUnrolling'
import { DbnVsHmm } from './DbnVsHmm'
import './Topic08Page.css'

type TabId = 'particle' | 'dbn' | 'factor'
const TAB_IDS: TabId[] = ['particle', 'dbn', 'factor']

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'particle', label: 'Particle filter', blurb: 'Sample → weight → resample' },
  { id: 'dbn', label: 'DBN unrolling', blurb: 'Slice template across time' },
  { id: 'factor', label: 'DBN vs. HMM', blurb: 'Factored vs. flattened' },
]

export default function Topic08Page() {
  const topic = topicBySlug('particle-filter')!
  const [params, setParams] = useSearchParams()
  const paramTab = params.get('tab') as TabId | null
  const tab: TabId = paramTab && TAB_IDS.includes(paramTab) ? paramTab : 'particle'
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
          A <strong>dynamic Bayes net</strong> factors the state into several variables per time
          slice, so it scales where a flattened HMM explodes — but exact filtering still gets
          intractable as the belief entangles. The escape is approximate inference:{' '}
          <strong>particle filtering</strong> represents the belief with samples and updates them by{' '}
          <strong>sample → weight → resample</strong>. Below: watch a robot localize, unroll a DBN,
          and compare factored vs. flattened cost.
        </p>
      }
    >
      <div className="t8-tabs" role="tablist" aria-label="Topic 8 visualizations">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`t8-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="t8-tab-label">{t.label}</span>
            <span className="t8-tab-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      <div className="t8-panel" role="tabpanel">
        {tab === 'particle' && <ParticleFilterLab />}
        {tab === 'dbn' && <DbnUnrolling />}
        {tab === 'factor' && <DbnVsHmm />}
      </div>
    </TopicPage>
  )
}
