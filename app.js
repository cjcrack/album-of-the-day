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

async function loadAlbums(){
  try{
    const r = await fetch("./data/albums.json");
    if(r.ok){
      const data = await r.json();
      if(Array.isArray(data) && data.length >= 100) albums = data;
    }
  }catch(e){}
}

function dateKey(d){
  return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Warsaw",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
}
function hash(s){
  let h=2166136261;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
  return h>>>0;
}
function dailyAlbum(d){
  return albums[hash(dateKey(d)) % albums.length];
}
function formatDate(d){
  return new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}).format(d);
}
function coverUrl(a){
  const q = encodeURIComponent(`${a.artist} ${a.title}`);
  return `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*`;
}
async function loadCover(a){
  try{
    const r=await fetch(coverUrl(a)); const j=await r.json();
    const pages=j.query?.pages;
    if(pages){const p=Object.values(pages)[0]; return p.imageinfo?.[0]?.thumburl || p.imageinfo?.[0]?.url;}
  }catch(e){}
  return "";
}
async function loadWikipedia(a){
  const title = encodeURIComponent(`${a.artist} - ${a.title}`);
  const candidates = [
    `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(a.title)}`
  ];
  for(const url of candidates){
    try{
      const r=await fetch(url);
      if(r.ok){
        const j=await r.json();
        if(j.extract){
          return {title:j.title, extract:j.extract, url:j.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(j.title.replaceAll(" ","_"))}`};
        }
      }
    }catch(e){}
  }
  return null;
}
function favorites(){return JSON.parse(localStorage.getItem("albumFavorites")||"[]")}
function isFavorite(a){return favorites().some(x=>x.rank===a.rank)}
function toggleFavorite(a){
  let f=favorites();
  if(isFavorite(a)) f=f.filter(x=>x.rank!==a.rank); else f.unshift(a);
  localStorage.setItem("albumFavorites",JSON.stringify(f));
  updateFavoriteUI(); renderFavorites();
}
function updateFavoriteUI(){
  document.querySelector("#favCount").textContent=favorites().length;
  document.querySelector("#favorite").textContent=isFavorite(currentAlbum)?"♥ Favorite":"♡ Favorite";
}
async function render(){
  const a = randomMode ? albums[Math.floor(Math.random()*albums.length)] : dailyAlbum(currentDate);
  currentAlbum=a;
  document.querySelector("#date").textContent=randomMode?"Random selection":formatDate(currentDate);
  document.querySelector("#artist").textContent=a.artist;
  document.querySelector("#title").textContent=a.title;
  document.querySelector("#year").textContent=a.year || "";
  document.querySelector("#rank").textContent=`ROLLING STONE #${a.rank}`;
  document.querySelector("#label").textContent=a.label||"—";
  document.querySelector("#factYear").textContent=a.year||"—";
  document.querySelector("#factRank").textContent=`#${a.rank}`;
  document.querySelector("#apple").href=`https://music.apple.com/us/search?term=${encodeURIComponent(a.artist+" "+a.title)}`;
  document.querySelector("#spotify").href=`https://open.spotify.com/search/${encodeURIComponent(a.artist+" "+a.title)}`;
  document.querySelector("#cover").src="";
  document.querySelector("#cover").alt=`${a.artist} — ${a.title}`;
  updateFavoriteUI();
  document.querySelector("#wikiTitle").textContent="Loading…";
  document.querySelector("#wikiExtract").textContent="";
  document.querySelector("#wikiLink").style.display="none";
  document.querySelector("#wikiMeta").textContent="";
  const [cover,wiki]=await Promise.all([loadCover(a),loadWikipedia(a)]);
  if(cover) document.querySelector("#cover").src=cover;
  else document.querySelector("#cover").src="data:image/svg+xml,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><rect width="100%" height="100%" fill="#ddd"/><text x="50%" y="48%" text-anchor="middle" font-family="Arial" font-size="34">${a.artist}</text><text x="50%" y="53%" text-anchor="middle" font-family="Arial" font-size="28">${a.title}</text></svg>`);
  if(wiki){
    document.querySelector("#wikiTitle").textContent=wiki.title;
    document.querySelector("#wikiExtract").textContent=wiki.extract;
    document.querySelector("#wikiLink").href=wiki.url;
    document.querySelector("#wikiLink").style.display="inline";
    document.querySelector("#wikiMeta").textContent="Source: English Wikipedia · retrieved live";
  }else{
    document.querySelector("#wikiTitle").textContent="Wikipedia article not found";
    document.querySelector("#wikiExtract").textContent="No matching English Wikipedia summary was found for this album.";
  }
}
function renderFavorites(){
  const list=document.querySelector("#favoritesList"), f=favorites();
  if(!f.length){list.innerHTML="<p>No favorites yet.</p>";return}
  list.innerHTML=f.map(a=>`<div class="favorite-row"><button data-rank="${a.rank}"><strong>${a.artist}</strong> — ${a.title}</button><span>#${a.rank}</span></div>`).join("");
  list.querySelectorAll("button").forEach(b=>b.onclick=()=>{const a=albums.find(x=>x.rank==b.dataset.rank); if(a){currentAlbum=a;randomMode=true;render();document.querySelector("#favoritesPanel").classList.add("hidden")}})
}
document.querySelector("#favorite").onclick=()=>toggleFavorite(currentAlbum);
document.querySelector("#randomBtn").onclick=()=>{randomMode=true;render()};
document.querySelector("#prevBtn").onclick=()=>{randomMode=false;currentDate.setDate(currentDate.getDate()-1);render()};
document.querySelector("#nextBtn").onclick=()=>{randomMode=false;currentDate.setDate(currentDate.getDate()+1);render()};
document.querySelector("#todayBtn").onclick=()=>{randomMode=false;currentDate=new Date();render()};
document.querySelector("#favoritesBtn").onclick=()=>{renderFavorites();document.querySelector("#favoritesPanel").classList.remove("hidden")};
document.querySelector("#closeFavorites").onclick=()=>document.querySelector("#favoritesPanel").classList.add("hidden");

await loadAlbums();
render();
