import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import PrivateRoute from './components/PrivateRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import FeedPage from './pages/FeedPage'
import CreatePostPage from './pages/CreatePostPage'
import FriendsPage from './pages/FriendsPage'
import { useAuthStore } from './store/authStore'

function App() {
  const { checkAuth, token } = useAuthStore()

  useEffect(() => {
    // 앱 시작 시 인증 상태 확인
    const storedToken = localStorage.getItem('token')
    console.log('🚀 App 마운트:', {
      storedToken: !!storedToken,
      token: !!token,
      pathname: window.location.pathname,
    })
    
    if (storedToken && !token) {
      console.log('🔄 App 초기화: 토큰 발견, 인증 상태 확인 시작')
      checkAuth()
        .then(() => {
          console.log('✅ App 초기화: 인증 확인 완료')
        })
        .catch((error) => {
          console.error('❌ App 초기화: 인증 확인 실패', error)
        })
    } else if (!storedToken) {
      console.log('ℹ️ App 초기화: 토큰 없음, 인증 확인 건너뜀')
    }
  }, []) // 의존성 배열을 비워서 마운트 시 한 번만 실행

  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/feed"
              element={
                <PrivateRoute>
                  <FeedPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/posts/create"
              element={
                <PrivateRoute>
                  <CreatePostPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/friends"
              element={
                <PrivateRoute>
                  <FriendsPage />
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
