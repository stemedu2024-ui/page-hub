import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = ({ label, error, style, id, ...props }: InputProps) => {
  // 접근성: error 메시지를 aria-describedby로 연결 (Phase 7-C-1)
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#388E3C',
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: `2px solid ${error ? '#EF5350' : '#E0E0E0'}`,
          borderRadius: '12px',
          fontSize: '1rem',
          transition: 'all 0.2s ease',
          background: '#FFFFFF',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#66BB6A'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 187, 106, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#EF5350' : '#E0E0E0'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{
            marginTop: '0.25rem',
            fontSize: '0.875rem',
            color: '#EF5350',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = ({ label, error, style, id, ...props }: TextareaProps) => {
  // 접근성: error 메시지를 aria-describedby로 연결 (Phase 7-C-1)
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  const errorId = error ? `${textareaId}-error` : undefined

  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && (
        <label
          htmlFor={textareaId}
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#388E3C',
          }}
        >
          {label}
        </label>
      )}
      <textarea
        {...props}
        id={textareaId}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: `2px solid ${error ? '#EF5350' : '#E0E0E0'}`,
          borderRadius: '12px',
          fontSize: '1rem',
          transition: 'all 0.2s ease',
          background: '#FFFFFF',
          resize: 'vertical',
          fontFamily: 'inherit',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#66BB6A'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 187, 106, 0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#EF5350' : '#E0E0E0'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{
            marginTop: '0.25rem',
            fontSize: '0.875rem',
            color: '#EF5350',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
