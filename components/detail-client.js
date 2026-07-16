"use client";

import Link from "next/link";
import { ChevronLeft, CircleEllipsis, Info } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBar } from "@/components/status-bar";
import { posts } from "@/lib/posts";
import { getFeeling, getLocalPosts, getReactionCounts, getSelectedReactions, setFeeling, toggleReaction } from "@/lib/storage";

const feelings = ["静か", "一息つく", "そっと灯す", "大丈夫だよ", "本にする"];

export function DetailClient() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [selectedReactions, setSelectedReactions] = useState([]);
  const [selectedFeeling, setSelectedFeeling] = useState(null);

  useEffect(() => {
    const found = [...getLocalPosts(), ...posts].find((item) => item.id === id) ?? null;
    setPost(found);
    if (found) {
      setReactions(getReactionCounts(found));
      setSelectedReactions(getSelectedReactions(found.id));
      setSelectedFeeling(getFeeling(found.id));
    }
  }, [id]);

  function react(emoji) {
    const selected = toggleReaction(post.id, emoji);
    setSelectedReactions((current) => selected ? [...current, emoji] : current.filter((item) => item !== emoji));
    setReactions(getReactionCounts(post));
  }

  if (!post) return <main className="phone"><p style={{padding:24}}>投稿を読み込んでいます。</p></main>;

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
            {reactions.map(([emoji, count]) => (
              <button className={`reaction-box ${selectedReactions.includes(emoji) ? "selected" : ""}`} aria-pressed={selectedReactions.includes(emoji)} aria-label={`${emoji}でリアクション`} onClick={() => react(emoji)} key={emoji}>
                <span className="emoji">{emoji}</span>{count}
              </button>
            ))}
          </div>
          <p className="stopped">{post.stopped}人が立ち止まりました</p>
        </section>
        <section className="section">
          <h2 className="section-title">この投稿に残っていた気持ち</h2>
          <div className="feelings">
            {feelings.map((feeling) => (
              <button className={`feeling ${selectedFeeling === feeling ? "selected" : ""}`} aria-pressed={selectedFeeling === feeling} onClick={() => setSelectedFeeling(setFeeling(post.id, feeling))} key={feeling}>{feeling}</button>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
