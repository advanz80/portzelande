# Pirates of Port Zélande 🏴‍☠️

Een top-down avonturengame in de browser voor de collega's van Driessen Groep.
Piraten hebben Port Zélande gekaapt en Jan Driessen opgesloten op hun schip. Help de zes
bedrijven van de groep, verzamel zes sleutelfragmenten en versla Kapitein Kostenpost.

- **Speelduur:** ca. 20–30 minuten
- **Besturing:** WASD/pijltjes + spatie (of E/Enter). Op telefoon/tablet: virtuele joystick
  (linkerhelft scherm) + actieknop. Minigames werken met klikken/tikken of slepen.
- **Techniek:** Phaser 3 + Vite, vanilla JavaScript, geen backend. Alle graphics en audio
  worden in code gegenereerd, behalve de bedrijfslogo's.

---

## Lokaal draaien

Vereist: [Node.js](https://nodejs.org) 20 of nieuwer.

```bash
npm install
npm run dev
```

Open daarna de URL die Vite toont (meestal http://localhost:5173). Wijzigingen in de code
of teksten zie je direct.

Een productiebuild maak je met `npm run build`. Het resultaat staat in `dist/`.

---

## Logo's toevoegen

Zet de logo's als SVG in `public/assets/logos/` met precies deze bestandsnamen:

| Bedrijf | Bestand |
|---|---|
| Driessen | `driessen.svg` |
| Bloeij | `bloeij.svg` |
| IJk | `ijk.svg` |
| Haert | `haert.svg` |
| Reijn | `reijn.svg` |
| Brainport Human Campus | `bhc.svg` |

Tips:
- Gebruik SVG's **met een `viewBox`**, dan blijven de verhoudingen goed.
- Ontbreekt een logo, dan tekent het spel automatisch een ronde badge met de initialen in de
  huisstijlkleur. Je kunt het spel dus ook zonder logo's spelen.
- Wil je PNG gebruiken? Pas dan in `src/scenes/BootScene.js` `this.load.svg(...)` aan naar
  `this.load.image(...)` en de bestandsnamen in `src/config/brands.js`.

## Huisstijlkleuren aanpassen

De kleuren per bedrijf staan in **`src/config/brands.js`** (nu een schatting). Vervang de
hex-codes, bijvoorbeeld:

```js
driessen: { ..., ...hex('#E2001A'), dark: '#9E0012', ... },
```

`hex(...)` is de hoofdkleur (kraampjes, vlaggen, knoppen, achtergronden); `dark` is een
donkere variant.

## Teksten aanpassen

**Alle** dialogen, uitleg en UI-teksten staan in **`src/content/nl.json`**.

- `story.*`: verhaal en park-dialogen (Petra, de wachter, losse kreten van collega's).
- `missions.<bedrijf>.*`: per missie de NPC-naam, intro, uitleg (`howTo`), outro en
  missie-inhoud (kandidaten, collega's op het strand, interviews, opdrachten…).
- `finale.*`: dialogen en "drogredenen" van de kapitein, met antwoordopties. `answer` is
  het nummer van het goede antwoord (0 = eerste).
- `credits.lines`: de aftiteling.

Regels:
- `{naam}` wordt vervangen door de naam van de speler. Andere `{...}`-woorden
  (zoals `{aantal}`, `{bedrijf}`) worden ook automatisch ingevuld; laat ze staan.
- Een dialoogregel ziet er zo uit: `{ "speaker": "npc", "text": "..." }`.
  Mogelijke sprekers: `npc` (de NPC van de missie), `petra`, `jan`, `captain`, `guard`, `player`.
- Houd het bestand geldige JSON (let op komma's en aanhalingstekens). Een JSON-validator
  helpt bij twijfel.

## GitHub Pages aanzetten

1. Push de code naar de standaardbranch (`main`) van de repository.
2. Ga op GitHub naar **Settings → Pages** en kies bij **Source: GitHub Actions**.
3. De workflow `.github/workflows/deploy.yml` bouwt en publiceert het spel bij elke push
   naar `main` (of handmatig via **Actions → Deploy naar GitHub Pages → Run workflow**).
4. Het spel staat daarna op `https://<gebruikersnaam>.github.io/<repo-naam>/`.

Het pad (`base`) wordt in de workflow automatisch op de repo-naam gezet. Bouw je lokaal
voor een andere locatie, pas dan `REPO_BASE` aan in `vite.config.js` of zet de
omgevingsvariabele `BASE_PATH`.

## Leaderboard

Het leaderboard wordt nu lokaal opgeslagen (in de browser, via `localStorage`). Iedere
speler ziet dus alleen de scores op zijn eigen apparaat.

Wil je één gedeeld leaderboard (bijvoorbeeld met [Supabase](https://supabase.com))?
In `src/core/Leaderboard.js` staat een voorbeeld-`SupabaseProvider`. Maak een tabel
`leaderboard` (`name text, score int, timeMs int, date text`), zet de provider aan en kies
hem met:

```js
Leaderboard.setProvider(new SupabaseProvider('https://<project>.supabase.co', '<anon-key>'));
```

Let op: met een publieke anon-key kan iedereen scores insturen. Voor een intern teamuitje is
dat meestal prima; anders is een kleine serverless-functie met validatie verstandig.

## Voortgang

Voortgang (fragmenten, beste scores, speeltijd, avatar) wordt automatisch in de browser
opgeslagen. In het hoofdmenu kies je **Doorgaan** of **Nieuw spel**.

---

## Projectstructuur

```
src/
├─ main.js                 Phaser-configuratie en opstart
├─ content/nl.json         alle teksten
├─ config/brands.js        kleuren, logo's per bedrijf
├─ config/npcs.js          uiterlijk van vaste personages
├─ core/                   opslag, leaderboard, audio, besturing, effecten (juice)
├─ gfx/                    gegenereerde graphics (karakters, iconen, objecten)
├─ ui/                     knoppen, panelen, slepen/tikken
├─ world/                  plattegrond en terrein van het park
└─ scenes/
   ├─ BootScene, MenuScene, CharacterScene, WorldScene, HUDScene, DialogScene
   ├─ missions/            MissionBase (template) + één scène per missie
   ├─ FinaleScene, CreditsScene, LeaderboardScene
```

### Een missie toevoegen of aanpassen

Elke missie erft van `src/scenes/missions/MissionBase.js`. Die regelt de vaste flow:
intro-dialoog → uitlegscherm → aftellen → minigame → sterren → sleutelfragment → outro.
Een nieuwe missie implementeert minimaal `startGame()` en roept `this.finish()` aan als ze
klaar is. Score geef je met `this.addScore(punten, x, y)`; de sterdrempels staan in de
constructor (`thresholds`).

### Debug-snelkoppelingen

- `?debug=1&scene=BloeijMission` start direct een scène (ook `World`, `Finale`, `Credits`…).
- `&noaudio=1` schakelt geluid uit.

## Licentie & credits

Gemaakt voor intern gebruik binnen Driessen Groep. Fonts: Fredoka en Pirata One (SIL Open
Font License, meegeleverd via `@fontsource`).
