import { Request, Response } from "express";
import { SectionService } from "../services/sectionService.js";
import { AppError } from "../utils/errors.js";

export class SectionController {
  static async getAvailable(req: Request, res: Response): Promise<void> {
    try {
      const sections = await SectionService.getAvailable();
      res.json({ success: true, data: sections });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}
