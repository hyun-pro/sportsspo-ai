'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface SalesChartProps {
  data: {
    trend: { month: string; amount: number }[];
    byIndustry: { name: string; amount: number }[];
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export default function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-1">월별 매출 추이</h3>
      <p className="text-xs text-gray-500 mb-4">최근 12개월</p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), '매출']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Industry breakdown */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium mb-3">업종별 매출 비중</h4>
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byIndustry} dataKey="amount" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                  {data.byIndustry.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2">
            {data.byIndustry.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-gray-600">{item.name}</span>
                <span className="ml-auto font-medium">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
