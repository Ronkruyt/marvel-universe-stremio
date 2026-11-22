const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const PORT = Number(process.env.PORT || 7000);
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

const catalogs = [
  ["movie","marvel_movies","Marvel – Alle films","movie"],
  ["series","marvel_series","Marvel – Alle series","tv"],
  ["movie","mcu_chronological","MCU – Chronologische volgorde (films)","movie"],
  ["series","mcu_series_chronological","MCU – Chronologische volgorde (series)","tv"],
  ["movie","mcu_release","MCU – Releasevolgorde (films)","movie"],
  ["series","mcu_series_release","MCU – Releasevolgorde (series)","tv"],
  ["movie","spider_man","Spider-Man","movie"],
  ["series","spider_man_series","Spider-Man – Series","tv"],
  ["movie","xmen","X-Men","movie"],
  ["series","xmen_series","X-Men – Series","tv"],
  ["movie","avengers","Avengers","movie"],
  ["movie","guardians","Guardians of the Galaxy","movie"],
  ["movie","fantastic_four","Fantastic Four","movie"],
  ["movie","marvel_animation","Marvel Animation – Films","movie"],
  ["series","marvel_animation_series","Marvel Animation – Series","tv"]
];

const manifest = {
  id: "community.marvel.universe.catalog",
  version: "1.2.0",
  name: "Marvel Universe",
  description: "Marvel-films en -series met MCU-kijkvolgorde en themacollecties. Catalogus-add-on; streams komen van je andere Stremio-add-ons.",
  resources: ["catalog", "meta"],
  types: ["movie", "series"],
  catalogs: catalogs.map(([type,id,name]) => ({
    type, id, name,
    extra: [{ name: "search", isRequired: false }]
  })),
config: [
  {
    key: "tmdbApiKey",
    type: "password",
    title: "Jouw TMDB API Key (v3)",
    required: true
  }
],
behaviorHints: {
  configurable: true,
  configurationRequired: true
}
};

const builder = new addonBuilder(manifest);

function getApiKey(config) {
  const apiKey = config && config.tmdbApiKey;

  if (!apiKey || !String(apiKey).trim()) {
    throw new Error("TMDB API-key ontbreekt. Vul je eigen TMDB API Key in bij de instellingen van Marvel Universe.");
  }

  return String(apiKey).trim();
}

async function tmdb(path, apiKey, params = {}) {
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "nl-NL");

  for (const [k,v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`TMDB API ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

// MCU in-universe order. Series and films are intentionally separate catalogs
// because Stremio requires each catalog to have one content type.
const mcuMovieOrder = [
  "Captain America: The First Avenger",
  "Captain Marvel",
  "Iron Man",
  "Iron Man 2",
  "The Incredible Hulk",
  "Thor",
  "The Avengers",
  "Thor: The Dark World",
  "Iron Man 3",
  "Captain America: The Winter Soldier",
  "Guardians of the Galaxy",
  "Guardians of the Galaxy Vol. 2",
  "Avengers: Age of Ultron",
  "Ant-Man",
  "Captain America: Civil War",
  "Black Widow",
  "Black Panther",
  "Spider-Man: Homecoming",
  "Doctor Strange",
  "Thor: Ragnarok",
  "Ant-Man and the Wasp",
  "Avengers: Infinity War",
  "Avengers: Endgame",
  "Shang-Chi and the Legend of the Ten Rings",
  "Eternals",
  "Spider-Man: Far From Home",
  "Spider-Man: No Way Home",
  "Doctor Strange in the Multiverse of Madness",
  "Thor: Love and Thunder",
  "Black Panther: Wakanda Forever",
  "Ant-Man and the Wasp: Quantumania",
  "Guardians of the Galaxy Vol. 3",
  "The Marvels",
  "Deadpool & Wolverine",
  "Captain America: Brave New World",
  "Thunderbolts*",
  "The Fantastic Four: First Steps"
];

const mcuSeriesOrder = [
  "Agent Carter",
  "WandaVision",
  "The Falcon and the Winter Soldier",
  "Loki",
  "What If...?",
  "Hawkeye",
  "Moon Knight",
  "Ms. Marvel",
  "She-Hulk: Attorney at Law",
  "Secret Invasion",
  "Echo",
  "Agatha All Along",
  "Daredevil: Born Again"
];

const catalogConfig = {
  marvel_movies: { kind:"movie", companies:"420|7505" },
  marvel_series: { kind:"tv", companies:"420|7505" },
  mcu_release: { kind:"movie", companies:"420", sort_by:"primary_release_date.asc" },
  mcu_series_release: { kind:"tv", companies:"420", sort_by:"first_air_date.asc" },
  spider_man: { kind:"movie", query:"Spider-Man" },
  spider_man_series: { kind:"tv", query:"Spider-Man" },
  xmen: { kind:"movie", query:"X-Men" },
  xmen_series: { kind:"tv", query:"X-Men" },
  avengers: { kind:"movie", query:"Avengers" },
  guardians: { kind:"movie", query:"Guardians of the Galaxy" },
  fantastic_four: { kind:"movie", query:"Fantastic Four" },
  marvel_animation: { kind:"movie", query:"Marvel Animation" },
  marvel_animation_series: { kind:"tv", query:"Marvel Animation" }
};

async function searchTitle(title, kind, apiKey) {
  const data = await tmdb(`/search/${kind === "movie" ? "movie" : "tv"}`, apiKey, {
    query:title,
    include_adult:false,
    page:1
  });
  return data.results?.[0] || null;
}

async function toMeta(item, kind) {
  const title = item.title || item.name || "Untitled";
  const date = item.release_date || item.first_air_date || "";
  const year = date ? Number(date.slice(0,4)) : undefined;
  return {
    id: `${kind === "movie" ? "movie" : "tv"}:${item.id}`,
    type: kind === "movie" ? "movie" : "series",
    name: title,
    poster: item.poster_path ? IMG + item.poster_path : undefined,
    background: item.backdrop_path ? "https://image.tmdb.org/t/p/w1280" + item.backdrop_path : undefined,
    description: item.overview || "",
    releaseInfo: year ? String(year) : undefined,
    imdbRating: item.vote_average ? item.vote_average.toFixed(1) : undefined
  };
}

builder.defineCatalogHandler(async ({ type, id, extra = {}, config: userConfig }) => {
  const apiKey = getApiKey(userConfig);
  const entry = catalogs.find(c => c[0] === type && c[1] === id);
  if (!entry) return { metas: [] };
  const kind = entry[3];
  let results = [];

  if (id === "mcu_chronological" || id === "mcu_series_chronological") {
    const titles = id === "mcu_chronological" ? mcuMovieOrder : mcuSeriesOrder;
    const found = await Promise.all(titles.map(t => searchTitle(t, kind, apiKey).catch(() => null)));
    results = found.filter(Boolean);
  
  } else if (extra.search) {
    const data = await tmdb(`/search/${kind === "movie" ? "movie" : "tv"}`, apiKey, {
      query: extra.search,
      page: 1,
      include_adult: false
    });
    results = data.results || [];
  } else {
    const cfg = catalogConfig[id];
    if (!cfg) return { metas: [] };

    if (cfg.query) {
      const data = await tmdb(`/search/${kind === "movie" ? "movie" : "tv"}`, apiKey, {
        query: cfg.query,
        page: 1,
        include_adult: false
      });
      results = data.results || [];
    } else {
      const data = await tmdb(`/discover/${kind === "movie" ? "movie" : "tv"}`, apiKey, {
        with_companies: cfg.companies,
        sort_by: cfg.sort_by || "popularity.desc",
        include_adult: false,
        page: 1
      });
      results = data.results || [];
    }
  }


  const metas = await Promise.all(results.slice(0,100).map(x => toMeta(x, kind)));
  return { metas };
});

builder.defineMetaHandler(async ({ id, config }) => {
  const apiKey = getApiKey(config);
  const match = /^(movie|tv):(\d+)$/.exec(id);
  if (!match) return { meta: null };
  const kind = match[1];
  const item = await tmdb(`/${kind}/${match[2]}`, apiKey, { append_to_response:"external_ids" });
  const meta = await toMeta(item, kind === "movie" ? "movie" : "series");
  const imdbId = item.imdb_id || item.external_ids?.imdb_id;
  if (imdbId) meta.id = imdbId;
  meta.description = item.overview || "";
  meta.genres = (item.genres || []).map(g => g.name);
  if (kind === "movie" && item.runtime) meta.runtime = item.runtime;
  if (kind === "tv" && item.number_of_seasons) meta.seasons = item.number_of_seasons;
  return { meta };
});

serveHTTP(builder.getInterface(), { port: PORT });
console.log(`Marvel Universe add-on running at http://127.0.0.1:${PORT}/manifest.json`);
