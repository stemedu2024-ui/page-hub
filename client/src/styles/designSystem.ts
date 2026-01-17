/**
 * Phase 7-E: Instagram UI 스타일 디자인 시스템
 * 
 * 원칙:
 * - Instagram 피드/댓글 UI와 동일한 느낌
 * - 모바일 퍼스트 (Instagram은 모바일 앱 중심)
 * - 컴팩트하고 미니멀한 디자인
 */

// Spacing Scale - Instagram 스타일 (컴팩트)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
} as const

// Border Radius - Instagram은 거의 직각 (또는 4px)
export const radius = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  full: '9999px',
} as const

// Font Size Scale - Instagram 스타일 (14px 기준)
export const fontSize = {
  xs: '0.75rem',    // 12px - meta text (시간, 댓글 수)
  sm: '0.875rem',   // 14px - body text (본문, 닉네임)
  base: '0.875rem', // 14px - 기본 (Instagram 본문은 14px)
  lg: '1rem',       // 16px - emphasized
  xl: '1.125rem',   // 18px - subtitle
  xxl: '1.25rem',   // 20px - title (최소화)
  xxxl: '1.5rem',   // 24px - large title (사용 최소화)
} as const

// Font Weight - Instagram 스타일
export const fontWeight = {
  normal: 400,      // 일반 텍스트
  medium: 500,      // 중간 강조
  semibold: 600,    // 닉네임, 버튼
  bold: 700,        // 타이틀 (최소 사용)
} as const

// Color Palette - Instagram 스타일
export const colors = {
  // Background
  background: '#FFFFFF',
  backgroundSecondary: '#FAFAFA', // Instagram 배경 회색
  backgroundTertiary: '#F5F5F5',
  
  // Card
  card: '#FFFFFF',
  cardHover: '#FAFAFA',
  
  // Primary - Instagram 파란색 (링크/하이라이트)
  primary: '#0095F6',
  primaryLight: '#4DB5F9',
  primaryDark: '#0074CC',
  primaryBackground: '#E0F2FE',
  
  // Text - Instagram 검은색/회색
  textPrimary: '#262626',    // Instagram 검은색
  textSecondary: '#8E8E8E',  // Instagram 회색
  textTertiary: '#A8A8A8',   // 더 연한 회색
  textDisabled: '#C7C7C7',
  
  // Accent (Instagram은 accent 사용 최소화, 필요시에만)
  accent: '#ED4956',         // Instagram 하트 색상 (좋아요)
  accentLight: '#FF6B7A',
  accentBackground: '#FFF5F5',
  
  // Divider - Instagram 스타일
  divider: '#EFEFEF',        // Instagram 구분선 색상
  dividerLight: '#FAFAFA',
  
  // Border
  border: '#DBDBDB',         // Instagram 테두리 색상
  borderLight: '#EFEFEF',
  
  // State Colors
  error: '#ED4956',          // Instagram 에러/좋아요 색상
  errorLight: '#FFF5F5',
  success: '#0095F6',        // Instagram 링크 색상
  successLight: '#E0F2FE',
  warning: '#F79E1B',
  warningLight: '#FFF5E6',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.65)',  // Instagram 모달 오버레이
  overlayDark: 'rgba(0, 0, 0, 0.75)',
} as const

// Shadow - Instagram 스타일 (최소화, 거의 없음)
export const shadow = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.02)',  // Instagram은 그림자 거의 없음
  md: '0 2px 4px rgba(0, 0, 0, 0.05)',
  lg: '0 4px 8px rgba(0, 0, 0, 0.08)',
} as const

// Breakpoints
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const

// Transition
export const transition = {
  fast: '0.15s ease',
  base: '0.2s ease',
  slow: '0.3s ease',
} as const
