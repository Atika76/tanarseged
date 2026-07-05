const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function T(q,a){return{q,a}}
function header(subject,topic,grade,level){return `FELADATLAP\nTantárgy: ${subject}\nTéma: ${topic}\nÉvfolyam/osztály: ${grade}\nNehézség: ${level}\n\nNév: ____________________   Dátum: ____________\n\n`}

const bank = {
matematika:{
 hint:'Matematika: számolás, műveletek, szöveges feladatok és lépéses megoldások.',
 alap:t=>[
  T('Egyszerűsítsd a törteket!\n   a) 6/8 = ________\n   b) 10/15 = ________\n   c) 12/16 = ________','a) 3/4   b) 2/3   c) 3/4'),
  T('Számold ki!\n   a) 2/7 + 3/7 = ________\n   b) 6/9 - 2/9 = ________','a) 5/7   b) 4/9'),
  T('Tedd ki a megfelelő jelet!\n   a) 1/2 ___ 1/3\n   b) 3/4 ___ 2/4','a) >   b) >'),
  T('Írd át vegyes számmá!\n   a) 7/3 = ________\n   b) 9/4 = ________','a) 2 egész 1/3   b) 2 egész 1/4'),
  T('Egy csokit 8 részre törtek. Anna megevett 3 részt. Mennyi maradt?','5/8 maradt.'),
  T('Állítsd növekvő sorrendbe: 1/4, 3/4, 2/4, 4/4','1/4, 2/4, 3/4, 4/4'),
  T('Számold ki: 1/2 + 1/4 = ________','3/4'),
  T('Egy üveg 1/2 liter vizet tartalmaz. Mennyi víz van 2 ilyen üvegben?','1 liter.')
 ],
 közepes:t=>[
  T('Egyszerűsítsd a törteket!\n   a) 12/18 = ________\n   b) 24/36 = ________\n   c) 45/60 = ________\n   d) 56/70 = ________','a) 2/3   b) 2/3   c) 3/4   d) 4/5'),
  T('Végezd el az összeadásokat és kivonásokat!\n   a) 3/4 + 1/8 = ________\n   b) 5/6 - 1/3 = ________\n   c) 7/10 + 2/5 = ________','a) 7/8   b) 1/2   c) 11/10'),
  T('Végezd el a szorzásokat!\n   a) 2/3 × 5/7 = ________\n   b) 4/9 × 3/8 = ________','a) 10/21   b) 1/6'),
  T('Végezd el az osztásokat!\n   a) 3/5 ÷ 2/7 = ________\n   b) 4/9 ÷ 8/3 = ________','a) 21/10   b) 1/6'),
  T('Állítsd növekvő sorrendbe: 2/3, 3/4, 5/6, 1/2','1/2, 2/3, 3/4, 5/6'),
  T('Egy osztály 3/5 része lány. 30 tanuló van. Hány lány van?','30 × 3/5 = 18 lány.'),
  T('Egy pizzából Péter 3/8, Anna 2/8 részt evett meg. Mennyi maradt?','Megettek 5/8 részt, maradt 3/8.'),
  T('Számold ki: 2/3 + 5/6 - 1/4 = ________','5/4 = 1 egész 1/4')
 ],
 haladó:t=>[
  T('Számold ki: 5/6 + 7/9 - 1/3 = ________','23/18 = 1 egész 5/18'),
  T('Végezd el: (3/4 × 8/9) ÷ 2/3 = ________','1'),
  T('Egy recepthez 3/4 kg liszt kell. A mennyiség 2/3 részét kimérték. Mennyi hiányzik?','Kimértek 1/2 kg-ot, hiányzik 1/4 kg.'),
  T('Állítsd sorrendbe: 2/5, 3/10, 1/4. Indokold közös nevezővel!','1/4, 3/10, 2/5.'),
  T('5/6 - 1/4 + 1/3 = ________','11/12'),
  T('2 egész 1/3 + 1 egész 5/6 - 3/4 = ________','41/12 = 3 egész 5/12'),
  T('Melyik nagyobb: 7/12 + 5/18 vagy 5/6 - 1/9?','31/36 > 26/36, tehát az első.'),
  T('Egy téglalap oldalai 3/4 m és 5/6 m. Mennyi a kerülete?','19/6 m = 3 egész 1/6 m.')
 ]
},
történelem:{
 hint:'Történelem: évszám, fogalom, ok-okozat, forráselemzés, rövid esszé.',
 alap:t=>[
  T(`Melyik korszakhoz vagy évszázadhoz kapcsolódik a(z) ${t}?`,`Jó válasz: a témához illő korszak vagy évszázad.`),
  T(`Magyarázd meg röviden a(z) ${t} jelentését!`,`Jó válasz: pontos történelmi magyarázat.`),
  T(`Írj két szereplőt, népet vagy csoportot a(z) ${t} témához!`,`Jó válasz: két releváns szereplő vagy csoport.`),
  T(`Írj egy fontos helyszínt a(z) ${t} témához!`,`Jó válasz: témához illő földrajzi hely.`),
  T(`Írj egy okot, ami miatt a(z) ${t} fontos volt!`,`Jó válasz: konkrét történelmi ok.`),
  T(`Írj egy következményt a(z) ${t} témával kapcsolatban!`,`Jó válasz: konkrét történelmi következmény.`),
  T(`Igaz vagy hamis? A történelmi eseményeknek általában vannak előzményei. Indokold a(z) ${t} alapján!`,`Igaz. A jó válasz konkrét előzményt nevez meg.`),
  T(`Fogalmazz meg egy kérdést, amit egy korabeli embernek tennél fel a(z) ${t} témáról!`,`Jó válasz: témához illő, értelmes kérdés.`)
 ],
 közepes:t=>[
  T(`Mutasd be 4-5 mondatban a(z) ${t} legfontosabb eseményeit!`,`Jó válasz: időrend, szereplők, ok és következmény.`),
  T(`Készíts ok-okozati láncot: előzmény → esemény → következmény a(z) ${t} témában!`,`Jó válasz: logikus történelmi kapcsolat.`),
  T(`Magyarázz meg 3 fogalmat, amelyek kapcsolódnak a(z) ${t} témához!`,`Jó válasz: három pontos fogalommeghatározás.`),
  T(`Miért lehetett fordulópont a(z) ${t}? Írj két érvet!`,`Jó válasz: két történelmi szempont.`),
  T(`Hasonlítsd össze a(z) ${t} előtti és utáni állapotot!`,`Jó válasz: legalább két változás.`),
  T(`Milyen forrásokból lehetne megismerni a(z) ${t} történetét?`,`Jó válasz: krónika, régészet, oklevél, térkép stb.`),
  T(`Írj 5 igaz-hamis állítást a(z) ${t} témához!`,`Jó válasz: ellenőrizhető állítások.`),
  T(`Készíts rövid vázlatot egy felelethez a(z) ${t} témából!`,`Jó válasz: bevezetés, fő pontok, lezárás.`)
 ],
 haladó:t=>[
  T(`Írj 8-10 mondatos esszévázlatot: miért volt jelentős a(z) ${t}?`,`Jó válasz: okok, események, következmények.`),
  T(`Elemezd a(z) ${t} hosszú távú következményeit politikai és társadalmi szempontból!`,`Jó válasz: két külön szempont.`),
  T(`Fogalmazz meg két eltérő történelmi nézőpontot a(z) ${t} megítéléséről!`,`Jó válasz: több nézőpont felismerése.`),
  T(`Készíts vitakérdést a(z) ${t} témából, majd írj mellette és ellene érveket!`,`Jó válasz: érvek és ellenérvek.`),
  T(`Elemezz egy képzeletbeli korabeli forrást: milyen torzításai lehetnek?`,`Jó válasz: szerző érdeke, célja, nézőpontja.`),
  T(`Kapcsold össze a(z) ${t} témát egy másik történelmi folyamattal!`,`Jó válasz: értelmes történelmi kapcsolat.`),
  T(`Írj érettségi jellegű kérdést és válaszvázlatot a(z) ${t} témáról!`,`Jó válasz: komplex kérdés és logikus vázlat.`),
  T(`Értékeld a(z) ${t} jelentőségét a későbbi magyar vagy európai történelemben!`,`Jó válasz: hosszabb távú jelentőség.`)
 ]
}
};

function subjectPack(subject){
 if(bank[subject]) return bank[subject];
 const packs = {
  fizika:'Fizika: fogalom, képlet, mértékegység, számítás, jelenségmagyarázat.',
  kémia:'Kémia: anyagok, részecskék, reakciók, képletek, egyenletek.',
  biológia:'Biológia: felépítés, működés, folyamat, alkalmazkodás, egészség.',
  földrajz:'Földrajz: térkép, folyamat, ok-okozat, országok, természet- és társadalomföldrajz.',
  angol:'Angol: szókincs, nyelvtan, fordítás, mondatalkotás, rövid szöveg.',
  irodalom:'Irodalom: műelemzés, szereplők, téma, motívum, idézetértelmezés.',
  nyelvtan:'Nyelvtan: fogalom, mondat, szófaj, helyesírás, elemzés.',
  informatika:'Informatika: algoritmus, adat, táblázat, biztonság, programozási logika.'
 };
 return {
  hint:packs[subject]||'Általános tantárgyi feladatok.',
  alap:t=>[
   T(`Magyarázd meg röviden a(z) ${t} egyik alapfogalmát!`,'Jó válasz: pontos, rövid fogalommeghatározás.'),
   T(`Írj két példát a(z) ${t} témához!`,'Jó válasz: két témához illő példa.'),
   T(`Döntsd el, igaz vagy hamis egy témához kapcsolódó állítás, majd indokold!`,'Jó válasz: állítás + indoklás.'),
   T(`Készíts rövid vázlatot a(z) ${t} témához!`,'Jó válasz: 3-4 lényeges pont.'),
   T(`Írj egy hétköznapi példát a(z) ${t} alkalmazására!`,'Jó válasz: valós életből vett példa.'),
   T(`Fogalmazz meg egy kérdést a(z) ${t} témából!`,'Jó válasz: értelmes, ellenőrizhető kérdés.'),
   T(`Sorolj fel három kulcsszót a(z) ${t} témához!`,'Jó válasz: 3 releváns kulcsszó.'),
   T(`Írd le egy mondatban, miért fontos a(z) ${t}!`,'Jó válasz: lényegre törő indoklás.')
  ],
  közepes:t=>[
   T(`Mutasd be a(z) ${t} témát 5-6 mondatban!`,'Jó válasz: összefüggő, konkrét magyarázat.'),
   T(`Készíts ok-okozati magyarázatot a(z) ${t} egyik részéhez!`,'Jó válasz: ok, folyamat, következmény.'),
   T(`Hasonlíts össze két fogalmat vagy jelenséget a(z) ${t} témában!`,'Jó válasz: hasonlóságok és különbségek.'),
   T(`Készíts táblázatot: fogalom / jelentés / példa.`,'Jó válasz: rendezett táblázat.'),
   T(`Írj egy gyakorlófeladatot és oldd meg a(z) ${t} témában!`,'Jó válasz: témához illő feladat és megoldás.'),
   T(`Magyarázd el, milyen hibát követhet el egy diák ennél a témánál!`,'Jó válasz: tipikus hiba és javítás.'),
   T(`Írj 3 ellenőrző kérdést a(z) ${t} témából!`,'Jó válasz: érdemi kérdések.'),
   T(`Fogalmazz meg rövid összefoglalót a(z) ${t} témáról!`,'Jó válasz: lényegkiemelés.')
  ],
  haladó:t=>[
   T(`Írj részletes elemző választ a(z) ${t} témáról!`,'Jó válasz: több szempontú, indokolt válasz.'),
   T(`Készíts érvelő feladatot a(z) ${t} mellett és ellen!`,'Jó válasz: érvek és ellenérvek.'),
   T(`Kapcsold össze a(z) ${t} témát egy másik tananyaggal!`,'Jó válasz: értelmes kapcsolat.'),
   T(`Készíts komplex problémamegoldó feladatot a(z) ${t} témából!`,'Jó válasz: több lépéses megoldás.'),
   T(`Értelmezz egy képzeletbeli forrást, adatot vagy példát a(z) ${t} alapján!`,'Jó válasz: adatokból következtetés.'),
   T(`Írj esszévázlatot a(z) ${t} témából!`,'Jó válasz: logikus vázlat.'),
   T(`Fogalmazz meg kritikai kérdést a(z) ${t} témában!`,'Jó válasz: gondolkodtató, nem sablonos kérdés.'),
   T(`Készíts haladó szintű javítási szempontsort a(z) ${t} feladathoz!`,'Jó válasz: pontozható szempontok.')
  ]
 };
}

function generateWorksheet(){
 const subject=$('wsSubject').value;
 const topic=$('wsTopic').value.trim() || 'megadott téma';
 const grade=$('wsGrade').value.trim() || 'osztály';
 const level=$('wsLevel').value;
 const count=clamp(Number($('wsCount').value)||8,3,10);
 const showKey=$('wsKey').checked;
 const pack=subjectPack(subject);
 const tasks=pack[level](topic).slice(0,count);
 let out=header(subject,topic,grade,level);
 out += subject==='angol'
  ? 'Instrukció: Ahol a feladat kéri, angolul válaszolj. Figyelj a helyes nyelvtanra és szókincsre.\\n\\n'
  : 'Instrukció: Válaszaid legyenek konkrétak. Számolásnál írd le a lépéseket, szöveges feladatnál indokolj.\\n\\n';
 tasks.forEach((t,i)=>out += `${i+1}. ${t.q}\\n   Válasz: ____________________________________________________________\\n\\n`);
 if(showKey){
   out += 'MEGOLDÓKULCS / JAVÍTÁSI JAVASLAT\\n';
   tasks.forEach((t,i)=>out += `${i+1}. ${t.a}\\n`);
 }
 $('worksheetOutput').textContent=out;
 $('subjectHint').textContent=pack.hint;
 const msg={alap:'Alap szint: könnyebb, rávezető kérdések.',közepes:'Közepes szint: vegyes feladatok és magyarázat.',haladó:'Haladó szint: összetettebb, elemző és gondolkodtató feladatok.'}[level];
 $('levelExplain').textContent=msg;
 updateHeroForWorksheet(subject, level, count, showKey);
 toast(`${subject} • ${level} frissítve`);
}

function updateHeroForWorksheet(subject, level, count, showKey){
 $('heroMain').textContent = subject.charAt(0).toUpperCase()+subject.slice(1);
 $('heroSub').textContent = level.charAt(0).toUpperCase()+level.slice(1)+' feladatlap';
 $('heroSmall').textContent = `${count} kérdés • megoldókulcs: ${showKey?'bekapcsolva':'kikapcsolva'}`;
}

function updateHeroForGrades(){
 $('heroMain').textContent = '0.0%';
 $('heroSub').textContent = 'aktuális osztályátlag';
 $('heroSmall').textContent = '0 diák a listában';
}

async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Vágólapra másolva.')}catch{toast('Nem sikerült másolni.')}}

document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===b.dataset.tab));
 document.querySelectorAll('.tab-panel').forEach(x=>x.classList.toggle('active',x.id==='tab-'+b.dataset.tab));
 if(b.dataset.tab==='grades') updateHeroForGrades();
 if(b.dataset.tab==='worksheet') generateWorksheet();
});
document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copyText($(b.dataset.copy).textContent));
['wsSubject','wsTopic','wsGrade','wsCount','wsLevel','wsKey'].forEach(id=>$(id).addEventListener('change',generateWorksheet));

$('wsSubject').addEventListener('change',()=>{
 const subject=$('wsSubject').value;
 const defaultTopics={matematika:'törtek',történelem:'honfoglalás',fizika:'energia',kémia:'kémiai reakciók',biológia:'sejtek',földrajz:'éghajlat',angol:'daily routine',irodalom:'János vitéz',nyelvtan:'szófajok',informatika:'algoritmusok'};
 $('wsTopic').value=defaultTopics[subject]||'téma';
 generateWorksheet();
});
$('generateWorksheetBtn').onclick=generateWorksheet;

$('calcGrade').onclick=()=>{
 const max=Number($('maxPoint').value)||1,got=Number($('gotPoint').value)||0,p=got/max*100;
 let g=p>=85?5:p>=70?4:p>=55?3:p>=40?2:1;
 $('gradeResult').textContent=`${p.toFixed(1)}% • Jegy: ${g}`;
 $('heroMain').textContent=p.toFixed(1)+'%';
 $('heroSub').textContent='gyors számolás eredménye';
 $('heroSmall').textContent=`${got} / ${max} pont • jegy: ${g}`;
};

$('generateLessonBtn').onclick=()=>{
 const s=$('lessonSubject').value||'tantárgy',t=$('lessonTopic').value||'óra témája',m=Number($('lessonMinutes').value)||45;
 $('lessonOutput').textContent=`ÓRAVÁZLAT\\nTantárgy: ${s}\\nTéma: ${t}\\nIdőtartam: ${m} perc\\n\\n1. Ráhangolódás – 5 perc\\n2. Új anyag / közös példa – 15 perc\\n3. Önálló vagy páros gyakorlás – 20 perc\\n4. Ellenőrzés, lezárás – 5 perc\\n\\nHázi feladat: 3 gyakorlófeladat a(z) ${t} témából.`;
};

$('generateTextBtn').onclick=()=>{
 const n=$('txtStudent').value||'A tanuló',t=$('txtTopic').value||'az aktuális téma',d=$('txtDetails').value||'Az alapok megvannak, de rendszeres gyakorlással tovább javítható az eredmény.';
 $('textOutput').textContent=`${n} a(z) ${t} témában a következő visszajelzést kapja:\\n\\n${d}\\n\\nJavaslat: rövid, rendszeres ismétlés és célzott gyakorlófeladatok.`;
};

function names(){return $('namesInput').value.split(/\\n|,/).map(x=>x.trim()).filter(Boolean)}
$('pickRandomBtn').onclick=()=>{
 const n=names();
 $('toolsOutput').textContent=n.length?`Véletlen felelő: ${n[Math.floor(Math.random()*n.length)]}`:'Adj meg neveket.';
};
$('makeGroupsBtn').onclick=()=>{
 const n=names().sort(()=>Math.random()-.5),c=clamp(Number($('groupCount').value)||3,2,10),g=Array.from({length:c},()=>[]);
 n.forEach((x,i)=>g[i%c].push(x));
 $('toolsOutput').textContent=g.map((a,i)=>`${i+1}. csoport: ${a.join(', ')}`).join('\\n');
};

generateWorksheet();
