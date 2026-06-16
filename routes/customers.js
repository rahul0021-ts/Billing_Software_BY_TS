const express = require("express");
const router = express.Router();

const Customer = require("../models/Customer");
const Bill = require("../models/Bill");
const { verifyToken } = require("../middleware/auth");

/* ==========================================================
   GET ALL CUSTOMERS
   GET /api/customers?q=
========================================================== */
router.get("/", verifyToken, async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.q?.trim()) {
      const regex = new RegExp(req.query.q.trim(), "i");

      filter.$or = [
        { name: regex },
        { phone: regex },
        { city: regex },
      ];
    }

    const customers = await Customer.find(filter)
      .sort({ lastVisit: -1, createdAt: -1 })
      .limit(500);

    return res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (err) {
    next(err);
  }
});

/* ==========================================================
   GET CUSTOMER DETAILS + BILL HISTORY
   GET /api/customers/:phone
========================================================== */
router.get("/:phone", verifyToken, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      phone: req.params.phone,
    });

    if (!customer) {
      return res.status(404).json({
        error: "NotFound",
        message: "Customer not found",
      });
    }

    const bills = await Bill.find({
      "customer.phone": req.params.phone,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json({
      success: true,
      data: {
        customer,
        bills,
      },
    });
  } catch (err) {
    next(err);
  }
});

/* ==========================================================
   CREATE CUSTOMER
   POST /api/customers
========================================================== */
router.post("/", verifyToken, async (req, res, next) => {
  try {
    const { name, phone, city } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Customer name is required",
      });
    }

    if (!phone?.trim()) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Phone number is required",
      });
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Phone must be 10 digits",
      });
    }

    const existing = await Customer.findOne({
      phone: phone.trim(),
    });

    if (existing) {
      return res.status(409).json({
        error: "Conflict",
        message: "Customer already exists",
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone.trim(),
      city: city?.trim() || "",
      billCount: 0,
      totalSpend: 0,
      lastVisit: null,
    });

    return res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
});

/* ==========================================================
   UPDATE CUSTOMER
   PUT /api/customers/:phone
========================================================== */
router.put("/:phone", verifyToken, async (req, res, next) => {
  try {
    const { name, city } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        error: "ValidationError",
        message: "Customer name is required",
      });
    }

    const customer = await Customer.findOneAndUpdate(
      {
        phone: req.params.phone,
      },
      {
        name: name.trim(),
        city: city?.trim() || "",
      },
      {
        new: true,
      }
    );

    if (!customer) {
      return res.status(404).json({
        error: "NotFound",
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
});

/* ==========================================================
   DELETE CUSTOMER
   DELETE /api/customers/:phone
========================================================== */
router.delete("/:phone", verifyToken, async (req, res, next) => {
  try {
    const phone = req.params.phone;

    const billCount = await Bill.countDocuments({
      "customer.phone": phone,
      isDeleted: false,
    });

    if (billCount > 0) {
      return res.status(400).json({
        error: "ValidationError",
        message:
          "Cannot delete customer because bill history exists",
      });
    }

    const customer = await Customer.findOneAndDelete({
      phone,
    });

    if (!customer) {
      return res.status(404).json({
        error: "NotFound",
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      data: {
        message: "Customer deleted successfully",
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;