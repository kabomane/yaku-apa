import { renderDocument, route, readNotes, saveNote, NOTES_PREFIX } from './lib.js';

const $ = selector => document.querySelector(selector);
const icons = {
  folder: '<path d="M3 7V5h6l2 2h10v12H3z"/>',
  file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  note: '<path d="M5 3h14v13l-5 5H5zM14 21v-5h5M8 8h8M8 12h6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  github: '<path d="M9 19c-4 1-4-2-6-2m12 4v-4c0-1-.3-2-1-2 3 0 6-1 6-5 0-1-.4-3-1-3 0-1 0-3-.5-3-2 0-3 1-3 1-2-.6-5-.6-7 0 0 0-1-1-3-1-.5 0-.5 2-.5 3-.6.5-1 2-1 3 0 4 3 5 6 5-.7 0-1 1-1 2v4"/>',
  moon: '<path d="M20 14A9 9 0 0 1 10 4a9 9 0 1 0 10 10z"/>',
  device: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? icons.file}</svg>`; }
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });

let manifest, current, notes = [], editing = null, storage, noticeTimer;
const expanded = new Set(['bible', 'plan']);
const available = new Set();
const drafts = new Map();
const PREFERENCES = 'yaku-apa:reader:v1';
let preferences = { size: 18, theme: 'light', file: 'plan/premise.md' };

function notify(message, action) {
  const el = $('#notification');
  (document.querySelector('dialog[open]') ?? document.body).append(el);
  clearTimeout(noticeTimer); el.replaceChildren(document.createTextNode(message)); el.hidden = false;
  if (action) { const button = document.createElement('button'); button.textContent = action.label; button.addEventListener('click', () => { action.run(); el.hidden = true; }); el.append(button); }
  noticeTimer = setTimeout(() => { el.hidden = true; }, action ? 12000 : 7000);
}
try {
  storage = window.localStorage;
  const stored = JSON.parse(storage.getItem(PREFERENCES) ?? '{}');
  preferences = { ...preferences, ...stored };
  notes = readNotes(storage);
} catch { storage = null; notify('Le stockage local est indisponible. Les notes ne pourront pas être enregistrées.'); }
function persistPreferences() {
  try { storage?.setItem(PREFERENCES, JSON.stringify(preferences)); } catch { /* Reading preferences must not block reading. */ }
}
function applyPreferences() {
  preferences.size = Math.min(26, Math.max(16, Number(preferences.size) || 18));
  preferences.theme = preferences.theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.style.setProperty('--body-size', `${preferences.size / 16}rem`);
  $('#theme-toggle').setAttribute('aria-label', preferences.theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre');
  $('#font-smaller').disabled = preferences.size <= 16;
  $('#font-larger').disabled = preferences.size >= 26;
}
applyPreferences();
$('#font-smaller').addEventListener('click', () => { preferences.size -= 2; applyPreferences(); persistPreferences(); });
$('#font-larger').addEventListener('click', () => { preferences.size += 2; applyPreferences(); persistPreferences(); });
$('#theme-toggle').addEventListener('click', () => { preferences.theme = preferences.theme === 'dark' ? 'light' : 'dark'; applyPreferences(); persistPreferences(); });

const mobile = matchMedia('(max-width: 759px)');
const compact = matchMedia('(max-width: 1179px)');
function movePanel(name, modal) {
  const dialog = $(`#${name}-dialog`);
  if (dialog.open) dialog.close();
  const panel = $(`#${name}-panel`);
  (modal ? dialog.querySelector('.dialog-mount') : $(`#${name}-slot`)).append(panel);
}
function arrangePanels() { movePanel('library', mobile.matches); movePanel('notes', compact.matches); }
mobile.addEventListener('change', arrangePanels); compact.addEventListener('change', arrangePanels); arrangePanels();
function openPanel(name) {
  if (name === 'notes' && !compact.matches) { document.body.classList.toggle('notes-hidden'); $('#open-notes').setAttribute('aria-expanded', String(!document.body.classList.contains('notes-hidden'))); if (!document.body.classList.contains('notes-hidden')) $('#note-text').focus({ preventScroll: true }); return; }
  const dialog = $(`#${name}-dialog`);
  if (!dialog.open) dialog.showModal();
  $(`#open-${name}`).setAttribute('aria-expanded', 'true');
  // Do not focus a text input automatically on touch: avoid opening the keyboard on navigation.
  dialog.querySelector('.dialog-close').focus({ preventScroll: true });
}
$('#open-library').addEventListener('click', () => openPanel('library'));
$('#open-notes').addEventListener('click', () => openPanel('notes'));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.append($('#notification')); const name = dialog.id.split('-')[0]; $(`#open-${name}`).setAttribute('aria-expanded', 'false'); });
});

const order = ['chapters', 'bible', 'plan', 'chapter_notes', 'summaries', 'continuity', 'audits', 'revisions', 'docs', 'templates', 'reader', 'scripts', 'tests'];
function tree() {
  if (!manifest) return;
  const root = { children: new Map(), files: [] };
  const query = $('#file-search').value.trim().toLocaleLowerCase('fr');
  const matching = manifest.files.filter(file => file.path.toLocaleLowerCase('fr').includes(query));
  function directory(folder) {
    let cursor = root;
    for (const segment of folder.split('/').filter(Boolean)) {
      if (!cursor.children.has(segment)) cursor.children.set(segment, { children: new Map(), files: [] });
      cursor = cursor.children.get(segment);
    }
    return cursor;
  }
  if (!query) manifest.folders.forEach(directory);
  for (const file of matching) { const bits = file.path.split('/'); bits.pop(); directory(bits.join('/')).files.push(file); }
  const fragment = document.createDocumentFragment();
  function draw(node, parent, prefix = '') {
    const entries = [...node.children].sort(([a], [b]) => {
      if (!prefix) { const ai = order.indexOf(a), bi = order.indexOf(b); if (ai !== bi) return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi); }
      return a.localeCompare(b, 'fr', { numeric: true });
    });
    for (const [name, child] of entries) {
      const folder = prefix ? `${prefix}/${name}` : name;
      const details = document.createElement('details'); details.className = 'tree-folder'; details.open = Boolean(query) || expanded.has(folder);
      const summary = document.createElement('summary'); const symbol = document.createElement('span'); symbol.className = 'folder-icon'; symbol.innerHTML = icon('folder');
      summary.append(symbol, document.createTextNode(name)); details.append(summary);
      const children = document.createElement('div'); children.className = 'tree-children'; draw(child, children, folder);
      if (!child.files.length && !child.children.size) { const empty = document.createElement('div'); empty.className = 'empty-folder'; empty.textContent = 'Aucun fichier pour le moment'; children.append(empty); }
      details.append(children);
      details.addEventListener('toggle', () => { if (!query) { if (details.open) expanded.add(folder); else expanded.delete(folder); } });
      parent.append(details);
    }
    for (const file of node.files.sort((a, b) => a.path.localeCompare(b.path, 'fr', { numeric: true }))) {
      const link = document.createElement('a'); link.className = 'tree-file'; link.href = route(file.path); link.title = file.path;
      const symbol = document.createElement('span'); symbol.innerHTML = icon('file'); link.append(symbol, document.createTextNode(file.path.split('/').pop()));
      if (current?.path === file.path) link.setAttribute('aria-current', 'page');
      link.addEventListener('click', () => { if ($('#library-dialog').open) $('#library-dialog').close(); }); parent.append(link);
    }
  }
  draw(root, fragment);
  if (!matching.length && query) { const p = document.createElement('p'); p.className = 'empty-folder'; p.textContent = 'Aucun fichier trouvé.'; fragment.append(p); }
  $('#file-tree').replaceChildren(fragment);
  $('#file-count').textContent = `${matching.length} fichier${matching.length === 1 ? '' : 's'}`;
}
$('#file-search').addEventListener('input', tree);
$('#collapse-tree').addEventListener('click', () => { expanded.clear(); $('#file-search').value = ''; tree(); });

function rememberDraft() {
  if (!current) return;
  if (editing) {
    const draft = { text: $('#note-text').value, kind: $('#note-kind').value, editingId: editing.id };
    drafts.set(`edit:${current.path}`, draft);
    try { storage?.setItem(`yaku-apa:edit-draft:v1:${current.path}`, JSON.stringify(draft)); } catch { /* Preserve input in memory. */ }
    return;
  }
  const draft = { text: $('#note-text').value, kind: $('#note-kind').value };
  drafts.set(current.path, draft);
  try { storage?.setItem(`yaku-apa:draft:v1:${current.path}`, JSON.stringify(draft)); } catch { /* Submission reports storage failures; keep the textarea content. */ }
}
function loadDraft() {
  let editDraft = drafts.get(`edit:${current?.path}`);
  if (!editDraft) { try { editDraft = JSON.parse(storage?.getItem(`yaku-apa:edit-draft:v1:${current?.path}`) ?? 'null'); } catch { /* Ignore damaged draft. */ } }
  const note = notes.find(n => n.id === editDraft?.editingId);
  if (note && typeof editDraft.text === 'string') {
    editing = note; $('#note-text').value = editDraft.text.slice(0, 10000); $('#note-kind').value = editDraft.kind === 'note' ? 'note' : 'idea'; $('#save-note').textContent = 'Mettre à jour ↗'; $('#cancel-edit').hidden = false; return;
  }
  let draft = drafts.get(current?.path);
  if (!draft) { try { draft = JSON.parse(storage?.getItem(`yaku-apa:draft:v1:${current?.path}`) ?? 'null'); } catch { /* Ignore damaged draft. */ } }
  $('#note-text').value = typeof draft?.text === 'string' ? draft.text.slice(0, 10000) : '';
  $('#note-kind').value = draft?.kind === 'note' ? 'note' : 'idea';
}
function resetEdit() { editing = null; $('#save-note').textContent = 'Enregistrer ↗'; $('#cancel-edit').hidden = true; }
function clearEditDraft() {
  drafts.delete(`edit:${current?.path}`);
  try { storage?.removeItem(`yaku-apa:edit-draft:v1:${current?.path}`); } catch { /* Keep saved note. */ }
}
$('#note-text').addEventListener('input', rememberDraft); $('#note-kind').addEventListener('change', rememberDraft);
$('#cancel-edit').addEventListener('click', () => { clearEditDraft(); resetEdit(); loadDraft(); updateNoteFile(); });
function updateNoteFile() { $('#note-file').textContent = editing ? `Modification · ${editing.file}` : current?.path ?? 'Choisir un document'; }
function renderNotes() {
  $('#total-notes').textContent = notes.length;
  $('#export-notes').disabled = !notes.length;
  const list = $('#notes-list'); list.replaceChildren();
  const visible = notes.filter(note => $('#note-scope').value === 'all' || note.file === current?.path);
  if (!visible.length) {
    const empty = document.createElement('div'); empty.className = 'empty-notes';
    const title = document.createElement('span'); title.textContent = 'Une page à remplir.';
    const p = document.createElement('p'); p.textContent = $('#note-scope').value === 'all' ? 'Vos notes et idées se retrouveront ici.' : 'Aucune entrée pour ce document. Gardez votre première idée ici.';
    empty.append(title, p); list.append(empty); return;
  }
  for (const note of visible) {
    const card = document.createElement('section'); card.className = 'note-card'; card.dataset.kind = note.kind;
    const top = document.createElement('div'); top.className = 'note-card-top';
    const tag = document.createElement('span'); tag.className = 'note-tag'; tag.textContent = note.kind === 'idea' ? 'Idée' : 'Note';
    const date = document.createElement('time'); date.dateTime = note.updatedAt; date.textContent = new Date(note.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); top.append(tag, date);
    const body = document.createElement('p'); body.className = 'note-body'; body.textContent = note.text;
    const link = document.createElement('a'); link.className = 'note-file'; link.textContent = note.file;
    if (available.has(note.file)) link.href = route(note.file); else link.title = 'Ce fichier n’est plus dans la version publiée.';
    const actions = document.createElement('div'); actions.className = 'note-actions';
    const edit = document.createElement('button'); edit.textContent = 'Modifier'; edit.addEventListener('click', () => { rememberDraft(); editing = note; $('#note-text').value = note.text; $('#note-kind').value = note.kind; $('#save-note').textContent = 'Mettre à jour ↗'; $('#cancel-edit').hidden = false; updateNoteFile(); $('#note-text').focus(); });
    const remove = document.createElement('button'); remove.textContent = 'Supprimer'; remove.addEventListener('click', () => {
      try {
        if (!storage) throw new Error(); storage.removeItem(NOTES_PREFIX + note.id); notes = readNotes(storage);
        if (editing?.id === note.id) { clearEditDraft(); resetEdit(); loadDraft(); updateNoteFile(); }
        renderNotes(); notify('Entrée supprimée.', { label: 'Annuler', run: () => { try { saveNote(storage, note); notes = readNotes(storage); renderNotes(); } catch { notify('Impossible de restaurer cette note.'); } } });
      } catch { notify('Suppression impossible : le stockage local est indisponible.'); }
    }); actions.append(edit, remove); card.append(top, body, link, actions); list.append(card);
  }
}
$('#note-scope').addEventListener('change', renderNotes);
$('#note-form').addEventListener('submit', event => {
  event.preventDefault();
  const text = $('#note-text').value.trim();
  if (!text || !current) return;
  const timestamp = new Date().toISOString();
  const note = { id: editing?.id ?? crypto.randomUUID(), file: editing?.file ?? current.path, kind: $('#note-kind').value, text, createdAt: editing?.createdAt ?? timestamp, updatedAt: timestamp };
  try {
    if (!storage) throw new Error(); saveNote(storage, note);
    const wasEditing = Boolean(editing); notes = readNotes(storage); clearEditDraft(); resetEdit();
    if (!wasEditing) { drafts.delete(current.path); try { storage.removeItem(`yaku-apa:draft:v1:${current.path}`); } catch { /* Note is already saved. */ } }
    loadDraft(); updateNoteFile(); renderNotes(); notify('Enregistré sur cet appareil.');
  } catch { notify('Enregistrement impossible. Votre texte reste dans le champ : copiez-le avant de quitter.'); }
});
$('#export-notes').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ project: 'yaku-apa', version: 1, exportedAt: new Date().toISOString(), notes }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `yaku-apa-carnet-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener('storage', event => { if (event.key === null || event.key.startsWith(NOTES_PREFIX)) { try { notes = readNotes(storage); renderNotes(); } catch { notify('Impossible de relire le carnet local.'); } } });

function openDocument() {
  if (!manifest) return;
  const params = new URLSearchParams(location.hash.slice(1));
  const wanted = params.get('file') ?? preferences.file;
  const file = manifest.files.find(f => f.path === wanted);
  if (!file) {
    rememberDraft(); resetEdit();
    $('#document').replaceChildren(); const h = document.createElement('h1'); h.textContent = 'Document introuvable';
    const p = document.createElement('p'); p.textContent = 'Ce fichier a peut-être été déplacé. Choisissez un document dans la bibliothèque.';
    $('#document').append(h, p); current = null; $('#note-file').textContent = 'Choisir un document'; $('#save-note').disabled = true;
    $('#frontmatter').hidden = true; $('#breadcrumb').textContent = wanted ?? 'Document introuvable'; $('#document-path').textContent = ''; $('#source-link').removeAttribute('href'); $('#reading-time').textContent = ''; tree(); renderNotes(); return;
  }
  if (current?.path !== file.path) {
    rememberDraft(); resetEdit(); current = file; loadDraft();
    const { wrapper, metadata } = renderDocument(window, file.content, file.path, available);
    $('#document').replaceChildren(...wrapper.childNodes);
    $('#frontmatter').replaceChildren(); $('#frontmatter').hidden = !metadata;
    metadata.split('\n').filter(Boolean).forEach(line => { const span = document.createElement('span'); span.textContent = line; $('#frontmatter').append(span); });
    $('#breadcrumb').textContent = file.path.replaceAll('/', ' / ');
    $('#document-path').textContent = file.path;
    $('#source-link').href = `https://github.com/kabomane/yaku-apa/blob/main/${file.path.split('/').map(encodeURIComponent).join('/')}`;
    $('#document-kind').textContent = file.path.startsWith('chapters/') ? 'LE ROMAN' : file.kind === 'markdown' ? 'LES DOCUMENTS' : 'LES SOURCES';
    const words = $('#document').textContent.trim().split(/\s+/).length;
    $('#reading-time').textContent = `${Math.max(1, Math.ceil(words / 220))} min de lecture`;
    document.title = `${$('#document h1')?.textContent ?? file.path.split('/').pop()} · Yaku-apa`;
    preferences.file = file.path; persistPreferences();
    const parents = file.path.split('/'); parents.pop(); for (let i = 1; i <= parents.length; i++) expanded.add(parents.slice(0, i).join('/'));
    tree(); renderNotes(); updateNoteFile(); $('#save-note').disabled = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  if (params.get('heading')) document.getElementById(params.get('heading'))?.scrollIntoView({ behavior: 'instant', block: 'start' });
}
window.addEventListener('hashchange', openDocument);
window.addEventListener('pagehide', rememberDraft);
window.addEventListener('scroll', () => { const max = document.documentElement.scrollHeight - innerHeight; $('#read-progress').style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 0}%`; }, { passive: true });
try {
  const response = await fetch('./content.json');
  if (!response.ok) throw new Error('Chargement impossible');
  manifest = await response.json();
  if (!Array.isArray(manifest.files) || !Array.isArray(manifest.folders)) throw new Error('Index invalide');
  manifest.files.forEach(file => available.add(file.path));
  $('#revision').textContent = `Édition ${manifest.revision}`;
  if (!location.hash && !available.has(preferences.file)) preferences.file = manifest.files[0]?.path;
  if (!location.hash) history.replaceState(null, '', route(preferences.file));
  tree(); openDocument(); renderNotes();
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const tools = [{
      name: 'open_project_document', title: 'Ouvrir un document',
      description: 'Ouvre un fichier du projet dans le lecteur. Les chemins disponibles sont ceux de la bibliothèque.',
      inputSchema: { type: 'object', properties: { file: { type: 'string' } }, required: ['file'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        if (!input || typeof input.file !== 'string' || !available.has(input.file)) throw new Error('Fichier inconnu.');
        location.hash = route(input.file); openDocument(); return { file: current.path };
      }
    }, {
      name: 'prepare_local_note', title: 'Préparer une note locale',
      description: 'Prépare une note pour le document ouvert, sans l’enregistrer. L’utilisateur peut la relire puis l’enregistrer dans son navigateur.',
      inputSchema: { type: 'object', properties: { text: { type: 'string', minLength: 1, maxLength: 10000 }, kind: { type: 'string', enum: ['idea', 'note'] } }, required: ['text', 'kind'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!current || !input || typeof input.text !== 'string' || !input.text.trim() || input.text.length > 10000 || !['idea', 'note'].includes(input.kind)) throw new Error('Note invalide.');
        if ($('#note-text').value.trim() || editing) throw new Error('Un brouillon est déjà présent.');
        $('#note-text').value = input.text; $('#note-kind').value = input.kind; rememberDraft();
        if (compact.matches) openPanel('notes'); else document.body.classList.remove('notes-hidden');
        return { file: current.path, status: 'draft', saved: false };
      }
    }];
    for (const tool of tools) {
      try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Optional browser API. */ }
    }
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  }
} catch {
  $('#document').innerHTML = '<h1>La bibliothèque est indisponible.</h1><p>Vérifiez votre connexion et rechargez cette page.</p>';
  $('#file-count').textContent = 'Chargement interrompu'; $('#save-note').disabled = true;
}
