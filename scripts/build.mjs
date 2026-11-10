import { build } from 'esbuild';
import { cp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';

const VERSION = process.env.GITHUB_SHA?.slice(0, 7) || Date.now().toString(36);
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await mkdir('dist/fonts', { recursive: true });
for (const [from, to] of [
  ['@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2', 'bebas-neue-400.woff2'],
  ['@fontsource/oswald/files/oswald-latin-600-normal.woff2', 'oswald-600.woff2'],
  ['@fontsource/oswald/files/oswald-latin-700-normal.woff2', 'oswald-700.woff2'],
]) await cp('node_modules/' + from, 'dist/fonts/' + to);
await build({
  entryPoints: { app: 'src/main.jsx' },
  bundle: true, minify: true, format: 'esm', target: ['es2020', 'safari15', 'chrome90'],
  jsx: 'automatic', jsxImportSource: 'preact',
  outdir: 'dist', define: { __VERSION__: JSON.stringify(VERSION) }, logLevel: 'info',
});
await build({ entryPoints: { app: 'src/styles.css' }, bundle: true, minify: true, outdir: 'dist', logLevel: 'info', external: ['fonts/*'] });
for (const f of ['dist/index.html', 'dist/sw.js']) {
  await writeFile(f, (await readFile(f, 'utf8')).replaceAll('__VERSION__', VERSION));
}
await writeFile('dist/.nojekyll', '');
console.log('Built Scaley', VERSION);
