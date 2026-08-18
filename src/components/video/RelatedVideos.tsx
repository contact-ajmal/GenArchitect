import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Video } from 'lucide-react'
import type { RagArchitectureId, VideoEntry } from '../../types'
import { videosForAtlasTopic, videosForPattern } from '../../lib/videos'
import VideoCard from './VideoCard'
import VideoPlayer from './VideoPlayer'

export interface RelatedVideosProps {
  patternId?: RagArchitectureId
  atlasTopicId?: string
  title?: string
  limit?: number
}

/**
 * A quiet row of up to `limit` relevant videos. Self-contained (owns its player)
 * so it can drop into any page. Renders NOTHING when there's no match — no empty
 * placeholder.
 */
export default function RelatedVideos({
  patternId,
  atlasTopicId,
  title = 'Related videos',
  limit = 3,
}: RelatedVideosProps) {
  const [active, setActive] = useState<VideoEntry | null>(null)
  const videos = useMemo(() => {
    if (patternId) return videosForPattern(patternId, limit)
    if (atlasTopicId) return videosForAtlasTopic(atlasTopicId, limit)
    return []
  }, [patternId, atlasTopicId, limit])

  if (videos.length === 0) return null

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          <Video className="h-3.5 w-3.5" />
          {title}
        </p>
        <Link to="/videos" className="text-xs font-medium text-accent-strong hover:underline">
          All videos
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => (
          <VideoCard key={v.id} video={v} onOpen={setActive} compact />
        ))}
      </div>
      <VideoPlayer video={active} onClose={() => setActive(null)} />
    </div>
  )
}
