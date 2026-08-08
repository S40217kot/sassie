"use client";

import Link from "next/link";
import { Home, Menu, NotebookText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const container = useRef(null);

  useEffect(() => {
    function close(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div className="header-menu" ref={container}>
      <button
        type="button"
        className="icon-button"
        aria-label="メニュー"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Menu size={23} strokeWidth={1.7} />
      </button>
      {open && (
        <div className="header-menu-popover" role="menu" aria-label="投稿メニュー">
          <Link href="/" role="menuitem" onClick={() => setOpen(false)}>
            <Home size={17} strokeWidth={1.5} />
            タイムライン
          </Link>
          <Link href="/my-posts" role="menuitem" onClick={() => setOpen(false)}>
            <NotebookText size={17} strokeWidth={1.5} />
            自分の投稿
          </Link>
        </div>
      )}
    </div>
  );
}
