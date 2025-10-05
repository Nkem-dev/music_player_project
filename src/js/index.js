const apiURL = "https://api.deezer.com";
let currentTrack = null;
let currentPlaylist = [];
let currentIndex = -1;
const audio = document.getElementById("audioPlayer");
const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const repeatBtn = document.getElementById("repeat-btn");
const volumeBtn = document.getElementById("volume-btn");
const progressBar = document.getElementById("progress-bar");
const timeDisplay = document.getElementById("time-display");
const songTitle = document.getElementById("song-title");
const artistName = document.getElementById("artist-name");
const albumCover = document.getElementById("album-cover");
const searchBar = document.getElementById("search-bar");
const searchResults = document.getElementById("search-results");
const albumsList = document.getElementById("albums-list");
const artistsList = document.getElementById("artists-list");
let isRepeating = false;

function fetchJSONP(url, callbackName) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${url}&output=jsonp&callback=${callbackName}`;
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    window[callbackName] = (data) => {
      resolve(data);
      delete window[callbackName];
      document.body.removeChild(script);
    };
    document.body.appendChild(script);
  });
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

audio.addEventListener("timeupdate", () => {
  if (audio.duration && !isNaN(audio.duration)) {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.value = progress;
    timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  }
});

audio.addEventListener("ended", () => {
  if (isRepeating) {
    audio.currentTime = 0;
    audio.play();
  } else if (currentIndex < currentPlaylist.length - 1) {
    currentIndex++;
    playTrack(currentPlaylist[currentIndex]);
  } else {
    currentIndex = 0;
    playTrack(currentPlaylist[currentIndex]);
  }
});

progressBar.addEventListener("input", () => {
  if (audio.duration && !isNaN(audio.duration)) {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  }
});

playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playBtn.src = "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655377/pause-fill_ulp6gf.svg";
  } else {
    audio.pause();
    playBtn.src = "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655354/play-fill_xsmtcu.svg";
  }
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < currentPlaylist.length - 1) {
    currentIndex++;
    playTrack(currentPlaylist[currentIndex]);
  } else if (isRepeating) {
    currentIndex = 0;
    playTrack(currentPlaylist[currentIndex]);
  }
});

prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    playTrack(currentPlaylist[currentIndex]);
  } else if (isRepeating) {
    currentIndex = currentPlaylist.length - 1;
    playTrack(currentPlaylist[currentIndex]);
  }
});

repeatBtn.addEventListener("click", () => {
  isRepeating = !isRepeating;
  repeatBtn.src = isRepeating ? "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655358/repeat-one-line_rv7com.svg" : "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655356/repeat-line_dptjns.svg";
});

volumeBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  volumeBtn.src = audio.muted ? "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655374/volume-mute-fill_immofl.svg" : "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655377/volume-up-fill_ox3jpr.svg";
});

function playTrack(track) {
  if (!track || !track.preview) return;
  currentTrack = track;
  audio.src = track.preview;
  audio.play().catch(err => console.error("Playback error:", err));
  playBtn.src = "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655377/pause-fill_ulp6gf.svg";
  songTitle.textContent = track.title || "Unknown Title";
  artistName.textContent = track.artist?.name || "Unknown Artist";
  albumCover.src = track.album?.cover || "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655384/girl-listening-to-music_rspyib.jpg";
}

searchBar.addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  if (query.length < 2) {
    searchResults.innerHTML = "";
    return;
  }
  try {
    const data = await fetchJSONP(`${apiURL}/search?q=${encodeURIComponent(query)}`, "searchCallback");
    searchResults.innerHTML = "";
    data.data.forEach(track => {
      const div = document.createElement("div");
      div.className = "bg-[#ffffff1a] p-4 rounded-lg cursor-pointer";
      div.innerHTML = `
        <img src="${track.album?.cover || 'https://res.cloudinary.com/dhny41ygh/image/upload/v1759655384/girl-listening-to-music_rspyib.jpg'}" alt="${track.title}" class="w-full h-40 object-cover rounded-lg mb-2" />
        <p class="font-bold">${track.title}</p>
        <p class="text-sm">${track.artist?.name || "Unknown Artist"}</p>
      `;
      div.addEventListener("click", () => {
        currentPlaylist = data.data;
        currentIndex = data.data.findIndex(t => t.id === track.id);
        playTrack(track);
      });
      searchResults.appendChild(div);
    });
  } catch (error) {
    console.error("Search error:", error);
  }
});

async function loadAlbums() {
  try {
    const data = await fetchJSONP(`${apiURL}/chart/0/albums`, "albumsCallback");
    albumsList.innerHTML = "";
    data.data.forEach(album => {
      const div = document.createElement("div");
      div.className = "bg-[#ffffff1a] p-4 rounded-lg cursor-pointer";
      div.innerHTML = `
        <img src="${album.cover || 'https://res.cloudinary.com/dhny41ygh/image/upload/v1759655384/girl-listening-to-music_rspyib.jpg'}" alt="${album.title}" class="w-full h-40 object-cover rounded-lg mb-2" />
        <p class="font-bold">${album.title}</p>
        <p class="text-sm">${album.artist?.name || "Unknown Artist"}</p>
      `;
      div.addEventListener("click", async () => {
        const albumData = await fetchJSONP(`${apiURL}/album/${album.id}`, "albumTracksCallback");
        currentPlaylist = albumData.tracks.data;
        currentIndex = 0;
        playTrack(currentPlaylist[0]);
      });
      albumsList.appendChild(div);
    });
  } catch (error) {
    console.error("Albums error:", error);
  }
}

async function loadArtists() {
  try {
    const data = await fetchJSONP(`${apiURL}/chart/0/artists`, "artistsCallback");
    artistsList.innerHTML = "";
    data.data.forEach(artist => {
      const div = document.createElement("div");
      div.className = "bg-[#ffffff1a] p-4 rounded-lg cursor-pointer";
      div.innerHTML = `
        <img src="${artist.picture_medium || 'https://res.cloudinary.com/dhny41ygh/image/upload/v1759655384/girl-listening-to-music_rspyib.jpg'}" alt="${artist.name}" class="w-full h-40 object-cover rounded-lg mb-2" />
        <p class="font-bold">${artist.name}</p>
      `;
      div.addEventListener("click", async () => {
        const artistData = await fetchJSONP(`${apiURL}/artist/${artist.id}/top?limit=10`, "artistTracksCallback");
        currentPlaylist = artistData.data;
        currentIndex = 0;
        playTrack(currentPlaylist[0]);
      });
      artistsList.appendChild(div);
    });
  } catch (error) {
    console.error("Artists error:", error);
  }
}

loadAlbums();
loadArtists();