import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'solid' | 'outline' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
  /** Renders as an anchor when set — keeps external links semantic. */
  href?: string
  target?: string
  rel?: string
}

/**
 * The site's one button.
 *
 * Letterspaced small caps with a hairline rule that fills on hover — no
 * gradients, no lift, no shadow. The restraint is the point.
 */
export default function Button({
  variant = 'solid',
  children,
  href,
  target,
  rel,
  className = '',
  ...rest
}: Props) {
  const cls = `btn btn--${variant} ${className}`.trim()

  if (href) {
    return (
      <a className={cls} href={href} target={target} rel={rel}>
        <span className="btn__label">{children}</span>
      </a>
    )
  }

  return (
    <button className={cls} {...rest}>
      <span className="btn__label">{children}</span>
    </button>
  )
}
