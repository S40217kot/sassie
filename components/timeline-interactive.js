"use client";

import Link from "next/link";
import { Home, Menu, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { StatusBar } from "@/components/status-bar";

export function TimelineInteractive({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts);
  const [error, setError] = useState("");

  async function react(postId, emoji) {
    setError("");
    try {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!response.ok) throw new Error("reaction failed");
      const data = await response.json();
      const reactions = data.post.reactions.map(({ emoji: value, count, selected }) => [value, count, selected]);
      setPosts((current) => current.map((post) => post.id === postId ? { ...post, reactions } : post));
    } catch {
      setError("リアクションを保存できませんでした。");
    }
  }

  return (
    <main className="phone">
      <StatusBar />
      <header className="topbar">
        <span className="brand left">Sassie</span><span />
        <div className="right" style={{display:"flex", alignItems:"center", gap:12}}>
          <Link className="post-button" href="/create">＋ 投稿する</Link>
          <button className="icon-button" aria-label="メニュー"><Menu size={23} strokeWidth={1.7} /></button>
        </div>
      </header>
      <section className="timeline" aria-label="タイムライン">
        {posts.map((post) => (
          <article className="trace-card" key={post.id}>
            <Link className="trace-card-link" href={`/posts/${post.id}`} aria-label={`${post.length}文字の投稿の詳細`}>
              <div className="masked" aria-label="伏せられたメッセージ">{post.masked}</div>
              <p className="meta">{post.length}文字</p>
              <p className="meta">送信されませんでした</p>
              <ul className="traces">{post.traces.map((trace) => <li key={trace}>{trace}</li>)}</ul>
            </Link>
            <div className="reactions" aria-label="リアクション">
              {post.reactions.slice(0, 3).map(([emoji, count, selected]) => (
                <button
                  type="button"
                  className={`reaction timeline-reaction ${selected ? "selected" : ""}`}
                  aria-label={`${emoji}でリアクション`}
                  aria-pressed={Boolean(selected)}
                  onClick={() => react(post.id, emoji)}
                  key={emoji}
                ><span className="emoji">{emoji}</span>{count}</button>
              ))}
            </div>
          </article>
        ))}
        {error && <p role="alert" className="form-error">{error}</p>}
      </section>
      <nav className="bottom-nav" aria-label="メインナビゲーション">
        <Link href="/" aria-label="ホーム"><Home size={22} fill="currentColor" /></Link>
        <Link href="/create" className="compose-fab" aria-label="投稿する"><Plus size={29} strokeWidth={1.5} /></Link>
        <span className="inactive" aria-label="プロフィール"><UserRound size={22} strokeWidth={1.5} /></span>
      </nav>
    </main>
  );
}
