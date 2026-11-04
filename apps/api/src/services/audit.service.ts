import { getDb } from '../db/index.js';
import * as schema from '../db/schema/index.js';

export class AuditService {
  static async log(params: {
    userId?: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    try {
      const db = await getDb();
      await db.insert(schema.auditLogs).values({
        userId: params.userId || null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress || null,
      });
    } catch (err) {
      console.warn('Failed to record audit log:', (err as Error).message);
    }
  }
}
