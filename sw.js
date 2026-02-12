/**
 * Service Worker for Davkografika PWA
 */

const APP_VERSION = 'v8';
const CACHE_NAME = 'davko-grafika-' + APP_VERSION;
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/tax2025.js',
    '/js/tax2026.js',
    '/img/icon.png',
    '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});

// Message handler - respond with version
self.addEventListener('message', (event) => {
    if (event.data === 'GET_VERSION') {
        event.source.postMessage({ type: 'VERSION', version: APP_VERSION });
    }
});

// Fetch event - network-first for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        // Network-first for HTML navigation requests
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the fresh response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then((response) => response || caches.match('/index.html'));
                })
        );
    } else {
        // Cache-first for static assets
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request);
                })
                .catch(() => {
                    // Silently fail for non-navigation requests
                })
        );
    }
});
