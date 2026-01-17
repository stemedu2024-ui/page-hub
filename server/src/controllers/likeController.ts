import { Response, NextFunction } from 'express'
import * as likeService from '../services/likeService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

// 좋아요 토글
export const toggleLike = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    const { postId } = req.params
    const result = await likeService.toggleLike(postId, req.user.id)

    res.status(200).json({
      status: 'success',
      message: result.liked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.',
      liked: result.liked,
      count: result.count,
    })
  } catch (error) {
    next(error)
  }
}

// 좋아요 상태 조회
export const getLikeStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    const { postId } = req.params
    const result = await likeService.getLikeStatus(postId, req.user.id)

    res.status(200).json({
      status: 'success',
      liked: result.liked,
      count: result.count,
    })
  } catch (error) {
    next(error)
  }
}
