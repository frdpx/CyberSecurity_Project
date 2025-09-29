import { createContext, useEffect, useState, useRef } from "react";
import { menu_list } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const url = "http://localhost:4000";
  const [food_list, setFoodList] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState("");
  const currency = "฿";
  const deliveryCharge = 20;
  
  //เพิ่ม refresh interval ref
  const refreshIntervalRef = useRef(null);

  // ฟังก์ชันเช็คว่า token ใกล้หมดอายุหรือยัง (เหลือ 5 นาที)
  const isTokenExpiringSoon = () => {
    const expiresAt = localStorage.getItem("expires_at");
    if (!expiresAt) return true;
    
    const expiryTime = parseInt(expiresAt);
    const currentTime = Date.now();
    const timeLeft = expiryTime - currentTime;
    return timeLeft < 300000;
  };

  // ฟังก์ชัน refresh token
  const refreshToken = async () => {
    try {
      const refresh_token = localStorage.getItem("refresh_token");
      
      if (!refresh_token) {
        throw new Error("No refresh token available");
      }

      console.log("🔄 กำลัง refresh token...");

      const response = await axios.post(
        `${url}/api/auth/refresh`,
        { refresh_token },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const newToken = response.data.data?.access_token;
        const newRefreshToken = response.data.data?.refresh_token;
        const newExpiresAt = response.data.data?.expires_at;

        if (!newToken) {
          throw new Error("No new access token returned");
        }

        // อัพเดท localStorage
        localStorage.setItem("token", newToken);
        localStorage.setItem("refresh_token", newRefreshToken);
        localStorage.setItem("expires_at", newExpiresAt * 1000);

        // อัพเดท state
        setToken(newToken);

        console.log("✅ Refresh token สำเร็จ!");
        toast.success("Session refreshed successfully");
        
        return true;
      } else {
        throw new Error("Refresh failed");
      }
    } catch (error) {
      console.error("❌ Refresh token ล้มเหลว:", error);
      
      // ถ้า refresh ไม่สำเร็จ ให้ logout
      handleLogout();
      toast.error("Session expired. Please login again.");
      
      return false;
    }
  };

  // ฟังก์ชัน logout และเคลียร์ข้อมูล
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("expires_at");
    localStorage.removeItem("user_role");
    setToken("");
    setCartItems({});
    
    // ถ้ามี interval อยู่ให้ clear
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  // ฟังก์ชันเช็ค token และ refresh ถ้าจำเป็น
  const checkAndRefreshToken = async () => {
    const currentToken = localStorage.getItem("token");
    
    if (!currentToken) {
      return;
    }

    if (isTokenExpiringSoon()) {
      console.log("⚠️ Token ใกล้หมดอายุ กำลัง refresh...");
      await refreshToken();
    }
  };

  // เริ่มต้น interval สำหรับเช็ค token ทุก 1 นาที
  useEffect(() => {
    const checkToken = async () => {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) return;

      const expiresAt = localStorage.getItem("expires_at");
      if (!expiresAt) return;
      
      const expiryTime = parseInt(expiresAt);
      const currentTime = Date.now();
      const timeLeft = expiryTime - currentTime;
      
      // ถ้าเหลือเวลาน้อยกว่า 5 นาที (300000 ms)
      if (timeLeft < 300000) {
        console.log("⚠️ Token ใกล้หมดอายุ กำลัง refresh...");
        
        try {
          const refresh_token = localStorage.getItem("refresh_token");
          if (!refresh_token) throw new Error("No refresh token available");

          console.log("🔄 กำลัง refresh token...");

          const response = await axios.post(
            `${url}/api/auth/refresh`,
            { refresh_token },
            { headers: { "Content-Type": "application/json" } }
          );

          if (response.data.success) {
            const newToken = response.data.data?.access_token;
            const newRefreshToken = response.data.data?.refresh_token;
            const newExpiresAt = response.data.data?.expires_at;

            if (!newToken) throw new Error("No new access token returned");

            localStorage.setItem("token", newToken);
            localStorage.setItem("refresh_token", newRefreshToken);
            localStorage.setItem("expires_at", newExpiresAt * 1000);
            setToken(newToken);

            console.log("✅ Refresh token สำเร็จ!");
            toast.success("Session refreshed successfully");
          } else {
            throw new Error("Refresh failed");
          }
        } catch (error) {
          console.error("❌ Refresh token ล้มเหลว:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("expires_at");
          localStorage.removeItem("user_role");
          setToken("");
          setCartItems({});
          toast.error("Session expired. Please login again.");
        }
      }
    };

    if (token) {
      // เช็คทันทีเมื่อ token มีค่า
      checkToken();

      // ตั้ง interval เช็คทุก 1 นาที (60000 ms)
      refreshIntervalRef.current = setInterval(() => {
        checkToken();
      }, 60000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [token]);

  const addToCart = async (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));

    if (token) {
      try {
        await axios.post(
          `${url}/api/cart/add`,
          { itemId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (err) {
        console.error("addToCart error:", err);
      }
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 1) - 1,
    }));

    if (token) {
      try {
        await axios.post(
          `${url}/api/cart/remove`,
          { itemId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (err) {
        console.error("removeFromCart error:", err);
      }
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = food_list.find((p) => p._id === item);
        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  const fetchFoodList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`);
      setFoodList(response.data.data || []);
    } catch (err) {
      console.error("fetchFoodList error:", err.response?.data || err.message);
    }
  };

  const loadCartData = async (token) => {
    const response = await axios.post(
      `${url}/api/cart/get`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    setCartItems(response.data.cartData || {});
  };

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
        await loadCartData(savedToken);
      }
    }
    loadData();
  }, []);

  const contextValue = {
    url,
    food_list,
    menu_list,
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    token,
    setToken,
    loadCartData,
    setCartItems,
    currency,
    deliveryCharge,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;