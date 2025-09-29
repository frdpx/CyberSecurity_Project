import React, { useContext, useState } from "react";
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
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
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
          resData.data?.session?.expires_at || resData.data?.expires_at || null;

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
          resData.data?.profile?.role || resData.role
        );

        toast.success(`${currState} successful!`);

        if (
          resData.data?.profile?.role === "admin" ||
          resData.role === "admin"
        ) {
          window.location.href = "http://localhost:5173/add";
        } else {
          window.location.href = "/";
        }
      } else {
        toast.error(resData.message || "Failed to login");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="login-popup">
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
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Password"
            required
          />

          {currState === "Login" && (
            <p className="forgot-password">
              <a href="/forgot-password">ลืมรหัสผ่าน?</a>
            </p>
          )}
        </div>
        <button type="submit">
          {currState === "Login" ? "Login" : "Create account"}
        </button>

        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>

        {currState === "Login" ? (
          <p>
            Create a new account?{" "}
            <span onClick={() => setCurrState("Sign Up")}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <span onClick={() => setCurrState("Login")}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;
