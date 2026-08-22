import { Link } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import { Eyebrow } from '../ui'
import UpdateCard from './UpdateCard'
import { LATEST_GENERATED_AT, LATEST_UPDATES } from '../../lib/updates-latest'
import { relativeTime } from '../../lib/videos'

export interface LatestUpdatesProps {
  /** How many to show. Six fills two rows of three without a ragged edge. */
  limit?: number
}

/**
 * The homepage "what's new" band. Pinned items lead (that's the point of
 * pinning), then the newest, deduped. Renders nothing when the feed is empty
 * so a failed refresh degrades to absence rather than an empty shell.
 */
export default function LatestUpdates({ limit = 6 }: LatestUpdatesProps) {
  // Already pinned-first and deduped by the refresh script.
  const items = LATEST_UPDATES.slice(0, limit)

  if (items.length === 0) return null

  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-content px-4 py-14 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Eyebrow>Latest</Eyebrow>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              What&rsquo;s new across AWS GenAI
            </h2>
            <p className="mt-3 max-w-2xl text-ink-soft">
              Launches and posts on Bedrock, AgentCore, Strands and RAG, pulled
              daily from AWS&rsquo;s own feeds. Every item links to the original
              on aws.amazon.com.
            </p>
          </div>
          <Link
            to="/updates"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-strong hover:underline"
          >
            All updates
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((u) => (
            <li key={u.id}>
              <UpdateCard update={u} compact featured={u.pinned} />
            </li>
          ))}
        </ul>

        <p className="mt-5 inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted">
          <Clock className="h-3.5 w-3.5" />
          Refreshed {relativeTime(LATEST_GENERATED_AT)} · sources listed on the{' '}
          <Link to="/updates" className="underline hover:text-ink">
            updates page
          </Link>
        </p>
      </div>
    </section>
  )
}
