const mongoose = require("mongoose");

const subsectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    defaultSizes: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    order: { type: Number, default: 0 },
    subsections: { type: [subsectionSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Section", sectionSchema);