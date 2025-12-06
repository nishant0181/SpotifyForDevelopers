// script.js — Netlify-ready version
// Rewritten to use JSON manifests instead of fetching folder listings.
// Assumes:
//  - /src/Songs/index.json  -> { "albums": ["Album1","Album2"] }
//  - /src/Songs/<Album>/index.json -> { "title":"...", "description":"...", "cover":"cover.jpg", "tracks":[ "01 - a.mp3", ... ] }

let currentSong = new Audio();
let songsList = [];
let currntFolder = "";

// keep your original formatTime
function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  seconds = Math.floor(seconds);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Fetch album list (top-level index.json). If missing, fallback to ["Album1"]
async function fetchAlbumsIndex() {
  try {
    const res = await fetch("/src/Songs/index.json");
    if (!res.ok) throw new Error("no index.json");
    const json = await res.json();
    if (Array.isArray(json.albums)) return json.albums;
    // Support older shape: plain array
    if (Array.isArray(json)) return json;
    return Array.isArray(json.albums) ? json.albums : [];
  } catch (err) {
    console.warn("Could not fetch /src/Songs/index.json — falling back to [\"Album1\"]", err);
    return ["Album1"];
  }
}

// Fetch tracks for a particular album by reading its index.json
async function getsongs(folder) {
  currntFolder = folder;
  songsList = [];

  try {
    const res = await fetch(`/src/Songs/${encodeURIComponent(folder)}/index.json`);
    if (!res.ok) throw new Error(`No index.json for ${folder} (${res.status})`);
    const info = await res.json();

    // Expect info.tracks to be an array of filenames (with .mp3)
    songsList = Array.isArray(info.tracks) ? info.tracks.slice() : [];

    updateSongListUI(songsList);
    return songsList;
  } catch (err) {
    console.error("getsongs error:", err);
    updateSongListUI([]);
    return [];
  }
}

// Update song list DOM
function updateSongListUI(list) {
  const songUL = document.querySelector(".songList ul");
  if (!songUL) return;
  songUL.innerHTML = "";

  for (const song of list) {
    const displayName = song.replace(/\.mp3$/i, "").replaceAll("%20", " ");
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="flex frontpart">
        <img class="play-btminlist" src="src/music-svgrepo-com.svg" alt="Music">
        <div class="info"><div>${displayName}</div></div>
      </div>
      <span class="playnow">
        <img class="invert play-btminlist" src="src/play-button-svgrepo-com.svg" alt="Play">
      </span>
    `;
    li.addEventListener("click", () => playMusic(song));
    songUL.appendChild(li);
  }
}

// Play a given track filename (must be the exact filename as in index.json)
async function playMusic(track, pause = false) {
  if (!track || !currntFolder) return;

  // Build Netlify-relative path (no external domain required)
  const src = `/src/Songs/${encodeURIComponent(currntFolder)}/${encodeURIComponent(track)}`;

  currentSong.src = src;

  if (!pause) {
    try {
      await currentSong.play();
      // update play button if element exists
      const playBtn = document.getElementById("play");
      if (playBtn) playBtn.src = "src/pause.svg";
    } catch (err) {
      console.warn("play() blocked or failed:", err);
    }
  }

  const songInfoEl = document.querySelector(".songInfo");
  if (songInfoEl) songInfoEl.innerHTML = decodeURIComponent(track.replace(/\.mp3$/i, ""));

  const timeEl = document.querySelector(".SongTime");
  if (timeEl) timeEl.innerHTML = "00:00 / 00:00";
}

// Display album cards by reading src/Songs/index.json and each album's index.json
async function displayAlbums() {
  const albums = await fetchAlbumsIndex();
  const CardContainer = document.querySelector(".card-container");
  if (!CardContainer) return;
  CardContainer.innerHTML = "";

  for (const folder of albums) {
    try {
      const infoRes = await fetch(`/src/Songs/${encodeURIComponent(folder)}/index.json`);
      if (!infoRes.ok) {
        console.warn(`No index.json for album ${folder}`);
        continue;
      }
      const info = await infoRes.json();
      const cover = info.cover ? `/src/Songs/${encodeURIComponent(folder)}/${encodeURIComponent(info.cover)}` : `src/default-cover.jpg`;

      CardContainer.insertAdjacentHTML(
        "beforeend",
        `
        <div data-folder="${folder}" class="card">
          <div class="play"> 
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 xmlns="http://www.w3.org/2000/svg">
              <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                    stroke-linejoin="round" />
            </svg> 
          </div> 
          <div class="imgforbradius">
            <img class="rounded" src="${cover}" alt="${info.title || folder}">
            <h3>${info.title || folder}</h3>
            <p>${info.description || ""}</p>
          </div>
        </div>
      `
      );
    } catch (err) {
      console.error("displayAlbums error for", folder, err);
    }
  }

  // attach click handlers after cards are added
  Array.from(document.getElementsByClassName("card")).forEach((element) => {
    element.addEventListener("click", async (e) => {
      const folder = element.dataset.folder;
      songsList = await getsongs(folder);
      if (songsList && songsList.length) playMusic(songsList[0], true);
    });
  });
}

// main orchestration
async function main() {
  // try to load albums and first album
  await displayAlbums();

  // load the first album (if any)
  const albums = await fetchAlbumsIndex();
  if (albums.length) {
    await getsongs(albums[0]);
    if (songsList.length) playMusic(songsList[0], true);
  }

  // wire up play button if it exists
  const playEl = document.getElementById("play");
  if (playEl) {
    playEl.addEventListener("click", () => {
      if (currentSong.paused) {
        currentSong.play().catch((e) => console.warn("play blocked:", e));
        playEl.src = "src/pause.svg";
      } else {
        currentSong.pause();
        playEl.src = "src/play-button-svgrepo-com.svg";
      }
    });
  }

  // forward / previous handlers (safe-guard if elements exist)
  const forward = document.getElementById("forward");
  const pervious = document.getElementById("pervious");

  if (forward) {
    forward.addEventListener("click", () => {
      currentSong.pause();
      const cur = decodeURIComponent(currentSong.src.split(`/src/Songs/${currntFolder}/`)[1] || "");
      const index = songsList.indexOf(cur.replace(/\.mp3$/, ""));
      if (index >= 0 && index + 1 < songsList.length) {
        playMusic(songsList[index + 1]);
      }
    });
  }

  if (pervious) {
    pervious.addEventListener("click", () => {
      currentSong.pause();
      const cur = decodeURIComponent(currentSong.src.split(`/src/Songs/${currntFolder}/`)[1] || "");
      const index = songsList.indexOf(cur.replace(/\.mp3$/, ""));
      if (index > 0) playMusic(songsList[index - 1]);
    });
  }

  // update time UI
  currentSong.addEventListener("timeupdate", () => {
    const duration = currentSong.duration || 0;
    document.querySelector(".SongTime").innerHTML = `${formatTime(currentSong.currentTime)}/${formatTime(duration)}`;
    const circle = document.querySelector(".circle");
    if (circle && duration) circle.style.left = (currentSong.currentTime / duration) * 100 + "%";
  });

  // seekbar
  const seekbar = document.querySelector(".seekbar");
  if (seekbar) {
    seekbar.addEventListener("click", (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const duration = currentSong.duration || 0;
      currentSong.currentTime = duration * percent;
      const circle = document.querySelector(".circle");
      if (circle) circle.style.left = percent * 100 + "%";
    });
  }

  // hamburger / close UI
  const hamburger = document.querySelector(".hamburger");
  const leftPanel = document.querySelector(".left");
  if (hamburger && leftPanel) hamburger.addEventListener("click", () => (leftPanel.style.left = "0%"));
  const closeBtn = document.querySelector(".close");
  if (closeBtn && leftPanel) closeBtn.addEventListener("click", () => (leftPanel.style.left = "-100%"));

  // volume
  const volRange = document.querySelector(".volume-range");
  if (volRange) volRange.addEventListener("change", (e) => (currentSong.volume = parseInt(e.target.value) / 100));

  const volImg = document.querySelector(".volume>img");
  if (volImg) {
    volImg.addEventListener("click", (e) => {
      const src = e.target.src || "";
      if (src.includes("volume-max-svgrepo-com.svg")) {
        e.target.src = src.replace("volume-max-svgrepo-com.svg", "mute.svg");
        currentSong.volume = 0;
        if (volRange) volRange.value = 0;
      } else {
        e.target.src = src.replace("mute.svg", "volume-max-svgrepo-com.svg");
        currentSong.volume = 0.1;
        if (volRange) volRange.value = 10;
      }
    });
  }
}

main();
