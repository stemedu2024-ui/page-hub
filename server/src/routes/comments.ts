import { Router } from 'express'
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from '../controllers/commentController'
import { authenticate } from '../middleware/auth'

const router = Router()

// 모든 댓글 관련 라우트는 인증 필요
router.use(authenticate)

// 댓글 작성 (POST /api/comments/:postId)
router.post('/:postId', createComment)

// 댓글 목록 조회 (GET /api/comments/:postId)
router.get('/:postId', getComments)

// 댓글 좋아요 (POST /api/comments/:commentId/like) - 수정/삭제보다 먼저 정의
router.post('/:commentId/like', toggleCommentLike)

// 댓글 수정 (PATCH /api/comments/:commentId)
router.patch('/:commentId', updateComment)

// 댓글 삭제 (DELETE /api/comments/:commentId)
router.delete('/:commentId', deleteComment)

export default router
