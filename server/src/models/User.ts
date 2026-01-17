import mongoose, { Schema } from 'mongoose'
import { IUser } from '../types'

const UserSchema = new Schema<IUser>(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nickname: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // 기본적으로 조회 시 제외
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student', // 회원가입은 학생만 가능
      required: true,
    },
    class: {
      type: Number,
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
  }
)

// 인덱스 (unique 인덱스 포함)
UserSchema.index({ id: 1 }, { unique: true })
UserSchema.index({ nickname: 1 }, { unique: true })
UserSchema.index({ role: 1 })

export const User = mongoose.model<IUser>('User', UserSchema)
