/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          base:    '#0A0E1A',
          surface: '#0D1117',
          card:    '#111827',
          border:  '#1E2A3A',
          blue:    '#1565C0',
          cyan:    '#00E5FF',
          red:     '#EF5350',
          green:   '#00C853',
          muted:   '#B0BEC5',
          dim:     '#4A5568',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow:     '0 0 16px rgba(0,229,255,0.15)',
        'glow-md':'0 0 32px rgba(0,229,255,0.20)',
        'glow-red':'0 0 16px rgba(239,83,80,0.25)',
        'glow-green':'0 0 16px rgba(0,200,83,0.20)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'scan': 'scan 4s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: []
}
