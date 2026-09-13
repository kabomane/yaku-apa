import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { ROOT, CATEGORIES, countWords, readText, atomicWrite } from './project.js';
import { validate, unresolved } from './validation.js';

export const START = '<!-- generated:status:start -->';
export const END = '<!-- generated:status:end -->';

export async function projectStatus(root = ROOT, write = false) {
  const result = await validate(root);
  if (result.errors.length) throw new Error(result.errors.join('\n'));
  const list = result.chapters;
  const written = list.filter(c => !['planned', 'prepared'].includes(c.status));
  const validated = list.filter(c => ['validated', 'locked'].includes(c.status));
  const issues = result.audits.flatMap(a => a.issues).filter(unresolved);
  const auditsPending = written.reduce((total, chapter) => total + CATEGORIES.filter(category => {
    const audit = result.audits.find(a => a.chapter === chapter.id && a.category === category);
    return !audit || audit.status !== 'completed' || audit.chapter_hash !== chapter.hash ||
      (category === 'continuity' && audit.continuity_reviewed !== true);
  }).length, 0);
  const revisions = (await readdir(path.join(root, 'revisions', 'requests'))).filter(f => f.endsWith('.md'));
  const next = list.find(c => !['validated', 'locked'].includes(c.status));
  const expected = result.settings.plannedChapters;
  const nextTask = next ? `Reprendre C${next.stem} (${next.status}).` : expected == null ? 'Définir les décisions narratives et le découpage avant rédaction.' : validated.length < expected ? 'Préparer le prochain chapitre prévu manquant.' : 'Effectuer la revue globale et préparer l’assemblage final.';
  const generated = `Chapitres prévus : ${expected ?? 'non défini'}\nChapitres présents : ${list.length}\nChapitres rédigés : ${written.length}\nChapitres validés/verrouillés : ${validated.length}\nMots : ${written.reduce((sum, c) => sum + countWords(c.prose), 0)}\nAudits de chapitre manquants, incomplets ou périmés : ${auditsPending}\nProblèmes non clôturés : ${issues.length}\nRévisions ouvertes : ${revisions.length}\nProchaine tâche suggérée : ${issues.length || auditsPending ? 'Traiter les audits et problèmes non clôturés avant de poursuivre. ' : ''}${nextTask}`;
  if (write) {
    const file = path.join(root, 'STATUS.md');
    const original = await readText(file);
    if (original.split(START).length !== 2 || original.split(END).length !== 2 || original.indexOf(START) > original.indexOf(END)) throw new Error('STATUS.md: marqueurs générés absents, inversés ou dupliqués.');
    await atomicWrite(file, original.slice(0, original.indexOf(START) + START.length) + `\n${generated}\n` + original.slice(original.indexOf(END)));
  }
  return generated;
}
