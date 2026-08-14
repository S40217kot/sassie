"use client";

import Link from "next/link";
import { Check, LogOut, Pencil, Repeat2, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function ProfileMenu({ nickname, isAdmin = false }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(nickname);
  const [nicknameError, setNicknameError] = useState("");
  const [deleteStep, setDeleteStep] = useState(0);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const container = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function close(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    setNicknameInput(nickname);
  }, [nickname]);

  async function saveNickname(event) {
    event.preventDefault();
    if (busy) return;

    const nextNickname = nicknameInput.trim();
    if (nextNickname.length < 2 || nextNickname.length > 20) {
      setNicknameError("2〜20文字で入力してください。");
      return;
    }

    setBusy(true);
    setNicknameError("");
    try {
      const response = await fetch("/api/auth/nickname", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nextNickname }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNicknameError(data.error ?? "変更できませんでした。");
        return;
      }
      setEditingNickname(false);
      router.refresh();
    } catch {
      setNicknameError("接続できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  function cancelNicknameEdit() {
    setEditingNickname(false);
    setNicknameInput(nickname);
    setNicknameError("");
  }

  function openDeleteDialog() {
    setOpen(false);
    setDeleteStep(1);
    setDeletePassword("");
    setDeleteError("");
  }

  function closeDeleteDialog() {
    if (busy) return;
    setDeleteStep(0);
    setDeletePassword("");
    setDeleteError("");
  }

  async function deleteAccount(event) {
    event.preventDefault();
    if (busy) return;
    if (!deletePassword) {
      setDeleteError("現在のパスワードを入力してください。");
      return;
    }

    setBusy(true);
    setDeleteError("");
    try {
      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setDeleteError(data.error ?? "アカウントを削除できませんでした。");
        return;
      }
      router.replace("/login?switch=1");
      router.refresh();
    } catch {
      setDeleteError("接続できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="profile-menu" ref={container}>
      {open && (
        <div className="profile-popover" role="menu" aria-label="自分のメニュー">
          {editingNickname ? (
            <form className="profile-nickname-form" onSubmit={saveNickname}>
              <label htmlFor="profile-nickname-input">ニックネーム</label>
              <div>
                <input
                  id="profile-nickname-input"
                  name="nickname"
                  minLength={2}
                  maxLength={20}
                  required
                  autoFocus
                  disabled={busy}
                  value={nicknameInput}
                  onChange={(event) => setNicknameInput(event.target.value)}
                />
                <button type="submit" aria-label="ニックネームを保存" disabled={busy}>
                  <Check size={16} />
                </button>
                <button type="button" aria-label="変更をキャンセル" disabled={busy} onClick={cancelNicknameEdit}>
                  <X size={16} />
                </button>
              </div>
              {nicknameError && <p className="profile-nickname-error" role="alert">{nicknameError}</p>}
            </form>
          ) : (
            <div className="profile-nickname-row">
              <p className="profile-nickname">{nickname}</p>
              <button
                type="button"
                aria-label="ニックネームを変更"
                onClick={() => setEditingNickname(true)}
              >
                <Pencil size={15} strokeWidth={1.5} />
              </button>
            </div>
          )}
          <Link href="/login?switch=1" role="menuitem" className="profile-menu-item">
            <Repeat2 size={17} strokeWidth={1.5} />
            アカウントを切り替える
          </Link>
          {isAdmin && (
            <Link href="/admin" role="menuitem" className="profile-menu-item">
              <ShieldCheck size={17} strokeWidth={1.5} />
              管理画面
            </Link>
          )}
          <button type="button" role="menuitem" onClick={logout} disabled={busy}>
            <LogOut size={17} strokeWidth={1.5} />
            {busy ? "ログアウト中" : "ログアウト"}
          </button>
          <button type="button" role="menuitem" className="profile-delete-account" onClick={openDeleteDialog} disabled={busy}>
            <Trash2 size={17} strokeWidth={1.5} />
            アカウントを削除
          </button>
        </div>
      )}
      {deleteStep > 0 && (
        <div className="account-delete-overlay">
          {deleteStep === 1 ? (
            <section className="account-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-warning-title">
              <span className="account-delete-step">確認 1 / 2</span>
              <h2 id="delete-warning-title">本当にアカウントを削除しますか？</h2>
              <p>投稿、リアクション、立ち止まり記録、ログイン情報がすべて削除されます。この操作は取り消せません。</p>
              <div className="account-delete-actions">
                <button type="button" className="account-delete-cancel" onClick={closeDeleteDialog}>キャンセル</button>
                <button type="button" className="account-delete-next" onClick={() => setDeleteStep(2)}>OK（次へ）</button>
              </div>
            </section>
          ) : (
            <form className="account-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-final-title" onSubmit={deleteAccount}>
              <span className="account-delete-step">確認 2 / 2</span>
              <h2 id="delete-final-title">最後の確認です</h2>
              <p>削除後は復元できません。現在のニックネームも、今後ほかのユーザーは使用できなくなります。</p>
              <label htmlFor="delete-account-password">現在のパスワード</label>
              <input
                id="delete-account-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                disabled={busy}
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
              />
              {deleteError && <p className="account-delete-error" role="alert">{deleteError}</p>}
              <div className="account-delete-actions reversed">
                <button type="submit" className="account-delete-confirm" disabled={busy}>
                  {busy ? "削除中…" : "OK（削除する）"}
                </button>
                <button type="button" className="account-delete-cancel" disabled={busy} onClick={closeDeleteDialog}>キャンセル</button>
              </div>
            </form>
          )}
        </div>
      )}
      <button
        type="button"
        className={`profile-trigger ${open ? "active" : ""}`}
        aria-label="自分のメニュー"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <UserRound size={22} strokeWidth={1.5} />
      </button>
    </div>
  );
}
