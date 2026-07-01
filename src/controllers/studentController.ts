import { Request, Response } from "express";
import { StudentService } from "../services/studentService.js";
import { AppError } from "../utils/errors.js";

export class StudentController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search } = req.query;
      const result = await StudentService.getAll(
        page ? Number(page) : undefined,
        limit ? Number(limit) : undefined,
        search as string | undefined
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

  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const student = await StudentService.findByUserId(userId);
      res.json({ success: true, data: student });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const student = await StudentService.getById(id);
      res.json({ success: true, data: student });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        middleName,
        gender,
        dateOfBirth,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        departmentId,
        enrollmentYear,
      } = req.body;

      const student = await StudentService.create({
        email,
        password,
        firstName,
        lastName,
        middleName,
        gender,
        dateOfBirth,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        departmentId,
        enrollmentYear,
      });

      res.status(201).json({ success: true, data: student });
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
      const {
        firstName,
        lastName,
        middleName,
        gender,
        dateOfBirth,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        departmentId,
        enrollmentYear,
        status,
      } = req.body;

      const student = await StudentService.update(id, {
        firstName,
        lastName,
        middleName,
        gender,
        dateOfBirth,
        phone,
        address,
        city,
        state,
        zipCode,
        country,
        departmentId,
        enrollmentYear,
        status,
      });

      res.json({ success: true, data: student });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await StudentService.delete(id);
      res.json({ success: true, message: "Student deleted successfully" });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  static async getGrades(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authUser = (req as any).user;

      if (authUser.role === "STUDENT") {
        const student = await StudentService.getById(id);
        if (student.userId !== authUser.id) {
          res.status(403).json({ success: false, error: "Access denied" });
          return;
        }
      }

      const grades = await StudentService.getGrades(id);
      res.json({ success: true, data: grades });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  static async getEnrollments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authUser = (req as any).user;

      if (authUser.role === "STUDENT") {
        const student = await StudentService.getById(id);
        if (student.userId !== authUser.id) {
          res.status(403).json({ success: false, error: "Access denied" });
          return;
        }
      }

      const enrollments = await StudentService.getEnrollments(id);
      res.json({ success: true, data: enrollments });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}
