import { Router } from 'express'
import {
  createFriendRequest,
  respondFriendRequest,
  getFriends,
  getReceivedRequests,
  getSentRequests,
  getFriendRecommendations,
  getFriendshipStatus,
  searchUsers,
  unfriend,
} from '../controllers/friendController'
import { authenticate } from '../middleware/auth'

const router = Router()

// 모든 친구 관련 라우트는 인증 필요
router.use(authenticate)

// 사용자 검색
router.get('/search', searchUsers)

// 친구 끊기
router.delete('/unfriend/:userId', unfriend)

// 라우트 등록 확인 로그
console.log('✅ 친구 라우트 등록 완료:')
console.log('  - GET /api/friends/list')
console.log('  - GET /api/friends/received')
console.log('  - GET /api/friends/sent')
console.log('  - GET /api/friends/recommend')
console.log('  - GET /api/friends/status/:userId')
console.log('  - POST /api/friends/request')
console.log('  - PATCH /api/friends/response/:friendshipId')
console.log('✅ 친구 라우트 파일 로드 완료 - 모든 엔드포인트 등록됨')

// 친구 요청 생성
router.post('/request', createFriendRequest)

// 친구 요청 응답 (승인/거절)
router.patch('/response/:friendshipId', respondFriendRequest)

// 친구 목록 조회
router.get('/list', getFriends)

// 받은 친구 요청 목록 조회
router.get('/received', getReceivedRequests)

// 보낸 친구 요청 목록 조회
router.get('/sent', getSentRequests)

// 친구 추천 조회
router.get('/recommend', getFriendRecommendations)

// 친구 상태 확인
router.get('/status/:userId', getFriendshipStatus)

export default router
