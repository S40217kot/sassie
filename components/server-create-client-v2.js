"use client";

import Link from "next/link";
import { LockKeyhole, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { StatusBar } from "@/components/status-bar";

export function ServerCreateClientV2() {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const startedAt = useRef(null);
  const router = useRouter();

  function changeText(event) {
    if (!startedAt.current && event.target.value) startedAt.current = Date.now();
    setText(event.target.value);
    setError("");
  }

  async function send() {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    setError("");
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          length: [...text.trim()].length,
          duration: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
        }),
      });
      if (!response.ok) throw new Error("send failed");
      router.push("/");
      router.refresh();
    } catch {
      setError("投稿できませんでした。もう一度お試しください。");
      setIsSending(false);
    }
  }

  return (
    <main className="phone create-page">
      <StatusBar />
      <header className="topbar">
        <Link className="icon-button left" href="/" aria-label="閉じる"><X size={24} strokeWidth={1.5} /></Link>
        <span className="center">新しい投稿</span>
        <button onClick={send} disabled={!text.trim() || isSending} className={`send-button right ${text.trim() && !isSending ? "ready" : ""}`}>{isSending ? "送信中" : "送信する"}</button>
      </header>
      <section className="composer">
        <textarea
          aria-label="投稿内容"
          autoFocus
          value={text}
          onChange={changeText}
          placeholder={"ここに自由に書いてみてください。\n誰にも見られません。\nうまく言葉にできなくても、\nそのままで大丈夫です。"}
        />
        {error && <p role="alert" className="form-error">{error}</p>}
      </section>
      <footer className="composer-footer">
        <span>{[...text].length}文字</span>
        <span className="privacy"><LockKeyhole size={17} strokeWidth={1.5} />投稿内容は<br />誰にも見られません</span>
      </footer>
    </main>
  );
}
