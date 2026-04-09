import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { config } from '../config';

const router = Router();
router.use(authenticate);

// Get current subscription
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
    });
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// Upgrade plan (simplified for MVP - in production, integrate Stripe)
router.post('/upgrade', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { plan } = req.body;
    const planLimits: Record<string, number> = {
      FREE: 5,
      BASIC: 50,
      PRO: 500,
      ENTERPRISE: -1,
    };

    const subscription = await prisma.subscription.update({
      where: { userId: req.user!.id },
      data: {
        plan,
        maxAnalysis: planLimits[plan] || 5,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// Get plan features
router.get('/plans', async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: config.planLimits });
});

export default router;
