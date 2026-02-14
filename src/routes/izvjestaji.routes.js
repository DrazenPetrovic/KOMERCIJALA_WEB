import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as IzvjestajiController from '../controllers/izvjestaji.controller.js';

const router = Router();
router.get('/', verifyToken, IzvjestajiController.getIzvjestajiIstorija);

export default router;
