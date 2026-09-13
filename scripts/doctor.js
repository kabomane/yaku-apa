import path from 'node:path';
import { stat } from 'node:fs/promises';
import { cli, ROOT, DIRECTORIES, REGISTERS, config } from './lib/project.js';

await cli(async () => {
  const errors = [];
  if (Number(process.versions.node.split('.')[0]) !== 24) errors.push('Node.js 24 requis.');
  for (const [names, type] of [[DIRECTORIES, 'directory'], [
    ['AGENTS.md', 'README.md', 'STATUS.md', 'DECISIONS.md', 'project.json', 'package.json',
      'bible/regles.md', 'bible/style.md', 'plan/chapitres.md', ...REGISTERS.map(x => `continuity/${x}.json`)], 'file']]) {
    for (const name of names) {
      try {
        const info = await stat(path.join(ROOT, name));
        if (type === 'directory' ? !info.isDirectory() : !info.isFile()) throw new Error('type incorrect');
      } catch { errors.push(`${name}: ${type} requis.`); }
    }
  }
  try { await config(); } catch (e) { errors.push(e.message); }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Environnement prêt : Node.js ${process.versions.node}. Aucun service externe requis.`);
});
