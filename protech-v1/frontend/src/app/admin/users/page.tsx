'use client';

import { useState, useEffect } from 'react';
import { Users, BarChart3, CreditCard, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  subscription?: { plan: string; status: string; analysisCount: number };
}

interface Stats {
  totalUsers: number;
  totalAnalyses: number;
  subscriptionStats: { plan: string; _count: { plan: number } }[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(page),
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setTotalPages(Math.ceil((usersRes.data.pagination?.total || 1) / 20));
    } catch {
      // Demo data
      setStats({ totalUsers: 1234, totalAnalyses: 5678, subscriptionStats: [
        { plan: 'FREE', _count: { plan: 800 } },
        { plan: 'BASIC', _count: { plan: 300 } },
        { plan: 'PRO', _count: { plan: 120 } },
        { plan: 'ENTERPRISE', _count: { plan: 14 } },
      ]});
      setUsers([
        { id: '1', email: 'user1@test.com', name: '김철수', role: 'USER', createdAt: '2024-03-01', subscription: { plan: 'PRO', status: 'ACTIVE', analysisCount: 45 } },
        { id: '2', email: 'user2@test.com', name: '이영희', role: 'USER', createdAt: '2024-03-05', subscription: { plan: 'BASIC', status: 'ACTIVE', analysisCount: 12 } },
        { id: '3', email: 'admin@protech.com', name: '관리자', role: 'ADMIN', createdAt: '2024-01-01', subscription: { plan: 'ENTERPRISE', status: 'ACTIVE', analysisCount: 200 } },
      ]);
    }
  };

  const statCards = [
    { label: '전체 사용자', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: '전체 분석 수', value: stats?.totalAnalyses || 0, icon: BarChart3, color: 'bg-green-50 text-green-600' },
    { label: '유료 구독자', value: stats?.subscriptionStats?.filter(s => s.plan !== 'FREE').reduce((sum, s) => sum + s._count.plan, 0) || 0, icon: CreditCard, color: 'bg-purple-50 text-purple-600' },
    { label: '무료 사용자', value: stats?.subscriptionStats?.find(s => s.plan === 'FREE')?._count.plan || 0, icon: Activity, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">서비스 현황을 한눈에 확인합니다</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      {stats?.subscriptionStats && (
        <div className="card p-6">
          <h2 className="font-semibold mb-4">플랜별 사용자 분포</h2>
          <div className="flex items-center gap-2 h-8 rounded-lg overflow-hidden">
            {stats.subscriptionStats.map((s) => {
              const total = stats.subscriptionStats.reduce((sum, x) => sum + x._count.plan, 0);
              const pct = (s._count.plan / total) * 100;
              const colors: Record<string, string> = {
                FREE: 'bg-gray-300', BASIC: 'bg-blue-400', PRO: 'bg-primary-500', ENTERPRISE: 'bg-purple-500',
              };
              return (
                <div
                  key={s.plan}
                  className={`${colors[s.plan] || 'bg-gray-200'} h-full flex items-center justify-center text-white text-xs font-medium`}
                  style={{ width: `${Math.max(pct, 5)}%` }}
                  title={`${s.plan}: ${s._count.plan}명`}
                >
                  {pct > 10 && `${s.plan}`}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3">
            {stats.subscriptionStats.map((s) => (
              <span key={s.plan} className="text-xs text-gray-500">
                {s.plan}: {formatNumber(s._count.plan)}명
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">사용자 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">사용자</th>
                <th className="text-left px-4 py-3 font-medium">역할</th>
                <th className="text-left px-4 py-3 font-medium">플랜</th>
                <th className="text-left px-4 py-3 font-medium">분석 수</th>
                <th className="text-left px-4 py-3 font-medium">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'ADMIN' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                      {u.subscription?.plan || 'FREE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.subscription?.analysisCount || 0}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">페이지 {page} / {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
