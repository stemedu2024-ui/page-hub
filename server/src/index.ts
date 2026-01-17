import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import mongoose from 'mongoose'
import { connectDB } from './utils/db'
import { errorHandler } from './middleware/errorHandler'
import { initializeSocket } from './utils/socket'

// ESM에서 __dirname 구하기
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 환경 변수 로드 (server 폴더의 .env 파일 명시적 지정)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const httpServer = createServer(app)
const PORT = Number(process.env.PORT) || 5000

// 미들웨어
// CORS 설정: 개발 환경에서는 localhost의 모든 포트 허용
app.use(cors({
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
      // 개발 환경에서는 기본적으로 허용
      callback(null, true)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// 라우트
import routes from './routes'
app.use('/api', routes)

// 라우트 등록 확인 로그
console.log('📋 등록된 라우트:')
console.log('  - /api/auth/*')
console.log('  - /api/posts/*')
console.log('  - /api/friends/*')
console.log('  - /api/comments/*')
console.log('  - /api/notifications/*')

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'PageHub API is running' })
})

// 에러 핸들러
app.use(errorHandler)

// 처리되지 않은 예외 핸들러
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error)
  console.error('Stack:', error.stack)
  // 서버를 종료하지 않고 계속 실행 (개발 환경)
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
})

// 처리되지 않은 Promise Rejection 핸들러
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('❌ Unhandled Rejection at:', promise)
  console.error('Reason:', reason)
  // 서버를 종료하지 않고 계속 실행 (개발 환경)
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
})

// 서버 시작
const startServer = async () => {
  try {
    await connectDB()
    
    // nodemon 재시작 시 이전 프로세스가 완전히 종료될 시간 확보 (Windows)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Socket.IO 초기화
    initializeSocket(httpServer)
    
    // 서버 시작 (동기 에러도 처리하기 위해 try-catch 사용)
    try {
      httpServer.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`)
        console.log(`📡 Health check: http://localhost:${PORT}/api/health`)
        console.log(`🔌 Socket.IO ready`)
      })
    } catch (listenError: any) {
      // 동기 에러 처리 (포트 충돌 등)
      if (listenError.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use (sync error).`)
        console.error(`💡 Nodemon will retry automatically after delay.`)
        // 프로세스를 종료하여 nodemon이 재시작하도록 함
        process.exit(1)
      } else {
        throw listenError
      }
    }
    
    httpServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use (async error).`)
        console.error(`💡 Nodemon will retry automatically after delay.`)
        // 프로세스를 종료하여 nodemon이 재시작하도록 함
        process.exit(1)
      } else {
        console.error('❌ Server error:', err)
        // 심각한 에러인 경우 프로세스 종료
        process.exit(1)
      }
    })
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully')
      httpServer.close(() => {
        console.log('Process terminated')
        mongoose.connection.close().then(() => {
          console.log('MongoDB connection closed')
          process.exit(0)
        })
      })
    })
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully')
      httpServer.close(() => {
        console.log('Process terminated')
        mongoose.connection.close().then(() => {
          console.log('MongoDB connection closed')
          process.exit(0)
        })
      })
    })
    
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    // 에러 발생 시 프로세스를 종료하여 nodemon이 재시작하도록 함
    // nodemon이 delay 후 자동으로 재시작함
    console.error('💡 Nodemon will automatically retry after delay...')
    process.exit(1)
  }
}

startServer()
