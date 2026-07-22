import type { PrismIcon } from './catalog'
import { iconDataUri } from './catalog'

type Props = {
  icon?: PrismIcon
  label: string
  className?: string
  size?: number
}

/** Renders catalog SVG (or emoji fallback). Swap catalog/files without touching board UI. */
export function IconGlyph({ icon, label, className = '', size = 40 }: Props) {
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
    <span className={`inline-flex items-center justify-center text-2xl ${className}`} style={{ width: size, height: size }}>
      {label.slice(0, 1).toUpperCase()}
    </span>
  )
}
