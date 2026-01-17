import { Response, NextFunction } from 'express'
import * as friendService from '../services/friendService'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

// 친구 요청 생성
export const createFriendRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증된 사용자만 친구 요청을 보낼 수 있습니다.', 401)
    }

    const { recipientId } = req.body

    if (!recipientId) {
      throw new AppError('수신자 ID가 필요합니다.', 400)
    }

    // 사용자 ID를 ObjectId로 변환
    const { User } = await import('../models/User')
    const recipient = await User.findById(recipientId)
    
    if (!recipient) {
      throw new AppError('수신자를 찾을 수 없습니다.', 404)
    }

    const requester = await User.findById(req.user.id)
    if (!requester) {
      throw new AppError('요청자를 찾을 수 없습니다.', 404)
    }

    const friendship = await friendService.createFriendRequest({
      requesterId: requester._id.toString(),
      recipientId: recipient._id.toString(),
    })

    await friendship.populate('requester recipient', 'id name nickname role class')

    res.status(201).json({
      status: 'success',
      message: '친구 요청이 전송되었습니다.',
      friendship,
    })
  } catch (error) {
    next(error)
  }
}

// 친구 요청 응답 (승인/거절)
export const respondFriendRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증된 사용자만 친구 요청에 응답할 수 있습니다.', 401)
    }

    const { friendshipId } = req.params
    const { response } = req.body

    if (!friendshipId) {
      throw new AppError('친구 요청 ID가 필요합니다.', 400)
    }

    if (!response || !['accepted', 'rejected'].includes(response)) {
      throw new AppError('응답은 accepted 또는 rejected여야 합니다.', 400)
    }

    const { User } = await import('../models/User')
    const user = await User.findById(req.user.id)
    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404)
    }

    const friendship = await friendService.respondFriendRequest({
      friendshipId,
      userId: user._id.toString(),
      response: response as 'accepted' | 'rejected',
    })

    await friendship.populate('requester recipient', 'id name nickname role class')

    res.status(200).json({
      status: 'success',
      message: response === 'accepted' ? '친구 요청이 승인되었습니다.' : '친구 요청이 거절되었습니다.',
      friendship,
    })
  } catch (error) {
    next(error)
  }
}

// 친구 목록 조회
export const getFriends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증된 사용자만 친구 목록을 조회할 수 있습니다.', 401)
    }

    const { User } = await import('../models/User')
    const user = await User.findById(req.user.id)
    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404)
    }

    const friends = await friendService.getFriends(user._id.toString())

    res.status(200).json({
      status: 'success',
      friends,
    })
  } catch (error) {
    next(error)
  }
}

// 받은 친구 요청 목록 조회
export const getReceivedRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증된 사용자만 친구 요청을 조회할 수 있습니다.', 401)
    }

    const { User } = await import('../models/User')
    const user = await User.findById(req.user.id)
    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404)
    }

    const requests = await friendService.getReceivedRequests(user._id.toString())

    res.status(200).json({
      status: 'success',
      requests,
    })
  } catch (error) {
    next(error)
  }
}

// 보낸 친구 요청 목록 조회
export const getSentRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증된 사용자만 친구 요청을 조회할 수 있습니다.', 401)
    }

    const { User } = await import('../models/User')
    const user = await User.findById(req.user.id)
    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404)
    }

    const requests = await friendService.getSentRequests(user._id.toString())

    res.status(200).json({
      status: 'success',
      requests,
    })
  } catch (error) {
    next(error)
  }
}

// 친구 추천 조회
export const getFriendRecommendations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증된 사용자만 친구 추천을 조회할 수 있습니다.', 401)
    }

    const { User } = await import('../models/User')
    const user = await User.findById(req.user.id)
    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404)
    }

    const recommendations = await friendService.getFriendRecommendations(
      user._id.toString()
    )

    res.status(200).json({
      status: 'success',
      recommendations,
    })
  } catch (error) {
    next(error)
  }
}

// 친구 상태 확인
export const getFriendshipStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증된 사용자만 친구 상태를 확인할 수 있습니다.', 401)
    }

    const { userId } = req.params

    if (!userId) {
      throw new AppError('사용자 ID가 필요합니다.', 400)
    }

    const { User } = await import('../models/User')
    const currentUser = await User.findById(req.user.id)
    const targetUser = await User.findById(userId)

    if (!currentUser || !targetUser) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404)
    }

    const status = await friendService.getFriendshipStatus(
      currentUser._id.toString(),
      targetUser._id.toString()
    )

    res.status(200).json({
      status: 'success',
      friendshipStatus: status,
    })
  } catch (error) {
    next(error)
  }
}

// 사용자 검색
export const searchUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증된 사용자만 검색할 수 있습니다.', 401)
    }

    const { query } = req.query
    const limit = parseInt(req.query.limit as string) || 20

    if (!query || typeof query !== 'string') {
      res.status(200).json({
        status: 'success',
        users: [],
        total: 0,
      })
      return
    }

    const users = await friendService.searchUsers(req.user.id, query, limit)

    res.status(200).json({
      status: 'success',
      users,
      total: users.length,
    })
  } catch (error) {
    next(error)
  }
}

// 친구 끊기
export const unfriend = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('인증된 사용자만 친구를 끊을 수 있습니다.', 401)
    }

    const { userId } = req.params

    if (!userId) {
      throw new AppError('대상 사용자 ID가 필요합니다.', 400)
    }

    const { User } = await import('../models/User')
    const user = await User.findById(req.user.id)
    if (!user) {
      throw new AppError('사용자를 찾을 수 없습니다.', 404)
    }

    await friendService.unfriend(user._id.toString(), userId)

    res.status(200).json({
      status: 'success',
      message: '친구 관계가 해제되었습니다.',
    })
  } catch (error) {
    next(error)
  }
}
