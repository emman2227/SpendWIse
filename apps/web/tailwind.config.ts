import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F172A',
        brand: '#0F766E',
        sand: '#F6F3EC',
        accent: '#F59E0B',
        mist: '#E2E8F0'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui']
      },
      backgroundImage: {
        mesh: 'radial-gradient(circle at top left, rgba(15,118,110,0.18), transparent 40%), radial-gradient(circle at top right, rgba(245,158,11,0.16), transparent 30%)'
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
