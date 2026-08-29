const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    name: { type: String, required: true },
    nameHindi: { type: String, default: "" },
    sectionId: { type: String, default: "" },
    size: { type: String, required: true },
    qty: { type: Number, required: true, min: 1, max: 9999 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true },

    customer: {
      name: {
        type: String,
        default: "Walk-in Customer",
      },

      phone: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        default: "",
      },
    },

    items: {
      type: [billItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: "Bill must have at least one item",
      },
    },

    subtotal: { type: Number, required: true },

    discount: {
      type: Number,
      default: 0,
    },

    total: { type: Number, required: true },

    // NEW: how much was actually paid when this bill was created. Can be
    // less than `total` for a partial/credit sale. Defaults to 0 here at
    // the schema level as a safety net, but the bills route always sets
    // this explicitly (to the full total if the cashier didn't specify a
    // partial amount) before the document is created — see routes/bills.js.
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },

    shopName: {
      type: String,
      default: "",
    },

    shopAddress: {
      type: String,
      default: "",
    },

    paymentMethod: {
      type: String,
      default: "cash",
    },

    whatsappSent: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// NEW: how much of THIS bill is still unpaid. This is the per-bill
// figure (e.g. for showing on a receipt: "Total 5000 - Paid 2000 -
// Remaining 3000") — separate from a customer's overall running due
// balance, which also factors in later Payment records made against
// their account (see models/Payment.js + routes/payments.js).
billSchema.virtual("remaining").get(function () {
  return Math.max(0, Math.round(this.total - (this.amountPaid || 0)));
});

billSchema.index({
  isDeleted: 1,
  createdAt: -1,
});
billSchema.index({ "customer.phone": 1 });
billSchema.index({ billNo: 1 }, { unique: true });

billSchema.pre("save", function (next) {
  let subtotal = 0;

  for (const item of this.items) {
    item.amount = Math.round(item.qty * item.rate);
    subtotal += item.amount;
  }

  this.subtotal = Math.round(subtotal);
  this.total = Math.round(this.subtotal - (this.discount || 0));

  next();
});

module.exports = mongoose.model("Bill", billSchema);