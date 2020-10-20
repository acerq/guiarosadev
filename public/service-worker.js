"use strict";

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

var timeLogin = null;
var idSolicitante = null;
var lastCall = null;

const FILES_TO_CACHE = [
  "/",
  "/bdpaciente.html",
  "/burger.html",
  "/cadusuario.html",
  "/index.html",
  "/inicio.html",
  "/login.html",
  "/menu_medico.html",
  "/menu_paciente.html",
  "/offline.html",
  "/solicitacao.html",
  "/scripts/app.js",
  "/scripts/cadusuario.js",
  "/scripts/dao_paciente.js",
  "/scripts/install.js",
  "/scripts/jquery.js",
  "/scripts/jquery.maskedinput-1.4.1.pack.js",
  "/styles/inline.css"
];

self.addEventListener("install", evt => {
  console.log("[SW] Instalação");
  caches.keys().then(keyList => {
    return Promise.all(
      keyList.map(key => {
        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
          console.log("[SW] Removendo cache antigo", key);
          return caches.delete(key);
        }
      })
    );
  });

  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[SW] Pré-caching dos arquivos" + cache);
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", evt => {
  console.log("[SW] Activate");
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("[SW] Removendo cache antigo", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", evt => {
  //-------------- Login
  if (evt.request.url.includes("/login")) {
    console.log("[SW] Fetch Login (data)", evt.request.url);
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            if (response.status === 200) {
              console.log("[SW] /login (response) 200: ", evt.request.url);
              console.log("[SW] /login (response) body: ", response.body);
              cache.put(evt.request.url, response.clone());
            }
            return response;
          })
          .catch(err => {
            console.log("[SW] /login (response) ERROR: ", evt.request.url);
            return cache.match(evt.request);
          });
      })
    );
    return;
  }
  //-------------- Load
  if (evt.request.url.includes("/load")) {
    console.log("[SW] Fetch Load (data)", evt.request.url);
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            if (response.status === 200) {
              console.log("[SW] /load (response) 200: ", evt.request.url);
              console.log("[SW] /load (response) body: ", response.body);
              cache.put(evt.request.url, response.clone());
            }
            return response;
          })
          .catch(err => {
            console.log("[SW] /load (response) ERROR: ", evt.request.url);
            return cache.match(evt.request);
          });
      })
    );
    return;
  }
  //-------------- solicitacao
  if (evt.request.url.includes("/solicitacao")) {
    console.log("[SW] Fetch Solicitacao (data)", evt.request.url);
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            if (response.status === 200) {
              console.log("[SW] /load (response) 200: ", evt.request.url);
              console.log("[SW] /load (response) body: ", response.body);
              cache.put(evt.request.url, response.clone());
            }
            return response;
          })
          .catch(err => {
            console.log("[SW] /load (response) ERROR: ", evt.request.url);
            return cache.match(evt.request);
          });
      })
    );
    return;
  }
  evt.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(evt.request).then(response => {
        return response || fetch(evt.request);
      });
    })
  );
});
