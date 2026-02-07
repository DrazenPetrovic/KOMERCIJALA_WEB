import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as UplateController from '../controllers/uplate.controller.js';

const router = Router();
router.get('/', verifyToken, UplateController.getUplate);

export default router;
