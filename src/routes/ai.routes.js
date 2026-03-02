import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as AiController from "../controllers/ai.controller.js";

const router = Router();
// router.get('/', verifyToken, AiController.getArtikli);
router.post("/kupac-analiza", verifyToken, AiController.kupacAnaliza);

export default router;
