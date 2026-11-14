/**
 * Planète vivante en pur CSS (aucune 3D à charger) : la texture défile derrière un disque
 * ombré, ce qui donne l'illusion d'une rotation. Le mouvement s'arrête si l'utilisateur
 * réduit les animations (voir index.css).
 */
const TEXTURES: Record<string, string> = {
  moon: '/textures/moon_color.jpg',
  mars: '/textures/mars_color.jpg',
  earth: '/textures/earth_color.jpg',
  jupiter: '/textures/jupiter_color.jpg',
};
const GLOW: Record<string, string> = { moon: '#cfd8ff', mars: '#ff9a6a', earth: '#6fb4ff', 'deep-space': '#9b7bff', jupiter: '#ffcf9a' };

export function LivingPlanet({ body, size = 160 }: { body: string; size?: number }) {
  const tex = TEXTURES[body];
  return (
    <span
      className={`living-planet ${tex ? '' : 'living-planet-deep'}`}
      style={{ width: size, height: size, ['--glow' as string]: GLOW[body] ?? '#9fb6ff', backgroundImage: tex ? `url(${tex})` : undefined }}
      aria-hidden="true"
    />
  );
}
