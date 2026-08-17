import { ExternalLink } from 'lucide-react'
import { AWS_SERVICES } from '../data/services'
import { VERIFICATION, volatilityLabel } from '../data/verification'
import type { Volatility } from '../data/verification'
import type { AwsServiceId } from '../types'
import { Eyebrow, Pill } from '../components/ui'

const ORDER: Volatility[] = ['volatile', 'moderate', 'stable']

export default function Accuracy() {
  const ids = Object.keys(AWS_SERVICES) as AwsServiceId[]
  const grouped = ORDER.map((v) => ({
    volatility: v,
    items: ids.filter((id) => VERIFICATION[id].volatility === v),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <Eyebrow>About accuracy</Eyebrow>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          How we handle a fast-moving target
        </h1>
        <div className="mt-4 space-y-4 text-lg leading-relaxed text-ink-soft">
          <p>
            Amazon Bedrock, Bedrock AgentCore, and the Strands SDK evolve
            quickly. Rather than pretend otherwise, GenArchitect makes
            verification a visible feature: every code sample and AWS claim shows
            when it was last checked, how likely the exact syntax is to drift,
            and a link to the canonical documentation so you can confirm.
          </p>
          <p>
            Content was verified against AWS documentation as of the dates shown.
            Concepts (the agent loop, Memory ≠ RAG, Managed vs customer-managed
            knowledge bases, Retrieve vs Agentic Retrieval) are stable; specific
            CLI subcommands and new API parameters are the parts most likely to
            change, and they’re flagged as such. Treat every snippet as a
            reference implementation to confirm — never as copy-paste-ready
            production code.
          </p>
          <p>
            GenArchitect is an independent educational project. It is not
            affiliated with, sponsored by, or endorsed by Amazon Web Services,
            and it links only to real AWS and vendor documentation.
          </p>
        </div>
      </header>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Verification by building block
        </h2>
        <div className="mt-6 space-y-8">
          {grouped.map((group) => (
            <div key={group.volatility}>
              <div className="mb-3 flex items-center gap-2">
                <Pill variant={group.volatility === 'volatile' ? 'aws' : 'neutral'}>
                  {volatilityLabel(group.volatility)}
                </Pill>
                <span className="text-sm text-ink-muted">
                  {group.items.length} services
                </span>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {group.items.map((id) => {
                  const rec = VERIFICATION[id]
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-neutral-0 px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">
                          {AWS_SERVICES[id].name}
                        </span>
                        <span className="font-mono text-[11px] text-ink-muted">
                          verified {rec.lastVerified}
                        </span>
                      </span>
                      <a
                        href={rec.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent-strong hover:underline"
                      >
                        docs
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
