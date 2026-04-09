import { Router } from 'express';
import { body } from 'express-validator';
import * as analysisController from '../controllers/analysisController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', analysisController.getAnalyses);
router.get('/:id', analysisController.getAnalysis);
router.post(
  '/',
  [
    body('address').notEmpty().withMessage('주소를 입력해주세요.'),
    body('lat').isFloat().withMessage('유효한 위도를 입력해주세요.'),
    body('lng').isFloat().withMessage('유효한 경도를 입력해주세요.'),
  ],
  analysisController.createAnalysis
);
router.delete('/:id', analysisController.deleteAnalysis);

export default router;
