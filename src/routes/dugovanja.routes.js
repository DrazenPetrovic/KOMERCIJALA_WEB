import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as DugovanjaController from '../controllers/dugovanja.controller.js';

const router = Router();
router.get('/', verifyToken, DugovanjaController.getDugovanja);

export default router;
