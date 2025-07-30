const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    orgId: {
      type: String,
      required: true,
      unique: true,
    },
    name: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);
