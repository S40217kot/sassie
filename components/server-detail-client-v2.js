"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { StatusBar } from "@/components/status-bar";

const feelings = ["静か", "一息つく", "そっと灯す", "大丈夫だよ", "本にする"];

export function ServerDetailClientV2({ initialPost }) {
  const [post, setPost] = useState(initialPost);
  const [error, setError] = useState("");

  async function react(emoji) {
    setError("");
    try {
      const response = await fetch(`/api/posts/${post.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!response.ok) throw new Error("reaction failed");
      const data = await response.json();
      setPost(data.post);
    } catch {
      setError("リアクションを保存できませんでした。");
    }
  }

  return (
    <main className="phone">
      <StatusBar />
      <header className="detail-header">
        <Link className="icon-button" href="/" aria-label="戻る"><ChevronLeft size={28} strokeWidth={1.5} /></Link>
      </header>
      <article className="detail">
        <p className="post-author">{post.ownerNickname}</p>
        <div className="masked" aria-label="伏せられたメッセージ">{post.masked}</div>
        <p className="meta">{post.length}文字</p><p className="meta">送信されませんでした</p>
        <section className="section">
          <h2 className="section-title">アプリが見つけた痕跡</h2>
          <ul className="traces detail-traces">{post.detailTraces.map((trace) => <li key={trace}>{trace}</li>)}</ul>
        </section>
        <section className="section">
          <h2 className="section-title">リアクション</h2>
          <div className="reaction-grid">
            {post.reactions.map(({ emoji, count, selected }, index) => (
              <button className={`reaction-box ${selected ? "selected" : ""}`} disabled={post.isOwn} aria-pressed={selected} aria-label={post.isOwn ? "自分の投稿にはリアクションできません" : `${emoji}でリアクション`} onClick={() => react(emoji)} key={emoji}>
                <span className="emoji">{emoji}</span>
                <span className="reaction-label">{feelings[index]}</span>
                <span className="reaction-count">{count}</span>
              </button>
            ))}
          </div>
          <p className="stopped">{post.stopped}人が立ち止まりました</p>
        </section>
        {error && <p role="alert" className="form-error">{error}</p>}
      </article>
    </main>
  );
}
