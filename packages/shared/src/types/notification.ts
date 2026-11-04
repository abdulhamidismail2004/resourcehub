export type NotificationType = 'upload_approved' | 'upload_rejected' | 'resource_reported' | 'collection_shared' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  linkUrl: string | null;
  createdAt: string;
}
