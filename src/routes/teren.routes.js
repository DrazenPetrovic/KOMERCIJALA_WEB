import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as TerenController from '../controllers/teren.controller.js';

const router = Router();
router.get('/grad', verifyToken, TerenController.getTerenGrad);
router.get('/po-danima', verifyToken, TerenController.getTerenPoDanima);

export default router;
