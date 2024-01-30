import { SessionId } from "convex-helpers/server/sessions.js";
import { useCallback, useState } from "react";

export function useLocalStorage(key: string, initialValue: SessionId) {
  const [value, setValueInternal] = useState<SessionId>(() => {
    if (typeof sessionStorage !== "undefined") {
      const existing = localStorage.getItem(key);
      if (existing !== null) {
        return existing as SessionId;
      }
      localStorage.setItem(key, initialValue);
    }
    return initialValue;
  });
  const setValue = useCallback(
    (value: SessionId) => {
      localStorage.setItem(key, value);
      setValueInternal(value);
    },
    [key]
  );
  return [value, setValue] as any;
}
