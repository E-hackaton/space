"""
Convertit les trajets NASA/JPL (MMGIS, GeoJSON) en données compactes pour le site.

Sources (téléchargées à la main, voir README) :
  https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_traverse.json      (Perseverance)
  https://mars.nasa.gov/mmgis-maps/M20/Layers/json/m20_heli_waypoints.json (Ingenuity)
  https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json      (Curiosity)
  https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json     (Curiosity, sols)

Usage : python3 scripts/build_traverses.py <dossier_des_geojson> public/data
Sortie : un JSON par site, avec
  - les trajets en mètres locaux (x = est, z = sud) et l'altitude, plus le sol de chaque point ;
  - une grille d'altitude du terrain qui suit l'altitude réelle le long des trajets.
"""
import json, math, sys, os

MARS_R = 3396190.0  # rayon équatorial de Mars (m)
SRC, OUT = sys.argv[1], sys.argv[2]

def project(lon0, lat0):
    k = math.pi / 180 * MARS_R
    c = math.cos(math.radians(lat0))
    return lambda lon, lat: ((lon - lon0) * k * c, -(lat - lat0) * k)

def traverse(path, proj, min_step=6.0):
    """Points [x, z, altitude, temps en sols] ; un point tous les ~6 m."""
    feats = json.load(open(path))['features']
    feats.sort(key=lambda f: (f['properties']['sol'], f['properties'].get('SCLK_START') or 0))
    pts, last = [], None
    for f in feats:
        sol = f['properties']['sol']
        coords = f['geometry']['coordinates']
        n = len(coords)
        for i, (lon, lat, alt) in enumerate(coords):
            x, z = proj(lon, lat)
            if last and math.hypot(x - last[0], z - last[1]) < min_step and i not in (0, n - 1):
                continue
            t = sol + 0.9 * (i / max(1, n - 1))
            if last and t <= last[3]:
                t = last[3] + 1e-4
            p = [round(x, 1), round(z, 1), round(alt, 1), round(t, 4)]
            pts.append(p); last = p
    return pts

def traverse_by_distance(path, waypoints, proj, min_step=6.0):
    """Trajet sans sol par segment (Curiosity) : on retrouve le temps grâce à la distance cumulée
    des étapes (dist_total_m → sol)."""
    feats = json.load(open(path))['features']
    coords = []
    for f in feats:
        g = f['geometry']
        lines = g['coordinates'] if g['type'] == 'MultiLineString' else [g['coordinates']]
        for line in lines:
            coords += line
    wps = sorted(((w['properties']['dist_total_m'], w['properties']['sol']) for w in json.load(open(waypoints))['features']))
    pts, cum, prev, last = [], 0.0, None, None
    raw = []
    for lon, lat, alt in coords:
        x, z = proj(lon, lat)
        if prev:
            cum += math.hypot(x - prev[0], z - prev[1])
        prev = (x, z)
        raw.append((x, z, alt, cum))
    total_path, total_wp = raw[-1][3], wps[-1][0]
    j = 0
    for x, z, alt, d in raw:
        dw = d / total_path * total_wp
        while j < len(wps) - 2 and wps[j + 1][0] < dw:
            j += 1
        (d0, s0), (d1, s1) = wps[j], wps[j + 1]
        t = s0 + (s1 - s0) * ((dw - d0) / (d1 - d0) if d1 > d0 else 0)
        if last and math.hypot(x - last[0], z - last[1]) < min_step:
            continue
        if last and t <= last[3]:
            t = last[3] + 1e-4
        p = [round(x, 1), round(z, 1), round(alt, 1), round(t, 4)]
        pts.append(p); last = p
    return pts

def heightgrid(samples, bounds, n=129, sigma=260.0):
    """Altitude du terrain : plan moyen + écarts lissés autour des points des trajets."""
    xs = [s[0] for s in samples]; zs = [s[1] for s in samples]; hs = [s[2] for s in samples]
    # Plan des moindres carrés h = a x + b z + c
    N = len(samples)
    sx, sz, sh = sum(xs), sum(zs), sum(hs)
    sxx = sum(x*x for x in xs); szz = sum(z*z for z in zs); sxz = sum(x*z for x, z in zip(xs, zs))
    sxh = sum(x*h for x, h in zip(xs, hs)); szh = sum(z*h for z, h in zip(zs, hs))
    import itertools
    A = [[sxx, sxz, sx], [sxz, szz, sz], [sx, sz, N]]; B = [sxh, szh, sh]
    def solve(A, B):
        M = [row[:] + [b] for row, b in zip(A, B)]
        for i in range(3):
            p = max(range(i, 3), key=lambda r: abs(M[r][i])); M[i], M[p] = M[p], M[i]
            for r in range(3):
                if r != i:
                    f = M[r][i] / M[i][i]
                    M[r] = [a - f*b for a, b in zip(M[r], M[i])]
        return [M[i][3] / M[i][i] for i in range(3)]
    a, b, c = solve(A, B)
    sub = samples[::max(1, len(samples) // 1500)]
    x0, z0, x1, z1 = bounds
    grid = []
    for j in range(n):
        z = z0 + (z1 - z0) * j / (n - 1)
        row = []
        for i in range(n):
            x = x0 + (x1 - x0) * i / (n - 1)
            base = a*x + b*z + c
            wsum = 0.0; acc = 0.0
            for s in sub:
                d2 = (s[0]-x)**2 + (s[1]-z)**2
                w = math.exp(-d2 / (2*sigma*sigma))
                wsum += w; acc += w * (s[2] - (a*s[0] + b*s[1] + c))
            # Loin des trajets, on revient doucement vers le plan moyen.
            resid = acc / wsum * min(1.0, wsum) if wsum > 1e-9 else 0.0
            row.append(round(base + resid, 1))
        grid.append(row)
    return grid

def bounds_of(points, margin):
    xs = [p[0] for p in points]; zs = [p[1] for p in points]
    cx, cz = (min(xs)+max(xs))/2, (min(zs)+max(zs))/2
    half = max(max(xs)-min(xs), max(zs)-min(zs))/2 + margin
    return (cx-half, cz-half, cx+half, cz+half)

def site(name, lon0, lat0, rovers, helis=()):
    proj = project(lon0, lat0)
    out = {'id': name, 'origin': {'lon': lon0, 'lat': lat0}, 'paths': {}, 'flights': {}}
    allpts = []
    for rid, f, *wp in rovers:
        pts = traverse_by_distance(os.path.join(SRC, f), os.path.join(SRC, wp[0]), proj) if wp else traverse(os.path.join(SRC, f), proj)
        out['paths'][rid] = pts; allpts += pts
    for hid, f in helis:
        feats = json.load(open(os.path.join(SRC, f)))['features']
        fl = []
        for ft in sorted(feats, key=lambda f: f['properties']['Flight']):
            p = ft['properties']; x, z = proj(p['Lon'], p['Lat'])
            fl.append({'flight': p['Flight'], 'sol': p['Sol'], 'x': round(x, 1), 'z': round(z, 1),
                       'alt': round(ft['geometry']['coordinates'][2], 1), 'maxAlt': p['Max_Alt_m'], 'date': p['Earth_Date']})
        out['flights'][hid] = fl
        allpts += [[f_['x'], f_['z'], f_['alt'], f_['sol']] for f_ in fl]
    b = bounds_of(allpts, 900)
    out['terrain'] = {'bounds': [round(v, 1) for v in b], 'size': 129, 'heights': heightgrid(allpts, b)}
    json.dump(out, open(os.path.join(OUT, f'{name}.json'), 'w'), separators=(',', ':'))
    print(name, {k: len(v) for k, v in out['paths'].items()}, {k: len(v) for k, v in out['flights'].items()},
          'extent m', round(b[2]-b[0]))

# Origines : premier point des données (site d'atterrissage).
site('jezero', 77.45088572, 18.44462715, [('perseverance', 'M20_traverse.json')], [('ingenuity', 'm20_heli_waypoints.json')])
site('gale', 137.441633, -4.589467, [('curiosity', 'MSL_traverse.json', 'MSL_waypoints.json')])
