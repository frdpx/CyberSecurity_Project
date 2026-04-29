import jwt from "jsonwebtoken";
import validator from "validator";
import { findUserByEmail, checkPassword, createUser } from "../services/userService.js";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await checkPassword(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(user._id);

    res.json({
      success: true,
      token,
      role: user.role,
      message: "Login successful",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const exists = await findUserByEmail(email);
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    const user = await createUser(name, email, password, role);

    const token = createToken(user._id);
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const registerAdmin = async (req, res) => {
  const { name, email, password, secret } = req.body;

  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const exists = await findUserByEmail(email);
  if (exists) {
    return res.json({ success: false, message: "Admin already exists" });
  }

  await createUser(name, email, password, "admin");
  res.json({ success: true, message: "Admin created successfully" });
};

export { loginUser, registerUser, registerAdmin };
