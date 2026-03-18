const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    nameHindi: {
      type: String,
      default: "",
      trim: true,
    },
    sectionId: {
      type: String,
      required: [true, "Section ID is required"],
    },
    sizes: {
      type: [String],
      required: [true, "At least one size is required"],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: "Sizes must have at least one element",
      },
    },
    rates: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Rates are required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ sectionId: 1, isActive: 1 });
productSchema.index({ name: "text", nameHindi: "text" });

productSchema.methods.getRateForSize = function (size) {
  if (!this.rates || typeof this.rates !== "object") return 0;
  return this.rates[size] || 0;
};

productSchema.methods.getActiveSizes = function () {
  return this.sizes.filter((size) => {
    const rate = this.rates && this.rates[size];
    return rate !== undefined && rate !== null;
  });
};

module.exports = mongoose.model("Product", productSchema);