const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Bill = require("../models/Bill");
const { verifyToken } = require("../middleware/auth");

// GET /api/customers
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.q) {
      const regex = new RegExp(req.query.q.trim(), "i");
      filter.$or = [{ name: regex }, { phone: regex }];
    }
    const customers = await Customer.find(filter).sort({ lastVisit: -1 }).limit(50);
    return res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
});

// GET /api/customers/:phone
router.get("/:phone", verifyToken, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ phone: req.params.phone });
    if (!customer) {
      return res.status(404).json({ error: "NotFound", message: "Customer not found" });
    }
    const bills = await Bill.find({ "customer.phone": req.params.phone, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(10);
    return res.json({ success: true, data: { customer, bills } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/customers/:phone
router.put("/:phone", verifyToken, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "ValidationError", message: "Name is required" });
    }
    const customer = await Customer.findOneAndUpdate(
      { phone: req.params.phone },
      { name: name.trim() },
      { new: true }
    );
    if (!customer) {
      return res.status(404).json({ error: "NotFound", message: "Customer not found" });
    }
    return res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
});

module.exports = router;