import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { Role } from '../../prisma/generated/prisma/client';
import type { AuthUser } from '../middleware/auth.js';

const SALT_ROUNDS = 12;

interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

function parseExpiration(str: string): number {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 minutes
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateAccessToken(user: TokenPayload): string {
    return jwt.sign(
      { id: user.userId, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: parseExpiration(env.JWT_EXPIRATION) }
    );
  }

  static generateRefreshToken(user: TokenPayload): string {
    return jwt.sign(
      { id: user.userId, email: user.email, role: user.role },
      env.JWT_REFRESH_SECRET,
      { expiresIn: parseExpiration(env.JWT_REFRESH_EXPIRATION) }
    );
  }

  static verifyRefreshToken(token: string): AuthUser {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthUser;
  }

  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await this.hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        isVerified: false,
      },
    });

    if (data.role === Role.STUDENT) {
      const dept = await prisma.department.findFirst({ where: { code: 'CS' } });
      if (!dept) throw new Error('Default department not found');

      const studentCount = await prisma.student.count();
      const studentId = `STU${String(studentCount + 1).padStart(3, '0')}`;

      await prisma.student.create({
        data: {
          userId: user.id,
          studentId,
          firstName: data.firstName,
          lastName: data.lastName,
          departmentId: dept.id,
          enrollmentYear: new Date().getFullYear(),
        },
      });
    } else if (data.role === Role.FACULTY) {
      const dept = await prisma.department.findFirst({ where: { code: 'CS' } });
      if (!dept) throw new Error('Default department not found');

      const facultyCount = await prisma.faculty.count();
      const employeeId = `FAC${String(facultyCount + 1).padStart(3, '0')}`;

      await prisma.faculty.create({
        data: {
          userId: user.id,
          employeeId,
          firstName: data.firstName,
          lastName: data.lastName,
          departmentId: dept.id,
          hireDate: new Date(),
        },
      });
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async refreshTokens(refreshToken: string) {
    const decoded = this.verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid refresh token');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = this.generateAccessToken(tokenPayload);
    const newRefreshToken = this.generateRefreshToken(tokenPayload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
