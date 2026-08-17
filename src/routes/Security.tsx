import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, ShieldCheck, Square } from 'lucide-react'
import {
  COMPLIANCE_CHECKLIST,
  SECURITY_CONTROLS,
} from '../data/security'
import { ARCHITECTURES } from '../data/architectures'
import { verificationForServices } from '../data/verification'
import { Button, Callout, Eyebrow } from '../components/ui'
import RagDiagram from '../components/diagram/RagDiagram'
import CodeBlock from '../components/code/CodeBlock'

const CHECKLIST_KEY = 'genarchitect:security:checklist'

function loadChecked(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(CHECKLIST_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export default function Security() {
  const secureArch = ARCHITECTURES.guardrailed_secure_rag
  const [activeId, setActiveId] = useState(SECURITY_CONTROLS[0].id)
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked)

  const control = useMemo(
    () => SECURITY_CONTROLS.find((c) => c.id === activeId) ?? SECURITY_CONTROLS[0],
    [activeId],
  )

  useEffect(() => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checked))
  }, [checked])

  const doneCount = COMPLIANCE_CHECKLIST.filter((i) => checked[i.id]).length

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent-strong" />
          <Eyebrow>Security &amp; compliance</Eyebrow>
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Where enterprise RAG passes — or fails — review
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Meridian is financial services, so security isn’t a feature — it’s the
          gate. Explore each control on the secure end-state diagram, see what
          breaks without it, and walk a compliance checklist before you ship.
        </p>
      </header>

      {/* Security overlay */}
      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="overflow-hidden rounded-xl border border-hairline bg-neutral-0 p-3">
          <RagDiagram
            architecture={secureArch}
            highlightedComponentIds={control.components}
          />
        </div>
        <nav aria-label="Security controls" className="flex flex-col gap-1">
          {SECURITY_CONTROLS.map((c) => {
            const active = c.id === control.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                aria-current={active ? 'true' : undefined}
                className={
                  'rounded-lg px-3 py-2 text-left text-sm transition-colors ' +
                  (active
                    ? 'bg-neutral-100 font-medium text-ink'
                    : 'text-ink-muted hover:bg-neutral-100 hover:text-ink')
                }
              >
                {c.title}
              </button>
            )
          })}
        </nav>
      </section>

      {/* Active control detail */}
      <section className="mt-6">
        <div className="rounded-xl border border-hairline bg-neutral-0 p-6">
          <h2 className="text-xl font-semibold text-ink">{control.title}</h2>
          <p className="mt-2 leading-relaxed text-ink">{control.plain}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {control.technical}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-mono text-[11px] uppercase tracking-wide text-emerald-700">
                What it protects
              </p>
              <p className="mt-1.5 text-sm text-ink-soft">{control.whatItProtects}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-mono text-[11px] uppercase tracking-wide text-amber-700">
                What breaks without it
              </p>
              <p className="mt-1.5 text-sm text-ink-soft">
                {control.whatBreaksWithout}{' '}
                {control.failureModeId ? (
                  <Link to="/failure-modes" className="text-accent-strong hover:underline">
                    See the failure mode →
                  </Link>
                ) : null}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-hairline bg-accent/[0.04] p-4">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              In the Meridian scenario
            </p>
            <p className="mt-1.5 text-sm text-ink-soft">{control.meridian}</p>
          </div>

          {control.fragment ? (
            <div className="mt-5">
              <CodeBlock
                language={control.fragment.language}
                code={control.fragment.code}
                filename={control.fragment.filename}
                verification={
                  verificationForServices(control.awsServiceIds) ?? undefined
                }
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Compliance checklist */}
      <section className="mt-14">
        <Eyebrow>Before you ship</Eyebrow>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            Compliance checklist
          </h2>
          <span className="font-mono text-sm text-ink-muted">
            {doneCount}/{COMPLIANCE_CHECKLIST.length} complete
          </span>
        </div>
        <ul className="mt-5 flex flex-col gap-2">
          {COMPLIANCE_CHECKLIST.map((item) => {
            const on = !!checked[item.id]
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() =>
                    setChecked((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                  }
                  aria-pressed={on}
                  className="flex w-full items-start gap-3 rounded-xl border border-hairline bg-neutral-0 p-4 text-left transition-colors hover:border-neutral-300"
                >
                  {on ? (
                    <CheckSquare className="mt-0.5 h-5 w-5 shrink-0 text-accent-strong" />
                  ) : (
                    <Square className="mt-0.5 h-5 w-5 shrink-0 text-neutral-300" />
                  )}
                  <span
                    className={
                      'text-sm leading-relaxed ' +
                      (on ? 'text-ink-muted line-through' : 'text-ink')
                    }
                  >
                    {item.text}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="mt-6">
          <Callout variant="security" title="Honest scope">
            This checklist is a starting point grounded in the controls above —
            not a certification. Security content is accurate to real AWS
            mechanisms, but always confirm against current documentation and your
            own compliance requirements.
          </Callout>
        </div>

        <div className="mt-6">
          <Link to="/architecture/guardrailed_secure_rag">
            <Button>See the secure end-state pattern</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
