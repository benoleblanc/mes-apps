// Service worker de « Mes applis » (page publiée sur GitHub Pages). Il ne contient aucune donnée.
// But : permettre l'installation et rouvrir la page même sans réseau.
// Stratégie « réseau d'abord » : en ligne, on prend toujours la dernière version publiée (puis on la garde en copie) ;
// hors ligne, on rouvre la dernière copie. La copie est la page déjà CHIFFRÉE : sans le NIP, elle ne montre rien.
// « no-cache » : GitHub Pages demande au navigateur de garder ses fichiers 10 minutes ; on force la vérification auprès du
// serveur (léger : si rien n'a changé, rien n'est retéléchargé) pour voir tout de suite une nouvelle publication.
// Pour changer la stratégie, changer aussi le numéro de VERSION : les anciennes copies sont alors effacées.
const VERSION = "mes-applis-v1";
const FICHIERS = ["./", "index.html", "manifest.webmanifest", "icone-192.png"];

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(FICHIERS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((noms) => Promise.all(noms.filter((nom) => nom !== VERSION).map((nom) => caches.delete(nom))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evenement) => {
  const demande = evenement.request;
  if (demande.method !== "GET" || new URL(demande.url).origin !== self.location.origin) return;
  evenement.respondWith(
    fetch(demande, { cache: "no-cache" })
      .then((reponse) => {
        if (reponse.ok) {
          const copie = reponse.clone();
          caches.open(VERSION).then((cache) => cache.put(demande, copie));
        }
        return reponse;
      })
      .catch(() => caches.match(demande).then((trouvee) => trouvee || caches.match("./"))),
  );
});
