import mongoose, { Schema } from 'mongoose'

export interface IPostRead {
  postId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  timestamp: Date
}

const PostReadSchema = new Schema<IPostRead>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: false, // timestamps 옵션 사용하지 않음
  }
)

// 인덱스
PostReadSchema.index({ postId: 1, userId: 1 }, { unique: true }) // compound unique index
PostReadSchema.index({ postId: 1 }) // postId 인덱스

// 확장 가능 포인트:
// - 읽지 않은 사용자 추적: PostRead에 없는 userId 찾기
// - 통계/분석: timestamp 기반 읽기 패턴 분석
// - 권한 정책: 읽은 사용자 목록 조회 권한 정책 (작성자만? 친구만? 모든 인증 사용자?)

export const PostRead = mongoose.model<IPostRead>('PostRead', PostReadSchema)
