import { Link } from 'react-router-dom'
import './ComingSoon.css'

export function NotFound() {
  return (
    <div className="coming-soon">
      <div className="cs-panel">
        <span className="cs-eyebrow">404</span>
        <h1 className="cs-title">Page not found</h1>
        <p className="cs-tagline">That route doesn’t exist in the portal.</p>
        <Link to="/" className="cs-back">
          ← Back to overview
        </Link>
      </div>
    </div>
  )
}
