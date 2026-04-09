import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  {
    path: '/live', label: '실시간', live: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    path: '/', label: '대시보드',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: '/games', label: '경기예측',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    path: '/dashboard', label: '내 정보', auth: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export default function Layout({ children }) {
  const { user, isPremium, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const visibleItems = NAV_ITEMS.filter(item => !item.auth || user)

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 bg-dark-900 border-r border-dark-700 fixed h-full z-40">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-dark-700">
          <img src="/logo.svg" alt="Logo" className="w-9 h-9" />
          <div>
            <div className="text-base font-black bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent leading-tight">
              스포츠스포
            </div>
            <div className="text-[10px] font-bold text-accent-blue tracking-widest">AI SPORTS</div>
          </div>
        </a>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleItems.map(item => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ripple-effect ${
                  isActive
                    ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
                }`}
              >
                <span className={isActive ? 'text-accent-blue' : 'text-gray-500'}>{item.icon}</span>
                {item.label}
                {item.live && (
                  <span className="ml-auto relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </Link>
            )
          })}

          {user?.is_admin && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                location.pathname === '/admin'
                  ? 'bg-accent-purple/10 text-accent-purple'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              관리자
            </Link>
          )}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-dark-700">
          {isPremium && (
            <div className="px-3 py-2 bg-accent-green/10 rounded-xl border border-accent-green/20 mb-2">
              <span className="text-xs font-bold text-accent-green">PRO 구독중</span>
            </div>
          )}
          {!user ? (
            <div className="space-y-1">
              <Link to="/login" className="block px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all">
                로그인
              </Link>
              <Link to="/register" className="block px-3 py-2 text-sm text-accent-blue font-medium hover:bg-accent-blue/10 rounded-xl transition-all">
                회원가입
              </Link>
            </div>
          ) : (
            <div className="px-3 py-2 space-y-2">
              <div className="text-xs text-gray-500 truncate">{user.email}</div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                로그아웃
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-dark-600/50">
        <div className="flex items-center justify-between px-3 h-12">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="w-7 h-7" />
            <span className="text-sm font-black bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
              스포츠스포AI
            </span>
          </a>
          <div className="flex items-center gap-2">
            {isPremium && (
              <span className="text-[10px] font-bold text-accent-green bg-accent-green/10 px-2 py-0.5 rounded-full">PRO</span>
            )}
            {!user ? (
              <Link to="/login" className="text-xs text-gray-400 hover:text-white">로그인</Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="w-7 h-7 bg-dark-600 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-bold text-gray-300">{user.email?.[0]?.toUpperCase()}</span>
                </Link>
                <button onClick={handleLogout} className="text-[10px] text-gray-500 hover:text-accent-red">
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 lg:ml-60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-14 lg:pt-6 pb-20 lg:pb-6">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-dark-600/50">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {visibleItems.slice(0, 4).map(item => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-xl transition-all ripple-effect ${
                  isActive ? 'text-accent-blue' : 'text-gray-500'
                }`}
              >
                <span className="relative">
                  {item.icon}
                  {item.live && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </span>
                <span className={`text-[10px] font-medium ${isActive ? 'text-accent-blue' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
