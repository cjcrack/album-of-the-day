const FALLBACK = [
  {rank:500, artist:"Beastie Boys", title:"Paul’s Boutique", year:1989, label:"Capitol"},
  {rank:499, artist:"Elvis Costello", title:"My Aim Is True", year:1977, label:"Stiff"},
  {rank:498, artist:"Os Mutantes", title:"Os Mutantes", year:1968, label:"Polydor"},
  {rank:497, artist:"Live", title:"Throwing Copper", year:1994, label:"Radioactive"},
  {rank:496, artist:"Vampire Weekend", title:"Vampire Weekend", year:2008, label:"XL"},
  {rank:495, artist:"Meat Loaf", title:"Bat Out Of Hell", year:1977, label:"Cleveland Intl./Epic"},
  {rank:494, artist:"Le Tigre", title:"Feminist Sweepstakes", year:2001, label:""},
  {rank:480, artist:"The Velvet Underground", title:"White Light/White Heat", year:1968, label:"Verve"},
  {rank:476, artist:"Daft Punk", title:"Discovery", year:2001, label:"Virgin"},
  {rank:474, artist:"Supertramp", title:"Crime Of The Century", year:1974, label:"A&M"},
  {rank:473, artist:"Chet Baker", title:"Chet Baker Sings", year:1954, label:"Pacific Jazz"},
  {rank:472, artist:"No Doubt", title:"Tragic Kingdom", year:1996, label:"Trauma"},
  {rank:471, artist:"Led Zeppelin", title:"Physical Graffiti", year:1975, label:"Swan Song"},
  {rank:470, artist:"Silver Jews", title:"The Natural Bridge", year:1996, label:"Drag City"},
  {rank:469, artist:"Sun Kil Moon", title:"Benji", year:2014, label:""},
  {rank:435, artist:"Whitney Houston", title:"Whitney", year:1987, label:"Arista"},
  {rank:434, artist:"Cream", title:"Disraeli Gears", year:1967, label:"Atco"},
  {rank:433, artist:"The Beach Boys", title:"Smiley Smile", year:1967, label:"Capitol"},
  {rank:431, artist:"Black Sabbath", title:"Black Sabbath", year:1970, label:"Vertigo"},
  {rank:429, artist:"2Pac", title:"All Eyez On Me", year:1996, label:"Death Row/Interscope"},
  {rank:427, artist:"King Crimson", title:"Larks’ Tongues In Aspic", year:1973, label:"Island"},
  {rank:425, artist:"Metallica", title:"Ride The Lightning", year:1984, label:"Megaforce"},
  {rank:424, artist:"Genesis", title:"Selling England By The Pound", year:1973, label:"Charisma"},
  {rank:249, artist:"Burial", title:"Burial", year:2006, label:""},
  {rank:248, artist:"Prince And The Revolution", title:"Parade", year:1986, label:""},
  {rank:246, artist:"Pet Shop Boys", title:"Behaviour", year:1990, label:""},
  {rank:245, artist:"Silver Jews", title:"American Water", year:1998, label:""},
  {rank:244, artist:"Soft Cell", title:"Non-Stop Erotic Cabaret", year:1981, label:""},
  {rank:243, artist:"The Flying Burrito Brothers", title:"The Gilded Palace Of Sin", year:1969, label:""},
  {rank:242, artist:"Chic", title:"C’est Chic", year:1978, label:""},
  {rank:240, artist:"Genesis", title:"The Lamb Lies Down On Broadway", year:1974, label:"Charisma"},
  {rank:239, artist:"The Allman Brothers Band", title:"At Fillmore East", year:1971, label:"Capricorn"},
  {rank:238, artist:"Joni Mitchell", title:"Ladies Of The Canyon", year:1970, label:""},
  {rank:230, artist:"The Go-Betweens", title:"Liberty Belle And The Black Diamond Express", year:1986, label:""},
  {rank:229, artist:"Ramones", title:"It’s Alive", year:1979, label:""},
  {rank:228, artist:"Feist", title:"The Reminder", year:2007, label:""},
  {rank:227, artist:"Cat Power", title:"The Greatest", year:2006, label:""},
  {rank:226, artist:"Aretha Franklin", title:"Young, Gifted And Black", year:1972, label:""},
  {rank:225, artist:"Joni Mitchell", title:"Court And Spark", year:1974, label:""},
  {rank:224, artist:"M.I.A.", title:"Arular", year:2005, label:""},
  {rank:223, artist:"The Wailers", title:"Catch A Fire", year:1973, label:""},
  {rank:222, artist:"Air", title:"Moon Safari", year:1998, label:"Virgin"},
  {rank:221, artist:"Depeche Mode", title:"Violator", year:1990, label:"Mute"}
];

let albums = FALLBACK;
let currentDate = new Date();
let currentAlbum = null;
let randomMode = false;


/* =========================================================
   DATA
   ========================================================= */

async function loadAlbums() {
  try {
    const response = await fetch("./data/albums.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      console.warn("Could not load albums.json:", response.status);
      return;
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length >= 100) {
      albums = data;
      console.log(`Loaded ${albums.length} albums from albums.json`);
    } else {
      console.warn(
        "albums.json contains too few albums. Using fallback data."
      );
    }
  } catch (error) {
    console.error("Error loading albums.json:", error);
  }
}


/* =========================================================
   DATE / DAILY ALBUM
   ========================================================= */

function dateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}


function hash(string) {
  let h = 2166136261;

  for (let i = 0; i < string.length; i++) {
    h ^= string.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}


function dailyAlbum(date) {
  return albums[hash(dateKey(date)) % albums.length];
}


function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}


/* =========================================================
   WIKIPEDIA
   ========================================================= */

/*
 * Wikipedia is now the ONLY image source.
 *
 * The /page/summary endpoint provides:
 * - article title
 * - article extract
 * - thumbnail
 * - original image
 * - canonical Wikipedia URL
 *
 * See:
 * https://www.mediawiki.org/wiki/Page_Content_Service
 */

async function loadWikipedia(album) {
  const candidates = [
    `${album.artist} - ${album.title}`,
    `${album.title} (${album.artist} album)`,
    album.title
  ];

  for (const candidate of candidates) {
    const title = encodeURIComponent(candidate);

    const url =
      `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;

    try {
      const response = await fetch(url, {
        cache: "no-store"
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      /*
       * Ignore disambiguation pages.
       */
      if (data.type === "disambiguation") {
        continue;
      }

      if (data.extract) {
        return {
          title: data.title,
          extract: data.extract,

          /*
           * Wikipedia thumbnail is preferred because it is
           * already optimized for web display.
           */
          image:
            data.thumbnail?.source ||
            data.originalimage?.source ||
            "",

          url:
            data.content_urls?.desktop?.page ||
            `https://en.wikipedia.org/wiki/${encodeURIComponent(
              data.title.replaceAll(" ", "_")
            )}`
        };
      }
    } catch (error) {
      console.warn("Wikipedia lookup failed:", error);
    }
  }

  return null;
}


/* =========================================================
   FAVORITES
   ========================================================= */

function favorites() {
  try {
    return JSON.parse(
      localStorage.getItem("albumFavorites") || "[]"
    );
  } catch (error) {
    return [];
  }
}


function isFavorite(album) {
  if (!album) {
    return false;
  }

  return favorites().some(
    item => item.rank === album.rank
  );
}


function toggleFavorite(album) {
  if (!album) {
    return;
  }

  let favoriteList = favorites();

  if (isFavorite(album)) {
    favoriteList = favoriteList.filter(
      item => item.rank !== album.rank
    );
  } else {
    favoriteList.unshift(album);
  }

  localStorage.setItem(
    "albumFavorites",
    JSON.stringify(favoriteList)
  );

  updateFavoriteUI();
  renderFavorites();
}


function updateFavoriteUI() {
  const favoriteCount =
    document.querySelector("#favCount");

  const favoriteButton =
    document.querySelector("#favorite");

  if (favoriteCount) {
    favoriteCount.textContent = favorites().length;
  }

  if (favoriteButton && currentAlbum) {
    favoriteButton.textContent =
      isFavorite(currentAlbum)
        ? "♥ Favorite"
        : "♡ Favorite";
  }
}


/* =========================================================
   PLACEHOLDER COVER
   ========================================================= */

function placeholderCover(album) {
  const artist = String(album.artist || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const title = String(album.title || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 800 800">
      <rect width="100%" height="100%" fill="#ddd"/>
      <text x="50%" y="48%"
            text-anchor="middle"
            font-family="Arial"
            font-size="34">
        ${artist}
      </text>
      <text x="50%" y="53%"
            text-anchor="middle"
            font-family="Arial"
            font-size="28">
        ${title}
      </text>
    </svg>
  `;

  return "data:image/svg+xml," +
    encodeURIComponent(svg);
}


/* =========================================================
   MAIN RENDER
   ========================================================= */

async function render() {
  const album = randomMode
    ? albums[Math.floor(Math.random() * albums.length)]
    : dailyAlbum(currentDate);

  currentAlbum = album;

  const dateElement =
    document.querySelector("#date");

  const artistElement =
    document.querySelector("#artist");

  const titleElement =
    document.querySelector("#title");

  const yearElement =
    document.querySelector("#year");

  const rankElement =
    document.querySelector("#rank");

  const labelElement =
    document.querySelector("#label");

  const factYearElement =
    document.querySelector("#factYear");

  const factRankElement =
    document.querySelector("#factRank");

  const coverElement =
    document.querySelector("#cover");

  const appleElement =
    document.querySelector("#apple");

  const spotifyElement =
    document.querySelector("#spotify");


  if (dateElement) {
    dateElement.textContent = randomMode
      ? "Random selection"
      : formatDate(currentDate);
  }

  if (artistElement) {
    artistElement.textContent = album.artist;
  }

  if (titleElement) {
    titleElement.textContent = album.title;
  }

  if (yearElement) {
    yearElement.textContent = album.year || "";
  }

  if (rankElement) {
    rankElement.textContent =
      `ROLLING STONE #${album.rank}`;
  }

  if (labelElement) {
    labelElement.textContent =
      album.label || "—";
  }

  if (factYearElement) {
    factYearElement.textContent =
      album.year || "—";
  }

  if (factRankElement) {
    factRankElement.textContent =
      `#${album.rank}`;
  }


  /* Apple Music */

  if (appleElement) {
    appleElement.href =
      `https://music.apple.com/us/search?term=${encodeURIComponent(
        `${album.artist} ${album.title}`
      )}`;
  }


  /* Spotify */

  if (spotifyElement) {
    spotifyElement.href =
      `https://open.spotify.com/search/${encodeURIComponent(
        `${album.artist} ${album.title}`
      )}`;
  }


  /*
   * Show placeholder while Wikipedia loads.
   */

  if (coverElement) {
    coverElement.src =
      placeholderCover(album);

    coverElement.alt =
      `${album.artist} — ${album.title}`;
  }


  updateFavoriteUI();


  /* Wikipedia loading state */

  const wikiTitle =
    document.querySelector("#wikiTitle");

  const wikiExtract =
    document.querySelector("#wikiExtract");

  const wikiLink =
    document.querySelector("#wikiLink");

  const wikiMeta =
    document.querySelector("#wikiMeta");


  if (wikiTitle) {
    wikiTitle.textContent = "Loading…";
  }

  if (wikiExtract) {
    wikiExtract.textContent = "";
  }

  if (wikiLink) {
    wikiLink.style.display = "none";
    wikiLink.removeAttribute("href");
  }

  if (wikiMeta) {
    wikiMeta.textContent = "";
  }


  /*
   * Wikipedia supplies BOTH:
   * - text
   * - image
   *
   * So we only need one network request.
   */

  const wiki = await loadWikipedia(album);


  if (wiki) {

    /* Image */

    if (wiki.image && coverElement) {
      coverElement.src = wiki.image;
    }


    /* Article title */

    if (wikiTitle) {
      wikiTitle.textContent =
        wiki.title;
    }


    /* Article summary */

    if (wikiExtract) {
      wikiExtract.textContent =
        wiki.extract;
    }


    /* Wikipedia link */

    if (wikiLink) {
      wikiLink.href = wiki.url;
      wikiLink.style.display = "inline";
    }


    if (wikiMeta) {
      wikiMeta.textContent =
        "Source: English Wikipedia · retrieved live";
    }

  } else {

    /*
     * No Wikipedia article or image.
     * Keep the placeholder rather than using
     * an unrelated image from another source.
     */

    if (wikiTitle) {
      wikiTitle.textContent =
        "Wikipedia article not found";
    }

    if (wikiExtract) {
      wikiExtract.textContent =
        "No matching English Wikipedia summary was found for this album.";
    }
  }
}


/* =========================================================
   FAVORITES PANEL
   ========================================================= */

function renderFavorites() {
  const list =
    document.querySelector("#favoritesList");

  if (!list) {
    return;
  }

  const favoriteList = favorites();

  if (!favoriteList.length) {
    list.innerHTML =
      "<p>No favorites yet.</p>";
    return;
  }

  list.innerHTML = favoriteList
    .map(album => `
      <div class="favorite-row">
        <button data-rank="${album.rank}">
          <strong>${album.artist}</strong> — ${album.title}
        </button>
        <span>#${album.rank}</span>
      </div>
    `)
    .join("");

  list
    .querySelectorAll("button")
    .forEach(button => {
      button.onclick = () => {
        const album = albums.find(
          item =>
            item.rank == button.dataset.rank
        );

        if (album) {
          currentAlbum = album;
          randomMode = true;

          render();

          const panel =
            document.querySelector(
              "#favoritesPanel"
            );

          if (panel) {
            panel.classList.add("hidden");
          }
        }
      };
    });
}


/* =========================================================
   EVENT HANDLERS
   ========================================================= */

const favoriteButton =
  document.querySelector("#favorite");

if (favoriteButton) {
  favoriteButton.onclick = () =>
    toggleFavorite(currentAlbum);
}


const randomButton =
  document.querySelector("#randomBtn");

if (randomButton) {
  randomButton.onclick = () => {
    randomMode = true;
    render();
  };
}


const previousButton =
  document.querySelector("#prevBtn");

if (previousButton) {
  previousButton.onclick = () => {
    randomMode = false;

    currentDate.setDate(
      currentDate.getDate() - 1
    );

    render();
  };
}


const nextButton =
  document.querySelector("#nextBtn");

if (nextButton) {
  nextButton.onclick = () => {
    randomMode = false;

    currentDate.setDate(
      currentDate.getDate() + 1
    );

    render();
  };
}


const todayButton =
  document.querySelector("#todayBtn");

if (todayButton) {
  todayButton.onclick = () => {
    randomMode = false;
    currentDate = new Date();
    render();
  };
}


const favoritesButton =
  document.querySelector("#favoritesBtn");

if (favoritesButton) {
  favoritesButton.onclick = () => {
    renderFavorites();

    const panel =
      document.querySelector(
        "#favoritesPanel"
      );

    if (panel) {
      panel.classList.remove("hidden");
    }
  };
}


const closeFavoritesButton =
  document.querySelector("#closeFavorites");

if (closeFavoritesButton) {
  closeFavoritesButton.onclick = () => {
    const panel =
      document.querySelector(
        "#favoritesPanel"
      );

    if (panel) {
      panel.classList.add("hidden");
    }
  };
}


/* =========================================================
   START APPLICATION
   ========================================================= */

(async function init() {
  await loadAlbums();
  await render();
})();
