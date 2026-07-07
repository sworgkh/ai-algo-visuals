import type { SVGProps } from 'react'

/**
 * Minimal inline icon set (stroke-based, currentColor). Kept local so the build
 * pulls in zero icon-library weight and every glyph matches the design system.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 18, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const ChevronLeft = (p: IconProps) => (
  <Base {...p}>
    <path d="m15 18-6-6 6-6" />
  </Base>
)
export const ChevronRight = (p: IconProps) => (
  <Base {...p}>
    <path d="m9 18 6-6-6-6" />
  </Base>
)
export const Play = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 4.5 19 12 6 19.5z" fill="currentColor" stroke="none" />
  </Base>
)
export const Pause = (p: IconProps) => (
  <Base {...p}>
    <rect x="6.5" y="5" width="3.4" height="14" rx="1" fill="currentColor" stroke="none" />
    <rect x="14.1" y="5" width="3.4" height="14" rx="1" fill="currentColor" stroke="none" />
  </Base>
)
export const SkipBack = (p: IconProps) => (
  <Base {...p}>
    <path d="M18 5 8 12l10 7z" fill="currentColor" stroke="none" />
    <line x1="6" y1="5" x2="6" y2="19" />
  </Base>
)
export const SkipForward = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 5l10 7-10 7z" fill="currentColor" stroke="none" />
    <line x1="18" y1="5" x2="18" y2="19" />
  </Base>
)
export const Reset = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v4h4" />
  </Base>
)
export const Lock = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Base>
)
export const Star = (p: IconProps) => (
  <Base {...p}>
    <path
      d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.9L12 17l-5.3 2.7 1-5.9L3.5 9.7l5.9-.9z"
      fill="currentColor"
      stroke="none"
    />
  </Base>
)
export const PanelLeft = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="9.5" y1="4" x2="9.5" y2="20" />
  </Base>
)
export const Home = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 11 12 4l8 7" />
    <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
  </Base>
)
export const Sparkles = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" fill="currentColor" stroke="none" />
    <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z" fill="currentColor" stroke="none" />
  </Base>
)
export const Graph = (p: IconProps) => (
  <Base {...p}>
    <circle cx="6" cy="7" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="9" cy="18" r="2.5" />
    <circle cx="18" cy="17" r="2.5" />
    <path d="M8.2 8.3 7.3 15.6M8.5 7 15.6 6.2M10.9 17.3l4.6-.4M16.4 8l1.3 6.6" />
  </Base>
)
