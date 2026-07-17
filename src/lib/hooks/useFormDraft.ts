"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

export function useFormDraft<T>(key: string, initial: T | (() => T)) {
  const initialRef = useRef<T>(typeof initial === "function" ? (initial as () => T)() : initial);
  const [value, setValue] = useState<T>(initialRef.current);
  const [ready, setReady] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) { setValue(JSON.parse(raw) as T); setHasDraft(true); }
    } catch { /* fall back to in-memory form state */ }
    finally { setReady(true); }
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* storage limits/private mode must not block generation */ }
  }, [key, ready, value]);

  const clear = () => {
    setValue(initialRef.current);
    setHasDraft(false);
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
  };
  return [value, setValue, clear, hasDraft] as [T, Dispatch<SetStateAction<T>>, () => void, boolean];
}
