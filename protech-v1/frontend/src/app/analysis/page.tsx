'use client';

import { useState, useCallback } from 'react';
import { Search, MapPin, TrendingUp, Users, Store, BarChart3 } from 'lucide-react';
import { analysisAPI } from '@/lib/api';
import { formatNumber, formatCurrency } from '@/lib/utils';
import PopulationChart from '@/components/charts/PopulationChart';
import SalesChart from '@/components/charts/SalesChart';
import CompetitorChart from '@/components/charts/CompetitorChart';
import AgeDistributionChart from '@/components/charts/AgeDistributionChart';
import ScoreGauge from '@/components/charts/ScoreGauge';
import toast from 'react-hot-toast';

// Sample locations for demo
const sampleLocations = [
  { name: '강남역', address: '서울 강남구 강남대로 396', lat: 37.4979, lng: 127.0276 },
  { name: '홍대입구역', address: '서울 마포구 양화로 160', lat: 37.5563, lng: 126.9236 },
  { name: '판교역', address: '경기 성남시 분당구 판교역로 235', lat: 37.3947, lng: 127.1112 },
  { name: '부산 서면', address: '부산 부산진구 중앙대로 680', lat: 35.1579, lng: 129.0593 },
  { name: '대구 동성로', address: '대구 중구 동성로 50', lat: 35.8690, lng: 128.5966 },
];

export default function AnalysisPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<typeof sampleLocations[0] | null>(null);

  const runAnalysis = useCallback(async (location: typeof sampleLocations[0]) => {
    setLoading(true);
    setSelectedLocation(location);
    try {
      const { data } = await analysisAPI.create({
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        title: `${location.name} 상권분석`,
      });
      setAnalysisData(data.data.data);
    } catch {
      // Use mock data for demo
      const { generateMockData } = await import('@/lib/mockData');
      setAnalysisData(generateMockData());
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const found = sampleLocations.find(
      (l) => l.name.includes(searchQuery) || l.address.includes(searchQuery)
    );
    if (found) {
      runAnalysis(found);
    } else {
      // Default to first location with the searched name
      runAnalysis({
        name: searchQuery,
        address: searchQuery,
        lat: 37.5665 + (Math.random() - 0.5) * 0.1,
        lng: 126.978 + (Math.random() - 0.5) * 0.1,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">상권분석</h1>
        <p className="text-gray-500 text-sm mt-1">지역을 선택하여 상세 상권 데이터를 확인하세요</p>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="지역명 또는 주소를 입력하세요 (예: 강남역, 홍대입구역)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="btn-primary" disabled={loading}>
            {loading ? '분석 중...' : '분석하기'}
          </button>
        </div>

        {/* Quick select */}
        <div className="flex flex-wrap gap-2 mt-3">
          {sampleLocations.map((loc) => (
            <button
              key={loc.name}
              onClick={() => {
                setSearchQuery(loc.name);
                runAnalysis(loc);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-xs transition-colors"
            >
              <MapPin className="w-3 h-3" /> {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map placeholder */}
      <div className="card overflow-hidden">
        <div className="h-[300px] bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative">
          {selectedLocation ? (
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary-600 mx-auto mb-2" />
              <p className="font-semibold">{selectedLocation.name}</p>
              <p className="text-sm text-gray-500">{selectedLocation.address}</p>
              <p className="text-xs text-gray-400 mt-1">
                위도: {selectedLocation.lat.toFixed(4)}, 경도: {selectedLocation.lng.toFixed(4)}
              </p>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <MapPin className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm">지역을 검색하면 지도가 표시됩니다</p>
              <p className="text-xs mt-1">카카오맵 API 키 설정 후 실제 지도가 표시됩니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {loading && (
        <div className="card p-12 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-500">상권 데이터를 분석하고 있습니다...</p>
        </div>
      )}

      {analysisData && !loading && (
        <>
          {/* Score Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <ScoreGauge label="종합점수" score={analysisData.summary.overallScore} color="primary" />
            <ScoreGauge label="유동인구" score={analysisData.summary.populationScore} color="blue" />
            <ScoreGauge label="매출지표" score={analysisData.summary.salesScore} color="green" />
            <ScoreGauge label="경쟁환경" score={analysisData.summary.competitorScore} color="orange" />
            <ScoreGauge label="성장성" score={analysisData.summary.growthScore} color="purple" />
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Users className="w-4 h-4" /> 일일 유동인구
              </div>
              <p className="text-xl font-bold">{formatNumber(analysisData.population.daily)}명</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <TrendingUp className="w-4 h-4" /> 월 평균 매출
              </div>
              <p className="text-xl font-bold">{formatCurrency(analysisData.sales.monthlyAvg)}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Store className="w-4 h-4" /> 주변 업체 수
              </div>
              <p className="text-xl font-bold">{formatNumber(analysisData.competitors.total)}개</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <BarChart3 className="w-4 h-4" /> 주거 인구
              </div>
              <p className="text-xl font-bold">{formatNumber(analysisData.demographics.residents)}명</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <PopulationChart data={analysisData.population} />
            <AgeDistributionChart data={analysisData.population.byAge} />
            <SalesChart data={analysisData.sales} />
            <CompetitorChart data={analysisData.competitors} />
          </div>
        </>
      )}
    </div>
  );
}
