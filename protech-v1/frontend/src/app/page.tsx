'use client';

import Link from 'next/link';
import {
  BarChart3, MapPin, TrendingUp, Users, FileText, Shield,
  ChevronRight, Check, Star, Menu, X
} from 'lucide-react';
import { useState } from 'react';

// --- Header ---
function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PROTECH</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition">기능</a>
            <a href="#usecases" className="text-sm text-gray-600 hover:text-gray-900 transition">활용사례</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition">요금제</a>
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition">로그인</Link>
            <Link href="/auth/signup" className="btn-primary text-sm !py-2 !px-4">무료 시작하기</Link>
          </nav>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <a href="#features" className="block text-gray-600 py-2" onClick={() => setMobileOpen(false)}>기능</a>
          <a href="#usecases" className="block text-gray-600 py-2" onClick={() => setMobileOpen(false)}>활용사례</a>
          <a href="#pricing" className="block text-gray-600 py-2" onClick={() => setMobileOpen(false)}>요금제</a>
          <Link href="/auth/login" className="block text-gray-600 py-2">로그인</Link>
          <Link href="/auth/signup" className="btn-primary w-full text-center">무료 시작하기</Link>
        </div>
      )}
    </header>
  );
}

// --- Hero ---
function Hero() {
  return (
    <section className="pt-32 pb-20 bg-gradient-to-b from-primary-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
          <Star className="w-4 h-4" /> 데이터 기반 상권분석 플랫폼
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
          상권분석의 모든 것,
          <br />
          <span className="text-primary-600">PROTECH</span>에서 한눈에
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
          유동인구, 매출 추이, 경쟁업체 분석까지.
          <br className="hidden sm:block" />
          데이터로 확인하는 최적의 입지를 찾아보세요.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup" className="btn-primary text-base px-8 py-4">
            무료로 시작하기 <ChevronRight className="w-5 h-5 ml-1" />
          </Link>
          <a href="#features" className="btn-outline text-base px-8 py-4">
            기능 살펴보기
          </a>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 space-y-3">
                  <div className="h-8 bg-primary-100 rounded-lg" />
                  <div className="h-6 bg-gray-100 rounded" />
                  <div className="h-6 bg-gray-100 rounded" />
                  <div className="h-6 bg-gray-100 rounded" />
                  <div className="h-6 bg-primary-50 rounded" />
                </div>
                <div className="col-span-3 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-20 bg-primary-50 rounded-lg border border-primary-100" />
                    <div className="h-20 bg-green-50 rounded-lg border border-green-100" />
                    <div className="h-20 bg-orange-50 rounded-lg border border-orange-100" />
                  </div>
                  <div className="h-48 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-primary-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -inset-4 bg-primary-600/5 rounded-2xl -z-10 blur-xl" />
        </div>
      </div>
    </section>
  );
}

// --- Features ---
const features = [
  {
    icon: MapPin,
    title: '지도 기반 분석',
    desc: '카카오맵 기반 인터랙티브 지도에서 원하는 지역을 클릭하면 즉시 상권 데이터를 확인합니다.',
  },
  {
    icon: Users,
    title: '유동인구 분석',
    desc: '시간대별, 연령대별 유동인구 데이터를 시각화하여 최적의 영업시간과 타겟 고객을 파악합니다.',
  },
  {
    icon: TrendingUp,
    title: '매출 추이 분석',
    desc: '월별 매출 추이와 업종별 매출 비중을 차트로 확인하고 성장 가능성을 예측합니다.',
  },
  {
    icon: BarChart3,
    title: '경쟁업체 분석',
    desc: '반경 내 업종별 경쟁업체 수와 개폐업률을 분석하여 시장 포화도를 판단합니다.',
  },
  {
    icon: FileText,
    title: 'PDF 보고서',
    desc: '분석 결과를 전문 보고서로 자동 생성하고 PDF로 다운로드하여 활용합니다.',
  },
  {
    icon: Shield,
    title: '데이터 신뢰성',
    desc: '공공데이터와 검증된 소스를 기반으로 정확하고 신뢰할 수 있는 분석 결과를 제공합니다.',
  },
];

function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-title">강력한 상권분석 기능</h2>
          <p className="section-subtitle">데이터 기반의 정확한 분석으로 최적의 의사결정을 도와드립니다</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                <f.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Use Cases ---
const useCases = [
  {
    title: '예비 창업자',
    desc: '어디에 가게를 열어야 할지 고민이라면? 데이터로 확인하는 최적의 입지 분석',
    items: ['상권 유동인구 확인', '업종별 경쟁 현황', '예상 매출 시뮬레이션'],
  },
  {
    title: '자영업자',
    desc: '현재 매장의 상권 변화를 모니터링하고 영업 전략을 수립하세요',
    items: ['상권 트렌드 추적', '경쟁업체 모니터링', '시간대별 고객 분석'],
  },
  {
    title: '프랜차이즈',
    desc: '전국 단위 입지 분석으로 신규 매장 출점 전략을 수립하세요',
    items: ['다중 지역 비교 분석', '대량 보고서 생성', '맞춤형 데이터 제공'],
  },
];

function UseCases() {
  return (
    <section id="usecases" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-title">이런 분들께 추천합니다</h2>
          <p className="section-subtitle">다양한 비즈니스 목적에 맞는 상권분석 솔루션</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((uc) => (
            <div key={uc.title} className="card p-8 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold mb-3">{uc.title}</h3>
              <p className="text-gray-500 text-sm mb-6">{uc.desc}</p>
              <ul className="space-y-3">
                {uc.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Pricing ---
const plans = [
  {
    name: 'Basic',
    nameKo: '베이직',
    price: '49,000',
    period: '/월',
    desc: '소규모 사업자를 위한 기본 플랜',
    features: ['월 50회 분석', '기본 차트', 'PDF 보고서', '즐겨찾기 기능', '이메일 지원'],
    cta: '시작하기',
    popular: false,
  },
  {
    name: 'Pro',
    nameKo: '프로',
    price: '149,000',
    period: '/월',
    desc: '전문적인 분석이 필요한 사업자',
    features: ['월 500회 분석', '고급 차트 & 히트맵', 'PDF 보고서', '경쟁업체 심층 분석', '우선 지원', 'API 접근'],
    cta: '시작하기',
    popular: true,
  },
  {
    name: 'Enterprise',
    nameKo: '엔터프라이즈',
    price: '맞춤',
    period: '',
    desc: '프랜차이즈 및 대규모 기업',
    features: ['무제한 분석', '모든 Pro 기능', '전담 매니저', '맞춤 데이터 연동', 'SLA 보장', '온프레미스 옵션'],
    cta: '문의하기',
    popular: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-title">합리적인 요금제</h2>
          <p className="section-subtitle">비즈니스 규모에 맞는 플랜을 선택하세요. 무료 체험도 가능합니다.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card p-8 relative ${
                plan.popular ? 'border-primary-600 border-2 shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  인기
                </div>
              )}
              <div className="mb-6">
                <p className="text-sm text-gray-500">{plan.nameKo}</p>
                <h3 className="text-2xl font-bold mt-1">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{plan.desc}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/signup"
                className={`w-full text-center block ${plan.popular ? 'btn-primary' : 'btn-outline'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Testimonials ---
const testimonials = [
  {
    name: '김민수',
    role: '카페 창업자',
    text: '상권분석 데이터 덕분에 유동인구가 많은 최적의 위치를 찾을 수 있었습니다. 오픈 3개월 만에 손익분기점을 달성했어요.',
  },
  {
    name: '이수진',
    role: '프랜차이즈 본사 MD',
    text: '전국 단위로 매장 출점 분석을 할 때 PROTECH가 필수 도구가 되었습니다. 보고서 기능이 특히 유용해요.',
  },
  {
    name: '박준혁',
    role: '부동산 컨설턴트',
    text: '고객에게 상권 데이터를 시각적으로 보여줄 수 있어서 신뢰도가 크게 올랐습니다.',
  },
];

function Testimonials() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="section-title">고객 후기</h2>
          <p className="section-subtitle">PROTECH를 사용하고 계신 분들의 이야기</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="card p-8">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
              <div>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- CTA ---
function CTA() {
  return (
    <section className="py-24 bg-primary-600">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          지금 바로 상권분석을 시작하세요
        </h2>
        <p className="mt-4 text-primary-100 text-lg">
          무료 플랜으로 시작해보세요. 신용카드 없이 바로 이용 가능합니다.
        </p>
        <Link href="/auth/signup" className="mt-8 inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-lg">
          무료로 시작하기 <ChevronRight className="w-5 h-5 ml-1" />
        </Link>
      </div>
    </section>
  );
}

// --- Footer ---
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">PROTECH</span>
            </div>
            <p className="text-sm">
              주식회사 프로브랜드
              <br />
              데이터 기반 상권분석 플랫폼
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">서비스</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition">상권분석</a></li>
              <li><a href="#pricing" className="hover:text-white transition">요금제</a></li>
              <li><a href="#" className="hover:text-white transition">API</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">회사</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">소개</a></li>
              <li><a href="#" className="hover:text-white transition">블로그</a></li>
              <li><a href="#" className="hover:text-white transition">채용</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">고객지원</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition">문의하기</a></li>
              <li><a href="#" className="hover:text-white transition">이용약관</a></li>
              <li><a href="#" className="hover:text-white transition">개인정보처리방침</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
          &copy; {new Date().getFullYear()} 주식회사 프로브랜드. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// --- Main Landing Page ---
export default function LandingPage() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <UseCases />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  );
}
