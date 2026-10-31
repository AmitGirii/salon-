import { CAMERA_VIEWS } from '@/config/camera.config'
import { setCameraMode, useCurrentPose, useExperience } from '@/hooks/useExperienceStore'

/**
 * The view switcher.
 *
 * Picking a view moves the CAMERA and nothing else — the page stays exactly
 * where the visitor left it. Someone reading the price list who wants to see
 * the mirror gets the mirror, not a scroll jump to a different section.
 *
 * The highlight tracks whichever pose is actually live, whether that came from
 * a button or from the section the visitor scrolled to.
 *
 * Hidden on the static fallback, where there is no camera to switch.
 */
export default function CameraModeBar() {
  const currentPose = useCurrentPose()
  const phase = useExperience((s) => s.phase)
  const fallback = useExperience((s) => s.fallback)

  if (fallback || phase === 'loading') return null

  return (
    <div className={`modebar${phase === 'exploring' ? ' is-visible' : ''}`}>
      <span className="modebar__label label">View</span>
      <div className="modebar__group" role="group" aria-label="Camera view">
        {CAMERA_VIEWS.map((v) => {
          const active = currentPose === v.pose
          return (
            <button
              key={v.pose}
              type="button"
              className={`modebar__btn${active ? ' is-active' : ''}`}
              aria-current={active ? 'true' : undefined}
              onClick={() => setCameraMode(v.pose)}
            >
              {v.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
