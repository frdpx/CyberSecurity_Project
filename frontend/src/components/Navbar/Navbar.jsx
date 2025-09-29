import React, { useContext, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
  const navigate = useNavigate();
  const userRole = localStorage.getItem("user_role");

  const logout = async () => {
    try {
      const apiUrl = "http://localhost:4000/api/auth/signout";

      // เรียก API logout (ส่ง token หรือ refresh_token ไปด้วย)
      await axios.post(
        apiUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
    } catch (error) {
      console.error("Logout error:", error.message);
      // ถึง backend error ก็ให้ client เคลียร์ token อยู่ดี
    } finally {
      // เคลียร์ข้อมูลฝั่ง client
      localStorage.removeItem("token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("expires_at");
      localStorage.removeItem("refresh_token");
      setToken("");
      window.location.href = "/";
    }
  };

  return (
    <div className="navbar">
      <Link to="/">
        <img className="logo" src={assets.logo} alt="" />
      </Link>
      {userRole === "admin" ? (
        <div>
          <h2>Admin Panel</h2>
        </div>
      ) : (
        <div>
          <ul className="navbar-menu">
            <Link
              to="/"
              onClick={() => setMenu("home")}
              className={`${menu === "home" ? "active" : ""}`}
            >
              home
            </Link>
            <Link
              to="/"
              onClick={() => {
                setMenu("menu");
                navigate("/");
                setTimeout(() => {
                  document
                    .getElementById("explore-menu")
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className={`${menu === "menu" ? "active" : ""}`}
            >
              menu
            </Link>
            <a
              href="#footer"
              onClick={() => setMenu("contact")}
              className={`${menu === "contact" ? "active" : ""}`}
            >
              contact us
            </a>
          </ul>
        </div>
      )}

      <div className="navbar-right">
        {userRole !== "admin" && (
          <>
            <img src={assets.search_icon} alt="" />
            <Link to="/cart" className="navbar-search-icon">
              <img src={assets.basket_icon} alt="" />
              <div className={getTotalCartAmount() > 0 ? "dot" : ""}></div>
            </Link>
          </>
        )}

        {!token ? (
          <button onClick={() => setShowLogin(true)}>sign in</button>
        ) : (
          <div className="navbar-profile">
            <img src={assets.profile_icon} alt="" />
            <ul className="navbar-profile-dropdown">
              {userRole !== "admin" && (
                <>
                  <li onClick={() => navigate("/myorders")}>
                    <img src={assets.bag_icon} alt="" /> <p>Orders</p>
                  </li>
                  <hr />
                </>
              )}
              <li onClick={logout}>
                <img src={assets.logout_icon} alt="" /> <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
