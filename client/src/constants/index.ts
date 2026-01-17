// 공개 범위 상수
export const VISIBILITY_OPTIONS = [
  { value: 'private', label: '나만' },
  { value: 'friends', label: '친구만' },
  { value: 'teachers', label: '선생님만' },
  { value: 'friends_teachers', label: '친구+선생님' },
  { value: 'public', label: '전체' },
] as const

// 포스트 타입 상수
export const POST_TYPES = {
  GENERAL: 'general',
  QUESTION: 'question',
  MATERIAL: 'material',
  POLL: 'poll',
  CHALLENGE: 'challenge',
  GOAL: 'goal',
} as const

// 질문 상태 상수
export const QUESTION_STATUS = {
  PENDING: 'pending',
  ANSWERED: 'answered',
} as const

// 알림 타입 상수
export const NOTIFICATION_TYPES = {
  QUESTION_ANSWER: 'question_answer',
  COMMENT: 'comment',
  LIKE: 'like',
  FRIEND_REQUEST: 'friend_request',
  ANNOUNCEMENT: 'announcement',
  QUESTION_COMMENT: 'question_comment',
} as const

// API 엔드포인트
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    FRIENDS: '/users/friends',
  },
  POSTS: {
    BASE: '/posts',
    FEED: '/posts/feed',
    BY_ID: (id: string) => `/posts/${id}`,
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    READ: '/notifications/read',
  },
  MESSAGES: {
    BASE: '/messages',
    CONVERSATION: '/messages/conversation',
  },
} as const
