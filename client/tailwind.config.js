/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        felt: 'var(--felt, #1a5c2e)',
        'felt-dark': 'var(--felt-dark, #0f3d1e)',
        'felt-light': 'var(--felt-light, #2a7a42)',
        gold: '#d4af37',
        'gold-dark': '#b8960f',
        chip: {
          red: '#dc2626',
          blue: '#2563eb',
          green: '#16a34a',
          black: '#1f2937',
          white: '#f9fafb'
        }
      },
      fontFamily: {
        poker: ['"SF Pro Display"', 'system-ui', 'sans-serif']
      },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'deal': 'dealCard 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'chip-toss': 'chipToss 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        dealCard: {
          '0%': { transform: 'translateY(-30px) scale(0.8)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' }
        },
        chipToss: {
          '0%': { transform: 'scale(0.6) translateY(-12px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' }
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(212,175,55,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(212,175,55,0.6)' }
        }
      }
    }
  },
  plugins: []
};
