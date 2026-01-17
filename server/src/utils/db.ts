import mongoose from 'mongoose'

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pagehub'
    
    // MongoDB 연결 옵션 추가 (재시도 로직 포함)
    const options = {
      serverSelectionTimeoutMS: 5000, // 5초 타임아웃
      socketTimeoutMS: 45000,
    }
    
    await mongoose.connect(mongoURI, options)
    
    console.log('✅ MongoDB connected successfully')
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err)
      // 개발 환경에서는 프로세스를 종료하지 않음
      if (process.env.NODE_ENV === 'production') {
        process.exit(1)
      }
    })
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected')
      // 개발 환경에서는 자동 재연결 시도
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔄 Attempting to reconnect to MongoDB...')
        setTimeout(() => {
          connectDB().catch((err) => {
            console.error('❌ MongoDB reconnection failed:', err)
          })
        }, 5000)
      }
    })
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected')
    })
    
  } catch (error: any) {
    console.error('❌ MongoDB connection failed:', error.message)
    // 개발 환경에서는 에러를 throw하지 않고 로깅만
    if (process.env.NODE_ENV === 'production') {
      throw error
    } else {
      console.error('⚠️ Continuing without MongoDB connection in development mode...')
      console.error('💡 Please ensure MongoDB is running: mongod')
    }
  }
}
