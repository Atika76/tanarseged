const DATA_KEY = 'tanarseged_pro_v13';
const LEGACY_KEY = 'tanarseged_pro_v12_clean';
const DEFAULT_SCALE = [{ grade: 5, min: 85 }, { grade: 4, min: 70 }, { grade: 3, min: 55 }, { grade: 2, min: 40 }, { grade: 1, min: 0 }];
const $ = id => document.getElementById(id);
const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const todayIso = () => new Date().toISOString().slice(0, 10);

function emptyData(){
  return { version: 13, activeClassId: '', activeAssessmentId: '', classes: [], assessments: [], homeworks: [], lessons: [], tasks: [], calledHistory: {} };
}

let data = emptyData();
let toastTimer;

function toast(message){
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function save(){
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

function cleanString(value){ return String(value ?? '').trim(); }

function studentFrom(value){
  return { id: uid(), name: cleanString(value), active: true };
}

function createClass(name, subject = '', students = []){
  return { id: uid(), name: cleanString(name) || 'Új osztály', subject: cleanString(subject), students: students.map(student => typeof student === 'string' ? studentFrom(student) : ({ id: student.id || uid(), name: cleanString(student.name), active: student.active !== false })).filter(student => student.name) };
}

function createAssessment(classId = data.activeClassId){
  const schoolClass = getClass(classId);
  return { id: uid(), classId: classId || '', title: '', subject: schoolClass?.subject || '', date: todayIso(), maxPoints: 100, scale: clone(DEFAULT_SCALE), results: {}, savedAt: new Date().toISOString() };
}

function migrateLegacy(legacy){
  const migrated = emptyData();
  const sourceStudents = Array.isArray(legacy?.students) ? legacy.students.map(student => student.name || student).filter(Boolean) : [];
  if(!legacy || (!legacy.className && !sourceStudents.length && !Array.isArray(legacy.saved))) return migrated;
  const schoolClass = createClass(legacy.className || 'Korábbi osztály', '', sourceStudents);
  migrated.classes.push(schoolClass);
  migrated.activeClassId = schoolClass.id;
  const toAssessment = item => {
    const assessment = createAssessment(schoolClass.id);
    assessment.title = cleanString(item.title || legacy.title || 'Korábbi dolgozat');
    assessment.classId = schoolClass.id;
    assessment.maxPoints = Number(item.maxPoints || legacy.maxPoints) || 100;
    assessment.scale = Array.isArray(item.scale || legacy.scale) ? clone(item.scale || legacy.scale) : clone(DEFAULT_SCALE);
    assessment.date = item.savedAt ? String(item.savedAt).slice(0, 10) : todayIso();
    (item.students || legacy.students || []).forEach(oldStudent => {
      const name = cleanString(oldStudent.name || oldStudent);
      if(!name) return;
      let student = schoolClass.students.find(candidate => candidate.name.toLocaleLowerCase('hu-HU') === name.toLocaleLowerCase('hu-HU'));
      if(!student){ student = studentFrom(name); schoolClass.students.push(student); }
      assessment.results[student.id] = { points: Number(oldStudent.points), bonus: 0, status: 'ok' };
    });
    return assessment;
  };
  if(Array.isArray(legacy.saved)) legacy.saved.forEach(item => migrated.assessments.push(toAssessment(item)));
  if(!migrated.assessments.length) migrated.assessments.push(toAssessment(legacy));
  migrated.activeAssessmentId = migrated.assessments[0].id;
  return migrated;
}

function normalizeData(candidate){
  const safe = emptyData();
  if(!candidate || typeof candidate !== 'object') return safe;
  safe.classes = Array.isArray(candidate.classes) ? candidate.classes.map(raw => createClass(raw.name, raw.subject, Array.isArray(raw.students) ? raw.students : [])).map((schoolClass, index) => ({ ...schoolClass, id: candidate.classes[index].id || schoolClass.id })) : [];
  safe.assessments = Array.isArray(candidate.assessments) ? candidate.assessments.map(raw => ({
    id: raw.id || uid(), classId: raw.classId || '', title: cleanString(raw.title), subject: cleanString(raw.subject), date: /^\d{4}-\d{2}-\d{2}$/.test(raw.date || '') ? raw.date : todayIso(), maxPoints: clamp(Number(raw.maxPoints) || 100, 1, 10000),
    scale: Array.isArray(raw.scale) && raw.scale.length === 5 ? raw.scale.map(row => ({ grade: Number(row.grade), min: clamp(Number(row.min) || 0, 0, 100) })) : clone(DEFAULT_SCALE),
    results: raw.results && typeof raw.results === 'object' ? raw.results : {}, savedAt: raw.savedAt || new Date().toISOString()
  })) : [];
  safe.homeworks = Array.isArray(candidate.homeworks) ? candidate.homeworks.map(raw => ({ id: raw.id || uid(), classId: raw.classId || '', subject: cleanString(raw.subject), deadline: raw.deadline || '', text: cleanString(raw.text), note: cleanString(raw.note), done: Boolean(raw.done), createdAt: raw.createdAt || new Date().toISOString() })) : [];
  safe.lessons = Array.isArray(candidate.lessons) ? candidate.lessons.map(raw => ({ id: raw.id || uid(), classId: raw.classId || '', subject: cleanString(raw.subject), topic: cleanString(raw.topic), date: raw.date || '', output: String(raw.output || ''), createdAt: raw.createdAt || new Date().toISOString() })) : [];
  safe.tasks = Array.isArray(candidate.tasks) ? candidate.tasks.map(raw => ({ id: raw.id || uid(), text: cleanString(raw.text), date: raw.date || '', done: Boolean(raw.done) })).filter(task => task.text) : [];
  safe.calledHistory = candidate.calledHistory && typeof candidate.calledHistory === 'object' ? candidate.calledHistory : {};
  safe.activeClassId = safe.classes.some(schoolClass => schoolClass.id === candidate.activeClassId) ? candidate.activeClassId : (safe.classes[0]?.id || '');
  safe.activeAssessmentId = safe.assessments.some(assessment => assessment.id === candidate.activeAssessmentId) ? candidate.activeAssessmentId : (safe.assessments[0]?.id || '');
  return safe;
}

function load(){
  try {
    const stored = JSON.parse(localStorage.getItem(DATA_KEY));
    if(stored){ data = normalizeData(stored); return; }
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if(legacy){ data = migrateLegacy(legacy); save(); toast('A korábbi dolgozatadatok átkerültek a v13-ba.'); }
  } catch { data = emptyData(); }
}

function getClass(id = data.activeClassId){ return data.classes.find(schoolClass => schoolClass.id === id); }
function activeStudents(classId = data.activeClassId){ return (getClass(classId)?.students || []).filter(student => student.active !== false); }
function currentAssessment(){ return data.assessments.find(assessment => assessment.id === data.activeAssessmentId); }
function assessmentById(id){ return data.assessments.find(assessment => assessment.id === id); }
function validAssessmentStudents(assessment = currentAssessment()){
  if(!assessment) return [];
  return activeStudents(assessment.classId);
}

function formatDate(value){
  if(!value) return 'nincs megadva';
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? 'nincs megadva' : parsed.toLocaleDateString('hu-HU', { month: 'long', day: 'numeric' });
}

function dateSortValue(value){ return value ? new Date(`${value}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER; }
function className(classId){ return getClass(classId)?.name || 'Osztály nélkül'; }

function showTab(tabName){
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.tab === tabName));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === `tab-${tabName}`));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function populateClassSelect(id, selected = data.activeClassId){
  const select = $(id);
  const previous = selected || '';
  select.replaceChildren();
  if(!data.classes.length){
    const option = new Option('Előbb hozz létre osztályt', '');
    option.disabled = true;
    option.selected = true;
    select.add(option);
    select.disabled = true;
    return;
  }
  select.disabled = false;
  data.classes.forEach(schoolClass => select.add(new Option(schoolClass.name, schoolClass.id, false, schoolClass.id === previous)));
  if(!select.value) select.value = data.activeClassId;
}

function renderSelectors(){
  const assessment = currentAssessment();
  populateClassSelect('globalClassSelect');
  populateClassSelect('assessmentClass', assessment?.classId || data.activeClassId);
  populateClassSelect('hwClass');
  populateClassSelect('lessonClass');
  populateClassSelect('textClass');
  populateClassSelect('toolsClass');
}

function renderHero(){
  $('heroClassCount').textContent = data.classes.length;
  $('heroStudentCount').textContent = activeStudents().length;
  $('todayDate').textContent = new Date().toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function renderDashboard(){
  const activeClassId = data.activeClassId;
  const openHomeworks = data.homeworks.filter(homework => homework.classId === activeClassId && !homework.done);
  const lessons = data.lessons.filter(lesson => lesson.classId === activeClassId);
  const assessment = currentAssessment();
  const missingScores = assessment && assessment.classId === activeClassId ? validAssessmentStudents(assessment).filter(student => {
    const result = assessment.results[student.id];
    return !result || (result.status === 'ok' && (result.points === '' || result.points === null || result.points === undefined));
  }).length : 0;
  $('metricHomeworks').textContent = openHomeworks.length;
  $('metricLessons').textContent = lessons.length;
  $('metricMissingScores').textContent = missingScores;

  const events = [
    ...openHomeworks.map(homework => ({ date: homework.deadline, type: 'Házi', title: `${homework.subject || 'Tantárgy'} – ${homework.text || 'Feladat nélkül'}` })),
    ...lessons.map(lesson => ({ date: lesson.date, type: 'Óraterv', title: `${lesson.subject || 'Tantárgy'} – ${lesson.topic || 'Téma nélkül'}` }))
  ].sort((a, b) => dateSortValue(a.date) - dateSortValue(b.date)).slice(0, 6);
  const timeline = $('todayTimeline');
  timeline.replaceChildren();
  if(!events.length){ timeline.innerHTML = '<p class="empty">Még nincs elmentett óraterv vagy nyitott házi az aktív osztályhoz.</p>'; }
  events.forEach(event => {
    const item = document.createElement('div'); item.className = 'timeline-item';
    const date = document.createElement('span'); date.className = 'timeline-date'; date.textContent = event.date ? formatDate(event.date) : 'határidő nélkül';
    const copy = document.createElement('div'); copy.innerHTML = `<b>${event.type}</b><p>${escapeHtml(event.title)}</p>`;
    item.append(date, copy); timeline.append(item);
  });

  const taskList = $('taskList'); taskList.replaceChildren();
  if(!data.tasks.length) taskList.innerHTML = '<p class="empty">Nincs saját teendő. Adj hozzá egy gyors emlékeztetőt.</p>';
  data.tasks.slice().sort((a,b) => Number(a.done) - Number(b.done) || dateSortValue(a.date) - dateSortValue(b.date)).forEach(task => {
    const item = document.createElement('div'); item.className = `task-item${task.done ? ' done' : ''}`;
    const check = document.createElement('input'); check.type = 'checkbox'; check.checked = task.done; check.setAttribute('aria-label', `${task.text} elkészült`);
    check.addEventListener('change', () => { task.done = check.checked; save(); renderDashboard(); });
    const text = document.createElement('p'); text.textContent = task.date ? `${task.text} · ${formatDate(task.date)}` : task.text;
    const remove = document.createElement('button'); remove.className = 'icon-button'; remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `${task.text} törlése`);
    remove.addEventListener('click', () => { data.tasks = data.tasks.filter(candidate => candidate.id !== task.id); save(); renderDashboard(); });
    item.append(check, text, remove); taskList.append(item);
  });
}

function renderClasses(){
  const list = $('classList'); list.replaceChildren();
  if(!data.classes.length) list.innerHTML = '<p class="empty">Még nincs osztály. Kezdd egy osztály és a névsor felvételével.</p>';
  data.classes.forEach(schoolClass => {
    const item = document.createElement('div'); item.className = 'saved-item';
    item.innerHTML = `<b>${escapeHtml(schoolClass.name)}</b><small>${escapeHtml(schoolClass.subject || 'Tantárgy nélkül')} · ${schoolClass.students.filter(student => student.active !== false).length} aktív tanuló</small>`;
    const button = document.createElement('button'); button.className = schoolClass.id === data.activeClassId ? 'secondary' : ''; button.type = 'button'; button.textContent = schoolClass.id === data.activeClassId ? 'Aktív osztály' : 'Kiválasztás';
    button.addEventListener('click', () => { data.activeClassId = schoolClass.id; if(!currentAssessment() || currentAssessment().classId !== schoolClass.id) data.activeAssessmentId = data.assessments.find(assessment => assessment.classId === schoolClass.id)?.id || ''; save(); renderAll(); });
    item.append(button); list.append(item);
  });
  const schoolClass = getClass();
  $('classEditor').classList.toggle('is-disabled', !schoolClass);
  $('classEditorTitle').textContent = schoolClass ? `${schoolClass.name} kezelése` : 'Osztály kezelése';
  $('editClassName').value = schoolClass?.name || '';
  $('editClassSubject').value = schoolClass?.subject || '';
  $('deleteClassBtn').disabled = !schoolClass;
  $('saveClassBtn').disabled = !schoolClass;
  $('addStudentsBtn').disabled = !schoolClass;
  const rows = $('rosterRows'); rows.replaceChildren();
  if(!schoolClass){ rows.innerHTML = '<tr><td colspan="3" class="empty">Válassz vagy hozz létre osztályt.</td></tr>'; return; }
  if(!schoolClass.students.length){ rows.innerHTML = '<tr><td colspan="3" class="empty">A névsor még üres.</td></tr>'; return; }
  schoolClass.students.forEach(student => {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td'); const nameInput = document.createElement('input'); nameInput.value = student.name; nameInput.setAttribute('aria-label', 'Tanuló neve');
    nameInput.addEventListener('change', () => { const next = cleanString(nameInput.value); if(next){ student.name = next; save(); renderAll(); } else { nameInput.value = student.name; } }); nameCell.append(nameInput);
    const activeCell = document.createElement('td'); const activeInput = document.createElement('input'); activeInput.type = 'checkbox'; activeInput.checked = student.active !== false; activeInput.setAttribute('aria-label', `${student.name} aktív`);
    activeInput.addEventListener('change', () => { student.active = activeInput.checked; save(); renderAll(); }); activeCell.append(activeInput);
    const actionCell = document.createElement('td'); const remove = document.createElement('button'); remove.className = 'danger'; remove.type = 'button'; remove.textContent = 'Törlés';
    remove.addEventListener('click', () => { schoolClass.students = schoolClass.students.filter(candidate => candidate.id !== student.id); delete data.calledHistory[student.id]; data.assessments.forEach(assessment => delete assessment.results[student.id]); save(); renderAll(); }); actionCell.append(remove);
    row.append(nameCell, activeCell, actionCell); rows.append(row);
  });
}

function escapeHtml(text){ return String(text ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[character]); }

function resultOf(assessment, studentId){
  const raw = assessment.results[studentId] || {};
  const points = raw.points === '' || raw.points === null || raw.points === undefined || Number.isNaN(Number(raw.points)) ? null : Math.max(0, Number(raw.points));
  const bonus = raw.bonus === '' || raw.bonus === null || raw.bonus === undefined || Number.isNaN(Number(raw.bonus)) ? 0 : Math.max(0, Number(raw.bonus));
  return { points, bonus, status: ['ok','absent','excused'].includes(raw.status) ? raw.status : 'ok' };
}

function scorePercent(result, assessment){
  if(result.points === null || result.status !== 'ok') return null;
  return ((result.points + result.bonus) / Math.max(1, Number(assessment.maxPoints) || 1)) * 100;
}

function gradeFromPercent(percent, scale){
  if(percent === null) return null;
  return [...scale].sort((a,b) => b.min - a.min).find(row => percent >= row.min)?.grade ?? 1;
}

function feedback(percent){
  if(percent === null) return 'Nincs értékelhető eredmény';
  if(percent >= 90) return 'kiemelkedő teljesítmény';
  if(percent >= 75) return 'jó, biztos tudás';
  if(percent >= 60) return 'megfelelő, néhány gyakorlással javítható';
  if(percent >= 40) return 'az alapok megvannak, gyakorlás szükséges';
  return 'célzott ismétlés és gyakorlás javasolt';
}

function normalizeScale(assessment){
  assessment.scale = assessment.scale.map(row => ({ grade: Number(row.grade), min: clamp(Number(row.min) || 0, 0, 100) }));
  assessment.scale.sort((a,b) => b.grade - a.grade);
  assessment.scale.forEach((row, index) => {
    if(row.grade === 1){ row.min = 0; return; }
    const higher = assessment.scale[index - 1];
    const lower = assessment.scale[index + 1];
    const upper = higher ? higher.min - 1 : 100;
    const lowerBound = lower ? lower.min + 1 : 0;
    row.min = clamp(row.min, lowerBound, upper);
  });
}

function renderScale(){
  const box = $('gradeScale'); box.replaceChildren();
  const assessment = currentAssessment();
  if(!assessment){ box.innerHTML = '<p class="empty">Hozz létre előbb osztályt és dolgozatot.</p>'; return; }
  normalizeScale(assessment);
  assessment.scale.forEach(row => {
    const line = document.createElement('div'); line.className = 'scale-row';
    const grade = document.createElement('strong'); grade.textContent = row.grade;
    const input = document.createElement('input'); input.type = 'number'; input.min = '0'; input.max = '100'; input.step = '1'; input.value = row.min; input.disabled = row.grade === 1; input.setAttribute('aria-label', `${row.grade}. jegy ponthatára`);
    input.addEventListener('change', () => { row.min = Number(input.value); normalizeScale(assessment); save(); renderAssessment(); });
    const sign = document.createElement('span'); sign.textContent = '%'; line.append(grade, input, sign); box.append(line);
  });
}

function syncAssessmentInputs(){
  const assessment = currentAssessment();
  const disabled = !assessment;
  ['assessmentTitle','assessmentSubject','assessmentDate','assessmentMaxPoints','quickPoints','quickBonus'].forEach(id => { $(id).disabled = disabled; });
  $('newAssessmentBtn').disabled = !data.classes.length;
  $('saveAssessmentBtn').disabled = disabled;
  if(!assessment){
    $('assessmentTitle').value = ''; $('assessmentSubject').value = ''; $('assessmentDate').value = ''; $('assessmentMaxPoints').value = '100'; return;
  }
  $('assessmentTitle').value = assessment.title;
  $('assessmentSubject').value = assessment.subject;
  $('assessmentDate').value = assessment.date;
  $('assessmentMaxPoints').value = assessment.maxPoints;
}

function updateAssessmentComputed(row, result, assessment){
  const rawPercent = scorePercent(result, assessment);
  const percentCell = row.querySelector('[data-percent]');
  const gradeCell = row.querySelector('[data-grade]');
  const commentCell = row.querySelector('[data-comment]');
  if(rawPercent === null){ percentCell.textContent = result.status === 'absent' ? 'Hiányzott' : result.status === 'excused' ? 'Mentesült' : '–'; gradeCell.textContent = '–'; gradeCell.classList.add('na'); commentCell.textContent = feedback(null); return; }
  const capped = Math.min(100, rawPercent);
  percentCell.textContent = `${capped.toFixed(1)}%${rawPercent > 100 ? ` (+${(rawPercent - 100).toFixed(1)}%)` : ''}`;
  percentCell.classList.toggle('score-over', rawPercent > 100);
  const grade = gradeFromPercent(capped, assessment.scale); gradeCell.textContent = grade; gradeCell.classList.remove('na'); commentCell.textContent = feedback(capped);
}

function renderAssessmentRows(){
  const body = $('assessmentRows'); body.replaceChildren();
  const assessment = currentAssessment();
  if(!assessment){ body.innerHTML = '<tr><td colspan="7" class="empty">Hozz létre egy osztályt, majd egy dolgozatot.</td></tr>'; return; }
  const students = validAssessmentStudents(assessment);
  if(!students.length){ body.innerHTML = '<tr><td colspan="7" class="empty">Az osztálylistában még nincs aktív tanuló.</td></tr>'; return; }
  students.forEach(student => {
    const row = document.createElement('tr');
    const name = document.createElement('td'); name.innerHTML = `<b>${escapeHtml(student.name)}</b>`;
    const result = resultOf(assessment, student.id);
    const pointsCell = document.createElement('td'); const points = document.createElement('input'); points.type = 'number'; points.min = '0'; points.step = '.5'; points.placeholder = '–'; points.value = result.points ?? ''; points.setAttribute('aria-label', `${student.name} elért pontja`); pointsCell.append(points);
    const bonusCell = document.createElement('td'); const bonus = document.createElement('input'); bonus.type = 'number'; bonus.min = '0'; bonus.step = '.5'; bonus.value = result.bonus || ''; bonus.setAttribute('aria-label', `${student.name} bónuszpontja`); bonusCell.append(bonus);
    const statusCell = document.createElement('td'); statusCell.className = 'status-cell'; const status = document.createElement('select'); status.setAttribute('aria-label', `${student.name} státusza`); [['ok','Értékelhető'],['absent','Hiányzott'],['excused','Mentesült']].forEach(([value,label]) => status.add(new Option(label,value,false,result.status === value))); statusCell.append(status);
    const percentCell = document.createElement('td'); percentCell.dataset.percent = 'true';
    const gradeCell = document.createElement('td'); const grade = document.createElement('b'); grade.className = 'grade'; grade.dataset.grade = 'true'; gradeCell.append(grade);
    const commentCell = document.createElement('td'); commentCell.className = 'comment'; commentCell.dataset.comment = 'true';
    row.append(name, pointsCell, bonusCell, statusCell, percentCell, gradeCell, commentCell);
    const persistResult = () => {
      assessment.results[student.id] = { points: points.value === '' ? null : Number(points.value), bonus: bonus.value === '' ? 0 : Number(bonus.value), status: status.value };
      const nextResult = resultOf(assessment, student.id); updateAssessmentComputed(row, nextResult, assessment); save(); renderAssessmentStats(); renderDashboard();
    };
    points.addEventListener('input', persistResult); bonus.addEventListener('input', persistResult); status.addEventListener('change', persistResult);
    updateAssessmentComputed(row, result, assessment); body.append(row);
  });
}

function assessmentNumbers(assessment = currentAssessment()){
  if(!assessment) return { evaluated: [], missing: 0, absent: 0, excused: 0 };
  const students = validAssessmentStudents(assessment);
  const evaluated = [];
  let missing = 0, absent = 0, excused = 0;
  students.forEach(student => {
    const result = resultOf(assessment, student.id);
    if(result.status === 'absent'){ absent++; return; }
    if(result.status === 'excused'){ excused++; return; }
    if(result.points === null){ missing++; return; }
    const percent = Math.min(100, scorePercent(result, assessment));
    evaluated.push({ student, percent, grade: gradeFromPercent(percent, assessment.scale) });
  });
  return { evaluated, missing, absent, excused };
}

function renderAssessmentStats(){
  const box = $('assessmentStats'); box.replaceChildren();
  const assessment = currentAssessment();
  if(!assessment){ box.innerHTML = '<p class="empty">Nincs aktív dolgozat.</p>'; return; }
  const { evaluated, missing, absent, excused } = assessmentNumbers(assessment);
  const average = evaluated.length ? evaluated.reduce((sum, item) => sum + item.percent, 0) / evaluated.length : 0;
  const gradeAverage = evaluated.length ? evaluated.reduce((sum, item) => sum + item.grade, 0) / evaluated.length : 0;
  const pass = evaluated.length ? evaluated.filter(item => item.grade >= 2).length / evaluated.length * 100 : 0;
  const distribution = [5,4,3,2,1].map(grade => `${grade}: ${evaluated.filter(item => item.grade === grade).length}`).join(' · ');
  [['Értékelt', evaluated.length], ['Átlag', evaluated.length ? `${average.toFixed(1)}%` : '–'], ['Jegyátlag', evaluated.length ? gradeAverage.toFixed(2) : '–'], ['Sikeresség', evaluated.length ? `${pass.toFixed(0)}%` : '–'], ['Hiányzik', missing], ['Hiányzott / mentesült', `${absent} / ${excused}`], ['Jegyelőfordulás', distribution]].forEach(([label, value]) => { const stat = document.createElement('div'); stat.className = 'stat'; stat.innerHTML = `<span>${label}</span><strong>${value}</strong>`; box.append(stat); });
}

function renderAssessmentList(){
  const list = $('assessmentList'); list.replaceChildren();
  if(!data.assessments.length){ list.innerHTML = '<p class="empty">Nincs mentett dolgozat.</p>'; return; }
  data.assessments.slice().sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date)).forEach(assessment => {
    const item = document.createElement('div'); item.className = 'saved-item';
    const { evaluated } = assessmentNumbers(assessment);
    item.innerHTML = `<b>${escapeHtml(assessment.title || 'Névtelen dolgozat')}</b><small>${escapeHtml(className(assessment.classId))} · ${formatDate(assessment.date)} · ${evaluated.length} értékelt tanuló</small>`;
    const actions = document.createElement('div'); actions.className = 'saved-actions';
    const loadButton = document.createElement('button'); loadButton.className = 'secondary'; loadButton.type = 'button'; loadButton.textContent = assessment.id === data.activeAssessmentId ? 'Megnyitva' : 'Megnyitás'; loadButton.addEventListener('click', () => { data.activeAssessmentId = assessment.id; data.activeClassId = assessment.classId; save(); renderAll(); showTab('assessments'); });
    const remove = document.createElement('button'); remove.className = 'danger'; remove.type = 'button'; remove.textContent = 'Törlés'; remove.addEventListener('click', () => { if(confirm(`Törlöd ezt a dolgozatot: ${assessment.title || 'Névtelen dolgozat'}?`)){ data.assessments = data.assessments.filter(candidate => candidate.id !== assessment.id); data.activeAssessmentId = data.assessments.find(candidate => candidate.classId === data.activeClassId)?.id || ''; save(); renderAll(); } });
    actions.append(loadButton, remove); item.append(actions); list.append(item);
  });
}

function renderQuickCalc(){
  const assessment = currentAssessment();
  const points = $('quickPoints').value;
  const bonus = $('quickBonus').value;
  if(!assessment || points === ''){ $('quickPercent').textContent = '–'; $('quickGrade').textContent = 'Jegy: –'; $('quickText').textContent = assessment ? 'Írj be pontszámot.' : 'Hozz létre dolgozatot.'; return; }
  const result = { points: Math.max(0, Number(points)), bonus: Math.max(0, Number(bonus) || 0), status: 'ok' };
  const raw = scorePercent(result, assessment); const capped = Math.min(100, raw); const grade = gradeFromPercent(capped, assessment.scale);
  $('quickPercent').textContent = `${capped.toFixed(1)}%${raw > 100 ? ' +' : ''}`; $('quickGrade').textContent = `Jegy: ${grade}`; $('quickText').textContent = feedback(capped);
}

function renderAssessment(){ syncAssessmentInputs(); renderScale(); renderAssessmentRows(); renderAssessmentStats(); renderAssessmentList(); renderQuickCalc(); }

function homeworkMessage(homework){
  return `HÁZI FELADAT\n\nOsztály: ${className(homework.classId)}\nTantárgy: ${homework.subject || '–'}\nHatáridő: ${formatDate(homework.deadline)}\n\nFeladat:\n${homework.text || '–'}\n\nMegjegyzés:\n${homework.note || '–'}`;
}

function renderHomeworks(){
  const list = $('homeworkList'); list.replaceChildren();
  const active = data.homeworks.filter(homework => homework.classId === data.activeClassId).sort((a,b) => Number(a.done) - Number(b.done) || dateSortValue(a.deadline) - dateSortValue(b.deadline));
  if(!active.length){ list.innerHTML = '<p class="empty">Még nincs házi feladat az aktív osztályhoz.</p>'; $('homeworkMessage').value = 'Itt jelenik meg a házi feladat üzenete.'; return; }
  active.forEach(homework => {
    const item = document.createElement('div'); item.className = 'saved-item';
    item.innerHTML = `<b>${escapeHtml(homework.subject || 'Tantárgy nélkül')} · ${homework.done ? 'Lezárva' : formatDate(homework.deadline)}</b><small>${escapeHtml((homework.text || '').slice(0,150))}${homework.text.length > 150 ? '…' : ''}</small>`;
    const actions = document.createElement('div'); actions.className = 'saved-actions';
    const open = document.createElement('button'); open.className = 'secondary'; open.type = 'button'; open.textContent = 'Megnyitás'; open.addEventListener('click', () => { $('homeworkMessage').value = homeworkMessage(homework); });
    const copy = document.createElement('button'); copy.className = 'secondary'; copy.type = 'button'; copy.textContent = 'Másolás'; copy.addEventListener('click', () => copyText(homeworkMessage(homework)));
    const done = document.createElement('button'); done.className = 'secondary'; done.type = 'button'; done.textContent = homework.done ? 'Újranyitás' : 'Lezárás'; done.addEventListener('click', () => { homework.done = !homework.done; save(); renderAll(); });
    const remove = document.createElement('button'); remove.className = 'danger'; remove.type = 'button'; remove.textContent = 'Törlés'; remove.addEventListener('click', () => { data.homeworks = data.homeworks.filter(candidate => candidate.id !== homework.id); save(); renderAll(); });
    actions.append(open, copy, done, remove); item.append(actions); list.append(item);
  });
  $('homeworkMessage').value = homeworkMessage(active[0]);
}

function lessonParts(minutes){
  const intro = Math.max(3, Math.round(minutes * .15));
  const practice = Math.max(3, Math.round(minutes * .25));
  const close = Math.max(2, Math.round(minutes * .15));
  return { intro, main: Math.max(4, minutes - intro - practice - close), practice, close };
}

function generateLesson(){
  const schoolClass = getClass($('lessonClass').value || data.activeClassId);
  const subject = cleanString($('lessonSubject').value) || schoolClass?.subject || 'tantárgy';
  const topic = cleanString($('lessonTopic').value) || 'óra témája';
  const minutes = clamp(Number($('lessonMinutes').value) || 45, 15, 120);
  const goal = cleanString($('lessonGoal').value) || 'a tananyag megértése és gyakorlása';
  const differentiation = cleanString($('lessonDifferentiation').value) || 'Páros segítség és eltérő nehézségű gyakorlófeladatok.';
  const resources = cleanString($('lessonResources').value) || 'Tanári magyarázat, tanulói füzet és rövid formatív visszajelzés.';
  const homework = cleanString($('lessonHomework').value) || 'Rövid, célzott gyakorlás az óra témájából.';
  const date = $('lessonDate').value || todayIso();
  const parts = lessonParts(minutes);
  $('lessonOutput').value = `ÓRATERV\nDátum: ${formatDate(date)}\nOsztály: ${schoolClass?.name || '–'}\nTantárgy: ${subject}\nTéma: ${topic}\nIdőtartam: ${minutes} perc\nFő cél / fejlesztendő készség: ${goal}\n\n1. Ráhangolódás – ${parts.intro} perc\n• Előzetes tudás aktiválása rövid kérdésekkel.\n• A mai téma kapcsolása hétköznapi példához.\n\n2. Új ismeret és közös feldolgozás – ${parts.main} perc\n• A(z) ${topic} lényegi fogalmainak tisztázása.\n• Tanári modellezés, irányított kérdések és közös példa.\n\n3. Gyakorlás és differenciálás – ${parts.practice} perc\n• Önálló vagy páros feladatmegoldás.\n• Differenciálás: ${differentiation}\n\n4. Lezárás és visszajelzés – ${parts.close} perc\n• Kilépőkártya: „Mi volt ma a legfontosabb felismerés?”\n• Gyors formatív visszajelzés.\n\nEszközök és értékelés:\n${resources}\n\nHázi feladat:\n${homework}`;
}

function renderLessons(){
  const list = $('lessonList'); list.replaceChildren();
  const lessons = data.lessons.filter(lesson => lesson.classId === data.activeClassId).sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date));
  if(!lessons.length){ list.innerHTML = '<p class="empty">Még nincs mentett óraterv az aktív osztályhoz.</p>'; return; }
  lessons.forEach(lesson => {
    const item = document.createElement('div'); item.className = 'saved-item'; item.innerHTML = `<b>${escapeHtml(lesson.topic || 'Téma nélküli óraterv')}</b><small>${formatDate(lesson.date)} · ${escapeHtml(lesson.subject || 'Tantárgy nélkül')}</small>`;
    const actions = document.createElement('div'); actions.className = 'saved-actions';
    const loadButton = document.createElement('button'); loadButton.className = 'secondary'; loadButton.type = 'button'; loadButton.textContent = 'Megnyitás'; loadButton.addEventListener('click', () => { data.activeClassId = lesson.classId; $('lessonClass').value = lesson.classId; $('lessonSubject').value = lesson.subject; $('lessonTopic').value = lesson.topic; $('lessonDate').value = lesson.date; $('lessonOutput').value = lesson.output; save(); renderAll(); showTab('lesson'); });
    const remove = document.createElement('button'); remove.className = 'danger'; remove.type = 'button'; remove.textContent = 'Törlés'; remove.addEventListener('click', () => { data.lessons = data.lessons.filter(candidate => candidate.id !== lesson.id); save(); renderAll(); }); actions.append(loadButton, remove); item.append(actions); list.append(item);
  });
}

function renderTextStudents(){
  const selected = $('textClass').value || data.activeClassId;
  const select = $('txtStudent'); select.replaceChildren();
  const students = activeStudents(selected);
  select.add(new Option('Válassz tanulót vagy írd át később', ''));
  students.forEach(student => select.add(new Option(student.name, student.id)));
}

function generateText(){
  const student = $('txtStudent').selectedOptions[0]?.textContent || 'A tanuló';
  const topic = cleanString($('txtTopic').value) || 'az aktuális tananyag';
  const details = cleanString($('txtDetails').value) || 'Az órai munka és a felkészülés alapján rövid, célzott gyakorlás javasolt.';
  const action = cleanString($('txtAction').value) || 'Köszönöm az együttműködést.';
  const type = $('txtType').value;
  const tone = $('txtTone').value;
  const opener = tone === 'hivatalos' ? 'Tisztelt Szülő!' : tone === 'baratsagos' ? 'Kedves Szülő!' : 'Kedves Szülő!';
  const close = tone === 'hivatalos' ? 'Üdvözlettel:' : tone === 'baratsagos' ? 'Köszönöm a segítséget!' : 'Bízom benne, hogy közösen hamar látható fejlődést érünk el.';
  const supportive = tone === 'batorito' ? ' Fontos, hogy a következő kis lépésekre építsünk.' : '';
  let text;
  if(type === 'szulo') text = `${opener}\n\nSzeretném röviden tájékoztatni ${student} előrehaladásáról (${topic}).\n\n${details}${supportive}\n\n${action}\n\n${close}`;
  else if(type === 'dicseret') text = `${student} munkáját szeretném külön megdicsérni.\n\nA(z) ${topic} témában figyelmesen, aktívan és igényesen dolgozott. ${details}\n\n${tone === 'hivatalos' ? 'Kiemelkedő teljesítményét elismerem.' : 'Csak így tovább!'}`;
  else if(type === 'figyelmeztetes') text = `${student} esetében a(z) ${topic} kapcsán több odafigyelésre és rendszeresebb munkára van szükség.\n\n${details}${supportive}\n\n${action}`;
  else if(type === 'hianyzo_hazi') text = `${opener}\n\n${student} részéről a(z) ${topic} témához kapcsolódó házi feladat hiányzik.\n\n${details}\n\n${action}\n\n${close}`;
  else text = `${student} a(z) ${topic} témában a következő visszajelzést kapja:\n\n${details}${supportive}\n\nJavaslat: rövid, rendszeres ismétlés és célzott gyakorlófeladatok.\n${action}`;
  $('textOutput').value = text;
}

function historyFor(studentId){ return data.calledHistory[studentId] || { count: 0, lastAt: '' }; }

function pickRandom(){
  const students = activeStudents($('toolsClass').value || data.activeClassId);
  if(!students.length){ $('toolsOutput').value = 'Az osztálylistában még nincs aktív tanuló.'; return; }
  const minimum = Math.min(...students.map(student => historyFor(student.id).count));
  const candidates = students.filter(student => historyFor(student.id).count === minimum);
  const student = candidates[Math.floor(Math.random() * candidates.length)];
  const history = historyFor(student.id); data.calledHistory[student.id] = { count: history.count + 1, lastAt: new Date().toISOString() }; save();
  $('toolsOutput').value = `Véletlen felelő: ${student.name}\nFeladat: ${cleanString($('classTask').value) || '–'}\n\nMéltányosság: ${history.count} korábbi választással került a legritkábban választottak közé.`;
}

function parsePairs(value){
  return cleanString(value).split(/\n|;/).map(line => line.split(/\s+-\s+/).map(cleanString).filter(Boolean)).filter(pair => pair.length === 2);
}

function shuffled(values){ return values.map(value => ({ value, order: Math.random() })).sort((a,b) => a.order - b.order).map(item => item.value); }

function canJoin(group, student, pairs){
  return !group.some(member => pairs.some(pair => (pair[0] === member.name && pair[1] === student.name) || (pair[1] === member.name && pair[0] === student.name)));
}

function makeGroups(){
  const students = shuffled(activeStudents($('toolsClass').value || data.activeClassId));
  const count = clamp(Number($('groupCount').value) || 3, 2, 10);
  if(!students.length){ $('toolsOutput').value = 'Az osztálylistában még nincs aktív tanuló.'; return; }
  const pairs = parsePairs($('avoidPairs').value);
  const groups = Array.from({ length: Math.min(count, students.length) }, () => []);
  students.forEach(student => {
    const allowed = groups.filter(group => canJoin(group, student, pairs));
    const targetSet = allowed.length ? allowed : groups;
    const target = targetSet.reduce((smallest, group) => group.length < smallest.length ? group : smallest, targetSet[0]);
    target.push(student);
  });
  const note = pairs.length ? '\n\nAz elkülönítendő párokat a program lehetőség szerint külön csoportba tette.' : '';
  $('toolsOutput').value = groups.map((group, index) => `${index + 1}. csoport (${group.length} fő): ${group.map(student => student.name).join(', ')}`).join('\n') + `\n\nFeladat: ${cleanString($('classTask').value) || '–'}${note}`;
}

async function copyText(value){
  try { await navigator.clipboard.writeText(value); toast('Vágólapra másolva.'); }
  catch { toast('A másolás nem sikerült ebben a böngészőben.'); }
}

function download(name, content, type){
  const link = document.createElement('a'); const url = URL.createObjectURL(new Blob([content], { type }));
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCsv(){
  const assessment = currentAssessment();
  if(!assessment){ toast('Nincs exportálható dolgozat.'); return; }
  const rows = [['Dolgozat', assessment.title], ['Osztály', className(assessment.classId)], ['Tantárgy', assessment.subject], ['Dátum', assessment.date], ['Max. pont', assessment.maxPoints], [], ['Név','Pont','Bónusz','Státusz','Százalék','Jegy','Visszajelzés']];
  validAssessmentStudents(assessment).forEach(student => { const result = resultOf(assessment, student.id); const raw = scorePercent(result, assessment); const percent = raw === null ? '' : `${Math.min(100,raw).toFixed(1)}%`; rows.push([student.name, result.points ?? '', result.bonus || '', result.status === 'ok' ? 'Értékelhető' : result.status === 'absent' ? 'Hiányzott' : 'Mentesült', percent, raw === null ? '' : gradeFromPercent(Math.min(100,raw), assessment.scale), feedback(raw === null ? null : Math.min(100,raw))]); });
  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"','""')}"`).join(';')).join('\n');
  download(`tanarseged-${(assessment.title || 'dolgozat').replace(/[^a-z0-9áéíóöőúüű-]+/gi,'-')}.csv`, `\ufeff${csv}`, 'text/csv;charset=utf-8');
}

function assessmentSummary(){
  const assessment = currentAssessment(); if(!assessment) return '';
  const { evaluated, missing, absent, excused } = assessmentNumbers(assessment);
  const average = evaluated.length ? evaluated.reduce((sum,item) => sum + item.percent, 0) / evaluated.length : 0;
  const grades = [5,4,3,2,1].map(grade => `${grade}: ${evaluated.filter(item => item.grade === grade).length}`).join(', ');
  return `Dolgozat: ${assessment.title || 'Névtelen'}\nOsztály: ${className(assessment.classId)}\nTantárgy: ${assessment.subject || '–'}\nMax. pont: ${assessment.maxPoints}\nÉrtékelt tanulók: ${evaluated.length}\nÁtlag: ${evaluated.length ? `${average.toFixed(1)}%` : '–'}\nJegyek: ${grades}\nHiányzó pont: ${missing}\nHiányzott: ${absent}\nMentesült: ${excused}`;
}

function addStudentNames(raw){
  const schoolClass = getClass(); if(!schoolClass){ toast('Előbb hozz létre vagy válassz osztályt.'); return; }
  const candidates = raw.split(/\n|;|,/).map(cleanString).filter(Boolean);
  const known = new Set(schoolClass.students.map(student => student.name.toLocaleLowerCase('hu-HU')));
  const fresh = candidates.filter(name => { const key = name.toLocaleLowerCase('hu-HU'); if(known.has(key)) return false; known.add(key); return true; });
  schoolClass.students.push(...fresh.map(studentFrom)); save(); renderAll(); toast(fresh.length ? `${fresh.length} tanuló hozzáadva.` : 'Nem találtam új tanulónevet.');
}

function updateActiveClass(classId){
  if(!getClass(classId)) return;
  data.activeClassId = classId;
  const assessment = currentAssessment();
  if(!assessment || assessment.classId !== classId) data.activeAssessmentId = data.assessments.find(candidate => candidate.classId === classId)?.id || '';
  save(); renderAll();
}

function renderAll(){ renderSelectors(); renderHero(); renderDashboard(); renderClasses(); renderAssessment(); renderHomeworks(); renderLessons(); renderTextStudents(); }

function bindEvents(){
  document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));
  document.querySelectorAll('.go-tab').forEach(button => button.addEventListener('click', () => showTab(button.dataset.go)));
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => copyText($(button.dataset.copy).value || $(button.dataset.copy).textContent)));
  ['globalClassSelect','hwClass','lessonClass','textClass','toolsClass'].forEach(id => $(id).addEventListener('change', event => updateActiveClass(event.target.value)));
  $('assessmentClass').addEventListener('change', event => {
    const assessment = currentAssessment(); if(!assessment) return; assessment.classId = event.target.value; data.activeClassId = event.target.value; if(!assessment.subject) assessment.subject = getClass(event.target.value)?.subject || ''; save(); renderAll();
  });

  $('taskForm').addEventListener('submit', event => { event.preventDefault(); const text = cleanString($('taskText').value); if(!text) return; data.tasks.push({ id: uid(), text, date: $('taskDate').value, done: false }); $('taskText').value = ''; $('taskDate').value = ''; save(); renderDashboard(); });
  $('addClassBtn').addEventListener('click', () => { const name = cleanString($('newClassName').value); if(!name){ toast('Adj nevet az osztálynak.'); return; } const schoolClass = createClass(name, $('newClassSubject').value); data.classes.push(schoolClass); data.activeClassId = schoolClass.id; const assessment = createAssessment(schoolClass.id); data.assessments.push(assessment); data.activeAssessmentId = assessment.id; $('newClassName').value = ''; $('newClassSubject').value = ''; save(); renderAll(); toast('Osztály létrehozva. Most add hozzá a névsort.'); });
  $('saveClassBtn').addEventListener('click', () => { const schoolClass = getClass(); if(!schoolClass) return; const name = cleanString($('editClassName').value); if(!name){ toast('Az osztály neve nem lehet üres.'); return; } schoolClass.name = name; schoolClass.subject = cleanString($('editClassSubject').value); save(); renderAll(); toast('Osztályadatok mentve.'); });
  $('deleteClassBtn').addEventListener('click', () => { const schoolClass = getClass(); if(!schoolClass || !confirm(`${schoolClass.name} és a hozzá tartozó dolgozatok, házik, óratervek törlődnek. Folytatod?`)) return; const studentIds = new Set(schoolClass.students.map(student => student.id)); data.classes = data.classes.filter(candidate => candidate.id !== schoolClass.id); data.assessments = data.assessments.filter(assessment => assessment.classId !== schoolClass.id); data.homeworks = data.homeworks.filter(homework => homework.classId !== schoolClass.id); data.lessons = data.lessons.filter(lesson => lesson.classId !== schoolClass.id); studentIds.forEach(id => delete data.calledHistory[id]); data.activeClassId = data.classes[0]?.id || ''; data.activeAssessmentId = data.assessments.find(assessment => assessment.classId === data.activeClassId)?.id || ''; save(); renderAll(); toast('Osztály törölve.'); });
  $('addStudentsBtn').addEventListener('click', () => { addStudentNames($('studentPaste').value); $('studentPaste').value = ''; });
  $('rosterImportInput').addEventListener('change', async event => { const file = event.target.files?.[0]; if(!file) return; try { const text = await file.text(); const lines = text.replace(/^\ufeff/, '').split(/\r?\n/).map(line => line.split(/[;,\t]/)[0]).filter(line => line.trim()); if(lines.length && /név|tanuló/i.test(lines[0])) lines.shift(); addStudentNames(lines.join('\n')); } catch { toast('A CSV-fájl beolvasása nem sikerült.'); } finally { event.target.value = ''; } });

  $('newAssessmentBtn').addEventListener('click', () => { if(!data.activeClassId){ toast('Előbb hozz létre osztályt.'); return; } const assessment = createAssessment(data.activeClassId); data.assessments.push(assessment); data.activeAssessmentId = assessment.id; save(); renderAll(); toast('Új dolgozat létrehozva.'); });
  ['assessmentTitle','assessmentSubject','assessmentDate','assessmentMaxPoints'].forEach(id => $(id).addEventListener('input', () => { const assessment = currentAssessment(); if(!assessment) return; assessment.title = $('assessmentTitle').value.trim(); assessment.subject = $('assessmentSubject').value.trim(); assessment.date = $('assessmentDate').value || todayIso(); assessment.maxPoints = clamp(Number($('assessmentMaxPoints').value) || 100, 1, 10000); save(); renderAssessmentRows(); renderAssessmentStats(); renderQuickCalc(); renderAssessmentList(); renderDashboard(); }));
  $('saveAssessmentBtn').addEventListener('click', () => { const assessment = currentAssessment(); if(!assessment) return; assessment.savedAt = new Date().toISOString(); save(); renderAssessmentList(); toast('Dolgozat mentve.'); });
  $('resetScaleBtn').addEventListener('click', () => { const assessment = currentAssessment(); if(!assessment) return; assessment.scale = clone(DEFAULT_SCALE); save(); renderAssessment(); toast('Ponthatárok visszaállítva.'); });
  ['quickPoints','quickBonus'].forEach(id => $(id).addEventListener('input', renderQuickCalc));
  $('exportCsvBtn').addEventListener('click', exportCsv); $('copySummaryBtn').addEventListener('click', () => copyText(assessmentSummary())); $('printAssessmentBtn').addEventListener('click', () => { showTab('assessments'); window.print(); });

  $('saveHomeworkBtn').addEventListener('click', () => { const classId = $('hwClass').value || data.activeClassId; const text = cleanString($('hwText').value); if(!classId || !text){ toast('Válassz osztályt és írd be a feladatot.'); return; } data.homeworks.push({ id: uid(), classId, subject: cleanString($('hwSubject').value) || getClass(classId)?.subject || '', deadline: $('hwDeadline').value, text, note: cleanString($('hwNote').value), done: false, createdAt: new Date().toISOString() }); data.activeClassId = classId; $('hwText').value = ''; $('hwNote').value = ''; save(); renderAll(); toast('Házi feladat mentve.'); });
  $('clearDoneHomeworksBtn').addEventListener('click', () => { const done = data.homeworks.filter(homework => homework.done).length; if(!done){ toast('Nincs lezárt házi feladat.'); return; } if(confirm(`${done} lezárt házi feladatot törölsz. Folytatod?`)){ data.homeworks = data.homeworks.filter(homework => !homework.done); save(); renderAll(); } });

  $('lessonClass').addEventListener('change', () => { const schoolClass = getClass($('lessonClass').value); if(schoolClass && !$('lessonSubject').value) $('lessonSubject').value = schoolClass.subject; });
  $('generateLessonBtn').addEventListener('click', generateLesson);
  $('saveLessonBtn').addEventListener('click', () => { const classId = $('lessonClass').value || data.activeClassId; const output = $('lessonOutput').value.trim(); if(!classId || !output || output.startsWith('Itt jelenik')){ toast('Előbb készíts óratervet.'); return; } data.lessons.push({ id: uid(), classId, subject: cleanString($('lessonSubject').value) || getClass(classId)?.subject || '', topic: cleanString($('lessonTopic').value), date: $('lessonDate').value || todayIso(), output, createdAt: new Date().toISOString() }); data.activeClassId = classId; save(); renderAll(); toast('Óraterv mentve.'); });
  $('printLessonBtn').addEventListener('click', () => { showTab('lesson'); window.print(); });

  $('generateTextBtn').addEventListener('click', generateText);
  $('pickRandomBtn').addEventListener('click', pickRandom); $('makeGroupsBtn').addEventListener('click', makeGroups); $('resetCalledBtn').addEventListener('click', () => { if(confirm('Törlöd a felelőválasztási előzményeket?')){ data.calledHistory = {}; save(); toast('Felelőelőzmények törölve.'); } });

  $('backupBtn').addEventListener('click', () => download(`tanarseged-mentes-${todayIso()}.json`, JSON.stringify({ app: 'tanarseged-v13', exportedAt: new Date().toISOString(), data }, null, 2), 'application/json'));
  $('restoreInput').addEventListener('change', async event => { const file = event.target.files?.[0]; if(!file) return; try { const parsed = JSON.parse(await file.text()); if(parsed.app !== 'tanarseged-v13' || !parsed.data) throw new Error('invalid'); if(!confirm('A visszaállítás felülírja a jelenlegi helyi adatokat. Folytatod?')) return; data = normalizeData(parsed.data); save(); renderAll(); toast('Mentés sikeresen visszaállítva.'); } catch { toast('Ez nem érvényes TanárSegéd v13 mentés.'); } finally { event.target.value = ''; } });
  $('privacyBtn').addEventListener('click', () => $('privacyDialog').showModal()); $('closePrivacyBtn').addEventListener('click', () => $('privacyDialog').close());
}

load();
bindEvents();
renderAll();
