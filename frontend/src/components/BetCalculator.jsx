import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { saveBet, getSavedBets, deleteSavedBet } from '../services/api'

// 전역 상태 (페이지 이동해도 유지)
let globalSelections = []
let globalListeners = []

export function addToBetSlip(selection) {
  const exists = globalSelections.find(s => s.id === selection.id)
  if (exists) return
  globalSelections = [...globalSelections, selection]
  globalListeners.forEach(fn => fn([...globalSelections]))
}

export function removeFromBetSlip(id) {
  globalSelections = globalSelections.filter(s => s.id !== id)
  globalListeners.forEach(fn => fn([...globalSelections]))
}

export function clearBetSlip() {
  globalSelections = []
  globalListeners.forEach(fn => fn([]))
}

function useBetSlip() {
  const [selections, setSelections] = useState([...globalSelections])
  useEffect(() => {
    globalListeners.push(setSelections)
    return () => { globalListeners = globalListeners.filter(fn => fn !== setSelections) }
  }, [])
  return selections
}

export default function BetCalculator() {
  const { user } = useAuth()
  const selections = useBetSlip()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('calc') // calc | saved
  const [amount, setAmount] = useState(10000)
  const [savedBets, setSavedBets] = useState([])
  const [saving, setSaving] = useState(false)

  const totalOdds = selections.reduce((acc, s) => acc * (s.odds || 1), 1)
  const potentialWin = Math.round(amount * totalOdds)

  const loadSaved = () => {
    if (user) getSavedBets().then(r => setSavedBets(r.data)).catch(() => {})
  }

  useEffect(() => { if (open && tab === 'saved') loadSaved() }, [open, tab])

  const handleSave = async () => {
    if (!user) return alert('로그인이 필요합니다')
    if (selections.length === 0) return
    setSaving(true)
    try {
      await saveBet({ selections, total_odds: totalOdds, bet_amount: amount, potential_win: potentialWin })
      alert('저장되었습니다')
      loadSaved()
    } catch { alert('저장 실패') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    await deleteSavedBet(id)
    loadSaved()
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 bottom-20 lg:bottom-6 z-50 w-12 h-12 bg-white text-gray-900 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <div className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {selections.length > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {selections.length}
              </span>
            )}
          </div>
        )}
      </button>

      {/* 슬라이드 패널 */}
      {open && (
        <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 z-50 bg-dark-900 border-l border-dark-600 shadow-2xl flex flex-col animate-slide-in-right">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
            <h2 className="text-sm font-bold text-white">배당 계산기</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setTab('calc')}
                className={`text-[10px] font-semibold px-2 py-1 rounded ${tab === 'calc' ? 'bg-white text-gray-900' : 'text-gray-500'}`}>
                계산기
              </button>
              <button onClick={() => setTab('saved')}
                className={`text-[10px] font-semibold px-2 py-1 rounded ${tab === 'saved' ? 'bg-white text-gray-900' : 'text-gray-500'}`}>
                저장됨
              </button>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white ml-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {tab === 'calc' ? (
            <>
              {/* 선택 목록 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                {selections.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-700 text-sm mb-2">선택한 경기가 없습니다</div>
                    <div className="text-[10px] text-gray-600">경기 목록에서 배당을 클릭하여 추가하세요</div>
                  </div>
                ) : (
                  selections.map(s => (
                    <div key={s.id} className="bg-dark-800 border border-dark-600 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-gray-600">{s.league}</span>
                        <button onClick={() => removeFromBetSlip(s.id)} className="text-gray-700 hover:text-red-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="text-xs text-gray-300 font-semibold">{s.home} vs {s.away}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-500">{s.pick}</span>
                        <span className="text-sm font-bold text-white tabular-nums">{s.odds?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 하단 계산 영역 */}
              <div className="border-t border-dark-700 p-3 space-y-3">
                {selections.length > 0 && (
                  <>
                    {/* 합산 배당 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">합산 배당</span>
                      <span className="text-lg font-black text-white tabular-nums">{totalOdds.toFixed(2)}</span>
                    </div>

                    {/* 금액 입력 */}
                    <div>
                      <label className="text-[10px] text-gray-600 mb-1 block">베팅 금액</label>
                      <div className="flex gap-1">
                        {[5000, 10000, 50000, 100000].map(v => (
                          <button key={v} onClick={() => setAmount(v)}
                            className={`flex-1 py-1.5 text-[10px] font-semibold rounded transition-colors ${
                              amount === v ? 'bg-white text-gray-900' : 'bg-dark-700 text-gray-400 hover:text-white'
                            }`}>
                            {(v / 10000).toFixed(v < 10000 ? 1 : 0)}만
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white mt-1.5 tabular-nums"
                        placeholder="직접 입력"
                      />
                    </div>

                    {/* 예상 당첨금 */}
                    <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 text-center">
                      <div className="text-[10px] text-gray-500 mb-1">적중 시 예상 당첨금</div>
                      <div className="text-2xl font-black text-emerald-400 tabular-nums">
                        {potentialWin.toLocaleString()}원
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        수익: +{(potentialWin - amount).toLocaleString()}원 ({((totalOdds - 1) * 100).toFixed(0)}%)
                      </div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={saving}
                        className="flex-1 bg-white text-gray-900 text-xs font-semibold py-2.5 rounded-lg disabled:opacity-50">
                        {saving ? '저장중...' : '저장하기'}
                      </button>
                      <button onClick={clearBetSlip}
                        className="px-4 bg-dark-700 text-gray-400 text-xs font-semibold py-2.5 rounded-lg hover:text-white">
                        초기화
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            /* 저장된 배팅 목록 */
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
              {!user ? (
                <div className="text-center py-12 text-gray-600 text-xs">로그인이 필요합니다</div>
              ) : savedBets.length === 0 ? (
                <div className="text-center py-12 text-gray-600 text-xs">저장된 배팅이 없습니다</div>
              ) : (
                savedBets.map(bet => (
                  <div key={bet.id} className="bg-dark-800 border border-dark-600 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white">{bet.name}</span>
                      <button onClick={() => handleDelete(bet.id)} className="text-[10px] text-gray-600 hover:text-red-400">삭제</button>
                    </div>
                    <div className="space-y-1 mb-2">
                      {bet.selections.map((s, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-400">{s.home} vs {s.away}</span>
                          <span className="text-gray-300 tabular-nums">{s.odds?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-dark-700">
                      <div className="text-[10px] text-gray-500">
                        {bet.bet_amount?.toLocaleString()}원 x {bet.total_odds?.toFixed(2)}
                      </div>
                      <div className="text-sm font-bold text-emerald-400 tabular-nums">
                        {bet.potential_win?.toLocaleString()}원
                      </div>
                    </div>
                    <div className="text-[9px] text-gray-700 mt-1">
                      {new Date(bet.created_at).toLocaleString('ko-KR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 오버레이 */}
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />}
    </>
  )
}
