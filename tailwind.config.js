import colors from 'tailwindcss/colors'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // All colors are driven by CSS variables defined in src/index.css (:root).
        // The `<alpha-value>` placeholder lets Tailwind opacity modifiers work.
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          strong: 'rgb(var(--accent-strong) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
        },
        // Keep the full default amber scale (50–950) and add a token-driven
        // DEFAULT so `amber`, `amber-50`, `amber-600` all resolve.
        amber: {
          ...colors.amber,
          DEFAULT: 'rgb(var(--amber) / <alpha-value>)',
        },
        // AWS-adjacent layer: navy base + warm signal-orange accent.
        navy: {
          DEFAULT: 'rgb(var(--navy) / <alpha-value>)',
          soft: 'rgb(var(--navy-soft) / <alpha-value>)',
        },
        signal: {
          DEFAULT: 'rgb(var(--signal) / <alpha-value>)',
          strong: 'rgb(var(--signal-strong) / <alpha-value>)',
        },
        neutral: {
          0: 'rgb(var(--neutral-0) / <alpha-value>)',
          50: 'rgb(var(--neutral-50) / <alpha-value>)',
          100: 'rgb(var(--neutral-100) / <alpha-value>)',
          200: 'rgb(var(--neutral-200) / <alpha-value>)',
          300: 'rgb(var(--neutral-300) / <alpha-value>)',
          500: 'rgb(var(--neutral-500) / <alpha-value>)',
          700: 'rgb(var(--neutral-700) / <alpha-value>)',
          900: 'rgb(var(--neutral-900) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderColor: {
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
}
