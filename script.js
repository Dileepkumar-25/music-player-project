/**
 * SoundPulse - Modern Music Player Web Application
 * Full-featured streaming-style player with Web Audio API, Playlists,
 * Local Storage persistence, Drag-and-drop local audio upload, and Rich UI.
 */

// ============================================================================
// 1. Initial Music Catalog Data
// ============================================================================
const INITIAL_TRACKS = [
  {
    id: "sp-track-1",
    title: "Night Owl",
    artist: "Broke For Free",
    album: "Directionless EP",
    genre: "Lofi",
    duration: 198, // 3:18
    cover: "assets/images/cover-1.jpg",
    src: "assets/music/night-owl.mp3"
  },
  {
    id: "sp-track-2",
    title: "Cosmic Journey",
    artist: "SoundHelix",
    album: "Stellar Horizons",
    genre: "Synthwave",
    duration: 425, // 7:05
    cover: "assets/images/cover-2.jpg",
    src: "assets/music/cosmic-journey.mp3"
  },
  {
    id: "sp-track-3",
    title: "Acoustic Breeze",
    artist: "Rafael Reis",
    album: "Wooden Strings",
    genre: "Acoustic",
    duration: 157, // 2:37
    cover: "assets/images/cover-3.jpg",
    src: "assets/music/acoustic-breeze.mp3"
  },
  {
    id: "sp-track-4",
    title: "Chill Groove",
    artist: "SoundHelix",
    album: "Velvet Lounge",
    genre: "Chill",
    duration: 372, // 6:12
    cover: "assets/images/cover-4.jpg",
    src: "assets/music/chill-groove.mp3"
  },
  {
    id: "sp-track-5",
    title: "Midnight Drive",
    artist: "SoundHelix",
    album: "Neon Highways",
    genre: "Synthwave",
    duration: 302, // 5:02
    cover: "assets/images/cover-5.jpg",
    src: "assets/music/midnight-drive.mp3"
  },
  {
    id: "sp-track-6",
    title: "Urban Lights",
    artist: "SoundHelix",
    album: "Metropolis Glow",
    genre: "Electronic",
    duration: 344, // 5:44
    cover: "assets/images/cover-6.jpg",
    src: "assets/music/urban-lights.mp3"
  },
  {
    id: "sp-track-7",
    title: "Synth Echoes",
    artist: "Sound Demo",
    album: "Cyber Beats",
    genre: "Electronic",
    duration: 45, // 0:45
    cover: "assets/images/cover-7.jpg",
    src: "assets/music/synth-echoes.mp3"
  },
  {
    id: "sp-track-8",
    title: "Deep Resonance",
    artist: "SoundHelix",
    album: "Atmospheric Dreams",
    genre: "Chill",
    duration: 270, // 4:30
    cover: "assets/images/cover-8.jpg",
    src: "assets/music/chill-groove.mp3"
  }
];

// Initial Curated Playlists
const DEFAULT_PLAYLISTS = [
  {
    id: "playlist-chill",
    name: "Lofi & Chill Lounge",
    desc: "Soft downtempo beats for studying, relaxing, and code focus.",
    trackIds: ["sp-track-1", "sp-track-4", "sp-track-8"],
    createdAt: Date.now()
  },
  {
    id: "playlist-synth",
    name: "Synthwave Dreams",
    desc: "Retro-futuristic electronic anthems for late-night inspiration.",
    trackIds: ["sp-track-2", "sp-track-5", "sp-track-6", "sp-track-7"],
    createdAt: Date.now()
  }
];

// ============================================================================
// 2. Application State
// ============================================================================
class MusicPlayerApp {
  constructor() {
    // Audio element
    this.audio = document.getElementById("audioElement");

    // Tracks collection
    this.tracks = this.loadTracks();
    this.playlists = this.loadPlaylists();
    this.favorites = new Set(this.loadFavorites());
    this.recentlyPlayed = this.loadRecentlyPlayed();

    // Playback state
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.isShuffle = this.loadPref("sp_shuffle", false);
    // repeatModes: 'off', 'all', 'one'
    this.repeatMode = this.loadPref("sp_repeat", "all");
    this.volume = parseFloat(this.loadPref("sp_volume", "0.8"));
    this.isMuted = false;
    this.previousVolume = this.volume;

    // View state
    this.currentView = "home"; // 'home', 'library', 'favorites', 'recentlyPlayed', or playlist id
    this.selectedPlaylistId = null;
    this.currentGenre = "all";
    this.searchQuery = "";
    this.isExpanded = false;
    this.isVisualizerBar = true;

    // Web Audio Visualizer
    this.audioContext = null;
    this.analyser = null;
    this.sourceNode = null;
    this.visualizerCanvas = document.getElementById("visualizerCanvas");
    this.visualizerCtx = this.visualizerCanvas ? this.visualizerCanvas.getContext("2d") : null;
    this.expandedCanvas = document.getElementById("expandedCanvas");
    this.expandedCtx = this.expandedCanvas ? this.expandedCanvas.getContext("2d") : null;
    this.isVisualizerInitialized = false;

    // Drag-seeking state
    this.isDraggingProgress = false;

    // Active playlist track context for next/prev
    this.activeQueue = [...this.tracks];

    // Initialize UI and Engine
    this.initElements();
    this.initAudioEngine();
    this.initEvents();
    this.renderAll();
    this.initVisualizer();

    // Restore last track if available
    const lastTrackId = this.loadPref("sp_last_track_id", null);
    if (lastTrackId) {
      const idx = this.tracks.findIndex(t => t.id === lastTrackId);
      if (idx !== -1) {
        this.loadTrack(idx, false);
      } else {
        this.loadTrack(0, false);
      }
    } else {
      this.loadTrack(0, false);
    }
  }

  // ==========================================================================
  // LocalStorage Helpers
  // ==========================================================================
  loadTracks() {
    const custom = localStorage.getItem("sp_custom_tracks");
    if (custom) {
      try {
        const parsed = JSON.parse(custom);
        return [...INITIAL_TRACKS, ...parsed];
      } catch (e) {
        console.error("Failed to parse custom tracks", e);
      }
    }
    return [...INITIAL_TRACKS];
  }

  saveCustomTracks(newTrack) {
    const existing = JSON.parse(localStorage.getItem("sp_custom_tracks") || "[]");
    existing.push(newTrack);
    localStorage.setItem("sp_custom_tracks", JSON.stringify(existing));
  }

  loadPlaylists() {
    const stored = localStorage.getItem("sp_playlists");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to load playlists", e);
      }
    }
    localStorage.setItem("sp_playlists", JSON.stringify(DEFAULT_PLAYLISTS));
    return DEFAULT_PLAYLISTS;
  }

  savePlaylists() {
    localStorage.setItem("sp_playlists", JSON.stringify(this.playlists));
  }

  loadFavorites() {
    const stored = localStorage.getItem("sp_favorites");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return ["sp-track-1", "sp-track-3"];
  }

  saveFavorites() {
    localStorage.setItem("sp_favorites", JSON.stringify([...this.favorites]));
  }

  loadRecentlyPlayed() {
    const stored = localStorage.getItem("sp_recent");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return ["sp-track-1", "sp-track-2", "sp-track-3"];
  }

  saveRecentlyPlayed() {
    localStorage.setItem("sp_recent", JSON.stringify(this.recentlyPlayed));
  }

  savePref(key, val) {
    localStorage.setItem(key, typeof val === "object" ? JSON.stringify(val) : val);
  }

  loadPref(key, defaultVal) {
    const val = localStorage.getItem(key);
    return val !== null ? val : defaultVal;
  }

  // ==========================================================================
  // DOM Elements Caching
  // ==========================================================================
  initElements() {
    // Navigation
    this.navButtons = document.querySelectorAll(".nav-btn");
    this.mobileNavButtons = document.querySelectorAll(".mobile-nav-btn");
    this.viewPanels = document.querySelectorAll(".view-panel");
    this.sidebarPlaylistsList = document.getElementById("sidebarPlaylistsList");
    this.libraryCount = document.getElementById("libraryCount");
    this.favoritesCount = document.getElementById("favoritesCount");

    // Top Bar
    this.searchInput = document.getElementById("searchInput");
    this.clearSearchBtn = document.getElementById("clearSearchBtn");
    this.genrePills = document.querySelectorAll(".genre-pill");
    this.mobileMenuBtn = document.getElementById("mobileMenuBtn");
    this.closeSidebarBtn = document.getElementById("closeSidebarBtn");
    this.sidebar = document.getElementById("sidebar");

    // Views Containers
    this.heroTitle = document.getElementById("heroTitle");
    this.heroArtist = document.getElementById("heroArtist");
    this.heroCoverImg = document.getElementById("heroCoverImg");
    this.heroPlayBtn = document.getElementById("heroPlayBtn");
    this.heroLikeBtn = document.getElementById("heroLikeBtn");
    this.quickGrid = document.getElementById("quickGrid");
    this.featuredCardsGrid = document.getElementById("featuredCardsGrid");
    this.curatedPlaylistsGrid = document.getElementById("curatedPlaylistsGrid");

    this.tracksTableBody = document.getElementById("tracksTableBody");
    this.libraryMetaText = document.getElementById("libraryMetaText");
    this.playAllLibraryBtn = document.getElementById("playAllLibraryBtn");
    this.shuffleLibraryBtn = document.getElementById("shuffleLibraryBtn");

    this.favoritesTableBody = document.getElementById("favoritesTableBody");
    this.favoritesMetaText = document.getElementById("favoritesMetaText");
    this.favoritesEmptyState = document.getElementById("favoritesEmptyState");
    this.playFavoritesBtn = document.getElementById("playFavoritesBtn");

    this.recentTableBody = document.getElementById("recentTableBody");
    this.recentEmptyState = document.getElementById("recentEmptyState");
    this.clearRecentBtn = document.getElementById("clearRecentBtn");

    this.playlistTitle = document.getElementById("playlistTitle");
    this.playlistMeta = document.getElementById("playlistMeta");
    this.playlistDesc = document.getElementById("playlistDesc");
    this.playlistTableBody = document.getElementById("playlistTableBody");
    this.playlistEmptyState = document.getElementById("playlistEmptyState");
    this.playCustomPlaylistBtn = document.getElementById("playCustomPlaylistBtn");
    this.deletePlaylistBtn = document.getElementById("deletePlaylistBtn");

    // Bottom Player Elements
    this.playerCover = document.getElementById("playerCover");
    this.playerTitle = document.getElementById("playerTitle");
    this.playerArtist = document.getElementById("playerArtist");
    this.playerLikeBtn = document.getElementById("playerLikeBtn");
    this.playerEqualizer = document.getElementById("playerEqualizer");
    this.playPauseBtn = document.getElementById("playPauseBtn");
    this.playSvg = document.getElementById("playSvg");
    this.pauseSvg = document.getElementById("pauseSvg");
    this.prevBtn = document.getElementById("prevBtn");
    this.nextBtn = document.getElementById("nextBtn");
    this.shuffleBtn = document.getElementById("shuffleBtn");
    this.repeatBtn = document.getElementById("repeatBtn");
    this.repeatOneBadge = document.getElementById("repeatOneBadge");
    this.currentTimeLabel = document.getElementById("currentTime");
    this.totalDurationLabel = document.getElementById("totalDuration");
    this.progressBarWrapper = document.getElementById("progressBarWrapper");
    this.progressBarFill = document.getElementById("progressBarFill");
    this.progressHandle = document.getElementById("progressHandle");
    this.seekTooltip = document.getElementById("seekTooltip");
    this.volumeSlider = document.getElementById("volumeSlider");
    this.muteBtn = document.getElementById("muteBtn");
    this.volHighSvg = document.getElementById("volHighSvg");
    this.volMuteSvg = document.getElementById("volMuteSvg");
    this.expandPlayerBtn = document.getElementById("expandPlayerBtn");
    this.toggleVisualizerBarBtn = document.getElementById("toggleVisualizerBarBtn");

    // Expanded Player Elements
    this.expandedPlayerModal = document.getElementById("expandedPlayerModal");
    this.closeExpandedBtn = document.getElementById("closeExpandedBtn");
    this.expandedCover = document.getElementById("expandedCover");
    this.vinylRecord = document.getElementById("vinylRecord");
    this.expandedTitle = document.getElementById("expandedTitle");
    this.expandedArtist = document.getElementById("expandedArtist");
    this.expandedAlbum = document.getElementById("expandedAlbum");
    this.expandedLikeBtn = document.getElementById("expandedLikeBtn");
    this.expandedPlayPauseBtn = document.getElementById("expandedPlayPauseBtn");
    this.expandedPlaySvg = document.getElementById("expandedPlaySvg");
    this.expandedPauseSvg = document.getElementById("expandedPauseSvg");
    this.expandedPrevBtn = document.getElementById("expandedPrevBtn");
    this.expandedNextBtn = document.getElementById("expandedNextBtn");
    this.expandedShuffleBtn = document.getElementById("expandedShuffleBtn");
    this.expandedRepeatBtn = document.getElementById("expandedRepeatBtn");
    this.expandedRepeatOneBadge = document.getElementById("expandedRepeatOneBadge");
    this.expandedCurrentTime = document.getElementById("expandedCurrentTime");
    this.expandedTotalDuration = document.getElementById("expandedTotalDuration");
    this.expandedProgressBarWrapper = document.getElementById("expandedProgressBarWrapper");
    this.expandedProgressBarFill = document.getElementById("expandedProgressBarFill");
    this.expandedProgressHandle = document.getElementById("expandedProgressHandle");
    this.expandedPlayingFrom = document.getElementById("expandedPlayingFrom");

    // Modals
    this.createPlaylistBtn = document.getElementById("createPlaylistBtn");
    this.createPlaylistModal = document.getElementById("createPlaylistModal");
    this.closeCreatePlaylistModal = document.getElementById("closeCreatePlaylistModal");
    this.cancelPlaylistBtn = document.getElementById("cancelPlaylistBtn");
    this.createPlaylistForm = document.getElementById("createPlaylistForm");

    this.addToPlaylistModal = document.getElementById("addToPlaylistModal");
    this.closeAddToPlaylistModal = document.getElementById("closeAddToPlaylistModal");
    this.doneAddToPlaylistBtn = document.getElementById("doneAddToPlaylistBtn");
    this.playlistOptionsList = document.getElementById("playlistOptionsList");
    this.addToPlaylistSongTitle = document.getElementById("addToPlaylistSongTitle");

    this.shortcutsBtn = document.getElementById("shortcutsBtn");
    this.expandedShortcutsBtn = document.getElementById("expandedShortcutsBtn");
    this.shortcutsModal = document.getElementById("shortcutsModal");
    this.closeShortcutsModal = document.getElementById("closeShortcutsModal");
    this.doneShortcutsBtn = document.getElementById("doneShortcutsBtn");

    // Upload & Drag-and-drop
    this.uploadTrackBtn = document.getElementById("uploadTrackBtn");
    this.mobileUploadBtn = document.getElementById("mobileUploadBtn");
    this.localAudioInput = document.getElementById("localAudioInput");
    this.dropZoneOverlay = document.getElementById("dropZoneOverlay");
    this.mainContent = document.getElementById("mainContent");

    // Toast
    this.toastContainer = document.getElementById("toastContainer");
  }

  // ==========================================================================
  // Audio Engine Lifecycle
  // ==========================================================================
  initAudioEngine() {
    this.audio.volume = this.volume;
    this.volumeSlider.value = this.volume;

    // Track time update
    this.audio.addEventListener("timeupdate", () => {
      if (!this.isDraggingProgress && !isNaN(this.audio.duration) && this.audio.duration > 0) {
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.updateProgressBar(percent, this.audio.currentTime, this.audio.duration);
      }
    });

    // Metadata loaded
    this.audio.addEventListener("loadedmetadata", () => {
      this.totalDurationLabel.textContent = this.formatTime(this.audio.duration);
      this.expandedTotalDuration.textContent = this.formatTime(this.audio.duration);
    });

    // Playback ended
    this.audio.addEventListener("ended", () => {
      this.handleTrackEnded();
    });

    // Audio Play event
    this.audio.addEventListener("play", () => {
      this.isPlaying = true;
      this.updatePlayStateUI(true);
      this.resumeAudioContext();
    });

    // Audio Pause event
    this.audio.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updatePlayStateUI(false);
    });

    // Error handling
    this.audio.addEventListener("error", (e) => {
      console.warn("Audio playback notice:", e);
      const curr = this.tracks[this.currentTrackIndex];
      this.showToast(`Error playing "${curr ? curr.title : 'track'}". Trying next...`, "error");
      setTimeout(() => this.playNextTrack(), 1500);
    });

    // Media Session Support (Controls on lockscreen & media keys)
    if ("mediaSession" in navigator) {
      navigator.mediaSession.setActionHandler("play", () => this.playTrack());
      navigator.mediaSession.setActionHandler("pause", () => this.pauseTrack());
      navigator.mediaSession.setActionHandler("previoustrack", () => this.playPrevTrack());
      navigator.mediaSession.setActionHandler("nexttrack", () => this.playNextTrack());
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        this.seekRelative(-(details.seekOffset || 5));
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        this.seekRelative(details.seekOffset || 5);
      });
    }

    this.updateControlsUI();
  }

  // ==========================================================================
  // Web Audio API Visualizer Setup
  // ==========================================================================
  initVisualizer() {
    const setup = () => {
      if (this.isVisualizerInitialized) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 128;
        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.isVisualizerInitialized = true;
        this.drawVisualizer();
      } catch (err) {
        console.log("AudioContext requires user gesture or direct media:", err);
      }
    };

    // User gesture trigger
    window.addEventListener("click", setup, { once: true });
    window.addEventListener("keydown", setup, { once: true });

    // Fallback animation if AudioContext is pending
    this.startFallbackAnimation();
  }

  resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  drawVisualizer() {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      requestAnimationFrame(render);
      this.analyser.getByteFrequencyData(dataArray);

      // Render Bottom Bar Visualizer Canvas
      if (this.visualizerCanvas && this.visualizerCtx && this.isVisualizerBar) {
        const w = (this.visualizerCanvas.width = this.visualizerCanvas.offsetWidth);
        const h = (this.visualizerCanvas.height = this.visualizerCanvas.offsetHeight);
        this.visualizerCtx.clearRect(0, 0, w, h);

        const barWidth = (w / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * h * 0.9;
          this.visualizerCtx.fillStyle = `rgba(16, 185, 129, ${0.15 + (dataArray[i] / 255) * 0.4})`;
          this.visualizerCtx.fillRect(x, h - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      }

      // Render Expanded Player Visualizer Canvas
      if (this.isExpanded && this.expandedCanvas && this.expandedCtx) {
        const ew = (this.expandedCanvas.width = this.expandedCanvas.offsetWidth);
        const eh = (this.expandedCanvas.height = this.expandedCanvas.offsetHeight);
        this.expandedCtx.clearRect(0, 0, ew, eh);

        const barCount = 40;
        const barWidth = ew / barCount - 3;
        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i % bufferLength] || 0;
          const barHeight = Math.max(4, (val / 255) * eh * 0.95);
          const x = i * (barWidth + 3);
          const y = eh - barHeight;

          // Gradient color for bars
          const grad = this.expandedCtx.createLinearGradient(0, y, 0, eh);
          grad.addColorStop(0, "#10b981");
          grad.addColorStop(1, "#6366f1");

          this.expandedCtx.fillStyle = grad;
          this.expandedCtx.beginPath();
          this.expandedCtx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          this.expandedCtx.fill();
        }
      }
    };
    render();
  }

  startFallbackAnimation() {
    // Elegant procedural wave animation if AudioContext is idle
    let step = 0;
    const animateFallback = () => {
      if (!this.analyser && this.isPlaying) {
        step += 0.05;
        if (this.expandedCanvas && this.expandedCtx && this.isExpanded) {
          const ew = this.expandedCanvas.width;
          const eh = this.expandedCanvas.height;
          this.expandedCtx.clearRect(0, 0, ew, eh);
          const barCount = 36;
          const barWidth = ew / barCount - 3;

          for (let i = 0; i < barCount; i++) {
            const h = Math.abs(Math.sin(step + i * 0.3)) * (eh * 0.8) + 8;
            this.expandedCtx.fillStyle = "#10b981";
            this.expandedCtx.fillRect(i * (barWidth + 3), eh - h, barWidth, h);
          }
        }
      }
      requestAnimationFrame(animateFallback);
    };
    animateFallback();
  }

  // ==========================================================================
  // Track Loading & Playback Operations
  // ==========================================================================
  loadTrack(index, autoPlay = true) {
    if (index < 0 || index >= this.tracks.length) return;

    this.currentTrackIndex = index;
    const track = this.tracks[index];

    this.audio.src = track.src;
    this.audio.load();

    // Update bottom player
    this.playerCover.src = track.cover;
    this.playerTitle.textContent = track.title;
    this.playerArtist.textContent = track.artist;
    this.totalDurationLabel.textContent = this.formatTime(track.duration);
    this.currentTimeLabel.textContent = "0:00";
    this.progressBarFill.style.width = "0%";
    this.progressHandle.style.left = "0%";

    // Update expanded player
    this.expandedCover.src = track.cover;
    this.expandedTitle.textContent = track.title;
    this.expandedArtist.textContent = track.artist;
    this.expandedAlbum.textContent = `${track.album} • ${track.genre}`;
    this.expandedTotalDuration.textContent = this.formatTime(track.duration);
    this.expandedCurrentTime.textContent = "0:00";
    this.expandedProgressBarFill.style.width = "0%";
    this.expandedProgressHandle.style.left = "0%";

    // Update like button state
    this.updateLikeButtons();

    // Update MediaSession metadata
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: [{ src: track.cover, sizes: "512x512", type: "image/jpeg" }]
      });
    }

    // Save as last track
    this.savePref("sp_last_track_id", track.id);

    // Highlight row across tables
    this.highlightActiveTableRow();

    if (autoPlay) {
      this.playTrack();
      this.addToRecentlyPlayed(track.id);
    }
  }

  playTrack() {
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.updatePlayStateUI(true);
    }).catch(err => {
      console.log("Playback error or user interaction needed:", err);
    });
  }

  pauseTrack() {
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayStateUI(false);
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pauseTrack();
    } else {
      this.playTrack();
    }
  }

  playNextTrack() {
    if (this.tracks.length === 0) return;

    if (this.isShuffle) {
      let nextIdx = Math.floor(Math.random() * this.tracks.length);
      if (this.tracks.length > 1 && nextIdx === this.currentTrackIndex) {
        nextIdx = (nextIdx + 1) % this.tracks.length;
      }
      this.loadTrack(nextIdx, true);
      return;
    }

    let nextIndex = this.currentTrackIndex + 1;
    if (nextIndex >= this.tracks.length) {
      if (this.repeatMode === "all") {
        nextIndex = 0;
      } else {
        this.pauseTrack();
        return;
      }
    }
    this.loadTrack(nextIndex, true);
  }

  playPrevTrack() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }

    let prevIndex = this.currentTrackIndex - 1;
    if (prevIndex < 0) {
      prevIndex = this.tracks.length - 1;
    }
    this.loadTrack(prevIndex, true);
  }

  handleTrackEnded() {
    if (this.repeatMode === "one") {
      this.audio.currentTime = 0;
      this.playTrack();
    } else {
      this.playNextTrack();
    }
  }

  seekRelative(seconds) {
    if (isNaN(this.audio.duration)) return;
    const target = Math.max(0, Math.min(this.audio.duration, this.audio.currentTime + seconds));
    this.audio.currentTime = target;
  }

  seekToPercent(percent) {
    if (!isNaN(this.audio.duration) && this.audio.duration > 0) {
      const time = (percent / 100) * this.audio.duration;
      this.audio.currentTime = time;
      this.updateProgressBar(percent, time, this.audio.duration);
    }
  }

  updateProgressBar(percent, currentTime, duration) {
    const pct = Math.max(0, Math.min(100, percent));
    this.progressBarFill.style.width = `${pct}%`;
    this.progressHandle.style.left = `${pct}%`;
    this.expandedProgressBarFill.style.width = `${pct}%`;
    this.expandedProgressHandle.style.left = `${pct}%`;

    const formatted = this.formatTime(currentTime);
    this.currentTimeLabel.textContent = formatted;
    this.expandedCurrentTime.textContent = formatted;
  }

  // ==========================================================================
  // Controls & UI Helpers
  // ==========================================================================
  updatePlayStateUI(playing) {
    if (playing) {
      this.playSvg.style.display = "none";
      this.pauseSvg.style.display = "block";
      this.expandedPlaySvg.style.display = "none";
      this.expandedPauseSvg.style.display = "block";
      this.playerEqualizer.classList.add("active");
      this.vinylRecord.classList.add("spinning");
    } else {
      this.playSvg.style.display = "block";
      this.pauseSvg.style.display = "none";
      this.expandedPlaySvg.style.display = "block";
      this.expandedPauseSvg.style.display = "none";
      this.playerEqualizer.classList.remove("active");
      this.vinylRecord.classList.remove("spinning");
    }
    this.highlightActiveTableRow();
  }

  updateControlsUI() {
    // Shuffle button
    if (this.isShuffle) {
      this.shuffleBtn.classList.add("active");
      this.expandedShuffleBtn.classList.add("active");
    } else {
      this.shuffleBtn.classList.remove("active");
      this.expandedShuffleBtn.classList.remove("active");
    }

    // Repeat button
    this.repeatBtn.classList.remove("active");
    this.expandedRepeatBtn.classList.remove("active");
    this.repeatOneBadge.classList.remove("visible");
    this.expandedRepeatOneBadge.classList.remove("visible");

    if (this.repeatMode === "all") {
      this.repeatBtn.classList.add("active");
      this.expandedRepeatBtn.classList.add("active");
    } else if (this.repeatMode === "one") {
      this.repeatBtn.classList.add("active");
      this.expandedRepeatBtn.classList.add("active");
      this.repeatOneBadge.classList.add("visible");
      this.expandedRepeatOneBadge.classList.add("visible");
    }
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.savePref("sp_shuffle", this.isShuffle);
    this.updateControlsUI();
    this.showToast(this.isShuffle ? "Shuffle Mode ON" : "Shuffle Mode OFF", "info");
  }

  cycleRepeat() {
    if (this.repeatMode === "all") {
      this.repeatMode = "one";
      this.showToast("Repeat: Current Track", "info");
    } else if (this.repeatMode === "one") {
      this.repeatMode = "off";
      this.showToast("Repeat: OFF", "info");
    } else {
      this.repeatMode = "all";
      this.showToast("Repeat: All Tracks", "info");
    }
    this.savePref("sp_repeat", this.repeatMode);
    this.updateControlsUI();
  }

  setVolume(val) {
    const clamped = Math.max(0, Math.min(1, val));
    this.volume = clamped;
    this.audio.volume = clamped;
    this.volumeSlider.value = clamped;
    this.savePref("sp_volume", clamped.toString());

    if (clamped === 0) {
      this.isMuted = true;
      this.volHighSvg.style.display = "none";
      this.volMuteSvg.style.display = "block";
    } else {
      this.isMuted = false;
      this.volHighSvg.style.display = "block";
      this.volMuteSvg.style.display = "none";
    }
  }

  toggleMute() {
    if (this.isMuted) {
      this.setVolume(this.previousVolume || 0.8);
      this.showToast("Unmuted", "info");
    } else {
      this.previousVolume = this.volume;
      this.setVolume(0);
      this.showToast("Muted", "info");
    }
  }

  // ==========================================================================
  // Favorites Management
  // ==========================================================================
  toggleFavorite(trackId) {
    if (this.favorites.has(trackId)) {
      this.favorites.delete(trackId);
      this.showToast("Removed from Favorites", "info");
    } else {
      this.favorites.add(trackId);
      this.showToast("Added to Favorites ❤️", "success");
    }
    this.saveFavorites();
    this.updateLikeButtons();
    this.renderFavoritesView();
    this.updateCounts();
  }

  updateLikeButtons() {
    const curr = this.tracks[this.currentTrackIndex];
    if (!curr) return;
    const isLiked = this.favorites.has(curr.id);

    if (isLiked) {
      this.playerLikeBtn.classList.add("liked");
      this.expandedLikeBtn.classList.add("liked");
      this.heroLikeBtn.classList.add("liked");
      this.heroLikeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
        <span>Liked</span>
      `;
    } else {
      this.playerLikeBtn.classList.remove("liked");
      this.expandedLikeBtn.classList.remove("liked");
      this.heroLikeBtn.classList.remove("liked");
      this.heroLikeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
        <span>Add to Favorites</span>
      `;
    }
  }

  // ==========================================================================
  // Recently Played History
  // ==========================================================================
  addToRecentlyPlayed(trackId) {
    this.recentlyPlayed = [trackId, ...this.recentlyPlayed.filter(id => id !== trackId)].slice(0, 30);
    this.saveRecentlyPlayed();
    this.renderRecentlyPlayedView();
    this.renderQuickGrid();
  }

  clearRecentlyPlayed() {
    this.recentlyPlayed = [];
    this.saveRecentlyPlayed();
    this.renderRecentlyPlayedView();
    this.renderQuickGrid();
    this.showToast("History cleared", "info");
  }

  // ==========================================================================
  // Custom Playlists Operations
  // ==========================================================================
  createPlaylist(name, desc) {
    const newPlaylist = {
      id: `pl-${Date.now()}`,
      name: name.trim(),
      desc: desc.trim(),
      trackIds: [],
      createdAt: Date.now()
    };
    this.playlists.push(newPlaylist);
    this.savePlaylists();
    this.renderSidebarPlaylists();
    this.renderHomePlaylists();
    this.showToast(`Created playlist "${newPlaylist.name}"`, "success");
    this.switchView(newPlaylist.id);
  }

  deletePlaylist(playlistId) {
    const pl = this.playlists.find(p => p.id === playlistId);
    if (!pl) return;
    if (confirm(`Are you sure you want to delete "${pl.name}"?`)) {
      this.playlists = this.playlists.filter(p => p.id !== playlistId);
      this.savePlaylists();
      this.renderSidebarPlaylists();
      this.renderHomePlaylists();
      this.showToast(`Deleted "${pl.name}"`, "info");
      this.switchView("library");
    }
  }

  toggleSongInPlaylist(playlistId, trackId) {
    const pl = this.playlists.find(p => p.id === playlistId);
    if (!pl) return;

    if (pl.trackIds.includes(trackId)) {
      pl.trackIds = pl.trackIds.filter(id => id !== trackId);
      this.showToast(`Removed from "${pl.name}"`, "info");
    } else {
      pl.trackIds.push(trackId);
      this.showToast(`Added to "${pl.name}"`, "success");
    }
    this.savePlaylists();
    this.renderSidebarPlaylists();
    this.renderHomePlaylists();
    if (this.currentView === playlistId) {
      this.renderPlaylistView(playlistId);
    }
  }

  openAddToPlaylistModal(trackId) {
    const track = this.tracks.find(t => t.id === trackId);
    if (!track) return;

    this.addToPlaylistSongTitle.textContent = `Add "${track.title}" to:`;
    this.playlistOptionsList.innerHTML = "";

    if (this.playlists.length === 0) {
      this.playlistOptionsList.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">No playlists yet. Create one first!</p>`;
    } else {
      this.playlists.forEach(pl => {
        const isIncluded = pl.trackIds.includes(trackId);
        const item = document.createElement("div");
        item.className = "playlist-option-item";
        item.innerHTML = `
          <div class="playlist-option-label">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line></svg>
            <span>${this.escapeHtml(pl.name)}</span>
          </div>
          <input type="checkbox" class="playlist-option-check" ${isIncluded ? "checked" : ""}>
        `;

        item.addEventListener("click", (e) => {
          if (e.target.tagName !== "INPUT") {
            const cb = item.querySelector("input");
            cb.checked = !cb.checked;
          }
          this.toggleSongInPlaylist(pl.id, trackId);
        });

        this.playlistOptionsList.appendChild(item);
      });
    }

    this.addToPlaylistModal.classList.add("open");
  }

  // ==========================================================================
  // Local File Upload & Drag-and-Drop
  // ==========================================================================
  handleFilesUpload(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith("audio/"));
    if (files.length === 0) {
      this.showToast("Please drop valid audio files (MP3, WAV, etc.)", "error");
      return;
    }

    let addedCount = 0;
    files.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const nameParts = file.name.replace(/\.[^/.]+$/, "").split(" - ");
      const artist = nameParts.length > 1 ? nameParts[0].trim() : "Local Artist";
      const title = nameParts.length > 1 ? nameParts[1].trim() : nameParts[0].trim();
      const randomCoverNum = (Math.floor(Math.random() * 8) + 1);

      const track = {
        id: `local-${Date.now()}-${index}`,
        title: title || "Untitled Track",
        artist: artist || "Unknown Artist",
        album: "Local Uploads",
        genre: "Custom",
        duration: 180,
        cover: `assets/images/cover-${randomCoverNum}.jpg`,
        src: url
      };

      this.tracks.unshift(track);
      addedCount++;
    });

    this.renderAll();
    this.showToast(`Added ${addedCount} local track(s) to library!`, "success");
    this.loadTrack(0, true);
  }

  // ==========================================================================
  // Rendering Views
  // ==========================================================================
  renderAll() {
    this.updateCounts();
    this.renderHero();
    this.renderQuickGrid();
    this.renderFeaturedCards();
    this.renderHomePlaylists();
    this.renderSidebarPlaylists();
    this.renderLibraryView();
    this.renderFavoritesView();
    this.renderRecentlyPlayedView();
  }

  updateCounts() {
    this.libraryCount.textContent = this.tracks.length;
    this.favoritesCount.textContent = this.favorites.size;
  }

  renderHero() {
    const featured = this.tracks[0];
    if (!featured) return;
    this.heroTitle.textContent = featured.title;
    this.heroArtist.textContent = `By ${featured.artist} • ${featured.album}`;
    this.heroCoverImg.src = featured.cover;
  }

  renderQuickGrid() {
    this.quickGrid.innerHTML = "";
    const jumpTracks = this.tracks.slice(0, 6);

    jumpTracks.forEach(track => {
      const card = document.createElement("div");
      card.className = "quick-card";
      card.innerHTML = `
        <img src="${track.cover}" alt="${this.escapeHtml(track.title)}" class="quick-card-img">
        <div class="quick-card-info">
          <div class="quick-card-title">${this.escapeHtml(track.title)}</div>
          <div class="quick-card-sub">${this.escapeHtml(track.artist)}</div>
        </div>
        <button class="quick-card-play" aria-label="Play ${this.escapeHtml(track.title)}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </button>
      `;

      card.addEventListener("click", () => {
        const idx = this.tracks.findIndex(t => t.id === track.id);
        this.loadTrack(idx, true);
      });

      this.quickGrid.appendChild(card);
    });
  }

  renderFeaturedCards() {
    this.featuredCardsGrid.innerHTML = "";
    this.tracks.forEach((track, idx) => {
      const card = document.createElement("div");
      const isCurrent = idx === this.currentTrackIndex && this.isPlaying;
      card.className = `music-card ${isCurrent ? "playing" : ""}`;
      card.innerHTML = `
        <div class="card-img-wrap">
          <img src="${track.cover}" alt="${this.escapeHtml(track.title)}" class="card-img" loading="lazy">
          <span class="card-genre-tag">${track.genre}</span>
          <button class="card-play-overlay-btn" title="Play ${this.escapeHtml(track.title)}">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
        </div>
        <div class="card-title">${this.escapeHtml(track.title)}</div>
        <div class="card-artist">${this.escapeHtml(track.artist)}</div>
      `;

      card.addEventListener("click", () => {
        this.loadTrack(idx, true);
      });

      this.featuredCardsGrid.appendChild(card);
    });
  }

  renderHomePlaylists() {
    this.curatedPlaylistsGrid.innerHTML = "";
    this.playlists.forEach(pl => {
      const card = document.createElement("div");
      card.className = "playlist-card";
      card.innerHTML = `
        <div class="playlist-card-art">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
        </div>
        <div class="playlist-card-title">${this.escapeHtml(pl.name)}</div>
        <div class="playlist-card-desc">${this.escapeHtml(pl.desc || `${pl.trackIds.length} tracks`)}</div>
      `;

      card.addEventListener("click", () => {
        this.switchView(pl.id);
      });

      this.curatedPlaylistsGrid.appendChild(card);
    });
  }

  renderSidebarPlaylists() {
    this.sidebarPlaylistsList.innerHTML = "";
    this.playlists.forEach(pl => {
      const item = document.createElement("div");
      item.className = `playlist-nav-item ${this.currentView === pl.id ? "active" : ""}`;
      item.textContent = pl.name;
      item.title = pl.name;

      item.addEventListener("click", () => {
        this.switchView(pl.id);
      });

      this.sidebarPlaylistsList.appendChild(item);
    });
  }

  renderLibraryView() {
    let filtered = [...this.tracks];

    // Filter by genre
    if (this.currentGenre !== "all") {
      filtered = filtered.filter(t => t.genre.toLowerCase() === this.currentGenre.toLowerCase());
    }

    // Filter by search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.genre.toLowerCase().includes(q)
      );
    }

    this.libraryMetaText.textContent = `${filtered.length} track${filtered.length === 1 ? "" : "s"} in library`;
    this.renderTrackRows(this.tracksTableBody, filtered);
  }

  renderFavoritesView() {
    const favoriteTracks = this.tracks.filter(t => this.favorites.has(t.id));
    this.favoritesMetaText.textContent = `${favoriteTracks.length} liked song${favoriteTracks.length === 1 ? "" : "s"}`;

    if (favoriteTracks.length === 0) {
      this.favoritesTableBody.innerHTML = "";
      this.favoritesEmptyState.classList.add("visible");
      this.favoritesActions = document.getElementById("favoritesActions");
      if (this.favoritesActions) this.favoritesActions.style.display = "none";
    } else {
      this.favoritesEmptyState.classList.remove("visible");
      const fa = document.getElementById("favoritesActions");
      if (fa) fa.style.display = "flex";
      this.renderTrackRows(this.favoritesTableBody, favoriteTracks);
    }
  }

  renderRecentlyPlayedView() {
    const recentTracks = this.recentlyPlayed
      .map(id => this.tracks.find(t => t.id === id))
      .filter(Boolean);

    if (recentTracks.length === 0) {
      this.recentTableBody.innerHTML = "";
      this.recentEmptyState.classList.add("visible");
      this.clearRecentBtn.style.display = "none";
    } else {
      this.recentEmptyState.classList.remove("visible");
      this.clearRecentBtn.style.display = "inline-flex";
      this.renderTrackRows(this.recentTableBody, recentTracks);
    }
  }

  renderPlaylistView(playlistId) {
    const pl = this.playlists.find(p => p.id === playlistId);
    if (!pl) return;

    this.playlistTitle.textContent = pl.name;
    this.playlistDesc.textContent = pl.desc || "";
    this.playlistMeta.textContent = `${pl.trackIds.length} tracks • Created by you`;

    const plTracks = pl.trackIds
      .map(id => this.tracks.find(t => t.id === id))
      .filter(Boolean);

    if (plTracks.length === 0) {
      this.playlistTableBody.innerHTML = "";
      this.playlistEmptyState.classList.add("visible");
    } else {
      this.playlistEmptyState.classList.remove("visible");
      this.renderTrackRows(this.playlistTableBody, plTracks);
    }
  }

  renderTrackRows(tbody, trackList) {
    tbody.innerHTML = "";

    trackList.forEach((track, index) => {
      const isCurrent = this.tracks[this.currentTrackIndex]?.id === track.id;
      const isLiked = this.favorites.has(track.id);

      const tr = document.createElement("tr");
      tr.className = isCurrent ? "active-track" : "";
      tr.dataset.trackId = track.id;

      tr.innerHTML = `
        <td class="track-num-cell">
          ${isCurrent && this.isPlaying ? `
            <div class="row-soundwave"><span></span><span></span><span></span></div>
          ` : `
            <span class="row-index">${index + 1}</span>
            <span class="row-play-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></span>
          `}
        </td>
        <td>
          <div class="song-info-cell">
            <img src="${track.cover}" alt="${this.escapeHtml(track.title)}" class="table-track-thumb" loading="lazy">
            <div class="song-texts">
              <span class="song-title-text">${this.escapeHtml(track.title)}</span>
              <span class="song-artist-text">${this.escapeHtml(track.artist)}</span>
            </div>
          </div>
        </td>
        <td class="album-cell"><span class="album-text">${this.escapeHtml(track.album)}</span></td>
        <td class="genre-cell"><span class="genre-tag-cell">${track.genre}</span></td>
        <td class="time-cell">${this.formatTime(track.duration)}</td>
        <td>
          <div class="actions-cell">
            <button class="action-icon-btn ${isLiked ? "liked" : ""}" data-action="like" title="${isLiked ? "Unlike" : "Like"}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
            </button>
            <button class="action-icon-btn" data-action="playlist" title="Add to playlist">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
        </td>
      `;

      // Click row to play
      tr.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        const targetIdx = this.tracks.findIndex(t => t.id === track.id);
        if (targetIdx !== -1) {
          this.loadTrack(targetIdx, true);
        }
      });

      // Like button click
      const likeBtn = tr.querySelector('[data-action="like"]');
      likeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleFavorite(track.id);
        likeBtn.classList.toggle("liked", this.favorites.has(track.id));
      });

      // Add to playlist button click
      const playlistBtn = tr.querySelector('[data-action="playlist"]');
      playlistBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openAddToPlaylistModal(track.id);
      });

      tbody.appendChild(tr);
    });
  }

  highlightActiveTableRow() {
    const currId = this.tracks[this.currentTrackIndex]?.id;
    document.querySelectorAll(".tracks-table tbody tr").forEach(tr => {
      if (tr.dataset.trackId === currId) {
        tr.classList.add("active-track");
        const numCell = tr.querySelector(".track-num-cell");
        if (numCell) {
          if (this.isPlaying) {
            numCell.innerHTML = `<div class="row-soundwave"><span></span><span></span><span></span></div>`;
          } else {
            const idx = Array.from(tr.parentElement.children).indexOf(tr) + 1;
            numCell.innerHTML = `<span class="row-index">${idx}</span><span class="row-play-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></span>`;
          }
        }
      } else {
        tr.classList.remove("active-track");
        const numCell = tr.querySelector(".track-num-cell");
        if (numCell) {
          const idx = Array.from(tr.parentElement.children).indexOf(tr) + 1;
          numCell.innerHTML = `<span class="row-index">${idx}</span><span class="row-play-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></span>`;
        }
      }
    });

    // Also update featured music cards
    document.querySelectorAll(".music-card").forEach((card, idx) => {
      card.classList.toggle("playing", idx === this.currentTrackIndex && this.isPlaying);
    });
  }

  // ==========================================================================
  // View Switching
  // ==========================================================================
  switchView(viewName) {
    this.currentView = viewName;

    // Update navigation active states
    this.navButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });
    this.mobileNavButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === viewName);
    });

    // Check if playlist view
    const isPlaylist = this.playlists.some(p => p.id === viewName);

    this.viewPanels.forEach(p => p.classList.remove("active"));

    if (isPlaylist) {
      document.getElementById("playlistView").classList.add("active");
      this.renderPlaylistView(viewName);
      this.expandedPlayingFrom.textContent = this.playlists.find(p => p.id === viewName)?.name || "Playlist";
    } else {
      const panel = document.getElementById(`${viewName}View`);
      if (panel) panel.classList.add("active");
      this.expandedPlayingFrom.textContent = 
        viewName === "home" ? "Home Picks" :
        viewName === "library" ? "All Tracks" :
        viewName === "favorites" ? "Liked Songs" : "Recent History";
    }

    this.renderSidebarPlaylists();

    // Scroll view to top
    const wrapper = document.querySelector(".views-wrapper");
    if (wrapper) wrapper.scrollTop = 0;

    // Close mobile drawer if open
    this.sidebar.classList.remove("mobile-open");
  }

  // ==========================================================================
  // Event Listeners Binding
  // ==========================================================================
  initEvents() {
    // Navigation items
    this.navButtons.forEach(btn => {
      btn.addEventListener("click", () => this.switchView(btn.dataset.view));
    });

    this.mobileNavButtons.forEach(btn => {
      if (btn.dataset.view) {
        btn.addEventListener("click", () => this.switchView(btn.dataset.view));
      }
    });

    // Mobile sidebar toggle
    this.mobileMenuBtn.addEventListener("click", () => {
      this.sidebar.classList.add("mobile-open");
    });
    this.closeSidebarBtn.addEventListener("click", () => {
      this.sidebar.classList.remove("mobile-open");
    });

    // Brand logo returns to home
    document.getElementById("brandLogo").addEventListener("click", (e) => {
      e.preventDefault();
      this.switchView("home");
    });

    // See all button on home view
    document.querySelectorAll("[data-goto]").forEach(btn => {
      btn.addEventListener("click", () => this.switchView(btn.dataset.goto));
    });

    // Search input
    this.searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value;
      this.clearSearchBtn.classList.toggle("visible", Boolean(this.searchQuery));
      if (this.currentView !== "library") {
        this.switchView("library");
      }
      this.renderLibraryView();
    });

    this.clearSearchBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchQuery = "";
      this.clearSearchBtn.classList.remove("visible");
      this.renderLibraryView();
    });

    // Genre filter pills
    this.genrePills.forEach(pill => {
      pill.addEventListener("click", () => {
        this.genrePills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.currentGenre = pill.dataset.genre;
        if (this.currentView !== "library") {
          this.switchView("library");
        }
        this.renderLibraryView();
      });
    });

    // Hero banner actions
    this.heroPlayBtn.addEventListener("click", () => {
      this.loadTrack(0, true);
    });
    this.heroLikeBtn.addEventListener("click", () => {
      const heroTrack = this.tracks[0];
      if (heroTrack) this.toggleFavorite(heroTrack.id);
    });

    // Play All / Shuffle buttons in views
    this.playAllLibraryBtn.addEventListener("click", () => {
      this.loadTrack(0, true);
    });
    this.shuffleLibraryBtn.addEventListener("click", () => {
      this.isShuffle = true;
      this.updateControlsUI();
      const randIdx = Math.floor(Math.random() * this.tracks.length);
      this.loadTrack(randIdx, true);
    });
    this.playFavoritesBtn.addEventListener("click", () => {
      const firstLiked = this.tracks.find(t => this.favorites.has(t.id));
      if (firstLiked) {
        const idx = this.tracks.findIndex(t => t.id === firstLiked.id);
        this.loadTrack(idx, true);
      }
    });
    this.clearRecentBtn.addEventListener("click", () => this.clearRecentlyPlayed());

    this.playCustomPlaylistBtn.addEventListener("click", () => {
      const pl = this.playlists.find(p => p.id === this.currentView);
      if (pl && pl.trackIds.length > 0) {
        const idx = this.tracks.findIndex(t => t.id === pl.trackIds[0]);
        if (idx !== -1) this.loadTrack(idx, true);
      }
    });

    this.deletePlaylistBtn.addEventListener("click", () => {
      if (this.currentView) this.deletePlaylist(this.currentView);
    });

    // Bottom Player Controls
    this.playPauseBtn.addEventListener("click", () => this.togglePlayPause());
    this.nextBtn.addEventListener("click", () => this.playNextTrack());
    this.prevBtn.addEventListener("click", () => this.playPrevTrack());
    this.shuffleBtn.addEventListener("click", () => this.toggleShuffle());
    this.repeatBtn.addEventListener("click", () => this.cycleRepeat());

    this.playerLikeBtn.addEventListener("click", () => {
      const curr = this.tracks[this.currentTrackIndex];
      if (curr) this.toggleFavorite(curr.id);
    });

    // Expanded Player Controls
    this.expandedPlayPauseBtn.addEventListener("click", () => this.togglePlayPause());
    this.expandedNextBtn.addEventListener("click", () => this.playNextTrack());
    this.expandedPrevBtn.addEventListener("click", () => this.playPrevTrack());
    this.expandedShuffleBtn.addEventListener("click", () => this.toggleShuffle());
    this.expandedRepeatBtn.addEventListener("click", () => this.cycleRepeat());
    this.expandedLikeBtn.addEventListener("click", () => {
      const curr = this.tracks[this.currentTrackIndex];
      if (curr) this.toggleFavorite(curr.id);
    });

    // Volume Controls
    this.volumeSlider.addEventListener("input", (e) => {
      this.setVolume(parseFloat(e.target.value));
    });
    this.muteBtn.addEventListener("click", () => this.toggleMute());

    // Toggle Visualizer bar mode
    this.toggleVisualizerBarBtn.addEventListener("click", () => {
      this.isVisualizerBar = !this.isVisualizerBar;
      this.visualizerCanvas.style.display = this.isVisualizerBar ? "block" : "none";
      this.showToast(this.isVisualizerBar ? "Visualizer ON" : "Visualizer OFF", "info");
    });

    // Scrubber drag / click seeking
    this.setupScrubberEvents(this.progressBarWrapper);
    this.setupScrubberEvents(this.expandedProgressBarWrapper);

    // Expand / Fullscreen Player Toggle
    this.expandPlayerBtn.addEventListener("click", () => this.openExpandedPlayer());
    this.closeExpandedBtn.addEventListener("click", () => this.closeExpandedPlayer());
    // Clicking track info in mobile player expands full player
    this.playerCover.parentElement.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        this.openExpandedPlayer();
      }
    });

    // Create Playlist Modal
    this.createPlaylistBtn.addEventListener("click", () => {
      this.createPlaylistModal.classList.add("open");
      document.getElementById("newPlaylistName").focus();
    });
    this.closeCreatePlaylistModal.addEventListener("click", () => {
      this.createPlaylistModal.classList.remove("open");
    });
    this.cancelPlaylistBtn.addEventListener("click", () => {
      this.createPlaylistModal.classList.remove("open");
    });
    this.createPlaylistForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("newPlaylistName").value;
      const desc = document.getElementById("newPlaylistDesc").value;
      if (name.trim()) {
        this.createPlaylist(name, desc);
        this.createPlaylistForm.reset();
        this.createPlaylistModal.classList.remove("open");
      }
    });

    // Add to playlist modal close
    this.closeAddToPlaylistModal.addEventListener("click", () => {
      this.addToPlaylistModal.classList.remove("open");
    });
    this.doneAddToPlaylistBtn.addEventListener("click", () => {
      this.addToPlaylistModal.classList.remove("open");
    });

    // Keyboard shortcuts modal
    const openShortcuts = () => this.shortcutsModal.classList.add("open");
    const closeShortcuts = () => this.shortcutsModal.classList.remove("open");
    this.shortcutsBtn.addEventListener("click", openShortcuts);
    this.expandedShortcutsBtn.addEventListener("click", openShortcuts);
    this.closeShortcutsModal.addEventListener("click", closeShortcuts);
    this.doneShortcutsBtn.addEventListener("click", closeShortcuts);

    // Upload buttons
    this.uploadTrackBtn.addEventListener("click", () => this.localAudioInput.click());
    this.mobileUploadBtn.addEventListener("click", () => this.localAudioInput.click());
    this.localAudioInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.handleFilesUpload(e.target.files);
      }
    });

    // Drag-and-Drop Audio Files
    ["dragenter", "dragover"].forEach(eventName => {
      this.mainContent.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZoneOverlay.classList.add("drag-active");
      });
    });

    ["dragleave", "drop"].forEach(eventName => {
      this.dropZoneOverlay.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (eventName === "drop") {
          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            this.handleFilesUpload(files);
          }
        }
        this.dropZoneOverlay.classList.remove("drag-active");
      });
    });

    // Global Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          this.togglePlayPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) {
            this.playNextTrack();
          } else {
            this.seekRelative(5);
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) {
            this.playPrevTrack();
          } else {
            this.seekRelative(-5);
          }
          break;
        case "KeyL":
          if (!e.ctrlKey && !e.metaKey) {
            this.playNextTrack();
          }
          break;
        case "KeyJ":
          if (!e.ctrlKey && !e.metaKey) {
            this.playPrevTrack();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          this.setVolume(this.volume + 0.05);
          break;
        case "ArrowDown":
          e.preventDefault();
          this.setVolume(this.volume - 0.05);
          break;
        case "KeyM":
          this.toggleMute();
          break;
        case "KeyS":
          this.toggleShuffle();
          break;
        case "KeyR":
          this.cycleRepeat();
          break;
        case "KeyF": {
          const curr = this.tracks[this.currentTrackIndex];
          if (curr) this.toggleFavorite(curr.id);
          break;
        }
        case "KeyX":
          if (this.isExpanded) {
            this.closeExpandedPlayer();
          } else {
            this.openExpandedPlayer();
          }
          break;
        case "Slash":
          if (e.shiftKey) { // '?' key
            e.preventDefault();
            this.shortcutsModal.classList.toggle("open");
          }
          break;
      }
    });

    // Close modals on escape key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.createPlaylistModal.classList.remove("open");
        this.addToPlaylistModal.classList.remove("open");
        this.shortcutsModal.classList.remove("open");
        if (this.isExpanded) this.closeExpandedPlayer();
      }
    });
  }

  // ==========================================================================
  // Scrubber Drag and Click Seeking Helper
  // ==========================================================================
  setupScrubberEvents(wrapper) {
    const handleSeek = (e) => {
      const rect = wrapper.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const percent = (x / rect.width) * 100;
      this.seekToPercent(percent);
    };

    wrapper.addEventListener("mousedown", (e) => {
      this.isDraggingProgress = true;
      wrapper.classList.add("dragging");
      handleSeek(e);

      const onMouseMove = (moveEvent) => {
        if (this.isDraggingProgress) handleSeek(moveEvent);
      };

      const onMouseUp = () => {
        this.isDraggingProgress = false;
        wrapper.classList.remove("dragging");
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });

    // Hover time tooltip
    wrapper.addEventListener("mousemove", (e) => {
      if (isNaN(this.audio.duration)) return;
      const rect = wrapper.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const pct = x / rect.width;
      const time = pct * this.audio.duration;
      if (this.seekTooltip) {
        this.seekTooltip.textContent = this.formatTime(time);
        this.seekTooltip.style.left = `${x}px`;
      }
    });

    // Touch events for mobile
    wrapper.addEventListener("touchstart", (e) => {
      this.isDraggingProgress = true;
      handleSeek(e);
    });

    wrapper.addEventListener("touchmove", (e) => {
      if (this.isDraggingProgress) handleSeek(e);
    });

    wrapper.addEventListener("touchend", () => {
      this.isDraggingProgress = false;
    });
  }

  // ==========================================================================
  // Expanded Player Open/Close
  // ==========================================================================
  openExpandedPlayer() {
    this.isExpanded = true;
    this.expandedPlayerModal.classList.add("open");
  }

  closeExpandedPlayer() {
    this.isExpanded = false;
    this.expandedPlayerModal.classList.remove("open");
  }

  // ==========================================================================
  // Toast Notifications
  // ==========================================================================
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✨";
    if (type === "error") icon = "⚠️";

    toast.innerHTML = `<span>${icon}</span><span>${this.escapeHtml(message)}</span>`;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(40px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================
  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// ============================================================================
// Application Bootstrap
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  window.app = new MusicPlayerApp();
});
