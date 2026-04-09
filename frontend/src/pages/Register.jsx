import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, getMe, checkNickname } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', nickname: '', phone: '', birthday: '', privacy_agreed: false })
  const [error, setError] = useState('')
  const [nickStatus, setNickStatus] = useState(null) // null | 'checking' | 'available' | 'taken'
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const checkNick = async () => {
    if (!form.nickname || form.nickname.length < 2) return
    setNickStatus('checking')
    try {
      const res = await checkNickname(form.nickname)
      setNickStatus(res.data.available ? 'available' : 'taken')
    } catch { setNickStatus(null) }
  }

  const validate = () => {
    if (!/^[a-zA-Z0-9]{6,}$/.test(form.email)) return '아이디는 영문, 숫자 조합 6자 이상이어야 합니다'
    if (form.password.length < 8) return '비밀번호는 8자 이상이어야 합니다'
    if (!/[a-zA-Z]/.test(form.password)) return '비밀번호에 영문을 포함해야 합니다'
    if (!/[0-9]/.test(form.password)) return '비밀번호에 숫자를 포함해야 합니다'
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) return '비밀번호에 특수문자를 포함해야 합니다'
    if (form.password !== form.passwordConfirm) return '비밀번호가 일치하지 않습니다'
    if (!form.nickname || form.nickname.length < 2) return '닉네임을 2자 이상 입력하세요'
    if (nickStatus === 'taken') return '이미 사용중인 닉네임입니다'
    if (!form.name) return '이름을 입력하세요'
    if (!form.privacy_agreed) return '개인정보 수집에 동의해주세요'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)
    try {
      const res = await register(form)
      const token = res.data.access_token
      localStorage.setItem('token', token)
      const userRes = await getMe()
      loginUser(token, userRes.data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || '회원가입에 실패했습니다')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      <div className="card p-5 sm:p-7">
        <h1 className="text-xl font-black text-white mb-1">회원가입</h1>
        <p className="text-gray-500 text-xs mb-5">스포츠스포AI에 가입하고 AI 예측을 시작하세요</p>

        {error && (
          <div className="bg-accent-red/10 border border-accent-red/30 text-accent-red px-3 py-2 rounded-xl mb-4 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="아이디" sub="영문+숫자 6자 이상">
            <input type="text" value={form.email} onChange={set('email')}
              className="input-field text-sm" placeholder="영문, 숫자 조합" required />
          </Field>

          <Field label="비밀번호" sub="영문+숫자+특수문자 8자 이상">
            <input type="password" value={form.password} onChange={set('password')}
              className="input-field text-sm" placeholder="비밀번호" required />
          </Field>

          <Field label="비밀번호 확인">
            <input type="password" value={form.passwordConfirm} onChange={set('passwordConfirm')}
              className="input-field text-sm" placeholder="비밀번호 재입력" required />
          </Field>

          <Field label="닉네임" sub="커뮤니티에서 사용됩니다">
            <div className="flex gap-2">
              <input type="text" value={form.nickname} onChange={e => { set('nickname')(e); setNickStatus(null) }}
                className="input-field text-sm flex-1" placeholder="닉네임" required />
              <button type="button" onClick={checkNick} className="btn-secondary text-xs py-2 px-3 shrink-0">
                중복확인
              </button>
            </div>
            {nickStatus === 'available' && <span className="text-[10px] text-accent-green mt-1 block">사용 가능한 닉네임입니다</span>}
            {nickStatus === 'taken' && <span className="text-[10px] text-accent-red mt-1 block">이미 사용중인 닉네임입니다</span>}
          </Field>

          <Field label="이름">
            <input type="text" value={form.name} onChange={set('name')}
              className="input-field text-sm" placeholder="실명" required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="전화번호">
              <input type="tel" value={form.phone} onChange={set('phone')}
                className="input-field text-sm" placeholder="010-0000-0000" />
            </Field>
            <Field label="생년월일">
              <input type="date" value={form.birthday} onChange={set('birthday')}
                className="input-field text-sm" />
            </Field>
          </div>

          {/* 개인정보 동의 */}
          <div className="bg-dark-700/50 rounded-xl p-3 mt-2">
            <div className="text-[10px] text-gray-500 mb-2 max-h-20 overflow-y-auto scrollbar-hide">
              스포츠스포AI는 서비스 제공을 위해 아이디, 닉네임, 이름, 이메일, 전화번호, 생년월일을 수집합니다.
              수집된 정보는 서비스 운영 및 고객 지원 목적으로만 사용되며, 회원 탈퇴 시 즉시 파기됩니다.
              개인정보는 제3자에게 제공되지 않습니다.
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.privacy_agreed} onChange={set('privacy_agreed')}
                className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-accent-blue focus:ring-accent-blue/50" />
              <span className="text-xs text-gray-300 font-medium">개인정보 수집 및 이용에 동의합니다 (필수)</span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-50">
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-accent-blue hover:text-blue-400">로그인</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, sub, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-300 mb-1">
        {label}
        {sub && <span className="text-gray-600 font-normal ml-1">({sub})</span>}
      </label>
      {children}
    </div>
  )
}
