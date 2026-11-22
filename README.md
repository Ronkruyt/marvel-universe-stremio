# Marvel Universe – Stremio Add-on

Marvel-catalogus voor Stremio Discover met films, series, themacollecties en MCU-kijkvolgorde.

## Catalogi
- Marvel – Alle films / alle series
- MCU – Chronologische volgorde (films)
- MCU – Chronologische volgorde (series)
- MCU – Releasevolgorde (films en series)
- Spider-Man, X-Men, Avengers, Guardians of the Galaxy, Fantastic Four en Marvel Animation

**Waarom twee chronologische catalogi?** Stremio vereist dat iedere catalogus één inhoudstype heeft (`movie` of `series`). Daarom staan MCU-films en MCU-series in aparte catalogi. Samen vormen ze de kijklijst; Stremio kan ze niet als één gemengde catalogus rangschikken.

## Installeren
1. Installeer Node.js 18 of hoger.
2. Vraag een TMDB API-key aan: https://www.themoviedb.org/settings/api
3. Pak de ZIP uit en open een terminal in de map.
4. Voer `npm install` uit.
5. Kopieer `.env.example` naar `.env` en vul `TMDB_API_KEY=...` in.
6. Start met `npm start`.
7. Open in Stremio `http://127.0.0.1:7000/manifest.json` en installeer de add-on.

De lokale add-on werkt zolang de computer waarop hij draait aanstaat. Voor gebruik op al je apparaten moet je hem hosten op een Node.js-server met HTTPS en daar `TMDB_API_KEY` als environment variable instellen.

## Belangrijk
- Dit is een catalogus- en metadata-add-on, geen videostream-add-on.
- Afspelen gebeurt via je bestaande Stremio-stream-add-ons.
- De chronologie is een samengestelde kijkvolgorde. Sommige MCU-titels, met name multiverse-verhalen en series, hebben geen eenduidige plek in de tijdlijn. De lijst kan worden bijgewerkt wanneer Marvel nieuwe titels uitbrengt.
- Metadata, posters en omschrijvingen komen van TMDB.
