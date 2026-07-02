import type { JSX } from 'react'

interface P {
  size?: number
}
const s = (size = 18): { width: number; height: number; viewBox: string; fill: string; stroke: string; strokeWidth: number; strokeLinecap: 'round'; strokeLinejoin: 'round' } => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
})

export const IconLock = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)
export const IconPlus = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IconMinus = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M5 12h14" />
  </svg>
)
export const IconCheck = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)
export const IconSearch = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)
export const IconCopy = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)
export const IconEye = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
export const IconEyeOff = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13 13 0 0 1-2.16 2.83M6.6 6.6A13 13 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 5.4-1.6" />
    <path d="m2 2 20 20" />
    <path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" />
  </svg>
)
export const IconEdit = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)
export const IconTrash = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  </svg>
)
export const IconStar = ({ size }: P): JSX.Element => (
  <svg {...s(size)} fill="currentColor" stroke="none">
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2Z" />
  </svg>
)
export const IconStarOutline = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2Z" />
  </svg>
)
export const IconKey = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
  </svg>
)
export const IconCloud = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M17.5 19a4.5 4.5 0 0 0 0-9h-1.8A7 7 0 1 0 4 16.3" />
    <path d="M12 12v9M8 17l4 4 4-4" />
  </svg>
)
export const IconSettings = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.7l-.06-.06A2 2 0 1 1 7.37 5.8l.06.06A1.65 1.65 0 0 0 9.25 6 1.65 1.65 0 0 0 10 4.6V4a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 9H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z" />
  </svg>
)
export const IconX = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)
export const IconRefresh = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
  </svg>
)
export const IconUpload = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
)
export const IconDownload = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
)
export const IconExternal = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
  </svg>
)
export const IconSun = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)
export const IconMoon = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
)
export const IconChevronLeft = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)
export const IconChevronRight = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)
export const IconAlert = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
)
export const IconFolder = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
  </svg>
)
export const IconTag = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.8 8.8a2 2 0 0 0 2.8 0l6.4-6.4a2 2 0 0 0 0-2.8Z" />
    <circle cx="7.5" cy="7.5" r="1.3" fill="currentColor" />
  </svg>
)
export const IconGrid = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)
export const IconList = ({ size }: P): JSX.Element => (
  <svg {...s(size)}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
)
