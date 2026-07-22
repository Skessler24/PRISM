import type { PrismIcon } from './catalog'
import { iconDataUri } from './catalog'

type Props = {
  icon?: PrismIcon
  label: string
  className?: string
  size?: number
}

/**
 * Renders catalog SVG. Animated icons must be inline SVG so CSS keyframes run
 * (important for Smart TV / digital AAC boards). Static icons use data-URI <img>.
 */
export function IconGlyph({ icon, label, className = '', size = 40 }: Props) {
  if (icon?.animated) {
    return (
      <span
        className={`inline-flex items-center justify-center overflow-hidden ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label={label}
        // Animated pack SVGs are generated offline from the Fitzgerald AAC set.
        dangerouslySetInnerHTML={{ __html: scaleSvg(icon.svg, size) }}
      />
    )
  }
  if (icon) {
    return (
      <img
        src={iconDataUri(icon)}
        alt=""
        width={size}
        height={size}
        className={className}
        draggable={false}
      />
    )
  }
  return (
    <span
      className={`inline-flex items-center justify-center text-2xl ${className}`}
      style={{ width: size, height: size }}
    >
      {label.slice(0, 1).toUpperCase()}
    </span>
  )
}

/** Force width/height on root SVG for consistent tile sizing. */
function scaleSvg(markup: string, size: number): string {
  if (/<svg\b[^>]*\bwidth=/.test(markup)) {
    return markup
      .replace(/\bwidth="[^"]*"/, `width="${size}"`)
      .replace(/\bheight="[^"]*"/, `height="${size}"`)
  }
  return markup.replace(
    /<svg\b/,
    `<svg width="${size}" height="${size}" style="display:block"`,
  )
}
