import { AppError } from "./errors.js";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(queryPage?: string, queryLimit?: string): PaginationParams {
  const page = Math.max(1, parseInt(queryPage || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(queryLimit || "10", 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function handleControllerError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  throw new AppError(message, 500);
}

export function generateStudentId(lastCount: number): string {
  return `STU-${String(lastCount + 1).padStart(4, "0")}`;
}
