import type { FC } from 'react'
import { WDD } from '../constants'

export const Divider: FC<{ visible?: boolean }> = ({ visible = true }) => (
  <div
    style={{
      height: 1,
      background: WDD,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.6s ease',
    }}
  />
)
