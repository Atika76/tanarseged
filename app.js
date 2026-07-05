const STORAGE_KEY = 'tanarseged_pro_v2';
const defaultScale = [
  { grade: 5, min: 85 }, { grade: 4, min: 70 }, { grade: 3, min: 55 }, { grade: 2, min: 40 }, { grade: 1, min: 0 },
];
let state = { id: crypto.randomUUID(), title:'', className:'', maxPoints:100, scale:structuredClone(defaultScale), students:[], saved:[] };
const $ = (id) => document.getElementById(id);
const els = {
  workTitle:$('workTitle'), className:$('className'), maxPoints:$('maxPoints'), gradeScale:$('gradeScale'), quickPoints:$('quickPoints'), quickPercent:$('quickPercent'), quickGrade:$('quickGrade'), quickText:$('quickText'), studentForm:$('studentForm'), studentName:$('studentName'), studentPoints:$('studentPoints'), studentRows:$('studentRows'), stats:$('stats'), savedList:$('savedList'), heroAverage:$('heroAverage'), heroStudentCount:$('heroStudentCount'), toast:$('toast'), saveBtn:$('saveBtn'), exportCsvBtn:$('exportCsvBtn'), printBtn:$('printBtn'), newWorkBtn:$('newWorkBtn'), resetScaleBtn:$('resetScaleBtn'), copySummaryBtn:$('copySummaryBtn')
};
function load(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)); if(data) state={...state,...data,scale:data.scale||structuredClone(defaultScale),saved:data.saved||[]};}catch{}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function toast(msg){els.toast.textContent=msg; els.toast.classList.add('show'); setTimeout(()=>els.toast.classList.remove('show'),2100);}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function percent(points){const max=Number(state.maxPoints)||1; return clamp((Number(points)/max)*100,0,100);}
function gradeFor(pct){return [...state.scale].sort((a,b)=>b.min-a.min).find(item=>pct>=Number(item.min))?.grade??1;}
function verbal(pct){ if(pct>=90) return 'kiemelkedő teljesítmény'; if(pct>=75) return 'jó, biztos tudás'; if(pct>=60) return 'megfelelő teljesítmény, néhány gyakorlással javítható rész'; if(pct>=40) return 'alapok megvannak, de további gyakorlás szükséges'; return 'jelentős gyakorlás és ismétlés javasolt'; }
function renderScale(){els.gradeScale.innerHTML=''; [...state.scale].sort((a,b)=>b.grade-a.grade).forEach(row=>{const div=document.createElement('div'); div.className='scale-row'; div.innerHTML=`<strong>${row.grade}</strong><input type="number" min="0" max="100" step="1" value="${row.min}" aria-label="${row.grade}. jegy minimum százalék"><span>%</span>`; div.querySelector('input').addEventListener('input',e=>{state.scale.find(x=>x.grade===row.grade).min=clamp(Number(e.target.value),0,100); updateAll();}); els.gradeScale.appendChild(div);});}
function renderStudents(){els.studentRows.innerHTML=''; if(!state.students.length){els.studentRows.innerHTML=`<tr><td colspan="6" class="empty">Még nincs diák felvéve.</td></tr>`; return;} state.students.forEach((s,idx)=>{const pct=percent(s.points); const tr=document.createElement('tr'); tr.innerHTML=`<td><strong>${escapeHtml(s.name)}</strong></td><td>${Number(s.points).toLocaleString('hu-HU')} / ${Number(state.maxPoints).toLocaleString('hu-HU')}</td><td>${pct.toFixed(1)}%</td><td><strong class="grade">${gradeFor(pct)}</strong></td><td class="comment">${verbal(pct)}</td><td><button class="danger" type="button">Törlés</button></td>`; tr.querySelector('button').addEventListener('click',()=>{state.students.splice(idx,1); updateAll(); toast('Diák törölve.');}); els.studentRows.appendChild(tr);});}
function getStats(){const count=state.students.length; if(!count) return {count:0,avg:0,best:'-',worst:'-',gradeCounts:{1:0,2:0,3:0,4:0,5:0},passRate:0}; const pcts=state.students.map(s=>percent(s.points)); const avg=pcts.reduce((a,b)=>a+b,0)/count; const gradeCounts={1:0,2:0,3:0,4:0,5:0}; state.students.forEach(s=>gradeCounts[gradeFor(percent(s.points))]++); const best=state.students.reduce((a,b)=>Number(a.points)>Number(b.points)?a:b); const worst=state.students.reduce((a,b)=>Number(a.points)<Number(b.points)?a:b); const passed=state.students.filter(s=>gradeFor(percent(s.points))>1).length; return {count,avg,best:`${best.name} (${percent(best.points).toFixed(1)}%)`,worst:`${worst.name} (${percent(worst.points).toFixed(1)}%)`,gradeCounts,passRate:(passed/count)*100};}
function renderStats(){const s=getStats(); els.heroAverage.textContent=`${s.avg.toFixed(1)}%`; els.heroStudentCount.textContent=s.count; els.stats.innerHTML=`<div class="stat"><span>Diákok</span><strong>${s.count}</strong></div><div class="stat"><span>Átlag</span><strong>${s.avg.toFixed(1)}%</strong></div><div class="stat"><span>Sikeresség</span><strong>${s.passRate.toFixed(0)}%</strong></div><div class="stat"><span>Legjobb</span><strong>${escapeHtml(s.best)}</strong></div><div class="stat"><span>Leggyengébb</span><strong>${escapeHtml(s.worst)}</strong></div><div class="stat"><span>Jegyek</span><strong>5:${s.gradeCounts[5]} 4:${s.gradeCounts[4]} 3:${s.gradeCounts[3]} 2:${s.gradeCounts[2]} 1:${s.gradeCounts[1]}</strong></div>`;}
function renderSaved(){els.savedList.innerHTML=''; if(!state.saved.length){els.savedList.innerHTML='<p class="empty">Nincs mentett dolgozat.</p>'; return;} state.saved.slice().reverse().forEach(item=>{const div=document.createElement('div'); div.className='saved-item'; div.innerHTML=`<strong>${escapeHtml(item.title||'Névtelen dolgozat')}</strong><small>${escapeHtml(item.className||'Osztály nélkül')} • ${item.students.length} diák • ${new Date(item.savedAt).toLocaleString('hu-HU')}</small><div class="saved-actions"><button class="secondary" type="button">Betöltés</button><button class="danger" type="button">Törlés</button></div>`; const [loadBtn,delBtn]=div.querySelectorAll('button'); loadBtn.addEventListener('click',()=>loadSaved(item.id)); delBtn.addEventListener('click',()=>{state.saved=state.saved.filter(x=>x.id!==item.id); updateAll(); toast('Mentés törölve.');}); els.savedList.appendChild(div);});}
function updateQuick(){const val=els.quickPoints.value; if(val===''){els.quickPercent.textContent='0%'; els.quickGrade.textContent='Jegy: -'; els.quickText.textContent='Írj be pontszámot.'; return;} const pct=percent(val); const grade=gradeFor(pct); els.quickPercent.textContent=`${pct.toFixed(1)}%`; els.quickGrade.textContent=`Jegy: ${grade}`; els.quickText.textContent=`${verbal(pct)} • ${Number(val).toLocaleString('hu-HU')} / ${Number(state.maxPoints).toLocaleString('hu-HU')} pont`;}
function syncInputs(){els.workTitle.value=state.title; els.className.value=state.className; els.maxPoints.value=state.maxPoints;}
function updateAll(){state.title=els.workTitle.value; state.className=els.className.value; state.maxPoints=Number(els.maxPoints.value)||100; renderStudents(); renderStats(); renderSaved(); updateQuick(); persist();}
function saveCurrent(){const snapshot={id:state.id,title:state.title||els.workTitle.value||'Névtelen dolgozat',className:state.className||els.className.value||'',maxPoints:Number(state.maxPoints)||100,scale:structuredClone(state.scale),students:structuredClone(state.students),savedAt:new Date().toISOString()}; state.saved=state.saved.filter(x=>x.id!==snapshot.id); state.saved.push(snapshot); updateAll(); toast('Dolgozat elmentve.');}
function loadSaved(id){const item=state.saved.find(x=>x.id===id); if(!item) return; state={...state,id:item.id,title:item.title,className:item.className,maxPoints:item.maxPoints,scale:structuredClone(item.scale),students:structuredClone(item.students)}; syncInputs(); renderScale(); updateAll(); toast('Dolgozat betöltve.');}
function newWork(){state.id=crypto.randomUUID(); state.title=''; state.className=''; state.maxPoints=100; state.students=[]; syncInputs(); updateAll(); toast('Új dolgozat indítva.');}
function summaryText(){const s=getStats(); return `Dolgozat: ${state.title||'Névtelen dolgozat'}\nOsztály: ${state.className||'-'}\nMax pont: ${state.maxPoints}\nDiákok száma: ${s.count}\nOsztályátlag: ${s.avg.toFixed(1)}%\nSikeresség: ${s.passRate.toFixed(0)}%\nJegyek: 5:${s.gradeCounts[5]}, 4:${s.gradeCounts[4]}, 3:${s.gradeCounts[3]}, 2:${s.gradeCounts[2]}, 1:${s.gradeCounts[1]}\nLegjobb: ${s.best}\nLeggyengébb: ${s.worst}`;}
function exportCsv(){const rows=[['Dolgozat',state.title],['Osztály',state.className],['Max pont',state.maxPoints],[],['Név','Pont','Százalék','Jegy','Értékelés']]; state.students.forEach(s=>{const pct=percent(s.points); rows.push([s.name,s.points,pct.toFixed(1)+'%',gradeFor(pct),verbal(pct)]);}); downloadText(rows.map(r=>r.map(cell=>`"${String(cell).replaceAll('"','""')}"`).join(';')).join('\n'),`${safeFileName(state.title||'tanarseged-dolgozat')}.csv`,'text/csv;charset=utf-8');}
function downloadText(text,filename,type='text/plain;charset=utf-8'){const blob=new Blob(['\ufeff'+text],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href);}
function safeFileName(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||'tanarseged';}
function escapeHtml(str){return String(str).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
async function copyText(text){try{await navigator.clipboard.writeText(text); toast('Vágólapra másolva.');}catch{toast('Nem sikerült másolni.');}}
function val(id,fallback=''){return ($(id)?.value||fallback).trim();}
function normalizeText(text){return String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function generateWorksheet(){
  const subject=val('wsSubject','tantárgy');
  const topic=val('wsTopic','megadott téma');
  const grade=val('wsGrade','osztály');
  const count=clamp(Number($('wsCount').value)||8,3,20);
  const level=$('wsLevel').value;
  const key=$('wsKey').checked;
  const normalizedSubject=normalizeText(subject);
  const normalizedTopic=normalizeText(topic);
  if(normalizedSubject.includes('mate') && (normalizedTopic.includes('tort') || normalizedTopic.includes('fraction'))){
    $('worksheetOutput').textContent=buildFractionWorksheet(subject,topic,grade,level,count,key);
    return;
  }
  if(normalizedSubject.includes('mate')){
    $('worksheetOutput').textContent=buildMathWorksheet(subject,topic,grade,level,count,key);
    return;
  }
  $('worksheetOutput').textContent=buildGeneralWorksheet(subject,topic,grade,level,count,key);
}
function headerBlock(subject,topic,grade,level){
  return `FELADATLAP\nTantárgy: ${subject}\nTéma: ${topic}\nÉvfolyam/osztály: ${grade}\nNehézség: ${level}\n\nNév: ____________________   Dátum: ____________\n\n`;
}
function buildFractionWorksheet(subject,topic,grade,level,count,key){
  const tasks=[
    {q:'Egyszerűsítsd a következő törteket!\n   a) 12/18 = ________\n   b) 24/36 = ________\n   c) 45/60 = ________\n   d) 56/70 = ________',a:'a) 2/3   b) 2/3   c) 3/4   d) 4/5'},
    {q:'Végezd el az összeadásokat és kivonásokat!\n   a) 3/4 + 1/8 = ________\n   b) 5/6 - 1/3 = ________\n   c) 7/10 + 2/5 = ________\n   d) 9/12 - 1/4 = ________',a:'a) 7/8   b) 1/2   c) 11/10 = 1 egész 1/10   d) 1/2'},
    {q:'Végezd el a szorzásokat!\n   a) 2/3 × 5/7 = ________\n   b) 4/9 × 3/8 = ________\n   c) 6/11 × 22/9 = ________',a:'a) 10/21   b) 1/6   c) 4/3 = 1 egész 1/3'},
    {q:'Végezd el az osztásokat!\n   a) 3/5 ÷ 2/7 = ________\n   b) 4/9 ÷ 8/3 = ________\n   c) 5/6 ÷ 10/12 = ________',a:'a) 21/10 = 2 egész 1/10   b) 1/6   c) 1'},
    {q:'Állítsd növekvő sorrendbe a törteket!\n   2/3, 3/4, 5/6, 1/2\n   Válasz: ______________________________________',a:'1/2, 2/3, 3/4, 5/6'},
    {q:'Egy osztály tanulóinak 3/5 része lány. Az osztályban 30 tanuló van. Hány lány van az osztályban?\n   Számítás: ____________________________________\n   Válasz: ______________________________________',a:'30 × 3/5 = 18. Válasz: 18 lány.'},
    {q:'Egy pizzát 8 egyenlő részre vágtak. Péter 3 szeletet, Anna 2 szeletet evett meg.\n   a) A pizza hányad részét ették meg összesen?\n   b) A pizza hányad része maradt meg?',a:'a) 3/8 + 2/8 = 5/8. b) 1 - 5/8 = 3/8 maradt.'},
    {q:'Számold ki, majd egyszerűsítsd az eredményt!\n   2/3 + 5/6 - 1/4 = ________',a:'2/3 + 5/6 - 1/4 = 8/12 + 10/12 - 3/12 = 15/12 = 5/4 = 1 egész 1/4'},
    {q:'Melyik nagyobb? Tedd ki a megfelelő jelet: <, > vagy = !\n   a) 5/8 ___ 3/4\n   b) 7/12 ___ 2/3\n   c) 4/5 ___ 16/20',a:'a) 5/8 < 3/4   b) 7/12 < 2/3   c) 4/5 = 16/20'},
    {q:'Egy 2 méter hosszú szalag 3/4 részét felhasználták. Hány méter szalag maradt?',a:'Felhasznált: 2 × 3/4 = 3/2 = 1,5 m. Maradt: 2 - 1,5 = 0,5 m = 1/2 m.'},
    {q:'Írd át vegyes számmá vagy tört alakba!\n   a) 17/5 = ________\n   b) 3 egész 2/7 = ________\n   c) 29/6 = ________',a:'a) 3 egész 2/5   b) 23/7   c) 4 egész 5/6'},
    {q:'Kihívás: Egy tartály 2/3 részig van vízzel. Ha még 1/6 tartálynyi vizet töltenek bele, a tartály hányad része lesz tele?',a:'2/3 + 1/6 = 4/6 + 1/6 = 5/6. A tartály 5/6 részig lesz tele.'}
  ];
  const selected=tasks.slice(0,count);
  let out=headerBlock(subject,topic,grade,level);
  out+='Instrukció: Minden számolásnál törekedj az egyszerűsítésre. A szöveges feladatoknál írj számítást és választ is.\n\n';
  selected.forEach((t,i)=>{out+=`${i+1}. ${t.q}\n\n`;});
  if(key){out+='MEGOLDÓKULCS / JAVÍTÁSI JAVASLAT\n'; selected.forEach((t,i)=>{out+=`${i+1}. ${t.a}\n`;});}
  return out;
}
function buildMathWorksheet(subject,topic,grade,level,count,key){
  let out=headerBlock(subject,topic,grade,level);
  const tasks=[];
  for(let i=1;i<=count;i++){
    const a=2+i,b=3+i,c=5+i;
    tasks.push({q:`Számold ki és indokold röviden: (${a} × ${b}) + ${c} = ________`,a:`(${a} × ${b}) + ${c} = ${a*b+c}`});
  }
  tasks.forEach((t,i)=>{out+=`${i+1}. ${t.q}\n\n`;});
  if(key){out+='MEGOLDÓKULCS / JAVÍTÁSI JAVASLAT\n';tasks.forEach((t,i)=>out+=`${i+1}. ${t.a}\n`);}
  return out;
}
function buildGeneralWorksheet(subject,topic,grade,level,count,key){
  const types=['Fogalommagyarázat','Igaz/hamis indoklással','Ok-okozat','Példa','Rövid esszé','Összehasonlítás','Forráselemzés','Önálló vélemény'];
  let out=headerBlock(subject,topic,grade,level);
  out+='Instrukció: Válaszaid legyenek konkrétak, példával vagy indoklással alátámasztva.\n\n';
  for(let i=1;i<=count;i++){
    const type=types[(i-1)%types.length];
    out+=`${i}. ${type}: ${questionFor(type,topic,subject,level,i)}\n   Válasz: ____________________________________________________________\n\n`;
  }
  if(key){out+='MEGOLDÓKULCS / JAVÍTÁSI JAVASLAT\n'; for(let i=1;i<=count;i++)out+=`${i}. Teljes pont akkor adható, ha a válasz konkrétan kapcsolódik a(z) „${topic}” témához, tartalmaz legalább egy helyes fogalmat, példát vagy indoklást.\n`;}
  return out;
}
function questionFor(type,topic,subject,level,i){
  if(type==='Igaz/hamis indoklással') return `Döntsd el, igaz vagy hamis az állítás, majd 2 mondatban indokold: „A(z) ${topic} megértéséhez fontos az előzmények ismerete.”`;
  if(type==='Ok-okozat') return `Írj le egy okot és egy következményt a(z) ${topic} témával kapcsolatban.`;
  if(type==='Példa') return `Írj egy konkrét példát a(z) ${topic} témára, és magyarázd el, miért jó példa.`;
  if(type==='Rövid esszé') return `Fogalmazz 5–6 mondatos összefoglalót a(z) ${topic} legfontosabb tudnivalóiról.`;
  if(type==='Összehasonlítás') return `Hasonlíts össze két fogalmat, szereplőt vagy jelenséget a(z) ${topic} témán belül.`;
  if(type==='Forráselemzés') return `Képzeld el, hogy egy rövid forrást olvasol a(z) ${topic} témáról. Milyen 3 információt keresnél benne?`;
  if(type==='Önálló vélemény') return `Írd le a véleményedet a(z) ${topic} egyik kérdéséről, és indokold legalább két érvvel.`;
  return `Magyarázd el saját szavaiddal a(z) ${topic} egyik kulcsfogalmát, és írj hozzá példát.`;
}
function generateLesson(){const subject=val('lessonSubject','tantárgy'); const topic=val('lessonTopic','óra témája'); const minutes=Number($('lessonMinutes').value)||45; const cls=val('lessonClass','osztály'); const goal=val('lessonGoal','a tananyag megértése és gyakorlása'); const intro=Math.max(5,Math.round(minutes*.15)); const main=Math.max(10,Math.round(minutes*.45)); const practice=Math.max(8,Math.round(minutes*.25)); const close=Math.max(4,minutes-intro-main-practice); $('lessonOutput').textContent=`ÓRAVÁZLAT\nTantárgy: ${subject}\nOsztály: ${cls}\nTéma: ${topic}\nIdőtartam: ${minutes} perc\nFő cél: ${goal}\n\n1. Ráhangolódás / ismétlés – ${intro} perc\n- Rövid kérdések az előző anyagból.\n- A mai téma felvezetése hétköznapi példával.\n\n2. Új ismeret feldolgozása – ${main} perc\n- A(z) ${topic} fő fogalmainak tisztázása.\n- Tanári magyarázat példákkal.\n- Közös jegyzet vagy táblavázlat készítése.\n\n3. Gyakorlás / páros vagy csoportmunka – ${practice} perc\n- 3–5 rövid feladat megoldása.\n- Gyengébb tanulóknak segítségkártya, gyorsabbaknak plusz kérdés.\n\n4. Lezárás, ellenőrzés – ${close} perc\n- Kilépőkártya: „Mi volt ma a legfontosabb?”\n- Rövid visszajelzés és következő óra előkészítése.\n\nHázi feladat:\n- 5 mondatos összefoglaló vagy 3 gyakorló feladat a(z) ${topic} témából.\n\nDifferenciálás:\n- Könnyítés: kulcsszavak megadása.\n- Nehezítés: önálló példa vagy magyarázat készítése.`;}
function generateText(){const student=val('txtStudent','A tanuló'); const topic=val('txtTopic','az aktuális tananyag'); const details=val('txtDetails',''); const type=$('txtType').value; const tone=$('txtTone').value; let text=''; if(type==='szulo') text=`Tisztelt Szülő!\n\nSzeretném röviden tájékoztatni ${student} előrehaladásáról a következő témában: ${topic}. ${details||'Az eddigi munka alapján láthatóak erősségek, ugyanakkor néhány területen további gyakorlás javasolt.'}\n\nKérem, lehetőség szerint otthon is segítsék rövid ismétléssel vagy gyakorlással. Bármilyen kérdés esetén szívesen egyeztetek.\n\nÜdvözlettel:`; else if(type==='dicseret') text=`${student} munkáját szeretném külön megdicsérni. A(z) ${topic} témában figyelmesen, aktívan és igényesen dolgozott. ${details||'A hozzáállása példaértékű volt.'}\n\nCsak így tovább!`; else if(type==='figyelmeztetes') text=`${student} esetében a(z) ${topic} kapcsán szeretném jelezni, hogy több odafigyelésre és rendszeresebb munkára van szükség. ${details||'A hiányosságok gyakorlással pótolhatók.'}\n\nKérem, a következő időszakban fordítson nagyobb figyelmet a felkészülésre.`; else text=`${student} a(z) ${topic} témában ${tone} hangvételű értékelés alapján a következő visszajelzést kapja:\n\n${details||'A tanuló munkája értékelhető, az alapok többnyire megvannak, de a pontosabb megfogalmazás és a rendszeres gyakorlás tovább javíthatja az eredményt.'}\n\nJavaslat: rövid, rendszeres ismétlés, a hibák átnézése, majd célzott gyakorlófeladatok megoldása.`; $('textOutput').textContent=text;}
function names(){return $('namesInput').value.split(/\n|,/).map(x=>x.trim()).filter(Boolean);}
function shuffle(arr){return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);}
function pickRandom(){const ns=names(); if(!ns.length){$('toolsOutput').textContent='Adj meg neveket soronként.'; return;} const picked=ns[Math.floor(Math.random()*ns.length)]; $('toolsOutput').textContent=`Véletlen felelő: ${picked}\nFeladat: ${val('classTask','órai feladat')}\n\nJavaslat: rövid, 1-2 perces válasz, utána kiegészítés egy másik tanulótól.`;}
function makeGroups(){const ns=shuffle(names()); const n=clamp(Number($('groupCount').value)||3,2,10); if(!ns.length){$('toolsOutput').textContent='Adj meg neveket soronként.'; return;} const groups=Array.from({length:n},()=>[]); ns.forEach((name,i)=>groups[i%n].push(name)); $('toolsOutput').textContent=groups.map((g,i)=>`${i+1}. csoport: ${g.join(', ')}`).join('\n')+`\n\nFeladat: ${val('classTask','csoportmunka')}`;}
function switchTab(tab){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab)); document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===`tab-${tab}`)); window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab))); document.querySelectorAll('[data-jump]').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.jump))); document.querySelectorAll('[data-copy]').forEach(btn=>btn.addEventListener('click',()=>copyText($(btn.dataset.copy).textContent)));
els.studentForm.addEventListener('submit',e=>{e.preventDefault(); const name=els.studentName.value.trim(); const points=Number(els.studentPoints.value); if(!name||Number.isNaN(points))return; state.students.push({id:crypto.randomUUID(),name,points}); els.studentName.value=''; els.studentPoints.value=''; els.studentName.focus(); updateAll();});
[els.workTitle,els.className,els.maxPoints,els.quickPoints].forEach(el=>el.addEventListener('input',updateAll)); els.saveBtn.addEventListener('click',saveCurrent); els.exportCsvBtn.addEventListener('click',exportCsv); els.copySummaryBtn.addEventListener('click',()=>copyText(summaryText())); els.printBtn.addEventListener('click',()=>window.print()); els.newWorkBtn.addEventListener('click',newWork); els.resetScaleBtn.addEventListener('click',()=>{state.scale=structuredClone(defaultScale); renderScale(); updateAll(); toast('Ponthatárok visszaállítva.');});
$('generateWorksheetBtn').addEventListener('click',generateWorksheet); $('generateLessonBtn').addEventListener('click',generateLesson); $('generateTextBtn').addEventListener('click',generateText); $('pickRandomBtn').addEventListener('click',pickRandom); $('makeGroupsBtn').addEventListener('click',makeGroups);
load(); syncInputs(); renderScale(); updateAll(); if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
