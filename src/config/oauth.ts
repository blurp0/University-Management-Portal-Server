import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './database.js';
import { env } from './env.js';
import { Role } from '../../prisma/generated/prisma/client';

export function configurePassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          console.log('Google strategy - profile:', { id: profile.id, email: profile.emails?.[0]?.value });
          
          const email = profile.emails?.[0]?.value;
          if (!email) {
            console.log('Google strategy - no email found');
            return done(new Error('No email found from Google'), undefined);
          }

          const googleId = profile.id;
          const avatar = profile.photos?.[0]?.value;

          // Check if user exists with this Google ID
          let user = await prisma.user.findFirst({
            where: {
              provider: 'google',
              providerId: googleId,
            },
          });

          if (user) {
            console.log('Google strategy - found existing user by Google ID:', user.id);
            return done(null, user);
          }

          // Check if user exists with this email
          user = await prisma.user.findUnique({
            where: { email },
          });

          if (user) {
            // Link Google account to existing user
            console.log('Google strategy - linking Google to existing user:', user.id);
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                provider: 'google',
                providerId: googleId,
                avatar: avatar || user.avatar,
                isVerified: true,
              },
            });
            return done(null, user);
          }

          // Create new user
          console.log('Google strategy - creating new user for:', email);
          const firstName = profile.name?.givenName || email.split('@')[0];
          const lastName = profile.name?.familyName || '';

          user = await prisma.user.create({
            data: {
              email,
              provider: 'google',
              providerId: googleId,
              avatar,
              role: Role.STUDENT,
              isVerified: true,
            },
          });

          // Create student profile for new OAuth users
          const dept = await prisma.department.findFirst({ where: { code: 'CS' } });
          if (dept) {
            const studentCount = await prisma.student.count();
            await prisma.student.create({
              data: {
                userId: user.id,
                studentId: `STU${String(studentCount + 1).padStart(3, '0')}`,
                firstName,
                lastName,
                departmentId: dept.id,
                enrollmentYear: new Date().getFullYear(),
              },
            });
          }

          console.log('Google strategy - created new user:', user.id);
          return done(null, user);
        } catch (error) {
          console.error('Google strategy error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
