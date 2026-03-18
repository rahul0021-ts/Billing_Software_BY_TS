const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Bill = require("../models/Bill");
const { verifyToken } = require("../middleware/auth");

// POST /api/whatsapp/send
router.post(
  "/send",
  verifyToken,
  [
    body("phone").notEmpty().withMessage("Phone number is required"),
    body("billText").notEmpty().withMessage("Bill text is required"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "ValidationError", message: errors.array()[0].msg });
      }

      const { phone, billText, billId } = req.body;

      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM;

      if (!sid || sid.startsWith("AC_placeholder") || sid === "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" || !token || !from) {
        return res.status(503).json({
          error: "ServiceUnavailable",
          message: "Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in your .env file.",
        });
      }

      let twilioClient;
      try {
        const twilio = require("twilio");
        twilioClient = twilio(sid, token);
      } catch (err) {
        return res.status(503).json({ error: "ServiceUnavailable", message: "Twilio module not available" });
      }

      let message;
      try {
        message = await twilioClient.messages.create({
          from,
          to: `whatsapp:+${phone.replace(/^\+/, "")}`,
          body: billText,
        });
      } catch (twilioErr) {
        return res.status(502).json({
          error: "TwilioError",
          message: twilioErr.message || "Failed to send WhatsApp message",
        });
      }

      if (billId) {
        await Bill.findByIdAndUpdate(billId, { whatsappSent: true });
      }

      return res.json({ success: true, data: { sid: message.sid } });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;