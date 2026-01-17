import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { socketAuth, AuthenticatedSocket } from '../middleware/socketAuth'
import { socketLogger } from './socketLogger'

let io: SocketIOServer | null = null

// Connection tracking Maps
// userId → Set<socketId>
const userSockets = new Map<string, Set<string>>()
// socketId → userId
const socketUsers = new Map<string, string>()

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // origin이 없으면 (같은 origin 요청 등) 허용
        if (!origin) {
          callback(null, true)
          return
        }
        
        // localhost나 127.0.0.1의 모든 포트 허용
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          callback(null, true)
          return
        }
        
        // 프로덕션 환경에서만 특정 origin만 허용
        if (process.env.NODE_ENV === 'production') {
          const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173'
          callback(null, origin === allowedOrigin)
        } else {
          callback(null, true)
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // Heartbeat / Ping-Pong 설정
    pingInterval: 25000, // 25초마다 ping 전송
    pingTimeout: 60000,  // 60초 안에 pong이 없으면 연결 끊김
  })

  // 인증 미들웨어
  io.use(socketAuth)

  // 연결 이벤트
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId
    const socketId = socket.id

    // userId가 없으면 연결 거부
    if (!userId) {
      socketLogger.error('socket:connection', {
        socketId,
        reason: 'userId_not_found',
      })
      socket.disconnect()
      return
    }

    // 연결 성공 로그
    socketLogger.info('socket:connected', {
      userId,
      socketId,
    })

    // Connection tracking 추가
    try {
      // userSockets Map에 추가
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set())
      }
      userSockets.get(userId)!.add(socketId)

      // socketUsers Map에 추가
      socketUsers.set(socketId, userId)
    } catch (error: any) {
      socketLogger.error('socket:tracking:add', {
        userId,
        socketId,
        reason: error.message || 'unknown',
      })
    }

    // 개인 방에 조인 (안전하게 처리)
    try {
      socket.join(`user:${userId}`)
      socketLogger.info('socket:join:user', {
        userId,
        socketId,
        room: `user:${userId}`,
      })
    } catch (error: any) {
      socketLogger.error('socket:join:user', {
        userId,
        socketId,
        reason: error.message || 'unknown',
      })
      // 에러를 클라이언트에 전송하되 서버는 계속 실행
      socket.emit('socket:error', {
        type: 'server_error',
        message: 'Failed to join user room',
      })
    }

    // 포스트 방 조인 (실시간 댓글을 보기 위해)
    socket.on('join:post', (postId: string) => {
      try {
        if (!postId || typeof postId !== 'string') {
          throw new Error('Invalid postId')
        }

        const roomName = `post:${postId}`
        
        // 중복 join 체크 (로깅 목적)
        const rooms = socket.rooms
        const alreadyJoined = rooms.has(roomName)
        
        if (alreadyJoined) {
          socketLogger.info('socket:join:post:duplicate', {
            userId,
            socketId,
            postId,
          })
          // 이미 조인되어 있어도 에러는 아님, 그냥 로그만 남김
        } else {
          socket.join(roomName)
          socketLogger.info('socket:join:post', {
            userId,
            socketId,
            postId,
          })
        }
      } catch (error: any) {
        socketLogger.error('socket:join:post', {
          userId,
          socketId,
          postId: typeof postId === 'string' ? postId : 'invalid',
          reason: error.message || 'unknown',
        })
        // 에러를 클라이언트에 전송하되 서버는 계속 실행
        socket.emit('socket:error', {
          type: 'server_error',
          message: 'Failed to join post room',
        })
      }
    })

    // 포스트 방 떠나기
    socket.on('leave:post', (postId: string) => {
      try {
        if (!postId || typeof postId !== 'string') {
          throw new Error('Invalid postId')
        }

        socket.leave(`post:${postId}`)
        socketLogger.info('socket:leave:post', {
          userId,
          socketId,
          postId,
        })
      } catch (error: any) {
        socketLogger.error('socket:leave:post', {
          userId,
          socketId,
          postId: typeof postId === 'string' ? postId : 'invalid',
          reason: error.message || 'unknown',
        })
        // 에러를 클라이언트에 전송하되 서버는 계속 실행
        socket.emit('socket:error', {
          type: 'server_error',
          message: 'Failed to leave post room',
        })
      }
    })

    // Post View Presence 이벤트 (Phase 4)
    socket.on('post:view:start', (payload: { postId: string }) => {
      try {
        if (!payload || !payload.postId || typeof payload.postId !== 'string') {
          throw new Error('Invalid payload: postId required')
        }

        const { postId } = payload
        const roomName = `post:${postId}`

        // 중복 join 체크
        const rooms = socket.rooms
        const alreadyJoined = rooms.has(roomName)

        if (alreadyJoined) {
          socketLogger.info('socket:post:view:start:duplicate', {
            userId,
            socketId,
            postId,
          })
        } else {
          socket.join(roomName)
          socketLogger.info('socket:post:view:start', {
            userId,
            socketId,
            postId,
          })
          
          // Phase 7-B: Presence 브로드캐스트 (같은 post room의 다른 사용자에게)
          try {
            socket.broadcast.to(roomName).emit('post:view:presence:update', {
              postId,
              userId,
              action: 'start',
            })
          } catch (error: any) {
            socketLogger.error('socket:post:view:presence:broadcast:start', {
              userId,
              socketId,
              postId,
              reason: error.message || 'unknown',
            })
          }
        }
      } catch (error: any) {
        socketLogger.error('socket:post:view:start', {
          userId,
          socketId,
          postId: payload?.postId || 'invalid',
          reason: error.message || 'unknown',
        })
        socket.emit('socket:error', {
          type: 'server_error',
          message: 'Failed to start post view',
        })
      }
    })

    socket.on('post:view:end', (payload: { postId: string }) => {
      try {
        if (!payload || !payload.postId || typeof payload.postId !== 'string') {
          throw new Error('Invalid payload: postId required')
        }

        const { postId } = payload
        const roomName = `post:${postId}`

        // Phase 7-B: Presence 브로드캐스트 (leave 전에 브로드캐스트해야 함)
        try {
          socket.broadcast.to(roomName).emit('post:view:presence:update', {
            postId,
            userId,
            action: 'end',
          })
        } catch (error: any) {
          socketLogger.error('socket:post:view:presence:broadcast:end', {
            userId,
            socketId,
            postId,
            reason: error.message || 'unknown',
          })
        }

        socket.leave(roomName)
        socketLogger.info('socket:post:view:end', {
          userId,
          socketId,
          postId,
        })
      } catch (error: any) {
        socketLogger.error('socket:post:view:end', {
          userId,
          socketId,
          postId: payload?.postId || 'invalid',
          reason: error.message || 'unknown',
        })
        socket.emit('socket:error', {
          type: 'server_error',
          message: 'Failed to end post view',
        })
      }
    })

    // Read Receipt 이벤트 (Phase 4)
    socket.on('post:read', (payload: { postId: string }) => {
      try {
        if (!payload || !payload.postId || typeof payload.postId !== 'string') {
          throw new Error('Invalid payload: postId required')
        }

        const { postId } = payload

        // 같은 post room에 있는 다른 사용자들에게만 emit (자기 자신 제외)
        socket.broadcast.to(`post:${postId}`).emit('post:read:update', {
          postId,
          userId,
          timestamp: new Date().toISOString(),
        })

        socketLogger.info('socket:post:read', {
          userId,
          socketId,
          postId,
        })
      } catch (error: any) {
        socketLogger.error('socket:post:read', {
          userId,
          socketId,
          postId: payload?.postId || 'invalid',
          reason: error.message || 'unknown',
        })
        socket.emit('socket:error', {
          type: 'server_error',
          message: 'Failed to process read receipt',
        })
      }
    })

    // Typing Indicator 이벤트 (Phase 4)
    socket.on('comment:typing:start', (payload: { postId: string }) => {
      try {
        if (!payload || !payload.postId || typeof payload.postId !== 'string') {
          throw new Error('Invalid payload: postId required')
        }

        const { postId } = payload

        // 같은 post room에 있는 다른 사용자들에게만 emit (자기 자신 제외)
        socket.broadcast.to(`post:${postId}`).emit('comment:typing:update', {
          postId,
          userId,
          isTyping: true,
        })

        socketLogger.info('socket:comment:typing:start', {
          userId,
          socketId,
          postId,
        })
      } catch (error: any) {
        socketLogger.error('socket:comment:typing:start', {
          userId,
          socketId,
          postId: payload?.postId || 'invalid',
          reason: error.message || 'unknown',
        })
        socket.emit('socket:error', {
          type: 'server_error',
          message: 'Failed to start typing indicator',
        })
      }
    })

    socket.on('comment:typing:end', (payload: { postId: string }) => {
      try {
        if (!payload || !payload.postId || typeof payload.postId !== 'string') {
          throw new Error('Invalid payload: postId required')
        }

        const { postId } = payload

        // 같은 post room에 있는 다른 사용자들에게만 emit (자기 자신 제외)
        socket.broadcast.to(`post:${postId}`).emit('comment:typing:update', {
          postId,
          userId,
          isTyping: false,
        })

        socketLogger.info('socket:comment:typing:end', {
          userId,
          socketId,
          postId,
        })
      } catch (error: any) {
        socketLogger.error('socket:comment:typing:end', {
          userId,
          socketId,
          postId: payload?.postId || 'invalid',
          reason: error.message || 'unknown',
        })
        socket.emit('socket:error', {
          type: 'server_error',
          message: 'Failed to end typing indicator',
        })
      }
    })

    // 연결 해제 이벤트
    socket.on('disconnect', (reason) => {
      try {
        // 모든 post room에서 제거
        const rooms = socket.rooms
        for (const room of rooms) {
          if (room.startsWith('post:')) {
            try {
              const postId = room.replace('post:', '')
              
              // Phase 7-B: Presence 브로드캐스트 (leave 전에 브로드캐스트해야 함)
              try {
                socket.broadcast.to(room).emit('post:view:presence:update', {
                  postId,
                  userId,
                  action: 'end',
                })
              } catch (error: any) {
                socketLogger.error('socket:post:view:presence:broadcast:disconnect', {
                  userId,
                  socketId,
                  postId,
                  reason: error.message || 'unknown',
                })
              }
              
              socket.leave(room)
              socketLogger.info('socket:leave:post:disconnect', {
                userId,
                socketId,
                postId,
              })
            } catch (error: any) {
              socketLogger.error('socket:leave:post:disconnect', {
                userId,
                socketId,
                postId: room.replace('post:', ''),
                reason: error.message || 'unknown',
              })
            }
          }
        }

        // user room은 자동으로 제거되지만 명시적으로 로그 남김
        socketLogger.info('socket:disconnected', {
          userId,
          socketId,
          reason: reason || 'unknown',
        })

        // Connection tracking 정리
        // socketUsers에서 제거
        socketUsers.delete(socketId)

        // userSockets에서 제거
        if (userId) {
          const userSocketSet = userSockets.get(userId)
          if (userSocketSet) {
            userSocketSet.delete(socketId)
            // Set이 비어있으면 Map에서 제거 (메모리 누수 방지)
            if (userSocketSet.size === 0) {
              userSockets.delete(userId)
            }
          }
        }
      } catch (error: any) {
        socketLogger.error('socket:disconnect:cleanup', {
          userId,
          socketId,
          reason: error.message || 'unknown',
        })
      }
    })

    // 에러 이벤트 (Socket.IO 자체 에러)
    socket.on('error', (error: Error) => {
      socketLogger.error('socket:error', {
        userId,
        socketId,
        reason: error.message || 'unknown',
      })
      // 클라이언트에 에러 전송
      socket.emit('socket:error', {
        type: 'server_error',
        message: 'Socket error occurred',
      })
    })
  })

  socketLogger.info('socket:server:initialized')
  return io
}

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO가 초기화되지 않았습니다. initializeSocket을 먼저 호출하세요.')
  }
  return io
}

/**
 * Presence helper 함수들
 * 디버깅 및 향후 확장 목적 (외부 emit 없음)
 */

/**
 * 특정 사용자의 활성 socket ID 목록 반환
 * @param userId - 사용자 ID
 * @returns 활성 socket ID 배열
 */
export const getActiveSocketsByUser = (userId: string): string[] => {
  try {
    const socketSet = userSockets.get(userId)
    if (!socketSet) {
      return []
    }
    return Array.from(socketSet)
  } catch (error: any) {
    socketLogger.error('presence:getActiveSocketsByUser', {
      userId,
      reason: error.message || 'unknown',
    })
    return []
  }
}

/**
 * 특정 포스트를 보고 있는 사용자 ID 목록 반환
 * Socket.IO rooms API를 우선 사용하고, Connection tracking Map은 보조 수단으로 사용
 * @param postId - 포스트 ID
 * @returns 활성 사용자 ID 배열
 */
export const getActiveUsersByPost = (postId: string): string[] => {
  try {
    if (!io) {
      return []
    }

    const roomName = `post:${postId}`
    const room = io.sockets.adapter.rooms.get(roomName)
    
    if (!room) {
      // room이 없으면 빈 배열 반환
      return []
    }

    // Socket.IO rooms API에서 socket ID 목록 가져오기
    const socketIds = Array.from(room)
    
    // socketUsers Map을 사용하여 socket ID를 userId로 변환
    const userIds = new Set<string>()
    for (const socketId of socketIds) {
      const userId = socketUsers.get(socketId)
      if (userId) {
        userIds.add(userId)
      }
    }

    return Array.from(userIds)
  } catch (error: any) {
    socketLogger.error('presence:getActiveUsersByPost', {
      postId,
      reason: error.message || 'unknown',
    })
    return []
  }
}
