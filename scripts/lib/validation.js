import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { ROOT, REGISTERS, CATEGORIES, chapters, config, readJson, isObject, hasText } from './project.js';

const TYPES = {
  characters: { name: 'text', location: 'location?', last_seen_chapter: 'chapter?' },
  relationships: { characters: 'characters', relationship: 'text', last_change_chapter: 'chapter?' },
  knowledge: { character: 'character', fact: 'text', knows: 'boolean', since_chapter: 'chapter?' },
  objects: { name: 'text', introduced_chapter: 'chapter', current_owner: 'character?', current_location: 'location?' },
  locations: { name: 'text' },
  events: { chapter: 'chapter', description: 'text', participants: 'characters', date: 'date?' },
  promises: { introduced_chapter: 'chapter', description: 'text', status: 'promise', resolved_chapter: 'chapter?', reason: 'text?' },
  timeline: { chapter: 'chapter', event: 'event', date: 'date', time: 'time', participants: 'characters', location: 'location?' }
};
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function validate(root = ROOT) {
  const errors = [];
  let list = [], settings;
  try { list = await chapters(root); } catch (e) { errors.push(e.message); }
  try { settings = await config(root); } catch (e) { errors.push(e.message); }
  const ids = new Set(list.map(c => c.id));
  if (settings?.plannedChapters !== null && list.some(c => c.id > settings?.plannedChapters)) errors.push('Chapitre au-delà du nombre prévu.');
  const data = {};
  for (const name of REGISTERS) {
    try {
      data[name] = await readJson(path.join(root, 'continuity', `${name}.json`));
      if (!isObject(data[name])) throw new Error(`${name}: objet JSON attendu.`);
    } catch (e) { errors.push(e.message); data[name] = {}; }
  }
  const refs = { character: data.characters, location: data.locations, event: data.events };
  function matches(value, type) {
    if (type.endsWith('?')) return value === undefined || value === null || matches(value, type.slice(0, -1));
    if (Object.hasOwn(refs, type)) return typeof value === 'string' && Object.hasOwn(refs[type], value);
    switch (type) {
      case 'text': return hasText(value);
      case 'boolean': return typeof value === 'boolean';
      case 'chapter': return Number.isSafeInteger(value) && ids.has(value);
      case 'characters': return Array.isArray(value) && new Set(value).size === value.length && value.every(v => matches(v, 'character'));
      case 'date': return validDate(value);
      case 'time': return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
      case 'promise': return ['open', 'developing', 'resolved', 'abandoned'].includes(value);
      default: return false;
    }
  }
  for (const name of REGISTERS) {
    for (const [id, record] of Object.entries(data[name])) {
      const label = `${name}.${id}`;
      if (!/^[a-z][a-z0-9_]*$/.test(id) || !isObject(record)) { errors.push(`${label}: identifiant ou objet invalide.`); continue; }
      for (const [field, type] of Object.entries(TYPES[name])) {
        if (!matches(record[field], type)) errors.push(`${label}.${field}: valeur invalide ou référence inconnue (${type}).`);
      }
      if (name === 'knowledge' && record.knows === true && record.since_chapter == null) errors.push(`${label}: since_chapter requis quand knows=true.`);
      if (name === 'knowledge' && record.knows === false && record.since_chapter != null) errors.push(`${label}: connaissance absente avec chapitre d'acquisition.`);
      if (name === 'promises') {
        if (record.status === 'resolved' && record.resolved_chapter == null) errors.push(`${label}: résolution sans chapitre.`);
        if (record.status !== 'resolved' && record.resolved_chapter != null) errors.push(`${label}: chapitre de résolution sur promesse non résolue.`);
        if (record.resolved_chapter < record.introduced_chapter) errors.push(`${label}: résolution avant introduction.`);
        if (record.status === 'abandoned' && !hasText(record.reason)) errors.push(`${label}: abandon sans justification.`);
      }
      if (name === 'timeline' && Object.hasOwn(data.events, record.event)) {
        const event = data.events[record.event];
        if (!isObject(event) || event.chapter !== record.chapter || (event.date && event.date !== record.date)) errors.push(`${label}: chapitre/date différent de l'événement.`);
      }
    }
  }
  const positions = new Map();
  for (const [id, entry] of Object.entries(data.timeline)) {
    if (!isObject(entry) || !Array.isArray(entry.participants) || !entry.location) continue;
    for (const character of entry.participants) {
      const key = `${character}|${entry.date}|${entry.time}`;
      if (positions.has(key) && positions.get(key) !== entry.location) errors.push(`timeline.${id}: ${character} dans deux lieux au même instant.`);
      positions.set(key, entry.location);
    }
  }
  const audits = [];
  const issueIds = new Set();
  for (const category of [...CATEGORIES, 'global']) {
    let files;
    try { files = await readdir(path.join(root, 'audits', category)); }
    catch (e) { errors.push(e.message); continue; }
    for (const file of files.filter(x => x.endsWith('.json'))) {
      const label = `audits/${category}/${file}`;
      try {
        const audit = await readJson(path.join(root, label));
        if (!isObject(audit)) throw new Error('objet attendu');
        if (audit.category !== category || !['pending', 'completed'].includes(audit.status) || !Array.isArray(audit.issues)) throw new Error('category, status ou issues invalide');
        if (category !== 'global' && (!ids.has(audit.chapter) || file !== `${list.find(c => c.id === audit.chapter)?.stem}.json`)) throw new Error('chapitre ou nom de fichier invalide');
        if (category !== 'global' && !/^[a-f0-9]{64}$/.test(audit.chapter_hash ?? '')) throw new Error('chapter_hash SHA-256 requis');
        if (category === 'continuity' && typeof audit.continuity_reviewed !== 'boolean') throw new Error('continuity_reviewed booléen requis');
        for (const issue of audit.issues) {
          if (!isObject(issue) || !/^ISS-[A-Za-z0-9_-]+$/.test(issue.id ?? '') || issueIds.has(issue.id) ||
            issue.category !== category || !(ids.has(issue.chapter) || (category === 'global' && issue.chapter === null)) ||
            (category !== 'global' && issue.chapter !== audit.chapter) ||
            !['INFO', 'MINOR', 'MAJOR', 'CRITICAL', 'BLOCKER'].includes(issue.severity) ||
            !['open', 'accepted', 'rejected', 'fixed', 'verified'].includes(issue.status) ||
            !['description', 'justification', 'recommendation'].every(k => hasText(issue[k])) ||
            (issue.status === 'rejected' && !hasText(issue.resolution))) throw new Error('problème invalide, dupliqué ou rejet non justifié');
          issueIds.add(issue.id);
        }
        audits.push({ ...audit, file: label });
      } catch (e) { errors.push(`${label}: ${e.message}`); }
    }
  }
  return { errors, chapters: list, settings, data, audits };
}

export const unresolved = issue => !['verified', 'rejected'].includes(issue.status);
export const blocking = issue => ['CRITICAL', 'BLOCKER'].includes(issue.severity) && unresolved(issue);
