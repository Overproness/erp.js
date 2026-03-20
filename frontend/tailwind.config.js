/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false,
  },
  important: true,
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1890ff',
          hover: '#40a9ff',
          active: '#096dd9',
        },
        success: '#52c41a',
        warning: '#faad14',
        error: '#ff4d4f',
        // Website design system colors
        'ws-primary': '#0058c3',
        'ws-primary-container': '#0070f3',
        'ws-on-primary': '#ffffff',
        'ws-on-surface': '#191c1d',
        'ws-on-surface-variant': '#414754',
        'ws-surface': '#f8f9fa',
        'ws-surface-container': '#edeeef',
        'ws-surface-container-low': '#f3f4f5',
        'ws-surface-container-high': '#e7e8e9',
        'ws-surface-container-highest': '#e1e3e4',
        'ws-surface-container-lowest': '#ffffff',
        'ws-outline': '#727786',
        'ws-outline-variant': '#c1c6d7',
        'ws-secondary': '#435d94',
        'ws-secondary-container': '#a6c1fe',
        'ws-primary-fixed': '#d8e2ff',
        'ws-inverse-surface': '#2e3132',
        'ws-inverse-on-surface': '#f0f1f2',
        'ws-tertiary': '#a23d00',
        'ws-tertiary-container': '#ca4e00',
        'ws-tertiary-fixed': '#ffdbcd',
        'ws-error': '#ba1a1a',
        'ws-error-container': '#ffdad6',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
