/** Bruit de valeur 2D déterministe + fBm, pour le relief de détail (petites dunes, bosses). */
function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * (valueNoise(x * f, y * f) * 2 - 1);
    f *= 2;
    amp *= 0.5;
  }
  return sum;
}

/** Cratères pseudo-aléatoires (forme de bol avec un bourrelet). Décor, pas des cratères réels. */
export function craters(x: number, z: number, cell = 40, seed = 1): number {
  const cx = Math.floor(x / cell);
  const cz = Math.floor(z / cell);
  let h = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const gx = cx + i;
      const gz = cz + j;
      const r = hash(gx * 7 + seed, gz * 13 + seed);
      if (r < 0.45) continue;
      const px = (gx + hash(gx + seed, gz)) * cell;
      const pz = (gz + hash(gx, gz + seed)) * cell;
      const rad = cell * (0.12 + 0.3 * hash(gx + 3, gz + 5 + seed));
      const d = Math.hypot(x - px, z - pz) / rad;
      if (d < 1) h += -(1 - d * d) * rad * 0.18;
      else if (d < 1.4) h += Math.sin(((d - 1) / 0.4) * Math.PI) * rad * 0.05;
    }
  }
  return h;
}
