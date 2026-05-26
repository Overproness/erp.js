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
      // Ensure a single copy of every emotion package so Rollup resolves
      // circular internal references without TDZ errors.
      dedupe: [
        '@emotion/react',
        '@emotion/styled',
        '@emotion/cache',
        '@emotion/serialize',
        '@emotion/utils',
        '@emotion/hash',
        '@emotion/sheet',
        '@emotion/weak-memoize',
        '@emotion/is-prop-valid',
      ],
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
        'react-ace',
        'ace-builds',
        // Pre-bundle all emotion packages with esbuild to flatten circular
        // dependencies and avoid TDZ errors ("Cannot access 'X' before initialization").
        '@emotion/react',
        '@emotion/styled',
        '@emotion/cache',
        '@emotion/serialize',
        '@emotion/utils',
        '@emotion/hash',
        '@emotion/sheet',
        '@emotion/weak-memoize',
        '@emotion/is-prop-valid',
        // Pre-bundle chart libs so esbuild flattens their circular deps (dev mode)
        'recharts',
        'chart.js',
        'react-chartjs-2',
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
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined;

            // Three.js / 3-D — kept separate so it stays lazy with HeroScene
            if (
              id.includes('/three/') ||
              id.includes('/@react-three/') ||
              id.includes('/three-stdlib/') ||
              id.includes('/postprocessing/') ||
              id.includes('/stats-gl/') ||
              id.includes('/troika-') ||
              id.includes('/meshline/')
            ) {
              return 'three-vendor';
            }

            // Monaco editor — very large, only used in code editors
            if (
              id.includes('/monaco-editor/') ||
              id.includes('/react-monaco-editor/')
            ) {
              return 'monaco-vendor';
            }


            // Moment.js — large due to locale data
            if (id.includes('/moment/')) {
              return 'moment-vendor';
            }

            // Lucide icons
            if (id.includes('/lucide-react/')) {
              return 'lucide-vendor';
            }

            // PDF / canvas — large, rarely needed on load
            if (
              id.includes('/jspdf') ||
              id.includes('/html2canvas') ||
              id.includes('/pdfmake') ||
              id.includes('/react-pdf/') ||
              id.includes('/pdfjs-dist/')
            ) {
              return 'pdf-vendor';
            }

            // Rich-text / document editors
            if (
              id.includes('/quill') ||
              id.includes('/react-quill') ||
              id.includes('/draft-js') ||
              id.includes('/draftjs') ||
              id.includes('/react-draft-wysiwyg') ||
              id.includes('/html-to-draftjs') ||
              id.includes('/draftjs-to-html') ||
              id.includes('/draftjs-to-markdown') ||
              id.includes('/@editorjs') ||
              id.includes('/prosemirror') ||
              id.includes('/tiptap') ||
              id.includes('/codemirror') ||
              id.includes('/@codemirror') ||
              id.includes('/froala') ||
              id.includes('/turndown')
            ) {
              return 'editor-vendor';
            }

            // Charting libraries — include all D3 transitive deps to avoid
            // Rollup TDZ ordering errors ("Cannot access 'X' before initialization").
            // internmap, robust-predicates, and delaunator are D3 sub-deps that
            // don't match the 'd3-' prefix but must live in the same chunk.
            if (
              id.includes('/recharts') ||
              id.includes('/d3-') ||
              id.includes('/d3/') ||
              id.includes('/internmap/') ||
              id.includes('/robust-predicates/') ||
              id.includes('/delaunator/') ||
              id.includes('/@nivo/') ||
              id.includes('/chart.js/') ||
              id.includes('/react-chartjs-2') ||
              id.includes('/victory')
            ) {
              return 'charts-vendor';
            }

            // AntV (used by @ant-design/charts) — very large, separate chunk
            if (id.includes('/@antv/') || id.includes('/@ant-design/charts')) {
              return 'antv-vendor';
            }

            // xlsx — only needed for data export
            if (id.includes('/xlsx/') || id.includes('/sheetjs/')) {
              return 'xlsx-vendor';
            }

            // Tanstack table
            if (id.includes('/@tanstack/')) {
              return 'tanstack-vendor';
            }

            // NOTE: @emotion/* packages intentionally fall through to the
            // 'vendor' chunk below.  Isolating them in a separate chunk causes
            // Rollup to emit a circular-dependency ordering that triggers a TDZ
            // ReferenceError ("Cannot access 'X' before initialization") at
            // runtime.  Keeping them in the shared vendor chunk gives Rollup
            // enough module-graph context to order the modules correctly.

            // MUI — very large
            if (id.includes('/@mui/')) {
              return 'mui-vendor';
            }

            // ReactFlow / workflow canvas
            if (id.includes('/reactflow/') || id.includes('/@reactflow/')) {
              return 'reactflow-vendor';
            }

            // Socket.IO
            if (id.includes('/socket.io-client/') || id.includes('/engine.io-client/')) {
              return 'socket-vendor';
            }

            // Radix UI primitives
            if (id.includes('/@radix-ui/')) {
              return 'radix-vendor';
            }

            // Ant Design — split icon sprite separately
            if (id.includes('/@ant-design/icons')) {
              return 'antd-icons';
            }
            if (id.includes('/antd/') || id.includes('/@ant-design/')) {
              return 'antd-vendor';
            }

            // Core React stack + router + Redux
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/redux/') ||
              id.includes('/@reduxjs/') ||
              id.includes('/react-redux/')
            ) {
              return 'react-vendor';
            }

            // Markdown rendering
            if (
              id.includes('/react-markdown/') ||
              id.includes('/remark-') ||
              id.includes('/rehype-') ||
              id.includes('/micromark') ||
              id.includes('/mdast-') ||
              id.includes('/hast-') ||
              id.includes('/unified/')
            ) {
              return 'markdown-vendor';
            }

            // Media / video
            if (id.includes('/hls.js/') || id.includes('/@mediapipe/')) {
              return 'media-vendor';
            }

            // Lucide icons (tree-shaken but still sizeable)
            if (id.includes('/lucide-react/')) {
              return 'lucide-vendor';
            }

            // Everything else in node_modules
            return 'vendor';
          },
          // Prevent Rollup from hoisting transitive imports across chunk
          // boundaries, which can cause TDZ errors in circular-dep packages
          // like @emotion/* when they are all merged into a single chunk.
          hoistTransitiveImports: false,
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
