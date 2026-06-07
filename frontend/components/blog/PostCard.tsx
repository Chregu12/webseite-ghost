import Link from "next/link";
import Image from "next/image";
import type { GhostPost } from "@/lib/ghost/types";

export default function PostCard({ post, lang }: { post: GhostPost; lang: string }) {
  const excerpt = post.custom_excerpt || post.excerpt || "";
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString(lang, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <Link href={`/${lang}/blog/${post.slug}`} className="card post-card">
      {post.feature_image && (
        <Image
          className="post-card-img"
          src={post.feature_image}
          alt={post.feature_image_alt || post.title}
          width={640}
          height={360}
          sizes="(max-width: 720px) 100vw, 360px"
        />
      )}
      <h3>{post.title}</h3>
      {excerpt && <p className="muted">{excerpt}</p>}
      {date && <div className="post-meta">{date}</div>}
    </Link>
  );
}
