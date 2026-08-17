import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ARCHITECTURE_LIST, ARCHITECTURES } from '../data/architectures'
import { Button, Eyebrow, Pill } from '../components/ui'
import AmbientSync from '../components/diagram/AmbientSync'
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '../lib/display'

export default function Home() {
  const byTier = DIFFICULTY_ORDER.map((tier) => ({
    tier,
    items: ARCHITECTURE_LIST.filter((a) => a.difficulty === tier),
  })).filter((g) => g.items.length > 0)

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-hairline">
        <div className="mx-auto grid max-w-content gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:py-24">
          <div>
            <Eyebrow>An enterprise field guide to RAG on AWS</Eyebrow>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Understand modern RAG — and learn to build it.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Nine RAG architectures, from naive to secure agentic multi-KB,
              taught through one real enterprise use case — and built for real on
              Amazon Bedrock AgentCore with the Strands Agents SDK.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/use-case">
                <Button size="lg">
                  Start with the use case
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/catalog">
                <Button size="lg" variant="subtle">
                  Browse the catalog
                </Button>
              </Link>
            </div>
          </div>

          {/* Ambient synced vignette — a live preview of the USP */}
          <div>
            <AmbientSync architecture={ARCHITECTURES.agentic_rag} />
            <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              A node and its exact code lines, highlighted together
            </p>
          </div>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <div className="max-w-3xl">
          <Eyebrow>What it is</Eyebrow>
          <div className="mt-3 space-y-4 text-lg leading-relaxed text-ink-soft">
            <p>
              GenArchitect is a field guide to retrieval-augmented generation for
              people who have to ship it. It walks the full arc — from a naive
              embed-and-retrieve prototype to a secure, guardrailed, agentic
              multi-knowledge-base system — and grounds every step in one
              enterprise scenario, so the patterns aren’t abstract.
            </p>
            <p>
              Each architecture pairs a diagram with the exact reference code
              that implements it, kept in sync so you can see a component light
              up and read the lines that build it. The code is idiomatic Strands
              and AgentCore — reference implementations to adapt, not black
              boxes.
            </p>
            <p>
              It’s written for enterprise architects, platform teams, and GenAI
              leads deciding how to build RAG on AWS. You should leave knowing
              which pattern fits your problem, what it costs in complexity and
              security, and the concrete shape of building it on Bedrock
              AgentCore.
            </p>
          </div>
        </div>
      </section>

      {/* THE USE CASE */}
      <section className="border-y border-hairline bg-neutral-0">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <Eyebrow>The use case</Eyebrow>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
                Meridian Financial Services
              </h2>
              <p className="mt-4 leading-relaxed text-ink-soft">
                An internal knowledge assistant that must give grounded, cited
                answers over policy, product, and compliance documents spread
                across S3, SharePoint, and Confluence — with per-user access,
                auditability, and memory. It’s the thread that ties all nine
                patterns into one story.
              </p>
            </div>
            <Link to="/use-case" className="shrink-0">
              <Button>
                Read the scenario
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* THE CATALOG */}
      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow>The catalog</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
              Nine patterns, foundational to production
            </h2>
          </div>
          <Link
            to="/catalog"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline sm:inline-flex"
          >
            All patterns
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {byTier.map(({ tier, items }) => (
            <div key={tier}>
              <div className="mb-3 flex items-center gap-2">
                <Pill variant="difficulty">{DIFFICULTY_LABELS[tier]}</Pill>
              </div>
              <ul className="space-y-1">
                {items.map((a) => (
                  <li key={a.id}>
                    <Link
                      to={`/architecture/${a.id}`}
                      className="group flex items-center gap-2 rounded-md px-2 py-1.5 font-mono text-sm text-ink-soft transition-colors hover:bg-neutral-100 hover:text-ink"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: a.accentColor }}
                      />
                      <span className="truncate">{a.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* BUILD IT */}
      <section className="border-y border-hairline bg-neutral-0">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <Eyebrow>Build it</Eyebrow>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
                From a first agent to a deployed secure system
              </h2>
              <p className="mt-4 leading-relaxed text-ink-soft">
                A sequential, checkpointed track: your first Strands agent, then
                grounding, multi-source routing, agentic retrieval and memory,
                guardrails and access control, and finally deployment with
                observability and evaluations on AgentCore Runtime.
              </p>
            </div>
            <Link to="/build" className="shrink-0">
              <Button>
                Open the build track
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* NOTEBOOKS */}
      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <Eyebrow>Notebook library</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
              Download an end-to-end notebook and adapt it
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Every pattern, across six enterprise scenarios, as a runnable-shaped
              Jupyter notebook: setup → knowledge base → agent → retrieval →
              evaluation → teardown, with an “adapt here” path to your own corpus.
              Generated from the same code fragments as the composer — one source
              of truth. Reference implementations: verify against current AWS
              docs, and running them creates billable resources.
            </p>
          </div>
          <Link to="/notebooks" className="shrink-0">
            <Button>
              Browse notebooks
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* WHY IT'S CREDIBLE */}
      <section id="about" className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <div className="max-w-3xl">
          <Eyebrow>Why it’s credible</Eyebrow>
          <p className="mt-3 leading-relaxed text-ink-soft">
            The content aims to be accurate to Amazon Bedrock, Bedrock AgentCore,
            and Strands as of its build date, and it’s honest about tradeoffs,
            cost, and security rather than selling a single answer. Every code
            sample is a reference implementation to verify against current AWS
            documentation — APIs and CLIs move quickly — and links point to real
            AWS docs, not invented URLs. GenArchitect is an independent
            educational project; it is not affiliated with, sponsored by, or
            endorsed by Amazon Web Services.
          </p>
        </div>
      </section>
    </div>
  )
}
