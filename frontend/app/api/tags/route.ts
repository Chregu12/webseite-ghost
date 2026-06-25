import { NextResponse } from "next/server";
import { getPublicTags } from "@/lib/ghost/content";

// Public tags list for the builder's dynamic Tag-cloud block.
export const revalidate = 3600;

export async function GET() {
  const tags = (await getPublicTags()).map((t) => ({
    name: t.name,
    slug: t.slug,
    count: (t as { count?: { posts?: number } }).count?.posts ?? 0,
  }));
  return NextResponse.json({ tags });
}
