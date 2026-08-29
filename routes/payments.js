const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const Bill = require("../models/Bill");
const { verifyToken } = require("../middleware/auth");

// GET /api/payments/dues
// One row per customer with an outstanding balance:
//   remaining = (sum of all their bill totals)
//             - (sum of amountPaid recorded at bill creation time)
//             - (sum of all Payment records made later)
// Only customers with remaining > 0 are returned, sorted highest-due
// first. This is intentionally NOT stored anywhere — always computed
// fresh from Bill + Payment so the two can never drift out of sync.
router.get("/dues", verifyToken, async (req, res, next) => {
  try {
    const billTotals = await Bill.aggregate([
      { $match: { isDeleted: false, "customer.phone": { $ne: "" } } },
      {
        $group: {
          _id: "$customer.phone",
          name: { $last: "$customer.name" },
          totalBilled: { $sum: "$total" },
          totalPaidAtCreation: { $sum: "$amountPaid" },
        },
      },
    ]);

    const paymentTotals = await Payment.aggregate([
      {
        $group: {
          _id: "$customer.phone",
          totalPaidLater: { $sum: "$amount" },
        },
      },
    ]);

    const paymentMap = new Map(
      paymentTotals.map((p) => [p._id, p.totalPaidLater])
    );

    const dues = billTotals
      .map((b) => {
        const totalPaidLater = paymentMap.get(b._id) || 0;
        const totalPaid = (b.totalPaidAtCreation || 0) + totalPaidLater;
        const remaining = Math.round(b.totalBilled - totalPaid);

        return {
          phone: b._id,
          name: b.name,
          totalBilled: Math.round(b.totalBilled),
          totalPaid: Math.round(totalPaid),
          remaining,
        };
      })
      .filter((d) => d.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining);

    return res.json({ success: true, data: dues });
  } catch (err) {
    next(err);
  }
});

// GET /api/payments?phone=xxx
// Payment history for one customer (or everyone, if no phone given) —
// useful for a "payment history" detail view on the dues page.
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.phone) filter["customer.phone"] = req.query.phone;

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments
// Record a new payment against a customer's running balance.
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { phone, name, amount, method, note } = req.body;

    if (!phone) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Customer phone is required",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Amount must be greater than 0",
      });
    }

    const payment = await Payment.create({
      customer: { name: name || "", phone },
      amount,
      method: method || "cash",
      note: note || "",
    });

    return res.status(201).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
});

module.exports = router;