import foodModel from "../models/foodModel.js";
import fs from "fs";

// Service: List all foods
export const getAllFoods = async () => {
  return await foodModel.find({});
};

// Service: Add a new food
export const createFood = async (foodData) => {
  const food = new foodModel(foodData);
  await food.save();
  return food;
};

// Service: Remove a food
export const deleteFood = async (id) => {
  const food = await foodModel.findById(id);
  if (food) {
    fs.unlink(`uploads/${food.image}`, () => {});
    await foodModel.findByIdAndDelete(id);
  }
  return food;
};

// Service: Update a food
export const editFood = async (id, updateData) => {
  return await foodModel.findByIdAndUpdate(id, updateData, { new: true });
};
