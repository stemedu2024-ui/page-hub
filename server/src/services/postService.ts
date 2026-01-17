import mongoose from 'mongoose'
import { Post } from '../models/Post'
import { User } from '../models/User'
import { Friendship } from '../models/Friendship'
import { Comment } from '../models/Comment'
import { PostRead } from '../models/PostRead'
import { IPost, Visibility } from '../types'
import { AppError } from '../middleware/errorHandler'
import { checkPostVisibility } from '../utils/postVisibility'

interface CreatePostData {
  author: string
  type: 'general' | 'question'
  title?: string
  content: string
  images?: string[]
  videos?: string[]
  youtubeLink?: string
  visibility: Visibility
  targetTeacher?: string
}

interface UpdatePostData {
  title?: string
  content?: string
  images?: string[]
  videos?: string[]
  youtubeLink?: string
  visibility?: Visibility
  questionStatus?: 'pending' | 'answered'
}

// 포스트 생성
export const createPost = async (data: CreatePostData): Promise<IPost> => {
  // 질문 포스트인 경우 제목 필수
  if (data.type === 'question' && !data.title) {
    throw new AppError('질문 포스트는 제목이 필요합니다.', 400)
  }

  const postData: any = {
    author: data.author,
    type: data.type,
    content: data.content,
    visibility: data.visibility,
  }

  if (data.title) postData.title = data.title
  if (data.images && data.images.length > 0) postData.images = data.images
  if (data.videos && data.videos.length > 0) postData.videos = data.videos
  if (data.youtubeLink) postData.youtubeLink = data.youtubeLink
  if (data.targetTeacher) postData.targetTeacher = data.targetTeacher
  if (data.type === 'question') {
    postData.questionStatus = 'pending'
  }

  const post = new Post(postData)
  await post.save()

  // author populate하여 반환
  await post.populate('author', 'name nickname role class')
  return post.toObject() as IPost
}

// Read 기록 저장 (Phase 7-A)
// 확장 가능 포인트: 읽은 시간 기반 분석, 읽지 않은 사용자 추적 등
export const recordPostRead = async (postId: string, userId: string): Promise<void> => {
  try {
    // findOneAndUpdate with upsert: true
    // 중복 저장 방지 (compound unique index 활용)
    await PostRead.findOneAndUpdate(
      { postId, userId },
      { timestamp: new Date() },
      { upsert: true }
    )
  } catch (error: any) {
    // 모든 에러는 로깅만 (Post 조회 흐름 차단 금지)
    // duplicate / unique 에러 포함 모든 에러 무시
    console.error('PostRead 저장 실패:', error)
    // throw 금지
  }
}

// 포스트 조회 (단일)
export const getPostById = async (postId: string, userId?: string): Promise<IPost | null> => {
  const post = await Post.findById(postId).populate('author', 'name nickname role class')
  if (!post) {
    return null
  }

  // 공개 범위 확인
  if (userId) {
    const canView = await checkPostVisibility(post, userId)
    if (!canView) {
      throw new AppError('이 포스트를 볼 수 있는 권한이 없습니다.', 403)
    }

    // Phase 7-A: Read 기록 저장 (비동기, 에러 무시)
    // await 사용하지 않음 (완전 비동기)
    recordPostRead(postId, userId).catch((err) => {
      console.error('PostRead 저장 실패:', err)
    })
  }

  return post.toObject() as IPost
}

// 피드 조회 (공개 범위 필터링)
export const getFeed = async (userId: string): Promise<IPost[]> => {
  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('사용자를 찾을 수 없습니다.', 404)
  }

  // 친구 목록 가져오기
  const friendships = await Friendship.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' },
    ],
  })

  const friendIds = friendships.map((f) =>
    f.requester.toString() === userId ? f.recipient.toString() : f.requester.toString()
  )

  // 공개 범위별 필터링
  const visibilityFilters: any[] = []

  // 전체 공개
  visibilityFilters.push({ visibility: 'public' })

  // 친구만 (친구가 작성한 포스트)
  if (friendIds.length > 0) {
    visibilityFilters.push({
      visibility: 'friends',
      author: { $in: friendIds },
    })
  }

  // 선생님만 (선생님/관리자 계정인 경우)
  if (user.role === 'teacher' || user.role === 'admin') {
    visibilityFilters.push({
      visibility: 'teachers',
    })
  }

  // 친구+선생님
  if (friendIds.length > 0 || user.role === 'teacher' || user.role === 'admin') {
    const orConditions: any[] = []
    if (friendIds.length > 0) {
      orConditions.push({ author: { $in: friendIds } })
    }
    if (user.role === 'teacher' || user.role === 'admin') {
      orConditions.push({ visibility: 'friends_teachers' })
    }
    if (orConditions.length > 0) {
      visibilityFilters.push({
        visibility: 'friends_teachers',
        $or: orConditions,
      })
    }
  }

  // 나만 (본인 포스트)
  visibilityFilters.push({
    visibility: 'private',
    author: userId,
  })

  // 포스트 조회
  const posts = await Post.find({
    $or: visibilityFilters,
  })
    .populate('author', 'name nickname role class')
    .populate('targetTeacher', 'name nickname role')
    .sort({ createdAt: -1 })
    .limit(50)

  // 각 포스트의 댓글 개수 조회
  const postIds = posts.map((post) => post._id.toString())
  const commentCounts = await Comment.aggregate([
    { $match: { post: { $in: postIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: '$post', count: { $sum: 1 } } },
  ])

  const commentCountMap = new Map<string, number>()
  commentCounts.forEach((item) => {
    commentCountMap.set(item._id.toString(), item.count)
  })

  // 포스트에 댓글 개수 추가
  return posts.map((post) => {
    const postObject = post.toObject() as any
    postObject.commentCount = commentCountMap.get(post._id.toString()) || 0
    return postObject as IPost
  })
}

// 포스트 수정
export const updatePost = async (
  postId: string,
  userId: string,
  data: UpdatePostData
): Promise<IPost> => {
  const post = await Post.findById(postId)
  if (!post) {
    throw new AppError('포스트를 찾을 수 없습니다.', 404)
  }

  // 작성자 확인
  if (post.author.toString() !== userId) {
    throw new AppError('포스트를 수정할 권한이 없습니다.', 403)
  }

  // 수정할 필드 업데이트
  if (data.title !== undefined) post.title = data.title
  if (data.content !== undefined) post.content = data.content
  if (data.images !== undefined) post.images = data.images
  if (data.videos !== undefined) post.videos = data.videos
  if (data.youtubeLink !== undefined) post.youtubeLink = data.youtubeLink
  if (data.visibility !== undefined) post.visibility = data.visibility
  if (data.questionStatus !== undefined) post.questionStatus = data.questionStatus

  await post.save()
  await post.populate('author', 'name nickname role class')
  await post.populate('targetTeacher', 'name nickname role')

  return post.toObject() as IPost
}

// 포스트 삭제
export const deletePost = async (postId: string, userId: string): Promise<void> => {
  const post = await Post.findById(postId)
  if (!post) {
    throw new AppError('포스트를 찾을 수 없습니다.', 404)
  }

  // 작성자 확인
  if (post.author.toString() !== userId) {
    throw new AppError('포스트를 삭제할 권한이 없습니다.', 403)
  }

  await Post.findByIdAndDelete(postId)
}

// Read 목록 조회 (Phase 7-A)
export const getPostReads = async (postId: string): Promise<{ userId: string; timestamp: string }[]> => {
  const reads = await PostRead.find({ postId })
    .select('userId timestamp')
    .sort({ timestamp: 1 }) // asc
    .lean()

  return reads.map((read) => ({
    userId: read.userId.toString(),
    timestamp: read.timestamp.toISOString(),
  }))
}

// checkPostVisibility는 utils/postVisibility.ts로 이동
export { checkPostVisibility }
