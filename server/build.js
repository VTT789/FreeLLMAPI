const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/index.js',
  format: 'esm',
  packages: 'external',
  external: ['better-sqlite3', 'cors', 'express', 'helmet', 'undici', 'socks-proxy-agent'],
  loader: { '.ts': 'ts' },
  resolveExtensions: ['.ts', '.js'],
  logLevel: 'info'
}).catch(() => process.exit(1));
