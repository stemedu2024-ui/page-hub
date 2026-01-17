const Footer = () => {
  return (
    <footer
      style={{
        background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%)',
        padding: '2rem',
        borderTop: '2px solid rgba(255, 224, 130, 0.3)',
        marginTop: 'auto',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          color: '#9E9E9E',
          fontSize: '0.875rem',
        }}
      >
        <p style={{ marginBottom: '0.5rem' }}>
          © 2024 PageHub. 학생과 선생님을 위한 교육 커뮤니티
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>이용약관</span>
          <span>•</span>
          <span>개인정보처리방침</span>
          <span>•</span>
          <span>문의하기</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
