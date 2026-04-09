import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  jwtExpiry: '1h',
  jwtRefreshExpiry: '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  // Plan limits
  planLimits: {
    FREE: { maxAnalysis: 5, features: ['basic_search', 'basic_charts'] },
    BASIC: { maxAnalysis: 50, features: ['basic_search', 'basic_charts', 'export_pdf', 'favorites'] },
    PRO: { maxAnalysis: 500, features: ['basic_search', 'basic_charts', 'export_pdf', 'favorites', 'advanced_charts', 'competitor_analysis', 'heatmap'] },
    ENTERPRISE: { maxAnalysis: -1, features: ['all'] }, // -1 = unlimited
  },
};
