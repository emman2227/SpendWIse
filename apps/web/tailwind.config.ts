import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          strong: 'var(--brand-strong)',
        },
        emerald: 'var(--emerald)',
        cream: 'var(--bg)',
        paper: {
          DEFAULT: 'var(--paper)',
          strong: 'var(--paper-strong)',
        },
        'surface-muted': 'var(--surface-muted)',
        sage: 'var(--surface-muted)',
        mint: 'var(--surface-mint)',
        cloud: 'var(--surface-muted)',
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'ui-sans-serif', 'system-ui'],
        display: ['var(--font-fraunces)', 'ui-serif', 'Georgia'],
      },
      backgroundImage: {
        aura: 'radial-gradient(circle at top left, rgba(15,123,113,0.18), transparent 36%), radial-gradient(circle at top right, rgba(215,234,228,0.9), transparent 34%)',
        'soft-grid':
          'linear-gradient(rgba(255,255,255,0.38) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.38) 1px, transparent 1px)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        lift: 'var(--shadow-lift)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.65)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
