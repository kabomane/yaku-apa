import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { build as bundle } from 'esbuild';
import { ROOT } from './lib/project.js';

const destination = path.join(ROOT, 'dist');
await mkdir(destination, { recursive: true });
const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
const files = [], folders = new Set();
const extensions = new Set(['.md', '.json', '.js', '.css', '.html', '.yml', '.yaml', '.txt', '.svg']);
const dotfiles = new Set(['.gitignore', '.gitattributes', '.editorconfig', '.node-version']);
for (const file of [...new Set(paths)].sort()) {
  if (file.startsWith('dist/') || file.startsWith('node_modules/') || file.startsWith('.git/') || /(^|\/)\.env(?:\.|$)/.test(file)) continue;
  const parts = file.split('/');
  for (let i = 1; i < parts.length; i++) folders.add(parts.slice(0, i).join('/'));
  if (!extensions.has(path.posix.extname(file)) && !dotfiles.has(file)) continue;
  const content = await readFile(path.join(ROOT, file), 'utf8');
  files.push({ path: file, content, kind: file.endsWith('.md') ? 'markdown' : 'source' });
}
let revision = 'local';
try { revision = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* First local preview, before initial commit. */ }
await writeFile(path.join(destination, 'content.json'), JSON.stringify({ files, folders: [...folders], revision }));
await copyFile(path.join(ROOT, 'reader/index.html'), path.join(destination, 'index.html'));
await copyFile(path.join(ROOT, 'reader/styles.css'), path.join(destination, 'app.css'));
await copyFile(path.join(ROOT, 'reader/favicon.svg'), path.join(destination, 'favicon.svg'));
await writeFile(path.join(destination, '.nojekyll'), '');
await bundle({ entryPoints: [path.join(ROOT, 'reader/app.js')], bundle: true, format: 'esm', target: ['safari15.4', 'chrome100'], minify: true, outfile: path.join(destination, 'app.js'), legalComments: 'eof' });
console.log(`Lecteur construit : ${files.length} fichiers, ${folders.size} dossiers. Sortie : dist/`);
