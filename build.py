#!/usr/bin/env python3
"""
Build script for Aladin - Creates distributable packages for all platforms

Outputs:
- aladin-portable.html  - Single HTML file (works everywhere)
- Aladin.app/           - macOS application bundle
- aladin.hta            - Windows HTA application
- aladin-pwa/           - PWA-ready version with manifest
"""

import os
import re
import json
import shutil
import stat
import argparse
from pathlib import Path

BUILD_DIR = Path(__file__).parent
DIST_DIR = BUILD_DIR / "dist"

def read_file(path):
    """Read a file's contents"""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    """Write content to file"""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def inline_css(html):
    """Inline CSS files into <style> tags"""
    css_pattern = r'<link\s+rel="stylesheet"\s+href="([^"]+)"[^>]*>'
    
    def replace_css(match):
        css_path = match.group(1)
        if css_path.startswith('http'):
            return match.group(0)
        
        css_file = BUILD_DIR / css_path
        if css_file.exists():
            css_content = read_file(css_file)
            return f'<style>\n{css_content}\n</style>'
        return match.group(0)
    
    return re.sub(css_pattern, replace_css, html)

def inline_js(html):
    """Inline JS files into <script> tags"""
    js_pattern = r'<script\s+src="([^"]+)"[^>]*></script>'
    
    def replace_js(match):
        js_path = match.group(1)
        if js_path.startswith('http'):
            return match.group(0)
        
        js_file = BUILD_DIR / js_path
        if js_file.exists():
            js_content = read_file(js_file)
            return f'<script>\n{js_content}\n</script>'
        return match.group(0)
    
    return re.sub(js_pattern, replace_js, html)

def add_ollama_helper(html):
    """Add portable mode detection and CORS helper"""
    notice_script = '''
<script>
// Portable mode detection and CORS helper
(function() {
    const isFileProtocol = window.location.protocol === 'file:';
    
    if (isFileProtocol) {
        console.log('🧞 Aladin running in portable/file mode');
        console.log('💡 For Ollama AI: Set OLLAMA_ORIGINS=* before starting Ollama');
    }
})();
</script>
'''
    return html.replace('</body>', notice_script + '</body>')

def build_portable_html():
    """Build single portable HTML file"""
    print("  📄 Building portable HTML...")
    
    html = read_file(BUILD_DIR / 'index.html')
    html = inline_css(html)
    html = inline_js(html)
    html = add_ollama_helper(html)
    html = html.replace('<title>Aladin - Local Knowledge Base</title>', 
                        '<title>Aladin Portable - Local Knowledge Base</title>')
    
    output_path = DIST_DIR / 'aladin-portable.html'
    write_file(output_path, html)
    
    size_kb = os.path.getsize(output_path) / 1024
    print(f"     ✅ Created aladin-portable.html ({size_kb:.1f} KB)")
    return html

def build_macos_app(html_content):
    """Build macOS .app bundle"""
    print("  🍎 Building macOS app bundle...")
    
    app_dir = DIST_DIR / "Aladin.app"
    contents_dir = app_dir / "Contents"
    macos_dir = contents_dir / "MacOS"
    resources_dir = contents_dir / "Resources"
    
    # Create directories
    for d in [macos_dir, resources_dir]:
        d.mkdir(parents=True, exist_ok=True)
    
    # Write HTML
    write_file(resources_dir / "index.html", html_content)
    
    # Create Info.plist
    info_plist = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>Aladin</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.aladin.knowledgebase</string>
    <key>CFBundleName</key>
    <string>Aladin</string>
    <key>CFBundleDisplayName</key>
    <string>Aladin</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>'''
    write_file(contents_dir / "Info.plist", info_plist)
    
    # Create launcher script
    launcher = '''#!/bin/bash
# Aladin Launcher - Opens the app in the default browser with a local server

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RESOURCES="$DIR/../Resources"
PORT=8765

# Find a free port
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

# Start a simple Python server in the background
cd "$RESOURCES"
python3 -m http.server $PORT --bind 127.0.0.1 &
SERVER_PID=$!

# Wait for server to start
sleep 0.5

# Open in default browser
open "http://127.0.0.1:$PORT/index.html"

# Keep running for a while, then clean up
# The server will be killed when the app is quit
sleep 3600

kill $SERVER_PID 2>/dev/null
'''
    launcher_path = macos_dir / "Aladin"
    write_file(launcher_path, launcher)
    os.chmod(launcher_path, os.stat(launcher_path).st_mode | stat.S_IEXEC)
    
    print(f"     ✅ Created Aladin.app")

def build_windows_hta(html_content):
    """Build Windows HTA application"""
    print("  🪟 Building Windows HTA...")
    
    # HTA header - makes it run as an application
    hta_header = '''<html>
<head>
<HTA:APPLICATION
    ID="Aladin"
    APPLICATIONNAME="Aladin"
    BORDER="thick"
    BORDERSTYLE="normal"
    CAPTION="yes"
    CONTEXTMENU="yes"
    ICON=""
    INNERBORDER="yes"
    MAXIMIZEBUTTON="yes"
    MINIMIZEBUTTON="yes"
    NAVIGABLE="yes"
    SCROLL="auto"
    SCROLLFLAT="no"
    SELECTION="yes"
    SHOWINTASKBAR="yes"
    SINGLEINSTANCE="no"
    SYSMENU="yes"
    VERSION="1.0"
    WINDOWSTATE="normal"
/>
'''
    
    # Modify HTML for HTA
    hta_content = html_content
    # Replace the opening html/head tags
    hta_content = re.sub(r'<html[^>]*>\s*<head>', hta_header, hta_content, count=1)
    
    # Add HTA-specific script for mshta compatibility
    hta_script = '''
<script>
// HTA mode detection
if (window.external && window.external.msWrapperVersion) {
    console.log('🧞 Aladin running in HTA mode');
}
// Resize window to reasonable size
try {
    window.resizeTo(1200, 800);
    window.moveTo((screen.width - 1200) / 2, (screen.height - 800) / 2);
} catch(e) {}
</script>
'''
    hta_content = hta_content.replace('</head>', hta_script + '</head>')
    
    output_path = DIST_DIR / 'aladin.hta'
    write_file(output_path, hta_content)
    
    size_kb = os.path.getsize(output_path) / 1024
    print(f"     ✅ Created aladin.hta ({size_kb:.1f} KB)")

def build_pwa():
    """Build PWA-ready version"""
    print("  📱 Building PWA version...")
    
    pwa_dir = DIST_DIR / "aladin-pwa"
    pwa_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy main files
    for f in ['index.html', 'styles.css']:
        src = BUILD_DIR / f
        if src.exists():
            shutil.copy(src, pwa_dir / f)
    
    # Copy JS directory
    js_src = BUILD_DIR / 'js'
    js_dst = pwa_dir / 'js'
    if js_src.exists():
        if js_dst.exists():
            shutil.rmtree(js_dst)
        shutil.copytree(js_src, js_dst)
    
    # Create manifest.json
    manifest = {
        "name": "Aladin - Local Knowledge Base",
        "short_name": "Aladin",
        "description": "Local-first encrypted knowledge base with AI search",
        "start_url": "/index.html",
        "display": "standalone",
        "background_color": "#1a1a2e",
        "theme_color": "#6c5ce7",
        "icons": [
            {
                "src": "icon-192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "icon-512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    }
    write_file(pwa_dir / 'manifest.json', json.dumps(manifest, indent=2))
    
    # Create service worker for offline support
    sw = '''// Aladin Service Worker - Offline Support
const CACHE_NAME = 'aladin-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/js/app.js',
    '/js/vault.js',
    '/js/storage.js',
    '/js/crypto.js',
    '/js/editor.js',
    '/js/sidebar.js',
    '/js/modal.js',
    '/js/utils.js',
    '/js/file-handler.js',
    '/js/ai.js',
    '/js/ai-chat.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
'''
    write_file(pwa_dir / 'sw.js', sw)
    
    # Modify index.html to add PWA support
    index_path = pwa_dir / 'index.html'
    index_html = read_file(index_path)
    
    pwa_head = '''
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#6c5ce7">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
'''
    index_html = index_html.replace('</head>', pwa_head + '</head>')
    
    pwa_script = '''
<script>
// Register service worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('PWA: Service worker registered'))
        .catch(err => console.log('PWA: Service worker failed', err));
}
</script>
'''
    index_html = index_html.replace('</body>', pwa_script + '</body>')
    
    write_file(index_path, index_html)
    
    print(f"     ✅ Created aladin-pwa/ directory")

def build_launcher_scripts():
    """Create simple launcher scripts"""
    print("  🚀 Creating launcher scripts...")
    
    # macOS/Linux launcher
    unix_launcher = '''#!/bin/bash
# Aladin Launcher - Just double-click to run!
# Starts a local server and opens in browser

cd "$(dirname "$0")"
PORT=8765

# Find free port
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

echo "🧞 Starting Aladin on http://localhost:$PORT"
echo "   Press Ctrl+C to stop"
echo ""

# Open browser after a short delay
(sleep 1 && open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" 2>/dev/null) &

# Start server
python3 -m http.server $PORT
'''
    unix_path = DIST_DIR / 'Start Aladin.command'
    write_file(unix_path, unix_launcher)
    os.chmod(unix_path, os.stat(unix_path).st_mode | stat.S_IEXEC)
    
    # Windows launcher
    win_launcher = '''@echo off
REM Aladin Launcher - Just double-click to run!
REM Starts a local server and opens in browser

cd /d "%~dp0"
set PORT=8765

echo 🧞 Starting Aladin on http://localhost:%PORT%
echo    Close this window to stop
echo.

REM Open browser
start http://localhost:%PORT%

REM Start server
python -m http.server %PORT%
'''
    write_file(DIST_DIR / 'Start Aladin.bat', win_launcher)
    
    print("     ✅ Created launcher scripts")

def main():
    parser = argparse.ArgumentParser(description='Build Aladin distribution packages')
    parser.add_argument('--html', action='store_true', help='Build only the portable HTML file')
    args = parser.parse_args()
    
    print("🧞 Building Aladin Distribution Packages")
    print("=" * 50)
    
    # Create dist directory
    DIST_DIR.mkdir(exist_ok=True)
    
    if args.html:
        # Build only the portable HTML
        build_portable_html()
        
        print("\n" + "=" * 50)
        print("✅ Build complete! Portable HTML created in ./dist/")
        print("\nPackage created:")
        print("  📄 aladin-portable.html  - Single file, works everywhere")
    else:
        # Build portable HTML first (used as base for others)
        html_content = build_portable_html()
        
        # Build platform-specific packages
        build_macos_app(html_content)
        build_windows_hta(html_content)
        build_pwa()
        build_launcher_scripts()
        
        # Copy attachments folder structure
        attachments_src = BUILD_DIR / 'attachments'
        if attachments_src.exists():
            for dist_path in [DIST_DIR / 'aladin-pwa' / 'attachments']:
                if not dist_path.exists():
                    dist_path.mkdir(parents=True)
        
        print("\n" + "=" * 50)
        print("✅ Build complete! Distribution packages in ./dist/")
        print("\nPackages created:")
        print("  📄 aladin-portable.html  - Single file, works everywhere")
        print("  🍎 Aladin.app/           - macOS app bundle (double-click)")
        print("  🪟 aladin.hta            - Windows app (double-click)")
        print("  📱 aladin-pwa/           - PWA (install from browser)")
        print("  🚀 Start Aladin.command  - macOS/Linux launcher script")
        print("  🚀 Start Aladin.bat      - Windows launcher script")
    
    print("\n💡 For AI features, set OLLAMA_ORIGINS=* before starting Ollama")

if __name__ == '__main__':
    main()
