import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardSummary, getDashboardToday, getDashboardRecentResults } from '../services/api'
import { getShortName } from '../utils/teamNames'
import { TeamLogo } from '../components/TeamBadge'

const LEAGUES = ['', 'KBO', 'MLB', 'NPB', 'EPL', 'LALIGA', 'BUNDESLIGA', 'SERIE_A', 'NBA', 'NHL']
const LBL = { '': '전체', KBO: 'KBO', MLB: 'MLB', NPB: 'NPB', EPL: 'EPL', LALIGA: 'Liga', BUNDESLIGA: 'Bun', SERIE_A: 'Serie', NBA: 'NBA', NHL: 'NHL' }

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [games, setGames] = useState([])
  const [recent, setRecent] = useState([])
  const [league, setLeague] = useState('')
  const [sort, setSort] = useState('time')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardSummary(), getDashboardToday(), getDashboardRecentResults({ limit: 8 })])
      .then(([s, t, r]) => { setSummary(s.data); setGames(t.data); setRecent(r.data) })
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const p = { sort }; if (league) p.league = league
    getDashboardToday(p).then(r => setGames(r.data)).catch(console.error)
  }, [sort, league])

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>

  const live = games.filter(g => g.status === 'live')
  const scheduled = games.filter(g => g.status === 'scheduled')
  const final_ = games.filter(g => g.status === 'final')
  const all = [...live, ...scheduled, ...final_]

  return (
    <div className="betting-board">
      {/* ── Context Bar ── */}
      <div className="bb-context">
        <div className="bb-context-left">
          <span className="bb-date">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
          <span className="bb-divider" />
          <span className="bb-count">{all.length}경기</span>
          {live.length > 0 && <span className="bb-live-tag"><span className="bb-live-dot" />{live.length} LIVE</span>}
        </div>
        {summary && (
          <div className="bb-context-right">
            <span className="bb-accuracy">적중률 {summary.overall_accuracy}%</span>
            <span className="bb-accuracy-sub">{summary.correct_predictions}/{summary.total_finished}</span>
          </div>
        )}
      </div>

      {/* ── Filter Strip ── */}
      <div className="bb-filters">
        <div className="bb-filter-group">
          {LEAGUES.map(l => (
            <button key={l} onClick={() => setLeague(l)} className={`bb-filter-btn ${league === l ? 'active' : ''}`}>
              {LBL[l]}
            </button>
          ))}
        </div>
        <div className="bb-filter-sort">
          <button onClick={() => setSort('time')} className={`bb-sort-btn ${sort === 'time' ? 'active' : ''}`}>시간</button>
          <button onClick={() => setSort('confidence')} className={`bb-sort-btn ${sort === 'confidence' ? 'active' : ''}`}>신뢰도</button>
        </div>
      </div>

      {/* ── Match Board ── */}
      {all.length === 0 ? (
        <div className="bb-empty">오늘 예정된 경기가 없습니다</div>
      ) : (
        <div className="bb-board">
          {/* Desktop Header */}
          <div className="bb-header">
            <span className="bb-h-time">시간</span>
            <span className="bb-h-league">리그</span>
            <span className="bb-h-match">매치업</span>
            <span className="bb-h-pick">AI 추천</span>
            <span className="bb-h-prob">승률</span>
            <span className="bb-h-conf">신뢰도</span>
            <span className="bb-h-cta" />
          </div>

          {all.map(g => <MatchItem key={g.id} g={g} />)}
        </div>
      )}

      {/* ── Recent Track Record ── */}
      {recent.length > 0 && (
        <div className="bb-recent">
          <div className="bb-recent-header">
            <span>최근 적중 기록</span>
            <Link to="/live" className="bb-recent-link">전체보기</Link>
          </div>
          <div className="bb-recent-strip">
            {recent.map(g => {
              const hit = g.is_correct === true
              const miss = g.is_correct === false
              return (
                <Link key={g.id} to={`/game/${g.id}`} className={`bb-recent-dot ${hit ? 'hit' : miss ? 'miss' : ''}`}
                  title={`${getShortName(g.home_team)} ${g.home_score}-${g.away_score} ${getShortName(g.away_team)}`}>
                  {hit ? 'O' : miss ? 'X' : '—'}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function MatchItem({ g }) {
  const pred = g.prediction
  const pickHome = pred?.recommended_pick === 'home'
  const isLive = g.status === 'live'
  const isFinal = g.status === 'final'
  const locked = pred?.recommended_pick === 'locked'
  const prob = pred && !locked ? Math.max(pred.home_win_probability, pred.away_win_probability) : null
  const pick = pred && !locked ? (pickHome ? getShortName(g.home_team) : getShortName(g.away_team)) : null
  const conf = pred && !locked ? pred.confidence_score : null

  return (
    <Link to={`/game/${g.id}`} className={`bb-row ${isLive ? 'bb-row-live' : ''}`}>
      {/* Desktop */}
      <div className="bb-row-desktop">
        <span className="bb-r-time">
          {isLive ? <span className="bb-r-live"><span className="bb-live-dot" />LIVE</span>
           : isFinal ? <span className="bb-r-final">종료</span>
           : <span className="bb-r-scheduled">{g.game_time || '—'}</span>}
        </span>
        <span className="bb-r-league">{g.league}</span>
        <div className="bb-r-match">
          <div className="bb-r-team">
            <Logo g={g} side="home" />
            <span className={pickHome && !locked ? 'bb-team-picked' : 'bb-team-normal'}>{getShortName(g.home_team)}</span>
          </div>
          {isFinal ? (
            <span className="bb-r-score">{g.home_score} <span className="bb-r-score-sep">:</span> {g.away_score}</span>
          ) : (
            <span className="bb-r-vs">VS</span>
          )}
          <div className="bb-r-team bb-r-team-right">
            <span className={!pickHome && !locked ? 'bb-team-picked' : 'bb-team-normal'}>{getShortName(g.away_team)}</span>
            <Logo g={g} side="away" />
          </div>
        </div>
        <span className="bb-r-pick">{pick || (locked ? <span className="bb-locked">PRO</span> : '—')}</span>
        <span className="bb-r-prob">{prob ? `${prob}%` : '—'}</span>
        <span className="bb-r-conf">{conf ? <ConfBar v={conf} /> : '—'}</span>
        <span className="bb-r-cta">분석 →</span>
      </div>

      {/* Mobile */}
      <div className="bb-row-mobile">
        <div className="bb-m-top">
          <span className="bb-m-league">{g.league}</span>
          {isLive && <span className="bb-r-live"><span className="bb-live-dot" />LIVE</span>}
          <span className="bb-m-time">{isFinal ? '종료' : g.game_time || '—'}</span>
        </div>
        <div className="bb-m-match">
          <div className="bb-m-team">
            <Logo g={g} side="home" s="md" />
            <div>
              <span className={pickHome && !locked ? 'bb-team-picked' : 'bb-team-normal'}>{getShortName(g.home_team)}</span>
              <span className="bb-m-label">홈</span>
            </div>
          </div>
          <div className="bb-m-center">
            {isFinal ? (
              <span className="bb-m-score">{g.home_score} : {g.away_score}</span>
            ) : (
              <span className="bb-m-vs">VS</span>
            )}
          </div>
          <div className="bb-m-team bb-m-team-right">
            <div>
              <span className={!pickHome && !locked ? 'bb-team-picked' : 'bb-team-normal'}>{getShortName(g.away_team)}</span>
              <span className="bb-m-label">원정</span>
            </div>
            <Logo g={g} side="away" s="md" />
          </div>
        </div>
        {pred && !locked && (
          <div className="bb-m-prediction">
            <div className="bb-m-pred-item">
              <span className="bb-m-pred-label">추천</span>
              <span className="bb-m-pred-value bb-m-pred-pick">{pick}</span>
            </div>
            <div className="bb-m-pred-item">
              <span className="bb-m-pred-label">승률</span>
              <span className="bb-m-pred-value">{prob}%</span>
            </div>
            <div className="bb-m-pred-item">
              <span className="bb-m-pred-label">신뢰도</span>
              <ConfBar v={conf} />
            </div>
            <span className="bb-m-cta">분석 →</span>
          </div>
        )}
        {locked && <div className="bb-m-locked">PRO 구독으로 예측 확인</div>}
      </div>
    </Link>
  )
}

function ConfBar({ v }) {
  const w = Math.min(100, v)
  const c = v >= 70 ? '#059669' : v >= 40 ? '#d97706' : '#6b7280'
  return (
    <div className="bb-conf-wrap">
      <div className="bb-conf-bar"><div className="bb-conf-fill" style={{ width: `${w}%`, backgroundColor: c }} /></div>
      <span className="bb-conf-num">{v}</span>
    </div>
  )
}

function Logo({ g, side, s }) {
  const logo = side === 'home' ? g.home_logo : g.away_logo
  const team = side === 'home' ? g.home_team : g.away_team
  const cls = s === 'md' ? 'bb-logo-md' : 'bb-logo-sm'
  if (logo) return <img src={logo} alt="" className={cls} loading="lazy" />
  return <TeamLogo team={team} size={s === 'md' ? 'sm' : 'xs'} />
}
