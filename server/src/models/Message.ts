import mongoose, { Schema } from 'mongoose'
import { IMessage } from '../types'

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
MessageSchema.index({ sender: 1, recipient: 1 })
MessageSchema.index({ recipient: 1, read: 1 })
MessageSchema.index({ createdAt: -1 })

export const Message = mongoose.model<IMessage>('Message', MessageSchema)
