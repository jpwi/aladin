// Aladin Service Worker - Offline Support
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
