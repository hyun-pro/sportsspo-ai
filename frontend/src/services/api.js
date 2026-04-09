import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')
export const checkNickname = (nickname) => api.get('/auth/check-nickname', { params: { nickname } })

// Games
export const getGames = (params) => api.get('/games', { params })
export const getGameDetail = (id) => api.get(`/games/${id}`)
export const searchGames = (params) => api.get('/games/search', { params })
export const getPlayByPlay = (id) => api.get(`/games/${id}/playbyplay`)
export const getChat = (id, after) => api.get(`/games/${id}/chat`, { params: { after } })
export const sendChat = (id, message) => api.post(`/games/${id}/chat`, { message })

// Stats
export const getTeamStats = (params) => api.get('/stats/teams', { params })
export const getPitchers = (params) => api.get('/stats/pitchers', { params })

// Live In-Game Prediction
export const getLivePrediction = (gameId, data) => api.post(`/games/${gameId}/live-predict`, data)
export const getStandaloneLivePrediction = (data) => api.post('/live-predict', data)

// Subscription
export const createCheckout = () => api.post('/subscription/create-checkout')
export const getSubscriptionStatus = () => api.get('/subscription/status')
export const cancelSubscription = () => api.post('/subscription/cancel')

// Dashboard
export const getDashboardSummary = () => api.get('/dashboard/summary')
export const getDashboardLive = () => api.get('/dashboard/live')
export const getDashboardToday = (params) => api.get('/dashboard/today', { params })
export const getDashboardTopPicks = () => api.get('/dashboard/top-picks')
export const getDashboardRecentResults = (params) => api.get('/dashboard/recent-results', { params })
export const getLeagueStandings = (league) => api.get('/dashboard/league-standings', { params: { league } })

// Community
export const getPosts = (params) => api.get('/community/posts', { params })
export const getPost = (id) => api.get(`/community/posts/${id}`)
export const createPost = (data) => api.post('/community/posts', data)
export const deletePost = (id) => api.delete(`/community/posts/${id}`)
export const createComment = (postId, data) => api.post(`/community/posts/${postId}/comments`, data)
export const updateComment = (id, data) => api.put(`/community/comments/${id}`, data)
export const deleteComment = (id) => api.delete(`/community/comments/${id}`)

// Notifications
export const getNotifications = () => api.get('/notifications')
export const markAllRead = () => api.put('/notifications/read-all')

// Support (고객센터)
export const createTicket = (data) => api.post('/support/tickets', data)
export const getMyTickets = () => api.get('/support/tickets')
export const getTicket = (id) => api.get(`/support/tickets/${id}`)
export const getAdminTickets = (params) => api.get('/admin/support/tickets', { params })
export const replyTicket = (id, data) => api.put(`/admin/support/tickets/${id}/reply`, data)

// Announcements (공지사항)
export const getAnnouncements = () => api.get('/announcements')
export const createAnnouncement = (data) => api.post('/admin/announcements', data)
export const deleteAnnouncement = (id) => api.delete(`/admin/announcements/${id}`)

// Admin
export const getAdminStats = () => api.get('/admin/stats')
export const getAdminDashboard = () => api.get('/admin/dashboard')
export const getAdminUsers = () => api.get('/admin/users')

export default api
