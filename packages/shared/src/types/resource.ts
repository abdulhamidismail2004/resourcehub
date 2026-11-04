import { User } from './user.js';
import { Category, Tag } from './category.js';

export type ResourceVisibility = 'public' | 'unlisted' | 'private';
export type ResourceStatus = 'pending' | 'approved' | 'rejected';
export type AcademicLevel = 'primary' | 'secondary' | 'high_school' | 'undergraduate' | 'postgraduate' | 'professional' | 'all';

export interface ResourceFile {
  id: string;
  resourceId: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  fileExtension: string;
  checksumSha256: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string;
  subject: string;
  academicLevel: AcademicLevel;
  institution: string | null;
  visibility: ResourceVisibility;
  status: ResourceStatus;
  downloadCount: number;
  bookmarkCount: number;
  viewCount: number;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author?: Pick<User, 'id' | 'displayName' | 'avatarUrl' | 'institution'>;
  category?: Category;
  tags?: Tag[];
  file?: ResourceFile;
  isBookmarked?: boolean;
}

export interface ResourceDetail extends Resource {
  relatedResources?: Resource[];
}
