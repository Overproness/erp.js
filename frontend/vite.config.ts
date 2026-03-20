import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, type ConfigEnv, type UserConfig } from 'vite';

export default ({ mode }: ConfigEnv): UserConfig => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const proxy_url =
    process.env.VITE_DEV_REMOTE === 'remote'
      ? process.env.VITE_BACKEND_SERVER
      : 'http://localhost:8888/';

  const config = {
    base: '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: proxy_url,
          changeOrigin: true,
          secure: false,
        },
        '/graphql': {
          target: proxy_url,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'redux',
        'antd',
        '@ant-design/icons',
        '@ant-design/charts',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
      ],
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // manualChunks: (id) => {
          //   if (id.includes('node_modules')) {
          //     if (id.includes('react') || id.includes('redux') || id.includes('@reduxjs')) {
          //       return 'react-vendor';
          //     }
          //     if (id.includes('antd') || id.includes('@ant-design')) {
          //       return 'antd';
          //     }
          //     if (id.includes('@mui')) {
          //       return 'mui';
          //     }
          //     if (id.includes('chart') || id.includes('@nivo') || id.includes('recharts')) {
          //       return 'charts';
          //     }
          //     return 'vendor';
          //   }
          // },
        },
      },
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/],
      },
      minify: 'esbuild',
    },
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      global: 'globalThis',
    },
  };

  return config;
};
