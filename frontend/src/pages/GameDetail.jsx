import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getGameDetail, getLivePrediction } from '../services/api'
import ConfidenceBadge from '../components/ConfidenceBadge'
import ProbabilityBar from '../components/ProbabilityBar'
import LeagueBadge from '../components/LeagueBadge'
import TeamBadge, { TeamLogo } from '../components/TeamBadge'
import { displayTeamName, getShortName } from '../utils/teamNames'
import PlayByPlay from '../components/PlayByPlay'

export default function GameDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // 실시간 인게임 예측 상태
  const [liveState, setLiveState] = useState({
    inning: 1, isTop: true, outs: 0,
    runner1b: false, runner2b: false, runner3b: false,
    homeScore: 0, awayScore: 0,
    pitcherEra: 4.5, pitcherPitchCount: 0, pitcherInnings: 0,
    homeBullpenEra: 4.5, awayBullpenEra: 4.5,
  })
  const [livePred, setLivePred] = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)

  useEffect(() => {
    getGameDetail(id)
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const fetchLivePrediction = useCallback(async () => {
    setLiveLoading(true)
    try {
      const res = await getLivePrediction(id, liveState)
      setLivePred(res.data)
    } catch (e) { console.error(e) }
    finally { setLiveLoading(false) }
  }, [id, liveState])

  // 상태 변경시 자동 예측
  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => fetchLivePrediction(), 300)
      return () => clearTimeout(timer)
    }
  }, [liveState, data, fetchLivePrediction])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue"></div>
      </div>
    )
  }

  if (!data) return <div className="text-center py-20 text-gray-400">경기를 찾을 수 없습니다</div>

  const g = data.game
  const ht = data.home_team_stats
  const at = data.away_team_stats
  const hp = data.home_pitcher_stats
  const ap = data.away_pitcher_stats

  const homeDisplay = g.home_team_kr ? `${g.home_team} ${g.home_team_kr}` : displayTeamName(g.home_team)
  const awayDisplay = g.away_team_kr ? `${g.away_team} ${g.away_team_kr}` : displayTeamName(g.away_team)
  const homeKr = g.home_team_kr || g.home_team
  const awayKr = g.away_team_kr || g.away_team

  const statusLabel = { final: '종료', live: '진행 중', scheduled: '예정' }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-sm text-gray-400 hover:text-white mb-4 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        예측 목록으로 돌아가기
      </Link>

      {/* 경기 헤더 */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
          <LeagueBadge league={g.league} />
          <span className="text-gray-400 text-xs sm:text-sm">{g.game_date} {g.game_time || ''}</span>
          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${
            g.status === 'final' ? 'bg-gray-600 text-gray-300' :
            g.status === 'live' ? 'bg-red-600 text-white animate-pulse' :
            'bg-dark-600 text-gray-400'
          }`}>
            {statusLabel[g.status] || g.status}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="text-center flex-1 flex flex-col items-center min-w-0">
            <TeamLogo team={g.home_team} size="lg" />
            <div className="text-sm sm:text-xl font-bold text-white mt-1.5 sm:mt-2 truncate w-full">{displayTeamName(g.home_team)}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">홈</div>
            {g.home_pitcher && <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate w-full">{g.home_pitcher}</div>}
          </div>
          <div className="px-2 sm:px-6 text-center shrink-0">
            {g.status === 'final' && g.home_score !== null ? (
              <div className="text-2xl sm:text-3xl font-bold">
                <span className="text-white">{g.home_score}</span>
                <span className="text-gray-600 mx-1 sm:mx-2">-</span>
                <span className="text-white">{g.away_score}</span>
              </div>
            ) : (
              <div className="text-lg sm:text-xl font-bold text-gray-500">VS</div>
            )}
            {g.home_odds && (
              <div className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">
                {g.home_odds.toFixed(2)} / {g.away_odds?.toFixed(2)}
              </div>
            )}
          </div>
          <div className="text-center flex-1 flex flex-col items-center min-w-0">
            <TeamLogo team={g.away_team} size="lg" />
            <div className="text-sm sm:text-xl font-bold text-white mt-1.5 sm:mt-2 truncate w-full">{displayTeamName(g.away_team)}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">원정</div>
            {g.away_pitcher && <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5 truncate w-full">{g.away_pitcher}</div>}
          </div>
        </div>

        {/* 승부 예측 */}
        {g.home_win_probability !== null && g.home_win_probability !== undefined ? (
          <div className="bg-dark-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">승부 예측</div>
            <ProbabilityBar
              homeProb={g.home_win_probability}
              awayProb={g.away_win_probability}
              homeTeam={homeKr}
              awayTeam={awayKr}
            />
            <div className="flex items-center justify-between mt-4">
              <div>
                <span className="text-xs text-gray-400">추천: </span>
                <span className={`font-bold ${g.recommended_pick === 'home' ? 'text-accent-blue' : 'text-accent-purple'}`}>
                  {g.recommended_pick === 'home' ? homeDisplay : awayDisplay}
                </span>
              </div>
              {g.confidence_score !== null && <ConfidenceBadge score={g.confidence_score} />}
            </div>
          </div>
        ) : (
          <div className="bg-dark-700 rounded-lg p-6 text-center">
            <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <p className="text-gray-400 text-sm">프리미엄 구독으로 상세 예측을 확인하세요</p>
            <Link to="/subscription" className="btn-primary text-sm mt-3 inline-block">
              지금 구독하기
            </Link>
          </div>
        )}
      </div>

      {/* 팀 스탯 비교 */}
      {(ht || at) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[
            { stats: ht, label: homeDisplay, side: 'home' },
            { stats: at, label: awayDisplay, side: 'away' },
          ].map(({ stats, label, side }) =>
            stats ? (
              <div key={side} className="card p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 tracking-wider">{label} 팀 스탯</h3>
                <div className="space-y-3">
                  <StatRow label="ELO 레이팅" value={stats.elo_rating.toFixed(0)} />
                  <StatRow label="시즌 성적" value={`${stats.wins}승 ${stats.losses}패`} />
                  <StatRow label="최근 5경기 승률" value={`${(stats.win_rate_last5 * 100).toFixed(0)}%`} />
                  <StatRow label="평균 득점" value={stats.avg_runs_scored.toFixed(2)} />
                  <StatRow label="평균 실점" value={stats.avg_runs_allowed.toFixed(2)} />
                  <StatRow label="득실점 차" value={stats.run_differential > 0 ? `+${stats.run_differential.toFixed(2)}` : stats.run_differential.toFixed(2)} />
                  <StatRow label="홈 승률" value={`${(stats.win_rate_home * 100).toFixed(0)}%`} />
                  <StatRow label="원정 승률" value={`${(stats.win_rate_away * 100).toFixed(0)}%`} />
                  <StatRow label="연속" value={stats.streak > 0 ? `${stats.streak}연승` : stats.streak < 0 ? `${Math.abs(stats.streak)}연패` : '-'} />
                  <StatRow label="리그 순위" value={`${stats.league_rank}위`} />
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* 투수 스탯 */}
      {(hp || ap) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[
            { stats: hp, label: g.home_pitcher || '홈 선발투수' },
            { stats: ap, label: g.away_pitcher || '원정 선발투수' },
          ].map(({ stats, label }, i) =>
            stats ? (
              <div key={i} className="card p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-4 tracking-wider">{label}</h3>
                <div className="space-y-3">
                  <StatRow label="평균자책점 (ERA)" value={stats.era.toFixed(2)} />
                  <StatRow label="WHIP" value={stats.whip.toFixed(2)} />
                  <StatRow label="시즌 성적" value={`${stats.wins}승 ${stats.losses}패`} />
                  <StatRow label="투구 이닝" value={stats.innings_pitched.toFixed(1)} />
                  <StatRow label="탈삼진" value={stats.strikeouts} />
                  <StatRow label="최근 컨디션" value={`${(stats.recent_form * 100).toFixed(0)}%`} />
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* ── 문자 중계 ── */}
      {(g.status === 'live' || g.status === 'final') && (
        <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
            <span className="text-base">📋</span>
            문자 중계
            {g.status === 'live' && <span className="text-[9px] text-gray-500 ml-1">15초마다 자동갱신</span>}
          </h2>
          <p className="text-[10px] text-gray-600 mb-3">타석별 상세 기록 · 투구 내용 · 실시간 스코어</p>
          <PlayByPlay gameId={g.id} isLive={g.status === 'live'} />
        </div>
      )}

      {/* ── 실시간 인게임 예측 시뮬레이터 ── */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          실시간 경기 중 예측
        </h2>
        <p className="text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-5">경기 상황을 입력하면 실시간 승률 · 득점 확률 · 기대 득점을 계산합니다</p>

        {/* 이닝 & 공수 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">이닝</label>
            <select value={liveState.inning} onChange={e => setLiveState(s => ({...s, inning: +e.target.value}))}
              className="w-full bg-dark-700 border border-dark-500 rounded px-3 py-2 text-white text-sm">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => <option key={i} value={i}>{i}회</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">초/말</label>
            <div className="flex gap-1">
              <button onClick={() => setLiveState(s => ({...s, isTop: true}))}
                className={`flex-1 py-2 rounded text-sm font-semibold transition ${liveState.isTop ? 'bg-accent-blue text-white' : 'bg-dark-700 text-gray-400'}`}>
                초 (원정)
              </button>
              <button onClick={() => setLiveState(s => ({...s, isTop: false}))}
                className={`flex-1 py-2 rounded text-sm font-semibold transition ${!liveState.isTop ? 'bg-accent-purple text-white' : 'bg-dark-700 text-gray-400'}`}>
                말 (홈)
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">아웃카운트</label>
            <div className="flex gap-1">
              {[0,1,2].map(o => (
                <button key={o} onClick={() => setLiveState(s => ({...s, outs: o}))}
                  className={`flex-1 py-2 rounded text-sm font-bold transition ${liveState.outs === o ? 'bg-yellow-600 text-white' : 'bg-dark-700 text-gray-400'}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 점수 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">{homeKr} (홈) 점수</label>
            <input type="number" min={0} max={99} value={liveState.homeScore}
              onChange={e => setLiveState(s => ({...s, homeScore: Math.max(0, +e.target.value)}))}
              className="w-full bg-dark-700 border border-dark-500 rounded px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">{awayKr} (원정) 점수</label>
            <input type="number" min={0} max={99} value={liveState.awayScore}
              onChange={e => setLiveState(s => ({...s, awayScore: Math.max(0, +e.target.value)}))}
              className="w-full bg-dark-700 border border-dark-500 rounded px-3 py-2 text-white text-sm" />
          </div>
        </div>

        {/* 주자 상황 - 다이아몬드 */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-2">주자 상황 (클릭으로 토글)</label>
          <div className="flex justify-center">
            <div className="relative w-40 h-40">
              {/* 다이아몬드 */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="50,10 90,50 50,90 10,50" fill="none" stroke="#374151" strokeWidth="2" />
                <line x1="50" y1="90" x2="50" y2="50" stroke="#374151" strokeWidth="1" strokeDasharray="4" />
              </svg>
              {/* 홈 */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1">
                <div className="w-5 h-5 bg-dark-500 rotate-45 border border-gray-600"></div>
              </div>
              {/* 1루 */}
              <button onClick={() => setLiveState(s => ({...s, runner1b: !s.runner1b}))}
                className={`absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded transition-all ${
                  liveState.runner1b ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30 scale-110' : 'bg-dark-600 hover:bg-dark-500'
                }`}>
                <span className="text-[10px] font-bold text-white flex items-center justify-center h-full">1B</span>
              </button>
              {/* 2루 */}
              <button onClick={() => setLiveState(s => ({...s, runner2b: !s.runner2b}))}
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-7 h-7 rounded transition-all ${
                  liveState.runner2b ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30 scale-110' : 'bg-dark-600 hover:bg-dark-500'
                }`}>
                <span className="text-[10px] font-bold text-white flex items-center justify-center h-full">2B</span>
              </button>
              {/* 3루 */}
              <button onClick={() => setLiveState(s => ({...s, runner3b: !s.runner3b}))}
                className={`absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded transition-all ${
                  liveState.runner3b ? 'bg-yellow-500 shadow-lg shadow-yellow-500/30 scale-110' : 'bg-dark-600 hover:bg-dark-500'
                }`}>
                <span className="text-[10px] font-bold text-white flex items-center justify-center h-full">3B</span>
              </button>
            </div>
          </div>
          <div className="text-center mt-1 text-xs text-gray-500">
            {!liveState.runner1b && !liveState.runner2b && !liveState.runner3b ? '주자 없음' :
              [liveState.runner1b && '1루', liveState.runner2b && '2루', liveState.runner3b && '3루'].filter(Boolean).join(', ') + ' 주자'}
          </div>
        </div>

        {/* 투수 상태 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">현재 투수 ERA</label>
            <input type="number" step="0.01" min={0} max={20} value={liveState.pitcherEra}
              onChange={e => setLiveState(s => ({...s, pitcherEra: +e.target.value}))}
              className="w-full bg-dark-700 border border-dark-500 rounded px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">투구수</label>
            <input type="number" min={0} max={200} value={liveState.pitcherPitchCount}
              onChange={e => setLiveState(s => ({...s, pitcherPitchCount: Math.max(0, +e.target.value)}))}
              className="w-full bg-dark-700 border border-dark-500 rounded px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">투구 이닝</label>
            <input type="number" step="0.1" min={0} max={9} value={liveState.pitcherInnings}
              onChange={e => setLiveState(s => ({...s, pitcherInnings: +e.target.value}))}
              className="w-full bg-dark-700 border border-dark-500 rounded px-3 py-2 text-white text-sm" />
          </div>
        </div>

        {/* 불펜 ERA */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="block text-xs text-gray-400 mb-1">홈 불펜 ERA</label>
            <input type="number" step="0.01" min={0} max={20} value={liveState.homeBullpenEra}
              onChange={e => setLiveState(s => ({...s, homeBullpenEra: +e.target.value}))}
              className="w-full bg-dark-700 border border-dark-500 rounded px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">원정 불펜 ERA</label>
            <input type="number" step="0.01" min={0} max={20} value={liveState.awayBullpenEra}
              onChange={e => setLiveState(s => ({...s, awayBullpenEra: +e.target.value}))}
              className="w-full bg-dark-700 border border-dark-500 rounded px-3 py-2 text-white text-sm" />
          </div>
        </div>

        {/* 프리셋 버튼 */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-xs text-gray-500 self-center mr-1">빠른 설정:</span>
          <button onClick={() => setLiveState(s => ({...s, outs: 1, runner2b: true, runner1b: false, runner3b: false}))}
            className="text-xs px-3 py-1 rounded bg-dark-600 text-gray-300 hover:bg-dark-500 transition">1사 2루</button>
          <button onClick={() => setLiveState(s => ({...s, outs: 2, runner1b: false, runner2b: false, runner3b: false}))}
            className="text-xs px-3 py-1 rounded bg-dark-600 text-gray-300 hover:bg-dark-500 transition">2사 주자없음</button>
          <button onClick={() => setLiveState(s => ({...s, outs: 0, runner1b: true, runner2b: true, runner3b: true}))}
            className="text-xs px-3 py-1 rounded bg-dark-600 text-gray-300 hover:bg-dark-500 transition">무사 만루</button>
          <button onClick={() => setLiveState(s => ({...s, outs: 1, runner1b: false, runner2b: false, runner3b: true}))}
            className="text-xs px-3 py-1 rounded bg-dark-600 text-gray-300 hover:bg-dark-500 transition">1사 3루</button>
          <button onClick={() => setLiveState(s => ({...s, outs: 0, runner1b: true, runner2b: true, runner3b: false}))}
            className="text-xs px-3 py-1 rounded bg-dark-600 text-gray-300 hover:bg-dark-500 transition">무사 1,2루</button>
        </div>

        {/* 예측 결과 */}
        {livePred && (
          <div className="space-y-4">
            {/* 승률 */}
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">실시간 승률</div>
              <ProbabilityBar
                homeProb={livePred.home_win_probability}
                awayProb={livePred.away_win_probability}
                homeTeam={homeKr}
                awayTeam={awayKr}
              />
            </div>

            {/* 핵심 지표 3개 */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-dark-700 rounded-lg p-2.5 sm:p-4 text-center">
                <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5">기대 득점</div>
                <div className="text-lg sm:text-2xl font-bold text-accent-blue">{livePred.expected_runs.toFixed(2)}</div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 hidden sm:block">이번 이닝 남은 기대득점</div>
              </div>
              <div className="bg-dark-700 rounded-lg p-2.5 sm:p-4 text-center">
                <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5">득점 확률</div>
                <div className={`text-lg sm:text-2xl font-bold ${livePred.scoring_probability > 0.5 ? 'text-green-400' : livePred.scoring_probability > 0.3 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {(livePred.scoring_probability * 100).toFixed(1)}%
                </div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 hidden sm:block">최소 1점 이상 득점</div>
              </div>
              <div className="bg-dark-700 rounded-lg p-2.5 sm:p-4 text-center">
                <div className="text-[10px] sm:text-xs text-gray-400 mb-0.5">이닝 종료</div>
                <div className="text-lg sm:text-2xl font-bold text-accent-purple">{(livePred.inning_end_probability * 100).toFixed(0)}%</div>
                <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 hidden sm:block">곧 이닝이 끝날 확률</div>
              </div>
            </div>

            {/* 상세 지표 */}
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">상세 분석</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <StatRow label="무득점 확률" value={`${(livePred.no_scoring_probability * 100).toFixed(1)}%`} />
                <StatRow label="레버리지 지수" value={livePred.situation.leverage_index.toFixed(2)} />
                <StatRow label="투수 피로도" value={`${livePred.situation.pitcher_fatigue}%`} />
                <StatRow label="남은 이닝" value={`${livePred.situation.remaining_innings}이닝`} />
                <StatRow label="공격 흐름" value={livePred.situation.momentum === 'home' ? `${homeKr} 공격중` : `${awayKr} 공격중`} />
                <StatRow label="점수차" value={livePred.situation.score_diff > 0 ? `홈 +${livePred.situation.score_diff}` : livePred.situation.score_diff < 0 ? `원정 +${Math.abs(livePred.situation.score_diff)}` : '동점'} />
              </div>
            </div>

            {/* 시나리오 */}
            {livePred.scenarios && livePred.scenarios.length > 0 && (
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">상황 시나리오</div>
                <div className="space-y-2">
                  {livePred.scenarios.map((sc, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2 rounded text-sm ${
                      sc.type === 'high_scoring' ? 'bg-green-900/30 text-green-300' :
                      sc.type === 'low_scoring' ? 'bg-red-900/30 text-red-300' :
                      sc.type === 'scoring_position' ? 'bg-yellow-900/30 text-yellow-300' :
                      sc.type === 'close_game' ? 'bg-purple-900/30 text-purple-300' :
                      sc.type === 'blowout' ? 'bg-gray-800/50 text-gray-400' :
                      'bg-dark-600 text-gray-300'
                    }`}>
                      <span className="shrink-0 mt-0.5">
                        {sc.type === 'high_scoring' ? '🔥' : sc.type === 'low_scoring' ? '🧊' :
                         sc.type === 'scoring_position' ? '⚡' : sc.type === 'close_game' ? '🔔' :
                         sc.type === 'blowout' ? '📊' : '📌'}
                      </span>
                      <div>
                        <div>{sc.desc}</div>
                        {sc.prob && <div className="text-xs opacity-75 mt-0.5">확률: {sc.prob}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {liveLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-accent-blue"></div>
            <span className="ml-2 text-sm text-gray-400">예측 계산중...</span>
          </div>
        )}
      </div>
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-dark-600/50">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}
