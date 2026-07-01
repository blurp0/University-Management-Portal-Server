import { Router } from "express";
import { EnrollmentController } from "../controllers/enrollmentController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { Role } from "../../prisma/generated/prisma/client";

const router = Router();

router.get("/", authenticate, authorize(Role.ADMIN, Role.FACULTY, Role.STUDENT), EnrollmentController.getAll);
router.post("/", authenticate, authorize(Role.STUDENT), EnrollmentController.enroll);
router.put("/:id", authenticate, authorize(Role.ADMIN), EnrollmentController.update);
router.delete("/:id", authenticate, authorize(Role.STUDENT), EnrollmentController.drop);

export default router;
