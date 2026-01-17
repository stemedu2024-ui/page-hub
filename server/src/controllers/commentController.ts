import { Response, NextFunction } from 'express'
import * as commentService from '../services/commentService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

// 댓글 작성
export const createComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    const { postId } = req.params
    const { content, parentCommentId, mentions } = req.body

    if (!content) {
      throw new AppError('댓글 내용을 입력해주세요.', 400)
    }

    const comment = await commentService.createComment({
      userId: req.user.id,
      postId,
      content,
      parentCommentId,
      mentions: mentions || [],
    })

    res.status(201).json({
      status: 'success',
      message: '댓글이 작성되었습니다.',
      comment,
    })
  } catch (error) {
    next(error)
  }
}

// 댓글 목록 조회
export const getComments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    const { postId } = req.params

    const comments = await commentService.getComments(postId, req.user.id)

    res.status(200).json({
      status: 'success',
      comments,
    })
  } catch (error) {
    next(error)
  }
}

// 댓글 수정
export const updateComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    const { commentId } = req.params
    const { content } = req.body

    if (!content) {
      throw new AppError('댓글 내용을 입력해주세요.', 400)
    }

    const comment = await commentService.updateComment(commentId, req.user.id, { content })

    res.status(200).json({
      status: 'success',
      message: '댓글이 수정되었습니다.',
      comment,
    })
  } catch (error) {
    next(error)
  }
}

// 댓글 삭제
export const deleteComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    const { commentId } = req.params

    await commentService.deleteComment(commentId, req.user.id)

    res.status(200).json({
      status: 'success',
      message: '댓글이 삭제되었습니다.',
    })
  } catch (error) {
    next(error)
  }
}

// 댓글 좋아요 토글
export const toggleCommentLike = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증이 필요합니다.', 401)
    }

    const { commentId } = req.params

    const result = await commentService.toggleCommentLike(commentId, req.user.id)

    res.status(200).json({
      status: 'success',
      ...result,
    })
  } catch (error) {
    next(error)
  }
}
