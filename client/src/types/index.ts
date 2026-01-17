// 사용자 타입
export type UserRole = 'student' | 'teacher' | 'admin'

export interface User {
  _id: string
  id: string // 사용자 ID (고유 식별자)
  name: string
  nickname: string
  role: UserRole
  class?: number // 수강 반
  createdAt: string
  updatedAt: string
}

export interface Student extends User {
  role: 'student'
  class?: number
}

export interface Teacher extends User {
  role: 'teacher'
  subjects: string[]
}

export interface Admin extends User {
  role: 'admin'
}

// 포스트 타입
export type PostType = 'general' | 'question' | 'material' | 'poll' | 'challenge' | 'goal'

export type Visibility = 'private' | 'friends' | 'teachers' | 'friends_teachers' | 'public'

export interface Post {
  _id: string
  author: User
  type: PostType
  title?: string
  content: string
  images?: string[]
  videos?: string[]
  youtubeLink?: string
  visibility: Visibility
  subject?: string
  grade?: number
  targetTeacher?: string // 질문 포스트의 경우
  questionStatus?: 'pending' | 'answered' // 질문 포스트 상태
  createdAt: string
  updatedAt: string
  likes: string[]
  comments: Comment[]
  commentCount?: number // 댓글 개수 (피드 조회 시 포함)
}

export interface Comment {
  _id: string
  author: User
  content: string
  parentComment?: string | null
  depth: number
  mentions?: string[]
  replies?: Comment[]
  createdAt: string
  updatedAt: string
}

// 친구 관계
export type FriendStatus = 'pending' | 'accepted' | 'rejected'
export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'

export interface Friendship {
  _id: string
  requester: User | string
  recipient: User | string
  status: FriendStatus
  createdAt: string
  updatedAt: string
}

// 알림 타입
export type NotificationType = 
  | 'question_answer'
  | 'comment'
  | 'like'
  | 'friend_request'
  | 'announcement'
  | 'question_comment'
  | 'reply'
  | 'mention'

export interface Notification {
  _id: string
  user: string
  type: NotificationType
  relatedPost?: string | { _id: string; title?: string; content?: string; type?: string }
  relatedUser?: string | User
  relatedComment?: string
  message: string
  read: boolean
  createdAt: string
}

// 메시지 타입
export interface Message {
  _id: string
  sender: string
  recipient: string
  content: string
  images?: string[]
  videos?: string[]
  read: boolean
  createdAt: string
}
