/**
 * Shared material instances.
 *
 * three.js compiles one shader program per unique material configuration, so
 * reusing a single leather material across seven chairs is the difference
 * between one program and seven. Materials are created lazily and released by
 * `disposeSharedMaterials()` when the canvas unmounts.
 */

import * as THREE from 'three'
import { MATERIALS } from '@/config/materials.config'
import { LED_NICHE } from './emissive'

const registry: THREE.Material[] = []

function keep<T extends THREE.Material>(m: T): T {
  registry.push(m)
  return m
}

let _leather: THREE.MeshPhysicalMaterial | null = null
export const leatherMaterial = () =>
  (_leather ??= keep(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(MATERIALS.leather.color),
      roughness: MATERIALS.leather.roughness,
      metalness: 0,
      envMapIntensity: MATERIALS.leather.envMapIntensity,
      sheen: MATERIALS.leather.sheen,
      sheenColor: new THREE.Color(MATERIALS.leather.sheenColor),
      sheenRoughness: 0.5,
    }),
  ))

let _leatherShell: THREE.MeshPhysicalMaterial | null = null
/**
 * The tub chair's wrap-around shell is a single open sheet, so it has to be
 * visible from the inside as well — you look straight into the back of the
 * chair from the front. The gold rim caps the sheet edge at the top.
 */
export const leatherShellMaterial = () =>
  (_leatherShell ??= keep(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(MATERIALS.leather.color),
      roughness: MATERIALS.leather.roughness,
      metalness: 0,
      envMapIntensity: MATERIALS.leather.envMapIntensity,
      sheen: MATERIALS.leather.sheen,
      sheenColor: new THREE.Color(MATERIALS.leather.sheenColor),
      sheenRoughness: 0.5,
      side: THREE.DoubleSide,
    }),
  ))

let _gold: THREE.MeshStandardMaterial | null = null
export const goldMaterial = () =>
  (_gold ??= keep(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(MATERIALS.gold.color),
      roughness: MATERIALS.gold.roughness,
      metalness: 1,
      envMapIntensity: MATERIALS.gold.envMapIntensity,
    }),
  ))

let _goldTrim: THREE.MeshStandardMaterial | null = null
export const goldTrimMaterial = () =>
  (_goldTrim ??= keep(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(MATERIALS.goldTrim.color),
      roughness: MATERIALS.goldTrim.roughness,
      metalness: 1,
      envMapIntensity: MATERIALS.goldTrim.envMapIntensity,
    }),
  ))

let _lacquer: THREE.MeshStandardMaterial | null = null
export const lacquerMaterial = () =>
  (_lacquer ??= keep(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(MATERIALS.lacquer.color),
      roughness: MATERIALS.lacquer.roughness,
      metalness: 0,
      envMapIntensity: MATERIALS.lacquer.envMapIntensity,
    }),
  ))

let _cabinet: THREE.MeshStandardMaterial | null = null
export const cabinetMaterial = () =>
  (_cabinet ??= keep(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(MATERIALS.cabinet.color),
      roughness: MATERIALS.cabinet.roughness,
      metalness: 0,
      envMapIntensity: MATERIALS.cabinet.envMapIntensity,
    }),
  ))

let _gloss: THREE.MeshPhysicalMaterial | null = null
export const glossMaterial = () =>
  (_gloss ??= keep(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(MATERIALS.gloss.color),
      roughness: MATERIALS.gloss.roughness,
      metalness: 0,
      envMapIntensity: MATERIALS.gloss.envMapIntensity,
      clearcoat: MATERIALS.gloss.clearcoat,
      clearcoatRoughness: MATERIALS.gloss.clearcoatRoughness,
    }),
  ))

let _chrome: THREE.MeshStandardMaterial | null = null
export const chromeMaterial = () =>
  (_chrome ??= keep(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(MATERIALS.chrome.color),
      roughness: MATERIALS.chrome.roughness,
      metalness: 1,
      envMapIntensity: MATERIALS.chrome.envMapIntensity,
    }),
  ))

let _porcelain: THREE.MeshPhysicalMaterial | null = null
export const porcelainMaterial = () =>
  (_porcelain ??= keep(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(MATERIALS.porcelain.color),
      roughness: MATERIALS.porcelain.roughness,
      metalness: 0,
      envMapIntensity: MATERIALS.porcelain.envMapIntensity,
      clearcoat: MATERIALS.porcelain.clearcoat,
      clearcoatRoughness: MATERIALS.porcelain.clearcoatRoughness,
    }),
  ))

let _velvet: THREE.MeshPhysicalMaterial | null = null
export const velvetMaterial = () =>
  (_velvet ??= keep(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(MATERIALS.velvet.color),
      roughness: MATERIALS.velvet.roughness,
      metalness: 0,
      envMapIntensity: MATERIALS.velvet.envMapIntensity,
      sheen: MATERIALS.velvet.sheen,
      sheenRoughness: MATERIALS.velvet.sheenRoughness,
      sheenColor: new THREE.Color(MATERIALS.velvet.sheenColor),
    }),
  ))

let _emissive: THREE.MeshBasicMaterial | null = null
/**
 * Warm LED emission for the backlit niches. HDR and untone-mapped, so bloom
 * picks it out while the ivory plaster around it stays below threshold —
 * see `materials/emissive.ts`.
 */
export const ledMaterial = () =>
  (_emissive ??= keep(new THREE.MeshBasicMaterial({ color: LED_NICHE, toneMapped: false })))

let _timber: THREE.MeshStandardMaterial | null = null
export const timberMaterial = () =>
  (_timber ??= keep(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(MATERIALS.timber.color),
      roughness: MATERIALS.timber.roughness,
      metalness: 0,
      envMapIntensity: MATERIALS.timber.envMapIntensity,
    }),
  ))

export function disposeSharedMaterials() {
  registry.forEach((m) => m.dispose())
  registry.length = 0
  _leather = _leatherShell = null
  _gold = _goldTrim = null
  _lacquer = _cabinet = _chrome = _timber = null
  _gloss = _porcelain = _velvet = null
  _emissive = null
}
