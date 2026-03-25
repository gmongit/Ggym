/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ios: {
          blue: '#9b5bff',       // Neon purple replaces iOS blue as accent
          green: '#34C759',
          orange: '#FF9500',
          red: '#FF453A',
          purple: '#bf85ff',
          gray: {
            1: '#8E8E93',
            2: '#636366',
            3: '#48484a',
            4: '#3a3a3c',
            5: '#2c2c2e',
            6: '#1c1c1e',
          },
        },
        neon: {
          purple: '#9b5bff',
          bright: '#c084fc',
          glow: 'rgba(155, 91, 255, 0.4)',
        },
        dark: {
          bg: '#06060e',
          surface: 'rgba(25, 12, 50, 0.55)',
          border: 'rgba(138, 80, 255, 0.22)',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
        'card-md': '0 12px 40px rgba(0, 0, 0, 0.5)',
        'neon-sm': '0 0 16px rgba(155, 91, 255, 0.35)',
        'neon-md': '0 0 28px rgba(155, 91, 255, 0.45), 0 4px 16px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'dark-base': 'radial-gradient(ellipse at 50% 110%, rgba(90, 25, 180, 0.38) 0%, transparent 58%), radial-gradient(ellipse at 50% -10%, rgba(50, 12, 120, 0.25) 0%, transparent 52%)',
      },
    },
  },
  plugins: [],
}
