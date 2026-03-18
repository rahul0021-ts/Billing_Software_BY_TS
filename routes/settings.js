const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");
const { verifyToken } = require("../middleware/auth");

// GET /api/settings
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const settings = await Settings.getSingleton();
    const data = settings.toObject();
    delete data.key;
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings
router.put("/", verifyToken, async (req, res, next) => {
  try {
    const allowed = ["shopName", "shopAddress", "shopPhone", "gstNumber", "qtySteps"];
    const updateData = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "ValidationError", message: "No valid fields provided" });
    }

    const settings = await Settings.findOneAndUpdate(
      { key: "shop" },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    const data = settings.toObject();
    delete data.key;
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;