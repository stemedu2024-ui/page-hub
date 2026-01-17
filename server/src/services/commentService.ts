import { Comment } from '../models/Comment'
import { Post } from '../models/Post'
import { IComment } from '../types'
import { AppError } from '../middleware/errorHandler'
import { checkPostVisibility } from '../utils/postVisibility'
import { getPostById } from './postService'
import { createNotification } from './notificationService'
import { getIO } from '../utils/socket'

interface CreateCommentData {
  userId: string
  postId: string
  content: string
  parentCommentId?: string
  mentions?: string[]
}

interface UpdateCommentData {
  content: string
}

// 댓글 생성
export const createComment = async (data: CreateCommentData): Promise<IComment> => {
  const { userId, postId, content, parentCommentId, mentions = [] } = data

  if (!content || content.trim().length === 0) {
    throw new AppError('댓글 내용을 입력해주세요.', 400)
  }

  // 포스트 존재 확인 및 접근 권한 확인
  const post = await Post.findById(postId).populate('author', 'name nickname role class')
  if (!post) {
    throw new AppError('포스트를 찾을 수 없습니다.', 404)
  }

  // 포스트를 볼 수 있는 권한이 있는지 확인
  const canView = await checkPostVisibility(post, userId)
  if (!canView) {
    throw new AppError('이 포스트에 댓글을 작성할 권한이 없습니다.', 403)
  }

  let parentComment = null
  let depth = 0

  // 답글인 경우 부모 댓글 확인
  if (parentCommentId) {
    parentComment = await Comment.findById(parentCommentId)
    if (!parentComment) {
      throw new AppError('부모 댓글을 찾을 수 없습니다.', 404)
    }

    // 부모 댓글이 같은 포스트에 속하는지 확인
    if (parentComment.post.toString() !== postId) {
      throw new AppError('부모 댓글이 해당 포스트에 속하지 않습니다.', 400)
    }

    // 부모 댓글의 depth가 0이어야 함 (답글에 답글 불가)
    if (parentComment.depth !== 0) {
      throw new AppError('답글에는 답글을 작성할 수 없습니다.', 400)
    }

    depth = 1
  }

  // 댓글 생성
  const comment = new Comment({
    author: userId,
    post: postId,
    content: content.trim(),
    parentComment: parentCommentId || null,
    depth,
    mentions: mentions || [],
  })

  await comment.save()

  // author populate하여 반환
  await comment.populate('author', 'id name nickname role class')

  // 알림 생성
  const postAuthorId = (post.author as any)?._id?.toString() || post.author?.toString()
  const commentAuthor = comment.author as any
  const commentAuthorId = commentAuthor?._id?.toString() || commentAuthor?.id

  // 태그된 사용자에게 알림 생성
  if (mentions && mentions.length > 0) {
    for (const mentionedUserId of mentions) {
      if (mentionedUserId !== userId) {
        try {
          await createNotification({
            user: mentionedUserId,
            relatedUser: commentAuthorId,
            relatedPost: postId,
            relatedComment: comment._id.toString(),
            type: 'mention',
            message: `${commentAuthor?.nickname || '사용자'}님이 댓글에서 당신을 언급했습니다`,
          })
        } catch (error) {
          console.error('태그 알림 생성 실패:', error)
        }
      }
    }
  }

  if (depth === 1 && parentComment) {
    // 답글인 경우: 부모 댓글 작성자에게 알림 (태그되지 않은 경우만)
    const parentCommentAuthorId = parentComment.author.toString()
    if (parentCommentAuthorId !== userId && !mentions.includes(parentCommentAuthorId)) {
      try {
        await createNotification({
          user: parentCommentAuthorId,
          relatedUser: commentAuthorId,
          relatedPost: postId,
          relatedComment: comment._id.toString(),
          type: 'reply',
          message: `${commentAuthor?.nickname || '사용자'}님이 댓글에 답글을 남겼습니다`,
        })
      } catch (error) {
        console.error('답글 알림 생성 실패:', error)
      }
    }
  } else {
    // 일반 댓글인 경우: 포스트 작성자에게 알림
    // 자기 자신이 아닌 경우에만 알림 생성
    if (postAuthorId && postAuthorId !== userId) {
      // 질문 포스트이고 댓글 작성자가 선생님인 경우
      if (post.type === 'question' && (commentAuthor?.role === 'teacher' || commentAuthor?.role === 'admin')) {
        try {
          await createNotification({
            user: postAuthorId,
            relatedUser: commentAuthorId,
            relatedPost: postId,
            type: 'question_answer',
            message: `${commentAuthor?.nickname || '선생님'}님이 질문에 답변을 남겼습니다`,
          })
        } catch (error) {
          // 알림 생성 실패는 댓글 작성을 막지 않음
          console.error('알림 생성 실패:', error)
        }
      } else {
        // 일반 댓글 알림
        try {
          await createNotification({
            user: postAuthorId,
            relatedUser: commentAuthorId,
            relatedPost: postId,
            relatedComment: comment._id.toString(),
            type: 'comment',
            message: `${commentAuthor?.nickname || '사용자'}님이 게시글에 댓글을 남겼습니다`,
          })
        } catch (error) {
          // 알림 생성 실패는 댓글 작성을 막지 않음
          console.error('알림 생성 실패:', error)
        }
      }
    }
  }

  const commentObj = comment.toObject() as IComment

  // Socket.IO 이벤트 emit
  try {
    const io = getIO()
    const commentAuthor = comment.author as any
    const commentAuthorId = commentAuthor?._id?.toString() || commentAuthor?.id
    
    const commentData = {
      postId,
      commentId: commentObj._id.toString(),
      parentCommentId: parentCommentId || null,
      author: {
        _id: commentAuthorId,
        nickname: commentAuthor?.nickname || '사용자',
        id: commentAuthor?.id || '',
        role: commentAuthor?.role || 'student',
      },
      content: commentObj.content,
      createdAt: commentObj.createdAt,
    }

    if (depth === 1 && parentCommentId) {
      // 답글인 경우
      // 1. 부모 댓글 작성자에게
      const parentCommentAuthorId = parentComment.author.toString()
      io.to(`user:${parentCommentAuthorId}`).emit('reply:new', commentData)
      
      // 2. 포스트 작성자에게 (자기 자신이 아니고 부모 댓글 작성자와 다른 경우)
      if (postAuthorId && postAuthorId !== userId && postAuthorId !== parentCommentAuthorId) {
        io.to(`user:${postAuthorId}`).emit('reply:new', commentData)
      }
      
      // 3. 포스트를 볼 수 있는 모든 사용자에게 (visibility 체크는 클라이언트에서)
      io.to(`post:${postId}`).emit('reply:new', commentData)
    } else {
      // 일반 댓글인 경우
      // 1. 포스트 작성자에게
      if (postAuthorId && postAuthorId !== userId) {
        io.to(`user:${postAuthorId}`).emit('comment:new', commentData)
      }
      
      // 2. 포스트를 볼 수 있는 모든 사용자에게
      io.to(`post:${postId}`).emit('comment:new', commentData)
    }
  } catch (error) {
    // Socket.IO 에러는 댓글 작성을 막지 않음
    console.error('Socket.IO 이벤트 emit 실패:', error)
  }

  return commentObj
}

// 댓글 목록 조회 (그룹화된 구조로 반환)
export const getComments = async (postId: string, userId: string): Promise<any[]> => {
  // 포스트 존재 확인 및 접근 권한 확인
  const post = await Post.findById(postId).populate('author', 'name nickname role class')
  if (!post) {
    throw new AppError('포스트를 찾을 수 없습니다.', 404)
  }

  // 포스트를 볼 수 있는 권한이 있는지 확인
  const canView = await checkPostVisibility(post, userId)
  if (!canView) {
    throw new AppError('이 포스트의 댓글을 볼 수 있는 권한이 없습니다.', 403)
  }

  // 모든 댓글 조회 (부모 댓글과 답글 모두)
  const allComments = await Comment.find({ post: postId })
    .populate('author', 'id name nickname role class')
    .sort({ createdAt: 1 }) // 오래된 순
    .exec()

  // depth 0 (일반 댓글)과 depth 1 (답글) 분리
  const parentComments = allComments.filter((c) => c.depth === 0)
  const replies = allComments.filter((c) => c.depth === 1)

  // 답글을 부모 댓글 ID로 그룹화
  const repliesByParent = new Map<string, IComment[]>()
  replies.forEach((reply) => {
    const parentId = reply.parentComment?.toString() || ''
    if (!repliesByParent.has(parentId)) {
      repliesByParent.set(parentId, [])
    }
    repliesByParent.get(parentId)!.push(reply.toObject() as IComment)
  })

  // 부모 댓글에 답글 배열 추가
  return parentComments.map((comment) => {
    const commentObj = comment.toObject() as any
    const parentId = comment._id.toString()
    commentObj.replies = repliesByParent.get(parentId) || []
    // likes 필드가 없으면 빈 배열로 초기화
    if (!commentObj.likes) {
      commentObj.likes = []
    }
    // replies의 likes도 초기화
    if (commentObj.replies) {
      commentObj.replies = commentObj.replies.map((reply: any) => ({
        ...reply,
        likes: reply.likes || [],
      }))
    }
    return commentObj
  })
}

// 댓글 좋아요 토글
export const toggleCommentLike = async (
  commentId: string,
  userId: string
): Promise<{ liked: boolean; count: number }> => {
  const comment = await Comment.findById(commentId)
  if (!comment) {
    throw new AppError('댓글을 찾을 수 없습니다.', 404)
  }

  const likes = comment.likes || []
  const userObjectId = userId
  const isLiked = likes.some((likeId) => likeId.toString() === userObjectId)

  let liked: boolean
  if (isLiked) {
    // 좋아요 취소
    comment.likes = likes.filter((likeId) => likeId.toString() !== userObjectId)
    liked = false
  } else {
    // 좋아요 추가
    comment.likes = [...likes, userObjectId]
    liked = true
  }

  await comment.save()

  return {
    liked,
    count: comment.likes.length,
  }
}

// 댓글 수정
export const updateComment = async (
  commentId: string,
  userId: string,
  data: UpdateCommentData
): Promise<IComment> => {
  const { content } = data

  if (!content || content.trim().length === 0) {
    throw new AppError('댓글 내용을 입력해주세요.', 400)
  }

  const comment = await Comment.findById(commentId)
  if (!comment) {
    throw new AppError('댓글을 찾을 수 없습니다.', 404)
  }

  // 작성자 확인
  if (comment.author.toString() !== userId) {
    throw new AppError('댓글을 수정할 권한이 없습니다.', 403)
  }

  // 댓글 수정
  comment.content = content.trim()
  await comment.save()

  // author populate하여 반환
  await comment.populate('author', 'id name nickname role class')

  return comment.toObject() as IComment
}

// 댓글 삭제 (답글도 함께 삭제)
export const deleteComment = async (commentId: string, userId: string): Promise<void> => {
  const comment = await Comment.findById(commentId)
  if (!comment) {
    throw new AppError('댓글을 찾을 수 없습니다.', 404)
  }

  // 작성자 확인
  if (comment.author.toString() !== userId) {
    throw new AppError('댓글을 삭제할 권한이 없습니다.', 403)
  }

  // 부모 댓글인 경우 모든 답글도 함께 삭제
  if (comment.depth === 0) {
    await Comment.deleteMany({ parentComment: commentId })
  }

  await Comment.findByIdAndDelete(commentId)
}
