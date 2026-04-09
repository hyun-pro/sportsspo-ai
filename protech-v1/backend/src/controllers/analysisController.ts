import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { generateMockAnalysisData } from '../services/analysisService';

export const getAnalyses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.analysis.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({
      success: true,
      data: analyses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalysis = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const analysis = await prisma.analysis.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!analysis) throw new AppError('분석 데이터를 찾을 수 없습니다.', 404);

    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
};

export const createAnalysis = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

    // Check subscription limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user!.id },
    });

    if (subscription && subscription.maxAnalysis > 0 && subscription.analysisCount >= subscription.maxAnalysis) {
      throw new AppError('분석 횟수 한도에 도달했습니다. 플랜을 업그레이드해주세요.', 403);
    }

    const { address, lat, lng, radius, title } = req.body;

    // Generate analysis data (in production, this would call real data APIs)
    const analysisData = generateMockAnalysisData(address, lat, lng);

    const analysis = await prisma.analysis.create({
      data: {
        userId: req.user!.id,
        title: title || `${address} 상권분석`,
        address,
        lat,
        lng,
        radius: radius || 500,
        data: analysisData,
      },
    });

    // Increment analysis count
    if (subscription) {
      await prisma.subscription.update({
        where: { userId: req.user!.id },
        data: { analysisCount: { increment: 1 } },
      });
    }

    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
};

export const deleteAnalysis = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const analysis = await prisma.analysis.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!analysis) throw new AppError('분석 데이터를 찾을 수 없습니다.', 404);

    await prisma.analysis.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: '삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
};
