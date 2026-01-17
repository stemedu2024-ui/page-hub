import mongoose, { Schema } from 'mongoose'
import { INotification, NotificationType } from '../types'

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'question_answer',
        'comment',
        'like',
        'friend_request',
        'announcement',
        'question_comment',
        'reply',
        'mention',
      ],
      required: true,
    },
    relatedPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// 인덱스
NotificationSchema.index({ user: 1, read: 1 })
NotificationSchema.index({ createdAt: -1 })

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema)
