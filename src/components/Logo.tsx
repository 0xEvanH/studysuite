import type { FC, CSSProperties } from 'react'
import logoUrl from '/logo.svg'

interface Props {
  size?: number
  style?: CSSProperties
  className?: string
}

export const Logo: FC<Props> = ({ size = 20, style, className }) => (
  <img
    src={logoUrl}
    width={size}
    height={size}
    alt="StudyVault"
    style={{ display: 'block', ...style }}
    className={className}
  />
)
