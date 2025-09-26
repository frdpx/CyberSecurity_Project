import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(
      "mongodb+srv://cyber:cyber2025@cluster0.zvg3qrz.mongodb.net/food-del"
    )
    .then(() => console.log("DB Connected"));
};
