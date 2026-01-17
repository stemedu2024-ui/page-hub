import mongoose, { Schema } from 'mongoose'
import { IFriendship, FriendStatus } from '../types'

const FriendshipSchema = new Schema<IFriendship>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
)

// 인덱스
FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true })
FriendshipSchema.index({ recipient: 1, status: 1 })

export const Friendship = mongoose.model<IFriendship>('Friendship', FriendshipSchema)
