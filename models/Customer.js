const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    totalSpend: { type: Number, default: 0 },
    billCount: { type: Number, default: 0 },
    lastVisit: { type: Date, default: null },
  },
  { timestamps: true }
);

customerSchema.index({ name: "text" });

module.exports = mongoose.model("Customer", customerSchema);