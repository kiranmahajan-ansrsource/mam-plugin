const mongoose = require("mongoose");

const imageCacheSchema = new mongoose.Schema({
  imageId: { type: String, required: true, unique: true },
  mayoUrl: { type: String },
  d2lImageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ImageCache", imageCacheSchema);