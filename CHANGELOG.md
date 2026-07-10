# Változásnapló – TanárSegéd PRO v14

## Újdonságok

- Új **Ma** kezdőoldal mai órákkal, házi határidőkkel, legutóbbi dolgozattal, órai naplóval és tanulói eseménnyel.
- Új **Órai napló** modul mentéssel, szerkesztéssel, törléssel, szűréssel és másolható összefoglalóval.
- Új **Tanulói események** a Tanulók oldalon, teljes esemény- és dátumszűréssel.
- Új **Tanulói mini adatlap** dolgozateredményekkel, átlagokkal, jegyekkel és eseményösszesítéssel.
- Új **Adatmentés** oldal JSON-exporttal, ellenőrzött importtal, kétlépcsős adattörléssel és demó adatokkal.
- Új, kitalált adatokat használó demó: 7.B osztály, dolgozat, házik, órai naplók, események, óravázlat és szülői üzenet.
- Új **Véleményt küldök** gomb; a hivatkozás az `app.js` tetején lévő `FEEDBACK_URL` állandóban állítható be.
- Új mobil hamburger-menü 760 px alatt, fedéssel, Escape-zárással és vissza gombos kezeléssel.
- Mobiljavítások 360, 390, 412 és 480 px szélességhez: egyoszlopos kártyák, érintésbarát gombok, helyi táblázatgörgetés és vízszintes kilógás elleni védelem.

## Megőrzött funkciók

- Jegyek, ponthatárok, CSV-export és nyomtatás.
- Házi feladatok.
- Óravázlat.
- Értékelő és szülői szövegek.
- Véletlen felelő és csoportbontó.

## Technikai változások

- Egységes márkajelzés és fájlverzió: TanárSegéd PRO v14.
- `styles.css?v=14` és `app.js?v=14` hivatkozások.
- Új, v14-es localStorage-kulcs és nem romboló v13-adatátvétel.
- Nincs service worker, `sw.js`, manifest, külső API vagy szerver.
