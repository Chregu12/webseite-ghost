import type { GhostPost } from "@/lib/ghost/types";
import PostCard from "@/components/blog/PostCard";

export default function RelatedPosts({
  posts,
  lang,
  title,
}: {
  posts: GhostPost[];
  lang: string;
  title: string;
}) {
  if (posts.length === 0) return null;
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title" style={{ fontSize: "1.5rem" }}>
          {title}
        </h2>
        <div className="grid grid-3" style={{ marginTop: "1.5rem" }}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
}
