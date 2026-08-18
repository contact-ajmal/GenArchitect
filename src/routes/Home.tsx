import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Compass,
  DollarSign,
  ExternalLink,
  Gauge,
  Layers,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { ARCHITECTURE_LIST } from '../data/architectures'
import { Button, Eyebrow, Pill } from '../components/ui'
import AmbientSync from '../components/diagram/AmbientSync'
import AwsServiceIcon from '../components/aws/AwsServiceIcon'
import { ARCHITECTURES } from '../data/architectures'
import { BRAND, COVERAGE_GROUPS } from '../config/brand'
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '../lib/display'

export default function Home() {
  const byTier = DIFFICULTY_ORDER.map((tier) => ({
    tier,
    items: ARCHITECTURE_LIST.filter((a) => a.difficulty === tier),
  })).filter((g) => g.items.length > 0)

  return (
    <div>
      {/* 1. HERO */}
      <section className="border-b border-hairline bg-navy text-neutral-0">
        {/* Non-affiliation — visible immediately, before anything else */}
        <div className="border-b border-neutral-0/10">
          <p className="mx-auto max-w-content px-4 py-2 text-center text-[11px] leading-relaxed text-neutral-300 sm:px-6">
            {BRAND.disclaimer}
          </p>
        </div>
        <div className="mx-auto grid max-w-content gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:py-24">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal">
              {BRAND.tagline}
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {BRAND.heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-neutral-200">
              {BRAND.heroPositioning}
            </p>
            <p className="mt-3 max-w-xl leading-relaxed text-neutral-300">
              {BRAND.heroSubhead}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/catalog">
                <Button size="lg">
                  Explore the architectures
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                to="/compose"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-neutral-0/30 px-6 text-base font-medium text-neutral-0 transition-colors hover:bg-neutral-0/10"
              >
                Compose your own
              </Link>
            </div>
          </div>

          {/* Ambient synced vignette — diagrams now carry AWS icons + mono labels */}
          <div>
            <AmbientSync architecture={ARCHITECTURES.agentic_rag} />
            <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-wide text-neutral-300">
              A node and its exact reference code, highlighted together
            </p>
          </div>
        </div>
      </section>

      {/* 2. AWS SERVICE COVERAGE STRIP */}
      <section className="border-b border-hairline bg-neutral-0">
        <div className="mx-auto max-w-content px-4 py-14 sm:px-6">
          <Eyebrow>AWS services covered</Eyebrow>
          <h2 className="mt-2 max-w-3xl text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            The stack GenArchitect teaches, end to end
          </h2>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Every pattern, atlas, and notebook is grounded in these services.
            Official names, official Architecture Icons.
          </p>

          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {COVERAGE_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="flex items-baseline justify-between gap-2 border-b border-hairline pb-1.5">
                  <h3 className="font-display text-sm font-semibold text-ink">
                    {group.title}
                  </h3>
                  {group.note ? (
                    <span className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                      {group.note}
                    </span>
                  ) : null}
                </div>
                <ul className="mt-3 flex flex-col gap-1">
                  {group.items.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.to}
                        className="group flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-neutral-100"
                      >
                        <AwsServiceIcon
                          iconId={item.iconId}
                          name={item.name}
                          size={22}
                          className="shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-[12px] text-ink">
                            {item.name}
                          </span>
                          <span className="block truncate text-xs text-ink-muted">
                            {item.role}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. WHAT IT IS */}
      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <div className="max-w-3xl">
          <Eyebrow>What it is</Eyebrow>
          <div className="mt-3 space-y-4 text-lg leading-relaxed text-ink-soft">
            <p>
              GenArchitect is a working studio for retrieval-augmented and
              agentic systems on AWS. It covers nine RAG patterns, from a naive
              embed-and-retrieve prototype to a secure, guardrailed, agentic
              multi-knowledge-base system — each with the tradeoffs an architect
              has to defend and the reference code that implements it.
            </p>
            <p>
              Two visual atlases cover the complete Amazon Bedrock AgentCore and
              Strands Agents surfaces — the agent loop, memory, Gateway, identity,
              observability, evaluations — taught in original words with
              interactive visuals, linking out to the canonical documentation for
              exact syntax.
            </p>
            <p>
              A composer assembles an architecture from components and generates
              the matching diagram and idiomatic Strands + AgentCore reference
              code live, and a library of downloadable, end-to-end notebooks turns
              any pattern into a runnable-shaped starting point for your team.
            </p>
            <p>
              You leave with three things: a defensible pattern choice for your
              workload, the reference implementation to hand your build team, and
              the operational picture — security, cost, and observability — you’re
              accountable for.
            </p>
          </div>
        </div>
      </section>

      {/* 4. BUILT FOR AWS ARCHITECTS */}
      <section className="border-y border-hairline bg-neutral-0">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <Eyebrow>Built for AWS architects</Eyebrow>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Start where you are
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Compass,
                title: 'Designing a new GenAI workload',
                body: 'Answer a few questions and get a recommended architecture with a traceable rationale and next steps.',
                to: '/review',
                cta: 'Open the review',
              },
              {
                icon: TriangleAlert,
                title: 'Evaluating an existing RAG implementation',
                body: 'Walk the real failure modes — no reranking, single-shot retrieval, missing ACLs — and how each is fixed.',
                to: '/failure-modes',
                cta: 'Open the failure-mode lab',
              },
              {
                icon: Boxes,
                title: 'Learning AgentCore and Strands',
                body: 'Two visual atlases covering the complete AgentCore and Strands surfaces, linked to canonical docs.',
                to: '/agentcore',
                cta: 'Open the atlases',
              },
            ].map((card) => (
              <Link
                key={card.title}
                to={card.to}
                className="group flex flex-col rounded-xl border border-hairline bg-neutral-0 p-6 transition-shadow hover:shadow-md"
              >
                <card.icon className="h-6 w-6 text-accent-strong" />
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                  {card.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                  {card.body}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong">
                  {card.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. THE ENTERPRISE USE CASE */}
      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <Eyebrow>The enterprise use case</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
              The workload you actually get handed
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Meridian Financial Services needs an internal assistant over policy,
              product, and compliance documents spread across Amazon S3,
              SharePoint, and Confluence — with per-user access control,
              auditability, and room to grow into agentic action. It’s the thread
              that runs through all nine patterns, so every design decision has a
              concrete workload behind it.
            </p>
          </div>
          <Link to="/use-case" className="shrink-0">
            <Button>
              Read the scenario
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 6. WELL-ARCHITECTED FRAMING */}
      <section className="border-y border-hairline bg-neutral-0">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <Eyebrow>The concerns you answer for</Eyebrow>
          <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-ink">
            Mapped to the pillars an architect is accountable for
          </h2>
          <p className="mt-3 max-w-2xl text-ink-soft">
            GenArchitect organizes its content around the same concerns you weigh
            in any serious design review.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShieldCheck, pillar: 'Security', body: 'Document-level access control, Bedrock Guardrails, and IAM via Gateway.', to: '/security' },
              { icon: Gauge, pillar: 'Operational excellence', body: 'AgentCore Observability, Evaluations, and end-to-end tracing.', to: '/evaluate' },
              { icon: DollarSign, pillar: 'Cost optimization', body: 'Relative cost drivers and managed vs. customer-managed tradeoffs.', to: '/catalog' },
              { icon: TriangleAlert, pillar: 'Reliability', body: 'Failure modes and the component change that resolves each.', to: '/failure-modes' },
              { icon: Gauge, pillar: 'Performance efficiency', body: 'Retrieval precision, reranking, and agentic-retrieval tradeoffs.', to: '/architecture/hybrid_rerank_rag' },
              { icon: Layers, pillar: 'Composability', body: 'Compose a pattern from components and see the code assemble.', to: '/compose' },
            ].map((p) => (
              <Link
                key={p.pillar}
                to={p.to}
                className="group rounded-xl border border-hairline bg-neutral-0 p-5 transition-shadow hover:shadow-md"
              >
                <p.icon className="h-5 w-5 text-accent-strong" />
                <h3 className="mt-3 font-semibold text-ink">{p.pillar}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{p.body}</p>
              </Link>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm text-ink-muted">
            These map to the concerns AWS architects weigh in design reviews.
            GenArchitect is an independent educational tool — it does not perform
            or represent any official AWS Well-Architected review, and implies no
            AWS endorsement.
          </p>
        </div>
      </section>

      {/* 7. NOTEBOOKS & ARTIFACTS */}
      <section className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <Eyebrow>Notebooks &amp; artifacts</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
              What you hand your build team
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              Every pattern exports as a downloadable, end-to-end Jupyter notebook
              — setup, knowledge base, agent, retrieval, evaluation, teardown —
              across six enterprise scenarios, plus a reference repo-scaffold zip.
              All compiled from the same code fragments as the composer, so nothing
              drifts between the diagram, the docs, and the code.
            </p>
            <p className="mt-3 text-sm text-ink-muted">
              Plus a{' '}
              <Link to="/videos" className="text-accent-strong hover:underline">
                curated video library
              </Link>{' '}
              of talks and demos, refreshed daily, and{' '}
              <Link to="/use-cases" className="text-accent-strong hover:underline">
                real-world case studies
              </Link>{' '}
              of GenAI agents deployed across industries.
            </p>
          </div>
          <Link to="/notebooks" className="shrink-0">
            <Button>
              Browse notebooks
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {byTier.map(({ tier, items }) => (
            <div key={tier}>
              <div className="mb-3">
                <Pill variant="difficulty">{DIFFICULTY_LABELS[tier]}</Pill>
              </div>
              <ul className="space-y-1">
                {items.map((a) => (
                  <li key={a.id}>
                    <Link
                      to={`/architecture/${a.id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 font-mono text-sm text-ink-soft transition-colors hover:bg-neutral-100 hover:text-ink"
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

      {/* 8. CREDIBILITY & HONESTY */}
      <section id="about" className="border-t border-hairline bg-neutral-0">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
          <Eyebrow>Credibility &amp; honesty</Eyebrow>
          <div className="mt-3 grid gap-8 lg:grid-cols-2">
            <ul className="space-y-3 text-ink-soft">
              {[
                'Original explanations, linking to the canonical AWS documentation for exact syntax — not a copy of the docs.',
                'Every code sample carries a verified-against-docs date and a volatility flag, so you can trust what’s stable and re-check what drifts.',
                'Coverage maps make completeness auditable — nothing is silently missing.',
                'Reference implementations to verify before production. Running the notebooks creates billable AWS resources.',
              ].map((line, i) => (
                <li key={i} className="flex gap-2.5">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
                  <span className="leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-hairline bg-neutral-50 p-5">
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                  Non-affiliation
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {BRAND.disclaimer}
                </p>
                <Link
                  to="/accuracy"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
                >
                  How we handle accuracy
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Optional AWS Community Builder badge — off by default */}
              {BRAND.communityBuilder.enabled && BRAND.communityBuilder.assetPath ? (
                <a
                  href={BRAND.communityBuilder.profileUrl || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-hairline p-3"
                >
                  <img
                    src={BRAND.communityBuilder.assetPath}
                    alt="AWS Community Builder"
                    className="h-10 w-auto"
                  />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
