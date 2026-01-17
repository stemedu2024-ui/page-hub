import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const PORT = process.env.PORT || 5000

async function killPort() {
  try {
    // Windows에서 포트를 사용하는 프로세스 찾기
    const { stdout } = await execAsync(`netstat -ano | findstr :${PORT}`)
    
    if (!stdout) {
      console.log(`✅ Port ${PORT} is free`)
      return
    }

    // PID 추출
    const lines = stdout.trim().split('\n')
    const pids = new Set()
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/)
      const pid = parts[parts.length - 1]
      if (pid && !isNaN(pid)) {
        pids.add(pid)
      }
    })

    if (pids.size === 0) {
      console.log(`✅ Port ${PORT} is free`)
      return
    }

    // 각 PID 종료
    for (const pid of pids) {
      try {
        console.log(`🔪 Killing process ${pid} on port ${PORT}...`)
        await execAsync(`taskkill /F /PID ${pid}`)
        console.log(`✅ Process ${pid} killed`)
      } catch (error) {
        // 프로세스가 이미 종료되었을 수 있음
        console.log(`⚠️ Process ${pid} may already be terminated`)
      }
    }

    // 프로세스 종료 대기
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log(`✅ Port ${PORT} is now free`)
  } catch (error) {
    // netstat에서 아무것도 찾지 못한 경우 (포트가 비어있음)
    if (error.code === 1 || error.message.includes('findstr')) {
      console.log(`✅ Port ${PORT} is free`)
      return
    }
    console.error(`❌ Error killing port ${PORT}:`, error.message)
  }
}

killPort()
