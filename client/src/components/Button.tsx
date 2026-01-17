import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  disabled?: boolean
  style?: React.CSSProperties
  size?: 'sm' | 'md' | 'lg'
  'aria-label'?: string // 접근성: 텍스트가 없는 아이콘 버튼용 (Phase 7-C-1)
}

const Button = ({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  style,
  size = 'md',
  'aria-label': ariaLabel,
}: ButtonProps) => {
  const baseStyle: React.CSSProperties = {
    padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.875rem 2rem' : '0.75rem 1.5rem',
    borderRadius: '24px',
    fontWeight: 600,
    fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.125rem' : '1rem',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)',
      color: '#FFFFFF',
    },
    secondary: {
      background: 'linear-gradient(135deg, #FFE082 0%, #FFB300 100%)',
      color: '#212121',
    },
    danger: {
      background: 'linear-gradient(135deg, #EF5350 0%, #C62828 100%)',
      color: '#FFFFFF',
    },
    outline: {
      background: 'transparent',
      color: '#66BB6A',
      border: '2px solid #66BB6A',
      boxShadow: 'none',
    },
  }

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(102, 187, 106, 0.4)',
    },
    secondary: {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(255, 224, 130, 0.4)',
    },
    danger: {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(239, 83, 80, 0.4)',
    },
    outline: {
      background: '#E8F5E9',
      transform: 'translateY(-2px)',
    },
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-disabled={disabled} // 접근성: disabled 상태를 스크린리더가 인식 (Phase 7-C-1)
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...(disabled && { opacity: 0.6 }),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, hoverStyles[variant])
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = baseStyle.boxShadow as string
          if (variant === 'outline') {
            e.currentTarget.style.background = 'transparent'
          }
        }
      }}
    >
      {children}
    </button>
  )
}

export default Button
