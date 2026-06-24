import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

build({
  entryPoints: [path.join(__dirname, '../client/viewer.tsx')],
  outfile: path.join(__dirname, '../dist/public/viewer.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  minify: true,
  sourcemap: false,
  tsconfigRaw: { compilerOptions: { jsx: 'react-jsx', jsxImportSource: 'preact' } },
  alias: {
    react: 'preact/compat',
    'react-dom': 'preact/compat',
    'react-dom/test-utils': 'preact/test-utils',
  },
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: {
    '.css': 'local-css',
    '.svg': 'dataurl',
    '.png': 'dataurl',
    '.gif': 'dataurl',
    '.woff': 'dataurl',
    '.woff2': 'dataurl',
    '.ttf': 'dataurl',
    '.eot': 'dataurl',
  },
  logLevel: 'info',
}).catch(() => process.exit(1));
