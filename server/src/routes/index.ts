import { Router } from 'express'
import authRoutes from './auth'
import postRoutes from './posts'
import friendRoutes from './friends'
import commentRoutes from './comments'
import notificationRoutes from './notifications'
// import userRoutes from './users'

const router = Router()

// 라우트 등록
router.use('/auth', authRoutes)
router.use('/posts', postRoutes)
router.use('/friends', friendRoutes)
router.use('/comments', commentRoutes)
router.use('/notifications', notificationRoutes)
// router.use('/users', userRoutes)

export default router
