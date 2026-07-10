/* SunChill — mise en cache de la coquille de l'appli.
   Stratégie « réseau d'abord » pour la page elle-même : chaque ouverture
   récupère la dernière version en ligne si le réseau répond, et ne bascule
   sur la copie hors-ligne qu'en dernier recours (pas de réseau). Cela évite
   qu'une ancienne version reste bloquée en cache après une mise à jour. */
const CACHE = "sunchill-v0.22";
const SHELL = ["./", "./index.html", "./manifest.json",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", e=>{
  const url = new URL(e.request.url);
  if(url.origin !== location.origin) return; // cartes, API : toujours en direct

  const isPage = e.request.mode === "navigate" || e.request.destination === "document";
  if(isPage){
    // réseau d'abord : la dernière version s'affiche dès qu'il y a du réseau
    e.respondWith(
      fetch(e.request)
        .then(res=>{ caches.open(CACHE).then(c=>c.put(e.request, res.clone())); return res; })
        .catch(()=> caches.match(e.request).then(c=> c || caches.match("./index.html")))
    );
  } else {
    // fichiers statiques (icônes, manifeste) : cache d'abord, plus rapide
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
