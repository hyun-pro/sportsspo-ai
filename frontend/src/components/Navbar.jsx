import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout, isPremium } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-dark-800 border-b border-dark-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                스포츠스포
              </span>
              <span className="text-xs font-bold text-accent-blue">AI</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <Link to="/live" className="text-accent-red hover:text-red-400 transition-colors text-sm font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              실시간
            </Link>
            <Link to="/" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              대시보드
            </Link>
            <Link to="/games" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              경기 예측
            </Link>
            {user && (
              <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                내 정보
              </Link>
            )}
            {user?.is_admin && (
              <Link to="/admin" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                관리자
              </Link>
            )}
            {!isPremium && user && (
              <Link to="/subscription" className="text-accent-yellow hover:text-yellow-400 transition-colors text-sm font-semibold">
                구독하기
              </Link>
            )}
            {isPremium && (
              <span className="px-2 py-0.5 bg-accent-green/20 text-accent-green text-xs font-semibold rounded-full border border-accent-green/30">
                PRO
              </span>
            )}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 truncate max-w-[150px]">{user.email}</span>
                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-4">
                  로그아웃
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm py-1.5 px-4">로그인</Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 px-4">회원가입</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300 hover:text-white p-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 space-y-1">
            <Link to="/live" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-accent-red hover:bg-dark-700 rounded-lg text-sm font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              실시간
            </Link>
            <Link to="/" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-700 rounded-lg text-sm">
              대시보드
            </Link>
            <Link to="/games" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-700 rounded-lg text-sm">
              경기 예측
            </Link>
            {user && (
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-700 rounded-lg text-sm">
                내 정보
              </Link>
            )}
            {!user ? (
              <div className="flex gap-2 px-3 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm py-1.5 px-4 flex-1 text-center">
                  로그인
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm py-1.5 px-4 flex-1 text-center">
                  회원가입
                </Link>
              </div>
            ) : (
              <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="block w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-700 rounded-lg text-sm">
                로그아웃
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
