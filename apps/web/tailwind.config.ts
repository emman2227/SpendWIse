import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#13263F',
        brand: '#0F7B71',
        emerald: '#157B63',
        cream: '#F8F5ED',
        paper: '#FFFDF9',
        sage: '#DFE9E0',
        mint: '#D7EAE4',
        cloud: '#EEF3F3',
        line: '#D7E0E3',
        warning: '#CE9844',
        danger: '#C76D58'
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'ui-sans-serif', 'system-ui'],
        display: ['var(--font-fraunces)', 'ui-serif', 'Georgia']
      },
      backgroundImage: {
        aura: 'radial-gradient(circle at top left, rgba(15,123,113,0.18), transparent 36%), radial-gradient(circle at top right, rgba(215,234,228,0.9), transparent 34%)',
        'soft-grid':
          'linear-gradient(rgba(255,255,255,0.38) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.38) 1px, transparent 1px)'
      },
      boxShadow: {
        soft: '0 20px 60px rgba(16, 28, 45, 0.08)',
        lift: '0 28px 80px rgba(16, 28, 45, 0.12)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.65)'
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem'
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
