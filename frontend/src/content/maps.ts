/**
 * Cartes de fond (fichiers dans public/maps/), utilisées en 2D et comme texture des globes 3D.
 *
 * Les deux cartes sont des images NASA du domaine public, en projection équirectangulaire,
 * de -180° à +180° de longitude (voir lib/geo.ts). Le crédit (traduit dans t.maps) doit toujours être affiché.
 */

export interface MapAsset {
  src: string
  /** Clé du crédit dans le dictionnaire (t.maps). */
  creditKey: 'moon' | 'mars'
  sourceUrl: string
}

export const MAPS: Partial<Record<'moon' | 'mars' | 'elsewhere', MapAsset>> = {
  moon: { src: '/maps/moon.jpg', creditKey: 'moon', sourceUrl: 'https://svs.gsfc.nasa.gov/4720/' },
  mars: {
    src: '/maps/mars.jpg',
    creditKey: 'mars',
    sourceUrl: 'https://astrogeology.usgs.gov/search/map/mars_viking_colorized_global_mosaic_232m',
  },
}
