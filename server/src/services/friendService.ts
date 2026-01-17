import { Friendship } from '../models/Friendship'
import { User } from '../models/User'
import { IFriendship, IUser } from '../types'
import { AppError } from '../middleware/errorHandler'
import mongoose from 'mongoose'
import { createNotification } from './notificationService'

interface CreateFriendRequestData {
  requesterId: string
  recipientId: string
}

interface RespondFriendRequestData {
  friendshipId: string
  userId: string
  response: 'accepted' | 'rejected'
}

// 친구 요청 생성
export const createFriendRequest = async (
  data: CreateFriendRequestData
): Promise<IFriendship> => {
  const { requesterId, recipientId } = data

  // 자기 자신에게 요청할 수 없음
  if (requesterId === recipientId) {
    throw new AppError('자기 자신에게 친구 요청을 보낼 수 없습니다.', 400)
  }

  // 요청자와 수신자 존재 확인
  const requester = await User.findById(requesterId)
  const recipient = await User.findById(recipientId)

  if (!requester) {
    throw new AppError('요청자를 찾을 수 없습니다.', 404)
  }
  if (!recipient) {
    throw new AppError('수신자를 찾을 수 없습니다.', 404)
  }

  // 이미 친구 요청이 있는지 확인
  const existingFriendship = await Friendship.findOne({
    $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId },
    ],
  })

  if (existingFriendship) {
    if (existingFriendship.status === 'accepted') {
      throw new AppError('이미 친구입니다.', 400)
    }
    if (existingFriendship.status === 'pending') {
      throw new AppError('이미 친구 요청이 존재합니다.', 400)
    }
    // rejected 상태인 경우 새로 생성
    if (existingFriendship.status === 'rejected') {
      existingFriendship.status = 'pending'
      existingFriendship.requester = new mongoose.Types.ObjectId(requesterId)
      existingFriendship.recipient = new mongoose.Types.ObjectId(recipientId)
      await existingFriendship.save()
      
      // 친구 요청 알림 생성
      try {
        await createNotification({
          user: recipientId,
          relatedUser: requesterId,
          type: 'friend_request',
          message: `${requester.nickname || requester.name}님이 친구 요청을 보냈습니다`,
        })
      } catch (error) {
        console.error('알림 생성 실패:', error)
      }
      
      return existingFriendship
    }
  }

  // 새 친구 요청 생성
  const friendship = new Friendship({
    requester: requesterId,
    recipient: recipientId,
    status: 'pending',
  })

  await friendship.save()

  // 친구 요청 알림 생성
  try {
    await createNotification({
      user: recipientId,
      relatedUser: requesterId,
      type: 'friend_request',
      message: `${requester.nickname || requester.name}님이 친구 요청을 보냈습니다`,
    })
  } catch (error) {
    // 알림 생성 실패는 친구 요청을 막지 않음
    console.error('알림 생성 실패:', error)
  }

  return friendship
}

// 친구 요청 응답 (승인/거절)
export const respondFriendRequest = async (
  data: RespondFriendRequestData
): Promise<IFriendship> => {
  const { friendshipId, userId, response } = data

  const friendship = await Friendship.findById(friendshipId)

  if (!friendship) {
    throw new AppError('친구 요청을 찾을 수 없습니다.', 404)
  }

  // 수신자만 응답할 수 있음
  // recipient가 ObjectId인지 populate된 객체인지 확인
  const recipientId = typeof friendship.recipient === 'object' && friendship.recipient !== null && '_id' in friendship.recipient
    ? (friendship.recipient as any)._id.toString()
    : friendship.recipient.toString()
  
  if (recipientId !== userId) {
    throw new AppError('친구 요청에 응답할 권한이 없습니다.', 403)
  }

  // pending 상태인지 확인
  if (friendship.status !== 'pending') {
    throw new AppError('이미 처리된 친구 요청입니다.', 400)
  }

  friendship.status = response
  await friendship.save()

  return friendship
}

// 친구 목록 조회
export const getFriends = async (userId: string): Promise<IUser[]> => {
  const friendships = await Friendship.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' },
    ],
  })
    .populate('requester recipient')
    .exec()

  const friends: IUser[] = []

  friendships.forEach((friendship) => {
    const requesterId = (friendship.requester as IUser)._id.toString()
    const recipientId = (friendship.recipient as IUser)._id.toString()

    if (requesterId === userId) {
      friends.push(friendship.recipient as IUser)
    } else {
      friends.push(friendship.requester as IUser)
    }
  })

  return friends
}

// 받은 친구 요청 목록 조회
export const getReceivedRequests = async (userId: string): Promise<IFriendship[]> => {
  const requests = await Friendship.find({
    recipient: userId,
    status: 'pending',
  })
    .populate('requester', 'id name nickname role class')
    .sort({ createdAt: -1 })
    .exec()

  return requests
}

// 보낸 친구 요청 목록 조회
export const getSentRequests = async (userId: string): Promise<IFriendship[]> => {
  const requests = await Friendship.find({
    requester: userId,
    status: 'pending',
  })
    .populate('recipient', 'id name nickname role class')
    .sort({ createdAt: -1 })
    .exec()

  return requests
}

// 친구 추천 (같은 반, 같은 학년 기반)
export const getFriendRecommendations = async (
  userId: string
): Promise<IUser[]> => {
  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('사용자를 찾을 수 없습니다.', 404)
  }

  // 학생만 추천 가능
  if (user.role !== 'student') {
    return []
  }

  // 같은 반 학생들 찾기
  const sameClassUsers = await User.find({
    _id: { $ne: userId },
    role: 'student',
    class: user.class,
  }).limit(10)

  // 이미 친구이거나 요청이 있는 사용자 제외
  const existingFriendships = await Friendship.find({
    $or: [
      { requester: userId },
      { recipient: userId },
    ],
  })

  const excludedUserIds = new Set<string>()
  excludedUserIds.add(userId)

  existingFriendships.forEach((friendship) => {
    const requesterId = friendship.requester.toString()
    const recipientId = friendship.recipient.toString()
    if (requesterId !== userId) excludedUserIds.add(requesterId)
    if (recipientId !== userId) excludedUserIds.add(recipientId)
  })

  // 제외된 사용자 필터링
  const recommendations = sameClassUsers.filter(
    (user) => !excludedUserIds.has(user._id.toString())
  )

  return recommendations.slice(0, 10) // 최대 10명
}

// 두 사용자가 친구인지 확인
export const areFriends = async (
  userId1: string,
  userId2: string
): Promise<boolean> => {
  const friendship = await Friendship.findOne({
    $or: [
      { requester: userId1, recipient: userId2, status: 'accepted' },
      { requester: userId2, recipient: userId1, status: 'accepted' },
    ],
  })

  return !!friendship
}

// 친구 요청 상태 확인
export const getFriendshipStatus = async (
  userId1: string,
  userId2: string
): Promise<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected'> => {
  const friendship = await Friendship.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 },
    ],
  })

  if (!friendship) {
    return 'none'
  }

  if (friendship.status === 'accepted') {
    return 'accepted'
  }

  if (friendship.status === 'rejected') {
    return 'rejected'
  }

  // pending 상태인 경우 누가 요청했는지 확인
  const requesterId = friendship.requester.toString()
  if (requesterId === userId1) {
    return 'pending_sent'
  } else {
    return 'pending_received'
  }
}

// 사용자 검색
export const searchUsers = async (
  userId: string,
  query: string,
  limit: number = 20
): Promise<IUser[]> => {
  if (!query || query.trim().length < 2) {
    return []
  }

  const searchQuery = query.trim()
  
  // 검색 조건: id (정확 일치 우선), nickname, name, class (숫자인 경우만)
  const searchConditions: any[] = []

  // ID 정확 일치 (최우선)
  searchConditions.push({ id: searchQuery })

  // 닉네임 부분 일치
  searchConditions.push({ nickname: { $regex: searchQuery, $options: 'i' } })

  // 이름 부분 일치
  searchConditions.push({ name: { $regex: searchQuery, $options: 'i' } })

  // 반 정보 검색 (숫자인 경우만)
  const classNumber = parseInt(searchQuery, 10)
  if (!isNaN(classNumber)) {
    searchConditions.push({ class: classNumber })
  }

  // 사용자 검색 (학생만, 자기 자신 제외)
  const users = await User.find({
    $and: [
      { _id: { $ne: userId } },
      { role: 'student' },
      { $or: searchConditions },
    ],
  })
    .select('id name nickname role class')
    .limit(limit)
    .exec()

  // 정확 일치 우선 정렬
  const exactMatch = users.find((user) => user.id === searchQuery)
  const otherUsers = users.filter((user) => user.id !== searchQuery)

  if (exactMatch) {
    return [exactMatch, ...otherUsers]
  }

  return users
}

// 친구 끊기
export const unfriend = async (
  userId: string,
  targetUserId: string
): Promise<void> => {
  // 자기 자신과는 친구를 끊을 수 없음
  if (userId === targetUserId) {
    throw new AppError('자기 자신과는 친구를 끊을 수 없습니다.', 400)
  }

  // 대상 사용자 존재 확인
  const targetUser = await User.findById(targetUserId)
  if (!targetUser) {
    throw new AppError('대상 사용자를 찾을 수 없습니다.', 404)
  }

  // Friendship 찾기 (양방향 확인, accepted 상태만)
  const friendship = await Friendship.findOne({
    $or: [
      { requester: userId, recipient: targetUserId, status: 'accepted' },
      { requester: targetUserId, recipient: userId, status: 'accepted' },
    ],
  })

  if (!friendship) {
    throw new AppError('친구 관계를 찾을 수 없습니다.', 404)
  }

  // 권한 확인 (requester 또는 recipient 중 하나여야 함)
  const requesterId = friendship.requester.toString()
  const recipientId = friendship.recipient.toString()

  if (requesterId !== userId && recipientId !== userId) {
    throw new AppError('친구를 끊을 권한이 없습니다.', 403)
  }

  // Friendship 삭제
  await Friendship.findByIdAndDelete(friendship._id)
}
