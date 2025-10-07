import { useState, useEffect } from "react";
import Home from "./pages/Home/Home";
import Footer from "./components/Footer/Footer";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import Cart from "./pages/Cart/Cart";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import MyOrders from "./pages/MyOrders/MyOrders";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import Sidebar from "./components/Sidebar/Sidebar";
import useSession from "./hooks/useSession";
import ForgotPassword from "./pages/ForgotPassword/Forgotpassword";
import ResetPassword from "./ResetPassword/ResetPassword";
import ForceChangePasswordPopup from "./components/ForceChangePasswordPopup/ForceChangePasswordPopup"; 

const App = () => {
  const userRole = localStorage.getItem("user_role");
  const [showLogin, setShowLogin] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);

  useSession(setShowLogin);

  // no Layout Navbar, Footer
  const noLayoutPages = ["/forgot-password", "/reset-password"];
  const hideLayout = noLayoutPages.includes(location.pathname);

  // Check force password after login
  useEffect(() => {
    const checkForcePassword = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:4000/api/force/check-expiration", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.code === "PASSWORD_EXPIRED") {
          toast.warning("Password expired. Please change your password.");
          setForcePasswordChange(true);
        }
      } catch (err) {
        console.error("Force password check error:", err);
      }
    };

    checkForcePassword();
  }, []);

  return (
    <>
      <ToastContainer />
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
      {forcePasswordChange && (
        <ForceChangePasswordPopup
          setForcePasswordChange={setForcePasswordChange}
          setShowLogin={setShowLogin}
        />
      )}

      <div className="app">
        {!hideLayout && <Navbar setShowLogin={setShowLogin} />}
        {!hideLayout && <hr />}

        {userRole === "admin" ? (
          <div className="app-content">
            <Sidebar />
            <Routes>
              <Route path="/add" element={<Add />} />
              <Route path="/list" element={<List />} />
              <Route path="/orders" element={<Orders />} />
            </Routes>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order" element={<PlaceOrder />} />
            <Route path="/myorders" element={<MyOrders />} />
          </Routes>
        )}

        {/* <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/add" element={<Add />} />
          <Route path="/list" element={<List />} />
          <Route path="/orders" element={<Orders />} />
        </Routes> */}
      </div>
      {!hideLayout && <Footer />}
    </>
  );
};

export default App;
