/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens — reference CSS variables defined in index.css
        wb: {
          bg:          'var(--bg)',
          bg2:         'var(--bg-2)',
          panel:       'var(--bg-panel)',
          elevated:    'var(--bg-elevated)',
          border:      'var(--border)',
          border2:     'var(--border-2)',
          text:        'var(--text)',
          text2:       'var(--text-2)',
          muted:       'var(--text-muted)',
          accent:      'var(--accent)',
          success:     'var(--success)',
          warning:     'var(--warning)',
          error:       'var(--error)',
        },
        accent: {
          primary: '#4f6ef7',
          success: '#22c55e',
          warning: '#f59e0b',
          error:   '#ef4444',
          info:    '#06b6d4',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-in-out',
        'slide-in':   'slideIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn:     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn:    { '0%': { transform: 'translateY(-4px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseSoft:  { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
    },
  },
  plugins: [],
};
