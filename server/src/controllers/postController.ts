import { Request, Response, NextFunction } from 'express'
import {
  createPost,
  getPostById,
  getFeed,
  updatePost,
  deletePost,
  getPostReads,
} from '../services/postService'
import { AuthRequest } from '../middleware/auth'

// 포스트 생성
export const createPostHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.',
      })
      return
    }

    const data = req.body
    const post = await createPost({
      author: req.user.id,
      type: data.type || 'general',
      title: data.title,
      content: data.content,
      images: data.images,
      videos: data.videos,
      youtubeLink: data.youtubeLink,
      visibility: data.visibility || 'public',
      targetTeacher: data.targetTeacher,
    })

    res.status(201).json({
      status: 'success',
      message: '포스트가 생성되었습니다.',
      post,
    })
  } catch (error) {
    next(error)
  }
}

// 피드 조회
export const getFeedHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.',
      })
      return
    }

    const posts = await getFeed(req.user.id)

    res.status(200).json({
      status: 'success',
      posts,
    })
  } catch (error) {
    next(error)
  }
}

// 단일 포스트 조회
export const getPostByIdHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.',
      })
      return
    }

    const post = await getPostById(req.params.postId, req.user.id)
    if (!post) {
      res.status(404).json({
        status: 'error',
        message: '포스트를 찾을 수 없습니다.',
      })
      return
    }

    res.status(200).json({
      status: 'success',
      post,
    })
  } catch (error) {
    next(error)
  }
}

// 포스트 수정
export const updatePostHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.',
      })
      return
    }

    const data = req.body
    const post = await updatePost(req.params.postId, req.user.id, {
      title: data.title,
      content: data.content,
      images: data.images,
      videos: data.videos,
      youtubeLink: data.youtubeLink,
      visibility: data.visibility,
      questionStatus: data.questionStatus,
    })

    res.status(200).json({
      status: 'success',
      message: '포스트가 수정되었습니다.',
      post,
    })
  } catch (error) {
    next(error)
  }
}

// 포스트 삭제
export const deletePostHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.',
      })
      return
    }

    await deletePost(req.params.postId, req.user.id)

    res.status(200).json({
      status: 'success',
      message: '포스트가 삭제되었습니다.',
    })
  } catch (error) {
    next(error)
  }
}

// Read 목록 조회 (Phase 7-A)
export const getPostReadsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: '인증이 필요합니다.',
      })
      return
    }

    const users = await getPostReads(req.params.postId)

    res.status(200).json({
      status: 'success',
      users,
    })
  } catch (error) {
    next(error)
  }
}
