import { Request, Response } from "express";
import { EnrollmentService } from "../services/enrollmentService.js";
import { AppError } from "../utils/errors.js";
import { prisma } from "../config/database.js";

export class EnrollmentController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const { page, limit, search, semester, year } = req.query;
      let studentId: string | undefined;

      if (authUser.role === "STUDENT") {
        const student = await prisma.student.findUnique({ where: { userId: authUser.id } });
        if (student) studentId = student.id;
      }

      const result = await EnrollmentService.getAll(
        page ? Number(page) : undefined,
        limit ? Number(limit) : undefined,
        search as string | undefined,
        semester as string | undefined,
        year ? Number(year) : undefined,
        studentId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  static async enroll(req: Request, res: Response): Promise<void> {
    try {
      const student = await prisma.student.findUnique({
        where: { userId: (req as any).user.id },
      });
      if (!student) {
        res.status(404).json({ success: false, error: "Student not found" });
        return;
      }

      const { sectionId } = req.body;
      const enrollment = await EnrollmentService.enroll(student.id, sectionId);
      res.status(201).json({ success: true, data: enrollment });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const enrollment = await EnrollmentService.update(id, { status });
      res.json({ success: true, data: enrollment });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  static async drop(req: Request, res: Response): Promise<void> {
    try {
      const student = await prisma.student.findUnique({
        where: { userId: (req as any).user.id },
      });
      if (!student) {
        res.status(404).json({ success: false, error: "Student not found" });
        return;
      }

      const { id } = req.params;
      const enrollment = await EnrollmentService.drop(student.id, id);
      res.json({ success: true, data: enrollment });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}
