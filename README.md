# Les Veilleurs du Système solaire

Projet pour le **NASA Space Apps Challenge 2026**, défi *« Abandonné mais pas oublié »*.

Les machines laissées par la NASA sur la Lune, sur Mars et dans l'espace lointain racontent leur propre histoire, à la première personne : pourquoi elles ont été envoyées, ce qu'elles ont découvert, et comment elles se sont endormies. Le site s'adresse à tous les curieux de l'espace : collégiens, lycéens, étudiants et grand public.

## Lancer le projet

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production (dans dist/)
npm run preview  # prévisualiser le build
```

## Technologies

React 18, TypeScript, Vite, React Three Fiber et drei (3D), Zustand (progression), react-i18next (français et anglais), Tailwind CSS, Motion.

## État d'avancement

- [x] Squelette, accueil 3D, carte du voyage, chapitres débloqués au fil du parcours, français et anglais, mode léger sans WebGL
- [ ] Chapitre Lune et tir laser
- [ ] Chapitre Mars (Opportunity, Spirit, Ingenuity)
- [ ] Histoire narrée avec sous-titres
- [ ] Quiz et carnet de badges
- [ ] Page Sources complète
- [ ] Mode démo jury

## Sources et crédits

Chaque fait affiché renvoie à une source officielle de la NASA ou du JPL (page « Sources » du site). Les tailles et distances des scènes 3D ne sont pas à l'échelle. Ce projet n'est ni affilié à la NASA ni approuvé par elle.
