import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// List reports
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const reports = await prisma.report.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { analysis: { select: { title: true, address: true } } },
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

// Create report from analysis
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { analysisId, title } = req.body;

    const analysis = await prisma.analysis.findFirst({
      where: { id: analysisId, userId: req.user!.id },
    });
    if (!analysis) throw new AppError('분석 데이터를 찾을 수 없습니다.', 404);

    const report = await prisma.report.create({
      data: {
        userId: req.user!.id,
        analysisId,
        title: title || `${analysis.title} 보고서`,
      },
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// Delete report
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.report.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    });
    res.json({ success: true, message: '삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

export default router;
