"use client";

import { useEffect, useState } from "react";
import MeActions from "./MeActions";
import DeleteAccountButton from "./DeleteAccountButton";

export default function AccountDrawer({
  email,
  nickname
}: {
  email: string | null;
  nickname: string | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="me-account-pill"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden>人</span>
        账户
      </button>

      {open && (
        <div className="me-account-overlay" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="me-account-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="me-account-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <header>
              <div>
                <span>我的账户</span>
                <h2 id="me-account-title">账户与隐私</h2>
              </div>
              <button type="button" aria-label="关闭账户设置" onClick={() => setOpen(false)}>×</button>
            </header>
            <MeActions email={email} nickname={nickname} />
            <section className="me-privacy-card">
              <div><span>隐私与数据</span><h3>你的记录，由你决定保留多久</h3></div>
              <p>可随时删除账户、生辰、四盘报告与求签记录。删除后无法恢复。</p>
              <DeleteAccountButton />
            </section>
          </section>
        </div>
      )}
    </>
  );
}
