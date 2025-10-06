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

// use JSONP to bypass security as the API does not support Cross-origin Resource Sharing(CORS). it injects a script tag that calls back a global function
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

// convert time from seconds to mm:ss
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`; 
}

// as the audio plays, the UI updates getting the current progress bar value and the current time duration
audio.addEventListener("timeupdate", () => {
  if (audio.duration && !isNaN(audio.duration)) {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.value = progress;
    timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  }
});

// When the audio ends
audio.addEventListener("ended", () => {
  if (isRepeating) { //if the audio is on repeat, restart and play again
    audio.currentTime = 0; //resets the current time back to 0
    audio.play(); // replay 
  } else if (currentIndex < currentPlaylist.length - 1) {
    currentIndex++; //if there is a next track in the playlist, play next song
    playTrack(currentPlaylist[currentIndex]);
  } else { 
    currentIndex = 0; 
    playTrack(currentPlaylist[currentIndex]); //if no song is on repeat and there is no other track in the playlist, move to the first song and replay again
  }
});

// controls progress bar
progressBar.addEventListener("input", () => {
  if (audio.duration && !isNaN(audio.duration)) { //checks if the audio as a valid duration
    audio.currentTime = (progressBar.value / 100) * audio.duration; //updates the playback position based on the progress bar value
  }
});

// toggle play and pause
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playBtn.src = "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655377/pause-fill_ulp6gf.svg";
  } else {
    audio.pause();
    playBtn.src = "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655354/play-fill_xsmtcu.svg";
  }
});

// play next track
nextBtn.addEventListener("click", () => {
  if (currentIndex < currentPlaylist.length - 1) { //if there is a next track in the playlist
    currentIndex++;//move to next track
    playTrack(currentPlaylist[currentIndex]); //play next track
  } else if (isRepeating) { //if it is repeating, do not play next track and play current song
    currentIndex = 0;
    playTrack(currentPlaylist[currentIndex]); //keep playing current song if repeat is enabled
  }
});

// play previous track
prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) { //if the current index of the track playing is greater than 0
    currentIndex--; //move to previous track index
    playTrack(currentPlaylist[currentIndex]); // play previous track
  } else if (isRepeating) { //if repeating is enabled and no previous track
    currentIndex = currentPlaylist.length - 1;
    playTrack(currentPlaylist[currentIndex]); //keep playing current song 
  }
});

// toggle repeat button
repeatBtn.addEventListener("click", () => {
  isRepeating = !isRepeating;
  repeatBtn.src = isRepeating ? "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655358/repeat-one-line_rv7com.svg" : "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655356/repeat-line_dptjns.svg";
});

// toggle volume button
volumeBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  volumeBtn.src = audio.muted ? "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655374/volume-mute-fill_immofl.svg" : "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655377/volume-up-fill_ox3jpr.svg";
});

// Load and start playback of a given track and update the UI to reflect the current playing track
function playTrack(track) {
  if (!track || !track.preview) return;
  currentTrack = track; //store current playing track in this variable
  audio.src = track.preview; //sets the audio src to track preview url telling the user what to play
  audio.play().catch(err => console.error("Playback error:", err)); //catches any playback error and logs the error to the console
  playBtn.src = "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655377/pause-fill_ulp6gf.svg"; //updates play button to show pause icon
  songTitle.textContent = track.title || "Unknown Title"; //updates the UI from the default title to current song title and if not available, show default song title
  artistName.textContent = track.artist?.name || "Unknown Artist"; //updates the UI with the current artist name and if it is not available, show default artist name
  albumCover.src = track.album?.cover || "https://res.cloudinary.com/dhny41ygh/image/upload/v1759655384/girl-listening-to-music_rspyib.jpg"; //updates the UI to the album cover of the current song and if it is not available show the default album cover
}


// Search music; queries the API as the user types, displays results and lets the user start playing a selected track
searchBar.addEventListener("input", async (e) => {
  const query = e.target.value.trim(); //reads the current value in the search bar and trims whitespace
  if (query.length < 2) { //if the query length is shorter than 2 characters
    searchResults.innerHTML = ""; //clear existing result 
    return;
  }
  try {
    // API call to search for tracks
    const data = await fetchJSONP(`${apiURL}/search?q=${encodeURIComponent(query)}`, "searchCallback"); //performs a JSONP request to API's search endpoint with the encoded query and uses a callbackname and awaits result which should be an object with a data array of tracks
    searchResults.innerHTML = ""; //clears previous search results from the UI
    data.data.forEach(track => { //iterates over each track 
      const div = document.createElement("div"); //creates a UI card for them
      div.className = "bg-[#ffffff1a] p-4 rounded-lg cursor-pointer"; //applies styling to the card
      div.innerHTML = ` 
        <img src="${track.album?.cover || 'https://res.cloudinary.com/dhny41ygh/image/upload/v1759655384/girl-listening-to-music_rspyib.jpg'}" alt="${track.title}" class="w-full h-40 object-cover rounded-lg mb-2" />
        <p class="font-bold">${track.title}</p>
        <p class="text-sm">${track.artist?.name || "Unknown Artist"}</p>
      `; //populates content
      div.addEventListener("click", () => {
        currentPlaylist = data.data; //sets current playlist to the full search results
        currentIndex = data.data.findIndex(t => t.id === track.id); //fimds the index of the clicked track within the search results
        playTrack(track); //plays selected track
      });
      searchResults.appendChild(div); //appends the created card to the results container
    });
  } catch (error) {
    console.error("Search error:", error); //logs error that occurs during fetch
  }
});

// fetch albums from the API and updates the UI
async function loadAlbums() {
  try {
    const data = await fetchJSONP(`${apiURL}/chart/0/albums`, "albumsCallback"); //performs a JSONP request to retrieve list of albums and awaits the response
    albumsList.innerHTML = ""; //clears any existing albums from albumsList Container
    data.data.forEach(album => { //iterates over the array of albums
      const div = document.createElement("div"); //create a card element for each album
      div.className = "bg-[#ffffff1a] p-4 rounded-lg cursor-pointer"; //album card styling
      div.innerHTML = `
        <img src="${album.cover || 'https://res.cloudinary.com/dhny41ygh/image/upload/v1759655384/girl-listening-to-music_rspyib.jpg'}" alt="${album.title}" class="w-full h-20 object-cover rounded-lg mb-2" />
        <p class="font-bold">${album.title}</p>
        <p class="text-sm">${album.artist?.name || "Unknown Artist"}</p>
      `; //populate content and uses the default content as fallback contents
      div.addEventListener("click", async () => {
        // when the album card is clicked the API fetches  tracks for that specific album with JSONP
        const albumData = await fetchJSONP(`${apiURL}/album/${album.id}`, "albumTracksCallback");
        currentPlaylist = albumData.tracks.data; //sets current playlist to the tracks of the clicked album
        currentIndex = 0; //resets the index to the first track
        playTrack(currentPlaylist[0]); //plays first track in the album
      });
      albumsList.appendChild(div); //adds album card to the UI
    });
  } catch (error) {
    console.error("Albums error:", error); //logs error to the console if fetching albums fails
  }
}

// fetches artists from the API and builds the UI 
async function loadArtists() {
  try {
    // retrieves list of artists and awaits response
    const data = await fetchJSONP(`${apiURL}/chart/0/artists`, "artistsCallback");
    artistsList.innerHTML = ""; //clears existing artists from the artist container
    data.data.forEach(artist => { //iterates over the list of artists
      const div = document.createElement("div"); //create card element
      div.className = "bg-[#ffffff1a] p-4 rounded-lg cursor-pointer";
      div.innerHTML = `
        <img src="${artist.picture_medium || 'https://res.cloudinary.com/dhny41ygh/image/upload/v1759655384/girl-listening-to-music_rspyib.jpg'}" alt="${artist.name}" class="w-full h-40 object-cover rounded-lg mb-2" />
        <p class="font-bold">${artist.name}</p>
      `; //populate content and updates the UI and sets the default contents as fallback
      div.addEventListener("click", async () => {
        const artistData = await fetchJSONP(`${apiURL}/artist/${artist.id}/top?limit=10`, "artistTracksCallback"); //fetches top 10 tracks of that artist and it is limited to 10
        currentPlaylist = artistData.data; //sets current playlist to fetched tracks
        currentIndex = 0; //resets index to the first track
        playTrack(currentPlaylist[0]); //starts playing first track in the artists top tracks
      });
      artistsList.appendChild(div); //updates the artist track to the UI
    });
  } catch (error) {
    console.error("Artists error:", error); //logs error to the console if there is an error fetching artists
  }
}

loadAlbums(); //loads albums  when the script runs
loadArtists(); //loads artists when the script runs