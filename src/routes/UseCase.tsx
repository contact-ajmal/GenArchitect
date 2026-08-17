import { Link } from 'react-router-dom'
import {
  ArrowRight,
  FileCheck2,
  History,
  Lock,
  Network,
  Quote,
  ShieldCheck,
  Sprout,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { MERIDIAN } from '../data/meridian'
import { ARCHITECTURES } from '../data/architectures'
import { Button, Card, Eyebrow, Pill } from '../components/ui'
import RagDiagram from '../components/diagram/RagDiagram'
import { DIFFICULTY_LABELS } from '../lib/display'

/**
 * Presentation companion to MERIDIAN.requirements — a "why it's hard" note and
 * an icon per requirement (kept in the same order as the data).
 */
const REQUIREMENT_META: { icon: LucideIcon; whyHard: string }[] = [
  {
    icon: Quote,
    whyHard:
      'Models will happily answer without evidence. Grounding + citations means retrieval quality, not the model, becomes the hard part.',
  },
  {
    icon: Lock,
    whyHard:
      'Access must be enforced at retrieval time, per user — filtering generated text after the fact is not real access control.',
  },
  {
    icon: Network,
    whyHard:
      'Content is spread across S3, SharePoint, and Confluence, each with its own permissions and refresh cadence.',
  },
  {
    icon: FileCheck2,
    whyHard:
      'Every answer must be reconstructable — which sources, which tools, which user — long after it was given.',
  },
  {
    icon: History,
    whyHard:
      'Continuity is useful, but memory must never masquerade as an authoritative fact. Memory ≠ RAG.',
  },
  {
    icon: Network,
    whyHard:
      'As corpora multiply, one blended index degrades; questions must be routed to the right authoritative source.',
  },
  {
    icon: Sprout,
    whyHard:
      'Multi-step reasoning and actions raise the stakes — they need review gates, guardrails, and observability to be safe.',
  },
]

const CONSTRAINT_META: { icon: LucideIcon }[] = [
  { icon: ShieldCheck },
  { icon: FileCheck2 },
  { icon: Wallet },
  { icon: ShieldCheck },
]

function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="max-w-3xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      {children ? (
        <p className="mt-3 text-ink-soft">{children}</p>
      ) : null}
    </div>
  )
}

export default function UseCase() {
  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      {/* HERO */}
      <header className="max-w-3xl">
        <Eyebrow>The use case · Meridian Financial Services</Eyebrow>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          One enterprise problem, solved better at every stage.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          {MERIDIAN.overview}
        </p>
        <p className="mt-4 leading-relaxed text-ink-muted">
          A naive prototype answers a few policy questions and immediately shows
          why it can’t ship: it retrieves anything for anyone, drifts from its
          sources, and has no memory, routing, or audit trail. The rest of this
          page is the journey from that prototype to an assistant Meridian can
          put in front of regulated users — each step a real architecture you
          can study and build.
        </p>
      </header>

      {/* REQUIREMENTS */}
      <section className="mt-16">
        <SectionHeading eyebrow="What it must do" title="Requirements">
          Each requirement is easy to state and hard to satisfy. The reason it’s
          hard is what drives the architecture.
        </SectionHeading>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {MERIDIAN.requirements.map((req, i) => {
            const meta = REQUIREMENT_META[i]
            const Icon = meta?.icon ?? FileCheck2
            return (
              <Card key={i} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-strong">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-ink">{req}</p>
                  {meta ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                      <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                        Why it’s hard —{' '}
                      </span>
                      {meta.whyHard}
                    </p>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CONSTRAINTS */}
      <section className="mt-14">
        <SectionHeading eyebrow="The boundaries" title="Constraints" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MERIDIAN.constraints.map((c, i) => {
            const Icon = CONSTRAINT_META[i]?.icon ?? ShieldCheck
            return (
              <div
                key={i}
                className="rounded-xl border border-hairline bg-neutral-0 p-5"
              >
                <Icon className="h-5 w-5 text-ink-muted" />
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{c}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* THE PROGRESSION */}
      <section className="mt-20">
        <SectionHeading eyebrow="The narrative spine" title="The progression">
          The same problem, nine times, each solution adding one capability —
          from naive RAG to secure agentic multi-KB RAG. Follow it in order, or
          jump into any pattern.
        </SectionHeading>

        <ol className="mt-10 space-y-6">
          {MERIDIAN.stages.map((stage, i) => {
            const arch = ARCHITECTURES[stage.architectureId]
            return (
              <li key={stage.architectureId}>
                <Card className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink font-mono text-sm font-semibold text-neutral-0">
                        {i + 1}
                      </span>
                      <Pill variant="difficulty">
                        {DIFFICULTY_LABELS[arch.difficulty]}
                      </Pill>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-ink">
                      {arch.name}
                    </h3>
                    <p className="mt-1 text-sm text-ink-muted">{arch.tagline}</p>
                    <p className="mt-3 leading-relaxed text-ink-soft">
                      <span className="font-mono text-[11px] uppercase tracking-wide text-accent-strong">
                        What it adds —{' '}
                      </span>
                      {stage.whatItAdds}
                    </p>
                    <Link
                      to={`/architecture/${arch.id}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
                    >
                      Study {arch.name}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  <div
                    className="max-h-[200px] overflow-hidden rounded-lg border border-hairline bg-neutral-50 p-2"
                    aria-hidden="true"
                  >
                    <RagDiagram architecture={arch} />
                  </div>
                </Card>
              </li>
            )
          })}
        </ol>
      </section>

      {/* CTA */}
      <section className="mt-20 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-neutral-0 p-8">
          <div>
            <h3 className="text-xl font-semibold text-ink">
              Browse the full catalog
            </h3>
            <p className="mt-2 text-ink-soft">
              All nine patterns, filterable by difficulty and AWS service, with
              mini diagrams and tradeoffs.
            </p>
          </div>
          <Link to="/catalog" className="mt-6">
            <Button>
              Open the catalog
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-hairline bg-neutral-0 p-8">
          <div>
            <h3 className="text-xl font-semibold text-ink">
              Build the end-state
            </h3>
            <p className="mt-2 text-ink-soft">
              A hands-on path to the secure agentic-RAG assistant on AgentCore +
              Strands, stage by stage.
            </p>
          </div>
          <Link to="/build" className="mt-6">
            <Button variant="subtle">
              Start the build track
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
