import mongoose, { Schema } from 'mongoose'
import { IComment } from '../types'

const CommentSchema = new Schema<IComment>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    depth: {
      type: Number,
      default: 0,
      enum: [0, 1], // 0 = 일반 댓글, 1 = 답글
    },
    mentions: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// 인덱스
CommentSchema.index({ post: 1 })
CommentSchema.index({ author: 1 })
CommentSchema.index({ createdAt: -1 })
CommentSchema.index({ parentComment: 1 })
CommentSchema.index({ depth: 1 })

export const Comment = mongoose.model<IComment>('Comment', CommentSchema)
