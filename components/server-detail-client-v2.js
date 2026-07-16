"use client";

import Link from "next/link";
import { ChevronLeft, CircleEllipsis, Info } from "lucide-react";
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

  async function choose(feeling) {
    setError("");
    try {
      const response = await fetch(`/api/posts/${post.id}/feeling`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeling }),
      });
      if (!response.ok) throw new Error("feeling failed");
      const data = await response.json();
      setPost((current) => ({ ...current, selectedFeeling: data.selectedFeeling }));
    } catch {
      setError("気持ちを保存できませんでした。");
    }
  }

  return (
    <main className="phone">
      <StatusBar />
      <header className="detail-header">
        <Link className="icon-button" href="/" aria-label="戻る"><ChevronLeft size={28} strokeWidth={1.5} /></Link>
        <button className="icon-button" aria-label="その他"><CircleEllipsis size={23} strokeWidth={1.5} /></button>
      </header>
      <article className="detail">
        <div className="masked" aria-label="伏せられたメッセージ">{post.masked}</div>
        <p className="meta">{post.length}文字</p><p className="meta">送信されませんでした</p>
        <section className="section">
          <h2 className="section-title"><span>AIが見つけた痕跡</span><Info size={19} strokeWidth={1.5} /></h2>
          <ul className="traces detail-traces">{post.detailTraces.map((trace) => <li key={trace}>{trace}</li>)}</ul>
        </section>
        <section className="section">
          <h2 className="section-title">リアクション</h2>
          <div className="reaction-grid">
            {post.reactions.map(({ emoji, count, selected }) => (
              <button className={`reaction-box ${selected ? "selected" : ""}`} aria-pressed={selected} aria-label={`${emoji}でリアクション`} onClick={() => react(emoji)} key={emoji}>
                <span className="emoji">{emoji}</span>{count}
              </button>
            ))}
          </div>
          <p className="stopped">{post.stopped}人が立ち止まりました</p>
        </section>
        <section className="section">
          <h2 className="section-title">この投稿に残っていた気持ち</h2>
          <div className="feelings">
            {feelings.map((feeling) => <button className={`feeling ${post.selectedFeeling === feeling ? "selected" : ""}`} aria-pressed={post.selectedFeeling === feeling} onClick={() => choose(feeling)} key={feeling}>{feeling}</button>)}
          </div>
        </section>
        {error && <p role="alert" className="form-error">{error}</p>}
      </article>
    </main>
  );
}
