import type { AtlasCodeSample, AtlasId, AtlasVisual } from '../../atlas/types'
import ConceptDiagram from './ConceptDiagram'
import AnimatedLoop from './AnimatedLoop'
import FlowWalkthrough from './FlowWalkthrough'
import ComparisonMatrix from './ComparisonMatrix'
import DecisionTree from './DecisionTree'
import LayeredStack from './LayeredStack'
import SequenceTrace from './SequenceTrace'
import LifecycleTimeline from './LifecycleTimeline'
import ChunkLab from './ChunkLab'
import VectorSpace from './VectorSpace'
import RankCompare from './RankCompare'

export interface AtlasVisualViewProps {
  visual: AtlasVisual
  atlasId: AtlasId
  codeSamples?: AtlasCodeSample[]
}

/** Renders the right visual primitive for a topic's AtlasVisual payload. */
export default function AtlasVisualView({
  visual,
  atlasId,
  codeSamples,
}: AtlasVisualViewProps) {
  switch (visual.kind) {
    case 'concept_diagram':
      return (
        <ConceptDiagram
          nodes={visual.nodes}
          edges={visual.edges}
          selector={visual.selector}
          height={visual.height}
        />
      )
    case 'animated_loop':
      return <AnimatedLoop stages={visual.stages} />
    case 'flow_walkthrough':
      return <FlowWalkthrough steps={visual.steps} codeSamples={codeSamples} />
    case 'comparison_matrix':
      return <ComparisonMatrix columns={visual.columns} rows={visual.rows} />
    case 'decision_tree':
      return <DecisionTree root={visual.root} />
    case 'layered_stack':
      return (
        <LayeredStack
          layers={visual.layers}
          topicHref={(id) => `/${atlasId}/${id}`}
        />
      )
    case 'sequence_trace':
      return <SequenceTrace spans={visual.spans} />
    case 'lifecycle_timeline':
      return <LifecycleTimeline stages={visual.stages} />
    case 'chunk_lab':
      return <ChunkLab document={visual.document} strategies={visual.strategies} />
    case 'vector_space':
      return (
        <VectorSpace
          query={visual.query}
          points={visual.points}
          topK={visual.topK}
          filter={visual.filter}
          groups={visual.groups}
          note={visual.note}
        />
      )
    case 'rank_compare':
      return (
        <RankCompare
          firstStageLabel={visual.firstStageLabel}
          rerankedLabel={visual.rerankedLabel}
          items={visual.items}
          takeaway={visual.takeaway}
        />
      )
    case 'none':
      return null
  }
}
