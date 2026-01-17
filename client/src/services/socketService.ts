import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

type StateChangeCallback = (state: ConnectionState) => void

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private connectionState: ConnectionState = 'disconnected'
  private stateChangeCallbacks: Set<StateChangeCallback> = new Set()

  /**
   * 연결 상태 변경을 구독하는 메서드
   */
  onStateChange(callback: StateChangeCallback): () => void {
    this.stateChangeCallbacks.add(callback)
    // 즉시 현재 상태를 전달
    callback(this.connectionState)
    
    // 구독 해제 함수 반환
    return () => {
      this.stateChangeCallbacks.delete(callback)
    }
  }

  /**
   * 현재 연결 상태 반환
   */
  getConnectionState(): ConnectionState {
    return this.connectionState
  }

  /**
   * 연결 상태 변경 (내부용)
   */
  private setConnectionState(newState: ConnectionState) {
    if (this.connectionState === newState) return
    
    this.connectionState = newState
    // 모든 콜백에 상태 변경 알림
    this.stateChangeCallbacks.forEach((callback) => {
      try {
        callback(newState)
      } catch (error) {
        console.error('Socket state change callback error:', error)
      }
    })
  }

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('🔌 Socket 이미 연결됨')
      return
    }

    // 연결 시작 시 상태를 'connecting'으로 변경
    this.setConnectionState('connecting')

    // API URL에서 포트만 추출하여 Socket.IO 서버 URL 생성
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const serverUrl = apiUrl.replace('/api', '') || 'http://localhost:5000'
    
    console.log('🔌 Socket 연결 시도:', serverUrl)
    
    this.socket = io(serverUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    })

    this.socket.on('connect', () => {
      console.log('✅ Socket 연결 성공')
      this.reconnectAttempts = 0
      this.setConnectionState('connected')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket 연결 해제:', reason)
      this.setConnectionState('disconnected')
      
      if (reason === 'io server disconnect') {
        // 서버가 연결을 끊은 경우 (인증 실패 등)
        this.socket?.connect()
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket 연결 에러:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Socket 재연결 최대 횟수 초과')
        this.setConnectionState('disconnected')
        // 폴백: REST API 사용
      } else {
        // 재연결 시도 중
        this.setConnectionState('reconnecting')
      }
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket 재연결 성공 (시도 ${attemptNumber}회)`)
      this.reconnectAttempts = 0
      this.setConnectionState('connected')
      
      // 재연결 후 토큰 갱신
      const newToken = useAuthStore.getState().user?.token
      if (newToken && this.socket) {
        this.socket.auth = { token: newToken }
      }
    })

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Socket 재연결 시도 ${attemptNumber}/${this.maxReconnectAttempts}`)
      this.setConnectionState('reconnecting')
    })

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket 재연결 실패')
      this.setConnectionState('disconnected')
    })

    // socket:error 이벤트 처리 (서버에서 보낸 에러)
    this.socket.on('socket:error', (error: { type: string; message: string }) => {
      console.error('❌ Socket 서버 에러:', error)
      // 에러 타입에 따라 처리 (현재는 로그만)
      if (error.type === 'auth_error') {
        // 인증 에러는 재연결하지 않음
        this.setConnectionState('disconnected')
      }
    })
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Socket 연결 해제')
      this.socket.disconnect()
      this.socket = null
      this.reconnectAttempts = 0
      this.setConnectionState('disconnected')
    }
  }

  joinPost(postId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join:post', postId)
    }
  }

  leavePost(postId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave:post', postId)
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  getSocket(): Socket | null {
    return this.socket
  }
}

export const socketService = new SocketService()
