# 🧞 Aladin - Local Knowledge Base

A local-first, encrypted knowledge base with AI-powered search. All your data stays on your device.

---

## 🚀 Quick Start - Choose Your Way

### Double-Click Options (No Setup Required!)

| Platform | File | How to Use |
|----------|------|------------|
| **macOS** | `dist/Aladin.app` | Just double-click! Opens in browser automatically |
| **Windows** | `dist/aladin.hta` | Double-click to run as Windows app |
| **Any Browser** | `dist/aladin-portable.html` | Open directly in Chrome, Edge, or Firefox |

### With Launcher Scripts (Recommended for AI)

| Platform | File | How to Use |
|----------|------|------------|
| **macOS/Linux** | `dist/Start Aladin.command` | Double-click, runs local server |
| **Windows** | `dist/Start Aladin.bat` | Double-click, runs local server |

---

## 📦 Distribution

### Build All Packages
```bash
python3 build.py
```

This creates:
- `dist/aladin-portable.html` - Single file, works everywhere
- `dist/Aladin.app` - macOS app bundle
- `dist/aladin.hta` - Windows HTA application
- `dist/aladin-pwa/` - Progressive Web App (installable)
- `dist/Start Aladin.command` - macOS/Linux launcher
- `dist/Start Aladin.bat` - Windows launcher

### Sharing Your Knowledge Base

1. **Share the app**: Copy `aladin-portable.html` or `Aladin.app` anywhere
2. **Share your vault**: Copy your `.aladin` vault file
3. **Open on any computer**: The portable app works without installation

---

## 🦙 AI Features (Ollama)

### For the Standalone App
The macOS app and launcher scripts handle CORS automatically.

### For Portable HTML / Direct Browser

**macOS (Ollama Desktop App):**
```bash
# One-time setup - run in Terminal:
launchctl setenv OLLAMA_ORIGINS "*"
echo 'export OLLAMA_ORIGINS="*"' >> ~/.zshrc

# Then restart Ollama (quit from menu bar and reopen)
```

**Linux:**
```bash
OLLAMA_ORIGINS=* ollama serve
```

**Windows:**
```cmd
set OLLAMA_ORIGINS=* && ollama serve
```

---

## ☁️ Cloud Sync (OneDrive, Dropbox, iCloud)

The app is designed to work smoothly with cloud sync:

✅ **Atomic writes** - Files are written in one operation, not streamed
✅ **Auto-save on tab switch** - Data is saved when you switch apps
✅ **Handle release on close** - File locks are released when you close the tab

### Tips for Best Sync Experience

1. **Store your `.aladin` vault in a synced folder**
2. **Close the tab/app before syncing** (handles are auto-released)
3. **Wait a moment** before opening on another device

### Manual File Release
If you see sync conflicts, run in browser console:
```javascript
releaseVaultHandle()
```

---

## 🔒 Security

- 🔐 **AES-256-GCM encryption** - Military-grade protection
- 🚫 **No cloud storage** - Your data never leaves your device
- 🔑 **Password never stored** - Only in memory during session
- 📴 **Works offline** - No internet required

---

## 🏗 Building from Source

```bash
# Clone/download the repo
cd aladin

# Build distribution packages
python3 build.py

# Or run development server
python3 -m http.server 8080
```

---

## 📁 Project Structure

```
aladin/
├── index.html          # Main app entry
├── styles.css          # UI styles
├── js/
│   ├── app.js         # Application core
│   ├── vault.js       # Encrypted storage (cloud-sync friendly)
│   ├── storage.js     # Data layer
│   ├── ai.js          # AI/RAG system
│   ├── ai-chat.js     # AI UI
│   ├── editor.js      # Editor logic
│   └── ...
├── build.py           # Build script
└── dist/              # Built packages
    ├── Aladin.app/    # macOS app
    ├── aladin.hta     # Windows app
    └── ...
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Shift + Space` | Open AI search |
| `Escape` | Close panels |
| `Cmd/Ctrl + S` | Force save |

---

Made with 💜 for local-first, private knowledge management.
