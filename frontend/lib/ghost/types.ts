// Minimal typings for the Ghost Content API resources we consume.
// See https://docs.ghost.org/content-api/

export interface GhostAuthor {
  id: string;
  name: string;
  slug: string;
  profile_image: string | null;
  bio: string | null;
}

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  feature_image: string | null;
  visibility: "public" | "internal";
}

export interface GhostPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  html: string | null;
  plaintext?: string | null;
  excerpt: string | null;
  custom_excerpt: string | null;
  feature_image: string | null;
  feature_image_alt: string | null;
  published_at: string | null;
  updated_at: string | null;
  reading_time?: number;
  tags?: GhostTag[];
  authors?: GhostAuthor[];
  primary_author?: GhostAuthor;
  primary_tag?: GhostTag | null;
}

// Pages share the post shape in the Content API.
export type GhostPage = GhostPost;

export interface GhostSettings {
  title: string;
  description: string;
  logo: string | null;
  icon: string | null;
  cover_image: string | null;
  accent_color: string | null;
  locale: string | null;
  navigation: { label: string; url: string }[];
  secondary_navigation: { label: string; url: string }[];
}

export interface GhostPagination {
  page: number;
  limit: number;
  pages: number;
  total: number;
  next: number | null;
  prev: number | null;
}

export interface GhostBrowseResponse<T> {
  [resource: string]: T[] | { pagination: GhostPagination };
  meta: { pagination: GhostPagination };
}
