import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign({ userId, email, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiry,
  });
  const refreshToken = jwt.sign({ userId }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry,
  });
  return { accessToken, refreshToken };
};

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, password, name, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('이미 등록된 이메일입니다.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        subscription: {
          create: { plan: 'FREE', status: 'ACTIVE', maxAnalysis: 5 },
        },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    const tokens = generateTokens(user.id, user.email, user.role);

    res.status(201).json({
      success: true,
      data: { user, ...tokens },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }

    const tokens = generateTokens(user.id, user.email, user.role);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscription: user.subscription,
        },
        ...tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError('Refresh token이 필요합니다.', 400);

    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) throw new AppError('사용자를 찾을 수 없습니다.', 401);

    const tokens = generateTokens(user.id, user.email, user.role);
    res.json({ success: true, data: tokens });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('유효하지 않은 토큰입니다.', 401));
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (user) {
      // TODO: Send password reset email with token
      console.log(`Password reset requested for ${email}`);
    }

    res.json({ success: true, message: '비밀번호 재설정 이메일이 전송되었습니다.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body;

    // TODO: Validate reset token from email
    // For MVP, use JWT token approach
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    next(new AppError('유효하지 않은 토큰입니다.', 400));
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        subscription: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
