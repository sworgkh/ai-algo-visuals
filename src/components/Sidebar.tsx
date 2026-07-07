import { NavLink } from 'react-router-dom'
import { TOPICS } from '@/topics/registry'
import { Home, Lock, PanelLeft, Star } from './Icons'
import './Sidebar.css'

export interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}`} aria-label="Topics">
      <div className="sb-head">
        <a href="/" className="sb-brand" aria-label="AI Algorithms Exam Portal — Home">
          <img className="sb-brand-mark" src="/favicon.svg" alt="" width={30} height={30} />
          <span className="sb-brand-text">
            <strong>AI Algorithms</strong>
            <small>Exam Portal · 3520103</small>
          </span>
        </a>
        <button
          className="sb-collapse"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <PanelLeft size={18} />
        </button>
      </div>

      <nav className="sb-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `sb-item sb-home${isActive ? ' is-active' : ''}`}
          title="Home"
        >
          <span className="sb-icon">
            <Home size={18} />
          </span>
          <span className="sb-label">Home</span>
        </NavLink>

        <div className="sb-section-label">Topics</div>

        <ul className="sb-list">
          {TOPICS.map((t) => {
            const locked = t.status !== 'available'
            const inner = (
              <>
                <span className="sb-num" aria-hidden="true">
                  {t.num}
                </span>
                <span className="sb-label">
                  <span className="sb-topic-title">{t.title}</span>
                  {t.examStar && (
                    <span className="sb-star" title="Exam Part B topic">
                      <Star size={11} />
                    </span>
                  )}
                </span>
                {locked && (
                  <span className="sb-lock" title="Coming soon">
                    <Lock size={14} />
                  </span>
                )}
              </>
            )
            return (
              <li key={t.slug}>
                {locked ? (
                  <div
                    className="sb-item is-locked"
                    aria-disabled="true"
                    title={`${t.title} — coming soon`}
                  >
                    {inner}
                  </div>
                ) : (
                  <NavLink
                    to={`/topic/${t.slug}`}
                    className={({ isActive }) => `sb-item${isActive ? ' is-active' : ''}`}
                    title={t.title}
                  >
                    {inner}
                  </NavLink>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="sb-foot">
        <span className="sb-foot-text">Study one topic at a time.</span>
      </div>
    </aside>
  )
}
