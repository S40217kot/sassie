import Link from "next/link";

export function TraceCard({ post }) {
  return (
    <Link className="trace-card" href={`/posts/${post.id}`} aria-label={`${post.length}文字の投稿の詳細`}>
      <div className="masked" aria-label="伏せられたメッセージ">{post.masked}</div>
      <p className="meta">{post.length}文字</p>
      <p className="meta">送信されませんでした</p>
      <ul className="traces">
        {post.traces.map((trace) => <li key={trace}>{trace}</li>)}
      </ul>
      <div className="reactions" aria-label="リアクション">
        {post.reactions.slice(0, 3).map(([emoji, count]) => <span className="reaction" key={emoji}><span className="emoji">{emoji}</span>{count}</span>)}
      </div>
    </Link>
  );
}

