import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import * as ArtikliController from '../controllers/artikli.controller.js';

const router = Router();
router.get('/', verifyToken, ArtikliController.getArtikli);

export default router;
