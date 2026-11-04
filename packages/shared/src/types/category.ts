export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  resourceCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  resourceCount?: number;
}
