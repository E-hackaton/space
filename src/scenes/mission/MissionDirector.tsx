import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CruiseModel, MachineModel, Rocket } from '../../components/3d/Craft';
import { glowTexture } from '../../components/3d/glow';
import { latLonToVector3 } from '../../lib/geo';
import { BODIES, OVERVIEW, SUN_POSITION, bodyRegistry, sunDirectionAt, viewDirectionFor, type BodyHandle } from '../../lib/solarSystem';
import { landsOnSurface, type Machine } from '../../lib/machines';
import type { MissionAnim } from './missionAnim';

/** Site de lancement : Cap Canaveral, coordonnées approximatives (mise en scène). */
const LAUNCH_SITE = { lat: 28.5, lon: -80.6 };
const UP = new THREE.Vector3(0, 1, 0);

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeIn = (t: number) => t * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** Rotation à donner à la surface d'un astre pour que le site (lat, lon) regarde dans la direction voulue. */
function surfaceAngleFor(handle: BodyHandle, lat: number, lon: number, desired: THREE.Vector3): number {
  const qInv = handle.group.getWorldQuaternion(new THREE.Quaternion()).invert();
  const d = desired.clone().applyQuaternion(qInv);
  const v = latLonToVector3(lat, lon, 1);
  return Math.atan2(v.z, v.x) - Math.atan2(d.z, d.x);
}

function sitePoint(handle: BodyHandle, lat: number, lon: number, radius: number, out: THREE.Vector3) {
  out.copy(latLonToVector3(lat, lon, radius));
  return handle.surface.localToWorld(out);
}

interface Props {
  machine: Machine;
  anim: MissionAnim;
  /** Étape du récit (−1 = sur le pas de tir). */
  step: number;
  animate: boolean;
}

/**
 * Le « réalisateur » d'une mission : place l'engin (fusée, croisière, machine posée ou en orbite),
 * dirige la caméra et déclenche les effets, à partir des valeurs animées par GSAP.
 */
export function MissionDirector({ machine, anim, step, animate }: Props) {
  const cfg = BODIES[machine.body];
  const r = cfg.radius;
  const span = cfg.rings ? r * cfg.rings.outer * 1.05 : r;
  const surface = landsOnSurface(machine) && machine.lat !== undefined && machine.lon !== undefined;
  const impactSite = machine.fate === 'impact' && machine.lat !== undefined && machine.lon !== undefined;
  const current = step >= 0 ? machine.story[step] : undefined;
  const isEnd = current?.phase === 'end';
  const effectsSoFar = useMemo(
    () => new Set(machine.story.slice(0, Math.max(0, step + 1)).map((s) => s.effect).filter(Boolean)),
    [machine, step],
  );
  const laserOn = effectsSoFar.has('laser') && step >= machine.story.findIndex((s) => s.effect === 'laser');
  const dustStorm = machine.story.some((s) => s.effect === 'dust-storm');
  const flying = current?.effect === 'flight';
  const statusActive = !(isEnd && machine.fate !== 'active');

  // Objets pilotés à chaque image.
  const craft = useRef<THREE.Group>(null!);
  const rocket = useRef<THREE.Group>(null!);
  const cruise = useRef<THREE.Group>(null!);
  const deployed = useRef<THREE.Group>(null!);
  const flame = useRef(0);
  const fireball = useRef<THREE.Sprite>(null!);
  const flash = useRef<THREE.Sprite>(null!);
  const crater = useRef<THREE.Mesh>(null!);
  const haze = useRef<THREE.Mesh>(null!);
  const laserLine = useRef<THREE.Line>(null!);
  const laserPulse = useRef<THREE.Sprite>(null!);

  const glowWarm = useMemo(() => glowTexture('#ffb35c'), []);
  const glowWhite = useMemo(() => glowTexture('#fff3d6'), []);
  const glowLaser = useMemo(() => glowTexture('#ff5a5a'), []);
  const laserGeom = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), []);
  const laserLineObj = useMemo(
    () => new THREE.Line(laserGeom, new THREE.LineBasicMaterial({ color: '#ff5a5a', transparent: true, opacity: 0.35, toneMapped: false })),
    [laserGeom],
  );

  const oriented = useRef({ earth: false, dest: false });
  const orbitAngle = useRef(0);
  const camLook = useRef<THREE.Vector3 | null>(null);
  const v = useMemo(
    () => ({
      earthPos: new THREE.Vector3(), destPos: new THREE.Vector3(), pad: new THREE.Vector3(), padN: new THREE.Vector3(),
      site: new THREE.Vector3(), siteN: new THREE.Vector3(), approach: new THREE.Vector3(), craftPos: new THREE.Vector3(),
      tangent: new THREE.Vector3(), camPos: new THREE.Vector3(), look: new THREE.Vector3(), tmp: new THREE.Vector3(),
      orbitU: new THREE.Vector3(), orbitW: new THREE.Vector3(), impact: new THREE.Vector3(), impactN: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((state, dt) => {
    const earth = bodyRegistry.get('earth');
    const dest = bodyRegistry.get(machine.body);
    if (!earth || !dest || !craft.current) return;
    const a = anim;
    const camera = state.camera;

    // Une seule fois : tourner la Terre (pas de tir) et la destination (site) vers la lumière.
    if (!oriented.current.earth) {
      earth.group.updateWorldMatrix(true, false);
      earth.surface.rotation.y = surfaceAngleFor(earth, LAUNCH_SITE.lat, LAUNCH_SITE.lon, viewDirectionFor(earth.group.position));
      oriented.current.earth = true;
    }
    if (!oriented.current.dest && machine.body !== 'moon' && machine.body !== 'earth') {
      if (machine.lat !== undefined && machine.lon !== undefined) {
        dest.group.updateWorldMatrix(true, false);
        const p = dest.group.getWorldPosition(new THREE.Vector3());
        dest.surface.rotation.y = surfaceAngleFor(dest, machine.lat, machine.lon, viewDirectionFor(p));
      }
      oriented.current.dest = true;
    }

    earth.group.getWorldPosition(v.earthPos);
    dest.group.getWorldPosition(v.destPos);
    sitePoint(earth, LAUNCH_SITE.lat, LAUNCH_SITE.lon, BODIES.earth.radius, v.pad);
    v.padN.copy(v.pad).sub(v.earthPos).normalize();

    // --- Trajectoire : montée, puis tronçons (survols éventuels), puis approche.
    const ascentEnd = v.pad.clone().addScaledVector(v.padN, 0.93);
    if (surface) {
      sitePoint(dest, machine.lat!, machine.lon!, r, v.site);
      v.siteN.copy(v.site).sub(v.destPos).normalize();
      v.approach.copy(v.site).addScaledVector(v.siteN, r * 1.4);
    } else if (machine.kind === 'orbiter') {
      v.orbitU.copy(viewDirectionFor(v.destPos));
      v.orbitW.crossVectors(new THREE.Vector3(0.25, 1, 0).normalize(), v.orbitU).normalize();
      v.approach.copy(v.destPos).addScaledVector(v.orbitU, span * 2.4);
    } else {
      const inward = v.destPos.clone().sub(SUN_POSITION).normalize();
      v.approach.copy(v.destPos).addScaledVector(inward, -2);
    }
    const points = [ascentEnd];
    const flybyCenters: (THREE.Vector3 | null)[] = [null];
    for (const id of machine.cruise ?? []) {
      const h = bodyRegistry.get(id);
      if (!h) continue;
      const c = h.group.getWorldPosition(new THREE.Vector3());
      points.push(c.clone().add(new THREE.Vector3(0, BODIES[id].radius * 1.8, BODIES[id].radius * 2.2)));
      flybyCenters.push(c);
    }
    points.push(v.approach.clone());
    flybyCenters.push(null);
    const segments = points.length - 1;
    // Pile sur un point de survol, on reste en fin de tronçon (et non au début du suivant).
    const segIndex = Math.max(0, Math.min(segments - 1, Math.ceil(a.travel * segments) - 1));
    const segT = a.travel * segments - segIndex;
    const p0 = points[segIndex];
    const p1 = points[segIndex + 1];
    const len = p0.distanceTo(p1);
    const ctrl = p0.clone().lerp(p1, 0.5).addScaledVector(UP, len * 0.18);
    const curve = new THREE.QuadraticBezierCurve3(p0, ctrl, p1);

    // --- Position de l'engin.
    const R0 = machine.kind === 'orbiter' ? (cfg.rings ? span * 1.12 : r * 1.6) : 0;
    if (a.arrive > 0 && a.arrive >= 0.999 && machine.kind === 'orbiter' && animate) orbitAngle.current += dt * (0.25 + 1.2 * a.end);
    const ascentAlt = 0.03 + easeIn(a.launch) * 0.9;
    let finalScale = 0.035;

    if (a.travel <= 0) {
      v.craftPos.copy(v.pad).addScaledVector(v.padN, ascentAlt);
      v.tangent.copy(v.padN);
    } else if (a.arrive <= 0) {
      curve.getPoint(segT, v.craftPos);
      curve.getTangent(segT, v.tangent);
    } else {
      const final = v.tmp;
      if (surface) {
        const hover = flying ? r * 0.06 * (0.6 + 0.4 * Math.sin(state.clock.elapsedTime * 1.6)) : 0;
        final.copy(v.site).addScaledVector(v.siteN, hover);
        finalScale = r * 0.09;
      } else if (machine.kind === 'orbiter') {
        let R = R0;
        if (machine.fate === 'destroyed' || machine.fate === 'impact') R = THREE.MathUtils.lerp(R0, r * 0.97, easeIn(a.end));
        const th = orbitAngle.current;
        final.copy(v.destPos).addScaledVector(v.orbitU, Math.cos(th) * R).addScaledVector(v.orbitW, Math.sin(th) * R);
        if (impactSite) {
          sitePoint(dest, machine.lat!, machine.lon!, r, v.impact);
          v.impactN.copy(v.impact).sub(v.destPos).normalize();
          final.lerp(v.impact, smooth(0.55, 1, a.end));
        }
        finalScale = Math.max(0.05, span * 0.06);
      } else {
        const outward = v.destPos.clone().sub(SUN_POSITION).normalize();
        final.copy(v.destPos).addScaledVector(outward, a.end * 26);
        finalScale = 0.05;
      }
      v.craftPos.copy(v.approach).lerp(final, easeOut(a.arrive));
      v.tangent.copy(final).sub(v.approach).normalize();
    }

    // --- Apparence de l'engin.
    const onPad = a.travel <= 0.0001;
    const landedLook = a.arrive >= 0.97;
    const gone = (machine.fate === 'destroyed' || machine.fate === 'impact') && a.end > 0.93;
    rocket.current.visible = onPad;
    cruise.current.visible = !onPad && !landedLook && !gone;
    deployed.current.visible = !onPad && landedLook && !gone;
    flame.current = step >= 0 && onPad ? 1 : 0;
    craft.current.position.copy(v.craftPos);
    const scale = onPad ? 0.06 : THREE.MathUtils.lerp(0.035, finalScale, a.arrive);
    craft.current.scale.setScalar(scale);

    // Orientation : fusée vers le haut ; capsule bouclier en avant ; sonde antenne vers la Terre ; machine posée debout.
    const upDir = v.tmp.clone();
    if (onPad) upDir.copy(v.padN);
    else if (surface && a.arrive > 0.5) upDir.copy(v.siteN);
    else if (machine.kind === 'orbiter' || machine.kind === 'probe') upDir.copy(v.earthPos).sub(v.craftPos).normalize();
    else upDir.copy(v.tangent).negate();
    craft.current.quaternion.setFromUnitVectors(UP, upDir.normalize());

    // --- Effets.
    // Rentrée atmosphérique (boule de feu) puis éclair final.
    const dist = v.craftPos.distanceTo(v.destPos);
    const entering = (machine.fate === 'destroyed' || machine.fate === 'impact') && a.end > 0 && dist < r * 1.25 && !gone;
    fireball.current.visible = entering;
    if (entering) {
      fireball.current.position.copy(v.craftPos);
      fireball.current.scale.setScalar(Math.max(0.12, r * 0.25) * (0.8 + 0.2 * Math.sin(state.clock.elapsedTime * 30)));
    }
    const bell = Math.exp(-Math.pow((a.end - 0.95) / 0.04, 2));
    const showFlash = (machine.fate === 'destroyed' || machine.fate === 'impact') && a.end > 0.85;
    flash.current.visible = showFlash && bell > 0.02;
    if (flash.current.visible) {
      flash.current.position.copy(impactSite ? v.impact : v.craftPos);
      flash.current.scale.setScalar(Math.max(0.5, r * 1.4) * bell);
    }
    crater.current.visible = impactSite && a.end > 0.95;
    if (crater.current.visible) {
      crater.current.position.copy(v.impact).addScaledVector(v.impactN, r * 0.004);
      crater.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v.impactN);
      crater.current.scale.setScalar(r * 0.045);
    }
    // Tempête de poussière.
    haze.current.visible = dustStorm && a.decline > 0;
    if (haze.current.visible) {
      haze.current.position.copy(v.destPos);
      (haze.current.material as THREE.MeshStandardMaterial).opacity = a.decline * 0.85;
    }
    // Tir laser Terre → réflecteur → Terre : aller-retour d'environ 2,5 s, comme en vrai.
    laserLine.current.visible = laserOn && surface;
    laserPulse.current.visible = laserOn && surface;
    if (laserOn && surface) {
      const station = v.earthPos.clone().add(v.site.clone().sub(v.earthPos).normalize().multiplyScalar(BODIES.earth.radius));
      const pos = laserGeom.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, station.x, station.y, station.z);
      pos.setXYZ(1, v.site.x, v.site.y, v.site.z);
      pos.needsUpdate = true;
      laserGeom.computeBoundingSphere();
      const t = (state.clock.elapsedTime % 2.5) / 2.5;
      const f = t < 0.5 ? t * 2 : (1 - t) * 2;
      laserPulse.current.position.copy(station).lerp(v.site, f);
    }

    // --- Caméra cinématique.
    const sunHere = sunDirectionAt(v.destPos);
    if (onPad) {
      const side = new THREE.Vector3().crossVectors(v.padN, UP);
      if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
      side.normalize();
      const toward = viewDirectionFor(v.earthPos);
      const d = 0.22 + 2.6 * easeIn(a.launch);
      const dir = side.multiplyScalar(0.5).add(toward).normalize();
      v.camPos.copy(v.craftPos).addScaledVector(dir, d).addScaledVector(v.padN, -d * 0.12);
      v.look.copy(v.craftPos).addScaledVector(v.padN, 0.015);
    } else {
      // Caméra de poursuite pendant le voyage.
      const chase = v.craftPos.clone().addScaledVector(v.tangent, -0.55).addScaledVector(UP, 0.2);
      const chaseLook = v.craftPos.clone().lerp(v.destPos, smooth(0.6, 1, a.travel) * 0.5);
      // Pendant un survol, la caméra se tourne vers la planète survolée.
      const flyby = flybyCenters[segIndex + 1];
      if (flyby && a.arrive <= 0) chaseLook.lerp(flyby, smooth(0.4, 1, segT) * 0.85);
      // Cadrage final à destination.
      const finalCam = new THREE.Vector3();
      const finalLook = new THREE.Vector3();
      if (surface) {
        const tangentSun = sunHere.clone().addScaledVector(v.siteN, -sunHere.dot(v.siteN)).normalize();
        const back = 0.32 + (machine.fate === 'active' ? 5 : 1.8) * easeIn(a.end);
        finalCam.copy(v.site).addScaledVector(v.siteN, r * back).addScaledVector(tangentSun, r * (0.42 + 0.6 * a.end));
        finalLook.copy(v.site).addScaledVector(v.siteN, r * 0.06);
        if (machine.fate === 'active') finalLook.lerp(v.earthPos, easeIn(a.end) * 0.5);
        if (laserOn) {
          // Tir laser : vue de côté sur l'axe Terre-Lune, pour voir l'impulsion faire l'aller-retour.
          const axis = v.site.clone().sub(v.earthPos);
          const mid = v.earthPos.clone().addScaledVector(axis, 0.5);
          const side = new THREE.Vector3().crossVectors(axis, UP).normalize();
          if (side.dot(viewDirectionFor(mid)) < 0) side.negate();
          side.addScaledVector(sunDirectionAt(mid), 0.8).normalize();
          finalCam.copy(mid).addScaledVector(side, axis.length() * 0.95).addScaledVector(UP, axis.length() * 0.2);
          finalLook.copy(mid);
        }
      } else if (machine.kind === 'orbiter') {
        finalCam.copy(v.destPos).addScaledVector(viewDirectionFor(v.destPos), span * 3.1);
        finalLook.copy(v.destPos);
        if (impactSite && a.end > 0) {
          finalCam.lerp(v.impact.clone().addScaledVector(v.impactN, r * 2.2), smooth(0.3, 1, a.end));
          finalLook.lerp(v.impact, smooth(0.3, 1, a.end));
        }
      } else {
        const outward = v.destPos.clone().sub(SUN_POSITION).normalize();
        finalCam.copy(v.craftPos).addScaledVector(outward, -(3 + a.end * 45)).addScaledVector(UP, 1.2 + a.end * 22);
        finalLook.copy(v.craftPos).lerp(OVERVIEW.target, a.end * 0.4);
      }
      const k = easeOut(clamp01(a.arrive));
      v.camPos.copy(chase).lerp(finalCam, k);
      v.look.copy(chaseLook).lerp(finalLook, k);
    }

    // Lissage (coupe nette si mouvement réduit).
    const travelling = a.travel > 0 && a.travel < 1;
    const kPos = animate ? 1 - Math.exp(-dt * (travelling ? 7 : 2.6)) : 1;
    if (!camLook.current) {
      camLook.current = v.look.clone();
      if (!animate) camera.position.copy(v.camPos);
    }
    camera.position.lerp(v.camPos, kPos);
    camLook.current.lerp(v.look, kPos);
    const wantUp = onPad ? v.padN : surface && a.arrive > 0.5 && !laserOn ? v.siteN : UP;
    camera.up.lerp(wantUp, animate ? 1 - Math.exp(-dt * 2) : 1).normalize();
    camera.lookAt(camLook.current);
  });

  return (
    <>
      <group ref={craft}>
        <group ref={rocket}>
          <Rocket flame={flame} />
        </group>
        <group ref={cruise} visible={false}>
          <CruiseModel kind={machine.kind} />
        </group>
        <group ref={deployed} visible={false}>
          <MachineModel kind={machine.kind} active={statusActive} flying={flying} />
        </group>
      </group>
      <sprite ref={fireball} visible={false}>
        <spriteMaterial map={glowWarm} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <sprite ref={flash} visible={false}>
        <spriteMaterial map={glowWhite} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <mesh ref={crater} visible={false}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#1a1a1a" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh ref={haze} visible={false} scale={r * 1.045}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial color="#c98a5a" transparent opacity={0} depthWrite={false} roughness={1} />
      </mesh>
      <primitive object={laserLineObj} ref={laserLine} visible={false} />
      <sprite ref={laserPulse} visible={false} scale={0.12}>
        <spriteMaterial map={glowLaser} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
    </>
  );
}
