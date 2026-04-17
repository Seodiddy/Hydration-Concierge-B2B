/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Default Hydration H2 brand palette — overridable per operator via CSS vars
        h2: {
          primary: 'var(--h2-primary, #0066CC)',
          accent: 'var(--h2-accent, #00A3E0)',
          bg: 'var(--h2-bg, #F7FAFC)',
          surface: 'var(--h2-surface, #FFFFFF)',
          text: 'var(--h2-text, #1A202C)',
          muted: 'var(--h2-muted, #718096)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-dot': 'pulseDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 80%, 100%': { opacity: 0.3 },
          '40%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
