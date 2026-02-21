import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        solana: {
          purple: '#9945FF',
          green: '#14F195',
          blue: '#00C2FF',
          teal: '#00E4C4',
        },
        surface: {
          DEFAULT: '#0D0D1A',
          card: '#131325',
          elevated: '#1A1A30',
          border: '#2A2A4A',
        },
        accent: {
          success: '#14F195',
          warning: '#FFB800',
          error: '#FF4444',
          info: '#00C2FF',
        },
        apple: {
          white: '#ffffff',
          offwhite: '#f5f5f7',
          heading: '#1d1d1f',
          body: '#6e6e73',
          caption: '#86868b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Inter fallback', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'JetBrains Mono fallback', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-solana': 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
        'gradient-solana-blue': 'linear-gradient(135deg, #9945FF 0%, #00C2FF 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0D0D1A 0%, #131325 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(153,69,255,0.08) 0%, rgba(20,241,149,0.05) 100%)',
        'gradient-glow-purple': 'radial-gradient(circle at center, rgba(153,69,255,0.15) 0%, transparent 70%)',
        'gradient-glow-green': 'radial-gradient(circle at center, rgba(20,241,149,0.15) 0%, transparent 70%)',
        'gradient-apple-section': 'linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(153, 69, 255, 0.35)',
        'glow-green': '0 0 20px rgba(20, 241, 149, 0.35)',
        'glow-blue': '0 0 20px rgba(0, 194, 255, 0.35)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(153, 69, 255, 0.2)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'apple-card': '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.06)',
        'apple-card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 16px 48px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(153, 69, 255, 0.35)',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 40px rgba(153, 69, 255, 0.65)',
          },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0px)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [
    forms({
      strategy: 'class',
    }),
  ],
};

export default config;
