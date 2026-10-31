import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { POST } from '@/config/lighting.config'

/**
 * Post-processing.
 *
 * Three effects, all in service of the lighting rather than of style:
 *
 *   • Bloom, so the recessed LED strips and the mirror halos actually read as
 *     light sources. Every emissive surface in the scene is authored with
 *     `toneMapped={false}` specifically so it clears the bloom threshold while
 *     the ivory walls stay below it.
 *   • Tone mapping — see below.
 *   • Vignette, which does what the lens on the reference photographs did.
 *
 * TONE MAPPING HAS TO LIVE HERE, NOT ON THE RENDERER.
 *
 * `SalonScene` sets `gl.toneMapping = ACESFilmicToneMapping`, and that is what
 * the medium and low tiers use. The composer does not honour it: it renders
 * the scene into its own HDR buffer, so on the top tier the renderer's tone
 * mapping and its exposure were both being bypassed completely. Two things
 * followed from that, and both were live bugs:
 *
 *   1. The top tier had NO filmic highlight rolloff at all — bright values were
 *      simply clamped. That is a large part of why the salon used to blow out.
 *   2. `toneMappingExposure` did nothing on the top tier. Proven by setting it
 *      to 0.25: the medium tier dropped to mean luminance 104, the top tier did
 *      not move off 201.
 *
 * Placed after Bloom so the glow is gathered in HDR and tone-mapped with
 * everything else, and before Vignette so the corner falloff is applied to the
 * final displayed image.
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom
        intensity={POST.bloom.intensity}
        luminanceThreshold={POST.bloom.luminanceThreshold}
        luminanceSmoothing={POST.bloom.luminanceSmoothing}
        mipmapBlur={POST.bloom.mipmapBlur}
        radius={POST.bloom.radius}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={POST.vignette.offset} darkness={POST.vignette.darkness} />
    </EffectComposer>
  )
}
