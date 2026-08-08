"use client";

import Link from "next/link";
import { LogOut, Repeat2, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function ProfileMenu({ nickname, isAdmin = false }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const container = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function close(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

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
          <p className="profile-nickname">{nickname}</p>
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
