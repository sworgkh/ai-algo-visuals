import { Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { topicBySlug } from '@/topics/registry'
import { ComingSoon } from '@/pages/ComingSoon'
import { NotFound } from '@/pages/NotFound'

/** Dispatches /topic/:slug to a built topic page, its coming-soon placeholder, or 404. */
export function TopicRoute() {
  const { slug } = useParams<{ slug: string }>()
  const topic = slug ? topicBySlug(slug) : undefined

  if (!topic) return <NotFound />
  if (topic.status !== 'available' || !topic.Component) return <ComingSoon topic={topic} />

  const Page = topic.Component
  return (
    <Suspense fallback={<div className="route-loading">Loading…</div>}>
      <Page />
    </Suspense>
  )
}
