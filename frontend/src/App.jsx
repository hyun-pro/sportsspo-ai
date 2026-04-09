import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import GameDetail from './pages/GameDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Subscription from './pages/Subscription'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Dashboard from './pages/Dashboard'
import LivePage from './pages/LivePage'
import Community from './pages/Community'
import PostDetail from './pages/PostDetail'
import Guide from './pages/Guide'
import Notifications from './pages/Notifications'
import Rankings from './pages/Rankings'
import Stats from './pages/Stats'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue"></div></div>
  if (!user) return <Navigate to="/login" />
  if (adminOnly && !user.is_admin) return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/games" element={<Home />} />
        <Route path="/game/:id" element={<GameDetail />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/:id" element={<PostDetail />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </Layout>
  )
}
