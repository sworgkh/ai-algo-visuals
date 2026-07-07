import { useSearchParams } from 'react-router-dom'
import { TopicPage } from '@/components/TopicPage'
import { topicBySlug } from '@/topics/registry'
import { TokenizationView } from './TokenizationView'
import { AmbiguityView } from './AmbiguityView'
import { ZipfView } from './ZipfView'
import './Topic09Page.css'

type TabId = 'tokenize' | 'ambiguity' | 'zipf'
const TAB_IDS: TabId[] = ['tokenize', 'ambiguity', 'zipf']

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'tokenize', label: 'Tokenization', blurb: 'Tokens · stem vs. lemma' },
  { id: 'ambiguity', label: 'Ambiguity', blurb: 'The three types' },
  { id: 'zipf', label: 'Zipf & OOV', blurb: 'Frequency & coverage' },
]

export default function Topic09Page() {
  const topic = topicBySlug('nlp')!
  const [params, setParams] = useSearchParams()
  const paramTab = params.get('tab') as TabId | null
  const tab: TabId = paramTab && TAB_IDS.includes(paramTab) ? paramTab : 'tokenize'
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
          Natural language processing turns human text into something a model can compute over. Two
          themes make it hard: <strong>ambiguity</strong> (the same words can mean different things)
          and the <strong>shape of word frequencies</strong> (a few words dominate, endless rare
          words trail off). Before any of that, text must be <strong>tokenized</strong> and
          normalized. These three tabs walk through each.
        </p>
      }
    >
      <div className="t9-tabs" role="tablist" aria-label="Topic 9 visualizations">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`t9-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="t9-tab-label">{t.label}</span>
            <span className="t9-tab-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      <div className="t9-panel" role="tabpanel">
        {tab === 'tokenize' && <TokenizationView />}
        {tab === 'ambiguity' && <AmbiguityView />}
        {tab === 'zipf' && <ZipfView />}
      </div>
    </TopicPage>
  )
}
