# 🎵 SoundPulse — Modern Music Player Web Application

A modern, stylish, and fully responsive **Music Player Web Application** inspired by streaming platforms like Spotify. Built using vanilla **HTML5, CSS3, and JavaScript**, SoundPulse delivers a rich dark glassmorphic design, dynamic real-time audio visualizers, playlist creation, search, favorites, keyboard shortcuts, and drag-and-drop local audio file playback.

---

## ✨ Features

### 1. 🎨 Modern & Responsive Streaming UI
- **Dark Glassmorphic Aesthetics**: Obsidian backdrop, emerald-cyan gradients, neon glow accents, and backdrop-blur effects.
- **Sidebar Navigation**: Fast switching between **Home**, **All Tracks (Library)**, **Favorites (Liked Songs)**, **Recently Played**, and **Custom Playlists**.
- **Hero Featured Section**: "Tonight's Vibe" spotlight with one-click playback and soundwave equalizer.
- **Responsive Layout**: Designed for Desktop (sidebar + table + bottom bar), Tablet (compact navigation), and Mobile (bottom navigation + full tap-to-expand drawer).

### 2. 🎛️ Comprehensive Playback Engine
- **HTML5 Audio Core**: Smooth playback with play/pause, next, previous, auto-advance, and error resilience.
- **Interactive Scrubber Progress Bar**: Real-time elapsed/remaining time, click-to-seek, smooth mouse/touch dragging, and timestamp hover tooltips.
- **Volume & Mute**: Precision volume slider with mute/unmute toggle remembering previous levels.
- **Playback Modes**:
  - **Shuffle Mode**: Non-repeating random order.
  - **Repeat Modes**: Cycle between Repeat All (`loop all`), Repeat One (`loop track`), and Repeat Off.
- **Media Session API**: Integrates with OS lock screen, headphone controls, and hardware media keys with artwork.

### 3. 📊 Real-Time Audio Visualizer & Animations
- **Web Audio API Analyser**: Synchronized frequency equalizer canvas on the player bar and in the expanded view.
- **Bouncing Soundwave Equalizer**: Animated soundwave indicator on the playing track row and player info bar.
- **Vinyl Disk Animation**: Smooth spinning vinyl animation with album artwork in the expanded player.

### 4. 📂 Playlists & Music Catalog
- **Preloaded Catalog**: 8 high-quality sample tracks across **Lofi**, **Synthwave**, **Acoustic**, and **Electronic** genres.
- **Custom Playlists**: Create, name, describe, and delete custom playlists.
- **Add / Remove Songs**: Modal interface to check/uncheck playlists for any track.
- **Live Search & Filter**: Instant search across song title, artist, album, and genre, plus genre pill tags.
- **Favorites / Liked Songs**: Heart button on every track and in the player bar, saved to LocalStorage.
- **Playback History**: Automatic tracking of recently played songs with a "Clear History" option.

### 5. 🚀 Drag & Drop / Local File Upload
- **Upload Local MP3s**: Click **"Upload Audio"** or **drag and drop** audio files (`.mp3`, `.wav`, `.ogg`, `.flac`) directly onto the browser window.
- Instant client-side playback using `URL.createObjectURL` without needing any backend server!

### 6. ⌨️ Keyboard Shortcuts
| Key | Action |
| :--- | :--- |
| <kbd>Space</kbd> | Play / Pause |
| <kbd>&rarr;</kbd> | Seek forward 5 seconds |
| <kbd>&larr;</kbd> | Seek backward 5 seconds |
| <kbd>Shift</kbd> + <kbd>&rarr;</kbd> or <kbd>L</kbd> | Next track |
| <kbd>Shift</kbd> + <kbd>&larr;</kbd> or <kbd>J</kbd> | Previous track |
| <kbd>&uarr;</kbd> | Volume up (+5%) |
| <kbd>&darr;</kbd> | Volume down (-5%) |
| <kbd>M</kbd> | Mute / Unmute |
| <kbd>S</kbd> | Toggle Shuffle mode |
| <kbd>R</kbd> | Cycle Repeat mode (Off &rarr; All &rarr; One) |
| <kbd>F</kbd> | Favorite / Like current track |
| <kbd>X</kbd> | Toggle Fullscreen / Expanded Player view |
| <kbd>?</kbd> | Show Keyboard Shortcuts cheat sheet |
| <kbd>Esc</kbd> | Close modals or expanded player |

---

## 📁 Project Structure

```text
music player project/
│
├── index.html            # Main semantic HTML5 markup & view panels
├── style.css             # Dark-themed styling, animations, responsive design
├── script.js             # State management, Web Audio engine, playlist logic
├── README.md             # Project documentation & run guide
│
└── assets/
    ├── images/           # High-resolution album artwork (cover-1.jpg - cover-8.jpg)
    └── music/            # Offline local audio tracks (.mp3 files)
```

---

## 🚀 How to Run the Project in VS Code

You can run this project easily in multiple ways without needing a database:

### Option 1: VS Code "Live Server" Extension (Recommended)
1. Open **Visual Studio Code**.
2. Open this folder: `File` &rarr; `Open Folder...` &rarr; select `music player project`.
3. If you have the **Live Server** extension installed (`ritwickdey.liveserver`):
   - Right-click `index.html` in the file explorer.
   - Click **"Open with Live Server"**.
   - Your browser will open automatically at `http://127.0.0.1:5500`.

### Option 2: Using Node.js (Quick Local Server)
Open the VS Code integrated terminal (`Ctrl + ~`) in the project directory and run:

```bash
# Using npx serve
npx -y serve .

# Or using http-server
npx -y http-server -p 3000
```
Then visit `http://localhost:3000`.

### Option 3: Using Python
If you have Python installed, run in the terminal:

```bash
# Python 3
python -m http.server 8000
```
Then open `http://localhost:8000` in any web browser.

### Option 4: Direct Browser Open
Double-click `index.html` or drag it into Chrome, Edge, Brave, or Firefox. The core player, controls, playlists, and uploaded tracks will work immediately! *(Note: Web Audio API visualizers work best via an HTTP server like Options 1-3 due to browser audio origin policies).*

---

## 💾 Data Persistence
All your preferences (Volume, Shuffle, Repeat Mode), Favorite tracks, custom Playlists, and Playback History are stored safely in your browser's **`LocalStorage`**, so your music library stays intact between page refreshes.
