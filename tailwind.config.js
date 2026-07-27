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
        },
        equalizer: {
          '0%, 100%': { transform: 'scaleY(0.3)', opacity: '0.6' },
          '25%': { transform: 'scaleY(1)', opacity: '1' },
          '50%': { transform: 'scaleY(0.5)', opacity: '0.8' },
          '75%': { transform: 'scaleY(0.8)', opacity: '0.9' }
        }
      },
      animation: {
        breathe: 'breathe 8s ease-in-out infinite',
        equalizer: 'equalizer 0.8s ease-in-out infinite'
      }
    }
  }
}
