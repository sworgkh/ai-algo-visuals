import { useSearchParams } from 'react-router-dom'
import { TopicPage } from '@/components/TopicPage'
import { topicBySlug } from '@/topics/registry'
import { NgramView } from './NgramView'
import { SentenceScore } from './SentenceScore'
import { SmoothingView } from './SmoothingView'
import './Topic10Page.css'

type TabId = 'ngram' | 'score' | 'smoothing'
const TAB_IDS: TabId[] = ['ngram', 'score', 'smoothing']

const TABS: { id: TabId; label: string; blurb: string }[] = [
  { id: 'ngram', label: 'N-gram model', blurb: 'Next-word MLE distribution' },
  { id: 'score', label: 'Score a sentence', blurb: 'Chain rule → probability' },
  { id: 'smoothing', label: 'Perplexity & smoothing', blurb: 'Fixing zero probabilities' },
]

export default function Topic10Page() {
  const topic = topicBySlug('language-models')!
  const [params, setParams] = useSearchParams()
  const paramTab = params.get('tab') as TabId | null
  const tab: TabId = paramTab && TAB_IDS.includes(paramTab) ? paramTab : 'ngram'
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
          A statistical language model assigns probability to word sequences. The full chain rule is
          intractable, so an <strong>n-gram</strong> model assumes each word depends only on the last
          few — a <strong>bigram</strong> on just one. Counts give <strong>MLE</strong> estimates,
          the chain rule scores a sentence, <strong>perplexity</strong> measures how surprised the
          model is, and <strong>smoothing</strong> rescues the unseen n-grams that would otherwise
          make it infinite.
        </p>
      }
    >
      <div className="t10-tabs" role="tablist" aria-label="Topic 10 visualizations">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`t10-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="t10-tab-label">{t.label}</span>
            <span className="t10-tab-blurb">{t.blurb}</span>
          </button>
        ))}
      </div>

      <div className="t10-panel" role="tabpanel">
        {tab === 'ngram' && <NgramView />}
        {tab === 'score' && <SentenceScore />}
        {tab === 'smoothing' && <SmoothingView />}
      </div>
    </TopicPage>
  )
}
