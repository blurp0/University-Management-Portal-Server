import bcrypt from "bcrypt";
import { prisma } from "../config/database.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";
import { parsePagination, generateStudentId } from "../utils/helpers.js";
import { Role, Gender } from "../../prisma/generated/prisma/client";

const SALT_ROUNDS = 12;

interface CreateStudentInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: Date;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  departmentId: string;
  enrollmentYear?: number;
}

interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: Date;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  departmentId?: string;
  enrollmentYear?: number;
  status?: string;
}

export class StudentService {
  static async getAll(page?: number, limit?: number, search?: string) {
    const { page: parsedPage, limit: parsedLimit, skip } = parsePagination(
      String(page ?? 1),
      String(limit ?? 10)
    );

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: parsedLimit,
        include: {
          department: true,
          user: { select: { id: true, email: true, isActive: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.student.count({ where }),
    ]);

    return {
      students,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    };
  }

  static async findByUserId(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        department: true,
        user: { select: { id: true, email: true, isActive: true } },
        enrollments: {
          include: {
            section: {
              include: { course: true, faculty: true },
            },
          },
        },
        grades: {
          include: {
            section: {
              include: { course: true },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError("Student");
    }

    return student;
  }

  static async getById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        department: true,
        user: { select: { id: true, email: true, isActive: true } },
        enrollments: {
          include: {
            section: {
              include: { course: true },
            },
          },
        },
        grades: {
          include: {
            section: {
              include: { course: true },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError("Student");
    }

    return student;
  }

  static async create(data: CreateStudentInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const studentCount = await prisma.student.count();
    const studentId = generateStudentId(studentCount);

    const genderEnum = data.gender ? Gender[data.gender as keyof typeof Gender] : undefined;

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          role: Role.STUDENT,
        },
      });

      return tx.student.create({
        data: {
          userId: user.id,
          studentId,
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          gender: genderEnum,
          dateOfBirth: data.dateOfBirth,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
          departmentId: data.departmentId,
          enrollmentYear: data.enrollmentYear ?? new Date().getFullYear(),
        },
        include: { department: true },
      });
    });

    return student;
  }

  static async update(id: string, data: UpdateStudentInput) {
    const existing = await prisma.student.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError("Student");
    }

    const genderEnum = data.gender ? Gender[data.gender as keyof typeof Gender] : undefined;

    const student = await prisma.student.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        gender: genderEnum,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        departmentId: data.departmentId,
        enrollmentYear: data.enrollmentYear,
        status: data.status,
      },
      include: { department: true },
    });

    return student;
  }

  static async delete(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundError("Student");
    }

    await prisma.user.delete({
      where: { id: student.userId },
    });

    return { message: "Student deleted successfully" };
  }

  static async getGrades(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundError("Student");
    }

    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: {
        section: {
          include: { course: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return grades;
  }

  static async getEnrollments(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundError("Student");
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        section: {
          include: {
            course: true,
            faculty: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return enrollments;
  }
}
