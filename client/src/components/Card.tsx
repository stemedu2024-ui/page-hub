import { ReactNode } from 'react'
import { colors, radius, spacing, shadow } from '../styles/designSystem'

interface CardProps {
  children: ReactNode
  style?: React.CSSProperties
  className?: string
  onClick?: () => void
}

const Card = ({ children, style, className, onClick }: CardProps) => {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: colors.card,
        borderRadius: radius.xs, // Instagram은 거의 직각 (4px)
        padding: spacing.md, // 12px (Instagram 스타일)
        boxShadow: shadow.none, // Instagram은 그림자 없음
        border: `1px solid ${colors.border}`, // 얇은 테두리만
        transition: 'all 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = colors.cardHover
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = colors.card
        }
      }}
    >
      {children}
    </div>
  )
}

export default Card
