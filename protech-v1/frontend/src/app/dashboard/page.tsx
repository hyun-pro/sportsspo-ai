'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, BarChart3, FileText, Star, TrendingUp, Clock, ChevronRight, Search } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { analysisAPI, userAPI } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Analysis {
  id: string;
  title: string;
  address: string;
  createdAt: string;
  data: any;
}

interface Favorite {
  id: string;
  name: string;
  address: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [analysisRes, favRes] = await Promise.all([
        analysisAPI.list(1),
        userAPI.getFavorites(),
      ]);
      setRecentAnalyses(analysisRes.data.data || []);
      setFavorites(favRes.data.data || []);
    } catch {
      // Demo data for when backend is not connected
      setRecentAnalyses([
        { id: '1', title: '강남역 상권분석', address: '서울 강남구 강남대로 396', createdAt: new Date().toISOString(), data: { summary: { overallScore: 87 } } },
        { id: '2', title: '홍대입구역 상권분석', address: '서울 마포구 양화로 160', createdAt: new Date().toISOString(), data: { summary: { overallScore: 82 } } },
        { id: '3', title: '판교역 상권분석', address: '경기 성남시 분당구 판교역로 235', createdAt: new Date().toISOString(), data: { summary: { overallScore: 75 } } },
      ]);
      setFavorites([
        { id: '1', name: '강남역', address: '서울 강남구' },
        { id: '2', name: '역삼동', address: '서울 강남구 역삼동' },
      ]);
    }
  };

  const stats = [
    { label: '총 분석 횟수', value: user?.subscription?.analysisCount || 0, icon: BarChart3, color: 'bg-primary-50 text-primary-600' },
    { label: '남은 분석 횟수', value: (user?.subscription?.maxAnalysis || 5) - (user?.subscription?.analysisCount || 0), icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: '저장된 보고서', value: recentAnalyses.length, icon: FileText, color: 'bg-orange-50 text-orange-600' },
    { label: '즐겨찾기', value: favorites.length, icon: Star, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">안녕하세요, {user?.name || '사용자'}님</h1>
        <p className="text-gray-500 text-sm mt-1">오늘도 데이터로 스마트한 의사결정을 하세요</p>
      </div>

      {/* Quick Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="분석할 지역 또는 주소를 검색하세요..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery) {
                window.location.href = `/analysis?q=${encodeURIComponent(searchQuery)}`;
              }
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value < 0 ? '무제한' : stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Analyses */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" /> 최근 분석 기록
            </h2>
            <Link href="/analysis" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAnalyses.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">아직 분석 기록이 없습니다</p>
                <Link href="/analysis" className="text-primary-600 text-sm mt-1 inline-block">
                  첫 분석 시작하기
                </Link>
              </div>
            ) : (
              recentAnalyses.slice(0, 5).map((analysis) => (
                <Link
                  key={analysis.id}
                  href={`/analysis/${analysis.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{analysis.title}</p>
                      <p className="text-xs text-gray-500">{analysis.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 rounded-full">
                      <span className="text-xs font-semibold text-primary-700">
                        {analysis.data?.summary?.overallScore || '-'}점
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(analysis.createdAt)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Favorites */}
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-gray-400" /> 즐겨찾기 지역
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {favorites.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">즐겨찾기한 지역이 없습니다</p>
              </div>
            ) : (
              favorites.map((fav) => (
                <div key={fav.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{fav.name}</p>
                    <p className="text-xs text-gray-500">{fav.address}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
