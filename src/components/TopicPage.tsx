import type { ReactNode } from 'react'
import type { Topic } from '@/topics/registry'
import { Star } from './Icons'
import './TopicPage.css'

export interface TopicPageProps {
  topic: Topic
  /** Optional lead paragraph shown under the concept chips. */
  intro?: ReactNode
  children: ReactNode
}

/**
 * Standard chrome for a topic page: number, title, exam badge, tagline,
 * concept chips, then the topic's own visualization content.
 */
export function TopicPage({ topic, intro, children }: TopicPageProps) {
  return (
    <article className="topic-page">
      <header className="tp-header">
        <div className="tp-eyebrow">
          <span className="tp-num">Topic {topic.num}</span>
          {topic.examStar && (
            <span className="tp-exam-badge">
              <Star size={12} />
              Exam Part B
            </span>
          )}
        </div>
        <h1 className="tp-title">{topic.title}</h1>
        <p className="tp-tagline">{topic.tagline}</p>
        {topic.concepts.length > 0 && (
          <ul className="tp-concepts" aria-label="Key concepts">
            {topic.concepts.map((c) => (
              <li key={c} className="tp-chip">
                {c}
              </li>
            ))}
          </ul>
        )}
        {intro && <div className="tp-intro">{intro}</div>}
      </header>
      <div className="tp-body">{children}</div>
    </article>
  )
}
