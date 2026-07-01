import { Router } from "express";
import { StudentController } from "../controllers/studentController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { Role } from "../../prisma/generated/prisma/client";

const router = Router();

router.get("/", authenticate, authorize(Role.ADMIN), StudentController.getAll);
router.get("/me", authenticate, StudentController.getMe);
router.get("/:id", authenticate, authorize(Role.ADMIN, Role.FACULTY), StudentController.getById);
router.post("/", authenticate, authorize(Role.ADMIN), StudentController.create);
router.put("/:id", authenticate, authorize(Role.ADMIN), StudentController.update);
router.delete("/:id", authenticate, authorize(Role.ADMIN), StudentController.delete);
router.get("/:id/grades", authenticate, authorize(Role.ADMIN, Role.STUDENT), StudentController.getGrades);
router.get("/:id/enrollments", authenticate, authorize(Role.ADMIN, Role.STUDENT), StudentController.getEnrollments);

export default router;
