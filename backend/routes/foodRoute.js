import multer from "multer";
import express from "express";
import {
  listFood,
  addFood,
  removeFood,
  updateFood,
} from "../controllers/foodController.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const foodRouter = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

foodRouter.get("/list", listFood);

foodRouter.post(
  "/add",
  authMiddleware,
  requireRole("admin"),
  upload.single("image"),
  addFood
);

foodRouter.post("/remove", authMiddleware, requireRole("admin"), removeFood);

foodRouter.put("/update", authMiddleware, requireRole("admin"), updateFood);

export default foodRouter;
