import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'ghost' | 'subtle'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children?: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-neutral-0 hover:bg-accent-strong shadow-sm',
  ghost:
    'bg-transparent text-ink hover:bg-neutral-100 border border-transparent',
  subtle: 'bg-neutral-100 text-ink hover:bg-neutral-200 border border-hairline',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

/**
 * Primary interactive control. Three restrained variants, three sizes, and a
 * clearly visible focus ring (from the global :focus-visible token).
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-0',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  )
})

export default Button
