import { useMemo } from 'react'
import { detectDevice, forcedFallback, forcedTier, type DeviceProfile } from '@/utils/perf'

/**
 * Device capability, resolved once per session.
 *
 * QA overrides (documented in the README):
 *   ?fallback=1        force the static cinematic experience
 *   ?tier=low|medium|high  force a render tier
 */
export function useDeviceProfile(): DeviceProfile {
  return useMemo(() => {
    const base = detectDevice()
    const override = forcedTier()
    const profile: DeviceProfile = override
      ? {
          ...base,
          tier: override,
          dpr: override === 'high' ? [1, 2] : override === 'medium' ? [1, 1.5] : [1, 1],
          shadows: override === 'high',
          reflections: override === 'high',
          postProcessing: override === 'high',
        }
      : base

    if (forcedFallback()) return { ...profile, tier: 'none' }
    return profile
  }, [])
}
