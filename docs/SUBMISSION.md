# FORBITS : textes de soumission et script vidéo

Équipe G. Bugs · NASA Space Apps Challenge 2026 · Abidjan
Défi : *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars*

> Le formulaire officiel se remplit **en anglais**. Les textes ci-dessous sont prêts à copier-coller.
> Les éléments entre crochets [ ] sont à compléter par l'équipe.

---

## 1. Project Name

**FORBITS: Their missions ended. Their stories live on.**

## 2. High-Level Summary (50 à 200 mots ; ce texte en fait 188)

> FORBITS is an immersive, bilingual (French/English) web app that brings NASA's abandoned machines back to life
> for young space fans. Users pick a world (the Moon, Mars or Beyond) and arrive in a 3D scene where 13 real
> machines sit at their true coordinates, from Surveyor 3 and the Apollo 11 descent stage to Opportunity,
> Ingenuity and Pioneer 10. Sankofa, a friendly robot guide named after an Akan symbol meaning "go back and
> fetch what was left behind", flies to the chosen machine, which then introduces itself in the first person
> and tells its mission in six chronological phases, from design to legacy. A 3D model highlights each part as
> the story unfolds, clickable hotspots explain what each component did, hands-on experiments (timing a laser
> echo from the Moon, flying Ingenuity in thin Martian air, keeping Opportunity's solar panels clean) show how
> missions really worked, and quizzes unlock collectible cards. A time machine replays 60 years of exploration.
> Every fact is sourced to NASA (NSSDCA, NASA Science). FORBITS is an installable PWA that also works offline,
> because many young explorers in Côte d'Ivoire use phones with limited data.

## 3. Project Demo

- **Format retenu : vidéo de 30 secondes** (un projet en 3D et en audio se montre mieux qu'en diapositives).
- Lien public (YouTube non répertorié ou Google Drive en lecture publique) : [LIEN À AJOUTER]
- **Sous-titres anglais obligatoires** (voir le script plus bas).
- ⚠️ Aucun visage, nom ni voix de mineur. Aucun logo NASA dans la vidéo.

## 4. Final Project

- Site en ligne : https://space.techledger.io
- Code : https://github.com/E-hackaton/space [vérifier que le dépôt est public, ou fournir un lien d'accès]

## 5. Project Details

> **What it does.** FORBITS turns the history of NASA's left-behind hardware into a guided, story-driven
> exploration. Its flow: (1) a welcome tour by Sankofa, the robot guide, with voice and a language choice;
> (2) a choice of three worlds in 3D; (3) a cinematic arrival on a 3D globe built from NASA LRO and Viking
> mosaics, with machines placed at their documented coordinates and a "time machine" slider from 1966 to today;
> (4) Sankofa flies to the selected machine; (5) the machine introduces itself and narrates its mission in six
> phases (design, launch, arrival, exploration, discovery, legacy) while the camera moves to the relevant part
> of its 3D model; (6) interactive experiments, a quiz and a collectible card.
>
> **How it works.** React + TypeScript front end with Three.js / React Three Fiber; Django REST API with an
> admin so non-developers can edit the bilingual content; voices pre-generated with ElevenLabs on the server
> (only changed texts are regenerated), with the browser's speech synthesis as a fallback; deployed with Docker
> Compose and Caddy (HTTPS). The 3D machines are low-poly models built in code: lightweight on mobile, free of
> agency logos, and made of named parts the guided tour can highlight.
>
> **Benefits.** It explains complex missions in plain words for ages ~10 and up, links engineering to science
> ("why did this machine matter?"), works offline as a PWA, respects reduced-motion settings, offers keyboard
> and screen-reader access, and every 3D view has a 2D fallback.
>
> **Why it matters to us.** Space history is mostly told in English and for experts. FORBITS tells it in
> French and English, for young people in Côte d'Ivoire and everywhere else, through an African symbol of
> remembering.
>
> **Tools.** React, TypeScript, Vite, Three.js, React Three Fiber, drei, Django, Django REST Framework,
> ElevenLabs, Docker, Caddy, vite-plugin-pwa.

## 6. Use of Artificial Intelligence (obligatoire)

À cocher dans le formulaire et à indiquer dans le site (README) :

- **Assistant de code et de rédaction (LLM) : Claude (Anthropic).** Aide à l'écriture du code et des premiers jets
  des textes, tous relus et vérifiés par l'équipe à partir des sources NASA.
- **Génération de voix : ElevenLabs** (si les voix ont été générées avant la soumission). Narrations des machines
  et de Sankofa, préparées à l'avance à partir de nos textes.
- Aucune image générée par IA. **Aucun logo, drapeau ou identifiant de mission NASA** n'a été produit ni modifié.

## 7. NASA Data (au moins une ressource du défi est obligatoire)

- NASA Space Science Data Coordinated Archive (NSSDCA) : https://nssdc.gsfc.nasa.gov/
  - Apollo 11 Lunar Module : https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C
  - Apollo 15 Lunar Module / LRV : https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C
  - ALSEP : https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C
- NASA Science mission pages: Surveyor 3, Mars Pathfinder, Spirit & Opportunity, Viking 1, InSight, Ingenuity,
  NEAR Shoemaker, Pioneer 10, Curiosity, Perseverance (https://science.nasa.gov/mission/…)
- NASA/JPL Photojournal PIA23178 (Opportunity's final traverse map)
- Moon map: CGI Moon Kit, NASA Scientific Visualization Studio (LRO LROC color mosaic): https://svs.gsfc.nasa.gov/4720/
- Mars map: Viking MDIM 2.1 color mosaic, NASA/JPL/USGS

La liste complète, machine par machine, est dans l'API (champ `sources`) et sur chaque fiche du site.

## 8. Space Agency Partner & Other Data / References

- USGS Astrogeology (Mars Viking color mosaic); reduced copy from Wikimedia Commons.
- Libraries (all open source): React, React Router, Three.js, React Three Fiber, drei, Phosphor Icons, Django,
  Django REST Framework, django-cors-headers, Pillow, gunicorn, Caddy, vite-plugin-pwa.
- Fonts: Fira Sans and Overpass (SIL Open Font License), via Fontsource.
- The "Sankofa" name refers to the Akan Adinkra symbol; the robot character is an original design.

---

## 9. Script de la vidéo (30 secondes)

Narration en français (voix d'adulte) + **sous-titres anglais** incrustés. Musique : uniquement libre de droits,
ou pas de musique. Capture d'écran du site en ligne, sur ordinateur, avec un plan sur téléphone à la fin.

| Temps | À l'écran | Voix (FR) | Sous-titre (EN) |
|---|---|---|---|
| 0–4 s | Ciel étoilé, Sankofa apparaît et salue | « Depuis 1966, des dizaines de machines ont été laissées dans l'espace. » | *Since 1966, dozens of machines have been left in space.* |
| 4–8 s | Les 3 mondes en 3D, clic sur Mars | « Avec FORBITS, choisis un monde… » | *With FORBITS, pick a world…* |
| 8–13 s | Arrivée cinématique sur Mars, puis Sankofa vole jusqu'à Opportunity | « …et Sankofa t'emmène à leur rencontre. » | *…and Sankofa takes you to meet them.* |
| 13–19 s | Opportunity en 3D, ses roues s'illuminent ; frise 2004 → 2018 | « Chaque machine raconte sa mission, de son lancement à son héritage. » | *Each machine tells its mission, from launch to legacy.* |
| 19–24 s | Clic sur un « + », puis l'expérience « Fais décoller Ingenuity » | « Explore ses pièces, refais ses expériences… » | *Explore its parts, redo its experiments…* |
| 24–27 s | Quiz réussi, la carte se retourne | « …et gagne sa carte. » | *…and win its card.* |
| 27–30 s | Logo texte FORBITS + slogan, bascule FR/EN, plan sur téléphone | « FORBITS. Leur mission est terminée. Leur histoire continue. » | *FORBITS. Their missions ended. Their stories live on.* |

**Conseils de tournage**
- Enregistrer l'écran en 1080p (OBS ou l'enregistreur intégré), puis monter (CapCut ou DaVinci Resolve).
- Passer d'abord une fois sur chaque écran : les modèles et les cartes seront en cache, donc plus fluides.
- Vérifier la lisibilité des sous-titres sur téléphone (taille ≥ 5 % de la hauteur de l'image).
- Mettre la vidéo en ligne en **public ou non répertoriée**, et tester le lien en navigation privée.

---

## 10. Liste de vérification avant d'envoyer

- [ ] Résumé collé (50–200 mots)
- [ ] Lien vidéo public, testé en navigation privée, sous-titres anglais visibles
- [ ] Lien du site et du dépôt
- [ ] Rubrique IA cochée (Claude, et ElevenLabs si utilisé)
- [ ] Au moins une ressource NASA du défi listée (NSSDCA)
- [ ] Toutes les références listées (code, polices, cartes)
- [ ] Aucun logo NASA, aucune image ni voix de mineur
- [ ] Soumission envoyée **avant dimanche 23h00** (clôture à 23h59)
