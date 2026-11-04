import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { getDb } from '../../db/index.js';
import * as schema from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '@resourcehub/shared';
import { requireAuth } from '../../middleware/auth.js';
import { AuditService } from '../../services/audit.service.js';

export const authRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  // Register
  app.post('/register', async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid registration input',
      });
    }

    const { email, password, displayName, institution } = parsed.data;
    const db = await getDb();

    const [existing] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing) {
      return reply.status(409).send({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        displayName,
        institution: institution || null,
        role: 'user',
        isVerified: true, // Auto-verified for local academic platform
      })
      .returning();

    // Generate Session
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    await db.insert(schema.sessions).values({
      userId: newUser.id,
      token,
      expiresAt,
    });

    reply.setCookie('rh_session', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    });

    await AuditService.log({
      userId: newUser.id,
      action: 'USER_REGISTERED',
      targetType: 'user',
      targetId: newUser.id,
      ipAddress: req.ip,
    });

    return reply.status(201).send({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role,
          avatarUrl: newUser.avatarUrl,
          institution: newUser.institution,
          isVerified: newUser.isVerified,
        },
        token,
      },
    });
  });

  // Login
  app.post('/login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid login input',
      });
    }

    const { email, password } = parsed.data;
    const db = await getDb();

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    if (user.isSuspended) {
      return reply.status(403).send({
        success: false,
        error: 'Your account has been suspended by an administrator.',
      });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    await db.insert(schema.sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    reply.setCookie('rh_session', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    });

    await AuditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      targetType: 'user',
      targetId: user.id,
      ipAddress: req.ip,
    });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          institution: user.institution,
          bio: user.bio,
          isVerified: user.isVerified,
        },
        token,
      },
    });
  });

  // Logout
  app.post('/logout', { preHandler: requireAuth }, async (req, reply) => {
    if (req.sessionId) {
      const db = await getDb();
      await db.delete(schema.sessions).where(eq(schema.sessions.id, req.sessionId));
    }

    reply.clearCookie('rh_session', { path: '/' });
    return reply.send({ success: true, message: 'Logged out successfully.' });
  });

  // Current User
  app.get('/me', async (req, reply) => {
    if (!req.user) {
      return reply.send({ success: true, data: { user: null } });
    }
    return reply.send({ success: true, data: { user: req.user } });
  });

  // Update Profile
  app.patch('/profile', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid profile data',
      });
    }

    const db = await getDb();
    const [updated] = await db
      .update(schema.users)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, req.user!.id))
      .returning();

    return reply.send({
      success: true,
      data: {
        user: {
          id: updated.id,
          email: updated.email,
          displayName: updated.displayName,
          role: updated.role,
          avatarUrl: updated.avatarUrl,
          institution: updated.institution,
          bio: updated.bio,
          isVerified: updated.isVerified,
        },
      },
    });
  });

  // Change Password
  app.post('/change-password', { preHandler: requireAuth }, async (req, reply) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid password input',
      });
    }

    const db = await getDb();
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.user!.id))
      .limit(1);

    const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!matches) {
      return reply.status(400).send({
        success: false,
        error: 'Current password is incorrect.',
      });
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await db
      .update(schema.users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(schema.users.id, req.user!.id));

    return reply.send({ success: true, message: 'Password updated successfully.' });
  });
};
