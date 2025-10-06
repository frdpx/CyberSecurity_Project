import { useState } from "react";
import Home from "./pages/Home/Home";
import Footer from "./components/Footer/Footer";
import Navbar from "./components/Navbar/Navbar";
import { Route, Routes } from "react-router-dom";
import Cart from "./pages/Cart/Cart";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import MyOrders from "./pages/MyOrders/MyOrders";
import { ToastContainer } from "react-toastify";
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
    console.log("User Role:", userRole); // Debugging line to check the user role
    const [showLogin, setShowLogin] = useState(false);
    const [showForcePasswordChange, setShowForcePasswordChange] =
        useState(false);
    useSession(setShowLogin);

    // no Layout Navbar, Footer
    const noLayoutPages = ["/forgot-password", "/reset-password"];
    const hideLayout = noLayoutPages.includes(location.pathname);

    return (
        <>
            <ToastContainer />
            {showLogin ? (
                <LoginPopup
                    setShowLogin={setShowLogin}
                    onRequireForceChange={() => {
                        setShowLogin(false);
                        setShowForcePasswordChange(true);
                    }}
                />
            ) : (
                <></>
            )}
            {showForcePasswordChange && (
                <ForceChangePasswordPopup
                    setForcePasswordChange={setShowForcePasswordChange}
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
                        <Route
                            path="/forgot-password"
                            element={<ForgotPassword />}
                        />
                        <Route
                            path="reset-password"
                            element={<ResetPassword />}
                        />
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