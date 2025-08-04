const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    provider: { type: String, enum: ["d2l", "mayo"], required: true },
    access_token: { type: String, required: true },
    refresh_token: { type: String },
    expires_at: { type: Date, required: true },
  },
  { timestamps: true }
);

tokenSchema.index({ userId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model("Token", tokenSchema);
