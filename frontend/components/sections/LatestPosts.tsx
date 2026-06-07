import type { GhostPost } from "@/lib/ghost/types";
import type { Dictionary } from "@/i18n/dictionaries";
import PostCard from "@/components/blog/PostCard";

export default function LatestPosts({
  posts,
  lang,
  dict,
}: {
  posts: GhostPost[];
  lang: string;
  dict: Dictionary;
}) {
  if (posts.length === 0) return null;
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">{dict.home.latestPostsTitle}</h2>
        <p className="muted" style={{ marginTop: "0.5rem" }}>
          {dict.home.latestPostsIntro}
        </p>
        <div className="grid grid-3" style={{ marginTop: "2rem" }}>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
}
