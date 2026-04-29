import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";

// Service: Find user by email
export const findUserByEmail = async (email) => {
  return await userModel.findOne({ email });
};

// Service: Check password
export const checkPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Service: Create new user
export const createUser = async (name, email, password, role = "customer") => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = new userModel({
    name,
    email,
    password: hashedPassword,
    role,
  });

  return await newUser.save();
};
