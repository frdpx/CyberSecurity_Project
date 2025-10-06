import React, { useContext, useState, useEffect } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { debugExpire } from "../../hooks/debugSession";
import ForceChangePasswordPopup from "../ForceChangePasswordPopup/ForceChangePasswordPopup";
import eye from "../../assets/eye.png"; 
import eyeclose from "../../assets/eyeclose.png";

const LoginPopup = ({ setShowLogin, onRequireForceChange }) => {
    const { setToken, loadCartData } = useContext(StoreContext);
    const [currState, setCurrState] = useState("Sign Up");
    const [showForcePasswordChange, setShowForcePasswordChange] =
        useState(false);

    const [data, setData] = useState({
        display_name: "",
        email: "",
        password: "",
    });

    const [showPass, setShowPass] = useState(false); // State สำหรับแสดง/ซ่อนรหัสผ่าน
    const [passwordStrength, setPasswordStrength] = useState(""); // State สำหรับความแข็งแรงรหัสผ่าน
    const [failedAttempts, setFailedAttempts] = useState(0); // นับการล้มเหลว
    const [isLocked, setIsLocked] = useState(false); // สถานะล็อกบัญชี
    const [lockoutTime, setLockoutTime] = useState(null); // เวลาที่ล็อก

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
        if (password.length < 6) {
            return "Weak (must be at least 6 characters)";
        }
        if (
            password.length >= 6 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password)
        ) {
            return "Strong";
        }
        return "Medium (must include uppercase, lowercase, and number)";
    };

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData((prev) => ({ ...prev, [name]: value }));
        if (name === "password" && currState === "Sign Up") {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLocked) {
            toast.error("Account locked. Please try again later.");
            return;
        }
        if (currState === "Sign Up" && passwordStrength !== "Strong") {
            toast.error("Password must include uppercase, lowercase, number, and be at least 6 characters");
            return;
        }

        let apiUrl = "http://localhost:4000/api/auth/";
        apiUrl += currState === "Login" ? "login" : "register";

        try {
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

            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload), // ✅ ส่งเฉพาะข้อมูลที่ต้องใช้
            });

            const resData = await response.json();
            console.log("Response Data:", resData); // Debugging line
            if (currState === "Login") {
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
                    setToken(token);

                    localStorage.setItem("refresh_token", refreshToken);
                    localStorage.setItem("expires_at", expiresAt * 1000);

                    //test session
                    // refresh อัตโนมัติ
                    // debugExpire(5)

                    // expire cuz เป็น string ปลอม
                    //localStorage.setItem("refresh_token", "bb");
                    //debugExpire(5);

                    localStorage.setItem(
                        "user_role",
                        resData.data?.profile?.role || resData.role,
                    );

                    toast.success(`${currState} successful!`);

                    if (
                        resData.data?.profile?.role === "admin" ||
                        resData.role === "admin"
                    ) {
                        window.location.href = "http://localhost:5173/add";
                    } else {
                        // If want to test forece change password flow uncomment below and comment window.location.href = "/"; instead
                        //onRequireForceChange?.();
                        window.location.href = "/";
                    }
                } else {
                    // need to align with team to get a real WORKING Solution for validate Password Expire
                    if (resData.code === "PASSWORD_EXPIRED") {
                        onRequireForceChange?.();
                    }
                    toast.error(resData.message || "Failed to login");
                }
            } else {
                if (resData.success) {
                    toast.success(`${currState} successful! Please log in.`);
                    setCurrState("Login");
                } else {
                    toast.error(resData.message || "Failed to register");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
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
            {showForcePasswordChange && (
                <ForceChangePasswordPopup
                    setForcePasswordChange={setShowForcePasswordChange}
                    setShowLogin={setShowLogin}
                />
            )}
            {!showForcePasswordChange && (
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
                                type={showPass ? "text" : "password"}
                                placeholder="Password"
                                required
                            />
                            <img
                                src={showPass ? eye : eyeclose}
                                alt="Toggle visibility"
                                className="toggle-visibility"
                                onClick={() => setShowPass(!showPass)}
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

                        {currState === "Login" && (
                            <p className="forgot-password">
                                <a href="/forgot-password">Forgot Password</a>
                            </p>
                        )}
                    </div>
                    <button type="submit" disabled={isLocked}>
                        {currState === "Login" ? "Login" : "Create account"}
                    </button>

                    <div className="login-popup-condition">
                        <input type="checkbox" required />
                        <p>
                            By continuing, I agree to the terms of use & privacy
                            policy.
                        </p>
                    </div>

                    {currState === "Login" ? (
                        <p>
                            Create a new account?{" "}
                            <span onClick={() => setCurrState("Sign Up")}>
                                Click here
                            </span>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{" "}
                            <span onClick={() => setCurrState("Login")}>
                                Login here
                            </span>
                        </p>
                    )}
                </form>
            )}
        </div>
    );
};

export default LoginPopup;