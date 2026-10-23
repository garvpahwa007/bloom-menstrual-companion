import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir(new URL('../.test-cache/', import.meta.url), { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ['src/App.jsx'],
  outfile: '.test-cache/App.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  target: 'node20',
  jsx: 'automatic',
  logLevel: 'warning',
});
