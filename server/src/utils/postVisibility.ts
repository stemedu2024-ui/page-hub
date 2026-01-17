import { User } from '../models/User'
import { Friendship } from '../models/Friendship'
import { IPost } from '../types'

/**
 * 포스트의 공개 범위를 확인하는 헬퍼 함수
 * @param post 포스트 객체 (author가 populate되어 있어야 함)
 * @param userId 확인할 사용자 ID
 * @returns 포스트를 볼 수 있는지 여부
 */
export const checkPostVisibility = async (post: any, userId: string): Promise<boolean> => {
  const user = await User.findById(userId)
  if (!user) return false

  // 작성자 본인은 항상 볼 수 있음
  const authorId = post.author?._id?.toString() || post.author?.toString()
  if (authorId === userId) return true

  switch (post.visibility) {
    case 'private':
      return false
    case 'public':
      return true
    case 'friends': {
      const friendship = await Friendship.findOne({
        $or: [
          { requester: userId, recipient: authorId, status: 'accepted' },
          { requester: authorId, recipient: userId, status: 'accepted' },
        ],
      })
      return !!friendship
    }
    case 'teachers':
      return user.role === 'teacher' || user.role === 'admin'
    case 'friends_teachers': {
      if (user.role === 'teacher' || user.role === 'admin') return true
      const friendship = await Friendship.findOne({
        $or: [
          { requester: userId, recipient: authorId, status: 'accepted' },
          { requester: authorId, recipient: userId, status: 'accepted' },
        ],
      })
      return !!friendship
    }
    default:
      return false
  }
}
