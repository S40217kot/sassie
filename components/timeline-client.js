"use client";

import Link from "next/link";
import { Home, Menu, Plus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { StatusBar } from "@/components/status-bar";
import { TraceCard } from "@/components/trace-card";
import { posts } from "@/lib/posts";
import { getLocalPosts } from "@/lib/storage";

export function TimelineClient() {
  const [timelinePosts, setTimelinePosts] = useState(posts);

  useEffect(() => {
    setTimelinePosts([...getLocalPosts(), ...posts]);
  }, []);

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
        {timelinePosts.map((post) => <TraceCard post={post} key={post.id} />)}
      </section>
      <nav className="bottom-nav" aria-label="メインナビゲーション">
        <Link href="/" aria-label="ホーム"><Home size={22} fill="currentColor" /></Link>
        <Link href="/create" className="compose-fab" aria-label="投稿する"><Plus size={29} strokeWidth={1.5} /></Link>
        <span className="inactive" aria-label="プロフィール"><UserRound size={22} strokeWidth={1.5} /></span>
      </nav>
    </main>
  );
}
