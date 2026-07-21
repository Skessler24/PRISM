import { Link, useLocation } from 'react-router-dom'
import { getTabByPath } from '../app/tabs'

type BreadcrumbsProps = {
  trail?: { label: string; to?: string }[]
}

export function Breadcrumbs({ trail = [] }: BreadcrumbsProps) {
  const location = useLocation()
  const tab = getTabByPath(location.pathname)

  const crumbs = [{ label: 'PRISM', to: '/' }, { label: tab.label, to: tab.path }, ...trail]

  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-xs text-[var(--subtext)]">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {crumb.to && !isLast ? (
                <Link to={crumb.to} className="font-medium text-[var(--accent)] hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-semibold text-[var(--text)]' : undefined}>
                  {crumb.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
