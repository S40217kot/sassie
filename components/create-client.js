"use client";

import Link from "next/link";
import { LockKeyhole, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { StatusBar } from "@/components/status-bar";
import { addLocalPost } from "@/lib/storage";

export function CreateClient() {
  const [text, setText] = useState("");
  const startedAt = useRef(null);
  const router = useRouter();

  function changeText(event) {
    if (!startedAt.current && event.target.value) startedAt.current = Date.now();
    setText(event.target.value);
  }

  function send() {
    if (!text.trim()) return;
    const length = [...text.trim()].length;
    const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const durationText = duration < 60 ? `送信まで${duration}秒かかりました` : `送信まで${Math.floor(duration / 60)}分${duration % 60}秒かかりました`;
    addLocalPost({
      id: `local-${Date.now()}`,
      masked: "□".repeat(Math.max(8, Math.min(12, Math.ceil(length / 4)))),
      length,
      traces: [durationText],
      detailTraces: [durationText],
      reactions: [["🌙", 0], ["☕", 0], ["🕯️", 0], ["🌱", 0], ["📖", 0]],
      stopped: 0,
    });
    router.push("/");
  }

  return (
    <main className="phone create-page">
      <StatusBar />
      <header className="topbar">
        <Link className="icon-button left" href="/" aria-label="閉じる"><X size={24} strokeWidth={1.5} /></Link>
        <span className="center">新しい投稿</span>
        <button onClick={send} disabled={!text.trim()} className={`send-button right ${text.trim() ? "ready" : ""}`}>送信する</button>
      </header>
      <section className="composer">
        <div className="prompts">ここに自由に書いてみてください。<br />誰にも見られません。<br />うまく言葉にできなくても、<br />そのままで大丈夫です。</div>
        <textarea aria-label="投稿内容" autoFocus value={text} onInput={changeText} onKeyUp={changeText} />
      </section>
      <footer className="composer-footer">
        <span>{[...text].length}文字</span>
        <span className="privacy"><LockKeyhole size={17} strokeWidth={1.5} />投稿内容は<br />誰にも見られません</span>
      </footer>
    </main>
  );
}
