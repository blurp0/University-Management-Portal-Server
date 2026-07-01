import { Router } from "express";
import { SectionController } from "../controllers/sectionController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/available", authenticate, SectionController.getAvailable);

export default router;
