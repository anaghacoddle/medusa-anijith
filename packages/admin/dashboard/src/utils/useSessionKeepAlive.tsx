import { useEffect, useRef } from "react";
import { useKeepAlive } from "../hooks/api/session";
import { toast } from "@medusajs/ui";
import axios from "axios";

const useSessionKeepAlive = (intervalMs = 6 * 60 * 1000) => {
  const activityRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasShownErrorRef = useRef(false);
  const keepAlive = useKeepAlive();

  // Handle errors from keep-alive API
  useEffect(() => {
    if (keepAlive.isError && keepAlive.error && !hasShownErrorRef.current) {
      if (axios.isAxiosError(keepAlive.error)) {
        const status = keepAlive.error.response?.status;
        const errorData = keepAlive.error.response?.data as any;

        if (status === 403) {
          hasShownErrorRef.current = true;

          if (errorData?.code === "account_suspended") {
            toast.error("Account Suspended", {
              description:
                errorData.message ||
                "This account has been suspended. Please contact support for assistance.",
              duration: 10000,
            });
          } else if (errorData?.code === "inactive_user") {
            toast.error("Account Inactive", {
              description:
                errorData.message ||
                "Your account is inactive. Please contact support for assistance.",
              duration: 10000,
            });
          }
        }
      }
    }
  }, [keepAlive.isError, keepAlive.error]);

  useEffect(() => {
    const markActive = () => (activityRef.current = true);
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, markActive));

    timerRef.current = setInterval(() => {
      if (activityRef.current) {
        keepAlive.refetch(); // <-- call refetch, not mutate
        activityRef.current = false;
      }
    }, intervalMs);

    return () => {
      events.forEach(e => window.removeEventListener(e, markActive));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, keepAlive]);

  return keepAlive; // optional: expose status if needed
};

export default useSessionKeepAlive;
