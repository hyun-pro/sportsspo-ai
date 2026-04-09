// Shared types between frontend and backend

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  subscription?: Subscription;
}

export interface Subscription {
  id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  analysisCount: number;
  maxAnalysis: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

export type PlanType = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING';

export interface Analysis {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  radius: number;
  data: AnalysisData;
  createdAt: string;
}

export interface AnalysisData {
  summary: {
    overallScore: number;
    populationScore: number;
    salesScore: number;
    competitorScore: number;
    growthScore: number;
  };
  population: {
    total: number;
    daily: number;
    weekday: number;
    weekend: number;
    byTime: { hour: string; count: number }[];
    byAge: { group: string; male: number; female: number }[];
  };
  sales: {
    monthlyAvg: number;
    trend: { month: string; amount: number }[];
    byIndustry: { name: string; amount: number }[];
  };
  competitors: {
    total: number;
    byCategory: { name: string; count: number }[];
    openRate: number;
    closeRate: number;
  };
  demographics: {
    residents: number;
    workers: number;
    households: number;
    avgIncome: number;
  };
}

export interface Report {
  id: string;
  title: string;
  analysisId: string;
  fileUrl?: string;
  createdAt: string;
}

export interface Favorite {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
