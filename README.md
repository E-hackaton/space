# Les Veilleurs du Système solaire

Projet pour le **NASA Space Apps Challenge 2026**, défi *« Abandonné mais pas oublié »*.

Les machines laissées par la NASA sur la Lune, sur Mars et dans l'espace lointain racontent leur propre histoire, à la première personne : pourquoi elles ont été envoyées, ce qu'elles ont découvert, et comment elles se sont endormies. Le site s'adresse à tous les curieux de l'espace : collégiens, lycéens, étudiants et grand public.

## Commandes

Flèches, ZQSD ou WASD pour conduire, Espace pour freiner. Sur téléphone : boutons à l'écran.

## Lancer le projet

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production (dans dist/)
npm run preview  # prévisualiser le build
```

## Technologies

React 18, TypeScript, Vite, React Three Fiber et drei (3D), GSAP (cinématiques), Motion (interface), Zustand (progression), react-i18next (français et anglais), Tailwind CSS. Narration provisoire par la synthèse vocale du navigateur (Web Speech).

## État d'avancement

- [x] Squelette, accueil 3D, carte du voyage, chapitres débloqués au fil du parcours, français et anglais, mode léger sans WebGL
- [x] Visite 3D du Système solaire (Mercure → espace lointain) : textures NASA, nuages, anneaux, atmosphère (shader Fresnel), vols de caméra, navigation au clavier
- [x] **Explorer** : on conduit un rover en direct sur une île terrestre, on clique sur la Lune ou Mars, on décolle, on voyage, on atterrit, puis on roule à côté des vraies machines. À Jezero et Gale, Perseverance, Ingenuity et Curiosity rejouent leurs **vrais trajets** (données NASA/JPL), sol après sol, en laissant leurs traces ; sur la Lune, le site d'Apollo 11 (étage de descente, sismomètre, réflecteur laser et tir laser Terre-Lune)
- [x] Parcours « Missions » avec Orbi, le robot guide : choix de l'astre et de la machine, décollage depuis la Terre, voyage, arrivée, puis récit à la première personne jusqu'à la fin de la machine (animations GSAP)
- [x] 8 machines : réflecteur laser d'Apollo 11, Opportunity, Ingenuity, MESSENGER, Magellan, Galileo, Cassini, Voyager 1 (faits tirés des fiches NASA, **à faire relire** : `verified: false`)
- [ ] Chapitre Lune et tir laser
- [ ] Chapitre Mars (Opportunity, Spirit, Ingenuity)
- [ ] Histoire narrée avec sous-titres
- [ ] Quiz et carnet de badges
- [ ] Page Sources complète
- [ ] Mode démo jury

## Sources et crédits

**Trajets des rovers martiens** : NASA/JPL, cartes MMGIS (fichiers GeoJSON publics), convertis par `scripts/build_traverses.py` en `public/data/*.json` (mètres locaux, sols, altitude). Le terrain de chaque site suit l'altitude réelle le long des trajets, lissée ; le petit relief (bosses, cratères) est décoratif. Échelle des sites : 1 unité = 40 m ; les engins sont agrandis pour être visibles.
- Perseverance : https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json
- Ingenuity : https://mars.nasa.gov/mmgis-maps/M20/Layers/json/m20_heli_waypoints.json
- Curiosity : https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json et MSL_waypoints.json

Pour mettre à jour les trajets : télécharger ces fichiers dans un dossier, puis `python3 scripts/build_traverses.py <dossier> public/data`.

**Textures** (détail dans `src/content/credits.json`) :
- Terre : NASA/Goddard Space Flight Center Scientific Visualization Studio ; données Blue Marble Next Generation, Reto Stöckli (NASA/GSFC) et NASA Earth Observatory. [SVS 3615](https://svs.gsfc.nasa.gov/3615/)
- Lune : NASA Scientific Visualization Studio, CGI Moon Kit (données LRO). [SVS 4720](https://svs.gsfc.nasa.gov/4720/)
- Mars : mosaïque Viking MDIM 2.1, NASA/JPL/USGS (domaine public). [USGS Astrogeology](https://astrogeology.usgs.gov/search/details/Mars/Viking/MDIM21/Mars_Viking_MDIM21_ClrMosaic_global_232m/cub)
- Mercure : mosaïque globale MESSENGER, NASA. [PIA16298](https://photojournal.jpl.nasa.gov/catalog/PIA16298)
- Jupiter : carte cylindrique Cassini, NASA. [PIA07782](https://photojournal.jpl.nasa.gov/catalog/PIA07782)
- Vénus et Saturne : textures d'illustration créées par l'équipe (pas des cartes réelles).
- Modèles 3D des engins : formes simples génériques créées par l'équipe, pas des répliques.


Chaque fait affiché renvoie à une source officielle de la NASA ou du JPL (page « Sources » du site). Les tailles et distances des scènes 3D ne sont pas à l'échelle. Ce projet n'est ni affilié à la NASA ni approuvé par elle.
