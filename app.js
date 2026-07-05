const $ = id => document.getElementById(id);
const HOMEWORK_KEY = 'tanarseged_v7_homeworks';

function toast(text){
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 1800);
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    toast('Vágólapra másolva.');
  }catch{
    toast('Nem sikerült másolni.');
  }
}

function setHero(main, sub, small){
  $('heroMain').textContent = main;
  $('heroSub').textContent = sub;
  $('heroSmall').textContent = small;
}

function resetHero(){
  setHero('0.0%', 'aktuális osztályátlag', '0 diák a listában');
}

document.querySelectorAll('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active', x.dataset.tab === btn.dataset.tab));
    document.querySelectorAll('.tab-panel').forEach(x=>x.classList.toggle('active', x.id === 'tab-' + btn.dataset.tab));

    if(btn.dataset.tab === 'grades') resetHero();
    if(btn.dataset.tab === 'homework') updateHomeworkHero();
    if(btn.dataset.tab === 'lesson') setHero('45p', 'óravázlat készítő', 'gyors órai terv');
    if(btn.dataset.tab === 'texts') setHero('Üzenet', 'értékelő szöveg', 'másolható szülői vagy diák üzenet');
    if(btn.dataset.tab === 'tools') setHero('Sorsoló', 'tanári eszközök', 'véletlen felelő és csoportbontó');
  });
});

document.querySelectorAll('[data-copy]').forEach(btn=>{
  btn.addEventListener('click', ()=>copyText($(btn.dataset.copy).textContent));
});

/* Jegyek */
$('calcGrade').addEventListener('click', ()=>{
  const max = Number($('maxPoint').value) || 1;
  const got = Number($('gotPoint').value) || 0;
  const percent = Math.max(0, Math.min(100, got / max * 100));
  const grade = percent >= 85 ? 5 : percent >= 70 ? 4 : percent >= 55 ? 3 : percent >= 40 ? 2 : 1;
  $('gradeResult').textContent = `${percent.toFixed(1)}% • Jegy: ${grade}`;
  setHero(percent.toFixed(1) + '%', 'gyors számolás eredménye', `${got} / ${max} pont • jegy: ${grade}`);
});

/* Házi feladatok */
function getHomeworks(){
  try{return JSON.parse(localStorage.getItem(HOMEWORK_KEY)) || []}catch{return []}
}
function setHomeworks(list){
  localStorage.setItem(HOMEWORK_KEY, JSON.stringify(list));
}
function formatDate(dateStr){
  if(!dateStr) return 'nincs megadva';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('hu-HU');
}
function buildHomeworkMessage(hw){
  return `HÁZI FELADAT\n\nOsztály: ${hw.className || '-'}\nTantárgy: ${hw.subject || '-'}\nHatáridő: ${formatDate(hw.deadline)}\n\nFeladat:\n${hw.text || '-'}\n\nMegjegyzés:\n${hw.note || '-'}`;
}
function updateHomeworkHero(){
  const list = getHomeworks();
  setHero(String(list.length), 'mentett házi feladat', list.length ? 'utolsó: ' + (list[list.length-1].subject || 'tantárgy') : 'még nincs mentett házi');
}
function renderHomeworks(){
  const list = getHomeworks();
  const box = $('homeworkList');
  box.innerHTML = '';

  if(!list.length){
    box.innerHTML = '<div class="result">Még nincs mentett házi feladat.</div>';
    $('homeworkMessage').textContent = 'Itt jelenik meg a házi feladat üzenete.';
    updateHomeworkHero();
    return;
  }

  list.slice().reverse().forEach(hw=>{
    const item = document.createElement('div');
    item.className = 'saved-item';
    item.innerHTML = `
      <b>${escapeHtml(hw.subject || 'Tantárgy nélkül')} • ${escapeHtml(hw.className || 'Osztály nélkül')}</b>
      <small>Határidő: ${formatDate(hw.deadline)}<br>${escapeHtml((hw.text || '').slice(0,140))}${(hw.text||'').length>140?'...':''}</small>
      <div class="saved-actions">
        <button class="secondary show-btn">Megnyitás</button>
        <button class="secondary copy-btn">Másolás</button>
        <button class="danger delete-btn">Törlés</button>
      </div>
    `;

    item.querySelector('.show-btn').onclick = ()=>{
      $('homeworkMessage').textContent = buildHomeworkMessage(hw);
      toast('Házi megnyitva.');
    };
    item.querySelector('.copy-btn').onclick = ()=>copyText(buildHomeworkMessage(hw));
    item.querySelector('.delete-btn').onclick = ()=>{
      const next = getHomeworks().filter(x=>x.id !== hw.id);
      setHomeworks(next);
      renderHomeworks();
      toast('Házi törölve.');
    };
    box.appendChild(item);
  });

  $('homeworkMessage').textContent = buildHomeworkMessage(list[list.length-1]);
  updateHomeworkHero();
}
function escapeHtml(text){
  return String(text).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

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

/* Óravázlat */
$('generateLessonBtn').addEventListener('click', ()=>{
  const subject = $('lessonSubject').value.trim() || 'tantárgy';
  const topic = $('lessonTopic').value.trim() || 'óra témája';
  const cls = $('lessonClass').value.trim() || 'osztály';
  const min = Number($('lessonMinutes').value) || 45;
  const goal = $('lessonGoal').value.trim() || 'a tananyag megértése és gyakorlása';

  $('lessonOutput').textContent =
`ÓRAVÁZLAT

Tantárgy: ${subject}
Osztály: ${cls}
Téma: ${topic}
Időtartam: ${min} perc
Óra célja: ${goal}

1. Ráhangolódás – 5 perc
- Rövid kérdések az előző anyagból.
- A mai téma felvezetése egyszerű példával.

2. Új anyag / magyarázat – 15 perc
- A(z) ${topic} fő pontjainak bemutatása.
- Közös példa vagy rövid tanári magyarázat.

3. Gyakorlás – 20 perc
- Önálló vagy páros feladatmegoldás.
- Gyors ellenőrzés közösen.

4. Lezárás – 5 perc
- Mit tanultunk ma?
- 1-2 ellenőrző kérdés.

Házi feladat:
- Rövid gyakorlás a(z) ${topic} témából.`;

  setHero(min + 'p', 'kész óravázlat', `${subject} • ${cls}`);
});

/* Szövegek */
$('generateTextBtn').addEventListener('click', ()=>{
  const name = $('txtStudent').value.trim() || 'A tanuló';
  const topic = $('txtTopic').value.trim() || 'az aktuális téma';
  const details = $('txtDetails').value.trim() || 'Az alapok megvannak, de rendszeres gyakorlással tovább javítható az eredmény.';
  const type = $('txtType').value;

  let text = '';

  if(type === 'szulo'){
    text = `Tisztelt Szülő!\n\nSzeretném röviden tájékoztatni ${name} előrehaladásáról a(z) ${topic} kapcsán.\n\n${details}\n\nKérem, lehetőség szerint otthon is segítsék rövid ismétléssel.\n\nÜdvözlettel:`;
  } else if(type === 'dicseret'){
    text = `${name} munkáját szeretném külön megdicsérni.\n\nA(z) ${topic} témában figyelmesen, aktívan és igényesen dolgozott.\n\n${details}\n\nCsak így tovább!`;
  } else if(type === 'figyelmeztetes'){
    text = `${name} esetében a(z) ${topic} kapcsán több odafigyelésre és rendszeresebb munkára van szükség.\n\n${details}\n\nKérem, a következő időszakban fordítson nagyobb figyelmet a felkészülésre.`;
  } else if(type === 'hianyzo_hazi'){
    text = `Tisztelt Szülő!\n\n${name} részéről a(z) ${topic} témához kapcsolódó házi feladat hiányzik.\n\n${details}\n\nKérem, segítsék a pótlást a következő órára.\n\nÜdvözlettel:`;
  } else {
    text = `${name} a(z) ${topic} témában a következő visszajelzést kapja:\n\n${details}\n\nJavaslat: rövid, rendszeres ismétlés és célzott gyakorlófeladatok.`;
  }

  $('textOutput').textContent = text;
  setHero('Üzenet', 'szöveg elkészült', type.replace('_',' '));
});

/* Tanári eszközök */
function names(){
  return $('namesInput').value.split(/\n|,/).map(x=>x.trim()).filter(Boolean);
}
$('pickRandomBtn').addEventListener('click', ()=>{
  const list = names();
  $('toolsOutput').textContent = list.length
    ? `Véletlen felelő: ${list[Math.floor(Math.random()*list.length)]}\nFeladat: ${$('classTask').value || '-'}`
    : 'Adj meg neveket soronként.';
});
$('makeGroupsBtn').addEventListener('click', ()=>{
  const list = names().sort(()=>Math.random()-.5);
  const count = Math.max(2, Math.min(10, Number($('groupCount').value)||3));
  if(!list.length){
    $('toolsOutput').textContent = 'Adj meg neveket soronként.';
    return;
  }
  const groups = Array.from({length:count},()=>[]);
  list.forEach((name,i)=>groups[i%count].push(name));
  $('toolsOutput').textContent = groups.map((g,i)=>`${i+1}. csoport: ${g.join(', ')}`).join('\n') + `\n\nFeladat: ${$('classTask').value || '-'}`;
});

renderHomeworks();
resetHero();
