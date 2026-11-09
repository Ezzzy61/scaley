import { build } from 'esbuild';
import { cp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';

const VERSION = process.env.GITHUB_SHA?.slice(0, 7) || Date.now().toString(36);
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await build({
  entryPoints: { app: 'src/main.jsx' },
  bundle: true, minify: true, format: 'esm', target: ['es2020', 'safari15', 'chrome90'],
  jsx: 'automatic', jsxImportSource: 'preact',
  outdir: 'dist', define: { __VERSION__: JSON.stringify(VERSION) }, logLevel: 'info',
});
await build({ entryPoints: { app: 'src/styles.css' }, bundle: true, minify: true, outdir: 'dist', logLevel: 'info' });
for (const f of ['dist/index.html', 'dist/sw.js']) {
  await writeFile(f, (await readFile(f, 'utf8')).replaceAll('__VERSION__', VERSION));
}
await writeFile('dist/.nojekyll', '');
console.log('Built Scaley', VERSION);
