# Változásnapló – TanárSegéd PRO v15

## Újdonságok

- Helyi magyar dátumkezelés: a mai dátum többé nem UTC-alapú.
- Automatikus mentési állapotjelző: Mentés, elmentve vagy mentési hiba.
- Első indítási adatvédelmi figyelmeztetés, későbbi újranyitási lehetőséggel.
- Órai naplóból külön Házi feladat bejegyzés hozható létre, határidővel és duplikációvédelemmel.
- Tömeges tanulói eseményrögzítés kijelölhető névsorral.
- Tanulói adatlap dátumszűréssel, összesítésmásolással és nyomtatás/PDF nézettel.
- Tanév- és félévkezelés új rekordok automatikus besorolásával.
- Tanévarchiválás automatikus mentéssel, megnyitással, exporttal, visszaállítással és kétlépcsős törléssel.
- Tárhelyhasználat, utolsó mentés és import időpontjának kijelzése.
- Továbbfejlesztett JSON export/import metaadatokkal, v14 és v15 támogatással, hozzáfűzéssel vagy felülírással.
- Frissített demó: két dolgozat, három házi, három napló, több esemény, kapcsolt napló-házi példa, óravázlat és szülői üzenet.
- Megőrzött és finomított mobil hamburger menü, érintésbarát tömeges kijelölővel és 360 px-re igazított modálokkal.

## Technikai változások

- Egységes verzió: TanárSegéd PRO v15.
- `styles.css?v=15` és `app.js?v=15` hivatkozások.
- Külön v15 localStorage-kulcs, nem romboló v14-adatátvétellel és belső migrációs másolattal.
- Nincs service worker, `sw.js`, manifest, `advanced.html`, külső API vagy szerver.
