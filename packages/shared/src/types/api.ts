export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SearchQueryFilters {
  q?: string;
  categoryId?: string;
  tag?: string;
  academicLevel?: string;
  subject?: string;
  fileExtension?: string;
  sortBy?: 'recent' | 'downloads' | 'bookmarks' | 'views' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
