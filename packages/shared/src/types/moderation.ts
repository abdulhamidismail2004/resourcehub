import { User } from './user.js';
import { Resource } from './resource.js';

export type ReportReason = 'copyright' | 'inappropriate' | 'spam' | 'low_quality' | 'broken_file' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  resourceId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  reporter?: Pick<User, 'id' | 'displayName' | 'email'>;
  resource?: Pick<Resource, 'id' | 'title' | 'status'>;
}

export interface ModerationAction {
  id: string;
  moderatorId: string;
  targetType: 'resource' | 'user' | 'report';
  targetId: string;
  action: 'approve' | 'reject' | 'suspend' | 'unsuspend' | 'resolve_report' | 'dismiss_report';
  note: string | null;
  createdAt: string;
  moderator?: Pick<User, 'id' | 'displayName'>;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'displayName' | 'email'>;
}

export interface PlatformStats {
  totalUsers: number;
  totalResources: number;
  totalDownloads: number;
  totalBookmarks: number;
  pendingApprovals: number;
  openReports: number;
  totalStorageBytes: number;
  activeUsersCount: number;
  recentActivity: {
    date: string;
    uploads: number;
    downloads: number;
  }[];
}
