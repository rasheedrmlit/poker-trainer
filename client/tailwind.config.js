/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        felt: '#1a5c2e',
        'felt-dark': '#0f3d1e',
        'felt-light': '#2a7a42',
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
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'deal': 'dealCard 0.3s ease-out',
        'chip-toss': 'chipToss 0.5s ease-out'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        dealCard: {
          '0%': { transform: 'translateY(-50px) rotate(-10deg)', opacity: '0' },
          '100%': { transform: 'translateY(0) rotate(0)', opacity: '1' }
        },
        chipToss: {
          '0%': { transform: 'scale(0.5) translateY(-20px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
