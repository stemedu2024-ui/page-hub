import { Post } from '../models/Post'
import { User } from '../models/User'
import { AppError } from '../middleware/errorHandler'
import { createNotification } from './notificationService'

interface LikeStatus {
  liked: boolean
  count: number
}

// 좋아요 토글
export const toggleLike = async (postId: string, userId: string): Promise<LikeStatus> => {
  const post = await Post.findById(postId).populate('author', 'id name nickname role class')
  if (!post) {
    throw new AppError('포스트를 찾을 수 없습니다.', 404)
  }

  const likes = post.likes || []
  const userObjectId = userId
  const isLiked = likes.some((likeId) => likeId.toString() === userObjectId)

  let liked: boolean
  if (isLiked) {
    // 좋아요 취소
    post.likes = likes.filter((likeId) => likeId.toString() !== userObjectId)
    liked = false
  } else {
    // 좋아요 추가
    post.likes = [...likes, userObjectId]
    liked = true

    // 알림 생성 (좋아요 시에만, 자기 자신이 아닌 경우)
    const postAuthorId = (post.author as any)?._id?.toString() || post.author?.toString()
    if (postAuthorId && postAuthorId !== userId) {
      try {
        const user = await User.findById(userId)
        const userNickname = user?.nickname || user?.name || '사용자'
        
        await createNotification({
          user: postAuthorId,
          relatedUser: userId,
          relatedPost: postId,
          type: 'like',
          message: `${userNickname}님이 게시글을 좋아합니다`,
        })
      } catch (error) {
        // 알림 생성 실패는 좋아요를 막지 않음
        console.error('알림 생성 실패:', error)
      }
    }
  }

  await post.save()

  return {
    liked,
    count: post.likes.length,
  }
}

// 좋아요 상태 조회
export const getLikeStatus = async (postId: string, userId: string): Promise<LikeStatus> => {
  const post = await Post.findById(postId)
  if (!post) {
    throw new AppError('포스트를 찾을 수 없습니다.', 404)
  }

  const likes = post.likes || []
  const userObjectId = userId
  const isLiked = likes.some((likeId) => likeId.toString() === userObjectId)

  return {
    liked: isLiked,
    count: likes.length,
  }
}
