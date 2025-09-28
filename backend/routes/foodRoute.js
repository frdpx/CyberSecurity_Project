import multer from "multer";
import express from "express";
import {
  listFood,
  addFood,
  removeFood,
  updateFood
} from "../controllers/foodController.js";
import { authMiddleware } from "../middleware/auth.js";
// import { requireRole } from "../middleware/role.js";
import { supabaseAuthMiddleware, requireRole } from "../middleware/auth.js";

const foodRouter = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });
foodRouter.use(supabaseAuthMiddleware);
foodRouter.get("/list", listFood);

foodRouter.post("/add", requireRole("admin"), upload.single("image"), addFood);

foodRouter.post("/remove", requireRole("admin"), removeFood);

foodRouter.put("/update", requireRole("admin"), updateFood);

export default foodRouter;
