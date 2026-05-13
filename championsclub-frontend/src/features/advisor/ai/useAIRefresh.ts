import { useCallback, useEffect, useRef, useState } from "react";

const COOLDOWN_SECONDS = 300;

type RefreshFn = () => Promise<void> | void;

export function useAIRefresh(refreshFn: RefreshFn) {
  const [refreshing, setRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const refresh = useCallback(async () => {
    if (refreshing || cooldown > 0) return;
    setRefreshing(true);
    let succeeded = false;
    try {
      await refreshFn();
      succeeded = true;
    } catch (error) {
      console.error("AI insight refresh failed", error);
    } finally {
      setRefreshing(false);
      if (!succeeded) return;

      setCooldown(COOLDOWN_SECONDS);
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      timerRef.current = window.setInterval(() => {
        setCooldown((s) => {
          if (s <= 1) {
            if (timerRef.current !== null) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
  }, [refreshing, cooldown, refreshFn]);

  return { refreshing, cooldown, refresh };
}
