const FEEDBACK_URL = "";
const DATA_KEY = 'tanarseged_pro_v15';
const V14_DATA_KEY = 'tanarseged_pro_v14';
const V13_DATA_KEY = 'tanarseged_pro_v13';
const LEGACY_KEY = 'tanarseged_pro_v12_clean';
const MIGRATION_BACKUP_KEY = 'tanarseged_pro_v15_v14_migration_backup';
const DEFAULT_SCALE = [{ grade: 5, min: 85 }, { grade: 4, min: 70 }, { grade: 3, min: 55 }, { grade: 2, min: 40 }, { grade: 1, min: 0 }];
const $ = id => document.getElementById(id);
const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function todayIso() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysIso(days){
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultSchoolYear(){
  const date = new Date();
  const year = date.getFullYear();
  return date.getMonth() >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

function defaultSettings(){ return { schoolYear: defaultSchoolYear(), semester: '1', privacyAccepted: false, showArchived: false, archiveYearFilter: '', lastBackupAt: '', lastImportAt: '' }; }

function newRecordMeta(){ return { schoolYear: data?.settings?.schoolYear || defaultSchoolYear(), semester: data?.settings?.semester || '1', archived: false }; }

function recordMeta(raw){ return { schoolYear: cleanString(raw?.schoolYear) || 'Nincs besorolva', semester: cleanString(raw?.semester), archived: Boolean(raw?.archived) }; }

function emptyData(){
  return { version: 15, activeClassId: '', activeAssessmentId: '', activeLogId: '', activeStudentEventId: '', classes: [], assessments: [], homeworks: [], lessons: [], lessonLogs: [], studentEvents: [], texts: [], tasks: [], calledHistory: {}, settings: defaultSettings() };
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
  setSaveStatus('saving');
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    setSaveStatus('saved');
    return true;
  } catch(error) {
    setSaveStatus('error');
    toast(error?.name === 'QuotaExceededError' ? 'A helyi tárhely megtelt. Készíts mentést és archiváld a régi tanéveket.' : 'Mentési hiba történt.');
    return false;
  }
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
  return { id: uid(), classId: classId || '', title: '', subject: schoolClass?.subject || '', date: todayIso(), maxPoints: 100, scale: clone(DEFAULT_SCALE), results: {}, savedAt: new Date().toISOString(), ...newRecordMeta() };
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
    results: raw.results && typeof raw.results === 'object' ? raw.results : {}, savedAt: raw.savedAt || new Date().toISOString(), ...recordMeta(raw)
  })) : [];
  safe.homeworks = Array.isArray(candidate.homeworks) ? candidate.homeworks.map(raw => ({ id: raw.id || uid(), classId: raw.classId || '', subject: cleanString(raw.subject), deadline: raw.deadline || '', text: cleanString(raw.text), note: cleanString(raw.note), done: Boolean(raw.done), createdAt: raw.createdAt || new Date().toISOString(), sourceLogId: raw.sourceLogId || '', ...recordMeta(raw) })) : [];
  safe.lessons = Array.isArray(candidate.lessons) ? candidate.lessons.map(raw => ({ id: raw.id || uid(), classId: raw.classId || '', subject: cleanString(raw.subject), topic: cleanString(raw.topic), date: raw.date || '', output: String(raw.output || ''), createdAt: raw.createdAt || new Date().toISOString(), ...recordMeta(raw) })) : [];
  safe.lessonLogs = Array.isArray(candidate.lessonLogs) ? candidate.lessonLogs.map(raw => ({ id: raw.id || uid(), date: /^\d{4}-\d{2}-\d{2}$/.test(raw.date || '') ? raw.date : todayIso(), classId: raw.classId || '', subject: cleanString(raw.subject), topic: cleanString(raw.topic), content: cleanString(raw.content), homework: cleanString(raw.homework), homeworkDeadline: raw.homeworkDeadline || '', linkedHomeworkId: raw.linkedHomeworkId || '', absentees: cleanString(raw.absentees), responders: cleanString(raw.responders), note: cleanString(raw.note), status: ['megtartva','elmaradt','helyettesites'].includes(raw.status) ? raw.status : 'megtartva', createdAt: raw.createdAt || new Date().toISOString(), updatedAt: raw.updatedAt || '', ...recordMeta(raw) })) : [];
  safe.studentEvents = Array.isArray(candidate.studentEvents) ? candidate.studentEvents.map(raw => ({ id: raw.id || uid(), date: /^\d{4}-\d{2}-\d{2}$/.test(raw.date || '') ? raw.date : todayIso(), classId: raw.classId || '', studentId: raw.studentId || '', studentName: cleanString(raw.studentName), type: ['hianyzott','nincs_hazi','nincs_felszereles','felelt','dicseret','figyelmeztetes','egyeb'].includes(raw.type) ? raw.type : 'egyeb', note: cleanString(raw.note), createdAt: raw.createdAt || new Date().toISOString(), updatedAt: raw.updatedAt || '', ...recordMeta(raw) })) : [];
  safe.texts = Array.isArray(candidate.texts) ? candidate.texts.map(raw => ({ id: raw.id || uid(), classId: raw.classId || '', studentId: raw.studentId || '', title: cleanString(raw.title), content: String(raw.content || ''), createdAt: raw.createdAt || new Date().toISOString(), ...recordMeta(raw) })).filter(text => text.content) : [];
  safe.tasks = Array.isArray(candidate.tasks) ? candidate.tasks.map(raw => ({ id: raw.id || uid(), text: cleanString(raw.text), date: raw.date || '', done: Boolean(raw.done) })).filter(task => task.text) : [];
  safe.calledHistory = candidate.calledHistory && typeof candidate.calledHistory === 'object' ? candidate.calledHistory : {};
  safe.settings = { ...defaultSettings(), ...(candidate.settings && typeof candidate.settings === 'object' ? candidate.settings : {}) };
  safe.activeClassId = safe.classes.some(schoolClass => schoolClass.id === candidate.activeClassId) ? candidate.activeClassId : (safe.classes[0]?.id || '');
  safe.activeAssessmentId = safe.assessments.some(assessment => assessment.id === candidate.activeAssessmentId) ? candidate.activeAssessmentId : (safe.assessments[0]?.id || '');
  safe.activeLogId = safe.lessonLogs.some(log => log.id === candidate.activeLogId) ? candidate.activeLogId : '';
  safe.activeStudentEventId = safe.studentEvents.some(event => event.id === candidate.activeStudentEventId) ? candidate.activeStudentEventId : '';
  return safe;
}

function readStoredJson(key){
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

function load(){
  const stored = readStoredJson(DATA_KEY);
  if(stored){ data = normalizeData(stored); return; }
  const v14 = readStoredJson(V14_DATA_KEY);
  if(v14){
    try { localStorage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify({ migratedAt: new Date().toISOString(), source: v14 })); } catch {}
    data = normalizeData(v14); save(); toast('A v14-es helyi adatok átvétele sikeresen megtörtént.'); return;
  }
  const v13 = readStoredJson(V13_DATA_KEY);
  if(v13){ data = normalizeData(v13); save(); toast('A korábbi helyi adatok átvétele sikeresen megtörtént.'); return; }
  const legacy = readStoredJson(LEGACY_KEY);
  if(legacy){ data = migrateLegacy(legacy); save(); toast('A korábbi dolgozatadatok átvétele sikeresen megtörtént.'); }
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
  document.querySelectorAll('.tab,.mobile-tab').forEach(button => button.classList.toggle('active', button.dataset.tab === tabName));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === `tab-${tabName}`));
  const title = document.querySelector(`.mobile-tab[data-tab="${tabName}"]`)?.textContent || 'Ma';
  $('mobilePageTitle').textContent = title;
  closeMobileMenu();
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

function populateOptionalClassSelect(id, placeholder){
  const select = $(id);
  const previous = select.value;
  select.replaceChildren(new Option(placeholder, ''));
  data.classes.forEach(schoolClass => select.add(new Option(schoolClass.name, schoolClass.id)));
  select.disabled = false;
  select.value = data.classes.some(schoolClass => schoolClass.id === previous) ? previous : '';
}

function renderSelectors(){
  const assessment = currentAssessment();
  populateClassSelect('globalClassSelect');
  populateClassSelect('assessmentClass', assessment?.classId || data.activeClassId);
  populateClassSelect('hwClass');
  populateClassSelect('lessonClass');
  populateClassSelect('textClass');
  populateClassSelect('toolsClass');
  populateClassSelect('logClass');
  populateOptionalClassSelect('logFilterClass', 'Minden osztály');
  populateClassSelect('studentProfileClass');
  populateClassSelect('eventClass');
  populateOptionalClassSelect('eventFilterClass', 'Minden osztály');
}

function renderHero(){
  $('heroClassCount').textContent = data.classes.length;
  $('heroStudentCount').textContent = activeStudents().length;
  $('todayDate').textContent = new Date().toLocaleDateString('hu-HU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function renderDashboard(){
  const activeClassId = data.activeClassId;
  const openHomeworks = visibleRecords(data.homeworks).filter(homework => homework.classId === activeClassId && !homework.done);
  const todaysLogs = visibleRecords(data.lessonLogs).filter(log => log.classId === activeClassId && log.date === todayIso() && log.status !== 'elmaradt');
  const assessment = currentAssessment();
  const missingScores = assessment && assessment.classId === activeClassId ? validAssessmentStudents(assessment).filter(student => {
    const result = assessment.results[student.id];
    return !result || (result.status === 'ok' && (result.points === '' || result.points === null || result.points === undefined));
  }).length : 0;
  $('metricHomeworks').textContent = openHomeworks.filter(homework => homework.deadline === todayIso()).length;
  $('metricLessons').textContent = todaysLogs.length;
  $('metricMissingScores').textContent = missingScores;

  renderLatestCard('latestAssessment', visibleRecords(data.assessments).filter(item => item.classId === activeClassId).sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date))[0], item => `${item.title || 'Névtelen dolgozat'} · ${formatDate(item.date)}`, 'Még nincs mentett dolgozat.');
  renderLatestCard('latestLog', visibleRecords(data.lessonLogs).filter(item => item.classId === activeClassId).sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date))[0], item => `${item.subject || 'Tantárgy'} · ${item.topic || 'Téma nélkül'} · ${formatDate(item.date)}`, 'Még nincs mentett órai napló.');
  renderLatestCard('latestEvent', visibleRecords(data.studentEvents).filter(item => item.classId === activeClassId).sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date))[0], item => `${item.studentName || 'Tanuló'} · ${eventTypeLabel(item.type)} · ${formatDate(item.date)}`, 'Még nincs mentett tanulói esemény.');

  const events = [
    ...openHomeworks.map(homework => ({ date: homework.deadline, type: 'Házi', title: `${homework.subject || 'Tantárgy'} – ${homework.text || 'Feladat nélkül'}` })),
    ...visibleRecords(data.lessons).filter(lesson => lesson.classId === activeClassId).map(lesson => ({ date: lesson.date, type: 'Óravázlat', title: `${lesson.subject || 'Tantárgy'} – ${lesson.topic || 'Téma nélkül'}` })),
    ...visibleRecords(data.lessonLogs).filter(log => log.classId === activeClassId && log.date >= todayIso()).map(log => ({ date: log.date, type: 'Órai napló', title: `${log.subject || 'Tantárgy'} – ${log.topic || 'Téma nélkül'}` }))
  ].sort((a, b) => dateSortValue(a.date) - dateSortValue(b.date)).slice(0, 6);
  const timeline = $('todayTimeline');
  timeline.className = 'timeline';
  timeline.replaceChildren();
  if(!events.length){ timeline.textContent = 'Nincs ma esedékes házi feladat vagy közelgő mentett bejegyzés.'; timeline.className = 'timeline empty'; }
  events.forEach(event => {
    const item = document.createElement('div'); item.className = 'timeline-item';
    const date = document.createElement('span'); date.className = 'timeline-date'; date.textContent = event.date ? formatDate(event.date) : 'határidő nélkül';
    const copy = document.createElement('div'); const heading = document.createElement('b'); heading.textContent = event.type; const description = document.createElement('p'); description.textContent = event.title; copy.append(heading, description);
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

function renderLatestCard(id, item, textBuilder, emptyMessage){
  const box = $(id); box.replaceChildren();
  const paragraph = document.createElement('p');
  paragraph.textContent = item ? textBuilder(item) : emptyMessage;
  if(!item) paragraph.className = 'empty';
  box.append(paragraph);
}

function renderClasses(){
  const list = $('classList'); list.replaceChildren();
  if(!data.classes.length) list.innerHTML = '<p class="empty">Még nincs osztály. Kezdd egy osztály és a névsor felvételével.</p>';
  data.classes.forEach(schoolClass => {
    const item = document.createElement('div'); item.className = 'saved-item';
    item.innerHTML = `<b>${escapeHtml(schoolClass.name)}</b><small>${escapeHtml(schoolClass.subject || 'Tantárgy nélkül')} · ${schoolClass.students.filter(student => student.active !== false).length} aktív tanuló</small>`;
    const button = document.createElement('button'); button.className = schoolClass.id === data.activeClassId ? 'secondary' : ''; button.type = 'button'; button.textContent = schoolClass.id === data.activeClassId ? 'Aktív osztály' : 'Kiválasztás';
    button.addEventListener('click', () => { data.activeClassId = schoolClass.id; if(!currentAssessment() || currentAssessment().classId !== schoolClass.id) data.activeAssessmentId = visibleRecords(data.assessments).find(assessment => assessment.classId === schoolClass.id)?.id || ''; save(); renderAll(); });
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
    remove.addEventListener('click', () => { schoolClass.students = schoolClass.students.filter(candidate => candidate.id !== student.id); delete data.calledHistory[student.id]; data.assessments.forEach(assessment => delete assessment.results[student.id]); data.studentEvents = data.studentEvents.filter(event => event.studentId !== student.id); save(); renderAll(); }); actionCell.append(remove);
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
  const storedAssessments = visibleRecords(data.assessments);
  if(!storedAssessments.length){ list.innerHTML = '<p class="empty">Nincs mentett dolgozat.</p>'; return; }
  storedAssessments.slice().sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date)).forEach(assessment => {
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
  const active = visibleRecords(data.homeworks).filter(homework => homework.classId === data.activeClassId).sort((a,b) => Number(a.done) - Number(b.done) || dateSortValue(a.deadline) - dateSortValue(b.deadline));
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
  const lessons = visibleRecords(data.lessons).filter(lesson => lesson.classId === data.activeClassId).sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date));
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
  if(!assessment || assessment.classId !== classId) data.activeAssessmentId = visibleRecords(data.assessments).find(candidate => candidate.classId === classId)?.id || '';
  save(); renderAll();
}

const eventTypeLabel = type => ({ hianyzott:'Hiányzott', nincs_hazi:'Nem volt házi feladata', nincs_felszereles:'Nem volt felszerelése', felelt:'Felelt', dicseret:'Dicséretet kapott', figyelmeztetes:'Figyelmeztetést kapott', egyeb:'Egyéb megjegyzés' }[type] || 'Egyéb megjegyzés');
const logStatusLabel = status => ({ megtartva:'Megtartva', elmaradt:'Elmaradt', helyettesites:'Helyettesítés' }[status] || 'Megtartva');

function logSummary(log){
  return `ÓRAI NAPLÓ\n\nDátum: ${formatDate(log.date)}\nOsztály: ${className(log.classId)}\nTantárgy: ${log.subject || '–'}\nTéma: ${log.topic || '–'}\nMai tananyag: ${log.content || '–'}\nHázi feladat: ${log.homework || '–'}\nHiányzók: ${log.absentees || '–'}\nFelelők: ${log.responders || '–'}\nMegjegyzés: ${log.note || '–'}\nÁllapot: ${logStatusLabel(log.status)}`;
}

function currentLogFromForm(){
  return { date: $('logDate').value || todayIso(), classId: $('logClass').value || data.activeClassId, subject: cleanString($('logSubject').value), topic: cleanString($('logTopic').value), content: cleanString($('logContent').value), homework: cleanString($('logHomework').value), absentees: cleanString($('logAbsentees').value), responders: cleanString($('logResponders').value), note: cleanString($('logNote').value), status: $('logStatus').value };
}

function updateLogOutput(){ $('logOutput').value = logSummary(currentLogFromForm()); }

function clearLogForm(){
  data.activeLogId = '';
  $('logDate').value = todayIso(); $('logClass').value = data.activeClassId; $('logSubject').value = getClass()?.subject || ''; $('logTopic').value = ''; $('logContent').value = ''; $('logHomework').value = ''; $('logAbsentees').value = ''; $('logResponders').value = ''; $('logNote').value = ''; $('logStatus').value = 'megtartva'; updateLogOutput();
}

function loadLog(log){
  data.activeLogId = log.id; data.activeClassId = log.classId; save(); renderAll();
  $('logDate').value = log.date; $('logClass').value = log.classId; $('logSubject').value = log.subject; $('logTopic').value = log.topic; $('logContent').value = log.content; $('logHomework').value = log.homework; $('logAbsentees').value = log.absentees; $('logResponders').value = log.responders; $('logNote').value = log.note; $('logStatus').value = log.status; updateLogOutput(); showTab('logs');
}

function renderLogs(){
  const list = $('logList'); list.replaceChildren();
  const date = $('logFilterDate').value, classId = $('logFilterClass').value, subject = cleanString($('logFilterSubject').value).toLocaleLowerCase('hu-HU');
  const logs = visibleRecords(data.lessonLogs).filter(log => (!date || log.date === date) && (!classId || log.classId === classId) && (!subject || log.subject.toLocaleLowerCase('hu-HU').includes(subject))).sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date));
  if(!logs.length){ const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Még nincs mentett órai napló a megadott szűréssel.'; list.append(empty); return; }
  logs.forEach(log => {
    const item = document.createElement('div'); item.className = 'saved-item';
    const title = document.createElement('b'); title.textContent = `${formatDate(log.date)} · ${className(log.classId)} · ${log.subject || 'Tantárgy'}`;
    const small = document.createElement('small'); small.textContent = `${log.topic || 'Téma nélkül'} · ${logStatusLabel(log.status)}`;
    const actions = document.createElement('div'); actions.className = 'saved-actions';
    const open = document.createElement('button'); open.className = 'secondary'; open.type = 'button'; open.textContent = 'Megnyitás / szerkesztés'; open.addEventListener('click', () => loadLog(log));
    const remove = document.createElement('button'); remove.className = 'danger'; remove.type = 'button'; remove.textContent = 'Törlés'; remove.addEventListener('click', () => { if(confirm('Törlöd ezt az órai naplóbejegyzést?')){ data.lessonLogs = data.lessonLogs.filter(item => item.id !== log.id); if(data.activeLogId === log.id) data.activeLogId = ''; save(); renderAll(); } });
    actions.append(open, remove); item.append(title, small, actions); list.append(item);
  });
}

function fillStudentSelect(id, classId, placeholder, query = ''){
  const select = $(id); const previous = select.value; select.replaceChildren(new Option(placeholder, ''));
  const normalized = cleanString(query).toLocaleLowerCase('hu-HU');
  activeStudents(classId).filter(student => !normalized || student.name.toLocaleLowerCase('hu-HU').includes(normalized)).forEach(student => select.add(new Option(student.name, student.id)));
  select.disabled = !getClass(classId);
  if([...select.options].some(option => option.value === previous)) select.value = previous;
}

function studentById(classId, studentId){ return (getClass(classId)?.students || []).find(student => student.id === studentId); }

function eventsForStudent(classId, student){ return data.studentEvents.filter(event => event.classId === classId && (event.studentId === student.id || (!event.studentId && event.studentName === student.name))); }

function assessmentResultsForStudent(classId, student){
  return data.assessments.filter(assessment => assessment.classId === classId).map(assessment => {
    const result = resultOf(assessment, student.id); const percent = scorePercent(result, assessment);
    return percent === null ? null : { assessment, percent: Math.min(100, percent), grade: gradeFromPercent(Math.min(100, percent), assessment.scale) };
  }).filter(Boolean);
}

function studentSummary(classId, student){
  if(!student) return '';
  const results = assessmentResultsForStudent(classId, student); const events = eventsForStudent(classId, student);
  const average = results.length ? results.reduce((sum,item) => sum + item.percent, 0) / results.length : null;
  const count = type => events.filter(event => event.type === type).length;
  const lastAnswer = events.filter(event => event.type === 'felelt').sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date))[0];
  const notes = events.filter(event => event.note).sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date)).slice(0,3).map(event => `${formatDate(event.date)}: ${event.note}`);
  return `TANULÓI ADATLAP\n\nTanuló: ${student.name}\nOsztály: ${className(classId)}\nDolgozateredmények: ${results.length ? results.map(item => `${item.assessment.title || 'Dolgozat'} ${item.percent.toFixed(1)}% (${item.grade})`).join('; ') : 'Nincs rögzített eredmény.'}\nÁtlagos százalék: ${average === null ? '–' : `${average.toFixed(1)}%`}\nJegyek: ${results.length ? results.map(item => item.grade).join(', ') : '–'}\nHiányzó házik: ${count('nincs_hazi')}\nHiányzások: ${count('hianyzott')}\nDicséretek: ${count('dicseret')}\nFigyelmeztetések: ${count('figyelmeztetes')}\nUtolsó felelés: ${lastAnswer ? formatDate(lastAnswer.date) : '–'}\nLegutóbbi megjegyzések: ${notes.length ? notes.join(' | ') : '–'}`;
}

function renderStudentProfile(){
  const classId = $('studentProfileClass').value || data.activeClassId;
  fillStudentSelect('studentProfileSelect', classId, 'Válassz tanulót', $('studentSearch').value);
  const student = studentById(classId, $('studentProfileSelect').value);
  const box = $('studentProfileOutput'); box.replaceChildren();
  if(!student){ const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Válassz osztályt és tanulót az adatlap megjelenítéséhez.'; box.append(empty); return; }
  const results = assessmentResultsForStudent(classId, student); const events = eventsForStudent(classId, student); const average = results.length ? results.reduce((sum,item) => sum + item.percent, 0) / results.length : null;
  const header = document.createElement('h3'); header.textContent = `${student.name} · ${className(classId)}`; box.append(header);
  const grid = document.createElement('div'); grid.className = 'profile-grid';
  const lastAnswer = events.filter(event => event.type === 'felelt').sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date))[0];
  [['Dolgozateredmények', results.length ? results.map(item => `${item.assessment.title || 'Dolgozat'}: ${item.percent.toFixed(1)}% (${item.grade})`).join(' · ') : 'Nincs rögzített eredmény.'], ['Átlagos százalék', average === null ? '–' : `${average.toFixed(1)}%`], ['Jegyek', results.length ? results.map(item => item.grade).join(', ') : '–'], ['Hiányzó házik', events.filter(event => event.type === 'nincs_hazi').length], ['Hiányzások', events.filter(event => event.type === 'hianyzott').length], ['Dicséretek', events.filter(event => event.type === 'dicseret').length], ['Figyelmeztetések', events.filter(event => event.type === 'figyelmeztetes').length], ['Utolsó felelés', lastAnswer ? formatDate(lastAnswer.date) : '–'], ['Legutóbbi megjegyzések', events.filter(event => event.note).sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date)).slice(0,3).map(event => event.note).join(' · ') || '–']].forEach(([label,value]) => { const row = document.createElement('div'); const labelEl = document.createElement('span'); labelEl.textContent = label; const valueEl = document.createElement('strong'); valueEl.textContent = String(value); row.append(labelEl,valueEl); grid.append(row); });
  box.append(grid);
}

function eventSummary(events = data.studentEvents){
  if(!events.length) return 'TANULÓI ESEMÉNYEK\n\nNincs rögzített esemény.';
  return `TANULÓI ESEMÉNYEK\n\n${events.slice().sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date)).map(event => `${formatDate(event.date)} · ${className(event.classId)} · ${event.studentName || studentById(event.classId,event.studentId)?.name || 'Tanuló'} · ${eventTypeLabel(event.type)}${event.note ? ` · ${event.note}` : ''}`).join('\n')}`;
}

function clearEventForm(){ data.activeStudentEventId = ''; $('eventDate').value = todayIso(); $('eventClass').value = data.activeClassId; fillStudentSelect('eventStudent', data.activeClassId, 'Válassz tanulót'); $('eventType').value = 'hianyzott'; $('eventNote').value = ''; }

function loadStudentEvent(event){
  data.activeStudentEventId = event.id; data.activeClassId = event.classId; save(); renderAll();
  $('eventDate').value = event.date; $('eventClass').value = event.classId; fillStudentSelect('eventStudent', event.classId, 'Válassz tanulót'); $('eventStudent').value = event.studentId; $('eventType').value = event.type; $('eventNote').value = event.note; showTab('classes');
}

function renderStudentEvents(){
  const formClassId = $('eventClass').value || data.activeClassId;
  fillStudentSelect('eventStudent', formClassId, 'Válassz tanulót');
  const filterClassId = $('eventFilterClass').value;
  fillStudentSelect('eventFilterStudent', filterClassId || data.activeClassId, 'Minden tanuló');
  if(!filterClassId) { $('eventFilterStudent').disabled = false; const select = $('eventFilterStudent'); select.replaceChildren(new Option('Minden tanuló','')); data.classes.forEach(schoolClass => activeStudents(schoolClass.id).forEach(student => select.add(new Option(`${student.name} (${schoolClass.name})`, `${schoolClass.id}:${student.id}`)))); }
  const date = $('eventFilterDate').value, type = $('eventFilterType').value, studentFilter = $('eventFilterStudent').value;
  const events = data.studentEvents.filter(event => (!date || event.date === date) && (!filterClassId || event.classId === filterClassId) && (!type || event.type === type) && (!studentFilter || (studentFilter.includes(':') ? `${event.classId}:${event.studentId}` === studentFilter : event.studentId === studentFilter))).sort((a,b) => dateSortValue(b.date) - dateSortValue(a.date));
  $('eventOutput').value = eventSummary(events);
  const list = $('eventList'); list.replaceChildren();
  if(!events.length){ const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Nincs rögzített esemény a megadott szűréssel.'; list.append(empty); return; }
  events.forEach(event => { const item = document.createElement('div'); item.className = 'saved-item'; const title = document.createElement('b'); title.textContent = `${formatDate(event.date)} · ${event.studentName || studentById(event.classId,event.studentId)?.name || 'Tanuló'} · ${eventTypeLabel(event.type)}`; const detail = document.createElement('small'); detail.textContent = `${className(event.classId)}${event.note ? ` · ${event.note}` : ''}`; const actions = document.createElement('div'); actions.className = 'saved-actions'; const open = document.createElement('button'); open.className = 'secondary'; open.type = 'button'; open.textContent = 'Megnyitás / szerkesztés'; open.addEventListener('click', () => loadStudentEvent(event)); const remove = document.createElement('button'); remove.className = 'danger'; remove.type = 'button'; remove.textContent = 'Törlés'; remove.addEventListener('click', () => { if(confirm('Törlöd ezt a tanulói eseményt?')){ data.studentEvents = data.studentEvents.filter(item => item.id !== event.id); if(data.activeStudentEventId === event.id) data.activeStudentEventId = ''; save(); renderAll(); } }); actions.append(open,remove); item.append(title,detail,actions); list.append(item); });
}

function renderSavedTexts(){
  const list = $('textList'); list.replaceChildren(); const texts = visibleRecords(data.texts).filter(text => !text.classId || text.classId === data.activeClassId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  if(!texts.length){ const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Még nincs mentett szöveg.'; list.append(empty); return; }
  texts.forEach(text => { const item = document.createElement('div'); item.className = 'saved-item'; const title = document.createElement('b'); title.textContent = text.title || 'Mentett szöveg'; const detail = document.createElement('small'); detail.textContent = `${className(text.classId)} · ${new Date(text.createdAt).toLocaleString('hu-HU')}`; const actions = document.createElement('div'); actions.className = 'saved-actions'; const open = document.createElement('button'); open.className = 'secondary'; open.type = 'button'; open.textContent = 'Megnyitás'; open.addEventListener('click', () => { data.activeClassId = text.classId || data.activeClassId; $('textOutput').value = text.content; save(); renderAll(); showTab('texts'); }); const remove = document.createElement('button'); remove.className = 'danger'; remove.type = 'button'; remove.textContent = 'Törlés'; remove.addEventListener('click', () => { data.texts = data.texts.filter(item => item.id !== text.id); save(); renderSavedTexts(); }); actions.append(open,remove); item.append(title,detail,actions); list.append(item); });
}

function buildDemoData(){
  const demo = emptyData(); const schoolClass = createClass('7.B', 'matematika', ['Minta Anna','Példa Bence','Kitalált Csenge','Teszt Dávid','Minta Emese','Példa Ferenc','Kitalált Gréta','Teszt Hunor']); demo.classes.push(schoolClass); demo.activeClassId = schoolClass.id;
  const assessment = { id:uid(), classId:schoolClass.id, title:'Törtek dolgozat', subject:'matematika', date:todayIso(), maxPoints:50, scale:clone(DEFAULT_SCALE), results:{}, savedAt:new Date().toISOString() }; [47,42,38,31,28,24,19,45].forEach((points,index) => assessment.results[schoolClass.students[index].id] = { points, bonus:0, status:'ok' }); demo.assessments.push(assessment); demo.activeAssessmentId = assessment.id;
  demo.homeworks.push({ id:uid(), classId:schoolClass.id, subject:'matematika', deadline:todayIso(), text:'Munkafüzet 32. oldal, 4–6. feladat.', note:'Aki hiányzott, annak is pótolnia kell.', done:false, createdAt:new Date().toISOString() }, { id:uid(), classId:schoolClass.id, subject:'matematika', deadline:addDaysIso(3), text:'Gyakorló feladatsor a törtek összeadásáról.', note:'', done:false, createdAt:new Date().toISOString() });
  demo.lessonLogs.push({ id:uid(), date:todayIso(), classId:schoolClass.id, subject:'matematika', topic:'Törtek összeadása', content:'Közös példák és páros gyakorlás.', homework:'Munkafüzet 32. oldal, 4–6. feladat.', absentees:'Teszt Hunor', responders:'Minta Anna, Példa Bence', note:'Következő órán rövid ismétlés.', status:'megtartva', createdAt:new Date().toISOString(), updatedAt:'' }, { id:uid(), date:addDaysIso(-1), classId:schoolClass.id, subject:'matematika', topic:'Törtek áttekintése', content:'Nevező és számláló ismétlése.', homework:'', absentees:'', responders:'Kitalált Csenge', note:'', status:'megtartva', createdAt:new Date().toISOString(), updatedAt:'' });
  const addEvent = (index,type,note,date=todayIso()) => demo.studentEvents.push({ id:uid(), date, classId:schoolClass.id, studentId:schoolClass.students[index].id, studentName:schoolClass.students[index].name, type, note, createdAt:new Date().toISOString(), updatedAt:'' }); addEvent(0,'dicseret','Aktívan segítette a csoportmunkát.'); addEvent(1,'felelt','Biztosan használta a tanult fogalmakat.'); addEvent(2,'nincs_hazi','A házi feladat pótlását vállalta.'); addEvent(3,'hianyzott','Igazolt hiányzás.'); addEvent(4,'figyelmeztetes','Az órai felszerelésre figyeljen.');
  demo.lessons.push({ id:uid(), classId:schoolClass.id, subject:'matematika', topic:'Törtek összeadása', date:todayIso(), output:'ÓRAVÁZLAT\nTantárgy: matematika\nOsztály: 7.B\nTéma: Törtek összeadása\n\nRáhangolódás, közös feldolgozás, páros gyakorlás és kilépőkártya.', createdAt:new Date().toISOString() });
  demo.texts.push({ id:uid(), classId:schoolClass.id, studentId:schoolClass.students[0].id, title:'Szülői üzenet minta', content:'Kedves Szülő!\n\nSzeretném megdicsérni Minta Anna mai munkáját. Figyelmesen és aktívan dolgozott a matematikaórán.\n\nÜdvözlettel:', createdAt:new Date().toISOString() });
  return demo;
}

function applyDemo(mode){
  const demo = buildDemoData();
  if(mode === 'replace') data = demo;
  else { data.classes.push(...demo.classes); data.assessments.push(...demo.assessments); data.homeworks.push(...demo.homeworks); data.lessons.push(...demo.lessons); data.lessonLogs.push(...demo.lessonLogs); data.studentEvents.push(...demo.studentEvents); data.texts.push(...demo.texts); data.activeClassId = demo.activeClassId; data.activeAssessmentId = demo.activeAssessmentId; }
  save(); $('demoDialog').close(); renderAll(); toast('Demó adatok betöltve.');
}

let mobileMenuHistory = false;
function openMobileMenu(){ $('mobileMenu').classList.add('open'); $('mobileOverlay').classList.add('open'); $('mobileMenu').setAttribute('aria-hidden','false'); $('mobileOverlay').setAttribute('aria-hidden','false'); $('mobileMenuBtn').setAttribute('aria-expanded','true'); document.body.classList.add('menu-open'); if(!mobileMenuHistory){ history.pushState({ tanarSegedMenu:true }, ''); mobileMenuHistory = true; } }
function closeMobileMenu(fromPopState = false){ const wasOpen = $('mobileMenu')?.classList.contains('open'); $('mobileMenu')?.classList.remove('open'); $('mobileOverlay')?.classList.remove('open'); $('mobileMenu')?.setAttribute('aria-hidden','true'); $('mobileOverlay')?.setAttribute('aria-hidden','true'); $('mobileMenuBtn')?.setAttribute('aria-expanded','false'); document.body.classList.remove('menu-open'); if(wasOpen && mobileMenuHistory && !fromPopState){ mobileMenuHistory = false; history.back(); } else if(fromPopState) mobileMenuHistory = false; }

function renderAll(){
  renderSelectors(); renderHero(); renderDashboard(); renderClasses(); renderAssessment(); renderHomeworks(); renderLessons(); renderTextStudents(); renderLogs(); renderStudentProfile(); renderStudentEvents(); renderSavedTexts();
  if(!$('logDate').value) clearLogForm();
  if(!$('eventDate').value) clearEventForm();
}

function bindEvents(){
  document.querySelectorAll('.tab,.mobile-tab').forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));
  document.querySelectorAll('.go-tab').forEach(button => button.addEventListener('click', () => showTab(button.dataset.go)));
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', () => copyText($(button.dataset.copy).value || $(button.dataset.copy).textContent)));
  ['globalClassSelect','hwClass','lessonClass','textClass','toolsClass'].forEach(id => $(id).addEventListener('change', event => updateActiveClass(event.target.value)));
  $('assessmentClass').addEventListener('change', event => {
    const assessment = currentAssessment(); if(!assessment) return; assessment.classId = event.target.value; data.activeClassId = event.target.value; if(!assessment.subject) assessment.subject = getClass(event.target.value)?.subject || ''; save(); renderAll();
  });

  $('taskForm').addEventListener('submit', event => { event.preventDefault(); const text = cleanString($('taskText').value); if(!text) return; data.tasks.push({ id: uid(), text, date: $('taskDate').value, done: false }); $('taskText').value = ''; $('taskDate').value = ''; save(); renderDashboard(); });
  $('addClassBtn').addEventListener('click', () => { const name = cleanString($('newClassName').value); if(!name){ toast('Adj nevet az osztálynak.'); return; } const schoolClass = createClass(name, $('newClassSubject').value); data.classes.push(schoolClass); data.activeClassId = schoolClass.id; const assessment = createAssessment(schoolClass.id); data.assessments.push(assessment); data.activeAssessmentId = assessment.id; $('newClassName').value = ''; $('newClassSubject').value = ''; save(); renderAll(); toast('Osztály létrehozva. Most add hozzá a névsort.'); });
  $('saveClassBtn').addEventListener('click', () => { const schoolClass = getClass(); if(!schoolClass) return; const name = cleanString($('editClassName').value); if(!name){ toast('Az osztály neve nem lehet üres.'); return; } schoolClass.name = name; schoolClass.subject = cleanString($('editClassSubject').value); save(); renderAll(); toast('Osztályadatok mentve.'); });
  $('deleteClassBtn').addEventListener('click', () => { const schoolClass = getClass(); if(!schoolClass || !confirm(`${schoolClass.name} és a hozzá tartozó dolgozatok, házik, óravázlatok, naplók és események törlődnek. Folytatod?`)) return; const studentIds = new Set(schoolClass.students.map(student => student.id)); data.classes = data.classes.filter(candidate => candidate.id !== schoolClass.id); data.assessments = data.assessments.filter(assessment => assessment.classId !== schoolClass.id); data.homeworks = data.homeworks.filter(homework => homework.classId !== schoolClass.id); data.lessons = data.lessons.filter(lesson => lesson.classId !== schoolClass.id); data.lessonLogs = data.lessonLogs.filter(log => log.classId !== schoolClass.id); data.studentEvents = data.studentEvents.filter(event => event.classId !== schoolClass.id); data.texts = data.texts.filter(text => text.classId !== schoolClass.id); studentIds.forEach(id => delete data.calledHistory[id]); data.activeClassId = data.classes[0]?.id || ''; data.activeAssessmentId = data.assessments.find(assessment => assessment.classId === data.activeClassId)?.id || ''; save(); renderAll(); toast('Osztály törölve.'); });
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

  $('newLogBtn').addEventListener('click', clearLogForm);
  ['logDate','logClass','logSubject','logTopic','logContent','logHomework','logAbsentees','logResponders','logNote','logStatus'].forEach(id => $(id).addEventListener('input', updateLogOutput));
  $('logClass').addEventListener('change', () => { if(!$('logSubject').value) $('logSubject').value = getClass($('logClass').value)?.subject || ''; updateLogOutput(); });
  $('saveLogBtn').addEventListener('click', () => { const incoming = currentLogFromForm(); if(!incoming.classId || !incoming.subject || !incoming.topic){ toast('Töltsd ki legalább az osztályt, tantárgyat és óratémát.'); return; } let log = data.lessonLogs.find(item => item.id === data.activeLogId); if(log){ Object.assign(log,incoming,{ updatedAt:new Date().toISOString() }); } else { log = { id:uid(), ...incoming, createdAt:new Date().toISOString(), updatedAt:'' }; data.lessonLogs.push(log); data.activeLogId = log.id; } data.activeClassId = incoming.classId; save(); updateLogOutput(); renderAll(); toast('Órai napló mentve.'); });
  $('logFilterDate').addEventListener('input', renderLogs); $('logFilterClass').addEventListener('change', renderLogs); $('logFilterSubject').addEventListener('input', renderLogs); $('clearLogFiltersBtn').addEventListener('click', () => { $('logFilterDate').value = ''; $('logFilterClass').value = ''; $('logFilterSubject').value = ''; renderLogs(); });

  $('lessonClass').addEventListener('change', () => { const schoolClass = getClass($('lessonClass').value); if(schoolClass && !$('lessonSubject').value) $('lessonSubject').value = schoolClass.subject; });
  $('generateLessonBtn').addEventListener('click', generateLesson);
  $('saveLessonBtn').addEventListener('click', () => { const classId = $('lessonClass').value || data.activeClassId; const output = $('lessonOutput').value.trim(); if(!classId || !output || output.startsWith('Itt jelenik')){ toast('Előbb készíts óratervet.'); return; } data.lessons.push({ id: uid(), classId, subject: cleanString($('lessonSubject').value) || getClass(classId)?.subject || '', topic: cleanString($('lessonTopic').value), date: $('lessonDate').value || todayIso(), output, createdAt: new Date().toISOString() }); data.activeClassId = classId; save(); renderAll(); toast('Óraterv mentve.'); });
  $('printLessonBtn').addEventListener('click', () => { showTab('lesson'); window.print(); });

  $('generateTextBtn').addEventListener('click', generateText);
  $('saveTextBtn').addEventListener('click', () => { const content = cleanString($('textOutput').value); if(!content || content.startsWith('Itt jelenik')){ toast('Előbb készíts vagy írj be szöveget.'); return; } data.texts.push({ id:uid(), classId:$('textClass').value || data.activeClassId, studentId:$('txtStudent').value || '', title:cleanString($('txtTopic').value) || $('txtType').selectedOptions[0].textContent, content, createdAt:new Date().toISOString() }); save(); renderSavedTexts(); toast('Szöveg mentve.'); });

  $('studentProfileClass').addEventListener('change', () => renderStudentProfile()); $('studentSearch').addEventListener('input', renderStudentProfile); $('studentProfileSelect').addEventListener('change', renderStudentProfile); $('copyStudentSummaryBtn').addEventListener('click', () => copyText(studentSummary($('studentProfileClass').value || data.activeClassId, studentById($('studentProfileClass').value || data.activeClassId, $('studentProfileSelect').value))));
  $('newEventBtn').addEventListener('click', clearEventForm); $('eventClass').addEventListener('change', () => fillStudentSelect('eventStudent', $('eventClass').value, 'Válassz tanulót'));
  $('saveEventBtn').addEventListener('click', () => { const classId = $('eventClass').value || data.activeClassId; const student = studentById(classId, $('eventStudent').value); if(!classId || !student){ toast('Válassz osztályt és tanulót.'); return; } const incoming = { date:$('eventDate').value || todayIso(), classId, studentId:student.id, studentName:student.name, type:$('eventType').value, note:cleanString($('eventNote').value) }; let event = data.studentEvents.find(item => item.id === data.activeStudentEventId); if(event){ Object.assign(event,incoming,{updatedAt:new Date().toISOString()}); } else { event = {id:uid(),...incoming,createdAt:new Date().toISOString(),updatedAt:''}; data.studentEvents.push(event); data.activeStudentEventId = event.id; } data.activeClassId = classId; save(); renderAll(); toast('Tanulói esemény mentve.'); });
  $('eventFilterDate').addEventListener('input', renderStudentEvents); $('eventFilterClass').addEventListener('change', renderStudentEvents); $('eventFilterStudent').addEventListener('change', renderStudentEvents); $('eventFilterType').addEventListener('change', renderStudentEvents); $('clearEventFiltersBtn').addEventListener('click', () => { $('eventFilterDate').value = ''; $('eventFilterClass').value = ''; $('eventFilterStudent').value = ''; $('eventFilterType').value = ''; renderStudentEvents(); });
  $('pickRandomBtn').addEventListener('click', pickRandom); $('makeGroupsBtn').addEventListener('click', makeGroups); $('resetCalledBtn').addEventListener('click', () => { if(confirm('Törlöd a felelőválasztási előzményeket?')){ data.calledHistory = {}; save(); toast('Felelőelőzmények törölve.'); } });

  $('backupBtn').addEventListener('click', () => download(`tanarseged-pro-v14-mentes-${todayIso()}.json`, JSON.stringify({ app: 'tanarseged-pro-v14', version:14, exportedAt: new Date().toISOString(), data }, null, 2), 'application/json'));
  $('restoreInput').addEventListener('change', async event => { const file = event.target.files?.[0]; if(!file) return; try { const parsed = JSON.parse(await file.text()); if(parsed.app !== 'tanarseged-pro-v14' || parsed.version !== 14 || !parsed.data || typeof parsed.data !== 'object') throw new Error('invalid'); if(!confirm('A visszaállítás felülírja a jelenlegi helyi adatokat. Folytatod?')) return; data = normalizeData(parsed.data); save(); renderAll(); toast('Mentés sikeresen visszaállítva.'); } catch { toast('A kiválasztott fájl nem érvényes TanárSegéd PRO v14 mentés.'); } finally { event.target.value = ''; } });
  $('clearAllBtn').addEventListener('click', () => { if(!confirm('Biztosan törlöd az összes v14-es helyi adatot?')) return; if(prompt('Második megerősítés: írd be pontosan ezt: TÖRLÉS') !== 'TÖRLÉS'){ toast('Az adatok törlése megszakítva.'); return; } data = emptyData(); save(); renderAll(); clearLogForm(); clearEventForm(); toast('Minden v14-es helyi adat törölve.'); });
  $('demoDataBtn').addEventListener('click', () => $('demoDialog').showModal()); $('demoAppendBtn').addEventListener('click', () => applyDemo('append')); $('demoReplaceBtn').addEventListener('click', () => applyDemo('replace')); $('demoCancelBtn').addEventListener('click', () => $('demoDialog').close());
  $('feedbackBtn').addEventListener('click', () => { if(!FEEDBACK_URL){ toast('A visszajelző űrlap linkje még nincs beállítva.'); return; } window.open(FEEDBACK_URL, '_blank', 'noopener'); });
  $('privacyBtn').addEventListener('click', () => $('privacyDialog').showModal()); $('closePrivacyBtn').addEventListener('click', () => $('privacyDialog').close());
  $('mobileMenuBtn').addEventListener('click', () => $('mobileMenu').classList.contains('open') ? closeMobileMenu() : openMobileMenu()); $('mobileMenuClose').addEventListener('click', () => closeMobileMenu()); $('mobileOverlay').addEventListener('click', () => closeMobileMenu()); document.addEventListener('keydown', event => { if(event.key === 'Escape' && $('mobileMenu').classList.contains('open')) closeMobileMenu(); }); window.addEventListener('popstate', () => { if($('mobileMenu').classList.contains('open')) closeMobileMenu(true); });
}

// v15 bővítések: helyi mentés, tanévkezelés, archiválás és tömeges események
let pendingImport = null;
let bulkStudentSelection = new Set();

function setSaveStatus(status){
  const labels = { saving:'Mentés…', saved:'Minden változás elmentve', error:'Mentési hiba' };
  ['saveStatus','mobileSaveStatus'].forEach(id => { const el = $(id); if(!el) return; el.textContent = id === 'mobileSaveStatus' && status === 'saved' ? 'Elmentve' : labels[status] || labels.saved; el.dataset.status = status; });
}

function currentTermLabel(){ return `${data.settings.schoolYear || 'Nincs besorolva'} · ${data.settings.semester ? `${data.settings.semester}. félév` : 'Nincs besorolva'}`; }
function recordVisible(record){ if(!record?.archived) return !data.settings.archiveYearFilter; return Boolean(data.settings.showArchived) && (!data.settings.archiveYearFilter || record.schoolYear === data.settings.archiveYearFilter); }
function visibleRecords(records){ return (records || []).filter(recordVisible); }
function dateInRange(date, start, end){ return (!start || date >= start) && (!end || date <= end); }
function withCurrentTerm(record){ return { ...record, ...newRecordMeta() }; }
function collectionNames(){ return ['assessments','homeworks','lessons','lessonLogs','studentEvents','texts']; }

function currentAssessment(){ return visibleRecords(data.assessments).find(assessment => assessment.id === data.activeAssessmentId) || visibleRecords(data.assessments).find(assessment => assessment.classId === data.activeClassId); }
function assessmentById(id){ return data.assessments.find(assessment => assessment.id === id); }

function renderTermInfo(){
  $('termStatus').textContent = currentTermLabel(); $('mobileTermStatus').textContent = currentTermLabel(); $('todayTermLine').textContent = `${currentTermLabel()} · az aktív osztály adatai alapján.`;
}

function currentLogFromForm(){
  return { date:$('logDate').value || todayIso(), classId:$('logClass').value || data.activeClassId, subject:cleanString($('logSubject').value), topic:cleanString($('logTopic').value), content:cleanString($('logContent').value), homework:cleanString($('logHomework').value), homeworkDeadline:$('logHomeworkDeadline').value, saveHomework:Boolean($('logSaveHomework').checked), absentees:cleanString($('logAbsentees').value), responders:cleanString($('logResponders').value), note:cleanString($('logNote').value), status:$('logStatus').value };
}

function logSummary(log){ return `ÓRAI NAPLÓ\n\nDátum: ${formatDate(log.date)}\nOsztály: ${className(log.classId)}\nTantárgy: ${log.subject || '–'}\nTéma: ${log.topic || '–'}\nMai tananyag: ${log.content || '–'}\nHázi feladat: ${log.homework || '–'}\nHiányzók: ${log.absentees || '–'}\nFelelők: ${log.responders || '–'}\nMegjegyzés: ${log.note || '–'}\nÁllapot: ${logStatusLabel(log.status)}\nTanév / félév: ${log.schoolYear || 'Nincs besorolva'}${log.semester ? ` / ${log.semester}. félév` : ''}`; }
function updateLogOutput(){ $('logOutput').value = logSummary({ ...currentLogFromForm(), ...newRecordMeta() }); }
function clearLogForm(){ data.activeLogId=''; $('logDate').value=todayIso(); $('logClass').value=data.activeClassId; $('logSubject').value=getClass()?.subject || ''; ['logTopic','logContent','logHomework','logHomeworkDeadline','logAbsentees','logResponders','logNote'].forEach(id => $(id).value=''); $('logStatus').value='megtartva'; $('logSaveHomework').checked=false; updateLogOutput(); }
function loadLog(log){ data.activeLogId=log.id; data.activeClassId=log.classId; save(); renderAll(); $('logDate').value=log.date; $('logClass').value=log.classId; $('logSubject').value=log.subject; $('logTopic').value=log.topic; $('logContent').value=log.content; $('logHomework').value=log.homework; $('logHomeworkDeadline').value=log.homeworkDeadline || ''; $('logSaveHomework').checked=Boolean(log.linkedHomeworkId); $('logAbsentees').value=log.absentees; $('logResponders').value=log.responders; $('logNote').value=log.note; $('logStatus').value=log.status; updateLogOutput(); showTab('logs'); }

function saveLogV15(){
  const incoming=currentLogFromForm(); if(!incoming.classId || !incoming.subject || !incoming.topic){ toast('Töltsd ki legalább az osztályt, tantárgyat és óratémát.'); return; }
  let log=data.lessonLogs.find(item=>item.id===data.activeLogId && !item.archived);
  if(log){ Object.assign(log,incoming,{updatedAt:new Date().toISOString()}); } else { log=withCurrentTerm({id:uid(),...incoming,linkedHomeworkId:'',createdAt:new Date().toISOString(),updatedAt:''}); data.lessonLogs.push(log); data.activeLogId=log.id; }
  if(incoming.saveHomework && incoming.homework){
    if(!incoming.homeworkDeadline) toast('A házi feladat határideje nincs megadva; a feladat határidő nélkül mentve.');
    let homework=data.homeworks.find(item=>item.id===log.linkedHomeworkId && !item.archived);
    if(!homework){ homework=withCurrentTerm({id:uid(),classId:incoming.classId,subject:incoming.subject,deadline:incoming.homeworkDeadline,text:incoming.homework,note:`Órai naplóból: ${formatDate(incoming.date)}`,done:false,createdAt:new Date().toISOString(),sourceLogId:log.id}); data.homeworks.push(homework); log.linkedHomeworkId=homework.id; }
    else Object.assign(homework,{classId:incoming.classId,subject:incoming.subject,deadline:incoming.homeworkDeadline,text:incoming.homework});
  }
  delete log.saveHomework; data.activeClassId=incoming.classId; save(); updateLogOutput(); renderAll(); toast(log.linkedHomeworkId ? 'Órai napló és kapcsolódó házi feladat mentve.' : 'Órai napló mentve.');
}

function eventsForStudent(classId, student, start='', end=''){ return visibleRecords(data.studentEvents).filter(event=>event.classId===classId && (event.studentId===student.id || (!event.studentId && event.studentName===student.name)) && dateInRange(event.date,start,end)); }
function assessmentResultsForStudent(classId, student, start='', end=''){ return visibleRecords(data.assessments).filter(assessment=>assessment.classId===classId && dateInRange(assessment.date,start,end)).map(assessment=>{ const result=resultOf(assessment,student.id), percent=scorePercent(result,assessment); return percent===null?null:{assessment,percent:Math.min(100,percent),grade:gradeFromPercent(Math.min(100,percent),assessment.scale)}; }).filter(Boolean); }
function studentSummary(classId,student,start=$('studentStartDate')?.value||'',end=$('studentEndDate')?.value||''){
  if(!student) return 'TANULÓI ADATLAP\n\nNincs kiválasztott tanuló.'; const results=assessmentResultsForStudent(classId,student,start,end),events=eventsForStudent(classId,student,start,end),avg=results.length?results.reduce((sum,item)=>sum+item.percent,0)/results.length:null,count=type=>events.filter(event=>event.type===type).length,last=events.filter(event=>event.type==='felelt').sort((a,b)=>dateSortValue(b.date)-dateSortValue(a.date))[0],notes=events.filter(event=>event.note).sort((a,b)=>dateSortValue(b.date)-dateSortValue(a.date)).slice(0,3).map(event=>`${formatDate(event.date)}: ${event.note}`);
  return `TANULÓI ADATLAP\n\nTanuló: ${student.name}\nOsztály: ${className(classId)}\nDátumtartomány: ${start||'kezdet'} – ${end||'jelen'}\nTanév / félév: ${currentTermLabel()}\nDolgozateredmények: ${results.length?results.map(item=>`${item.assessment.title||'Dolgozat'} ${item.percent.toFixed(1)}% (${item.grade})`).join('; '):'Nincs rögzített eredmény.'}\nÁtlagos százalék: ${avg===null?'–':`${avg.toFixed(1)}%`}\nJegyek: ${results.length?results.map(item=>item.grade).join(', '):'–'}\nHiányzó házik: ${count('nincs_hazi')}\nHiányzások: ${count('hianyzott')}\nDicséretek: ${count('dicseret')}\nFigyelmeztetések: ${count('figyelmeztetes')}\nUtolsó felelés: ${last?formatDate(last.date):'–'}\nLegutóbbi megjegyzések: ${notes.length?notes.join(' | '):'–'}`;
}
function renderStudentProfile(){
  const classId=$('studentProfileClass').value||data.activeClassId; fillStudentSelect('studentProfileSelect',classId,'Válassz tanulót',$('studentSearch').value); const student=studentById(classId,$('studentProfileSelect').value),box=$('studentProfileOutput'); box.replaceChildren(); if(!student){const e=document.createElement('p');e.className='empty';e.textContent='Válassz osztályt és tanulót az adatlap megjelenítéséhez.';box.append(e);return;} const text=studentSummary(classId,student),title=document.createElement('h3'),term=document.createElement('p'),pre=document.createElement('pre'); title.textContent=`${student.name} · ${className(classId)}`;term.className='profile-term';term.textContent=`${currentTermLabel()} · ${$('studentStartDate').value||'kezdet'} – ${$('studentEndDate').value||'jelen'}`;pre.className='profile-summary';pre.textContent=text;box.append(title,term,pre);
}

function updateEventMode(){ const multiple=$('eventModeMultiple').checked; $('singleStudentField').hidden=multiple; $('bulkStudentPicker').hidden=!multiple; if(multiple) renderBulkStudentPicker(); }
function renderBulkStudentPicker(){ const classId=$('eventClass').value||data.activeClassId,box=$('bulkStudentList');box.replaceChildren(); activeStudents(classId).forEach(student=>{const label=document.createElement('label');label.className='bulk-student';const check=document.createElement('input');check.type='checkbox';check.value=student.id;check.checked=bulkStudentSelection.has(student.id);check.addEventListener('change',()=>{check.checked?bulkStudentSelection.add(student.id):bulkStudentSelection.delete(student.id)});const name=document.createElement('span');name.textContent=student.name;label.append(check,name);box.append(label);}); }
function clearEventForm(){ data.activeStudentEventId='';bulkStudentSelection.clear();$('eventDate').value=todayIso();$('eventClass').value=data.activeClassId;fillStudentSelect('eventStudent',data.activeClassId,'Válassz tanulót');$('eventType').value='hianyzott';$('eventNote').value='';$('eventModeSingle').checked=true;updateEventMode(); }
function saveEventV15(){
  const classId=$('eventClass').value||data.activeClassId,base={date:$('eventDate').value||todayIso(),classId,type:$('eventType').value,note:cleanString($('eventNote').value)},multiple=$('eventModeMultiple').checked; let students=[];
  if(multiple) students=activeStudents(classId).filter(student=>bulkStudentSelection.has(student.id)); else { const student=studentById(classId,$('eventStudent').value); if(student) students=[student]; }
  if(!classId||!students.length){toast(multiple?'Nincs kijelölt tanuló.':'Válassz osztályt és tanulót.');return;}
  let saved=0;
  if(!multiple && data.activeStudentEventId){const event=data.studentEvents.find(item=>item.id===data.activeStudentEventId&&!item.archived);if(event){Object.assign(event,base,{studentId:students[0].id,studentName:students[0].name,updatedAt:new Date().toISOString()});saved=1;}}
  if(!saved) students.forEach(student=>{const duplicate=data.studentEvents.find(event=>!event.archived&&event.classId===classId&&event.studentId===student.id&&event.date===base.date&&event.type===base.type&&event.note===base.note);if(!duplicate){data.studentEvents.push(withCurrentTerm({id:uid(),...base,studentId:student.id,studentName:student.name,createdAt:new Date().toISOString(),updatedAt:''}));saved++;}});
  data.activeClassId=classId;save();renderAll();toast(saved?`${saved} tanulói esemény elmentve.`:'Azonos esemény már szerepel a listában.');
}

function renderStudentEvents(){
  const formClassId=$('eventClass').value||data.activeClassId;fillStudentSelect('eventStudent',formClassId,'Válassz tanulót');if($('eventModeMultiple').checked)renderBulkStudentPicker();const filterClassId=$('eventFilterClass').value;fillStudentSelect('eventFilterStudent',filterClassId||data.activeClassId,'Minden tanuló');if(!filterClassId){const select=$('eventFilterStudent');select.disabled=false;select.replaceChildren(new Option('Minden tanuló',''));data.classes.forEach(schoolClass=>activeStudents(schoolClass.id).forEach(student=>select.add(new Option(`${student.name} (${schoolClass.name})`,`${schoolClass.id}:${student.id}`))));}
  const date=$('eventFilterDate').value,type=$('eventFilterType').value,studentFilter=$('eventFilterStudent').value;const events=visibleRecords(data.studentEvents).filter(event=>(!date||event.date===date)&&(!filterClassId||event.classId===filterClassId)&&(!type||event.type===type)&&(!studentFilter||(studentFilter.includes(':')?`${event.classId}:${event.studentId}`===studentFilter:event.studentId===studentFilter))).sort((a,b)=>dateSortValue(b.date)-dateSortValue(a.date));$('eventOutput').value=eventSummary(events);const list=$('eventList');list.replaceChildren();if(!events.length){const e=document.createElement('p');e.className='empty';e.textContent='Nincs rögzített esemény a megadott szűréssel.';list.append(e);return;}events.forEach(event=>{const item=document.createElement('div');item.className='saved-item';const title=document.createElement('b');title.textContent=`${formatDate(event.date)} · ${event.studentName||'Tanuló'} · ${eventTypeLabel(event.type)}`;const detail=document.createElement('small');detail.textContent=`${className(event.classId)}${event.note?` · ${event.note}`:''}`;const actions=document.createElement('div');actions.className='saved-actions';const open=document.createElement('button');open.className='secondary';open.type='button';open.textContent='Megnyitás / szerkesztés';open.addEventListener('click',()=>{data.activeStudentEventId=event.id;data.activeClassId=event.classId;save();renderAll();$('eventDate').value=event.date;$('eventClass').value=event.classId;fillStudentSelect('eventStudent',event.classId,'Válassz tanulót');$('eventStudent').value=event.studentId;$('eventType').value=event.type;$('eventNote').value=event.note;$('eventModeSingle').checked=true;updateEventMode();showTab('classes');});const remove=document.createElement('button');remove.className='danger';remove.type='button';remove.textContent='Törlés';remove.addEventListener('click',()=>{if(confirm('Törlöd ezt a tanulói eseményt?')){data.studentEvents=data.studentEvents.filter(item=>item.id!==event.id);save();renderAll();toast('Tanulói esemény törölve.');}});actions.append(open,remove);item.append(title,detail,actions);list.append(item);});
}

function buildExportPayload(source=data){ return { appName:'TanárSegéd', appVersion:'15', dataVersion:2, exportDate:new Date().toISOString(), schoolYear:source.settings?.schoolYear||'Nincs besorolva', semester:source.settings?.semester||'', data:source }; }
function exportJson(name='tanarseged-pro-v15-mentes'){ data.settings.lastBackupAt=new Date().toISOString(); save(); download(`${name}-${todayIso()}.json`,JSON.stringify(buildExportPayload(),null,2),'application/json'); renderBackupPanel(); toast('Biztonsági mentés elkészült.'); }
function estimateSize(){ try{return new Blob([JSON.stringify(data)]).size;}catch{return JSON.stringify(data).length*2;} }
function formatBytes(bytes){ return bytes>=1024*1024?`${(bytes/(1024*1024)).toFixed(2)} MB`:`${Math.max(1,Math.ceil(bytes/1024))} KB`; }
function renderBackupPanel(){
  $('schoolYearInput').value=data.settings.schoolYear||'';$('semesterInput').value=data.settings.semester||'1';const bytes=estimateSize();$('storageSize').textContent=formatBytes(bytes);$('lastBackupAt').textContent=data.settings.lastBackupAt?new Date(data.settings.lastBackupAt).toLocaleString('hu-HU'):'–';$('lastImportAt').textContent=data.settings.lastImportAt?new Date(data.settings.lastImportAt).toLocaleString('hu-HU'):'–';$('storageWarning').hidden=bytes<4*1024*1024;$('showArchivedToggle').checked=Boolean(data.settings.showArchived);
  const years=[...new Set(collectionNames().flatMap(name=>data[name].filter(record=>record.archived).map(record=>record.schoolYear||'Nincs besorolva')))];const list=$('archiveList');list.replaceChildren();if(!years.length){const e=document.createElement('p');e.className='empty';e.textContent='Még nincs archivált tanév.';list.append(e);}years.forEach(year=>{const item=document.createElement('div');item.className='saved-item';const title=document.createElement('b');title.textContent=year;const actions=document.createElement('div');actions.className='saved-actions';const open=document.createElement('button');open.className='secondary';open.type='button';open.textContent='Megnyitás';open.addEventListener('click',()=>{data.settings.showArchived=true;data.settings.archiveYearFilter=year;save();renderAll();showTab('today');});const exportButton=document.createElement('button');exportButton.className='secondary';exportButton.type='button';exportButton.textContent='Export';exportButton.addEventListener('click',()=>exportArchivedYear(year));const restore=document.createElement('button');restore.className='secondary';restore.type='button';restore.textContent='Visszaállítás';restore.addEventListener('click',()=>{collectionNames().forEach(name=>data[name].forEach(record=>{if(record.archived&&record.schoolYear===year)record.archived=false;}));save();renderAll();toast('Az archivált tanév visszaállítva.');});const remove=document.createElement('button');remove.className='danger';remove.type='button';remove.textContent='Végleges törlés';remove.addEventListener('click',()=>{if(!confirm(`${year} archivált rekordjai végleg törlődnek. Folytatod?`))return;if(prompt('Második megerősítés: írd be pontosan ezt: TÖRLÉS')!=='TÖRLÉS')return;collectionNames().forEach(name=>data[name]=data[name].filter(record=>!(record.archived&&record.schoolYear===year)));save();renderAll();toast('Archivált tanév végleg törölve.');});actions.append(open,exportButton,restore,remove);item.append(title,actions);list.append(item);});
}
function exportArchivedYear(year){ const archived=clone(data);collectionNames().forEach(name=>archived[name]=data[name].filter(record=>record.archived&&record.schoolYear===year));archived.settings={...data.settings,schoolYear:year};download(`tanarseged-pro-v15-archiv-${year.replace('/','-')}-${todayIso()}.json`,JSON.stringify(buildExportPayload(archived),null,2),'application/json');toast('Archivált tanév exportálva.'); }
function archiveCurrentSchoolYear(){ const year=data.settings.schoolYear;if(!year){toast('Állíts be aktuális tanévet.');return;}if(!confirm(`${year} aktív rekordjait archiválod. Előtte automatikus mentés készül. Folytatod?`))return;exportJson('tanarseged-pro-v15-archivalas-elott');let count=0;collectionNames().forEach(name=>data[name].forEach(record=>{if(!record.archived&&record.schoolYear===year){record.archived=true;count++;}}));data.settings.showArchived=false;data.settings.archiveYearFilter='';save();renderAll();toast(`${count} rekord archiválva.`); }
function appendImportedData(imported){ const source=normalizeData(imported),collections=['classes',...collectionNames(),'tasks'];collections.forEach(name=>{const known=new Set(data[name].map(item=>item.id));source[name].forEach(item=>{if(!known.has(item.id)){data[name].push(item);known.add(item.id);}});});Object.entries(source.calledHistory||{}).forEach(([id,value])=>{if(!data.calledHistory[id])data.calledHistory[id]=value;}); }
function prepareImport(parsed){
  let imported,meta;if(parsed?.appName==='TanárSegéd'&&String(parsed.appVersion)==='15'&&Number(parsed.dataVersion)===2&&parsed.data){imported=parsed.data;meta={date:parsed.exportDate,year:parsed.schoolYear,semester:parsed.semester,version:'v15'};}else if(parsed?.app==='tanarseged-pro-v14'&&Number(parsed.version)===14&&parsed.data){imported=parsed.data;meta={date:parsed.exportedAt,year:'Nincs besorolva',semester:'',version:'v14'};}else throw new Error('invalid');const normalized=normalizeData(imported);pendingImport=normalized;const count=collectionNames().reduce((sum,name)=>sum+(normalized[name]?.length||0),0);$('importMeta').textContent=`Mentés verziója: ${meta.version}\nExport dátuma: ${meta.date?new Date(meta.date).toLocaleString('hu-HU'):'nincs megadva'}\nTanév: ${meta.year||'Nincs besorolva'}\nFélév: ${meta.semester||'Nincs besorolva'}\nRekordok száma: ${count}`;$('importDialog').showModal();
}
function completeImport(mode){ if(!pendingImport)return;if(mode==='replace')data=pendingImport;else appendImportedData(pendingImport);data.settings={...defaultSettings(),...data.settings,lastImportAt:new Date().toISOString()};pendingImport=null;save();$('importDialog').close();renderAll();toast('Import sikeresen elkészült.'); }
function maybeShowFirstPrivacy(){ if(!data.settings.privacyAccepted)$('firstPrivacyDialog').showModal(); }

function buildDemoData(){
  const demo=emptyData();demo.settings={...defaultSettings(),privacyAccepted:true};const schoolClass=createClass('7.B','matematika',['Fiktív Alma','Teszt Bors','Minta Csepke','Próba Dénes','Kitalált Emőke','Teszt Füge','Minta Gála','Próba Hunor']);demo.classes.push(schoolClass);demo.activeClassId=schoolClass.id;const makeAssessment=(title,date,points)=>{const a={id:uid(),classId:schoolClass.id,title,subject:'matematika',date,maxPoints:50,scale:clone(DEFAULT_SCALE),results:{},savedAt:new Date().toISOString(),schoolYear:demo.settings.schoolYear,semester:demo.settings.semester,archived:false};points.forEach((value,index)=>a.results[schoolClass.students[index].id]={points:value,bonus:0,status:'ok'});return a;};const first=makeAssessment('Törtek dolgozat',addDaysIso(-2),[47,42,38,31,28,24,19,45]),second=makeAssessment('Geometria röpdolgozat',todayIso(),[40,35,44,29,33,27,21,46]);demo.assessments.push(first,second);demo.activeAssessmentId=second.id;const linkedHomework={id:uid(),classId:schoolClass.id,subject:'matematika',deadline:addDaysIso(2),text:'Munkafüzet 32. oldal, 4–6. feladat.',note:'Órai naplóból létrehozva.',done:false,createdAt:new Date().toISOString(),sourceLogId:'',schoolYear:demo.settings.schoolYear,semester:demo.settings.semester,archived:false};demo.homeworks.push(linkedHomework,{id:uid(),classId:schoolClass.id,subject:'matematika',deadline:todayIso(),text:'Rövid törtes gyakorlás.',note:'',done:false,createdAt:new Date().toISOString(),...newRecordMeta()},{id:uid(),classId:schoolClass.id,subject:'matematika',deadline:addDaysIso(5),text:'Geometria gyakorlófeladatok.',note:'',done:false,createdAt:new Date().toISOString(),...newRecordMeta()});const log1={id:uid(),date:todayIso(),classId:schoolClass.id,subject:'matematika',topic:'Törtek összeadása',content:'Közös példák és páros gyakorlás.',homework:linkedHomework.text,homeworkDeadline:linkedHomework.deadline,linkedHomeworkId:linkedHomework.id,absentees:'Próba Hunor',responders:'Fiktív Alma, Teszt Bors',note:'Következő órán rövid ismétlés.',status:'megtartva',createdAt:new Date().toISOString(),updatedAt:'',schoolYear:demo.settings.schoolYear,semester:demo.settings.semester,archived:false};linkedHomework.sourceLogId=log1.id;demo.lessonLogs.push(log1,{id:uid(),date:addDaysIso(-1),classId:schoolClass.id,subject:'matematika',topic:'Törtek áttekintése',content:'Nevező és számláló ismétlése.',homework:'',homeworkDeadline:'',linkedHomeworkId:'',absentees:'',responders:'Minta Csepke',note:'',status:'megtartva',createdAt:new Date().toISOString(),updatedAt:'',schoolYear:demo.settings.schoolYear,semester:demo.settings.semester,archived:false},{id:uid(),date:addDaysIso(-3),classId:schoolClass.id,subject:'matematika',topic:'Törtek bevezetése',content:'Képi modellek és közös példák.',homework:'',homeworkDeadline:'',linkedHomeworkId:'',absentees:'',responders:'',note:'',status:'megtartva',createdAt:new Date().toISOString(),updatedAt:'',schoolYear:demo.settings.schoolYear,semester:demo.settings.semester,archived:false});[['dicseret','Aktívan segítette a csoportmunkát.'],['felelt','Biztosan használta a tanult fogalmakat.'],['nincs_hazi','A házi feladat pótlását vállalta.'],['hianyzott','Igazolt hiányzás.'],['figyelmeztetes','Az órai felszerelésre figyeljen.']].forEach(([type,note],index)=>demo.studentEvents.push({id:uid(),date:todayIso(),classId:schoolClass.id,studentId:schoolClass.students[index].id,studentName:schoolClass.students[index].name,type,note,createdAt:new Date().toISOString(),updatedAt:'',schoolYear:demo.settings.schoolYear,semester:demo.settings.semester,archived:false}));demo.lessons.push({id:uid(),classId:schoolClass.id,subject:'matematika',topic:'Törtek összeadása',date:todayIso(),output:'ÓRAVÁZLAT\nTantárgy: matematika\nOsztály: 7.B\nTéma: Törtek összeadása\n\nRáhangolódás, közös feldolgozás, páros gyakorlás és kilépőkártya.',createdAt:new Date().toISOString(),schoolYear:demo.settings.schoolYear,semester:demo.settings.semester,archived:false});demo.texts.push({id:uid(),classId:schoolClass.id,studentId:schoolClass.students[0].id,title:'Szülői üzenet minta',content:'Kedves Szülő!\n\nSzeretném megdicsérni Fiktív Alma mai munkáját. Figyelmesen és aktívan dolgozott a matematikaórán.\n\nÜdvözlettel:',createdAt:new Date().toISOString(),schoolYear:demo.settings.schoolYear,semester:demo.settings.semester,archived:false});return demo;
}
function applyDemo(mode){const demo=buildDemoData();if(mode==='replace')data=demo;else{data.classes.push(...demo.classes);collectionNames().forEach(name=>data[name].push(...demo[name]));data.activeClassId=demo.activeClassId;data.activeAssessmentId=demo.activeAssessmentId;}save();$('demoDialog').close();renderAll();toast('Demó adatok betöltve.');}

function renderAll(){ renderSelectors();renderHero();renderTermInfo();renderDashboard();renderClasses();renderAssessment();renderHomeworks();renderLessons();renderTextStudents();renderLogs();renderStudentProfile();renderStudentEvents();renderSavedTexts();renderBackupPanel();if(!$('logDate').value)clearLogForm();if(!$('eventDate').value)clearEventForm();setSaveStatus('saved'); }

function bindEventsV15(){
  document.querySelectorAll('.tab,.mobile-tab').forEach(button=>button.addEventListener('click',()=>showTab(button.dataset.tab)));document.querySelectorAll('.go-tab').forEach(button=>button.addEventListener('click',()=>showTab(button.dataset.go)));document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',()=>copyText($(button.dataset.copy).value||$(button.dataset.copy).textContent)));['globalClassSelect','hwClass','lessonClass','textClass','toolsClass'].forEach(id=>$(id).addEventListener('change',event=>updateActiveClass(event.target.value)));
  $('assessmentClass').addEventListener('change',event=>{const assessment=currentAssessment();if(!assessment)return;assessment.classId=event.target.value;data.activeClassId=event.target.value;if(!assessment.subject)assessment.subject=getClass(event.target.value)?.subject||'';save();renderAll();});
  $('taskForm').addEventListener('submit',event=>{event.preventDefault();const text=cleanString($('taskText').value);if(!text)return;data.tasks.push({id:uid(),text,date:$('taskDate').value,done:false});$('taskText').value='';$('taskDate').value='';save();renderDashboard();});
  $('addClassBtn').addEventListener('click',()=>{const name=cleanString($('newClassName').value);if(!name){toast('Adj nevet az osztálynak.');return;}const schoolClass=createClass(name,$('newClassSubject').value);data.classes.push(schoolClass);data.activeClassId=schoolClass.id;const assessment=createAssessment(schoolClass.id);data.assessments.push(assessment);data.activeAssessmentId=assessment.id;$('newClassName').value='';$('newClassSubject').value='';save();renderAll();toast('Osztály létrehozva. Most add hozzá a névsort.');});
  $('saveClassBtn').addEventListener('click',()=>{const schoolClass=getClass(),name=cleanString($('editClassName').value);if(!schoolClass||!name){toast('Az osztály neve nem lehet üres.');return;}schoolClass.name=name;schoolClass.subject=cleanString($('editClassSubject').value);save();renderAll();toast('Osztályadatok mentve.');});
  $('deleteClassBtn').addEventListener('click',()=>{const schoolClass=getClass();if(!schoolClass||!confirm(`${schoolClass.name} és a hozzá tartozó rekordok törlődnek. Folytatod?`))return;data.classes=data.classes.filter(item=>item.id!==schoolClass.id);collectionNames().forEach(name=>data[name]=data[name].filter(item=>item.classId!==schoolClass.id));data.activeClassId=data.classes[0]?.id||'';data.activeAssessmentId=visibleRecords(data.assessments).find(item=>item.classId===data.activeClassId)?.id||'';save();renderAll();toast('Osztály törölve.');});
  $('addStudentsBtn').addEventListener('click',()=>{addStudentNames($('studentPaste').value);$('studentPaste').value='';});$('rosterImportInput').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{const text=await file.text(),lines=text.replace(/^\ufeff/,'').split(/\r?\n/).map(line=>line.split(/[;,\t]/)[0]).filter(Boolean);if(lines.length&&/név|tanuló/i.test(lines[0]))lines.shift();addStudentNames(lines.join('\n'));}catch{toast('A CSV-fájl beolvasása nem sikerült.');}finally{event.target.value='';}});
  $('newAssessmentBtn').addEventListener('click',()=>{if(!data.activeClassId){toast('Előbb hozz létre osztályt.');return;}const assessment=createAssessment(data.activeClassId);data.assessments.push(assessment);data.activeAssessmentId=assessment.id;save();renderAll();toast('Új dolgozat létrehozva.');});['assessmentTitle','assessmentSubject','assessmentDate','assessmentMaxPoints'].forEach(id=>$(id).addEventListener('input',()=>{const assessment=currentAssessment();if(!assessment)return;assessment.title=$('assessmentTitle').value.trim();assessment.subject=$('assessmentSubject').value.trim();assessment.date=$('assessmentDate').value||todayIso();assessment.maxPoints=clamp(Number($('assessmentMaxPoints').value)||100,1,10000);save();renderAssessmentRows();renderAssessmentStats();renderQuickCalc();renderAssessmentList();renderDashboard();}));$('saveAssessmentBtn').addEventListener('click',()=>{const assessment=currentAssessment();if(!assessment)return;assessment.savedAt=new Date().toISOString();save();renderAssessmentList();toast('Dolgozat mentve.');});$('resetScaleBtn').addEventListener('click',()=>{const assessment=currentAssessment();if(!assessment)return;assessment.scale=clone(DEFAULT_SCALE);save();renderAssessment();toast('Ponthatárok visszaállítva.');});['quickPoints','quickBonus'].forEach(id=>$(id).addEventListener('input',renderQuickCalc));$('exportCsvBtn').addEventListener('click',exportCsv);$('copySummaryBtn').addEventListener('click',()=>copyText(assessmentSummary()));$('printAssessmentBtn').addEventListener('click',()=>{showTab('assessments');window.print();});
  $('saveHomeworkBtn').addEventListener('click',()=>{const classId=$('hwClass').value||data.activeClassId,text=cleanString($('hwText').value);if(!classId||!text){toast('Válassz osztályt és írd be a feladatot.');return;}data.homeworks.push(withCurrentTerm({id:uid(),classId,subject:cleanString($('hwSubject').value)||getClass(classId)?.subject||'',deadline:$('hwDeadline').value,text,note:cleanString($('hwNote').value),done:false,createdAt:new Date().toISOString(),sourceLogId:''}));data.activeClassId=classId;$('hwText').value='';$('hwNote').value='';save();renderAll();toast('Házi feladat mentve.');});$('clearDoneHomeworksBtn').addEventListener('click',()=>{const done=data.homeworks.filter(item=>!item.archived&&item.done).length;if(!done){toast('Nincs lezárt házi feladat.');return;}if(confirm(`${done} lezárt házi feladatot törölsz. Folytatod?`)){data.homeworks=data.homeworks.filter(item=>!item.done);save();renderAll();toast('Lezárt házik törölve.');}});
  $('newLogBtn').addEventListener('click',clearLogForm);['logDate','logClass','logSubject','logTopic','logContent','logHomework','logHomeworkDeadline','logAbsentees','logResponders','logNote','logStatus','logSaveHomework'].forEach(id=>$(id).addEventListener('input',updateLogOutput));$('logClass').addEventListener('change',()=>{if(!$('logSubject').value)$('logSubject').value=getClass($('logClass').value)?.subject||'';updateLogOutput();});$('saveLogBtn').addEventListener('click',saveLogV15);$('logFilterDate').addEventListener('input',renderLogs);$('logFilterClass').addEventListener('change',renderLogs);$('logFilterSubject').addEventListener('input',renderLogs);$('clearLogFiltersBtn').addEventListener('click',()=>{$('logFilterDate').value='';$('logFilterClass').value='';$('logFilterSubject').value='';renderLogs();});
  $('lessonClass').addEventListener('change',()=>{const schoolClass=getClass($('lessonClass').value);if(schoolClass&&!$('lessonSubject').value)$('lessonSubject').value=schoolClass.subject;});$('generateLessonBtn').addEventListener('click',generateLesson);$('saveLessonBtn').addEventListener('click',()=>{const classId=$('lessonClass').value||data.activeClassId,output=$('lessonOutput').value.trim();if(!classId||!output||output.startsWith('Itt jelenik')){toast('Előbb készíts óravázlatot.');return;}data.lessons.push(withCurrentTerm({id:uid(),classId,subject:cleanString($('lessonSubject').value)||getClass(classId)?.subject||'',topic:cleanString($('lessonTopic').value),date:$('lessonDate').value||todayIso(),output,createdAt:new Date().toISOString()}));data.activeClassId=classId;save();renderAll();toast('Óravázlat mentve.');});$('printLessonBtn').addEventListener('click',()=>{showTab('lesson');window.print();});
  $('generateTextBtn').addEventListener('click',generateText);$('saveTextBtn').addEventListener('click',()=>{const content=cleanString($('textOutput').value);if(!content||content.startsWith('Itt jelenik')){toast('Előbb készíts vagy írj be szöveget.');return;}data.texts.push(withCurrentTerm({id:uid(),classId:$('textClass').value||data.activeClassId,studentId:$('txtStudent').value||'',title:cleanString($('txtTopic').value)||$('txtType').selectedOptions[0].textContent,content,createdAt:new Date().toISOString()}));save();renderSavedTexts();toast('Szöveg mentve.');});
  $('studentProfileClass').addEventListener('change',renderStudentProfile);$('studentSearch').addEventListener('input',renderStudentProfile);$('studentProfileSelect').addEventListener('change',renderStudentProfile);$('applyStudentDateFilterBtn').addEventListener('click',renderStudentProfile);$('clearStudentDateFilterBtn').addEventListener('click',()=>{$('studentStartDate').value='';$('studentEndDate').value='';renderStudentProfile();});$('copyStudentSummaryBtn').addEventListener('click',()=>copyText(studentSummary($('studentProfileClass').value||data.activeClassId,studentById($('studentProfileClass').value||data.activeClassId,$('studentProfileSelect').value))));$('printStudentProfileBtn').addEventListener('click',()=>{document.body.classList.add('print-student');window.print();setTimeout(()=>document.body.classList.remove('print-student'),500);});
  $('newEventBtn').addEventListener('click',clearEventForm);$('eventModeSingle').addEventListener('change',updateEventMode);$('eventModeMultiple').addEventListener('change',updateEventMode);$('eventClass').addEventListener('change',()=>{bulkStudentSelection.clear();fillStudentSelect('eventStudent',$('eventClass').value,'Válassz tanulót');updateEventMode();});$('selectAllStudentsBtn').addEventListener('click',()=>{activeStudents($('eventClass').value||data.activeClassId).forEach(student=>bulkStudentSelection.add(student.id));renderBulkStudentPicker();});$('clearStudentSelectionBtn').addEventListener('click',()=>{bulkStudentSelection.clear();renderBulkStudentPicker();});$('saveEventBtn').addEventListener('click',saveEventV15);$('eventFilterDate').addEventListener('input',renderStudentEvents);$('eventFilterClass').addEventListener('change',renderStudentEvents);$('eventFilterStudent').addEventListener('change',renderStudentEvents);$('eventFilterType').addEventListener('change',renderStudentEvents);$('clearEventFiltersBtn').addEventListener('click',()=>{$('eventFilterDate').value='';$('eventFilterClass').value='';$('eventFilterStudent').value='';$('eventFilterType').value='';renderStudentEvents();});
  $('pickRandomBtn').addEventListener('click',pickRandom);$('makeGroupsBtn').addEventListener('click',makeGroups);$('resetCalledBtn').addEventListener('click',()=>{if(confirm('Törlöd a felelőválasztási előzményeket?')){data.calledHistory={};save();toast('Felelőelőzmények törölve.');}});
  $('saveTermBtn').addEventListener('click',()=>{const year=cleanString($('schoolYearInput').value);if(!/^\d{4}\/\d{4}$/.test(year)){toast('A tanév formátuma legyen például: 2026/2027');return;}data.settings.schoolYear=year;data.settings.semester=$('semesterInput').value;save();renderAll();toast('Tanév és félév mentve.');});$('backupBtn').addEventListener('click',()=>exportJson());$('restoreInput').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{prepareImport(JSON.parse(await file.text()));}catch{toast('Hibás vagy nem támogatott TanárSegéd mentés.');}finally{event.target.value='';}});$('importReplaceBtn').addEventListener('click',()=>completeImport('replace'));$('importAppendBtn').addEventListener('click',()=>completeImport('append'));$('importCancelBtn').addEventListener('click',()=>{pendingImport=null;$('importDialog').close();});$('demoDataBtn').addEventListener('click',()=>$('demoDialog').showModal());$('demoAppendBtn').addEventListener('click',()=>applyDemo('append'));$('demoReplaceBtn').addEventListener('click',()=>applyDemo('replace'));$('demoCancelBtn').addEventListener('click',()=>$('demoDialog').close());$('showArchivedToggle').addEventListener('change',()=>{data.settings.showArchived=$('showArchivedToggle').checked;if(!data.settings.showArchived)data.settings.archiveYearFilter='';save();renderAll();});$('archiveYearBtn').addEventListener('click',archiveCurrentSchoolYear);$('clearAllBtn').addEventListener('click',()=>{if(!confirm('Biztosan törlöd az összes v15-ös helyi adatot?'))return;if(prompt('Második megerősítés: írd be pontosan ezt: TÖRLÉS')!=='TÖRLÉS'){toast('Az adatok törlése megszakítva.');return;}data=emptyData();save();renderAll();clearLogForm();clearEventForm();toast('Minden v15-ös helyi adat törölve.');});
  $('feedbackBtn').addEventListener('click',()=>{if(!FEEDBACK_URL){toast('A visszajelző űrlap linkje még nincs beállítva.');return;}window.open(FEEDBACK_URL,'_blank','noopener,noreferrer');});$('privacyBtn').addEventListener('click',()=>$('privacyDialog').showModal());$('closePrivacyBtn').addEventListener('click',()=>$('privacyDialog').close());$('openFirstPrivacyBtn').addEventListener('click',()=>$('firstPrivacyDialog').showModal());$('acceptPrivacyBtn').addEventListener('click',()=>{data.settings.privacyAccepted=true;save();$('firstPrivacyDialog').close();});$('firstPrivacyDemoBtn').addEventListener('click',()=>{data.settings.privacyAccepted=true;save();$('firstPrivacyDialog').close();$('demoDialog').showModal();});$('firstPrivacyDialog').addEventListener('cancel',event=>{if(!data.settings.privacyAccepted)event.preventDefault();});
  $('mobileMenuBtn').addEventListener('click',()=>$('mobileMenu').classList.contains('open')?closeMobileMenu():openMobileMenu());$('mobileMenuClose').addEventListener('click',()=>closeMobileMenu());$('mobileOverlay').addEventListener('click',()=>closeMobileMenu());document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('mobileMenu').classList.contains('open'))closeMobileMenu();if(event.key==='Escape'&&$('firstPrivacyDialog').open){if(data.settings.privacyAccepted)$('firstPrivacyDialog').close();else event.preventDefault();}});window.addEventListener('popstate',()=>{if($('mobileMenu').classList.contains('open'))closeMobileMenu(true);});
}

function bindV15Supplement(){
  $('assignUnclassifiedBtn').addEventListener('click',()=>{if(!confirm('A Nincs besorolva rekordok az aktuális tanévet és félévet kapják. Folytatod?'))return;let count=0;collectionNames().forEach(name=>data[name].forEach(record=>{if(record.schoolYear==='Nincs besorolva'){record.schoolYear=data.settings.schoolYear;record.semester=data.settings.semester;count++;}}));save();renderAll();toast(count?`${count} rekord tanévhez rendelve.`:'Nincs besorolatlan rekord.');});
}

load();
bindEventsV15();
bindV15Supplement();
renderAll();
maybeShowFirstPrivacy();
