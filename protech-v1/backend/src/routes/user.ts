import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';

const router = Router();
router.use(authenticate);

// Update profile
router.put('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, phone },
      select: { id: true, email: true, name: true, phone: true },
    });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Get favorites
router.get('/favorites', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: favorites });
  } catch (error) {
    next(error);
  }
});

// Add favorite
router.post('/favorites', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { address, name, lat, lng } = req.body;
    const favorite = await prisma.favorite.create({
      data: { userId: req.user!.id, address, name, lat, lng },
    });
    res.status(201).json({ success: true, data: favorite });
  } catch (error) {
    next(error);
  }
});

// Remove favorite
router.delete('/favorites/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.favorite.deleteMany({
      where: { id: req.params.id, userId: req.user!.id },
    });
    res.json({ success: true, message: '삭제되었습니다.' });
  } catch (error) {
    next(error);
  }
});

export default router;
