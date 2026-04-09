import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { Response, NextFunction } from 'express';

const router = Router();
router.use(authenticate, requireAdmin);

// Dashboard stats
router.get('/stats', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalAnalyses, subscriptionStats] = await Promise.all([
      prisma.user.count(),
      prisma.analysis.count(),
      prisma.subscription.groupBy({
        by: ['plan'],
        _count: { plan: true },
      }),
    ]);

    res.json({
      success: true,
      data: { totalUsers, totalAnalyses, subscriptionStats },
    });
  } catch (error) {
    next(error);
  }
});

// List users
router.get('/users', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true, email: true, name: true, role: true, createdAt: true,
          subscription: { select: { plan: true, status: true, analysisCount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    res.json({ success: true, data: users, pagination: { page, limit, total } });
  } catch (error) {
    next(error);
  }
});

// Update user role
router.patch('/users/:id/role', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
