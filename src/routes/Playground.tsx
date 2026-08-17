import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FlaskConical, Loader2, Sparkles } from 'lucide-react'
import type { ModelProvider, ProviderKind, RetrievedSnippet } from '../lib/playground'
import {
  buildGroundedPrompt,
  createArtifactsProvider,
  createCustomProvider,
  lexicalRetrieve,
  splitCorpus,
} from '../lib/playground'
import { Button, Callout, Eyebrow } from '../components/ui'

const ENDPOINT_KEY = 'genarchitect:pg:endpoint'

const SAMPLE_CORPUS = `Travel expense policy: Employees are reimbursed for economy airfare and standard hotel rates. Meals are capped at 60 USD per day for domestic travel and 80 USD for international travel.

Data retention policy (EU): Client records for EU customers are retained for seven years after account closure, then permanently deleted. Deletion requests are honored within 30 days.

Remote work policy: Employees may work remotely up to three days per week with manager approval. Equipment stipends are provided once per two years.`

export default function Playground() {
  const [providerKind, setProviderKind] = useState<ProviderKind | 'none'>('none')
  const [endpoint, setEndpoint] = useState(
    () => localStorage.getItem(ENDPOINT_KEY) ?? '',
  )
  const [corpus, setCorpus] = useState(SAMPLE_CORPUS)
  const [question, setQuestion] = useState(
    'How long do we keep EU client records?',
  )
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [retrieved, setRetrieved] = useState<RetrievedSnippet[]>([])
  const [error, setError] = useState<string | null>(null)

  const provider: ModelProvider | null = useMemo(() => {
    if (providerKind === 'custom' && endpoint.trim())
      return createCustomProvider(endpoint.trim())
    if (providerKind === 'artifacts') return createArtifactsProvider()
    return null
  }, [providerKind, endpoint])

  const snippets = useMemo(() => splitCorpus(corpus), [corpus])
  const canRun = provider !== null && snippets.length > 0 && question.trim().length > 0

  const saveEndpoint = (value: string) => {
    setEndpoint(value)
    localStorage.setItem(ENDPOINT_KEY, value)
  }

  async function run() {
    if (!provider) return
    setLoading(true)
    setError(null)
    setAnswer(null)
    const hits = lexicalRetrieve(question, snippets, 3)
    setRetrieved(hits)
    const { system, user } = buildGroundedPrompt(question, hits)
    try {
      const text = await provider.complete(system, user)
      setAnswer(text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The model call failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-accent-strong" />
          <Eyebrow>Optional · experimental</Eyebrow>
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Playground
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          A tiny, illustrative RAG loop: paste a few snippets, ask a question,
          and see retrieval feed a grounded answer. It’s a teaching toy, not the
          AgentCore/Bedrock path the rest of this guide teaches.
        </p>
      </header>

      <div className="mt-6 max-w-3xl">
        <Callout variant="warning" title="What this is (and isn’t)">
          <ul className="list-disc space-y-1 pl-4">
            <li>
              Retrieval here is a <strong>lexical keyword match</strong> in your
              browser — a labeled stand-in, not embeddings or a vector store.
            </li>
            <li>
              The model call runs through a provider <em>you</em> configure. This
              UI never asks for or stores an API key.
            </li>
            <li>
              The core app never depends on this page. For the real pattern, see
              the{' '}
              <Link to="/build" className="text-accent-strong underline">
                build track
              </Link>
              .
            </li>
          </ul>
        </Callout>
      </div>

      {/* Provider configuration */}
      <section className="mt-10 rounded-xl border border-hairline bg-neutral-0 p-6">
        <h2 className="text-lg font-semibold text-ink">1 · Configure a model provider</h2>
        <p className="mt-1 text-sm text-ink-muted">
          No provider is selected by default. Pick one to enable the demo.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-start gap-3">
            <input
              type="radio"
              name="provider"
              checked={providerKind === 'custom'}
              onChange={() => setProviderKind('custom')}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-ink">Custom endpoint (proxy)</span>
              <span className="block text-sm text-ink-muted">
                A URL you control that accepts <code>{'{ system, prompt }'}</code>{' '}
                and returns text. Keep any credentials server-side in the proxy.
              </span>
            </span>
          </label>
          {providerKind === 'custom' ? (
            <input
              type="url"
              inputMode="url"
              placeholder="https://your-proxy.example.com/complete"
              value={endpoint}
              onChange={(e) => saveEndpoint(e.target.value)}
              className="ml-7 h-10 rounded-md border border-hairline bg-neutral-50 px-3 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent"
            />
          ) : null}

          <label className="flex items-start gap-3">
            <input
              type="radio"
              name="provider"
              checked={providerKind === 'artifacts'}
              onChange={() => setProviderKind('artifacts')}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-ink">
                Claude artifact environment
              </span>
              <span className="block text-sm text-ink-muted">
                Uses the in-artifact fetch pattern (no API key in code). Only
                works when this app runs inside a Claude artifact.
              </span>
            </span>
          </label>
        </div>

        {providerKind === 'none' ? (
          <p className="mt-4 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-ink-muted">
            Select a provider above to enable the demo.
          </p>
        ) : null}
      </section>

      {/* Corpus + question */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-neutral-0 p-6">
          <label htmlFor="corpus" className="text-lg font-semibold text-ink">
            2 · Sample corpus
          </label>
          <p className="mt-1 text-sm text-ink-muted">
            One snippet per paragraph (separated by a blank line).
          </p>
          <textarea
            id="corpus"
            value={corpus}
            onChange={(e) => setCorpus(e.target.value)}
            rows={10}
            className="mt-3 w-full rounded-md border border-hairline bg-neutral-50 p-3 font-mono text-xs leading-relaxed text-ink focus-visible:ring-2 focus-visible:ring-accent"
          />
          <p className="mt-2 font-mono text-[11px] text-ink-muted">
            {snippets.length} snippet{snippets.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex flex-col rounded-xl border border-hairline bg-neutral-0 p-6">
          <label htmlFor="question" className="text-lg font-semibold text-ink">
            3 · Ask a question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="mt-3 w-full rounded-md border border-hairline bg-neutral-50 p-3 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent"
          />
          <div className="mt-4">
            <Button onClick={run} disabled={!canRun || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Run RAG loop
                </>
              )}
            </Button>
            {!canRun && providerKind !== 'none' ? (
              <p className="mt-2 text-sm text-ink-muted">
                {provider === null
                  ? 'Enter your endpoint URL to enable the demo.'
                  : 'Add a corpus and a question to run.'}
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="mt-4">
              <Callout variant="warning" title="Model call failed">
                {error}
              </Callout>
            </div>
          ) : null}

          {retrieved.length > 0 ? (
            <div className="mt-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                Retrieved context (lexical)
              </p>
              <ul className="mt-2 space-y-1.5">
                {retrieved.map((r, i) => (
                  <li
                    key={r.snippet.id}
                    className="rounded-md border border-hairline bg-neutral-50 p-2 text-xs text-ink-soft"
                  >
                    <span className="font-mono text-ink-muted">[{i + 1}]</span>{' '}
                    {r.snippet.text}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {answer ? (
            <div className="mt-5 rounded-lg border border-accent/30 bg-accent/[0.05] p-4">
              <p className="font-mono text-[11px] uppercase tracking-wide text-accent-strong">
                Grounded answer
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {answer}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
