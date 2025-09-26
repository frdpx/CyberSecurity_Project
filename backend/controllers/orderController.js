import orderModel from "../models/orderModel.js"; 
import userModel from "../models/userModel.js"; 


const currency = "THB";
const deliveryCharge = 20;
const frontend_URL = 'http://localhost:5173';


const placeOrderCod = async (req, res) => {
    try {
        
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            payment: true, 
        });

        await newOrder.save();

        
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        
        res.json({ success: true, message: "Order Placed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const listOrders = async (req, res) => {
    try {
       
        const orders = await orderModel.find({});

        res.json({ success: true, data: orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId });

        res.json({ success: true, data: orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const updateStatus = async (req, res) => {
    console.log(req.body);
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });

        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        res.json({ success: false, message: "Error" });
    }
}

export { listOrders, userOrders, updateStatus,placeOrderCod };
