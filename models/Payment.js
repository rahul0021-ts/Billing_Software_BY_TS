const mongoose = require("mongoose");

// A payment made against a CUSTOMER's running balance — not tied to one
// specific bill. This is what lets "pay ₹2000 today" reduce the
// customer's total due across every bill they've ever had, without
// needing to pick which particular old bill it applies to.
const paymentSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, default: "" },
      phone: { type: String, required: true },
    },

    amount: { type: Number, required: true, min: 0.01 },

    method: {
      type: String,
      default: "cash",
    },

    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

paymentSchema.index({ "customer.phone": 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);