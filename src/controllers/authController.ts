import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/authService.js';
import { env } from '../config/env.js';
import { Role } from '../../prisma/generated/prisma/client';
import type { AuthUser } from '../middleware/auth.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      const fieldErrors: string[] = [];
      if (!firstName || firstName.length < 2) fieldErrors.push('First name must be at least 2 characters');
      if (!lastName || lastName.length < 2) fieldErrors.push('Last name must be at least 2 characters');
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.push('Valid email is required');
      if (!password || password.length < 6) fieldErrors.push('Password must be at least 6 characters');

      const validRoles = [Role.STUDENT, Role.FACULTY];
      if (role && !validRoles.includes(role)) fieldErrors.push('Role must be Student or Faculty');

      if (fieldErrors.length > 0) {
        res.status(400).json({ success: false, error: fieldErrors.join('. ') });
        return;
      }

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        role: role || Role.STUDENT,
      });

      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        res.status(409).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ success: false, error: 'Invalid email format' });
        return;
      }

      const result = await AuthService.login(email, password);

      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      if (error.message === 'Invalid email or password' || error.message === 'Account is deactivated') {
        res.status(401).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  }

  static googleInitiate() {
    // This is handled by Passport middleware directly
  }

  static googleCallback(req: Request, res: Response): void {
    try {
      const user = req.user as any;
      console.log('Google callback - user:', user ? { id: user.id, email: user.email } : 'null');
      
      if (!user) {
        console.log('Google callback - no user found, redirecting to login');
        res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
        return;
      }

      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = jwt.sign(tokenPayload, env.JWT_SECRET, {
        expiresIn: 900, // 15 minutes
      });

      const refreshToken = jwt.sign(tokenPayload, env.JWT_REFRESH_SECRET, {
        expiresIn: 604800, // 7 days
      });

      res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

      const redirectUrl = `${env.CLIENT_URL}/auth/callback?accessToken=${encodeURIComponent(accessToken)}`;
      console.log('Google callback - redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${env.CLIENT_URL}/login?error=oauth_failed`);
    }
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const userData = await AuthService.getMe(user.id);

      res.json({
        success: true,
        data: userData,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to get user' });
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({ success: false, error: 'Refresh token required' });
        return;
      }

      const result = await AuthService.refreshTokens(refreshToken);

      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      res.clearCookie('refreshToken', { path: '/' });
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ success: true, message: 'Logged out successfully' });
  }
}
