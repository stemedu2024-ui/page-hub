import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

// ESM에서 __dirname 구하기
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 환경 변수 로드
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pagehub'

async function removeEmailIndex() {
  try {
    console.log('🔌 MongoDB 연결 중...')
    await mongoose.connect(mongoURI)
    console.log('✅ MongoDB 연결 성공')

    const db = mongoose.connection.db
    const usersCollection = db.collection('users')

    // 현재 인덱스 확인
    console.log('\n📋 현재 users 컬렉션의 인덱스:')
    const indexes = await usersCollection.indexes()
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key))
    })

    // email_1 인덱스가 있는지 확인
    const emailIndex = indexes.find((idx) => idx.name === 'email_1')
    
    if (emailIndex) {
      console.log('\n🗑️ email_1 인덱스 삭제 중...')
      await usersCollection.dropIndex('email_1')
      console.log('✅ email_1 인덱스 삭제 완료')
    } else {
      console.log('\nℹ️ email_1 인덱스가 존재하지 않습니다.')
    }

    // 삭제 후 인덱스 확인
    console.log('\n📋 삭제 후 users 컬렉션의 인덱스:')
    const updatedIndexes = await usersCollection.indexes()
    updatedIndexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key))
    })

    await mongoose.connection.close()
    console.log('\n✅ 완료! MongoDB 연결 종료')
    process.exit(0)
  } catch (error) {
    console.error('❌ 에러 발생:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

removeEmailIndex()
