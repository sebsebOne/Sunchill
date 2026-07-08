/* SunChill — mise en cache légère de la coquille de l'appli.
   Les données cartographiques (tuiles, bâtiments, recherche) restent
   toujours récupérées en direct : seule l'interface se charge hors-ligne. */
const CACHE = "sunchill-v6";
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
  // seule la coquille locale passe par le cache ; tout le reste (cartes, API) va toujours au réseau
  if(url.origin === location.origin){
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
