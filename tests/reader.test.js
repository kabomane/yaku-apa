import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderDocument, resolveDocumentLink, route, readNotes, saveNote, NOTES_PREFIX } from '../reader/lib.js';

test('Markdown : titres, tableaux, listes et liens internes rendus', () => {
  const { window } = new JSDOM('', { url: 'https://example.com/yaku-apa/' });
  const available = new Set(['bible/regles.md', 'plan/premise.md']);
  const { wrapper, metadata } = renderDocument(window, '---\nchapter: 1\nstatus: draft\n---\n# Titre\n\n**Texte**\n\n- Une idée\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n[Lire](../bible/regles.md#r01)', 'plan/premise.md', available);
  assert.equal(wrapper.querySelector('h1').textContent, 'Titre');
  assert.equal(wrapper.querySelector('strong').textContent, 'Texte');
  assert.equal(wrapper.querySelectorAll('li').length, 1);
  assert.equal(wrapper.querySelectorAll('.table-scroll table').length, 1);
  assert.equal(wrapper.querySelector('a').getAttribute('href'), route('bible/regles.md', 'r01'));
  assert.match(metadata, /chapter: 1/);
  window.close();
});

test('Markdown ne peut pas exécuter de script ; autres extensions refusées', () => {
  const { window } = new JSDOM('');
  const { wrapper } = renderDocument(window, '<script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">X</a><form><input></form><style>body{display:none}</style>', 'README.md', new Set());
  assert.equal(wrapper.querySelectorAll('script,style,form,input,[onerror]').length, 0);
  assert.equal(wrapper.querySelector('a').getAttribute('href'), null);
  assert.throws(() => renderDocument(window, '<img src=x onerror=alert(1)>', 'test.js', new Set()), /uniquement/);
  window.close();
});

test('liens relatifs, espaces, ancres et protocoles externes', () => {
  assert.deepEqual(resolveDocumentLink('../bible/un%20lieu.md#d%C3%A9but', 'plan/premise.md'), { file: 'bible/un lieu.md', heading: 'début' });
  assert.deepEqual(resolveDocumentLink('#suite', 'README.md'), { file: 'README.md', heading: 'suite' });
  assert.equal(resolveDocumentLink('https://example.com', 'README.md'), null);
  assert.equal(resolveDocumentLink('javascript:alert(1)', 'README.md'), null);
});

function example(id = 'test-1') {
  return { id, file: 'plan/premise.md', kind: 'idea', text: 'Une idée à conserver.', createdAt: '2026-09-13T10:00:00Z', updatedAt: '2026-09-13T10:00:00Z' };
}
test('notes locales : créer, relire, modifier, supprimer, isoler des autres clés', () => {
  const { window } = new JSDOM('', { url: 'https://example.com' });
  const storage = window.localStorage;
  storage.setItem('unrelated', 'secret');
  saveNote(storage, example());
  assert.equal(readNotes(storage)[0].text, 'Une idée à conserver.');
  saveNote(storage, { ...example(), text: 'Idée modifiée.' });
  assert.equal(readNotes(storage).length, 1);
  assert.equal(readNotes(storage)[0].text, 'Idée modifiée.');
  saveNote(storage, example('test-2'));
  storage.removeItem(NOTES_PREFIX + 'test-1');
  assert.equal(readNotes(storage).length, 1);
  assert.equal(storage.getItem('unrelated'), 'secret');
  window.close();
});

test('note invalide ou stockage saturé : échec explicite sans faux succès', () => {
  const { window } = new JSDOM('', { url: 'https://example.com' });
  const storage = window.localStorage;
  assert.throws(() => saveNote(storage, { ...example(), text: '' }), /invalide/);
  storage.setItem(NOTES_PREFIX + 'broken', '{oops');
  saveNote(storage, example());
  assert.equal(readNotes(storage).length, 1);
  assert.throws(() => saveNote({ setItem() { throw new Error('QuotaExceededError'); } }, example()), /Quota/);
  window.close();
});
