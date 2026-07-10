# TanárSegéd PRO v14

Egyszerű, magyar nyelvű tanári segédprogram. Sima HTML, CSS és JavaScript alapú, bejelentkezés és külső szerver nélkül fut. Az adatok az adott böngésző helyi tárhelyén maradnak.

## Funkciók

- **Ma:** mai órák, esedékes és közelgő házik, legutóbbi dolgozat, napló és tanulói esemény.
- **Jegyek:** osztálylista, pontok, bónuszpontok, ponthatárok, jegyszámítás, elemzés, CSV-export és nyomtatás.
- **Órai napló:** óránkénti téma, tananyag, házi, hiányzók, felelők, megjegyzés és óraállapot.
- **Házi feladatok:** mentés, lezárás és másolható tájékoztató.
- **Tanulók:** osztály- és névsor-kezelés, CSV-import, tanulói események és mini adatlap.
- **Óravázlat:** szerkeszthető, menthető óravázlat pontos időkerettel.
- **Szövegek:** értékelő és szülői üzenetek, menthető szövegekkel.
- **Tanári eszközök:** méltányos felelőválasztó és csoportbontó.
- **Adatmentés:** v14-es JSON-mentés, visszaállítás, demó adatok és kétlépcsős adattörlés.

## Használat

1. Csomagold ki a ZIP-fájlt egy tetszőleges mappába.
2. Nyisd meg az `index.html` fájlt Chrome, Edge vagy Firefox böngészőben.
3. A **Tanulók** oldalon hozz létre egy osztályt, majd add hozzá vagy CSV-ből töltsd fel a névsort.
4. A többi modul már ezt a közös osztálylistát használja.
5. Fontos munka előtt és után készíts mentést az **Adatmentés** oldalon.

## Mentés és adatátvétel

A v14 a saját, `tanarseged_pro_v14` localStorage-kulcsát használja. Első megnyitáskor képes a korábbi v13-as helyi adatokat v14-be másolni; a régi kulcsot nem törli automatikusan.

Az exportált JSON-fájl visszatöltése előtt a program ellenőrzi, hogy valódi TanárSegéd PRO v14 mentésről van-e szó. Hibás fájl esetén nem írja felül az adatokat.

## GitHub Pages feltöltés

Töltsd fel a ZIP gyökerében lévő `index.html`, `styles.css`, `app.js`, `favicon.svg`, `README.md`, `OLVASS_EL.txt` és `CHANGELOG.md` fájlokat egy GitHub-repozitórium főkönyvtárába. A Pages beállításainál válaszd a fő ágat és a `/ (root)` könyvtárat. Az `index.html` lesz a főoldal.

Nincs service worker, `sw.js`, manifest vagy külső API. Frissítés után, ha kell, használj `Ctrl + F5`-öt.

## Adatvédelem

Ez a próbaverzió az adatokat kizárólag a használt böngészőben tárolja. Valódi tanulói adatok használata előtt ellenőrizd az intézményi és adatvédelmi előírásokat. Közös gépen ne hagyj érzékeny adatokat, és rendszeresen tölts le biztonsági mentést.
