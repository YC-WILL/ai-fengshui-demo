"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

export function useFormDraft<T>(key: string, initial: T | (() => T)) {
  const initialRef = useRef<T>(typeof initial === "function" ? (initial as () => T)() : initial);
  const [value, setValue] = useState<T>(initialRef.current);
  const [ready, setReady] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const loadedRef = useRef(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        if (JSON.stringify(parsed) !== JSON.stringify(initialRef.current)) {
          setValue(parsed);
          setHasDraft(true);
          loadedRef.current = true;
        } else {
          window.localStorage.removeItem(key);
        }
      }
    } catch { /* fall back to in-memory form state */ }
    finally { setReady(true); }
  }, [key]);

  useEffect(() => {
    if (!ready || (!loadedRef.current && !dirtyRef.current)) return;
    try { window.localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* storage limits/private mode must not block generation */ }
  }, [key, ready, value]);

  const update: Dispatch<SetStateAction<T>> = action => {
    dirtyRef.current = true;
    setValue(action);
  };

  const clear = () => {
    setValue(initialRef.current);
    setHasDraft(false);
    loadedRef.current = false;
    dirtyRef.current = false;
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
  };
  return [value, update, clear, hasDraft] as [T, Dispatch<SetStateAction<T>>, () => void, boolean];
}
