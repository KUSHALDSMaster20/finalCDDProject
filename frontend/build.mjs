import { build } from 'esbuild';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import fs from 'node:fs';
import path from 'node:path';

const outdir = path.resolve('dist');
await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  outdir: path.join(outdir, 'assets'),
  entryNames: 'app',
  assetNames: '[name]-[hash]',
  jsx: 'automatic',
  minify: true,
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
    'import.meta.env.VITE_AI_MODE': JSON.stringify(process.env.VITE_AI_MODE || ''),
  },
});

const cssPath = path.join(outdir, 'assets', 'app.css');
const css = fs.readFileSync(cssPath, 'utf8');
const result = await postcss([tailwindcss({ config: path.resolve('tailwind.config.js') }), autoprefixer]).process(css, { from: cssPath, to: cssPath });
fs.writeFileSync(cssPath, result.css);

const html = fs.readFileSync('index.html', 'utf8').replace(
  '<script type="module" src="/src/main.jsx"></script>',
  '<link rel="stylesheet" href="/assets/app.css" /><script type="module" src="/assets/app.js"></script>',
);
fs.mkdirSync(outdir, { recursive: true });
fs.writeFileSync(path.join(outdir, 'index.html'), html);
console.log('Production frontend written to dist/');
