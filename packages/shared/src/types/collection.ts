export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionDetailItem {
  id: string;
  resourceId: string;
  addedAt: string;
  title: string;
  description: string;
  subject: string;
  academicLevel: string;
  downloadCount: number;
  thumbnailUrl: string | null;
  fileExtension?: string;
  fileSize?: number;
  categoryName?: string;
  authorName?: string;
}

export interface CollectionDetail extends Collection {
  items: CollectionDetailItem[];
}

export interface Bookmark {
  id: string;
  userId: string;
  resourceId: string;
  createdAt: string;
  resource?: any;
}
