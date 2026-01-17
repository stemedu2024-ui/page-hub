import { AppError } from '../middleware/errorHandler'

// 비밀번호 검증 (최소 6자)
export const validatePassword = (password: string): boolean => {
  return password.length >= 6
}

// 닉네임 검증 (최소 2자, 최대 20자)
export const validateNickname = (nickname: string): boolean => {
  return nickname.length >= 2 && nickname.length <= 20
}

// 이름 검증 (최소 2자, 최대 20자)
export const validateName = (name: string): boolean => {
  return name.length >= 2 && name.length <= 20
}

// ID 검증 (최소 3자, 최대 20자, 영문/숫자만 허용)
export const validateId = (id: string): boolean => {
  const idRegex = /^[a-zA-Z0-9]{3,20}$/
  return idRegex.test(id)
}

// 회원가입 데이터 검증
export const validateRegisterData = (data: {
  id: string
  name: string
  nickname: string
  password: string
}): void => {
  if (!data.id || data.id.trim().length === 0) {
    throw new AppError('ID를 입력해주세요.', 400)
  }

  if (!validateId(data.id)) {
    throw new AppError('ID는 3자 이상 20자 이하의 영문/숫자만 사용 가능합니다.', 400)
  }

  if (!data.name || data.name.trim().length === 0) {
    throw new AppError('이름을 입력해주세요.', 400)
  }

  if (!validateName(data.name)) {
    throw new AppError('이름은 2자 이상 20자 이하여야 합니다.', 400)
  }

  if (!validateNickname(data.nickname)) {
    throw new AppError('닉네임은 2자 이상 20자 이하여야 합니다.', 400)
  }

  if (!validatePassword(data.password)) {
    throw new AppError('비밀번호는 최소 6자 이상이어야 합니다.', 400)
  }
}

// 로그인 데이터 검증
export const validateLoginData = (data: { id: string; password: string }): void => {
  if (!data.id || !data.password) {
    throw new AppError('ID와 비밀번호를 입력해주세요.', 400)
  }

  if (!validateId(data.id)) {
    throw new AppError('올바른 ID 형식이 아닙니다.', 400)
  }
}
