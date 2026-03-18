const express = require("express");
const router = express.Router();
const Section = require("../models/Section");
const { verifyToken } = require("../middleware/auth");

// GET /api/sections
router.get("/", async (req, res, next) => {
  try {
    const sections = await Section.find({ isActive: true }).sort({ order: 1 });
    return res.json({ success: true, data: sections });
  } catch (err) {
    next(err);
  }
});

// GET /api/sections/:sectionId
router.get("/:sectionId", async (req, res, next) => {
  try {
    const section = await Section.findOne({ sectionId: req.params.sectionId });
    if (!section) {
      return res.status(404).json({ error: "NotFound", message: "Section not found" });
    }
    return res.json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
});

// POST /api/sections
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { sectionId, label, order, subsections } = req.body;
    if (!sectionId || !label) {
      return res.status(400).json({ error: "ValidationError", message: "sectionId and label are required" });
    }
    const section = await Section.create({ sectionId, label, order: order || 0, subsections: subsections || [] });
    return res.status(201).json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
});

// PUT /api/sections/:sectionId
router.put("/:sectionId", verifyToken, async (req, res, next) => {
  try {
    const { label, order, isActive } = req.body;
    const updateData = {};
    if (label !== undefined) updateData.label = label;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const section = await Section.findOneAndUpdate({ sectionId: req.params.sectionId }, updateData, {
      new: true,
      runValidators: true,
    });
    if (!section) {
      return res.status(404).json({ error: "NotFound", message: "Section not found" });
    }
    return res.json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
});

// POST /api/sections/:sectionId/subsections
router.post("/:sectionId/subsections", verifyToken, async (req, res, next) => {
  try {
    const { id, label, defaultSizes, order } = req.body;
    if (!id || !label) {
      return res.status(400).json({ error: "ValidationError", message: "id and label are required for subsection" });
    }
    const section = await Section.findOneAndUpdate(
      { sectionId: req.params.sectionId },
      { $push: { subsections: { id, label, defaultSizes: defaultSizes || [], order: order || 0 } } },
      { new: true }
    );
    if (!section) {
      return res.status(404).json({ error: "NotFound", message: "Section not found" });
    }
    return res.json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sections/:sectionId/subsections/:subId
router.delete("/:sectionId/subsections/:subId", verifyToken, async (req, res, next) => {
  try {
    const section = await Section.findOneAndUpdate(
      { sectionId: req.params.sectionId },
      { $pull: { subsections: { id: req.params.subId } } },
      { new: true }
    );
    if (!section) {
      return res.status(404).json({ error: "NotFound", message: "Section not found" });
    }
    return res.json({ success: true, data: section });
  } catch (err) {
    next(err);
  }
});

module.exports = router;