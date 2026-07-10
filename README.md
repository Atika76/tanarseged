# TanárSegéd PRO v15

Magyar nyelvű, helyben futó tanári segédprogram. Sima HTML, CSS és JavaScript alapú: nincs bejelentkezés, külső API, szolgáltató vagy szerver. Az adatok a használt böngésző helyi tárhelyén tárolódnak.

## Funkciók

- **Ma:** aktuális dátum, mai órák, házi határidők, legutóbbi dolgozat, napló és tanulói esemény.
- **Jegyek:** pontok, bónuszpontok, ponthatárok, jegyszámítás, elemzés, CSV-export és nyomtatás.
- **Órai napló:** óraállapot, tananyag, hiányzók, felelők, házi és másolható összefoglaló.
- **Naplóból házi:** a naplóban megadott házi opcionálisan külön házi bejegyzésként is menthető.
- **Tanulók:** osztálylista és CSV-import, egyéni és tömeges tanulói események, mini adatlap.
- **Tanulói adatlap:** dátumtartomány szerinti szűrés, másolás és nyomtatás/PDF.
- **Óravázlat, Szövegek, Tanári eszközök:** a korábbi működő funkciók megmaradtak.
- **Tanév és félév:** az új dolgozatok, házik, naplók, események és óravázlatok automatikusan megkapják az aktuális besorolást.
- **Archiválás:** egy tanév rekordjai archiválhatók, megnyithatók, exportálhatók, visszaállíthatók vagy kétlépcsős megerősítéssel törölhetők.
- **Adatmentés:** metaadatokat tartalmazó v15 JSON-mentés, v14/v15 import, hozzáfűzés vagy felülírás, demóadatok és tárhely-kijelzés.

## Első indítás és adatvédelem

Első indításkor adatvédelmi figyelmeztetés jelenik meg. Kipróbáláshoz használj kitalált neveket. Valódi tanulói adatok használata előtt ellenőrizd az intézményi és adatvédelmi előírásokat.

Az adatok másik eszközön nem jelennek meg automatikusan. A böngészőadatok törlése elveszítheti őket, ezért az **Adatmentés** oldalon rendszeresen készíts JSON-mentést.

## Használat

1. Csomagold ki a ZIP-et egy saját mappába.
2. Nyisd meg az `index.html` fájlt Chrome, Edge vagy Firefox böngészőben.
3. A **Tanulók** oldalon hozz létre osztályt, majd töltsd fel a névsort.
4. Az **Adatmentés** oldalon ellenőrizd vagy állítsd be a tanévet és félévet.
5. Rendszeresen tölts le mentést.

## Visszajelzési link beállítása

Nyisd meg az `app.js` fájlt, és a legelső soroknál keresd meg ezt a sort:

```js
const FEEDBACK_URL = "";
```

Illeszd be a Google Űrlap teljes linkjét az üres idézőjelek közé, például:

```js
const FEEDBACK_URL = "https://forms.gle/sajat-url";
```

Mentés után a **Véleményt küldök** gomb új lapon nyitja meg az űrlapot. Üres értéknél az alkalmazás egyértelmű tájékoztatást jelenít meg.

## v14 adatok átvétele

A v15 külön `tanarseged_pro_v15` localStorage-kulcsot használ. Ha v14-es helyi adatot talál, azt egyszer átveszi v15-be, miközben a v14 kulcsot nem törli. Az átvétel előtt belső v15-ös migrációs biztonsági másolat is készül.

## GitHub Pages feltöltés

Töltsd fel a ZIP gyökerében lévő `index.html`, `styles.css`, `app.js`, `favicon.svg`, `README.md`, `OLVASS_EL.txt` és `CHANGELOG.md` fájlokat egy GitHub-repozitórium főkönyvtárába. A Pages beállításainál válaszd a fő ágat és a `/ (root)` könyvtárat.

Nincs service worker, `sw.js`, manifest, `advanced.html`, CDN vagy szerverkapcsolat. Frissítés után szükség esetén használj `Ctrl + F5`-öt.
