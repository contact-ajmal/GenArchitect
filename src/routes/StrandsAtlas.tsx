import { useParams } from 'react-router-dom'
import AtlasShell from '../components/atlas/AtlasShell'
import AtlasCoverage from '../components/atlas/AtlasCoverage'
import { STRANDS_META, STRANDS_SECTIONS } from '../data/atlas/strands'

export default function StrandsAtlas() {
  const { topicId } = useParams<{ topicId: string }>()

  if (topicId === 'coverage') {
    return (
      <AtlasCoverage
        atlasId="strands"
        title={STRANDS_META.title}
        sections={STRANDS_SECTIONS}
      />
    )
  }

  return (
    <AtlasShell
      atlasId="strands"
      title={STRANDS_META.title}
      tagline={STRANDS_META.tagline}
      sections={STRANDS_SECTIONS}
      activeTopicId={topicId}
    />
  )
}
