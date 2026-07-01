import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError, ValidationError } from "../utils/errors.js";
import { parsePagination } from "../utils/helpers.js";
import { EnrollmentStatus } from "../../prisma/generated/prisma/client";

export class EnrollmentService {
  static async getAll(page?: number, limit?: number, search?: string, semester?: string, year?: number, studentId?: string) {
    const { page: parsedPage, limit: parsedLimit, skip } = parsePagination(
      String(page ?? 1),
      String(limit ?? 10)
    );

    const where: Record<string, unknown> = {};

    if (studentId) {
      where.studentId = studentId;
    }

    if (search) {
      where.OR = [
        { section: { course: { name: { contains: search, mode: "insensitive" } } } },
        { student: { firstName: { contains: search, mode: "insensitive" } } },
        { student: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const sectionFilter: Record<string, unknown> = {};
    if (semester) sectionFilter.semester = semester;
    if (year) sectionFilter.year = year;
    if (Object.keys(sectionFilter).length > 0) {
      where.section = sectionFilter;
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: parsedLimit,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
          section: { include: { course: true, faculty: true } },
        },
        orderBy: { enrolledAt: "desc" },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return {
      enrollments,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    };
  }

  static async enroll(studentId: string, sectionId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundError("Student");

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new NotFoundError("Section");

    if (section.enrolled >= section.capacity) {
      throw new ValidationError("Section is at full capacity");
    }

    const existing = await prisma.enrollment.findFirst({
      where: { studentId, sectionId, status: EnrollmentStatus.ENROLLED },
    });
    if (existing) {
      throw new ConflictError("Already enrolled in this section");
    }

    const enrollment = await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          studentId,
          sectionId,
          status: EnrollmentStatus.ENROLLED,
        },
        include: {
          section: { include: { course: true, faculty: true } },
        },
      });

      await tx.section.update({
        where: { id: sectionId },
        data: { enrolled: { increment: 1 } },
      });

      return enrollment;
    });

    return enrollment;
  }

  static async update(id: string, data: { status?: EnrollmentStatus }) {
    const existing = await prisma.enrollment.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundError("Enrollment");

    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: { status: data.status },
      include: {
        section: { include: { course: true, faculty: true } },
      },
    });

    return enrollment;
  }

  static async drop(studentId: string, enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) throw new NotFoundError("Enrollment");

    if (enrollment.studentId !== studentId) {
      throw new ValidationError("Not authorized to drop this enrollment");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updated = await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: EnrollmentStatus.DROPPED,
          droppedAt: new Date(),
        },
        include: {
          section: { include: { course: true, faculty: true } },
        },
      });

      await tx.section.update({
        where: { id: enrollment.sectionId },
        data: { enrolled: { decrement: 1 } },
      });

      return updated;
    });

    return updated;
  }
}
