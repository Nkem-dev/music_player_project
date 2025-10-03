  
  const apiURL = "https://api.deezer.com"; //stores base Url for Deezer API that the code uses to fetch music data
  let currentTrack = null; //stores current playing track but it is currently set at null because no music is playing
  let currentPlaylist = []; //an array to store list of tracks in a current playlist(starts empty)
  let currentIndex = -1; //tracks the position of the current track in the playlist. it starts at -1 because no track has been selected yet
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
  const favoriteBtn = document.getElementById("favorite-btn");
  const searchBar = document.getElementById("search-bar");
  const searchResults = document.getElementById("search-results");
  const albumsList = document.getElementById("albums-list");
  const artistsList = document.getElementById("artists-list");
  let isRepeating = false; //track if the repeat mode is on. it is set to false by default since no song is repeating automatically until the repeat mode is on

  // Local Storage Helpers
  function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
  }

  function setFavorites(favs) {
    localStorage.setItem("favorites", JSON.stringify(favs));
  }

  // JSONP Fetch: this function fetches data from deezer API using a technique called JSON with padding which loads data from another site. The Deezer API uses JSONP to bypass browser security restrictions that prevent fetching data from different domains
  function fetchJSONP(url, callbackName) { //defines a function with two parameters: url(the web address where the data is and the callbackName is a temporary function that will handle the APIs response)
    return new Promise((resolve, reject) => { //the function returns a promise with two outcomes. resolve and move on to the next step if fetching data is succesfull and reject if it is unsuccessful
      const script = document.createElement("script"); //creates a new script in the webpage and this will be use to load the API data
      script.src = `${url}&output=jsonp&callback=${callbackName}`; //set the src attribute of the script tag to the API url with other parameters. &output=jsonp tells the API to return data in JSONP format so it can be loaded safely. &callback=${callbackName} specifies the name of the function that the API will call with the data
      script.onerror = () => reject(new Error(`Failed to load ${url}`)); //handles error in the script if the data fails to fetch data (load) and the reject will return the error message
      window[callbackName] = (data) => { //this defines the call back function. it creates a temporary function which is the callbackName and attaches it to the window object
        resolve(data); //passes the recieved data to the promise marking it as successful
        delete window[callbackName]; //removes the temporary function to clean up
        document.body.removeChild(script); //removes the script tag from the webpage to keep things tidy
      };
      document.body.appendChild(script); //adds the script to the body tag and this triggers the browser to load the script from the src url, which sends the request to the API
    });
  }

  // Format time
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // Update progress bar and time
  audio.addEventListener("timeupdate", () => {
    if (audio.duration && !isNaN(audio.duration)) {
      const progress = (audio.currentTime / audio.duration) * 100;
      progressBar.value = progress;
      timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
  });

  // Handle track end for repeat
  audio.addEventListener("ended", () => {
    if (isRepeating) {
      // Replay the current track
      audio.currentTime = 0;
      audio.play();
    } else if (currentIndex < currentPlaylist.length - 1) {
      // Play next track in playlist
      currentIndex++;
      playTrack(currentPlaylist[currentIndex]);
    } else {
      // Reset to start of playlist if not repeating
      currentIndex = 0;
      playTrack(currentPlaylist[currentIndex]);
    }
  });

  // Seek track
  progressBar.addEventListener("input", () => {
    if (audio.duration && !isNaN(audio.duration)) {
      audio.currentTime = (progressBar.value / 100) * audio.duration;
    }
  });

  // Play or pause
  playBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
      playBtn.src = "../src/img/pause-fill.svg";
    } else {
      audio.pause();
      playBtn.src = "../src/img/play-fill.svg";
    }
  });

  // Next track
  nextBtn.addEventListener("click", () => {
    if (currentIndex < currentPlaylist.length - 1) {
      currentIndex++;
      playTrack(currentPlaylist[currentIndex]);
    } else if (isRepeating) {
      currentIndex = 0;
      playTrack(currentPlaylist[currentIndex]);
    }
  });

  // Previous track
  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      playTrack(currentPlaylist[currentIndex]);
    } else if (isRepeating) {
      currentIndex = currentPlaylist.length - 1;
      playTrack(currentPlaylist[currentIndex]);
    }
  });

  // Toggle repeat
  repeatBtn.addEventListener("click", () => {
    isRepeating = !isRepeating;
    repeatBtn.src = isRepeating ? "../src/img/repeat-one-line.svg" : "../src/img/repeat-line.svg";
  });

  // Toggle volume
  volumeBtn.addEventListener("click", () => {
    audio.muted = !audio.muted;
    volumeBtn.src = audio.muted ? "../src/img/volume-mute-fill.svg" : "../src/img/volume-up-fill.svg";
  });

  // Toggle favorite
  favoriteBtn.addEventListener("click", () => {
    const favorites = getFavorites();
    if (favorites.some(fav => fav.id === currentTrack.id)) {
      setFavorites(favorites.filter(fav => fav.id !== currentTrack.id));
      favoriteBtn.src = "/src/img/heart-3-line.svg";
    } else {
      favorites.push(currentTrack);
      setFavorites(favorites);
      favoriteBtn.src = "/src/img/heart-fill.svg";
    }
  });

  // Play track
  function playTrack(track) {
    if (!track || !track.preview) return;
    currentTrack = track;
    audio.src = track.preview;
    audio.play().catch(err => console.error("Playback error:", err));
    playBtn.src = "../src/img/pause-fill.svg";
    songTitle.textContent = track.title || "Unknown Title";
    artistName.textContent = track.artist?.name || "Unknown Artist";
    albumCover.src = track.album?.cover || "../src/img/girl-listening-to-music.jpg";
    favoriteBtn.src = getFavorites().some(fav => fav.id === track.id) ? "../src/img/heart-fill.svg" : "../src/img/heart-line.svg";
  }

  // Search functionality
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
          <img src="${track.album?.cover || '../src/img/girl-listening-to-music.jpg'}" alt="${track.title}" class="w-full h-40 object-cover rounded-lg mb-2" />
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

  // Load albums
  async function loadAlbums() {
    try {
      const data = await fetchJSONP(`${apiURL}/chart/0/albums`, "albumsCallback");
      albumsList.innerHTML = "";
      data.data.forEach(album => {
        const div = document.createElement("div");
        div.className = "bg-[#ffffff1a] p-4 rounded-lg cursor-pointer";
        div.innerHTML = `
          <img src="${album.cover || '../src/img/girl-listening-to-music.jpg'}" alt="${album.title}" class="w-full h-40 object-cover rounded-lg mb-2" />
          <p class="font-bold">${album.title}</p>
          <p class="text-sm">${album.artist?.name || "Unknown Artist"}</p>
        `;
        div.addEventListener("click", async () => {
          const albumData = await fetchJSONP(`${apiURL}/album/${album.id}/tracks`, "albumTracksCallback");
          currentPlaylist = albumData.data;
          currentIndex = 0;
          playTrack(currentPlaylist[0]);
        });
        albumsList.appendChild(div);
      });
    } catch (error) {
      console.error("Albums error:", error);
    }
  }

  // Load artists
  async function loadArtists() {
    try {
      const data = await fetchJSONP(`${apiURL}/chart/0/artists`, "artistsCallback");
      artistsList.innerHTML = "";
      data.data.forEach(artist => {
        const div = document.createElement("div");
        div.className = "bg-[#ffffff1a] p-4 rounded-lg cursor-pointer";
        div.innerHTML = `
          <img src="${artist.picture_medium || '../src/img/girl-listening-to-music.jpg'}" alt="${artist.name}" class="w-full h-40 object-cover rounded-lg mb-2" />
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

  // Initialize
  loadAlbums();
  loadArtists();
