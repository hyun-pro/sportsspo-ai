import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import GameDetail from './pages/GameDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Subscription from './pages/Subscription'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Dashboard from './pages/Dashboard'
import LivePage from './pages/LivePage'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><Spinner /></div>
  if (!user) return <Navigate to="/login" />
  if (adminOnly && !user.is_admin) return <Navigate to="/" />
  return children
}

function Spinner() {
  return (
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-blue"></div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/games" element={<Home />} />
          <Route path="/game/:id" element={<GameDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><UserDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  )
}
