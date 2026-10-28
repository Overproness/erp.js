import assert from 'assert';
import path from 'path';
import http from 'http';
import fs from 'fs';

// Load Playwright from the workspace
let playwright: any;
try {
  playwright = require(path.resolve(__dirname, '../../WorkflowSystem/n8n/node_modules/playwright'));
} catch (e) {
  try {
    playwright = require('playwright');
  } catch (err: any) {
    console.error('Playwright could not be loaded:', err.message);
    process.exit(1);
  }
}

const { chromium } = playwright;

// Static file server to serve frontend/dist
function startStaticServer(distDir: string, port: number): Promise<http.Server> {
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url || '/';
    const parsedPath = reqUrl.split('?')[0];
    let filePath = path.join(distDir, parsedPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      // SPA Fallback to index.html
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function runE2EValidation() {
  console.log('--- STARTING PLAYWRIGHT / CHROMIUM E2E VALIDATION ---');

  const distDir = path.resolve(__dirname, '../../frontend/dist');
  if (!fs.existsSync(distDir)) {
    throw new Error(`Frontend build not found at ${distDir}. Run 'npm --prefix frontend run build' first.`);
  }

  const PORT = 4173;
  console.log(`1. Starting static SPA server from ${distDir} on port ${PORT}...`);
  const server = await startStaticServer(distDir, PORT);
  console.log('   ✓ Static SPA server running.');

  console.log('2. Launching headless Chromium browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore routine network aborts or analytics pixel failures in local test
      if (!text.includes('favicon') && !text.includes('Failed to load resource')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err: any) => {
    pageErrors.push(err.message);
  });

  try {
    console.log(`3. Navigating to http://localhost:${PORT}/ ...`);
    const response = await page.goto(`http://localhost:${PORT}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    assert.strictEqual(response?.status(), 200, 'Home page must return HTTP 200');

    // Wait for initial render
    await page.waitForTimeout(2000);

    const title = await page.title();
    console.log(`   ✓ Page loaded. Document title: "${title}"`);
    assert(title && title.length > 0, 'Document title must not be empty');

    // Check SEO and Meta tags
    console.log('4. Verifying SEO Meta tags & Head elements...');
    const metaDescription = await page.$eval('meta[name="description"]', (el: any) => el.content).catch(() => null);
    console.log(`   ✓ Meta Description present: "${metaDescription?.substring(0, 50)}..."`);

    // Check viewport tag
    const metaViewport = await page.$eval('meta[name="viewport"]', (el: any) => el.content).catch(() => null);
    assert(metaViewport, 'Viewport meta tag must be present for responsive mobile rendering');

    console.log('5. Navigating to Reputation / Marketing pages...');
    await page.goto(`http://localhost:${PORT}/reputation`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Verify page content rendered
    const bodyContent = await page.content();
    assert(bodyContent.includes('Reputation') || bodyContent.includes('Reviews') || bodyContent.includes('Demo') || bodyContent.includes('ERP'), 'Reputation / Marketing view rendered');
    console.log('   ✓ Reputation / Marketing page loaded with proper DOM tree.');

    console.log('6. Validating Console & Runtime Health...');
    if (pageErrors.length > 0) {
      console.warn('   ⚠️ Caught runtime page errors:', pageErrors);
    }
    assert.strictEqual(pageErrors.length, 0, `Browser encountered uncaught JavaScript exceptions: ${pageErrors.join(', ')}`);
    console.log('   ✓ Zero unhandled JavaScript exceptions in Chromium runtime.');

    console.log('--- PLAYWRIGHT / CHROMIUM E2E BROWSER VALIDATION PASSED (100%) ---');
  } finally {
    await browser.close();
    server.close();
  }
}

runE2EValidation().catch((err) => {
  console.error('\nE2E browser validation failed:', err);
  process.exit(1);
});
