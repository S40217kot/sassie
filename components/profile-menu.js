"use client";

import Link from "next/link";
import { Check, LogOut, Pencil, Repeat2, ShieldCheck, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function ProfileMenu({ nickname, isAdmin = false }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(nickname);
  const [nicknameError, setNicknameError] = useState("");
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
