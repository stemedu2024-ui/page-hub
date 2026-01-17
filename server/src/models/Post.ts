import mongoose, { Schema } from 'mongoose'
import { IPost, PostType, Visibility } from '../types'

const PostSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['general', 'question', 'material', 'poll', 'challenge', 'goal'],
      default: 'general',
    },
    title: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    youtubeLink: {
      type: String,
    },
    visibility: {
      type: String,
      enum: ['private', 'friends', 'teachers', 'friends_teachers', 'public'],
      default: 'public',
    },
    subject: {
      type: String,
    },
    grade: {
      type: Number,
    },
    targetTeacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    questionStatus: {
      type: String,
      enum: ['pending', 'answered'],
      default: 'pending',
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    comments: {
      type: [Schema.Types.ObjectId],
      ref: 'Comment',
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// 인덱스
PostSchema.index({ author: 1 })
PostSchema.index({ type: 1 })
PostSchema.index({ visibility: 1 })
PostSchema.index({ targetTeacher: 1 })
PostSchema.index({ createdAt: -1 })

export const Post = mongoose.model<IPost>('Post', PostSchema)
