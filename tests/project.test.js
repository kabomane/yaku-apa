import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, DIRECTORIES, REGISTERS, CATEGORIES, chapters, parseChapter, countWords } from '../scripts/lib/project.js';
import { validate, validDate } from '../scripts/lib/validation.js';
import { build } from '../scripts/lib/build.js';
import { projectStatus, START, END } from '../scripts/lib/status.js';

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'yaku-apa-test-'));
  // The only recursive removal is this exact directory returned by mkdtemp.
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const dir of DIRECTORIES) await mkdir(path.join(root, dir), { recursive: true });
  for (const name of REGISTERS) await json(root, `continuity/${name}.json`, {});
  await json(root, 'project.json', { title: 'Livre de test', plannedChapters: null });
  await writeFile(path.join(root, 'STATUS.md'), `Notes humaines : ne pas effacer.\r\n${START}\r\nAncien compteur\r\n${END}\r\nDécision conservée.\r\n`);
  return root;
}
async function json(root, file, value) {
  await writeFile(path.join(root, file), JSON.stringify(value, null, 2));
}
async function chapter(root, id, status = 'draft', text = "L’étudiant hésite. Peut-être reviendra-t-il demain ?") {
  const stem = String(id).padStart(2, '0');
  await writeFile(path.join(root, 'chapters', `${stem}.md`), `---\r\nchapter: ${id}\r\nstatus: ${status}\r\npov: Test\r\n---\r\n\r\n# Chapitre ${id}\r\n\r\n${text}\r\n`);
}
async function ready(t) {
  const root = await fixture(t);
  await chapter(root, 1, 'validated');
  await json(root, 'project.json', { title: 'Livre de test', plannedChapters: 1 });
  await writeFile(path.join(root, 'summaries/01.md'), '# Résumé\n\nUn étudiant hésite puis reporte sa visite.\n');
  const [c] = await chapters(root);
  for (const category of CATEGORIES) await json(root, `audits/${category}/01.json`, {
    chapter: 1, category, status: 'completed', chapter_hash: c.hash,
    ...(category === 'continuity' ? { continuity_reviewed: true } : {}), issues: []
  });
  return root;
}
const issue = status => ({ id: 'ISS-01-CONT-001', chapter: 1, category: 'continuity', severity: 'CRITICAL', status,
  description: 'Connaissance prématurée.', justification: 'Le personnage ignore ce fait.', recommendation: 'Corriger la scène.' });

test('projet vide valide, compteurs explicites et aucun manuscrit créé', async t => {
  const root = await fixture(t);
  assert.deepEqual((await validate(root)).errors, []);
  assert.match(await projectStatus(root), /Chapitres prévus : non défini/);
  assert.match(await projectStatus(root), /Mots : 0/);
  await assert.rejects(build(root), /manuscrit vide refusé/);
  await assert.rejects(build(root, true), /manuscrit vide refusé/);
  assert.deepEqual(await readdir(path.join(root, 'output')), []);
});

test('tri numérique, exclusion des préparations, prose intacte et sources inchangées', async t => {
  const root = await fixture(t);
  await chapter(root, 10);
  await chapter(root, 2);
  await chapter(root, 1, 'prepared', 'TODO');
  assert.deepEqual((await chapters(root)).map(c => c.id), [1, 2, 10]);
  const before = await readFile(path.join(root, 'chapters/02.md'));
  const output = await readFile(await build(root), 'utf8');
  assert.ok(output.indexOf('# Chapitre 2') < output.indexOf('# Chapitre 10'));
  assert.doesNotMatch(output, /status:|pov:|TODO/);
  assert.match(output, /L’étudiant hésite/);
  assert.deepEqual(await readFile(path.join(root, 'chapters/02.md')), before);
});

test('comptage français : apostrophes, accents, traits d’union et titres', () => {
  const c = parseChapter("---\nchapter: 1\nstatus: draft\npov: Test\n---\n# Titre non compté\nL’étudiant aime l'école. Peut-être demain.", '01.md');
  assert.equal(countWords(c.prose), 5);
  assert.equal(countWords(''), 0);
});

test('métadonnées absentes, incorrectes, dupliquées et doublons de numéros refusés', async t => {
  assert.throws(() => parseChapter('# Texte', '01.md'), /métadonnées/);
  assert.throws(() => parseChapter('---\nchapter: 2\nstatus: draft\npov: X\n---\nTexte.', '01.md'), /numéro/);
  assert.throws(() => parseChapter('---\nchapter: 1\nstatus: draft\nstatus: locked\npov: X\n---\nTexte.', '01.md'), /dupliqué/);
  assert.throws(() => parseChapter('---\nchapter: 1\nstatus: draft\npov: X\n---\n# Titre\nTODO', '01.md'), /sans texte/);
  const root = await fixture(t);
  await chapter(root, 1);
  await writeFile(path.join(root, 'chapters/1.md'), await readFile(path.join(root, 'chapters/01.md')));
  assert.match((await validate(root)).errors.join('\n'), /dupliqués/);
});

test('JSON corrompu, racine non objet et champs manquants signalés', async t => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'continuity/objects.json'), '{oops');
  await json(root, 'continuity/events.json', []);
  await json(root, 'continuity/characters.json', { exemple: {} });
  const errors = (await validate(root)).errors.join('\n');
  assert.match(errors, /objects.json/);
  assert.match(errors, /objet JSON/);
  assert.match(errors, /characters.exemple.name/);
});

test('références inconnues de personnage, lieu, chapitre et événement', async t => {
  const root = await fixture(t);
  await json(root, 'continuity/objects.json', { objet: { name: 'Clé', introduced_chapter: 9, current_owner: 'inconnu', current_location: 'ailleurs' } });
  await json(root, 'continuity/timeline.json', { instant: { chapter: 9, event: 'absent', date: '2026-09-13', time: '10:00', participants: ['absent'] } });
  const errors = (await validate(root)).errors.join('\n');
  for (const field of ['introduced_chapter', 'current_owner', 'current_location', 'instant.event', 'instant.participants']) assert.ok(errors.includes(field));
});

test('dates réelles, heures et ordre de résolution', async t => {
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2025-02-29'), false);
  const root = await fixture(t);
  await chapter(root, 1); await chapter(root, 2);
  await json(root, 'continuity/events.json', { evt: { chapter: 1, description: 'Test', participants: [], date: '2026-02-30' } });
  await json(root, 'continuity/timeline.json', { instant: { chapter: 1, event: 'evt', date: '2026-02-30', time: '25:61', participants: [] } });
  await json(root, 'continuity/promises.json', { mystere: { introduced_chapter: 2, resolved_chapter: 1, status: 'resolved', description: 'Test' }, abandon: { introduced_chapter: 1, status: 'abandoned', description: 'Test' } });
  const errors = (await validate(root)).errors.join('\n');
  assert.match(errors, /evt.date/); assert.match(errors, /instant.time/);
  assert.match(errors, /résolution avant introduction/); assert.match(errors, /abandon sans justification/);
});

test('connaissance sans acquisition et positions simultanées refusées', async t => {
  const root = await fixture(t);
  await chapter(root, 1);
  await json(root, 'continuity/characters.json', { test: { name: 'Test' } });
  await json(root, 'continuity/locations.json', { ici: { name: 'Ici' }, ailleurs: { name: 'Ailleurs' } });
  await json(root, 'continuity/knowledge.json', { secret: { character: 'test', fact: 'Secret', knows: true } });
  await json(root, 'continuity/events.json', { evt: { chapter: 1, description: 'Test', participants: ['test'] } });
  const instant = { chapter: 1, event: 'evt', date: '2026-09-13', time: '10:00', participants: ['test'] };
  await json(root, 'continuity/timeline.json', { a: { ...instant, location: 'ici' }, b: { ...instant, location: 'ailleurs' } });
  const errors = (await validate(root)).errors.join('\n');
  assert.match(errors, /since_chapter requis/); assert.match(errors, /deux lieux/);
});

test('événement mal formé produit un diagnostic sans crash', async t => {
  const root = await fixture(t);
  await chapter(root, 1);
  await json(root, 'continuity/events.json', { evt: null });
  await json(root, 'continuity/timeline.json', { instant: { chapter: 1, event: 'evt', date: '2026-09-13', time: '10:00', participants: [] } });
  assert.match((await validate(root)).errors.join('\n'), /events.evt/);
});

test('statut actualisé préserve exactement les notes humaines et reste idempotent', async t => {
  const root = await fixture(t);
  await projectStatus(root, true);
  const first = await readFile(path.join(root, 'STATUS.md'), 'utf8');
  assert.ok(first.startsWith(`Notes humaines : ne pas effacer.\r\n${START}`));
  assert.ok(first.endsWith(`${END}\r\nDécision conservée.\r\n`));
  await projectStatus(root, true);
  assert.equal(await readFile(path.join(root, 'STATUS.md'), 'utf8'), first);
  await writeFile(path.join(root, 'STATUS.md'), 'Notes sans marqueurs');
  await assert.rejects(projectStatus(root, true), /marqueurs/);
  assert.equal(await readFile(path.join(root, 'STATUS.md'), 'utf8'), 'Notes sans marqueurs');
});

test('export final valide et rapport produits sans changer les sources', async t => {
  const root = await ready(t);
  const before = await readFile(path.join(root, 'chapters/01.md'));
  assert.deepEqual((await validate(root)).errors, []);
  assert.match(await readFile(await build(root, true), 'utf8'), /L’étudiant/);
  assert.match(await readFile(path.join(root, 'output/final_report.md'), 'utf8'), /Chapitres : 1/);
  assert.deepEqual(await readFile(path.join(root, 'chapters/01.md')), before);
});

test('export final refuse découpage non fixé ou incomplet', async t => {
  const root = await ready(t);
  await json(root, 'project.json', { title: 'Test', plannedChapters: null });
  await assert.rejects(build(root, true), /non défini/);
  await json(root, 'project.json', { title: 'Test', plannedChapters: 2 });
  await assert.rejects(build(root, true), /Découpage incomplet/);
});

test('audit périmé, résumé absent et statut draft empêchent le final', async t => {
  const root = await ready(t);
  await build(root, true);
  const old = await readFile(path.join(root, 'output/manuscript.md'));
  await chapter(root, 1, 'draft', 'Texte réécrit après audit.');
  await rm(path.join(root, 'summaries/01.md'));
  await assert.rejects(build(root, true), error => {
    assert.match(error.message, /statut non validé/);
    assert.match(error.message, /résumé absent/);
    assert.match(error.message, /périmé/);
    return true;
  });
  assert.deepEqual(await readFile(path.join(root, 'output/manuscript.md')), old);
});

test('CRITICAL reste bloquant en open, accepted et fixed ; verified débloque', async t => {
  const root = await ready(t);
  const file = 'audits/continuity/01.json';
  const audit = JSON.parse(await readFile(path.join(root, file), 'utf8'));
  for (const status of ['open', 'accepted', 'fixed']) {
    await json(root, file, { ...audit, issues: [issue(status)] });
    await assert.rejects(build(root, true), /CRITICAL non résolu/);
  }
  await json(root, file, { ...audit, issues: [issue('verified')] });
  await build(root, true);
});

test('audit manquant, pending ou continuité non revue bloque le final', async t => {
  const root = await ready(t);
  const file = 'audits/continuity/01.json';
  const audit = JSON.parse(await readFile(path.join(root, file), 'utf8'));
  await json(root, file, { ...audit, continuity_reviewed: false });
  await assert.rejects(build(root, true), /audit continuity/);
  await json(root, file, { ...audit, status: 'pending' });
  await assert.rejects(build(root, true), /audit continuity/);
  await rm(path.join(root, file));
  await assert.rejects(build(root, true), /audit continuity/);
});

test('problème global bloque le final, rejet exige une justification', async t => {
  const root = await ready(t);
  const global = { category: 'global', status: 'completed', issues: [{ ...issue('open'), category: 'global', chapter: null, severity: 'BLOCKER' }] };
  await json(root, 'audits/global/revue.json', global);
  await assert.rejects(build(root, true), /BLOCKER non résolu/);
  global.issues[0].status = 'rejected';
  await json(root, 'audits/global/revue.json', global);
  assert.match((await validate(root)).errors.join('\n'), /rejet non justifié/);
  global.issues[0].resolution = 'Faux positif après contrôle des sources.';
  await json(root, 'audits/global/revue.json', global);
  await build(root, true);
});

test('empreinte stable entre LF/CRLF et changement de statut seul', () => {
  const text = '---\nchapter: 1\nstatus: draft\npov: Test\n---\n# Titre\nTexte.';
  assert.equal(parseChapter(text, '01.md').hash, parseChapter(text.replaceAll('\n', '\r\n').replace('draft', 'locked'), '01.md').hash);
});

test('statut signale les audits manquants puis périmés', async t => {
  const root = await fixture(t);
  await chapter(root, 1);
  assert.match(await projectStatus(root), /incomplets ou périmés : 5/);
  const [c] = await chapters(root);
  await json(root, 'audits/style/01.json', { chapter: 1, category: 'style', status: 'completed', chapter_hash: c.hash, issues: [] });
  assert.match(await projectStatus(root), /incomplets ou périmés : 4/);
  await chapter(root, 1, 'draft', 'Texte modifié.');
  assert.match(await projectStatus(root), /incomplets ou périmés : 5/);
});

test('CLI trouve la racine hors du projet et rejette les arguments inconnus', () => {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts/doctor.js')], { cwd: os.tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const invalid = spawnSync(process.execPath, [path.join(ROOT, 'scripts/word_count.js'), '--wrong'], { encoding: 'utf8' });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Arguments acceptés/);
});
