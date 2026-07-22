import { studentInitials } from '../lib/students/display'

type Props = {
  name: string
  color: string
  size?: 'sm' | 'md'
  title?: string
}

export function StudentInitials({ name, color, size = 'sm', title }: Props) {
  const dim = size === 'md' ? 'h-9 w-9 text-xs' : 'h-7 w-7 text-[10px]'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-slate-800 ring-2 ring-white/80 ${dim}`}
      style={{ background: color }}
      title={title || name}
      aria-hidden={title ? undefined : true}
    >
      {studentInitials(name)}
    </span>
  )
}
