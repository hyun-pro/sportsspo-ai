'use client';

import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  label: string;
  score: number;
  color: 'primary' | 'blue' | 'green' | 'orange' | 'purple';
}

const colorMap = {
  primary: { bg: 'bg-primary-50', text: 'text-primary-600', bar: 'bg-primary-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500' },
  green: { bg: 'bg-green-50', text: 'text-green-600', bar: 'bg-green-500' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', bar: 'bg-orange-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', bar: 'bg-purple-500' },
};

export default function ScoreGauge({ label, score, color }: ScoreGaugeProps) {
  const c = colorMap[color];
  const grade = score >= 80 ? '우수' : score >= 60 ? '양호' : score >= 40 ? '보통' : '주의';

  return (
    <div className="card p-4 text-center">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className={cn('w-16 h-16 rounded-full mx-auto flex items-center justify-center', c.bg)}>
        <span className={cn('text-xl font-bold', c.text)}>{score}</span>
      </div>
      <div className="mt-3">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-1000', c.bar)}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className={cn('text-xs font-medium mt-1', c.text)}>{grade}</p>
      </div>
    </div>
  );
}
