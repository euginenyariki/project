/* TeamBoard — a local-first kanban board. Drag, drop and autosave. */
const KEY = 'teamboard:v1';
const COLUMNS = [['backlog', 'Backlog'], ['todo', 'To do'], ['doing', 'In progress'], ['done', 'Done']];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = m => { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); };
const demo = () => [
  { id: 1, title: 'Define project scope', desc: 'Agree the problem, audience and success criteria.', column: 'done', priority: 'high', due: '', at: Date.now() - 5000 },
  { id: 2, title: 'Design the landing page', desc: 'Hero, services, estimate calculator and contact form.', column: 'doing', priority: 'medium', due: new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10), at: Date.now() - 4000 },
  { id: 3, title: 'Set up analytics', desc: 'Decide what to measure before launch.', column: 'todo', priority: 'low', due: '', at: Date.now() - 3000 },
  { id: 4, title: 'Write deployment guide', desc: 'Include rollback steps and environment variables.', column: 'backlog', priority: 'low', due: '', at: Date.now() - 2000 },
  { id: 5, title: 'Security review', desc: 'Check dependencies, secrets and access control.', column: 'todo', priority: 'high', due: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10), at: Date.now() - 1000 },
];
let state = load();
let editingId = null;
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.cards)) return s; } catch (_) {} return { cards: demo() }; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} }

function render() {
  const q = (document.getElementById('search').value || '').toLowerCase().trim();
  const pf = document.getElementById('priorityFilter').value;
  const list = state.cards.filter(c => (!q || `${c.title} ${c.desc}`.toLowerCase().includes(q)) && (pf === 'all' || c.priority === pf));
  document.getElementById('stats').innerHTML = [
    [state.cards.length, 'Total cards'],
    [state.cards.filter(c => c.column === 'doing').length, 'In progress'],
    [state.cards.filter(c => c.column === 'done').length, 'Completed'],
    [state.cards.filter(c => c.priority === 'high' && c.column !== 'done').length, 'High priority open'],
  ].map(([v, l]) => `<div class="stat"><strong>${v}</strong><span>${l}</span></div>`).join('');
  document.getElementById('board').innerHTML = COLUMNS.map(([key, label]) => {
    const cards = list.filter(c => c.column === key).sort((a, b) => b.at - a.at);
    return `<section class="col" data-column="${key}"><div class="col-head"><span>${label}</span><span class="count">${cards.length}</span></div>${cards.map(cardHtml).join('') || '<p class="muted" style="font-size:12px">Drop a card here</p>'}</section>`;
  }).join('');
  save();
}
function cardHtml(c) {
  const late = c.due && c.due < new Date().toISOString().slice(0, 10) && c.column !== 'done';
  const idx = COLUMNS.findIndex(x => x[0] === c.column);
  return `<article class="card" draggable="true" data-id="${c.id}">
    <h3>${esc(c.title)}</h3>${c.desc ? `<p>${esc(c.desc)}</p>` : ''}
    <div class="meta"><span class="badge ${esc(c.priority)}">${esc(c.priority)}</span>${c.due ? `<span class="due ${late ? 'late' : ''}">${late ? 'Overdue · ' : ''}${esc(c.due)}</span>` : ''}</div>
    <div class="card-actions">${idx > 0 ? `<button data-move="-1">←</button>` : ''}${idx < COLUMNS.length - 1 ? `<button data-move="1">→</button>` : ''}<button data-edit>Edit</button><button data-del>Delete</button></div>
  </article>`;
}
function openModal(id = null) {
  editingId = id;
  const c = id ? state.cards.find(x => x.id === id) : null;
  document.getElementById('modalTitle').textContent = c ? 'Edit card' : 'New card';
  const v = c || { title: '', desc: '', column: 'todo', priority: 'medium', due: '' };
  document.getElementById('fTitle').value = v.title;
  document.getElementById('fDesc').value = v.desc || '';
  document.getElementById('fColumn').value = v.column;
  document.getElementById('fPriority').value = v.priority;
  document.getElementById('fDue').value = v.due || '';
  document.getElementById('modal').classList.add('open');
  document.getElementById('fTitle').focus();
}
function closeModal() { document.getElementById('modal').classList.remove('open'); editingId = null; }

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('teamboard:dark') === 'true') document.body.classList.add('dark');
  render();
  ['search', 'priorityFilter'].forEach(id => document.getElementById(id).addEventListener('input', render));
  document.getElementById('addBtn').addEventListener('click', () => openModal());
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  document.getElementById('cardForm').addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      title: document.getElementById('fTitle').value.trim(),
      desc: document.getElementById('fDesc').value.trim(),
      column: document.getElementById('fColumn').value,
      priority: document.getElementById('fPriority').value,
      due: document.getElementById('fDue').value,
    };
    if (!data.title) return;
    if (editingId) Object.assign(state.cards.find(x => x.id === editingId), data);
    else state.cards.unshift({ id: Date.now(), ...data, at: Date.now() });
    closeModal(); render(); toast(editingId ? 'Card updated' : 'Card added');
  });

  document.getElementById('board').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const card = b.closest('[data-id]'); const id = Number(card.dataset.id);
    const item = state.cards.find(c => c.id === id); if (!item) return;
    if (b.dataset.move) {
      const next = COLUMNS.findIndex(x => x[0] === item.column) + Number(b.dataset.move);
      if (next >= 0 && next < COLUMNS.length) { item.column = COLUMNS[next][0]; render(); toast('Card moved'); }
    }
    if (b.hasAttribute('data-edit')) openModal(id);
    if (b.hasAttribute('data-del') && confirm(`Delete "${item.title}"?`)) { state.cards = state.cards.filter(c => c.id !== id); render(); toast('Card deleted'); }
  });

  let dragged = null;
  document.getElementById('board').addEventListener('dragstart', e => {
    dragged = e.target.closest('[data-id]'); if (dragged) { dragged.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
  });
  document.getElementById('board').addEventListener('dragend', () => { document.querySelectorAll('.dragging').forEach(x => x.classList.remove('dragging')); document.querySelectorAll('.col.over').forEach(x => x.classList.remove('over')); });
  document.getElementById('board').addEventListener('dragover', e => {
    const col = e.target.closest('.col'); if (col) { e.preventDefault(); document.querySelectorAll('.col.over').forEach(x => x.classList.remove('over')); col.classList.add('over'); }
  });
  document.getElementById('board').addEventListener('drop', e => {
    const col = e.target.closest('.col'); if (!col || !dragged) return;
    e.preventDefault();
    const item = state.cards.find(c => c.id === Number(dragged.dataset.id));
    if (item && item.column !== col.dataset.column) { item.column = col.dataset.column; render(); toast('Card moved'); }
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })); a.download = 'teamboard.json'; a.click(); URL.revokeObjectURL(a.href); toast('Board exported');
  });
  document.getElementById('themeBtn').addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem('teamboard:dark', document.body.classList.contains('dark')); });
});
