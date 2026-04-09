'use client';

import { useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { subscriptionAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'FREE',
    name: 'Free',
    nameKo: '무료',
    price: 0,
    features: ['월 5회 분석', '기본 차트', '기본 검색'],
  },
  {
    id: 'BASIC',
    name: 'Basic',
    nameKo: '베이직',
    price: 49000,
    features: ['월 50회 분석', '기본 차트', 'PDF 보고서', '즐겨찾기 기능', '이메일 지원'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    nameKo: '프로',
    price: 149000,
    features: ['월 500회 분석', '고급 차트 & 히트맵', 'PDF 보고서', '경쟁업체 심층 분석', '우선 지원', 'API 접근'],
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    nameKo: '엔터프라이즈',
    price: -1,
    features: ['무제한 분석', '모든 Pro 기능', '전담 매니저', '맞춤 데이터 연동', 'SLA 보장'],
  },
];

export default function SubscriptionPage() {
  const { user, setUser } = useAuthStore();
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const currentPlan = user?.subscription?.plan || 'FREE';

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;
    if (planId === 'ENTERPRISE') {
      toast('엔터프라이즈 플랜은 별도 문의가 필요합니다.');
      return;
    }
    setUpgrading(planId);
    try {
      await subscriptionAPI.upgrade(planId);
      // Refresh user data
      const { authAPI } = await import('@/lib/api');
      const { data } = await authAPI.getMe();
      setUser(data.data);
      toast.success(`${planId} 플랜으로 변경되었습니다!`);
    } catch {
      toast.error('플랜 변경에 실패했습니다.');
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">구독 관리</h1>
        <p className="text-gray-500 text-sm mt-1">현재 플랜: <span className="font-semibold text-primary-600">{currentPlan}</span></p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={cn(
                'card p-6 relative',
                plan.popular && 'border-primary-600 border-2',
                isCurrent && 'ring-2 ring-primary-500 ring-offset-2'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" /> 인기
                </div>
              )}
              <h3 className="font-bold text-lg">{plan.name}</h3>
              <p className="text-xs text-gray-500">{plan.nameKo}</p>
              <div className="mt-4 mb-6">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold">무료</span>
                ) : plan.price === -1 ? (
                  <span className="text-3xl font-bold">맞춤</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold">{plan.price.toLocaleString()}</span>
                    <span className="text-gray-500 text-sm">원/월</span>
                  </>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || upgrading === plan.id}
                className={cn(
                  'w-full py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'btn-primary'
                )}
              >
                {isCurrent ? '현재 플랜' : upgrading === plan.id ? '변경 중...' : '선택하기'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
