const STORAGE_KEY = 'tanarseged_pro_v1';
const defaultScale = [
  { grade: 5, min: 85 },
  { grade: 4, min: 70 },
  { grade: 3, min: 55 },
  { grade: 2, min: 40 },
  { grade: 1, min: 0 },
];

let state = {
  id: crypto.randomUUID(),
  title: '',
  className: '',
  maxPoints: 100,
  scale: structuredClone(defaultScale),
  students: [],
  saved: []
};

const $ = (id) => document.getElementById(id);
const els = {
  workTitle: $('workTitle'), className: $('className'), maxPoints: $('maxPoints'),
  gradeScale: $('gradeScale'), quickPoints: $('quickPoints'), quickPercent: $('quickPercent'), quickGrade: $('quickGrade'), quickText: $('quickText'),
  studentForm: $('studentForm'), studentName: $('studentName'), studentPoints: $('studentPoints'), studentRows: $('studentRows'),
  stats: $('stats'), savedList: $('savedList'), heroAverage: $('heroAverage'), toast: $('toast'),
  saveBtn: $('saveBtn'), exportCsvBtn: $('exportCsvBtn'), printBtn: $('printBtn'), newWorkBtn: $('newWorkBtn'), resetScaleBtn: $('resetScaleBtn')
};

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data) state = { ...state, ...data, scale: data.scale || structuredClone(defaultScale), saved: data.saved || [] };
  } catch {}
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 2100);
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function percent(points) {
  const max = Number(state.maxPoints) || 1;
  return clamp((Number(points) / max) * 100, 0, 100);
}
function gradeFor(pct) {
  const sorted = [...state.scale].sort((a,b) => b.min - a.min);
  return sorted.find(item => pct >= Number(item.min))?.grade ?? 1;
}
function renderScale() {
  els.gradeScale.innerHTML = '';
  [...state.scale].sort((a,b) => b.grade - a.grade).forEach((row) => {
    const div = document.createElement('div');
    div.className = 'scale-row';
    div.innerHTML = `<strong>${row.grade}</strong><input type="number" min="0" max="100" step="1" value="${row.min}" aria-label="${row.grade}. jegy minimum százalék"><span>%</span>`;
    div.querySelector('input').addEventListener('input', (e) => {
      const found = state.scale.find(x => x.grade === row.grade);
      found.min = clamp(Number(e.target.value), 0, 100);
      updateAll();
    });
    els.gradeScale.appendChild(div);
  });
}
function renderStudents() {
  els.studentRows.innerHTML = '';
  if (!state.students.length) {
    els.studentRows.innerHTML = `<tr><td colspan="5" class="empty">Még nincs diák felvéve.</td></tr>`;
    return;
  }
  state.students.forEach((s, idx) => {
    const pct = percent(s.points);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td>${Number(s.points).toLocaleString('hu-HU')} / ${Number(state.maxPoints).toLocaleString('hu-HU')}</td>
      <td>${pct.toFixed(1)}%</td>
      <td><strong class="grade">${gradeFor(pct)}</strong></td>
      <td><button class="danger" type="button" aria-label="Törlés">Törlés</button></td>`;
    tr.querySelector('button').addEventListener('click', () => { state.students.splice(idx,1); updateAll(); toast('Diák törölve.'); });
    els.studentRows.appendChild(tr);
  });
}
function getStats() {
  const count = state.students.length;
  if (!count) return { count:0, avg:0, best:'-', worst:'-', gradeCounts:{1:0,2:0,3:0,4:0,5:0} };
  const pcts = state.students.map(s => percent(s.points));
  const avg = pcts.reduce((a,b)=>a+b,0) / count;
  const gradeCounts = {1:0,2:0,3:0,4:0,5:0};
  state.students.forEach(s => gradeCounts[gradeFor(percent(s.points))]++);
  const bestStudent = state.students.reduce((a,b)=>Number(a.points)>Number(b.points)?a:b);
  const worstStudent = state.students.reduce((a,b)=>Number(a.points)<Number(b.points)?a:b);
  return { count, avg, best: `${bestStudent.name} (${percent(bestStudent.points).toFixed(1)}%)`, worst: `${worstStudent.name} (${percent(worstStudent.points).toFixed(1)}%)`, gradeCounts };
}
function renderStats() {
  const s = getStats();
  els.heroAverage.textContent = `${s.avg.toFixed(1)}%`;
  els.stats.innerHTML = `
    <div class="stat"><span>Diákok</span><strong>${s.count}</strong></div>
    <div class="stat"><span>Átlag</span><strong>${s.avg.toFixed(1)}%</strong></div>
    <div class="stat"><span>Legjobb</span><strong>${escapeHtml(s.best)}</strong></div>
    <div class="stat"><span>Leggyengébb</span><strong>${escapeHtml(s.worst)}</strong></div>
    <div class="stat"><span>Jegyek</span><strong>5:${s.gradeCounts[5]} 4:${s.gradeCounts[4]} 3:${s.gradeCounts[3]}</strong></div>
    <div class="stat"><span>Alsó jegyek</span><strong>2:${s.gradeCounts[2]} 1:${s.gradeCounts[1]}</strong></div>`;
}
function renderSaved() {
  els.savedList.innerHTML = '';
  if (!state.saved.length) { els.savedList.innerHTML = '<p class="empty">Nincs mentett dolgozat.</p>'; return; }
  state.saved.slice().reverse().forEach((item) => {
    const div = document.createElement('div');
    div.className = 'saved-item';
    div.innerHTML = `<strong>${escapeHtml(item.title || 'Névtelen dolgozat')}</strong><small>${escapeHtml(item.className || 'Osztály nélkül')} • ${item.students.length} diák • ${new Date(item.savedAt).toLocaleString('hu-HU')}</small><div class="saved-actions"><button class="secondary" type="button">Betöltés</button><button class="danger" type="button">Törlés</button></div>`;
    const [loadBtn, delBtn] = div.querySelectorAll('button');
    loadBtn.addEventListener('click', () => loadSaved(item.id));
    delBtn.addEventListener('click', () => { state.saved = state.saved.filter(x => x.id !== item.id); updateAll(); toast('Mentés törölve.'); });
    els.savedList.appendChild(div);
  });
}
function updateQuick() {
  const val = els.quickPoints.value;
  if (val === '') { els.quickPercent.textContent = '0%'; els.quickGrade.textContent = 'Jegy: -'; els.quickText.textContent = 'Írj be pontszámot.'; return; }
  const pct = percent(val);
  const grade = gradeFor(pct);
  els.quickPercent.textContent = `${pct.toFixed(1)}%`;
  els.quickGrade.textContent = `Jegy: ${grade}`;
  els.quickText.textContent = `${Number(val).toLocaleString('hu-HU')} pont / ${Number(state.maxPoints).toLocaleString('hu-HU')} pont`;
}
function syncInputs() {
  els.workTitle.value = state.title;
  els.className.value = state.className;
  els.maxPoints.value = state.maxPoints;
}
function updateAll() {
  state.title = els.workTitle.value;
  state.className = els.className.value;
  state.maxPoints = Number(els.maxPoints.value) || 100;
  renderStudents(); renderStats(); renderSaved(); updateQuick(); persist();
}
function saveCurrent() {
  const snapshot = {
    id: state.id,
    title: state.title || els.workTitle.value || 'Névtelen dolgozat',
    className: state.className || els.className.value || '',
    maxPoints: Number(state.maxPoints) || 100,
    scale: structuredClone(state.scale),
    students: structuredClone(state.students),
    savedAt: new Date().toISOString()
  };
  state.saved = state.saved.filter(x => x.id !== snapshot.id);
  state.saved.push(snapshot);
  updateAll(); toast('Dolgozat elmentve.');
}
function loadSaved(id) {
  const item = state.saved.find(x => x.id === id); if (!item) return;
  state = { ...state, id:item.id, title:item.title, className:item.className, maxPoints:item.maxPoints, scale:structuredClone(item.scale), students:structuredClone(item.students) };
  syncInputs(); renderScale(); updateAll(); toast('Dolgozat betöltve.');
}
function newWork() {
  state.id = crypto.randomUUID(); state.title=''; state.className=''; state.maxPoints=100; state.students=[];
  syncInputs(); updateAll(); toast('Új dolgozat indítva.');
}
function exportCsv() {
  const rows = [['Dolgozat', state.title], ['Osztály', state.className], ['Max pont', state.maxPoints], [], ['Név','Pont','Százalék','Jegy']];
  state.students.forEach(s => { const pct = percent(s.points); rows.push([s.name, s.points, pct.toFixed(1)+'%', gradeFor(pct)]); });
  const csv = rows.map(r => r.map(cell => `"${String(cell).replaceAll('"','""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${safeFileName(state.title || 'tanarseged-dolgozat')}.csv`; a.click(); URL.revokeObjectURL(a.href);
}
function safeFileName(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'tanarseged'; }
function escapeHtml(str) { return String(str).replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

els.studentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = els.studentName.value.trim(); const points = Number(els.studentPoints.value);
  if (!name || Number.isNaN(points)) return;
  state.students.push({ id: crypto.randomUUID(), name, points });
  els.studentName.value = ''; els.studentPoints.value = ''; els.studentName.focus(); updateAll();
});
[els.workTitle, els.className, els.maxPoints, els.quickPoints].forEach(el => el.addEventListener('input', updateAll));
els.saveBtn.addEventListener('click', saveCurrent);
els.exportCsvBtn.addEventListener('click', exportCsv);
els.printBtn.addEventListener('click', () => window.print());
els.newWorkBtn.addEventListener('click', newWork);
els.resetScaleBtn.addEventListener('click', () => { state.scale = structuredClone(defaultScale); renderScale(); updateAll(); toast('Ponthatárok visszaállítva.'); });

load(); syncInputs(); renderScale(); updateAll();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
