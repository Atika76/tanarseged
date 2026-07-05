const STORAGE_KEY = 'tanarseged_pro_v10_clean';
const HOMEWORK_KEY = 'tanarseged_pro_v10_homeworks';

const defaultScale = [
  { grade: 5, min: 85 },
  { grade: 4, min: 70 },
  { grade: 3, min: 55 },
  { grade: 2, min: 40 },
  { grade: 1, min: 0 }
];

let state = {
  id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  title: '',
  className: '',
  maxPoints: 100,
  scale: structuredClone(defaultScale),
  students: [],
  saved: []
};

const $ = id => document.getElementById(id);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function toast(text){
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 2000);
}

function escapeHtml(text){
  return String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function load(){
  try{
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(data){
      state = {...state, ...data, scale: data.scale || structuredClone(defaultScale), saved: data.saved || []};
    }
  }catch{}
}

function saveStore(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function percent(points){
  return clamp((Number(points) / (Number(state.maxPoints) || 1)) * 100, 0, 100);
}

function gradeFromPercent(p){
  return [...state.scale].sort((a,b)=>b.min-a.min).find(row=>p >= row.min)?.grade ?? 1;
}

function verbal(p){
  if(p >= 90) return 'kiemelkedő teljesítmény';
  if(p >= 75) return 'jó, biztos tudás';
  if(p >= 60) return 'megfelelő teljesítmény, pár gyakorlással javítható rész';
  if(p >= 40) return 'az alapok megvannak, de gyakorlás szükséges';
  return 'jelentős ismétlés és gyakorlás javasolt';
}

function renderScale(){
  const box = $('gradeScale');
  box.innerHTML = '';
  [...state.scale].sort((a,b)=>b.grade-a.grade).forEach(row=>{
    const div = document.createElement('div');
    div.className = 'scale-row';
    div.innerHTML = `<strong>${row.grade}</strong><input type="number" min="0" max="100" value="${row.min}"><span>%</span>`;
    div.querySelector('input').addEventListener('input', e=>{
      state.scale.find(x=>x.grade === row.grade).min = clamp(Number(e.target.value), 0, 100);
      updateAll();
    });
    box.appendChild(div);
  });
}

function getStats(){
  const count = state.students.length;
  if(!count){
    return {count:0, avg:0, best:'-', worst:'-', pass:0, grades:{1:0,2:0,3:0,4:0,5:0}};
  }

  const percents = state.students.map(s=>percent(s.points));
  const avg = percents.reduce((a,b)=>a+b,0) / count;
  const grades = {1:0,2:0,3:0,4:0,5:0};
  state.students.forEach(s=>grades[gradeFromPercent(percent(s.points))]++);

  const best = state.students.reduce((a,b)=>Number(a.points)>Number(b.points)?a:b);
  const worst = state.students.reduce((a,b)=>Number(a.points)<Number(b.points)?a:b);
  const passed = state.students.filter(s=>gradeFromPercent(percent(s.points)) > 1).length;

  return {
    count,
    avg,
    best:`${best.name} (${percent(best.points).toFixed(1)}%)`,
    worst:`${worst.name} (${percent(worst.points).toFixed(1)}%)`,
    pass: passed / count * 100,
    grades
  };
}

function renderStudents(){
  const body = $('studentRows');
  body.innerHTML = '';

  if(!state.students.length){
    body.innerHTML = '<tr><td colspan="6" class="empty">Még nincs diák felvéve.</td></tr>';
    return;
  }

  state.students.forEach((student, index)=>{
    const p = percent(student.points);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><b>${escapeHtml(student.name)}</b></td>
      <td>${student.points} / ${state.maxPoints}</td>
      <td>${p.toFixed(1)}%</td>
      <td><b class="grade">${gradeFromPercent(p)}</b></td>
      <td class="comment">${verbal(p)}</td>
      <td><button class="danger" type="button">Törlés</button></td>
    `;
    tr.querySelector('button').addEventListener('click', ()=>{
      state.students.splice(index, 1);
      updateAll();
      toast('Diák törölve.');
    });
    body.appendChild(tr);
  });
}

function renderStats(){
  const s = getStats();
  $('heroAverage').textContent = s.avg.toFixed(1) + '%';
  $('heroStudentCount').textContent = s.count;

  $('stats').innerHTML = `
    <div class="stat"><span>Diákok</span><strong>${s.count}</strong></div>
    <div class="stat"><span>Átlag</span><strong>${s.avg.toFixed(1)}%</strong></div>
    <div class="stat"><span>Legjobb</span><strong>${escapeHtml(s.best)}</strong></div>
    <div class="stat"><span>Leggyengébb</span><strong>${escapeHtml(s.worst)}</strong></div>
    <div class="stat"><span>Jegyek</span><strong>5:${s.grades[5]} 4:${s.grades[4]} 3:${s.grades[3]}</strong></div>
    <div class="stat"><span>Alsó jegyek</span><strong>2:${s.grades[2]} 1:${s.grades[1]}</strong></div>
  `;
}

function renderSaved(){
  const box = $('savedList');
  box.innerHTML = '';

  if(!state.saved.length){
    box.innerHTML = '<p class="empty">Nincs mentett dolgozat.</p>';
    return;
  }

  state.saved.slice().reverse().forEach(item=>{
    const div = document.createElement('div');
    div.className = 'saved-item';
    div.innerHTML = `
      <b>${escapeHtml(item.title || 'Névtelen dolgozat')}</b>
      <small>${escapeHtml(item.className || 'Osztály nélkül')} • ${item.students.length} diák • ${new Date(item.savedAt).toLocaleString('hu-HU')}</small>
      <div class="saved-actions">
        <button class="secondary" type="button">Betöltés</button>
        <button class="danger" type="button">Törlés</button>
      </div>
    `;

    const buttons = div.querySelectorAll('button');
    buttons[0].addEventListener('click', ()=>{
      state = {...state, ...item};
      syncInputs();
      renderScale();
      updateAll();
      toast('Dolgozat betöltve.');
    });

    buttons[1].addEventListener('click', ()=>{
      state.saved = state.saved.filter(x=>x.id !== item.id);
      updateAll();
      toast('Mentés törölve.');
    });

    box.appendChild(div);
  });
}

function quickCalc(){
  const val = $('quickPoints').value;
  if(val === ''){
    $('quickPercent').textContent = '0%';
    $('quickGrade').textContent = 'Jegy: -';
    $('quickText').textContent = 'Írj be pontszámot.';
    return;
  }

  const p = percent(val);
  $('quickPercent').textContent = p.toFixed(1) + '%';
  $('quickGrade').textContent = 'Jegy: ' + gradeFromPercent(p);
  $('quickText').textContent = verbal(p);
}

function syncInputs(){
  $('workTitle').value = state.title || '';
  $('className').value = state.className || '';
  $('maxPoints').value = state.maxPoints || 100;
}

function updateAll(){
  state.title = $('workTitle').value;
  state.className = $('className').value;
  state.maxPoints = Number($('maxPoints').value) || 100;

  renderStudents();
  renderStats();
  renderSaved();
  quickCalc();
  saveStore();
}

function summaryText(){
  const s = getStats();
  return `Dolgozat: ${state.title || 'Névtelen'}\nOsztály: ${state.className || '-'}\nMax pont: ${state.maxPoints}\nDiákok: ${s.count}\nÁtlag: ${s.avg.toFixed(1)}%\nSikeresség: ${s.pass.toFixed(0)}%\nJegyek: 5:${s.grades[5]}, 4:${s.grades[4]}, 3:${s.grades[3]}, 2:${s.grades[2]}, 1:${s.grades[1]}\nLegjobb: ${s.best}\nLeggyengébb: ${s.worst}`;
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    toast('Vágólapra másolva.');
  }catch{
    toast('Nem sikerült másolni.');
  }
}

function exportCsv(){
  const rows = [
    ['Dolgozat', state.title],
    ['Osztály', state.className],
    ['Max pont', state.maxPoints],
    [],
    ['Név','Pont','Százalék','Jegy','Értékelés']
  ];

  state.students.forEach(s=>{
    const p = percent(s.points);
    rows.push([s.name, s.points, p.toFixed(1)+'%', gradeFromPercent(p), verbal(p)]);
  });

  const csv = rows.map(row=>row.map(cell=>`"${String(cell).replaceAll('"','""')}"`).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'}));
  a.download = 'tanarseged-dolgozat.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

/* Házi feladat */
function getHomeworks(){
  try{return JSON.parse(localStorage.getItem(HOMEWORK_KEY)) || []}catch{return []}
}
function setHomeworks(list){
  localStorage.setItem(HOMEWORK_KEY, JSON.stringify(list));
}
function formatDate(dateStr){
  if(!dateStr) return 'nincs megadva';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('hu-HU');
}
function buildHomeworkMessage(hw){
  return `HÁZI FELADAT\n\nOsztály: ${hw.className || '-'}\nTantárgy: ${hw.subject || '-'}\nHatáridő: ${formatDate(hw.deadline)}\n\nFeladat:\n${hw.text || '-'}\n\nMegjegyzés:\n${hw.note || '-'}`;
}
function renderHomeworks(){
  const list = getHomeworks();
  const box = $('homeworkList');
  box.innerHTML = '';

  if(!list.length){
    box.innerHTML = '<p class="empty">Nincs mentett házi feladat.</p>';
    $('homeworkMessage').textContent = 'Itt jelenik meg a házi feladat üzenete.';
    return;
  }

  list.slice().reverse().forEach(hw=>{
    const div = document.createElement('div');
    div.className = 'saved-item';
    div.innerHTML = `
      <b>${escapeHtml(hw.subject || 'Tantárgy nélkül')} • ${escapeHtml(hw.className || 'Osztály nélkül')}</b>
      <small>Határidő: ${formatDate(hw.deadline)}<br>${escapeHtml((hw.text || '').slice(0,130))}${(hw.text||'').length>130?'...':''}</small>
      <div class="saved-actions">
        <button class="secondary" type="button">Megnyitás</button>
        <button class="secondary" type="button">Másolás</button>
        <button class="danger" type="button">Törlés</button>
      </div>
    `;

    const buttons = div.querySelectorAll('button');
    buttons[0].addEventListener('click', ()=>{
      $('homeworkMessage').textContent = buildHomeworkMessage(hw);
      toast('Házi megnyitva.');
    });
    buttons[1].addEventListener('click', ()=>copyText(buildHomeworkMessage(hw)));
    buttons[2].addEventListener('click', ()=>{
      const next = getHomeworks().filter(x=>x.id !== hw.id);
      setHomeworks(next);
      renderHomeworks();
      toast('Házi törölve.');
    });

    box.appendChild(div);
  });

  $('homeworkMessage').textContent = buildHomeworkMessage(list[list.length-1]);
}

function generateLesson(){
  const subject = $('lessonSubject').value.trim() || 'tantárgy';
  const topic = $('lessonTopic').value.trim() || 'óra témája';
  const minutes = Number($('lessonMinutes').value) || 45;
  const cls = $('lessonClass').value.trim() || 'osztály';
  const goal = $('lessonGoal').value.trim() || 'a tananyag megértése és gyakorlása';

  const intro = Math.max(5, Math.round(minutes * 0.15));
  const main = Math.max(10, Math.round(minutes * 0.45));
  const practice = Math.max(8, Math.round(minutes * 0.25));
  const close = Math.max(4, minutes - intro - main - practice);

  $('lessonOutput').textContent = `ÓRAVÁZLAT\nTantárgy: ${subject}\nOsztály: ${cls}\nTéma: ${topic}\nIdőtartam: ${minutes} perc\nFő cél: ${goal}\n\n1. Ráhangolódás – ${intro} perc\n- Rövid kérdések az előző anyagból.\n- A mai téma felvezetése hétköznapi példával.\n\n2. Új ismeret / magyarázat – ${main} perc\n- A(z) ${topic} fő pontjainak tisztázása.\n- Tanári magyarázat példákkal.\n\n3. Gyakorlás – ${practice} perc\n- Önálló vagy páros feladatmegoldás.\n- Gyorsabb tanulóknak plusz feladat.\n\n4. Lezárás – ${close} perc\n- Kilépőkártya: „Mi volt ma a legfontosabb?”\n\nHázi feladat:\n- Rövid gyakorlás a(z) ${topic} témából.`;
}

function generateText(){
  const student = $('txtStudent').value.trim() || 'A tanuló';
  const topic = $('txtTopic').value.trim() || 'az aktuális tananyag';
  const details = $('txtDetails').value.trim() || 'Az alapok többnyire megvannak, de a pontosabb megfogalmazás és a rendszeres gyakorlás tovább javíthatja az eredményt.';
  const type = $('txtType').value;

  let text = '';
  if(type === 'szulo'){
    text = `Tisztelt Szülő!\n\nSzeretném röviden tájékoztatni ${student} előrehaladásáról: ${topic}.\n\n${details}\n\nKérem, lehetőség szerint otthon is segítsék rövid ismétléssel.\n\nÜdvözlettel:`;
  } else if(type === 'dicseret'){
    text = `${student} munkáját szeretném külön megdicsérni.\n\nA(z) ${topic} témában figyelmesen, aktívan és igényesen dolgozott.\n\n${details}\n\nCsak így tovább!`;
  } else if(type === 'figyelmeztetes'){
    text = `${student} esetében a(z) ${topic} kapcsán több odafigyelésre és rendszeresebb munkára van szükség.\n\n${details}\n\nKérem, a következő időszakban fordítson nagyobb figyelmet a felkészülésre.`;
  } else if(type === 'hianyzo_hazi'){
    text = `Tisztelt Szülő!\n\n${student} részéről a(z) ${topic} témához kapcsolódó házi feladat hiányzik.\n\n${details}\n\nKérem, segítsék a pótlást a következő órára.\n\nÜdvözlettel:`;
  } else {
    text = `${student} a(z) ${topic} témában a következő visszajelzést kapja:\n\n${details}\n\nJavaslat: rövid, rendszeres ismétlés és célzott gyakorlófeladatok.`;
  }

  $('textOutput').textContent = text;
}

function names(){
  return $('namesInput').value.split(/\n|,/).map(x=>x.trim()).filter(Boolean);
}
function shuffled(arr){
  return arr.map(v=>[Math.random(), v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
}
function pickRandom(){
  const list = names();
  $('toolsOutput').textContent = list.length
    ? `Véletlen felelő: ${list[Math.floor(Math.random()*list.length)]}\nFeladat: ${$('classTask').value || '-'}`
    : 'Adj meg neveket soronként.';
}
function makeGroups(){
  const list = shuffled(names());
  const count = clamp(Number($('groupCount').value) || 3, 2, 10);
  if(!list.length){
    $('toolsOutput').textContent = 'Adj meg neveket soronként.';
    return;
  }
  const groups = Array.from({length:count}, ()=>[]);
  list.forEach((name, i)=>groups[i % count].push(name));
  $('toolsOutput').textContent = groups.map((g,i)=>`${i+1}. csoport: ${g.join(', ')}`).join('\n') + `\n\nFeladat: ${$('classTask').value || '-'}`;
}

/* Események */
document.querySelectorAll('.tab').forEach(button=>{
  button.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab === button.dataset.tab));
    document.querySelectorAll('.tab-panel').forEach(panel=>panel.classList.toggle('active', panel.id === 'tab-' + button.dataset.tab));
  });
});

document.querySelectorAll('[data-copy]').forEach(button=>{
  button.addEventListener('click', ()=>copyText($(button.dataset.copy).textContent));
});

$('studentForm').addEventListener('submit', e=>{
  e.preventDefault();
  const name = $('studentName').value.trim();
  const points = Number($('studentPoints').value);
  if(!name || Number.isNaN(points)) return;
  state.students.push({id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), name, points});
  $('studentName').value = '';
  $('studentPoints').value = '';
  updateAll();
});

['workTitle','className','maxPoints','quickPoints'].forEach(id=>$(id).addEventListener('input', updateAll));
$('resetScaleBtn').addEventListener('click', ()=>{
  state.scale = structuredClone(defaultScale);
  renderScale();
  updateAll();
});
$('newWorkBtn').addEventListener('click', ()=>{
  state.id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  state.title = '';
  state.className = '';
  state.maxPoints = 100;
  state.students = [];
  syncInputs();
  updateAll();
});
$('saveBtn').addEventListener('click', ()=>{
  const snapshot = {
    id: state.id,
    title: state.title || 'Névtelen dolgozat',
    className: state.className,
    maxPoints: state.maxPoints,
    scale: structuredClone(state.scale),
    students: structuredClone(state.students),
    savedAt: new Date().toISOString()
  };
  state.saved = state.saved.filter(x=>x.id !== snapshot.id);
  state.saved.push(snapshot);
  updateAll();
  toast('Dolgozat elmentve.');
});
$('exportCsvBtn').addEventListener('click', exportCsv);
$('copySummaryBtn').addEventListener('click', ()=>copyText(summaryText()));
$('printBtn').addEventListener('click', ()=>window.print());

$('saveHomeworkBtn').addEventListener('click', ()=>{
  const hw = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    className: $('hwClass').value.trim(),
    subject: $('hwSubject').value.trim(),
    deadline: $('hwDeadline').value,
    text: $('hwText').value.trim(),
    note: $('hwNote').value.trim(),
    createdAt: new Date().toISOString()
  };

  if(!hw.className && !hw.subject && !hw.text){
    toast('Írj be legalább osztályt, tantárgyat vagy feladatot.');
    return;
  }

  const list = getHomeworks();
  list.push(hw);
  setHomeworks(list);
  renderHomeworks();
  toast('Házi feladat elmentve.');
});

$('clearHomeworksBtn').addEventListener('click', ()=>{
  if(confirm('Biztosan törlöd az összes mentett házit?')){
    setHomeworks([]);
    renderHomeworks();
    toast('Lista ürítve.');
  }
});

$('generateLessonBtn').addEventListener('click', generateLesson);
$('generateTextBtn').addEventListener('click', generateText);
$('pickRandomBtn').addEventListener('click', pickRandom);
$('makeGroupsBtn').addEventListener('click', makeGroups);

load();
syncInputs();
renderScale();
updateAll();
renderHomeworks();
