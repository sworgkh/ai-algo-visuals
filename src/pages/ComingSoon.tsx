import { Link } from 'react-router-dom'
import type { Topic } from '@/topics/registry'
import { Lock } from '@/components/Icons'
import './ComingSoon.css'

export interface ComingSoonProps {
  topic: Topic
}

/** Placeholder page for topics that are in the nav but not yet built. */
export function ComingSoon({ topic }: ComingSoonProps) {
  return (
    <div className="coming-soon">
      <div className="cs-panel">
        <div className="cs-badge">
          <Lock size={22} />
        </div>
        <span className="cs-eyebrow">Topic {topic.num}</span>
        <h1 className="cs-title">{topic.title}</h1>
        <p className="cs-tagline">{topic.tagline}</p>

        <div className="cs-preview">
          <span className="cs-preview-label">You’ll be able to explore</span>
          <ul className="cs-concepts">
            {topic.concepts.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <p className="cs-note">
          This visualization hasn’t been built yet — the portal is filled in one topic at a
          time, in step with your studying.
        </p>
        <Link to="/" className="cs-back">
          ← Back to overview
        </Link>
      </div>
    </div>
  )
}
