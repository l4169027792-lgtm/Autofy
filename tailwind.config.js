/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        red: {
          DEFAULT: '#C8102E',
          dark: '#9E0B22',
          light: 'rgba(200,16,46,0.09)',
        },
        black: '#0A0808',
        charcoal: '#1A1010',
        ink: '#2A1F1F',
        'off-white': '#FAF8F6',
        warm: '#F5F1EC',
        green: '#0A6B2E',
        'green-light': 'rgba(10,107,46,0.09)',
        gold: '#B8860B',
        'gold-light': 'rgba(184,134,11,0.1)',
        text: '#1A1414',
        'text-2': '#5A4E4E',
        'text-3': '#9A8E8E',
        border: 'rgba(30,20,20,0.09)',
        'border-2': 'rgba(30,20,20,0.16)',
      },
      fontFamily: {
        serif: ['DM Serif Display', 'Georgia', 'serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        accent: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      boxShadow: {
        DEFAULT: '0 4px 24px rgba(0,0,0,0.07)',
        lg: '0 12px 48px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}
