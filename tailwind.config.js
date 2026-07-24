export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg': '#0A0A0B',
        'card': '#141416',
        'text': '#F5F5F0',
        'gold': '#C9A86A',
        'neon': '#4ade80'
      },
      fontFamily: {
        'heading': ['Space Grotesk', 'sans-serif'],
        'body': ['Inter', 'sans-serif']
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.03)' }
        }
      },
      animation: {
        breathe: 'breathe 8s ease-in-out infinite'
      }
    }
  }
}
