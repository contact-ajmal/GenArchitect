import { useParams } from 'react-router-dom'
import AtlasShell from '../components/atlas/AtlasShell'
import AtlasCoverage from '../components/atlas/AtlasCoverage'
import { AGENTCORE_META, AGENTCORE_SECTIONS } from '../data/atlas/agentcore'

export default function AgentCoreAtlas() {
  const { topicId } = useParams<{ topicId: string }>()

  if (topicId === 'coverage') {
    return (
      <AtlasCoverage
        atlasId="agentcore"
        title={AGENTCORE_META.title}
        sections={AGENTCORE_SECTIONS}
      />
    )
  }

  return (
    <AtlasShell
      atlasId="agentcore"
      title={AGENTCORE_META.title}
      tagline={AGENTCORE_META.tagline}
      sections={AGENTCORE_SECTIONS}
      activeTopicId={topicId}
    />
  )
}
