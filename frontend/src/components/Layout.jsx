import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { PricingBanner } from './PricingCard'
import { getNotifications, getAnnouncements } from '../services/api'
import BetCalculator from './BetCalculator'

const I = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d={d} strokeLinecap="round" strokeLinejoin="round" /></svg>

const NAV_MAIN = [
  { path: '/live', label: '실시간', live: true, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><circle cx="12" cy="12" r="10" /><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" /></svg> },
  { path: '/', label: '승률분석', icon: I('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z') },
  { path: '/community', label: '커뮤니티', icon: I('M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1m0-3V6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2h-3l-4 4V12H9a2 2 0 01-2-2z') },
]

const NAV_SPORTS = [
  { path: '/games?sport=baseball', label: '야구', emoji: '⚾' },
  { path: '/games?sport=soccer', label: '축구', emoji: '⚽' },
  { path: '/games?sport=basketball', label: '농구', emoji: '🏀' },
  { path: '/games?sport=hockey', label: '하키', emoji: '🏒' },
]

const NAV_SUB = [
  { path: '/rankings', label: '랭킹', icon: I('M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z') },
  { path: '/stats', label: '적중 통계', auth: true, icon: I('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6') },
  { path: '/notifications', label: '알림', auth: true, icon: I('M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9') },
  { path: '/subscription', label: '요금제', icon: I('M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z') },
  { path: '/announcements', label: '공지사항', icon: I('M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z') },
  { path: '/support', label: '고객센터', icon: I('M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z') },
  { path: '/guide', label: '가이드', icon: I('M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253') },
  { path: '/dashboard', label: '내 정보', auth: true, icon: I('M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z') },
]

export default function Layout({ children }) {
  const { user, isPremium, planLabel, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [newAnnouncements, setNewAnnouncements] = useState(0)

  // 알림 + 공지 카운트 (최초 1회 + 60초마다)
  useEffect(() => {
    const fetchCounts = () => {
      if (user) getNotifications().then(res => setUnreadNotifs(res.data.unread || 0)).catch(() => {})
      getAnnouncements().then(res => {
        const recent = (res.data || []).filter(a => (Date.now() - new Date(a.created_at).getTime()) / 86400000 < 3)
        setNewAnnouncements(recent.length)
      }).catch(() => {})
    }
    fetchCounts()
    const timer = setInterval(fetchCounts, 60000)
    return () => clearInterval(timer)
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const mainItems = NAV_MAIN
  const subItems = NAV_SUB.filter(item => !item.auth || user)
  const bottomItems = [...NAV_MAIN.slice(0, 3), { path: '/community', label: '커뮤니티', icon: NAV_MAIN[3]?.icon }].slice(0, 5)

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
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-wider px-3 mb-2">메인</div>
          <div className="space-y-0.5 mb-4">
            {mainItems.map(item => <SidebarLink key={item.path} item={item} location={location} />)}
          </div>

          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-wider px-3 mb-2">경기예측</div>
          <div className="space-y-0.5 mb-4">
            {NAV_SPORTS.map(item => (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.search.includes(item.label === '야구' ? 'baseball' : item.label === '축구' ? 'soccer' : 'basketball')
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
                }`}>
                <span className="text-base w-5 text-center">{item.emoji}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-wider px-3 mb-2">더보기</div>
          <div className="space-y-0.5 mb-4">
            {subItems.map(item => (
              <SidebarLink key={item.path} item={item} location={location}
                badge={item.path === '/notifications' ? unreadNotifs : item.path === '/announcements' ? newAnnouncements : 0} />
            ))}
          </div>

          {user?.is_admin && (
            <>
              <div className="text-[9px] font-bold text-gray-600 uppercase tracking-wider px-3 mb-2">관리</div>
              <SidebarLink item={{ path: '/admin', label: '관리자', icon: I('M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996-.608.07-2.296-1.065-2.572') }} location={location} />
            </>
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-dark-700">
          {/* 비구독자: 요금제 배너, 구독자: PRO 뱃지 */}
          {isPremium ? (
            <div className={`mx-3 mt-3 mb-2 px-3 py-2 rounded-xl border ${
              planLabel === 'PREMIUM' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-accent-green/10 border-accent-green/20'
            }`}>
              <span className={`text-xs font-bold ${planLabel === 'PREMIUM' ? 'text-amber-400' : 'text-accent-green'}`}>
                {planLabel || 'PRO'} 구독중
              </span>
            </div>
          ) : (
            <div className="mt-3"><PricingBanner /></div>
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
            {/* 알림 아이콘 */}
            {user && (
              <Link to="/notifications" className="relative p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-gray-400">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent-red text-white text-[8px] font-black min-w-[14px] h-[14px] rounded-full flex items-center justify-center">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </Link>
            )}
            {isPremium && planLabel && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                planLabel === 'PREMIUM' ? 'text-amber-400 bg-amber-500/10' : 'text-accent-green bg-accent-green/10'
              }`}>{planLabel}</span>
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

      {/* ── Bet Calculator (플로팅) ── */}
      <BetCalculator />

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-dark-600/50">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          {NAV_MAIN.map(item => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-xl transition-all ${
                  isActive ? 'text-accent-blue' : 'text-gray-500'
                }`}
              >
                <span className="relative">
                  {item.icon}
                  {item.live && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                </span>
                <span className={`text-[9px] font-medium ${isActive ? 'text-accent-blue' : 'text-gray-600'}`}>{item.label}</span>
              </Link>
            )
          })}
          {/* 더보기 */}
          <Link to="/guide" className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-xl transition-all ${
            ['/guide', '/subscription', '/dashboard'].includes(location.pathname) ? 'text-accent-blue' : 'text-gray-500'
          }`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
            <span className="text-[9px] font-medium">더보기</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

function SidebarLink({ item, location, badge }) {
  const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  return (
    <Link to={item.path}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive ? 'bg-accent-blue/10 text-accent-blue' : 'text-gray-400 hover:text-white hover:bg-dark-700/50'
      }`}>
      <span className={isActive ? 'text-accent-blue' : 'text-gray-500'}>{item.icon}</span>
      {item.label}
      {item.live && (
        <span className="ml-auto relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
      {badge > 0 && !item.live && (
        <span className="ml-auto bg-accent-red text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
