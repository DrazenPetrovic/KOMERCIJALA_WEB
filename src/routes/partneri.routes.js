import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as PartneriController from '../controllers/partneri.controller.js';

const router = Router();
router.get('/', verifyToken, PartneriController.getPartneri);
router.get('/dodatni-podaci', verifyToken, PartneriController.getPartneriDodatniPodaci);

export default router;
