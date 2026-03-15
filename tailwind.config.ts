import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        brand: ['Syne', 'sans-serif'],
        ui: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display': ['42px', { lineHeight: '1', letterSpacing: '-1.5px', fontWeight: '700' }],
        'h1':      ['26px', { lineHeight: '1.2', letterSpacing: '-0.5px', fontWeight: '700' }],
        'h2':      ['22px', { lineHeight: '1.25', letterSpacing: '-0.3px', fontWeight: '700' }],
        'h3':      ['17px', { lineHeight: '1.3', fontWeight: '700' }],
        'title':   ['15px', { lineHeight: '1.4', fontWeight: '600' }],
        'body':    ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '1.4', letterSpacing: '0.8px', fontWeight: '700' }],
        'micro':   ['10px', { lineHeight: '1.3', letterSpacing: '0.5px', fontWeight: '600' }],
      },
      colors: {
        primary:   { DEFAULT: '#4C44AA', 2: '#6860C8', 3: '#8880DE' },
        success:   { DEFAULT: '#0A5C45', 2: '#1DAD87' },
        error:     { DEFAULT: '#8B2020', 2: '#D95C5C' },
        bg:        'var(--bg)',
        surface:   'var(--surface)',
        border:    'var(--border)',
        text: {
          DEFAULT: 'var(--text)',
          2:       'var(--text-2)',
          3:       'var(--text-3)',
        },
        green: {
          DEFAULT: 'var(--green)',
          bg:      'var(--green-bg)',
        },
        red: {
          DEFAULT: 'var(--red)',
          bg:      'var(--red-bg)',
        },
      },
      borderRadius: {
        phone: '48px',
        card: '20px',
        modal: '28px',
        input: '14px',
        btn: '16px',
        tab: '28px',
        pill: '100px',
        icon: '14px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} satisfies Config
