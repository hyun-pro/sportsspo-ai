import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPost, createComment, updateComment, deleteComment, deletePost } from '../services/api'
import { useAuth } from '../context/AuthContext'
import UserBadge from '../components/UserBadge'

export default function PostDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)

  const fetch = () => {
    getPost(id).then(res => { setPost(res.data.post); setComments(res.data.comments) })
      .catch(() => navigate('/community'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetch() }, [id])

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    await createComment(id, { content: newComment })
    setNewComment('')
    fetch()
  }

  const handleEdit = async (commentId) => {
    await updateComment(commentId, { content: editContent })
    setEditingId(null)
    fetch()
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    await deleteComment(commentId)
    fetch()
  }

  const handleDeletePost = async () => {
    if (!confirm('글을 삭제하시겠습니까?')) return
    await deletePost(id)
    navigate('/community')
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-accent-blue"></div></div>
  if (!post) return null

  const isAuthor = user?.id === post.user_id
  const isAdmin = user?.is_admin
  const fmtDate = (d) => new Date(d).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <button onClick={() => navigate('/community')} className="text-xs text-gray-500 hover:text-white flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        목록으로
      </button>

      {/* 글 */}
      <div className="card p-5">
        <h1 className="text-lg font-bold text-white">{post.title}</h1>
        <div className="flex items-center justify-between mt-2 pb-3 border-b border-dark-700">
          <UserBadge nickname={post.nickname} plan={post.plan} />
          <span className="text-[10px] text-gray-600">{fmtDate(post.created_at)}</span>
        </div>

        {post.bet_odds && (
          <div className="flex items-center gap-2 mt-3 p-2.5 bg-dark-700/50 rounded-lg flex-wrap">
            {post.game_league && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-accent-blue/10 text-accent-blue rounded">{post.game_league}</span>}
            {post.game_teams && <span className="text-xs text-gray-300">{post.game_teams}</span>}
            <span className="text-[10px] text-gray-500">배당 {post.bet_odds}</span>
            {post.bet_amount && <span className="text-[10px] text-gray-500">{post.bet_amount.toLocaleString()}원 베팅</span>}
            {post.bet_profit && <span className="text-[10px] text-accent-green font-bold">+{post.bet_profit.toLocaleString()}원</span>}
            {post.bet_result === 'win' && <span className="text-[9px] font-bold text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded">적중</span>}
            {post.bet_result === 'lose' && <span className="text-[9px] font-bold text-accent-red bg-accent-red/10 px-1.5 py-0.5 rounded">미적중</span>}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{post.content}</div>

        {(isAuthor || isAdmin) && (
          <div className="mt-4 pt-3 border-t border-dark-700 flex justify-end">
            <button onClick={handleDeletePost} className="text-[10px] text-gray-600 hover:text-accent-red">삭제</button>
          </div>
        )}
      </div>

      {/* 댓글 */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-dark-600">
          <span className="section-title">댓글 {comments.length}</span>
        </div>

        <div className="divide-y divide-dark-700/50">
          {comments.map(c => (
            <div key={c.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <UserBadge nickname={c.nickname} plan={c.plan} />
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-600">{fmtDate(c.created_at)}</span>
                  {c.updated_at !== c.created_at && <span className="text-[8px] text-gray-700">(수정됨)</span>}
                </div>
              </div>

              {editingId === c.id ? (
                <div className="flex gap-2 mt-1">
                  <input value={editContent} onChange={e => setEditContent(e.target.value)} className="input-field text-xs py-1.5 flex-1" />
                  <button onClick={() => handleEdit(c.id)} className="text-xs text-accent-blue">저장</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-gray-500">취소</button>
                </div>
              ) : (
                <p className="text-sm text-gray-300">{c.content}</p>
              )}

              {user?.id === c.user_id && editingId !== c.id && (
                <div className="flex gap-2 mt-1">
                  <button onClick={() => { setEditingId(c.id); setEditContent(c.content) }} className="text-[10px] text-gray-600 hover:text-white">수정</button>
                  <button onClick={() => handleDeleteComment(c.id)} className="text-[10px] text-gray-600 hover:text-accent-red">삭제</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {user ? (
          <form onSubmit={handleComment} className="p-3 border-t border-dark-600 flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)}
              className="input-field text-xs py-2 flex-1" placeholder="댓글을 입력하세요" />
            <button type="submit" className="btn-primary text-xs py-2 px-4 shrink-0">등록</button>
          </form>
        ) : (
          <div className="p-4 text-center text-xs text-gray-600">로그인 후 댓글을 작성할 수 있습니다</div>
        )}
      </div>
    </div>
  )
}
