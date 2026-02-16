import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as IzvjestajiController from '../controllers/izvjestaji.controller.js';

const router = Router();

router.post('/save', verifyToken, IzvjestajiController.savePartnerReport);
router.get('/:sifraPartnera', verifyToken, IzvjestajiController.getPartnerReports);





export default router;
