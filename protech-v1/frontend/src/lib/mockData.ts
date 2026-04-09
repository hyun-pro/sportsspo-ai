const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function generateMockData() {
  return {
    summary: {
      overallScore: rand(60, 95),
      populationScore: rand(50, 100),
      salesScore: rand(50, 100),
      competitorScore: rand(30, 100),
      growthScore: rand(40, 100),
    },
    population: {
      total: rand(5000, 50000),
      daily: rand(2000, 30000),
      weekday: rand(3000, 25000),
      weekend: rand(1500, 20000),
      byTime: [
        { hour: '06-09', count: rand(500, 3000) },
        { hour: '09-12', count: rand(2000, 8000) },
        { hour: '12-15', count: rand(3000, 10000) },
        { hour: '15-18', count: rand(2500, 9000) },
        { hour: '18-21', count: rand(3000, 12000) },
        { hour: '21-24', count: rand(1000, 5000) },
      ],
      byAge: [
        { group: '10대', male: rand(300, 2000), female: rand(300, 2000) },
        { group: '20대', male: rand(500, 4000), female: rand(600, 4500) },
        { group: '30대', male: rand(800, 5000), female: rand(700, 4500) },
        { group: '40대', male: rand(600, 4000), female: rand(500, 3500) },
        { group: '50대', male: rand(400, 3000), female: rand(300, 2500) },
        { group: '60대+', male: rand(200, 1500), female: rand(200, 1500) },
      ],
    },
    sales: {
      monthlyAvg: rand(20000000, 200000000),
      trend: Array.from({ length: 12 }, (_, i) => ({
        month: `${i + 1}월`,
        amount: rand(15000000, 250000000),
      })),
      byIndustry: [
        { name: '음식점', amount: rand(5000000, 80000000) },
        { name: '카페/음료', amount: rand(3000000, 40000000) },
        { name: '소매/편의점', amount: rand(2000000, 30000000) },
        { name: '미용/건강', amount: rand(1000000, 20000000) },
        { name: '교육/학원', amount: rand(1000000, 15000000) },
        { name: '기타', amount: rand(500000, 10000000) },
      ],
    },
    competitors: {
      total: rand(20, 200),
      byCategory: [
        { name: '음식점', count: rand(5, 50) },
        { name: '카페', count: rand(3, 30) },
        { name: '편의점', count: rand(2, 10) },
        { name: '미용실', count: rand(2, 15) },
        { name: '학원', count: rand(1, 10) },
        { name: '병원/약국', count: rand(2, 12) },
      ],
      openRate: rand(5, 20),
      closeRate: rand(3, 15),
    },
    demographics: {
      residents: rand(3000, 30000),
      workers: rand(2000, 25000),
      households: rand(1000, 15000),
      avgIncome: rand(25000000, 60000000),
    },
  };
}
