// hooks/useSession.js
import { useEffect } from "react";
import { toast } from "react-toastify";
import { refreshSession } from "../utils/refreshSession";

export default function useSession(setShowLogin) {
  useEffect(() => {
    const interval = setInterval(async () => {
      const expiresAt = localStorage.getItem("expires_at");

      if (expiresAt && Date.now() >= Number(expiresAt)) {
        console.log("Token expired, trying refresh...");
        const ok = await refreshSession();

        if (!ok) {
          localStorage.clear();
          toast.info("Session expired. Please login again.");
          setShowLogin(true);
        } else {
          console.log("Token refreshed successfully");
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [setShowLogin]);
}
