import { Request } from 'express'
import { Document } from 'mongoose'

// 사용자 타입
export type UserRole = 'student' | 'teacher' | 'admin'

export interface IUser extends Document {
  id: string // 사용자 ID (고유 식별자)
  name: string
  nickname: string
  password: string
  role: UserRole
  class?: number // 수강 반
  createdAt: Date
  updatedAt: Date
}

export interface IStudent extends IUser {
  role: 'student'
  class?: number
}

export interface ITeacher extends IUser {
  role: 'teacher'
  subjects: string[]
}

export interface IAdmin extends IUser {
  role: 'admin'
}

// 포스트 타입
export type PostType = 'general' | 'question' | 'material' | 'poll' | 'challenge' | 'goal'
export type Visibility = 'private' | 'friends' | 'teachers' | 'friends_teachers' | 'public'

export interface IPost extends Document {
  author: IUser['_id']
  type: PostType
  title?: string
  content: string
  images?: string[]
  videos?: string[]
  youtubeLink?: string
  visibility: Visibility
  subject?: string
  grade?: number
  targetTeacher?: IUser['_id']
  questionStatus?: 'pending' | 'answered'
  likes: IUser['_id'][]
  comments: IComment[]
  commentCount?: number // 댓글 개수 (피드 조회 시 포함)
  createdAt: Date
  updatedAt: Date
}

export interface IComment extends Document {
  author: IUser['_id']
  post: IPost['_id']
  content: string
  parentComment?: IComment['_id'] | null
  depth: number
  mentions?: IUser['_id'][]
  likes?: IUser['_id'][] // 댓글/답글 좋아요
  createdAt: Date
  updatedAt: Date
}

// 친구 관계
export type FriendStatus = 'pending' | 'accepted' | 'rejected'

export interface IFriendship extends Document {
  requester: IUser['_id']
  recipient: IUser['_id']
  status: FriendStatus
  createdAt: Date
  updatedAt: Date
}

// 알림 타입
export type NotificationType = 
  | 'question_answer'
  | 'comment'
  | 'like'
  | 'friend_request'
  | 'announcement'
  | 'question_comment'

export interface INotification extends Document {
  user: IUser['_id']
  type: NotificationType
  relatedPost?: IPost['_id']
  relatedUser?: IUser['_id']
  relatedComment?: IComment['_id']
  message: string
  read: boolean
  createdAt: Date
}

// 메시지 타입
export interface IMessage extends Document {
  sender: IUser['_id']
  recipient: IUser['_id']
  content: string
  images?: string[]
  videos?: string[]
  read: boolean
  createdAt: Date
}

// 확장된 Request 타입
export interface AuthRequest extends Request {
  user?: {
    id: string
    role: UserRole
  }
}
