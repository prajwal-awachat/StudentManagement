import express from "express";
import {
  getSettings,
  updateSettings,
  resetSettings,
} from "../controllers/settingsController.js";
import requireApiKey from "../middleware/apiKey.js";

const router = express.Router();

router.get("/", getSettings);
router.put("/", requireApiKey, updateSettings);
router.post("/reset", requireApiKey, resetSettings);

export default router;
