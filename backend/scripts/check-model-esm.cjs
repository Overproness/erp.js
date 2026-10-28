const fs = require('fs');
const path = require('path');

const sourceRoot = path.resolve(__dirname, '../src');
const mixedModules = [];

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(filePath);
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    // app.ts serves as the bridge between ESM Apollo Server and CommonJS route handlers
    if (entry.name === 'app.ts') continue;

    const source = fs.readFileSync(filePath, 'utf8');
    const usesEsm = /^\s*(?:import|export)\b/m.test(source);
    const usesCommonJs = /\brequire\s*\(|\bmodule\.exports\b/.test(source);
    if (usesEsm && usesCommonJs) mixedModules.push(path.relative(sourceRoot, filePath));
  }
}

visit(sourceRoot);

if (mixedModules.length) {
  console.error('Mixed ESM/CommonJS source detected:');
  for (const file of mixedModules) console.error(`- ${file}`);
  process.exit(1);
}

console.log('No mixed ESM/CommonJS backend TypeScript source detected.');
