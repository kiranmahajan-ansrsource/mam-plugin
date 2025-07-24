const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  orgId: {
    type: String,
    required: true,
    unique: true,
  },
  name: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Organization", organizationSchema);
