import { useSearchParams } from 'react-router-dom'
import { TopicPage } from '@/components/TopicPage'
import { topicBySlug } from '@/topics/registry'
import { CriticalPathLab } from './CriticalPathLab'
import { HtnTree } from './HtnTree'
import { ResourceTimeline } from './ResourceTimeline'
import './Topic03Page.css'

type TabId = 'cpm' | 'htn' | 'resources'
const TAB_IDS: TabId[] = ['cpm', 'htn', 'resources']

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'cpm', label: 'Critical-path lab', blurb: 'ES / LS / slack, Gantt, editable durations' },
  { id: 'htn', label: 'HTN decomposition', blurb: 'HLA → refinements → primitives' },
  { id: 'resources', label: 'Resources', blurb: 'Reusable vs. consumable' },
]

export default function Topic03Page() {
  const topic = topicBySlug('real-world-planning')!
  const [params, setParams] = useSearchParams()
  const paramTab = params.get('tab') as TabId | null
  const tab: TabId = paramTab && TAB_IDS.includes(paramTab) ? paramTab : 'cpm'
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
          Real-world planning adds structure that classical STRIPS ignores:{' '}
          <strong>hierarchy</strong> (high-level actions refined into primitives),{' '}
          <strong>time</strong> (actions have durations, so some slack and some are critical), and{' '}
          <strong>resources</strong> (reusable vs. consumable). The critical-path lab makes the
          scheduling arithmetic visible step by step.
        </p>
      }
    >
      <div className="t3-tabs" role="tablist" aria-label="Topic 3 visualizations">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`t3-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="t3-tab-label">{t.label}</span>
            <span className="t3-tab-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      <div className="t3-panel" role="tabpanel">
        {tab === 'cpm' && <CriticalPathLab />}
        {tab === 'htn' && <HtnTree />}
        {tab === 'resources' && <ResourceTimeline />}
      </div>
    </TopicPage>
  )
}
