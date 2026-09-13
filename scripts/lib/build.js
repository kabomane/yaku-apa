import path from 'node:path';
import { ROOT, CATEGORIES, readText, atomicWrite, countWords } from './project.js';
import { validate, blocking, unresolved } from './validation.js';

export async function build(root = ROOT, final = false) {
  const result = await validate(root);
  const errors = [...result.errors];
  const list = result.chapters.filter(c => !['planned', 'prepared'].includes(c.status));
  if (!list.length) errors.push('Aucun chapitre rédigé : manuscrit vide refusé.');
  if (final) {
    if (result.settings?.plannedChapters == null) errors.push('Nombre prévu de chapitres non défini dans project.json.');
    else if (list.length !== result.settings.plannedChapters || list.some((c, i) => c.id !== i + 1)) errors.push('Découpage incomplet : tous les chapitres prévus de 1 à N sont requis.');
    for (const chapter of list) {
      if (!['validated', 'locked'].includes(chapter.status)) errors.push(`C${chapter.stem}: statut non validé.`);
      try {
        const summary = await readText(path.join(root, 'summaries', `${chapter.stem}.md`));
        if (!summary.replace(/^#.*$/gm, '').trim() || /\bTODO\b/.test(summary)) throw new Error('résumé incomplet');
      } catch { errors.push(`C${chapter.stem}: résumé absent ou incomplet.`); }
      for (const category of CATEGORIES) {
        const audit = result.audits.find(a => a.chapter === chapter.id && a.category === category);
        if (!audit || audit.status !== 'completed' || audit.chapter_hash !== chapter.hash ||
          (category === 'continuity' && audit.continuity_reviewed !== true)) errors.push(`C${chapter.stem}: audit ${category} absent, incomplet ou périmé.`);
      }
    }
    for (const audit of result.audits) {
      for (const issue of audit.issues.filter(blocking)) errors.push(`${issue.id}: ${issue.severity} non résolu.`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const filename = final ? 'manuscript.md' : 'manuscript_draft.md';
  const manuscript = `# ${result.settings.title}\n\n${list.map(c => c.body).join('\n\n---\n\n')}\n`;
  await atomicWrite(path.join(root, 'output', filename), manuscript);
  if (final) {
    const issues = result.audits.flatMap(a => a.issues).filter(unresolved);
    const promises = Object.entries(result.data.promises).filter(([, p]) => p.status !== 'resolved');
    await atomicWrite(path.join(root, 'output', 'final_report.md'), `# Rapport d'assemblage final\n\nChapitres : ${list.length}\nMots : ${list.reduce((n, c) => n + countWords(c.prose), 0)}\nPOV : ${[...new Set(list.map(c => c.pov))].join(', ')}\n\n## Problèmes restants\n\n${issues.map(i => `- ${i.id} (${i.severity}) : ${i.description}`).join('\n') || 'Aucun problème ouvert enregistré.'}\n\n## Promesses non résolues\n\n${promises.map(([id, p]) => `- ${id} (${p.status}) : ${p.description}`).join('\n') || 'Aucune.'}\n\nCe rapport automatise les contrôles structurels. La synthèse des arcs et le jugement éditorial restent dans audits/global/.\n`);
  }
  return path.join(root, 'output', filename);
}
