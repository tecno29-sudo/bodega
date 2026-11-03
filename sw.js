// Bodega PorcinoMangas: funciona sin conexión.
const CACHE='bodega-v12';
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
const EXT=['https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
  'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Zen+Kaku+Gothic+New:wght@400;500;700&family=IBM+Plex+Mono:wght@500;600&display=swap'];
self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await c.addAll(CORE);
  await Promise.all(EXT.map(u=>fetch(u,{mode:'cors'}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})));
  self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys()) if(k!==CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url), same=u.origin===location.origin;
  if(u.searchParams.has('rest_route')||u.pathname.includes('/wp-json/')) return; // datos de la tienda: nunca desde la caché
  if(same&&(r.mode==='navigate'||u.pathname.endsWith('/index.html'))){
    // red primero: así recibes las versiones nuevas; sin conexión usa la guardada
    e.respondWith(fetch(r).then(res=>{ if(res.ok){const cp=res.clone(); caches.open(CACHE).then(c=>c.put('index.html',cp))} return res })
      .catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(r,{ignoreSearch:same}).then(hit=>hit||fetch(r).then(res=>{
    if(res.ok||res.type==='opaque'){const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp))} return res;
  })));
});
