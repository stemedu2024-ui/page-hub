import { Router } from 'express'
import {
  createPostHandler,
  getFeedHandler,
  getPostByIdHandler,
  updatePostHandler,
  deletePostHandler,
  getPostReadsHandler,
} from '../controllers/postController'
import { toggleLike, getLikeStatus } from '../controllers/likeController'
import { authenticate } from '../middleware/auth'

const router = Router()

// 모든 라우트는 인증 필요
router.use(authenticate)

// 포스트 생성
router.post('/', createPostHandler)

// 피드 조회
router.get('/feed', getFeedHandler)

// 좋아요 라우트 (/:postId 라우트보다 먼저 정의해야 함)
router.post('/:postId/like', toggleLike)
router.get('/:postId/like', getLikeStatus)

// Read 목록 조회 (Phase 7-A) - /:postId보다 위에 배치
router.get('/:postId/reads', getPostReadsHandler)

// 단일 포스트 조회
router.get('/:postId', getPostByIdHandler)

// 포스트 수정
router.patch('/:postId', updatePostHandler)

// 포스트 삭제
router.delete('/:postId', deletePostHandler)

export default router
