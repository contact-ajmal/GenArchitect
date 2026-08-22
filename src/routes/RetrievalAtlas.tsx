import { useParams } from 'react-router-dom'
import AtlasShell from '../components/atlas/AtlasShell'
import AtlasCoverage from '../components/atlas/AtlasCoverage'
import { RETRIEVAL_META, RETRIEVAL_SECTIONS } from '../data/atlas/retrieval'

export default function RetrievalAtlas() {
  const { topicId } = useParams<{ topicId: string }>()

  if (topicId === 'coverage') {
    return (
      <AtlasCoverage
        atlasId="retrieval"
        title={RETRIEVAL_META.title}
        sections={RETRIEVAL_SECTIONS}
      />
    )
  }

  return (
    <AtlasShell
      atlasId="retrieval"
      title={RETRIEVAL_META.title}
      tagline={RETRIEVAL_META.tagline}
      sections={RETRIEVAL_SECTIONS}
      activeTopicId={topicId}
    />
  )
}
