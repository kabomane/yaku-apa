import { readFile, readdir, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const STATUSES = ['planned', 'prepared', 'draft', 'auditing', 'revision', 'validated', 'locked'];
export const CATEGORIES = ['continuity', 'narrative', 'dialogue', 'style', 'pacing'];
export const REGISTERS = ['characters', 'relationships', 'knowledge', 'objects', 'locations', 'events', 'promises', 'timeline'];
export const DIRECTORIES = ['chapters', 'chapter_notes', 'summaries', 'continuity/proposals',
  ...CATEGORIES.map(x => `audits/${x}`), 'audits/global', 'revisions/requests', 'revisions/completed', 'output', 'templates', 'docs'];
export const readText = async file => (await readFile(file, 'utf8')).replace(/^\uFEFF/, '');
export const hash = text => createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');
export const readJson = async file => {
  try { return JSON.parse(await readText(file)); }
  catch (error) { throw new Error(`${file}: ${error.message}`); }
};
export const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const hasText = value => typeof value === 'string' && value.trim().length > 0;

// Restricted front matter: one scalar per line, not a general YAML parser.
export function parseChapter(raw, filename) {
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) throw new Error(`${filename}: métadonnées initiales manquantes ou non fermées.`);
  const meta = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim()) continue;
    const field = line.match(/^(chapter|status|pov):\s*(.*?)\s*$/);
    if (!field || Object.hasOwn(meta, field[1])) throw new Error(`${filename}: champ inconnu ou dupliqué: ${line}`);
    meta[field[1]] = field[2];
  }
  const id = Number(path.basename(filename, '.md'));
  if (!Number.isSafeInteger(id) || id < 1 || !/^\d+$/.test(meta.chapter ?? '') || Number(meta.chapter) !== id) {
    throw new Error(`${filename}: numéro de chapitre invalide ou différent du fichier.`);
  }
  if (!STATUSES.includes(meta.status) || !hasText(meta.pov)) throw new Error(`${filename}: statut ou POV invalide.`);
  const body = normalized.slice(match[0].length).trim();
  const prose = body.replace(/^#{1,6}\s+.*$/gm, '').trim();
  if (!['planned', 'prepared'].includes(meta.status) && (!prose || /^TODO[\s.!…]*$/i.test(prose))) {
    throw new Error(`${filename}: chapitre rédigé sans texte.`);
  }
  return { id, stem: path.basename(filename, '.md'), status: meta.status, pov: meta.pov, body, prose, hash: hash(body), filename };
}

export async function chapters(root = ROOT) {
  const names = await readdir(path.join(root, 'chapters'));
  const result = [];
  for (const name of names.filter(x => x.endsWith('.md'))) {
    if (!/^\d+\.md$/.test(name)) throw new Error(`chapters/${name}: nom attendu 01.md, 02.md, etc.`);
    result.push(parseChapter(await readText(path.join(root, 'chapters', name)), name));
  }
  result.sort((a, b) => a.id - b.id);
  if (new Set(result.map(c => c.id)).size !== result.length) throw new Error('Numéros de chapitres dupliqués.');
  return result;
}

export function countWords(text) {
  return (text.match(/[\p{L}\p{N}]+(?:[’'\-][\p{L}\p{N}]+)*/gu) ?? []).length;
}

export async function config(root = ROOT) {
  const value = await readJson(path.join(root, 'project.json'));
  if (!isObject(value) || !hasText(value.title) || !(value.plannedChapters === null ||
    (Number.isSafeInteger(value.plannedChapters) && value.plannedChapters > 0))) {
    throw new Error('project.json: title requis ; plannedChapters doit être null ou un entier positif.');
  }
  return value;
}

export async function atomicWrite(file, text) {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, text, 'utf8');
  await rename(temp, file);
}

export async function cli(action, allowed = []) {
  try {
    const args = process.argv.slice(2);
    if (args.some(x => !allowed.includes(x)) || new Set(args).size !== args.length) throw new Error(`Arguments acceptés : ${allowed.join(', ') || 'aucun'}`);
    await action(args);
  } catch (error) {
    console.error(`Erreur : ${error.message}`);
    process.exitCode = 1;
  }
}
