const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "shop", unique: true },
    shopName: { type: String, default: "Supekar Garments" },
    shopAddress: { type: String, default: "Kadu Galli, Newasa" },
    shopPhone: { type: String, default: "9011820621" },
    gstNumber: { type: String, default: "" },
    lastBillNumber: { type: Number, default: 0 },
    qtySteps: {
      type: [Number],
      default: [1, 2, 3, 6, 9, 12, 15, 18, 21, 24],
    },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne({ key: "shop" });
  if (!settings) {
    settings = await this.create({ key: "shop" });
  }
  return settings;
};

settingsSchema.statics.nextBillNo = async function () {
  const settings = await this.findOneAndUpdate(
    { key: "shop" },
    { $inc: { lastBillNumber: 1 } },
    { new: true, upsert: true }
  );
  return String(settings.lastBillNumber).padStart(3, "0");
};

module.exports = mongoose.model("Settings", settingsSchema);