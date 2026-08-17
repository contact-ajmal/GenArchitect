import type { KeyboardEvent, ReactNode } from 'react'
import { useId, useRef, useState } from 'react'
import clsx from 'clsx'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  defaultTabId?: string
  className?: string
}

/**
 * Accessible tabs following the WAI-ARIA tabs pattern. Roving tabindex with
 * automatic activation: Arrow keys move focus and select, Home/End jump to
 * the first/last tab.
 */
export default function Tabs({ tabs, defaultTabId, className }: TabsProps) {
  const baseId = useId()
  const [active, setActive] = useState(defaultTabId ?? tabs[0]?.id)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  function focusTab(id: string) {
    setActive(id)
    tabRefs.current.get(id)?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = tabs.findIndex((t) => t.id === active)
    if (index < 0) return

    let next = index
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % tabs.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = tabs.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    focusTab(tabs[next].id)
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex gap-1 border-b border-hairline"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el)
                else tabRefs.current.delete(tab.id)
              }}
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              onKeyDown={onKeyDown}
              className={clsx(
                '-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition-colors',
                'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-0',
                selected
                  ? 'border-accent text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
          className="pt-4 focus-visible:outline-none"
        >
          {tab.id === active ? tab.content : null}
        </div>
      ))}
    </div>
  )
}
