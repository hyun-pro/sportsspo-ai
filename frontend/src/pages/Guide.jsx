export default function Guide() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-black text-white">이용 가이드</h1>
        <p className="text-xs text-gray-500 mt-0.5">스포츠스포AI 사용법과 분석 지표 설명</p>
      </div>

      <Section title="서비스 소개" icon="🏟️">
        <p>스포츠스포AI는 MLB, KBO, NPB 야구 경기를 AI로 분석하여 승부 예측을 제공합니다.</p>
        <p>ELO 레이팅, 투수 매치업, 최근 폼, 홈어드밴티지 등 7가지 핵심 지표를 종합하여 승률을 계산합니다.</p>
      </Section>

      <Section title="분석 지표 설명" icon="📊">
        <Metric name="ELO 레이팅" desc="체스에서 유래한 팀 실력 수치. 1500 기준, 높을수록 강팀." />
        <Metric name="투수 매치업" desc="선발투수의 ERA, WHIP, 탈삼진률, 최근 컨디션을 종합 비교." />
        <Metric name="팀 폼" desc="최근 5경기 승률, 연승/연패 모멘텀, 득점력, 실점 억제력 반영." />
        <Metric name="홈어드밴티지" desc="리그별 홈 승률 차이 반영. KBO(56%), NPB(54%), MLB(53%)." />
        <Metric name="신뢰도" desc="예측의 확신도. 70%+는 강력 추천, 40% 미만은 불확실한 경기." />
        <Metric name="불펜 소모도" desc="선발투수 이닝 기반으로 불펜 피로도를 추정." />
      </Section>

      <Section title="요금제 안내" icon="💎">
        <div className="space-y-2">
          <PlanRow plan="무료" badge="" features="하루 1개 예측, 기본 경기 정보" />
          <PlanRow plan="PRO" badge="bg-accent-blue" features="무제한 예측, 전체 리그, 투수 분석, 신뢰도" price="월 29,900원" />
          <PlanRow plan="PREMIUM" badge="bg-accent-purple" features="PRO + 실시간 인게임 예측, VIP 뱃지" price="월 59,900원" />
          <PlanRow plan="연간" badge="bg-accent-green" features="PREMIUM 전체 기능, 12개월" price="490,000원/년" />
        </div>
      </Section>

      <Section title="베팅 기록 작성법" icon="📝">
        <p>커뮤니티에서 글 작성 시 <strong>'베팅 기록 추가'</strong> 버튼을 누르면 다음을 기입할 수 있습니다:</p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-gray-400">
          <li>리그 / 경기 (예: KBO, 삼성 vs 기아)</li>
          <li>배당률 (배트맨 공식 배당 기준)</li>
          <li>베팅 금액 / 수익 금액</li>
          <li>결과 (적중 / 미적중 / 진행중)</li>
        </ul>
      </Section>

      <Section title="자주 묻는 질문" icon="❓">
        <Faq q="적중률은 어떻게 되나요?" a="MLB 기준 평균 65~70%. 신뢰도 70%+ 경기는 더 높습니다." />
        <Faq q="데이터는 얼마나 자주 업데이트되나요?" a="경기 데이터는 30분마다, 라이브 스코어는 2분마다 갱신됩니다." />
        <Faq q="배당률은 어디서 가져오나요?" a="공식 배당은 betman.co.kr(배트맨)을 참고해주세요. 현재 자동 연동은 준비 중입니다." />
        <Faq q="환불이 가능한가요?" a="결제 후 7일 이내 환불 요청이 가능합니다." />
      </Section>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="card p-4 sm:p-5">
      <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
        <span>{icon}</span>{title}
      </h2>
      <div className="text-sm text-gray-400 space-y-2">{children}</div>
    </div>
  )
}

function Metric({ name, desc }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-dark-700/50">
      <span className="text-xs font-bold text-accent-blue w-24 shrink-0">{name}</span>
      <span className="text-xs text-gray-400">{desc}</span>
    </div>
  )
}

function PlanRow({ plan, badge, features, price }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-dark-700/50">
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${badge || 'bg-dark-600'} w-16 text-center`}>{plan}</span>
      <span className="text-xs text-gray-400 flex-1">{features}</span>
      {price && <span className="text-xs font-bold text-white shrink-0">{price}</span>}
    </div>
  )
}

function Faq({ q, a }) {
  return (
    <div className="py-2 border-b border-dark-700/50">
      <div className="text-xs font-bold text-gray-200">{q}</div>
      <div className="text-xs text-gray-500 mt-1">{a}</div>
    </div>
  )
}
