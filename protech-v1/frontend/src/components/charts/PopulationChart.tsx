'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface PopulationChartProps {
  data: {
    byTime: { hour: string; count: number }[];
    weekday: number;
    weekend: number;
  };
}

export default function PopulationChart({ data }: PopulationChartProps) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-1">시간대별 유동인구</h3>
      <p className="text-xs text-gray-500 mb-4">
        평일 {formatNumber(data.weekday)}명 / 주말 {formatNumber(data.weekend)}명
      </p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.byTime} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number) => [`${formatNumber(value)}명`, '유동인구']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
