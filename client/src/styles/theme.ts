// PageHub 디자인 시스템 - 밝고 따뜻한 SNS 스타일

export const theme = {
  colors: {
    // 메인 컬러 (밝은 노란색 계열)
    primary: {
      light: '#FFF9E6', // 매우 밝은 노란색 (배경)
      main: '#FFE082', // 밝은 노란색
      dark: '#FFB300', // 진한 노란색
    },
    // 보조 컬러 (녹색 계열)
    secondary: {
      light: '#E8F5E9', // 연한 녹색
      main: '#66BB6A', // 메인 녹색
      dark: '#388E3C', // 진한 녹색
    },
    // 강조 컬러 (빨간색/핑크 계열)
    accent: {
      light: '#FFEBEE', // 연한 핑크
      main: '#EF5350', // 메인 빨간색
      dark: '#C62828', // 진한 빨간색
    },
    // 중성 컬러
    neutral: {
      white: '#FFFFFF',
      lightGray: '#F5F5F5',
      gray: '#E0E0E0',
      darkGray: '#9E9E9E',
      black: '#212121',
    },
    // 상태 컬러
    status: {
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3',
    },
  },
  typography: {
    fontFamily: {
      main: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      heading: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
  },
  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    full: '9999px', // 완전히 둥근 모서리
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
}

export type Theme = typeof theme
