const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Product = require("../models/Product");
const { verifyToken } = require("../middleware/auth");

// GET /api/products
router.get("/", async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.sectionId) filter.sectionId = req.query.sectionId;
    const products = await Product.find(filter).sort({ sectionId: 1, name: 1 });
    return res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

// GET /api/products/search?q=
router.get("/search", async (req, res, next) => {
  try {
    const q = req.query.q || "";
    if (!q.trim()) return res.json({ success: true, data: [] });
    const regex = new RegExp(q.trim(), "i");
    const products = await Product.find({
      isActive: true,
      $or: [{ name: regex }, { nameHindi: regex }],
    }).limit(30);
    return res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

// GET /api/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "NotFound", message: "Product not found" });
    return res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// POST /api/products
router.post(
  "/",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Product name is required"),
    body("sectionId").notEmpty().withMessage("Section ID is required"),
    body("sizes").isArray({ min: 1 }).withMessage("At least one size is required"),
    body("rates").isObject().withMessage("Rates must be an object"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "ValidationError", message: errors.array()[0].msg });
      }

      const { name, nameHindi, sectionId, sizes, rates, defaultQty } = req.body;

      const cleanSizes = sizes.map((s) => String(s).trim()).filter((s) => s.length > 0);
      if (cleanSizes.length === 0) {
        return res.status(400).json({ error: "ValidationError", message: "At least one valid size is required" });
      }

      const cleanRates = {};
      for (const size of cleanSizes) {
        if (rates[size] !== undefined && !isNaN(Number(rates[size]))) {
          cleanRates[size] = Number(rates[size]);
        }
      }

      const product = await Product.create({
        name: name.trim(),
        nameHindi: nameHindi ? nameHindi.trim() : "",
        sectionId,
        sizes: cleanSizes,
        rates: cleanRates,
        defaultQty: defaultQty && Number(defaultQty) >= 1 ? Math.floor(Number(defaultQty)) : 1,
      });

      return res.status(201).json({ success: true, data: product });
    } catch (err) { next(err); }
  }
);

// PUT /api/products/:id
router.put("/:id", verifyToken, async (req, res, next) => {
  try {
    // ✅ defaultQty now included
    const { name, nameHindi, sectionId, sizes, rates, defaultQty } = req.body;

    const updateData = {};
    if (name !== undefined)      updateData.name      = String(name).trim();
    if (nameHindi !== undefined) updateData.nameHindi = String(nameHindi).trim();
    if (sectionId !== undefined) updateData.sectionId = sectionId;

    // ✅ Save defaultQty if provided
    if (defaultQty !== undefined) {
      updateData.defaultQty = Math.max(1, Math.floor(Number(defaultQty)));
    }

    if (sizes !== undefined) {
      const cleanSizes = sizes.map((s) => String(s).trim()).filter((s) => s.length > 0);
      if (cleanSizes.length === 0) {
        return res.status(400).json({ error: "ValidationError", message: "At least one valid size is required" });
      }
      updateData.sizes = cleanSizes;

      if (rates !== undefined) {
        const cleanRates = {};
        for (const size of cleanSizes) {
          if (rates[size] !== undefined && !isNaN(Number(rates[size]))) {
            cleanRates[size] = Number(rates[size]);
          }
        }
        updateData.rates = cleanRates;
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: "NotFound", message: "Product not found" });

    return res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// PATCH /api/products/:id/toggle
router.patch("/:id/toggle", verifyToken, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "NotFound", message: "Product not found" });
    product.isActive = !product.isActive;
    await product.save();
    return res.json({ success: true, data: product });
  } catch (err) { next(err); }
});

// DELETE /api/products/:id (soft delete)
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: "NotFound", message: "Product not found" });
    return res.json({ success: true, data: { message: "Product deactivated" } });
  } catch (err) { next(err); }
});

module.exports = router;
