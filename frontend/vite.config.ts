import react from '@vitejs/plugin-react';
import path from 'path';
import { loadEnv, type ConfigEnv, type UserConfig } from 'vite';

// Pre-rendering: only active during production builds.
// vite-plugin-prerender bundles PuppeteerRenderer — no separate install needed.
let vitePrerender: any = null;
try {
  const mod = await import('vite-plugin-prerender');
  vitePrerender = mod.default ?? mod;
} catch {
  // package not yet installed — pre-rendering will be skipped
}

const PUBLIC_ROUTES = ['/', '/about', '/features', '/pricing', '/contact', '/privacy', '/terms'];

export default ({ mode }: ConfigEnv): UserConfig => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const proxy_url =
    process.env.VITE_DEV_REMOTE === 'remote'
      ? process.env.VITE_BACKEND_SERVER
      : 'http://localhost:8888/';

  const config = {
    base: '/',
    plugins: [
      react(),
      // Pre-render public marketing routes at build time so crawlers and
      // social-media scrapers see real HTML instead of an empty <div id="root">.
      // Only active in production builds and only when package is installed.
      ...(mode === 'production' && vitePrerender
        ? [
            vitePrerender({
              staticDir: path.join(__dirname, 'dist'),
              routes: PUBLIC_ROUTES,
              renderer: new vitePrerender.PuppeteerRenderer({
                maxConcurrentRoutes: 4,
                // Give React enough time to fully render each public page.
                renderAfterTime: 5000,
                headless: true,
              }),
            }),
          ]
        : []),
    ],
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
