"use client";

import Link from "next/link";
import { Home, Plus } from "lucide-react";
import { ProfileMenu } from "@/components/profile-menu";
import { StatusBar } from "@/components/status-bar";
import { HeaderMenu } from "@/components/header-menu";

export function TimelineInteractive({ initialPosts, userNickname, isAdmin, pageTitle = "" }) {
  const posts = initialPosts;

  return (
    <main className="phone">
      <StatusBar />
      <header className={`topbar ${pageTitle ? "has-page-title" : ""}`}>
        <Link className="brand left" href="/">Sassie</Link>
        <span className="center">{pageTitle}</span>
        <div className="right" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link className="post-button" href="/create">＋ 投稿する</Link>
          <HeaderMenu />
        </div>
      </header>
      <section className="timeline" aria-label="タイムライン">
        {posts.map((post) => (
          <article className="trace-card" key={post.id}>
            <Link className="trace-card-link" href={`/posts/${post.id}`} aria-label={`${post.length}文字の投稿の詳細`}>
              <p className="post-author">{post.ownerNickname}</p>
              <div className="masked" aria-label="伏せられたメッセージ">{post.masked}</div>
              <p className="meta">{post.length}文字</p>
              <p className="meta">送信されませんでした</p>
              <ul className="traces">{post.traces.map((trace) => <li key={trace}>{trace}</li>)}</ul>
            </Link>
          </article>
        ))}
        {posts.length === 0 && <p className="timeline-empty">まだ投稿がありません。</p>}
      </section>
      <nav className="bottom-nav" aria-label="メインナビゲーション">
        <Link href="/" aria-label="ホーム"><Home size={22} fill="currentColor" /></Link>
        <Link href="/create" className="compose-fab" aria-label="投稿する"><Plus size={29} strokeWidth={1.5} /></Link>
        <ProfileMenu nickname={userNickname} isAdmin={isAdmin} />
      </nav>
    </main>
  );
}
