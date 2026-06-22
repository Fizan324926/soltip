import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent
        accent: {
          DEFAULT: '#9945ff',
          hover: '#7c2ee8',
          subtle: 'rgba(153, 69, 255, 0.08)',
        },
        // Success (Solana green)
        success: {
          DEFAULT: '#14f195',
          text: '#0a7b4a',
        },
        // Functional
        error: '#ff3b30',
        warning: '#ff9500',
        // Surfaces
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#fbfbfd',
          tertiary: '#f5f5f7',
        },
        // Text
        text: {
          primary: '#1d1d1f',
          secondary: '#86868b',
          tertiary: '#aeaeb2',
        },
        // Border
        border: {
          DEFAULT: 'rgba(0, 0, 0, 0.06)',
          focus: 'rgba(153, 69, 255, 0.5)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'SF Mono',
          'SFMono-Regular',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'monospace',
        ],
      },
      fontSize: {
        'display': ['64px', { lineHeight: '1.05', fontWeight: '600', letterSpacing: '-0.015em' }],
        'headline': ['40px', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.005em' }],
        'title': ['28px', { lineHeight: '1.14', fontWeight: '600', letterSpacing: '0.007em' }],
        'body': ['17px', { lineHeight: '1.47', letterSpacing: '-0.022em' }],
        'caption': ['12px', { lineHeight: '1.33', letterSpacing: '0' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.04)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 300ms ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
      maxWidth: {
        'container': '980px',
        'container-sm': '680px',
        'container-lg': '1200px',
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
