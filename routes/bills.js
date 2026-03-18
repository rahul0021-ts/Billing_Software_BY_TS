const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");
const Customer = require("../models/Customer");
const Settings = require("../models/Settings");
const { verifyToken } = require("../middleware/auth");

// GET /api/bills
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const filter = { isDeleted: false };

    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    if (req.query.phone) {
      filter["customer.phone"] = req.query.phone;
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [count, data] = await Promise.all([
      Bill.countDocuments(filter),
      Bill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    return res.json({
      success: true,
      data: {
        count,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        data,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/bills/stats
router.get("/stats", verifyToken, async (req, res, next) => {
  try {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalBills, todayBills, monthBills, revenueResult] = await Promise.all([
      Bill.countDocuments({ isDeleted: false }),
      Bill.countDocuments({ isDeleted: false, createdAt: { $gte: todayMidnight } }),
      Bill.countDocuments({ isDeleted: false, createdAt: { $gte: firstOfMonth } }),
      Bill.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
      ]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return res.json({
      success: true,
      data: { totalBills, todayBills, monthBills, totalRevenue },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/bills/:id
router.get("/:id", verifyToken, async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill || bill.isDeleted) {
      return res.status(404).json({ error: "NotFound", message: "Bill not found" });
    }
    return res.json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
});

// POST /api/bills
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { items, customer, discount, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "ValidationError", message: "At least one item is required" });
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name) {
        return res.status(400).json({ error: "ValidationError", message: `Item ${i + 1}: name is required` });
      }
      if (!item.size) {
        return res.status(400).json({ error: "ValidationError", message: `Item ${i + 1}: size is required` });
      }
      if (!item.qty || item.qty < 1) {
        return res.status(400).json({ error: "ValidationError", message: `Item ${i + 1}: qty must be at least 1` });
      }
      if (item.rate === undefined || item.rate < 0) {
        return res.status(400).json({ error: "ValidationError", message: `Item ${i + 1}: rate must be 0 or more` });
      }
    }

    const [billNo, settings] = await Promise.all([Settings.nextBillNo(), Settings.getSingleton()]);

    const billItems = items.map((item) => ({
      productId: item.productId || null,
      name: item.name,
      nameHindi: item.nameHindi || "",
      sectionId: item.sectionId || "",
      size: item.size,
      qty: item.qty,
      rate: item.rate,
      amount: Math.round(item.qty * item.rate),
    }));

    const bill = await Bill.create({
      billNo,
      customer: {
        name: customer?.name || "Walk-in Customer",
        phone: customer?.phone || "",
      },
      items: billItems,
      subtotal: 0,
      discount: discount || 0,
      total: 0,
      shopName: settings.shopName,
      shopAddress: settings.shopAddress,
      paymentMethod: paymentMethod || "cash",
    });

    if (customer?.phone) {
      await Customer.findOneAndUpdate(
        { phone: customer.phone },
        {
          $inc: { billCount: 1, totalSpend: bill.total },
          $set: { name: customer.name || "Walk-in Customer", lastVisit: new Date() },
        },
        { upsert: true, new: true }
      );
    }

    return res.status(201).json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bills/:id/whatsapp
router.patch("/:id/whatsapp", verifyToken, async (req, res, next) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, { whatsappSent: true }, { new: true });
    if (!bill) {
      return res.status(404).json({ error: "NotFound", message: "Bill not found" });
    }
    return res.json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/bills/:id (soft delete)
router.delete("/:id", verifyToken, async (req, res, next) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!bill) {
      return res.status(404).json({ error: "NotFound", message: "Bill not found" });
    }
    return res.json({ success: true, data: { message: "Bill deleted" } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;