export type UserRole = 'guest' | 'user' | 'moderator' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl: string | null;
  bio: string | null;
  institution: string | null;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  stats: {
    resourcesCount: number;
    downloadsCount: number;
    bookmarksCount: number;
    collectionsCount: number;
  };
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}
