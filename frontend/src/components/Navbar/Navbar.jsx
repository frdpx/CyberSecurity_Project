import React, { useContext, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
  const navigate = useNavigate();
  const userRole = localStorage.getItem("user_role");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    setToken("");
    // navigate("/");
    window.location.href = "/";
  };

  return (
    <div className="navbar">
      <Link to="/">
        <img className="logo" src={assets.logo} alt="" />
      </Link>
      {userRole === "admin" ? (
        <div>
          {/* <img className="logo" src={assets.logo} alt="admin-parnel" /> */}
          <h2>Admin Parnel</h2>
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
              {" "}
              menu{" "}
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
                    {" "}
                    <img src={assets.bag_icon} alt="" /> <p>Orders</p>
                  </li>
                  <hr />
                </>
              )}
              {/* <li onClick={() => navigate("/myorders")}>
                {" "}
                <img src={assets.bag_icon} alt="" /> <p>Orders</p>
              </li>
              <hr /> */}
              <li onClick={logout}>
                {" "}
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
