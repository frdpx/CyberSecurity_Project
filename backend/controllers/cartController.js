import userModel from "../models/userModel.js";


// add to user cart  
const addToCart = async (req, res) => {
   try {
      // ค้นหาผู้ใช้จากฐานข้อมูล
      let userData = await userModel.findOne({ _id: req.body.userId });
      
      // ตรวจสอบว่าพบผู้ใช้หรือไม่
      if (!userData) {
         return res.status(404).json({ success: false, message: "User not found" });
      }

      // ตรวจสอบว่ามี cartData หรือไม่
      let cartData = userData.cartData || {}; // ใช้ {} ถ้า cartData เป็น null หรือ undefined
      if (!cartData[req.body.itemId]) {
         cartData[req.body.itemId] = 1; // ถ้าไม่มีสินค้านั้นในตะกร้าให้เพิ่มเข้าไป
      } else {
         cartData[req.body.itemId] += 1; // ถ้ามีสินค้านั้นอยู่แล้วเพิ่มจำนวน
      }

      // อัพเดต cartData ในฐานข้อมูล
      await userModel.findByIdAndUpdate(req.body.userId, { cartData });
      res.json({ success: true, message: "Added To Cart" });
   } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error" });
   }
}

// remove food from user cart
const removeFromCart = async (req, res) => {
   try {
      let userData = await userModel.findById(req.body.userId);
      
      // ตรวจสอบว่าพบผู้ใช้หรือไม่
      if (!userData) {
         return res.status(404).json({ success: false, message: "User not found" });
      }

      let cartData = userData.cartData || {};
      if (cartData[req.body.itemId] > 0) {
         cartData[req.body.itemId] -= 1; // ลดจำนวนของสินค้าในตะกร้า
      }

      // อัพเดต cartData ในฐานข้อมูล
      await userModel.findByIdAndUpdate(req.body.userId, { cartData });
      res.json({ success: true, message: "Removed From Cart" });
   } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Error" });
   }
}

// get user cart
const getCart = async (req, res) => {
    const { token } = req.headers;
    // การดึงข้อมูลผู้ใช้ตาม token
    const user = await userModel.findOne({ token });
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cartData = user.cartData; // สมมติว่าข้อมูลอยู่ใน user.cartData

    if (!cartData) {
        return res.status(404).json({ success: false, message: 'Cart data not found' });
    }

    return res.status(200).json({ success: true, cartData });
};
export { addToCart, removeFromCart, getCart };
