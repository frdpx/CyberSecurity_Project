import mongoose from "mongoose";

export const connectDB = async() => {
    await mongoose.connect('mongodb+srv://srkkh0110:srkkh0110@cluster0.fefqy.mongodb.net/food-del').then(()=>console.log("DB Connected"));
}