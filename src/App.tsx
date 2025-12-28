import { useState, useEffect } from 'react'
import './App.css'
import GradeCalculator from './components/GradeCalculator'
import SubGradeCalculator from './components/SubGradeCalculator'
import UserManager from './components/UserManager'
import type { UserSession } from './types/user'
import { getCurrentUser, setCurrentUser, logoutUser } from './utils/userManager'

function App() {
  const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main')
  const [currentUser, setCurrentUserState] = useState<UserSession | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(true)

  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUserState(user)
    setIsUserLoading(false)
  }, [])

  const handleUserSelected = (user: UserSession) => {
    setCurrentUser(user)
    setCurrentUserState(user)
  }

  const handleLogout = () => {
    logoutUser()
    setCurrentUserState(null)
  }

  if (isUserLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        読み込み中...
      </div>
    )
  }

  if (!currentUser) {
    return <UserManager onUserSelected={handleUserSelected} />
  }

  return (
    <div className="App">
      {/* ユーザーヘッダー */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
        backgroundColor: 'rgba(51, 51, 51, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '10px 20px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '16px', fontWeight: '600' }}>
          👤 {currentUser.userName}さん
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#ff7e5f',
            border: '1px solid #ff7e5f',
            borderRadius: '15px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#ff7e5f';
            e.currentTarget.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#ff7e5f';
          }}
        >
          ログアウト
        </button>
      </div>

      {/* ナビゲーションタブ */}
      <div style={{
        position: 'fixed',
        top: '50px',
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '15px 0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <button
            onClick={() => setActiveTab('main')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'main' ? '#667eea' : 'transparent',
              color: activeTab === 'main' ? 'white' : '#667eea',
              border: `2px solid #667eea`,
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              flex: 1,
              maxWidth: '200px'
            }}
          >
            📚 主要教科
          </button>
          <button
            onClick={() => setActiveTab('sub')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'sub' ? '#ff7e5f' : 'transparent',
              color: activeTab === 'sub' ? 'white' : '#ff7e5f',
              border: `2px solid #ff7e5f`,
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              flex: 1,
              maxWidth: '200px'
            }}
          >
            🎨 技能評価
          </button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{ paddingTop: '130px' }}>
        {activeTab === 'main' && <GradeCalculator />}
        {activeTab === 'sub' && <SubGradeCalculator />}
      </div>
    </div>
  )
}

export default App
