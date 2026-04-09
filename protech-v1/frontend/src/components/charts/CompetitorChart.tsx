'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CompetitorChartProps {
  data: {
    total: number;
    byCategory: { name: string; count: number }[];
    openRate: number;
    closeRate: number;
  };
}

export default function CompetitorChart({ data }: CompetitorChartProps) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-1">경쟁업체 현황</h3>
      <p className="text-xs text-gray-500 mb-4">반경 500m 내 업종별 업체 수</p>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.byCategory} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
            <Tooltip
              formatter={(value: number) => [`${value}개`, '업체 수']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Open/Close rates */}
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{data.openRate}%</p>
            <p className="text-xs text-gray-500">개업률 (최근 1년)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">{data.closeRate}%</p>
            <p className="text-xs text-gray-500">폐업률 (최근 1년)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
