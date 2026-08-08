"use client";

import { Check, Plus, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthClient({ initialAccounts = [] }) {
  const [accounts] = useState(initialAccounts);
  const [showForm, setShowForm] = useState(initialAccounts.length === 0);
  const [mode, setMode] = useState("login");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function switchAccount(userId) {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "切り替えられませんでした。");
        setSubmitting(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("切り替えられませんでした。");
      setSubmitting(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "処理に失敗しました。");
        setSubmitting(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("接続できませんでした。もう一度お試しください。");
      setSubmitting(false);
    }
  }

  function openAddAccount() {
    setMode("login");
    setNickname("");
    setPassword("");
    setError("");
    setShowForm(true);
  }

  return (
    <main className="phone auth-page">
      <section className="auth-panel">
        <h1 className="auth-brand">Sassie</h1>
        <p className="auth-copy">{showForm ? "言葉になる前の、静かな痕跡。" : "アカウントを切り替える"}</p>

        {!showForm ? (
          <div className="account-switcher">
            <div className="account-list" aria-label="ログイン済みのアカウント">
              {accounts.map((account) => (
                <button
                  type="button"
                  className="account-option"
                  disabled={submitting}
                  onClick={() => switchAccount(account.id)}
                  key={account.id}
                >
                  <span className="account-avatar"><UserRound size={19} /></span>
                  <span className="account-option-name">
                    <strong>{account.nickname}</strong>
                    {account.isSuperAdmin
                      ? <small><ShieldCheck size={12} />システム管理者</small>
                      : account.isAdmin && <small><ShieldCheck size={12} />管理者</small>}
                  </span>
                  {account.isActive && <Check size={18} aria-label="現在のアカウント" />}
                </button>
              ))}
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="button" className="add-account-button" onClick={openAddAccount}>
              <Plus size={18} />
              別のアカウントを追加
            </button>
          </div>
        ) : (
          <>
            <form className="auth-form" onSubmit={submit}>
              <label>
                <span>ニックネーム</span>
                <input
                  name="nickname"
                  autoComplete="username"
                  minLength={2}
                  maxLength={20}
                  required
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                />
              </label>
              <label>
                <span>パスワード</span>
                <input
                  name="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={8}
                  maxLength={72}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="auth-submit" disabled={submitting}>
                {submitting ? "処理中" : mode === "login" ? "ログインして追加" : "アカウントを作る"}
              </button>
            </form>
            <button
              type="button"
              className="auth-switch"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "新しいアカウントを作る" : "既存のアカウントでログイン"}
            </button>
            {accounts.length > 0 && (
              <button type="button" className="auth-switch" onClick={() => setShowForm(false)}>
                ログイン済みのアカウントへ戻る
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}
