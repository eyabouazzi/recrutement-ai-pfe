/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', '"Sora"', 'sans-serif'],
        body: ['"Inter"', '"Manrope"', 'sans-serif'],
      },
      colors: {
        neon: {
          cyan: '#22d3ee',
          violet: '#8b5cf6',
          pink: '#f472b6',
          lime: '#a3e635',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(103,232,249,0.28), 0 20px 45px rgba(56,189,248,0.18)',
        card: '0 16px 40px rgba(3, 7, 18, 0.42)',
        soft: '0 10px 30px rgba(2, 6, 23, 0.25)',
      },
      backgroundImage: {
        mesh:
          'radial-gradient(circle at 12% 15%, rgba(34, 211, 238, 0.22), transparent 32%), radial-gradient(circle at 82% 8%, rgba(168, 85, 247, 0.18), transparent 34%), radial-gradient(circle at 75% 75%, rgba(244, 114, 182, 0.16), transparent 28%), linear-gradient(180deg, #060816 0%, #050711 55%, #04050d 100%)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.65' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        pulseGlow: 'glowPulse 4s ease-in-out infinite',
        shimmer: 'shimmer 4s linear infinite',
      },
    },
  },
  plugins: [],
}
