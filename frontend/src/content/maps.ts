/**
 * Cartes de fond de l'Atlas (fichiers dans public/maps/).
 *
 * Les deux cartes sont des images NASA du domaine public, en projection équirectangulaire,
 * de -180° à +180° de longitude (voir lib/geo.ts). Le crédit doit toujours être affiché.
 */

import type { BodySlug } from '../types/api'

export interface MapAsset {
  src: string
  credit: string
  sourceUrl: string
}

export const MAPS: Partial<Record<BodySlug, MapAsset>> = {
  moon: {
    src: '/maps/moon.jpg',
    credit: 'Carte : NASA / GSFC / Arizona State University, mosaïque couleur LRO (CGI Moon Kit, NASA SVS)',
    sourceUrl: 'https://svs.gsfc.nasa.gov/4720/',
  },
  mars: {
    src: '/maps/mars.jpg',
    credit: 'Carte : NASA / JPL / USGS, mosaïque couleur Viking MDIM 2.1',
    sourceUrl: 'https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m',
  },
}
