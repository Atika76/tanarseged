const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function norm(t){return String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function T(q,a){return{q,a}}
function header(subject,topic,grade,level){return `FELADATLAP\nTantárgy: ${subject}\nTéma: ${topic}\nÉvfolyam/osztály: ${grade}\nNehézség: ${level}\n\nNév: ____________________   Dátum: ____________\n\n`}

const bank = {
 matematika:{
  hint:'Matematika: számolás, műveletek, szöveges feladatok és lépéses megoldások.',
  alap:t=>[
   T(`Egyszerűsítsd a törteket!\n   a) 6/8 = ________\n   b) 10/15 = ________\n   c) 12/16 = ________`,'a) 3/4   b) 2/3   c) 3/4'),
   T(`Számold ki!\n   a) 2/7 + 3/7 = ________\n   b) 6/9 - 2/9 = ________`,'a) 5/7   b) 4/9'),
   T(`Tedd ki a megfelelő jelet!\n   a) 1/2 ___ 1/3\n   b) 3/4 ___ 2/4`,'a) >   b) >'),
   T(`Írd át vegyes számmá!\n   a) 7/3 = ________\n   b) 9/4 = ________`,'a) 2 egész 1/3   b) 2 egész 1/4'),
   T(`Egy csokit 8 részre törtek. Anna megevett 3 részt. Mennyi maradt?`,'5/8 maradt.'),
   T(`Állítsd növekvő sorrendbe: 1/4, 3/4, 2/4, 4/4`,'1/4, 2/4, 3/4, 4/4'),
   T(`Számold ki: 1/2 + 1/4 = ________`,'3/4'),
   T(`Egy üveg 1/2 liter vizet tartalmaz. Mennyi víz van 2 ilyen üvegben?`,'1 liter.')
  ],
  közepes:t=>[
   T(`Egyszerűsítsd a törteket!\n   a) 12/18 = ________\n   b) 24/36 = ________\n   c) 45/60 = ________\n   d) 56/70 = ________`,'a) 2/3   b) 2/3   c) 3/4   d) 4/5'),
   T(`Végezd el az összeadásokat és kivonásokat!\n   a) 3/4 + 1/8 = ________\n   b) 5/6 - 1/3 = ________\n   c) 7/10 + 2/5 = ________`,'a) 7/8   b) 1/2   c) 11/10'),
   T(`Végezd el a szorzásokat!\n   a) 2/3 × 5/7 = ________\n   b) 4/9 × 3/8 = ________`,'a) 10/21   b) 1/6'),
   T(`Végezd el az osztásokat!\n   a) 3/5 ÷ 2/7 = ________\n   b) 4/9 ÷ 8/3 = ________`,'a) 21/10   b) 1/6'),
   T(`Állítsd növekvő sorrendbe: 2/3, 3/4, 5/6, 1/2`,'1/2, 2/3, 3/4, 5/6'),
   T(`Egy osztály 3/5 része lány. 30 tanuló van. Hány lány van?`,'30 × 3/5 = 18 lány.'),
   T(`Egy pizzából Péter 3/8, Anna 2/8 részt evett meg. Mennyi maradt?`,'Megettek 5/8 részt, maradt 3/8.'),
   T(`Számold ki: 2/3 + 5/6 - 1/4 = ________`,'5/4 = 1 egész 1/4')
  ],
  haladó:t=>[
   T(`Számold ki: 5/6 + 7/9 - 1/3 = ________`,'23/18 = 1 egész 5/18'),
   T(`Végezd el: (3/4 × 8/9) ÷ 2/3 = ________`,'1'),
   T(`Egy recepthez 3/4 kg liszt kell. A mennyiség 2/3 részét kimérték. Mennyi hiányzik?`,'Kimértek 1/2 kg-ot, hiányzik 1/4 kg.'),
   T(`Állítsd sorrendbe: 2/5, 3/10, 1/4. Indokold közös nevezővel!`,'1/4, 3/10, 2/5.'),
   T(`5/6 - 1/4 + 1/3 = ________`,'11/12'),
   T(`2 egész 1/3 + 1 egész 5/6 - 3/4 = ________`,'41/12 = 3 egész 5/12'),
   T(`Melyik nagyobb: 7/12 + 5/18 vagy 5/6 - 1/9?`,'31/36 > 26/36, tehát az első.'),
   T(`Egy téglalap oldalai 3/4 m és 5/6 m. Mennyi a kerülete?`,'19/6 m = 3 egész 1/6 m.')
  ]
 },
 történelem:{
  hint:'Történelem: évszám, fogalom, ok-okozat, igaz-hamis, rövid esszé.',
  alap:t=>[
   T(`Melyik évszázadhoz kapcsolódik a(z) ${t} témája? Írd le röviden!`,'Jó válasz: a témához illő évszázad vagy korszak megnevezése.'),
   T(`Magyarázd meg röviden ezt a fogalmat: ${t}.`,'Jó válasz: pontos, történelmi jelentésű magyarázat.'),
   T(`Írj két fontos szereplőt vagy csoportot a(z) ${t} témához!`,'Jó válasz: két releváns személy, nép, társadalmi csoport vagy hatalom.'),
   T(`Igaz vagy hamis? A(z) ${t} eseményeinek voltak előzményei. Indokold!`,'Igaz. A legtöbb történelmi eseményt gazdasági, politikai vagy társadalmi előzmények készítik elő.'),
   T(`Írj egy fontos helyszínt, amely kapcsolódik a(z) ${t} témához!`,'Jó válasz: témához illő földrajzi hely megnevezése.'),
   T(`Írj egy okot, ami miatt a(z) ${t} fontos lehetett!`,'Jó válasz: konkrét történelmi ok.'),
   T(`Írj egy következményt a(z) ${t} témával kapcsolatban!`,'Jó válasz: konkrét történelmi következmény.'),
   T(`Fogalmazz meg egy kérdést, amelyet feltennél a(z) ${t} témáról!`,'Jó válasz: értelmes, témához kapcsolódó kérdés.')
  ],
  közepes:t=>[
   T(`Mutasd be 4-5 mondatban a(z) ${t} legfontosabb eseményeit!`,'Jó válasz: időrend, szereplők, ok és következmény is szerepel.'),
   T(`Készíts ok-okozati láncot a(z) ${t} témához: előzmény → esemény → következmény.`,'Jó válasz: logikus történelmi kapcsolat.'),
   T(`Magyarázd meg 3 fogalom jelentését, amelyek kapcsolódnak a(z) ${t} témához!`,'Jó válasz: három pontos fogalommeghatározás.'),
   T(`Igaz vagy hamis? A történelmi források segítenek ellenőrizni a(z) ${t} eseményeit. Indokold!`,'Igaz. A források bizonyítékot adhatnak és több nézőpontot mutathatnak.'),
   T(`Helyezd időrendbe a(z) ${t} témához kapcsolódó három eseményt!`,'Jó válasz: helyes időrend vagy logikai sorrend.'),
   T(`Miért lehetett fordulópont a(z) ${t}? Írj legalább két érvet!`,'Jó válasz: két történelmi szempont vagy következmény.'),
   T(`Írj rövid forráselemzést: milyen kérdéseket tennél fel egy korabeli forrásnak a(z) ${t} témáról?`,'Jó válasz: ki készítette, mikor, miért, kinek, mennyire megbízható.'),
   T(`Hasonlítsd össze a(z) ${t} előtti és utáni állapotot!`,'Jó válasz: legalább két változás megnevezése.')
  ],
  haladó:t=>[
   T(`Írj 8-10 mondatos rövid esszét: miért volt jelentős a(z) ${t}?`,'Jó válasz: bevezetés, okok, események, következmények, záró megállapítás.'),
   T(`Elemezd a(z) ${t} hosszú távú következményeit politikai és társadalmi szempontból!`,'Jó válasz: külön politikai és társadalmi következmények.'),
   T(`Fogalmazz meg két különböző történészi nézőpontot a(z) ${t} megítéléséről!`,'Jó válasz: több nézőpont felismerése, nem egyoldalú válasz.'),
   T(`Készíts vitakérdést: a(z) ${t} inkább kényszer vagy tudatos döntés eredménye volt? Érvelj!`,'Jó válasz: érvek és ellenérvek.'),
   T(`Elemezz egy képzeletbeli forrást: milyen torzításai lehetnek egy korabeli beszámolónak a(z) ${t} témáról?`,'Jó válasz: szerző érdeke, nézőpontja, célközönsége, kora.'),
   T(`Kapcsold össze a(z) ${t} témát egy másik történelmi folyamattal!`,'Jó válasz: értelmes kapcsolat két korszak vagy folyamat között.'),
   T(`Írj három esszévázlat-pontot a(z) ${t} témához!`,'Jó válasz: okok, események, következmények vagy szereplők.'),
   T(`Fogalmazz meg egy komplex érettségi jellegű kérdést és válaszvázlatot a(z) ${t} témáról!`,'Jó válasz: összetett kérdés és vázlatos, logikus válasz.')
  ]
 },
 fizika:{
  hint:'Fizika: fogalom, képlet, mértékegység, számítás, jelenségmagyarázat.',
  alap:t=>[
   T(`Magyarázd meg röviden a(z) ${t} fogalmát!`,'Jó válasz: egyszerű, pontos fizikai meghatározás.'),
   T(`Írj egy hétköznapi példát a(z) ${t} jelenségére!`,'Jó válasz: valós, megfigyelhető példa.'),
   T(`Milyen mértékegységek kapcsolódhatnak a(z) ${t} témához?`,'Jó válasz: témához illő SI-mértékegységek.'),
   T(`Igaz vagy hamis? Fizikában a mérés pontossága fontos. Indokold!`,'Igaz, mert a mérési hiba befolyásolja a következtetést.'),
   T(`Rajzolj egyszerű vázlatot egy ${t} jelenségről, és jelöld a fontos mennyiségeket!`,'Jó válasz: jelölések és alapmennyiségek szerepelnek.'),
   T(`Írj egy megfigyelést a(z) ${t} témával kapcsolatban!`,'Jó válasz: konkrét tapasztalat vagy kísérleti megfigyelés.'),
   T(`Nevezz meg két mennyiséget, amely fontos a(z) ${t} vizsgálatánál!`,'Jó válasz: témához illő fizikai mennyiségek.'),
   T(`Írj egy egyszerű kérdést, amit kísérlettel ellenőriznél!`,'Jó válasz: mérhető, vizsgálható kérdés.')
  ],
  közepes:t=>[
   T(`Írd fel a(z) ${t} témához kapcsolódó egyik fontos képletet, és magyarázd el a jeleket!`,'Jó válasz: helyes képlet, mennyiségek és mértékegységek.'),
   T(`Oldj meg egy egyszerű számításos feladatot a(z) ${t} témában! Add meg az adatokat, képletet, behelyettesítést és választ.`,'Jó válasz: adat-képlet-számítás-válasz felépítés.'),
   T(`Magyarázd el ok-okozati módon, mi történik a(z) ${t} jelenség során!`,'Jó válasz: fizikai ok és következmény.'),
   T(`Milyen hibaforrások lehetnek egy ${t} témájú mérésnél?`,'Jó válasz: eszközpontosság, leolvasási hiba, környezeti hatás.'),
   T(`Készíts táblázatot két mennyiséggel a(z) ${t} vizsgálatához!`,'Jó válasz: mérhető adatok rendezett táblázata.'),
   T(`Hasonlíts össze két fizikai helyzetet a(z) ${t} témában!`,'Jó válasz: hasonlóságok és különbségek.'),
   T(`Döntsd el, melyik állítás helyesebb, és indokold fizikai törvénnyel!`,'Jó válasz: törvényre vagy képletre hivatkozik.'),
   T(`Írj egy kísérlettervet a(z) ${t} bemutatására!`,'Jó válasz: eszközök, lépések, várható eredmény.')
  ],
  haladó:t=>[
   T(`Vezess le egy összefüggést a(z) ${t} témában, és magyarázd el minden lépését!`,'Jó válasz: logikus levezetés és egységellenőrzés.'),
   T(`Elemezz egy összetett számításos feladatot a(z) ${t} témában!`,'Jó válasz: több lépés, helyes képletválasztás, indoklás.'),
   T(`Vizsgáld meg, hogyan változik az eredmény, ha az egyik adat kétszeresére nő!`,'Jó válasz: arányosság felismerése.'),
   T(`Készíts grafikonértelmezési feladatot a(z) ${t} témához!`,'Jó válasz: tengelyek, meredekség, következtetés.'),
   T(`Magyarázz meg egy látszólag ellentmondásos jelenséget a(z) ${t} témából!`,'Jó válasz: fizikai törvényekkel magyaráz.'),
   T(`Tervezd meg egy mérés kiértékelését hibaszámítással együtt!`,'Jó válasz: átlag, hiba, következtetés.'),
   T(`Kapcsold össze a(z) ${t} témát energia-megmaradással vagy erőhatással!`,'Jó válasz: kapcsolódó törvény helyes alkalmazása.'),
   T(`Írj emelt szintű gondolkodtató kérdést és válaszvázlatot a(z) ${t} témában!`,'Jó válasz: komplex, de megoldható kérdés.')
  ]
 },
 kémia:{
  hint:'Kémia: anyagok, részecskék, reakciók, képletek, egyenletek.',
  alap:t=>[
   T(`Magyarázd meg röviden a(z) ${t} fogalmát kémiai szempontból!`,'Jó válasz: pontos alapfogalom.'),
   T(`Írj két példát anyagokra, amelyek kapcsolódnak a(z) ${t} témához!`,'Jó válasz: két releváns anyag.'),
   T(`Milyen részecskék vagy részecskemodellek kapcsolódnak a(z) ${t} témához?`,'Jó válasz: atom, molekula, ion vagy elektron szerepe.'),
   T(`Igaz vagy hamis? A kémiai reakciók során új anyag keletkezhet. Indokold!`,'Igaz. A részecskék átrendeződnek, új anyag jön létre.'),
   T(`Írj egy hétköznapi példát a(z) ${t} témára!`,'Jó válasz: valós kémiai példa.'),
   T(`Nevezz meg egy tulajdonságot, amely alapján egy anyag felismerhető!`,'Jó válasz: szín, szag, oldhatóság, halmazállapot, reakciókészség.'),
   T(`Mit jelent a vegyjel vagy képlet? Magyarázd példával!`,'Jó válasz: elem vagy vegyület jelölése.'),
   T(`Írj egy biztonsági szabályt kémiai kísérlethez!`,'Jó válasz: védőszemüveg, nem kóstolunk, óvatos melegítés stb.')
  ],
  közepes:t=>[
   T(`Írj egy lehetséges reakcióegyenletet vagy képletes példát a(z) ${t} témához!`,'Jó válasz: kémiailag értelmezhető képlet vagy reakció.'),
   T(`Magyarázd el, mi történik részecskeszinten a(z) ${t} során!`,'Jó válasz: részecskék mozgása, átrendeződése vagy kötései.'),
   T(`Hasonlíts össze két anyagot a(z) ${t} témában tulajdonságaik alapján!`,'Jó válasz: legalább két kémiai/fizikai tulajdonság.'),
   T(`Döntsd el, fizikai vagy kémiai változásról van-e szó egy témához illő példában! Indokold!`,'Jó válasz: új anyag keletkezik-e.'),
   T(`Készíts táblázatot: anyag, képlet, tulajdonság, felhasználás.`,'Jó válasz: rendezett, helyes adatok.'),
   T(`Magyarázd el a(z) ${t} környezeti vagy egészségügyi jelentőségét!`,'Jó válasz: konkrét hatás vagy veszély.'),
   T(`Írj megfigyelést és következtetést egy ${t} témájú kísérlethez!`,'Jó válasz: megfigyelésből helyes következtetés.'),
   T(`Miért kell kiegyenlíteni a reakcióegyenleteket?`,'Jó válasz: atommegmaradás törvénye miatt.')
  ],
  haladó:t=>[
   T(`Egyensúlyozz ki egy témához illő reakcióegyenletet, és magyarázd el a lépéseket!`,'Jó válasz: atomok száma mindkét oldalon egyezik.'),
   T(`Elemezz egy redox-, sav-bázis- vagy csapadékképződési folyamatot a(z) ${t} témában!`,'Jó válasz: folyamat típusa és résztvevők szerepe.'),
   T(`Számolj anyagmennyiséget vagy tömeget egy egyszerű reakció alapján!`,'Jó válasz: moláris tömeg, anyagmennyiség, arányok.'),
   T(`Magyarázd el, hogyan befolyásolja a hőmérséklet vagy koncentráció a reakciósebességet!`,'Jó válasz: ütközési gyakoriság és energia.'),
   T(`Készíts kísérlettervet kontrollváltozókkal a(z) ${t} vizsgálatára!`,'Jó válasz: független, függő és állandó változók.'),
   T(`Kapcsold össze a(z) ${t} témát ipari vagy környezeti problémával!`,'Jó válasz: konkrét alkalmazás vagy probléma.'),
   T(`Magyarázd meg a kötések szerepét a(z) ${t} anyagainak tulajdonságaiban!`,'Jó válasz: ionos, kovalens vagy fémes kötés szerepe.'),
   T(`Írj emelt szintű válaszvázlatot a(z) ${t} témához!`,'Jó válasz: fogalom, példa, folyamat, következmény.')
  ]
 },
 biológia:{
  hint:'Biológia: felépítés, működés, folyamat, alkalmazkodás, egészség.',
  alap:t=>[
   T(`Magyarázd meg röviden a(z) ${t} biológiai jelentését!`,'Jó válasz: pontos, életjelenséghez kapcsolódó magyarázat.'),
   T(`Nevezz meg két részt vagy szervet, amely kapcsolódik a(z) ${t} témához!`,'Jó válasz: két releváns biológiai elem.'),
   T(`Írj egy példát élőlényre vagy életfolyamatra a(z) ${t} témához!`,'Jó válasz: konkrét biológiai példa.'),
   T(`Igaz vagy hamis? Az élőlények működése összefügg a környezetükkel. Indokold!`,'Igaz. A környezet hat a felépítésre és működésre.'),
   T(`Rajzolj egyszerű vázlatot a(z) ${t} témához, és jelöld a részeket!`,'Jó válasz: alapvető részek jelölése.'),
   T(`Írj egy egészségügyi tanácsot, amely kapcsolódhat a(z) ${t} témához!`,'Jó válasz: biológiailag indokolható tanács.'),
   T(`Mi a különbség az élő és élettelen között? Kapcsold a témához!`,'Jó válasz: életjelenségek felsorolása.'),
   T(`Írj egy megfigyelést a(z) ${t} témában!`,'Jó válasz: megfigyelhető jelenség.')
  ],
  közepes:t=>[
   T(`Mutasd be a(z) ${t} folyamatát lépésekben!`,'Jó válasz: logikus sorrend és szakkifejezések.'),
   T(`Magyarázd el, hogyan függ össze a felépítés és a működés a(z) ${t} témában!`,'Jó válasz: forma-funkció kapcsolat.'),
   T(`Hasonlíts össze két élőlényt, szervet vagy folyamatot a(z) ${t} témában!`,'Jó válasz: hasonlóságok és különbségek.'),
   T(`Készíts táblázatot: rész / feladat / jelentőség.`,'Jó válasz: pontos, rendezett összefoglalás.'),
   T(`Mi történne, ha a(z) ${t} egyik fontos része nem működne megfelelően?`,'Jó válasz: következmény biológiai magyarázattal.'),
   T(`Írj ok-okozati magyarázatot a(z) ${t} egyik jelenségére!`,'Jó válasz: ok, folyamat, következmény.'),
   T(`Kapcsold össze a(z) ${t} témát az egészséges életmóddal vagy környezetvédelemmel!`,'Jó válasz: konkrét kapcsolat.'),
   T(`Készíts 5 kérdéses rövid ismétlőt a(z) ${t} témához!`,'Jó válasz: lényeges kérdések.')
  ],
  haladó:t=>[
   T(`Elemezd a(z) ${t} szabályozását vagy visszacsatolását!`,'Jó válasz: szabályozási pontok és következmények.'),
   T(`Magyarázd el a(z) ${t} evolúciós vagy alkalmazkodási jelentőségét!`,'Jó válasz: túlélési/szaporodási előny.'),
   T(`Értelmezz egy képzeletbeli diagramot a(z) ${t} változásáról! Milyen következtetést vonnál le?`,'Jó válasz: adatokból következtetés.'),
   T(`Hasonlítsd össze a sejtszintű és szervezetszintű folyamatot a(z) ${t} témában!`,'Jó válasz: két szint összekapcsolása.'),
   T(`Írj hipotézist és kísérleti tervet a(z) ${t} vizsgálatára!`,'Jó válasz: hipotézis, változók, mérés.'),
   T(`Mutasd be a(z) ${t} szerepét egy ökológiai rendszerben!`,'Jó válasz: kapcsolatok, energiaáramlás vagy anyagkörforgás.'),
   T(`Érvelj egy biológiai/egészségügyi döntés mellett a(z) ${t} alapján!`,'Jó válasz: tudományos indoklás.'),
   T(`Írj emelt szintű esszévázlatot a(z) ${t} témáról!`,'Jó válasz: fogalmak, folyamat, példa, következtetés.')
  ]
 },
 földrajz:{
  hint:'Földrajz: térkép, folyamat, ok-okozat, országok, természet- és társadalomföldrajz.',
  alap:t=>[
   T(`Magyarázd meg röviden a(z) ${t} földrajzi jelentését!`,'Jó válasz: pontos földrajzi fogalom.'),
   T(`Nevezz meg két helyet, területet vagy országot, amely kapcsolódhat a(z) ${t} témához!`,'Jó válasz: két releváns földrajzi név.'),
   T(`Írj egy térképes feladatot a(z) ${t} témához!`,'Jó válasz: helymegkeresés vagy jelölés.'),
   T(`Igaz vagy hamis? A természeti adottságok hatnak az emberek életére. Indokold!`,'Igaz. Éghajlat, domborzat, vízrajz befolyásolhatja a gazdaságot és településeket.'),
   T(`Sorolj fel két természeti tényezőt a(z) ${t} témával kapcsolatban!`,'Jó válasz: éghajlat, domborzat, vízrajz, talaj stb.'),
   T(`Sorolj fel két társadalmi vagy gazdasági tényezőt!`,'Jó válasz: népesség, ipar, mezőgazdaság, közlekedés.'),
   T(`Írj egy hétköznapi példát a(z) ${t} hatására!`,'Jó válasz: valós életből vett kapcsolat.'),
   T(`Készíts rövid fogalompárt: fogalom + magyarázat.`,'Jó válasz: helyes fogalom és magyarázat.')
  ],
  közepes:t=>[
   T(`Mutasd be a(z) ${t} okait és következményeit!`,'Jó válasz: legalább két ok és két következmény.'),
   T(`Hasonlíts össze két területet a(z) ${t} szempontjából!`,'Jó válasz: természeti és társadalmi szempontok.'),
   T(`Értelmezz egy képzeletbeli térképet: milyen adatokat keresnél a(z) ${t} vizsgálatához?`,'Jó válasz: hely, eloszlás, sűrűség, irány.'),
   T(`Magyarázd el, hogyan kapcsolódik a(z) ${t} a gazdasághoz!`,'Jó válasz: ipar, mezőgazdaság, turizmus, közlekedés.'),
   T(`Készíts táblázatot: ok / folyamat / következmény.`,'Jó válasz: logikus földrajzi kapcsolatok.'),
   T(`Írj egy környezeti problémát a(z) ${t} témával kapcsolatban!`,'Jó válasz: konkrét probléma és hatás.'),
   T(`Milyen adatokat gyűjtenél a(z) ${t} vizsgálatához?`,'Jó válasz: mérhető földrajzi adatok.'),
   T(`Fogalmazz meg egy következtetést a(z) ${t} területi eloszlásáról!`,'Jó válasz: térbeli mintázat felismerése.')
  ],
  haladó:t=>[
   T(`Elemezd a(z) ${t} térbeli különbségeit és okait!`,'Jó válasz: területi eltérés + magyarázat.'),
   T(`Kapcsold össze a(z) ${t} témát globalizációval vagy klímaváltozással!`,'Jó válasz: konkrét kapcsolat.'),
   T(`Értelmezz egy képzeletbeli diagramot a(z) ${t} változásáról!`,'Jó válasz: trend, ok, következmény.'),
   T(`Készíts problémamegoldó javaslatot egy ${t} témájú földrajzi problémára!`,'Jó válasz: reális javaslat és indoklás.'),
   T(`Hasonlíts össze fejlett és fejlődő térséget a(z) ${t} szempontjából!`,'Jó válasz: gazdasági/társadalmi különbségek.'),
   T(`Írj érvelést: milyen hatással lehet a(z) ${t} a lakosság életminőségére?`,'Jó válasz: több szempontú érvelés.'),
   T(`Tervezd meg egy terepmunka vagy adatgyűjtés lépéseit a(z) ${t} vizsgálatához!`,'Jó válasz: cél, módszer, adatok, kiértékelés.'),
   T(`Írj esszévázlatot a(z) ${t} természet- és társadalomföldrajzi kapcsolatairól!`,'Jó válasz: összetett vázlat.')
  ]
 },
 angol:{
  hint:'Angol: szókincs, nyelvtan, fordítás, mondatalkotás, rövid szöveg.',
  alap:t=>[
   T(`Írj 8 angol szót a(z) "${t}" témához, magyar jelentéssel!`,'Jó válasz: 8 témához illő szó és jelentés.'),
   T(`Egészítsd ki a mondatot megfelelő szóval a(z) "${t}" témában:\n   I like ______ because it is interesting.`,'Lehetséges válasz: I like this topic because it is interesting.'),
   T(`Fordítsd angolra: Szeretem ezt a témát.`,'I like this topic.'),
   T(`Alkoss 3 egyszerű angol mondatot a(z) "${t}" témában!`,'Jó válasz: 3 helyes egyszerű mondat.'),
   T(`Írj 3 kérdést angolul a(z) "${t}" témáról!`,'Jó válasz: 3 helyes kérdő mondat.'),
   T(`Párosíts 5 angol szót magyar jelentésükkel a(z) "${t}" témában!`,'Jó válasz: 5 helyes szópár.'),
   T(`Tedd tagadóvá: I know this topic.`,'I do not know this topic.'),
   T(`Tedd kérdővé: You study English.`,'Do you study English?')
  ],
  közepes:t=>[
   T(`Írj 6 mondatos rövid angol szöveget a(z) "${t}" témában!`,'Jó válasz: 6 érthető, nyelvtanilag többnyire helyes mondat.'),
   T(`Alakítsd át múlt időbe: I visit my friend and we talk about ${t}.`,'I visited my friend and we talked about ...'),
   T(`Egészítsd ki Present Simple vagy Present Continuous alakkal!`,'Jó válasz: helyes igeidő és ragozás.'),
   T(`Fordítsd angolra: Tegnap tanultam erről a témáról.`,'I learned / studied about this topic yesterday.'),
   T(`Írj 5 kérdést és választ a(z) "${t}" témában!`,'Jó válasz: 5 kérdés-válasz pár.'),
   T(`Javítsd ki a hibát: He don't like this topic.`,'He does not / doesn’t like this topic.'),
   T(`Írj rövid párbeszédet két diák között a(z) "${t}" témáról!`,'Jó válasz: párbeszéd, kérdések, válaszok.'),
   T(`Használj 5 megadott szót egy rövid bekezdésben a(z) "${t}" témáról!`,'Jó válasz: összefüggő szöveg.')
  ],
  haladó:t=>[
   T(`Írj 100-120 szavas angol fogalmazást a(z) "${t}" témában!`,'Jó válasz: bevezetés, kifejtés, lezárás, változatos szókincs.'),
   T(`Érvelj angolul a(z) "${t}" mellett és ellen!`,'Jó válasz: pro és contra érvek.'),
   T(`Írj hivatalos e-mailt angolul a(z) "${t}" témában!`,'Jó válasz: megszólítás, cél, udvarias zárás.'),
   T(`Használj legalább 5 kötőszót egy összefüggő angol szövegben!`,'Jó válasz: because, although, however, therefore, moreover stb.'),
   T(`Alakíts át 5 mondatot függő beszéddé!`,'Jó válasz: helyes reported speech.'),
   T(`Írj véleménykifejtő bekezdést: What is your opinion about ${t}?`,'Jó válasz: vélemény + indoklás + példa.'),
   T(`Javítsd és magyarázd meg 5 nyelvtani hibát egy témához kapcsolódó szövegben!`,'Jó válasz: hiba javítása és indoklása.'),
   T(`Készíts szóbeli vizsga tételvázlatot angolul a(z) "${t}" témáról!`,'Jó válasz: fő pontok, kulcsszavak, példák.')
  ]
 },
 irodalom:{
  hint:'Irodalom: műelemzés, szereplők, téma, motívum, idézetértelmezés.',
  alap:t=>[
   T(`Nevezd meg a(z) ${t} témához kapcsolódó művet vagy szerzőt, ha ismert!`,'Jó válasz: releváns mű vagy szerző.'),
   T(`Írd le röviden, miről szól a(z) ${t}!`,'Jó válasz: rövid tartalmi összefoglalás.'),
   T(`Sorolj fel két szereplőt vagy fontos elemet a(z) ${t} témában!`,'Jó válasz: két releváns elem.'),
   T(`Magyarázd meg: mi lehet a mű vagy téma fő üzenete?`,'Jó válasz: értelmezhető fő gondolat.'),
   T(`Írj 3 jelzőt egy szereplőre vagy lírai énre!`,'Jó válasz: jellemző, indokolható jelzők.'),
   T(`Milyen hangulatot kelt a(z) ${t}? Indokold!`,'Jó válasz: hangulat + szövegbeli ok.'),
   T(`Keress egy motívumot a témában, és magyarázd meg!`,'Jó válasz: visszatérő kép vagy gondolat.'),
   T(`Fogalmazz meg egy kérdést a művel kapcsolatban!`,'Jó válasz: elemző kérdés.')
  ],
  közepes:t=>[
   T(`Elemezd 6-8 mondatban a(z) ${t} fő témáját!`,'Jó válasz: téma, példák, következtetés.'),
   T(`Jellemezz egy szereplőt vagy megszólalót a(z) ${t} alapján!`,'Jó válasz: tulajdonság + bizonyíték.'),
   T(`Hasonlíts össze két szereplőt, motívumot vagy helyzetet!`,'Jó válasz: hasonlóság és különbség.'),
   T(`Értelmezz egy képzeletbeli idézetet a(z) ${t} témából!`,'Jó válasz: jelentés, hangulat, szerep.'),
   T(`Milyen szerkezeti egységekre bontható a mű vagy téma?`,'Jó válasz: bevezetés, fordulópont, lezárás stb.'),
   T(`Milyen költői vagy nyelvi eszközök kapcsolódhatnak hozzá?`,'Jó válasz: metafora, hasonlat, ismétlés, megszólítás stb.'),
   T(`Írj rövid bekezdést a mű üzenetéről!`,'Jó válasz: állítás, indoklás, példa.'),
   T(`Kapcsold össze a(z) ${t} témát a korral vagy szerzői háttérrel!`,'Jó válasz: irodalomtörténeti kapcsolat.')
  ],
  haladó:t=>[
   T(`Írj részletes műelemzési vázlatot a(z) ${t} témához!`,'Jó válasz: bevezetés, téma, szerkezet, eszközök, értelmezés.'),
   T(`Elemezd a motívumrendszert vagy szimbólumokat a(z) ${t} alapján!`,'Jó válasz: motívum + jelentés + példa.'),
   T(`Hasonlítsd össze a(z) ${t} témát egy másik művel!`,'Jó válasz: párhuzamok és eltérések.'),
   T(`Írj 10-12 mondatos érvelő elemzést a fő üzenetről!`,'Jó válasz: tételmondat, érvek, példák.'),
   T(`Értelmezd a narrátor vagy lírai én szerepét!`,'Jó válasz: nézőpont, hangnem, hatás.'),
   T(`Vizsgáld meg a mű társadalmi vagy erkölcsi kérdéseit!`,'Jó válasz: probléma + értelmezés.'),
   T(`Írj esszévázlatot érettségi jelleggel a(z) ${t} témáról!`,'Jó válasz: logikus, elemző vázlat.'),
   T(`Fogalmazz meg saját értelmezést, és támaszd alá legalább 3 érvvel!`,'Jó válasz: önálló álláspont + bizonyítékok.')
  ]
 },
 nyelvtan:{
  hint:'Nyelvtan: fogalom, mondat, szófaj, helyesírás, elemzés.',
  alap:t=>[
   T(`Magyarázd meg röviden a(z) ${t} nyelvtani fogalmát!`,'Jó válasz: pontos fogalommeghatározás.'),
   T(`Írj 5 példát a(z) ${t} témára!`,'Jó válasz: 5 helyes példa.'),
   T(`Húzd alá a mondatban a(z) ${t} témához kapcsolódó részt: A tanuló figyelmesen olvassa a szöveget.`,'Jó válasz: a témától függő megfelelő mondatrész/szó.'),
   T(`Döntsd el, melyik alak helyes, és indokold!`,'Jó válasz: helyesírási vagy nyelvtani szabály.'),
   T(`Írj 3 mondatot, amelyben szerepel a(z) ${t}!`,'Jó válasz: 3 szabályos mondat.'),
   T(`Csoportosíts 6 példát két nyelvtani kategóriába!`,'Jó válasz: helyes csoportosítás.'),
   T(`Javítsd ki a hibás mondatot: A fiúk elmentek a boltba és vesznek kenyeret.`,'Lehetséges javítás: A fiúk elmentek a boltba, és vettek kenyeret.'),
   T(`Írj egy szabályt és egy példát a(z) ${t} témához!`,'Jó válasz: szabály + példa.')
  ],
  közepes:t=>[
   T(`Elemezd nyelvtanilag a mondatot: A gyors vonat reggel elindult Budapestre.`,'Jó válasz: szófajok/mondatrészek helyes azonosítása.'),
   T(`Alakítsd át a mondatot kérdő, tagadó és felszólító formába!`,'Jó válasz: három helyes átalakítás.'),
   T(`Keress és javíts 5 helyesírási vagy nyelvtani hibát egy rövid szövegben!`,'Jó válasz: hibák felismerése és javítása.'),
   T(`Magyarázd el a szabályt, amely a(z) ${t} témához kapcsolódik!`,'Jó válasz: pontos szabály és példa.'),
   T(`Írj összetett mondatot, majd elemezd a tagmondatokat!`,'Jó válasz: tagmondatok és kötőszó felismerése.'),
   T(`Csoportosíts szavakat szófaj szerint!`,'Jó válasz: főnév, ige, melléknév stb. helyes besorolása.'),
   T(`Írj példát alanyra, állítmányra, tárgyra és határozóra!`,'Jó válasz: helyes mondatrészi példák.'),
   T(`Indokold meg egy helyesírási döntésedet szabállyal!`,'Jó válasz: szabályra hivatkozó indoklás.')
  ],
  haladó:t=>[
   T(`Végezz teljes mondatelemzést egy összetett mondaton!`,'Jó válasz: tagmondatok, mondatrészek, viszonyok.'),
   T(`Elemezz egy rövid szöveget nyelvhelyességi szempontból!`,'Jó válasz: hibák, javítás, indoklás.'),
   T(`Magyarázd el a(z) ${t} szabályát kivételekkel együtt!`,'Jó válasz: szabály + kivétel + példák.'),
   T(`Írj 8 mondatos szöveget, majd jelöld benne a tanult nyelvtani jelenségeket!`,'Jó válasz: jelölés és magyarázat.'),
   T(`Hasonlíts össze két nyelvtani kategóriát!`,'Jó válasz: hasonlóságok és különbségek.'),
   T(`Készíts feladatsort megoldókulccsal a(z) ${t} témából!`,'Jó válasz: változatos, ellenőrizhető feladatok.'),
   T(`Értelmezz egy kétértelmű mondatot nyelvtani okok alapján!`,'Jó válasz: szerkezet és jelentés kapcsolata.'),
   T(`Írj érettségi jellegű nyelvtani elemző feladatot!`,'Jó válasz: komplex, megoldható elemzés.')
  ]
 },
 informatika:{
  hint:'Informatika: algoritmus, adat, táblázat, biztonság, programozási logika.',
  alap:t=>[
   T(`Magyarázd meg röviden a(z) ${t} informatikai fogalmát!`,'Jó válasz: pontos alapfogalom.'),
   T(`Írj két példát a(z) ${t} használatára!`,'Jó válasz: két valós felhasználási példa.'),
   T(`Mit jelent az adat és az információ? Kapcsold a témához!`,'Jó válasz: adat = nyers érték, információ = értelmezett adat.'),
   T(`Írj 3 digitális biztonsági szabályt!`,'Jó válasz: erős jelszó, frissítés, gyanús link kerülése.'),
   T(`Készíts egyszerű lépéssort egy feladat megoldására!`,'Jó válasz: algoritmikus sorrend.'),
   T(`Mi a különbség fájl és mappa között?`,'Jó válasz: fájl adatot tartalmaz, mappa rendszerez.'),
   T(`Sorolj fel 3 bemeneti vagy kimeneti eszközt!`,'Jó válasz: billentyűzet, egér, monitor, nyomtató stb.'),
   T(`Írj egy példát táblázatkezelésre!`,'Jó válasz: adatok rendezése, számítás, diagram.')
  ],
  közepes:t=>[
   T(`Írj algoritmust 5-7 lépésben a(z) ${t} témához kapcsolódó feladatra!`,'Jó válasz: pontos, végrehajtható lépések.'),
   T(`Készíts pszeudokódot egy egyszerű döntési helyzetre!`,'Jó válasz: IF/ELSE logika.'),
   T(`Magyarázd el, mire való a változó egy programban!`,'Jó válasz: adat tárolása és módosítása.'),
   T(`Írj példát ciklusra a mindennapi életből és programozásból!`,'Jó válasz: ismétlődő művelet felismerése.'),
   T(`Készíts táblázatot: adat / típus / példa.`,'Jó válasz: szöveg, szám, logikai érték stb.'),
   T(`Milyen veszélyei lehetnek az internetes adatmegosztásnak?`,'Jó válasz: adatlopás, zaklatás, visszaélés.'),
   T(`Írj keresési stratégiát megbízható információ megtalálásához!`,'Jó válasz: kulcsszavak, forrásellenőrzés.'),
   T(`Magyarázd el a mentés és biztonsági másolat jelentőségét!`,'Jó válasz: adatvesztés megelőzése.')
  ],
  haladó:t=>[
   T(`Tervezz algoritmust bemenettel, feldolgozással és kimenettel!`,'Jó válasz: IPO-modell.'),
   T(`Írj pszeudokódot egy lista legnagyobb elemének megkeresésére!`,'Jó válasz: kezdeti maximum, bejárás, összehasonlítás.'),
   T(`Elemezd egy algoritmus hatékonyságát egyszerű szavakkal!`,'Jó válasz: lépésszám, ismétlések, adatmennyiség.'),
   T(`Készíts adatvédelmi szabályzat-vázlatot egy iskolai apphoz!`,'Jó válasz: milyen adatot, miért, meddig, ki fér hozzá.'),
   T(`Magyarázd el a feltétel, ciklus és függvény kapcsolatát egy programban!`,'Jó válasz: alap programozási szerkezetek összefüggése.'),
   T(`Tervezz adatbázis-táblát diákok és jegyek kezelésére!`,'Jó válasz: mezők, kulcs, kapcsolatok.'),
   T(`Írj hibakeresési tervet egy nem működő programhoz!`,'Jó válasz: reprodukció, napló, teszt, javítás.'),
   T(`Érvelj az AI iskolai használata mellett és ellen informatikai szempontból!`,'Jó válasz: előnyök, kockázatok, felelős használat.')
  ]
 }
};

function generic(subject){
 return bank[subject] || bank.történelem;
}

function generateWorksheet(){
 const subject=$('wsSubject').value;
 const topic=$('wsTopic').value.trim() || 'megadott téma';
 const grade=$('wsGrade').value.trim() || 'osztály';
 const level=$('wsLevel').value;
 const count=clamp(Number($('wsCount').value)||8,3,10);
 const showKey=$('wsKey').checked;
 const subjectBank=generic(subject);
 const tasks=subjectBank[level](topic).slice(0,count);
 let out=header(subject,topic,grade,level);
 out += subject==='angol'
  ? 'Instrukció: Válaszaidat angolul írd, ahol a feladat ezt kéri.\n\n'
  : 'Instrukció: Válaszaid legyenek konkrétak. Számolásnál írd le a lépéseket, szöveges feladatnál indokolj.\n\n';
 tasks.forEach((t,i)=>out += `${i+1}. ${t.q}\n   Válasz: ____________________________________________________________\n\n`);
 if(showKey){
   out += 'MEGOLDÓKULCS / JAVÍTÁSI JAVASLAT\n';
   tasks.forEach((t,i)=>out += `${i+1}. ${t.a}\n`);
 }
 $('worksheetOutput').textContent=out;
 $('heroSubject').textContent=subject.charAt(0).toUpperCase()+subject.slice(1);
 $('heroLevel').textContent=level.charAt(0).toUpperCase()+level.slice(1)+' szint';
 $('heroInfo').textContent=`${count} kérdés • megoldókulcs: ${showKey?'bekapcsolva':'kikapcsolva'}`;
 $('subjectHint').textContent=subjectBank.hint;
 const msg={alap:'Alap szint: könnyebb, rávezető kérdések.',közepes:'Közepes szint: vegyes feladatok és magyarázat.',haladó:'Haladó szint: összetettebb, elemző és gondolkodtató feladatok.'}[level];
 $('levelExplain').textContent=msg;
 toast(`${subject} • ${level} frissítve`);
}

async function copyText(t){try{await navigator.clipboard.writeText(t);toast('Vágólapra másolva.')}catch{toast('Nem sikerült másolni.')}}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===b.dataset.tab));document.querySelectorAll('.tab-panel').forEach(x=>x.classList.toggle('active',x.id==='tab-'+b.dataset.tab))});
document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=()=>copyText($(b.dataset.copy).textContent));
['wsSubject','wsTopic','wsGrade','wsCount','wsLevel','wsKey'].forEach(id=>$(id).addEventListener('change',generateWorksheet));
$('generateWorksheetBtn').onclick=generateWorksheet;
$('wsSubject').addEventListener('change',()=>{
 const subject=$('wsSubject').value;
 const defaultTopics={matematika:'törtek',történelem:'honfoglalás',fizika:'energia',kémia:'kémiai reakciók',biológia:'sejtek',földrajz:'éghajlat',angol:'daily routine',irodalom:'János vitéz',nyelvtan:'szófajok',informatika:'algoritmusok'};
 $('wsTopic').value=defaultTopics[subject]||'téma';
 generateWorksheet();
});

$('calcGrade').onclick=()=>{const max=Number($('maxPoint').value)||1,got=Number($('gotPoint').value)||0,p=got/max*100;let g=p>=85?5:p>=70?4:p>=55?3:p>=40?2:1;$('gradeResult').textContent=`${p.toFixed(1)}% • Jegy: ${g}`};
$('generateLessonBtn').onclick=()=>{const s=$('lessonSubject').value||'tantárgy',t=$('lessonTopic').value||'óra témája',m=Number($('lessonMinutes').value)||45;$('lessonOutput').textContent=`ÓRAVÁZLAT\nTantárgy: ${s}\nTéma: ${t}\nIdőtartam: ${m} perc\n\n1. Ráhangolódás – 5 perc\n2. Új anyag / közös példa – 15 perc\n3. Önálló vagy páros gyakorlás – 20 perc\n4. Ellenőrzés, lezárás – 5 perc\n\nHázi feladat: 3 gyakorlófeladat a(z) ${t} témából.`};
$('generateTextBtn').onclick=()=>{const n=$('txtStudent').value||'A tanuló',t=$('txtTopic').value||'az aktuális téma',d=$('txtDetails').value||'Az alapok megvannak, de rendszeres gyakorlással tovább javítható az eredmény.';$('textOutput').textContent=`${n} a(z) ${t} témában a következő visszajelzést kapja:\n\n${d}\n\nJavaslat: rövid, rendszeres ismétlés és célzott gyakorlófeladatok.`};
function names(){return $('namesInput').value.split(/\n|,/).map(x=>x.trim()).filter(Boolean)}
$('pickRandomBtn').onclick=()=>{const n=names();$('toolsOutput').textContent=n.length?`Véletlen felelő: ${n[Math.floor(Math.random()*n.length)]}`:'Adj meg neveket.'};
$('makeGroupsBtn').onclick=()=>{const n=names().sort(()=>Math.random()-.5),c=clamp(Number($('groupCount').value)||3,2,10),g=Array.from({length:c},()=>[]);n.forEach((x,i)=>g[i%c].push(x));$('toolsOutput').textContent=g.map((a,i)=>`${i+1}. csoport: ${a.join(', ')}`).join('\n')};
generateWorksheet();