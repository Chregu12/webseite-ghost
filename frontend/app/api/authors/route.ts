import { NextResponse } from "next/server";
import { getAuthors } from "@/lib/ghost/content";

// Public authors list for the builder's dynamic Authors block.
export const revalidate = 3600;

export async function GET() {
  const authors = (await getAuthors()).map((a) => ({
    name: a.name,
    slug: a.slug,
    bio: a.bio ?? "",
    profile_image: a.profile_image,
  }));
  return NextResponse.json({ authors });
}
