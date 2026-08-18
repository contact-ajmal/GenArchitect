import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'model-providers'
const DOCS = 'https://strandsagents.com/'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'strands', sectionId: S })

export const modelProviders: AtlasSection = {
  id: S,
  atlasId: 'strands',
  title: 'Model providers',
  order: 5,
  blurb: 'Amazon Bedrock by default, plus many partner providers — and what stays the same when you switch.',
  topics: [
    t({
      id: 'providers',
      title: 'Choosing a model provider',
      oneLiner:
        'Bedrock is the default; many other providers are supported, and the agent code barely changes.',
      whyItMatters:
        'Provider choice affects cost, latency, data residency, and capability — but Strands keeps it a one-line swap so it doesn’t leak into your agent logic.',
      explanation: {
        plain:
          'Strands works with Amazon Bedrock out of the box and supports many other model providers too. You pick a provider when you create the model; the rest of your agent — prompt, tools, loop — stays identical.',
        technical:
          'The model is an injectable component. `BedrockModel` targets Amazon Bedrock (the default for AWS deployments); provider classes exist for Anthropic, OpenAI, Meta, Cohere, Mistral, Writer, Baseten, and others. Because tools, prompts, and the loop are provider-agnostic, switching providers is a change at the model boundary only — useful for cost/latency tuning or keeping inference within a specific environment.',
      },
      visual: {
        kind: 'comparison_matrix',
        columns: ['Amazon Bedrock (default)', 'Partner providers'],
        rows: [
          { label: 'Where it runs', cells: [{ text: 'In your AWS account/region', tone: 'good' }, { text: 'The provider’s API', tone: 'neutral' }] },
          { label: 'Examples', cells: ['Claude, Nova/Titan, Llama, Cohere via Bedrock', 'Anthropic, OpenAI, Meta, Cohere, Mistral, Writer, Baseten…'] },
          { label: 'Agent code changes', cells: [{ text: 'None beyond the model line', tone: 'good' }, { text: 'None beyond the model line', tone: 'good' }] },
          { label: 'Data residency', cells: [{ text: 'Stays in AWS', tone: 'good' }, { text: 'Depends on the provider', tone: 'bad' }], note: 'Matters for regulated workloads like Meridian.' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['models', 'bedrock', 'providers'],
      relatedTopicIds: ['agent-composition'],
      appliedIn: [{ label: 'Data-residency in the Meridian scenario', to: '/security' }],
    }),
  ],
}
