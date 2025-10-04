import React, { useContext, useState, useEffect } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { debugExpire } from "../../hooks/debugSession";

const LoginPopup = ({ setShowLogin }) => {
  const { setToken, loadCartData } = useContext(StoreContext);
  const [currState, setCurrState] = useState("Sign Up");
  const [data, setData] = useState({
    display_name: "",
    email: "",
    password: "",
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(null);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedAttempts = parseInt(localStorage.getItem("failed_attempts") || "0");
    const savedLockTime = localStorage.getItem("lockout_time");
    setFailedAttempts(savedAttempts);
    if (savedLockTime) {
      const now = Date.now();
      if (now - parseInt(savedLockTime) < 5 * 60 * 1000) {
        setIsLocked(true);
        setLockoutTime(parseInt(savedLockTime));
      } else {
        localStorage.removeItem("lockout_time");
        localStorage.removeItem("failed_attempts");
      }
    }
  }, []);

  useEffect(() => {
    if (isLocked) {
      const timer = setInterval(() => {
        const now = Date.now();
        if (now - lockoutTime >= 5 * 60 * 1000) {
          setIsLocked(false);
          setFailedAttempts(0);
          localStorage.removeItem("lockout_time");
          localStorage.removeItem("failed_attempts");
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  const checkPasswordStrength = (password) => {
    if (password.length < 6) return "Weak";
    if (
      password.length >= 6 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    )
      return "Strong";
    return "Medium";
  };

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prev) => ({ ...prev, [name]: value }));
    if ((name === "newPassword" && forcePasswordChange) || (name === "password" && currState === "Sign Up")) {
      setPasswordStrength(checkPasswordStrength(value));
    } else {
      setPasswordStrength("");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLocked) {
      toast.error("Account locked. Please try again later.");
      return;
    }
    if ((currState === "Sign Up" || forcePasswordChange) && passwordStrength !== "Strong") {
      toast.error("Password must include uppercase, lowercase, number, and be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      let apiUrl = "http://localhost:4000/api/auth/";
      apiUrl += currState === "Login" ? "login" : "register";

      const payload =
        currState === "Login"
          ? { 
              email: data.email,
              password: data.password, 
            }
          : { 
              display_name: data.display_name,
              email: data.email, 
              password: data.password, 
            };
      console.log("Sending payload:", payload);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), // ✅ ส่งเฉพาะข้อมูลที่ต้องใช้
      });
      console.log("Response status:", response.status);
      const resData = await response.json();
      console.log("Response data:", resData);

      if (resData.success) {
        const token = 
          resData.data?.session?.access_token || 
          resData.data?.access_token || 
          null;
        const refreshToken = 
          resData.data?.session?.refresh_token || 
          resData.data?.refresh_token || 
          null;
        const expiresAt = 
          resData.data?.session?.expires_at || 
          resData.data?.expires_at || 
          null;

        if (!token) throw new Error("No access token returned");

        localStorage.setItem("token", token);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("expires_at", expiresAt * 1000);
        localStorage.setItem("user_role", resData.data?.profile?.role || resData.role);

        setToken(token);
        loadCartData(token);
        setFailedAttempts(0);
        localStorage.removeItem("failed_attempts");
        localStorage.removeItem("lockout_time");

        // ดึง profile หลัง login เพื่อเช็ค password_changed_at
        const profileResponse = await fetch("http://localhost:4000/api/auth/profile", {
          method: "GET",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        });
        const profileData = await profileResponse.json();
        if (profileData.success && profileData.data) {
          const passwordChangedAt = profileData.data.password_changed_at || null;
          localStorage.setItem("password_changed_at", passwordChangedAt || Date.now());

          const lastChanged = parseInt(passwordChangedAt) || Date.now();
          const now = Date.now();
          const daysSinceChange = Math.floor((now - lastChanged) / (1000 * 60 * 60 * 24));
          if (daysSinceChange > 90) {
            setForcePasswordChange(true);
          } else {
            setShowLogin(false);
            if (resData.data?.profile?.role === "admin" || resData.role === "admin") {
              window.location.href = "http://localhost:5173/add";
            } else {
              window.location.href = "/";
            }
          }
        } else {
          setShowLogin(false);
          if (resData.data?.profile?.role === "admin" || resData.role === "admin") {
            window.location.href = "http://localhost:5173/add";
          } else {
            window.location.href = "/";
          }
        }
      } else if (currState === "Login") {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem("failed_attempts", newAttempts);
        toast.info(`Failed attempts: ${newAttempts}`);

        if (newAttempts >= 5) {
          setIsLocked(true);
          const now = Date.now();
          setLockoutTime(now);
          localStorage.setItem("lockout_time", now);
          toast.error("Too many failed attempts. Locked for 5 minutes.");
        } else {
          toast.error(resData.message || "Failed to login");
        }
      } else {
        toast.error(resData.message || "Failed to register");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong");
      if (currState === "Login") {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem("failed_attempts", newAttempts);
        toast.info(`Failed attempts: ${newAttempts}`);

        if (newAttempts >= 5) {
          setIsLocked(true);
          const now = Date.now();
          setLockoutTime(now);
          localStorage.setItem("lockout_time", now);
          toast.error("Too many failed attempts. Locked for 5 minutes.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForcePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordStrength !== "Strong") {
      toast.error("New password must include uppercase, lowercase, number, and be at least 6 characters");
      return;
    }
    if (data.newPassword !== data.confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/force/force-password-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        }),
      });
      const resData = await response.json();
      console.log("Force password change response:", resData);

      if (resData.success) {
        const newPasswordChangedAt = resData.data?.password_changed_at || Date.now();
        localStorage.setItem("password_changed_at", newPasswordChangedAt);

        const updateResponse = await fetch("http://localhost:4000/api/auth/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            password_changed_at: new Date(newPasswordChangedAt).toISOString(),
          }),
        });
        const updateResData = await updateResponse.json();
        if (updateResData.success) {
          console.log("Profile updated successfully");
        } else {
          console.warn("Failed to update profile:", updateResData.message);
        }

        toast.success("Password changed successfully! Please log in again.");
        setForcePasswordChange(false);
        setData({ ...data, oldPassword: "", newPassword: "", confirmNewPassword: "" });
        localStorage.removeItem("token");
        setShowLogin(false);
        setShowLogin(true);
      } else {
        toast.error(resData.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getLockoutTimeRemaining = () => {
    if (!lockoutTime) return "";
    const now = Date.now();
    const timeLeft = 5 * 60 * 1000 - (now - lockoutTime);
    if (timeLeft <= 0) return "";
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="login-popup">
      {forcePasswordChange && (
        <div className="password-reminder-popup">
          <div className="password-reminder-content">
            <div className="login-popup-title">
              <h3>Password Expired</h3>
              <img
                onClick={() => { setForcePasswordChange(false); setShowLogin(false); }}
                src={assets.cross_icon || "/default-cross-icon.png"}
                alt="close"
                style={{ width: "16px", height: "16px", cursor: "pointer", marginLeft: "auto" }}
              />
            </div>
            <p style={{ margin: "15px 0", color: "#666", fontSize: "14px" }}>Please change your password!</p>
            <div className="login-popup-inputs">
              <div className="password-input-container">
                <input
                  name="oldPassword"
                  onChange={onChangeHandler}
                  value={data.oldPassword}
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Old Password"
                  required
                />
                <img
                  src={showOldPassword ? (assets["close-eye"] || "/open-eye.png") : (assets["open-eye"] || "/close-eye.png")}
                  alt={showOldPassword ? "Hide old password" : "Show old password"}
                  className="password-toggle-icon"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                />
              </div>
              <div className="password-input-container">
                <input
                  name="newPassword"
                  onChange={onChangeHandler}
                  value={data.newPassword}
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  required
                />
                <img
                  src={showNewPassword ? (assets["close-eye"] || "/open-eye.png") : (assets["open-eye"] || "/close-eye.png")}
                  alt={showNewPassword ? "Hide new password" : "Show new password"}
                  className="password-toggle-icon"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                />
              </div>
              <div className="password-input-container">
                <input
                  name="confirmNewPassword"
                  onChange={onChangeHandler}
                  value={data.confirmNewPassword}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  required
                />
                <img
                  src={showConfirmPassword ? (assets["close-eye"] || "/open-eye.png") : (assets["open-eye"] || "/close-eye.png")}
                  alt={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className="password-toggle-icon"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>
              <p className="password-requirements">
                New password must include uppercase, lowercase, number, and be at least 6 characters
              </p>
            </div>
            <button onClick={handleForcePasswordChange} disabled={loading}>
              {loading ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>
      )}
      {!forcePasswordChange && (
        <form onSubmit={handleLogin} className="login-popup-container">
          <div className="login-popup-title">
            <h2>{currState}</h2>
            <img
              onClick={() => setShowLogin(false)}
              src={assets.cross_icon}
              alt="close"
            />
          </div>
          <div className="login-popup-inputs">
            {currState === "Sign Up" && (
              <input
                name="display_name"
                onChange={onChangeHandler}
                value={data.display_name}
                type="text"
                placeholder="Your name"
                required
              />
            )}
            <input
              name="email"
              onChange={onChangeHandler}
              value={data.email}
              type="email"
              placeholder="Your email"
              required
            />
            <div className="password-input-container">
              <input
                name="password"
                onChange={onChangeHandler}
                value={data.password}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
              />
              <img
                src={showPassword ? (assets["close-eye"] || "/open-eye.png") : (assets["open-eye"] || "/close-eye.png")}
                alt={showPassword ? "Hide password" : "Show password"}
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>
            {currState === "Sign Up" && (
              <p className="password-requirements">
                Password must include uppercase, lowercase, number, and be at least 6 characters
              </p>
            )}
            {currState === "Sign Up" && passwordStrength && (
              <p className={`password-strength ${passwordStrength.toLowerCase()}`}>
                Password Strength: {passwordStrength}
              </p>
            )}
            {isLocked && (
              <p className="lockout-message">
                Account locked. Time remaining: {getLockoutTimeRemaining()}
              </p>
            )}
          </div>
          <button type="submit" disabled={isLocked || loading}>
            {currState === "Login" ? "Login" : "Create account"}
          </button>
          <div className="login-popup-condition">
            <input type="checkbox" required />
            <p>By continuing, I agree to the terms of use & privacy policy.</p>
          </div>
          
          {currState === "Login" && (
            <p>
              Create a new account?{" "}
              <span onClick={() => setCurrState("Sign Up")}>Click here</span>
            </p>
          )}
          {currState === "Sign Up" && (
            <p>
              Already have an account?{" "}
              <span onClick={() => setCurrState("Login")}>Login here</span>
            </p>
          )}
        </form>
      )}
    </div>
  );
};

export default LoginPopup;
