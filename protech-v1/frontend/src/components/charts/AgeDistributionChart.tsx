'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface AgeDistributionChartProps {
  data: { group: string; male: number; female: number }[];
}

export default function AgeDistributionChart({ data }: AgeDistributionChartProps) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-1">연령대별 인구 분포</h3>
      <p className="text-xs text-gray-500 mb-4">성별 분포</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="group" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${formatNumber(value)}명`,
                name === 'male' ? '남성' : '여성',
              ]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Legend formatter={(value) => (value === 'male' ? '남성' : '여성')} />
            <Bar dataKey="male" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            <Bar dataKey="female" fill="#f472b6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
