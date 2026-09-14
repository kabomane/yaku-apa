import { marked } from 'marked';
import createDOMPurify from 'dompurify';

export function route(file, heading = '') {
  const params = new URLSearchParams({ file });
  if (heading) params.set('heading', heading);
  return `#${params}`;
}
export function resolveDocumentLink(href, currentFile) {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return null;
  try {
    const target = new URL(href, `https://reader.invalid/${currentFile}`);
    return { file: decodeURIComponent(target.pathname.slice(1)), heading: decodeURIComponent(target.hash.slice(1)) };
  } catch { return null; }
}
export function renderDocument(window, content, file, available) {
  if (!file.endsWith('.md')) throw new Error('Le lecteur accepte uniquement les documents Markdown.');
  const wrapper = window.document.createElement('div');
  let metadata = '';
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  metadata = match?.[1] ?? '';
  const html = marked.parse(match ? normalized.slice(match[0].length) : normalized, { gfm: true });
  wrapper.innerHTML = createDOMPurify(window).sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style', 'form', 'input', 'textarea', 'select', 'button'], FORBID_ATTR: ['style', 'srcset'] });
  const used = new Set();
  for (const heading of wrapper.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
    const slug = heading.textContent.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-');
    let id = slug || 'section', n = 0;
    while (used.has(id)) id = `${slug}-${++n}`;
    heading.id = id; used.add(id);
  }
  for (const a of wrapper.querySelectorAll('a')) {
    const href = a.getAttribute('href');
    const target = resolveDocumentLink(href, file);
    if (target && available.has(target.file)) a.setAttribute('href', route(target.file, target.heading));
    else if (href && /^https?:\/\//i.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    else if (href && /^mailto:/i.test(href)) { /* Supported external link. */ }
    else { a.removeAttribute('href'); a.title = 'Cette destination n’est pas disponible dans le lecteur.'; }
  }
  for (const img of wrapper.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? '';
    if (!/^https:\/\//i.test(src)) {
      const label = window.document.createElement('span'); label.textContent = img.alt || '[Image non disponible]'; img.replaceWith(label);
    } else { img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; }
  }
  for (const table of wrapper.querySelectorAll('table')) {
    const scroll = window.document.createElement('div'); scroll.className = 'table-scroll'; scroll.tabIndex = 0; scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', 'Tableau défilant'); table.replaceWith(scroll); scroll.append(table);
  }
  return { wrapper, metadata };
}

export const NOTES_PREFIX = 'yaku-apa:notes:v1:';
export function validNote(note) {
  return note && typeof note.id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(note.id) &&
    typeof note.file === 'string' && note.file.length < 1000 && ['idea', 'note'].includes(note.kind) &&
    typeof note.text === 'string' && note.text.trim().length > 0 && note.text.length <= 10000 &&
    typeof note.createdAt === 'string' && Number.isFinite(Date.parse(note.createdAt)) &&
    typeof note.updatedAt === 'string' && Number.isFinite(Date.parse(note.updatedAt));
}
// A key per note avoids overwriting unrelated notes saved in another tab.
export function readNotes(storage) {
  const notes = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(NOTES_PREFIX)) continue;
    try { const note = JSON.parse(storage.getItem(key)); if (validNote(note) && key === NOTES_PREFIX + note.id) notes.push(note); } catch { /* Preserve malformed entries without breaking valid notes. */ }
  }
  return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function saveNote(storage, note) {
  if (!validNote(note)) throw new Error('Note invalide.');
  storage.setItem(NOTES_PREFIX + note.id, JSON.stringify(note));
}
