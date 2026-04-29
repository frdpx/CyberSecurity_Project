import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../utils/axiosInstance";

const useForcePassword = () => {
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  useEffect(() => {
    const checkForcePassword = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axiosInstance.get("/api/force/check-expiration");
        if (res.data.code === "PASSWORD_EXPIRED") {
          toast.warning("Password expired. Please change your password.");
          setForcePasswordChange(true);
        }
      } catch (err) {
        console.error("Force password check error:", err);
      }
    };

    checkForcePassword();
  }, []);

  return { forcePasswordChange, setForcePasswordChange };
};

export default useForcePassword;
