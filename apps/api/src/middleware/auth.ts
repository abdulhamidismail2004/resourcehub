import { FastifyRequest, FastifyReply } from 'fastify';
import { getDb } from '../db/index.js';
import * as schema from '../db/schema/index.js';
import { eq, and, gt } from 'drizzle-orm';
import { UserRole } from '@resourcehub/shared';

export interface RequestUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl: string | null;
  institution: string | null;
  isVerified: boolean;
  isSuspended: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: RequestUser | null;
    sessionId?: string;
  }
}

export async function attachUser(req: FastifyRequest, _reply: FastifyReply) {
  let token = req.cookies?.rh_session;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    req.user = null;
    return;
  }

  try {
    const db = await getDb();
    const [sessionRecord] = await db
      .select({
        sessionId: schema.sessions.id,
        userId: schema.users.id,
        email: schema.users.email,
        displayName: schema.users.displayName,
        role: schema.users.role,
        avatarUrl: schema.users.avatarUrl,
        institution: schema.users.institution,
        isVerified: schema.users.isVerified,
        isSuspended: schema.users.isSuspended,
        expiresAt: schema.sessions.expiresAt,
      })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
      .where(and(eq(schema.sessions.token, token), gt(schema.sessions.expiresAt, new Date())))
      .limit(1);

    if (sessionRecord) {
      req.user = {
        id: sessionRecord.userId,
        email: sessionRecord.email,
        displayName: sessionRecord.displayName,
        role: sessionRecord.role as UserRole,
        avatarUrl: sessionRecord.avatarUrl,
        institution: sessionRecord.institution,
        isVerified: sessionRecord.isVerified,
        isSuspended: sessionRecord.isSuspended,
      };
      req.sessionId = sessionRecord.sessionId;
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication required. Please log in to proceed.',
    });
  }

  if (req.user.isSuspended) {
    return reply.status(403).send({
      success: false,
      error: 'Your account has been suspended by an administrator.',
    });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required. Please log in.',
      });
    }

    if (req.user.isSuspended) {
      return reply.status(403).send({
        success: false,
        error: 'Your account has been suspended.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return reply.status(403).send({
        success: false,
        error: `Access denied. Requires one of [${allowedRoles.join(', ')}] role privileges.`,
      });
    }
  };
}
