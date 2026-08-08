"use client";

import Link from "next/link";
import { ChevronLeft, ShieldCheck, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function RoleBadge({ user }) {
  if (user.isSystem) return <span className="admin-badge system">システム</span>;
  if (user.isSuperAdmin) {
    return <span className="admin-badge super">システム管理者{user.isSelf ? "・自分" : ""}</span>;
  }
  if (user.isAdmin) return <span className="admin-badge">管理者{user.isSelf ? "・自分" : ""}</span>;
  return <span className="admin-badge regular">通常</span>;
}

export function AdminClient({ initialData }) {
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function runAction({ key, url, method = "DELETE", body, message }) {
    if (busyKey || !window.confirm(message)) return;
    setBusyKey(key);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "操作できませんでした。");
        return;
      }
      router.refresh();
    } catch {
      setError("操作できませんでした。");
    } finally {
      setBusyKey("");
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/" className="admin-back"><ChevronLeft size={22} />タイムラインへ戻る</Link>
        <div>
          <p>Sassie</p>
          <h1>管理画面</h1>
        </div>
      </header>

      {error && <p className="admin-error" role="alert">{error}</p>}

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>ユーザー</h2><span>{initialData.users.length}件</span>
        </div>
        <div className="admin-list">
          {initialData.users.map((user) => {
            const canDelete = !user.isSelf
              && !user.isSystem
              && !user.isSuperAdmin
              && (!user.isAdmin || initialData.permissions.isSuperAdmin);
            const canPromote = initialData.permissions.isSuperAdmin
              && !user.isSystem
              && !user.isAdmin
              && !user.isSuperAdmin;

            return (
              <article className="admin-row" key={user.id}>
                <div className="admin-row-main">
                  <div className="admin-row-title">
                    <strong>{user.nickname}</strong>
                    <RoleBadge user={user} />
                  </div>
                  <p>投稿 {user.postCount}件・リアクション {user.reactionCount}件</p>
                </div>
                {(canDelete || canPromote) ? (
                  <div className="admin-actions">
                    {canPromote && (
                      <button
                        className="admin-promote"
                        aria-label={`${user.nickname}を管理者にする`}
                        disabled={Boolean(busyKey)}
                        onClick={() => runAction({
                          key: `promote-${user.id}`,
                          url: `/api/admin/users/${user.id}/promote`,
                          method: "POST",
                          message: `${user.nickname}を管理者にしますか？`,
                        })}
                      ><ShieldCheck size={17} /></button>
                    )}
                    {canDelete && (
                      <button
                        className="admin-delete"
                        aria-label={`${user.nickname}を削除`}
                        disabled={Boolean(busyKey)}
                        onClick={() => runAction({
                          key: `user-${user.id}`,
                          url: `/api/admin/users/${user.id}`,
                          message: `${user.nickname}と、その投稿を削除しますか？`,
                        })}
                      ><Trash2 size={17} /></button>
                    )}
                  </div>
                ) : (
                  <span className="admin-protected">保護</span>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>投稿</h2><span>{initialData.posts.length}件</span>
        </div>
        <div className="admin-list">
          {initialData.posts.map((post) => (
            <article className="admin-row" key={post.id}>
              <div className="admin-row-main">
                <div className="admin-row-title"><strong>{post.masked}</strong><span>{post.length}文字</span></div>
                <p>{post.ownerNickname}・リアクション {post.reactionCount}件</p>
              </div>
              <button
                className="admin-delete"
                aria-label={`${post.length}文字の投稿を削除`}
                disabled={Boolean(busyKey)}
                onClick={() => runAction({
                  key: `post-${post.id}`,
                  url: `/api/admin/posts/${post.id}`,
                  message: "この投稿と、紐づくリアクションを削除しますか？",
                })}
              ><Trash2 size={17} /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-heading">
          <h2>リアクション</h2><span>{initialData.reactions.length}件</span>
        </div>
        <div className="admin-list">
          {initialData.reactions.length === 0 && <p className="admin-empty">リアクションはありません。</p>}
          {initialData.reactions.map((reaction) => {
            const key = `${reaction.kind}-${reaction.postId}-${reaction.userId}-${reaction.value}`;
            return (
              <article className="admin-row" key={key}>
                <div className="admin-row-main">
                  <div className="admin-row-title">
                    <strong>{reaction.value}</strong>
                    <span>{reaction.kind === "emoji" ? "絵文字" : "気持ち"}</span>
                  </div>
                  <p>{reaction.userNickname} → {reaction.postLength}文字の投稿</p>
                </div>
                <button
                  className="admin-delete"
                  aria-label={`${reaction.value}のリアクションを削除`}
                  disabled={Boolean(busyKey)}
                  onClick={() => runAction({
                    key,
                    url: "/api/admin/reactions",
                    body: reaction,
                    message: "このリアクションを削除しますか？",
                  })}
                ><Trash2 size={17} /></button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
